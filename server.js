// server.js
import 'dotenv/config';
import express from 'express';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

const allowedOrigins = [
  'https://megamenu.shop',
  'https://www.megamenu.shop',
  'http://localhost:5173',
];

app.use(
  cors({
    origin: (origin, cb) => {
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
  })
);

app.use(bodyParser.json());

const {
  CWAY_BASE_URL,
  CWAY_PUBLIC_KEY,
  CWAY_SECRET_KEY,
  PUBLIC_BACKEND_URL,
  WEBHOOK_TOKEN_VALIDATION,
  PORT = 3333,
} = process.env;

function authHeaders() {
  if (!CWAY_PUBLIC_KEY || !CWAY_SECRET_KEY) {
    console.warn('[CWAY] Faltam chaves CWAY_PUBLIC_KEY e/ou CWAY_SECRET_KEY no .env');
  }
  return {
    'Content-Type': 'application/json',
    'x-public-key': CWAY_PUBLIC_KEY,
    'x-secret-key': CWAY_SECRET_KEY,
  };
}

app.get('/health', (_req, res) => res.json({ ok: true }));

app.post('/create-payment', async (req, res) => {
  try {
    const incoming = req.body || {};
    const amountNum = Number(incoming.amount);

    const docRaw =
      (incoming.client &&
        (incoming.client.document || incoming.client.cpf || incoming.client.cnpj)) ||
      '';
    const docDigits = String(docRaw).replace(/\D/g, '');
    const isCNPJ = docDigits.length === 14;
    const isCPF = docDigits.length === 11;

    const payload = {
      identifier: incoming.identifier || `ord_${Date.now()}`,
      amount: isNaN(amountNum) ? 0 : amountNum,
      client: {
        identifier: incoming?.client?.identifier || `cust_${Date.now()}`,
        name: incoming?.client?.name || 'Cliente Teste',
        email: incoming?.client?.email || 'cliente@example.com',
        document: docDigits || undefined,
        documentType: isCNPJ ? 'CNPJ' : 'CPF',
        cpf: isCPF ? docDigits : undefined,
        cnpj: isCNPJ ? docDigits : undefined,
        phone: incoming?.client?.phone?.replace?.(/\D/g, '') || '11999999999',
      },
      products:
        Array.isArray(incoming.products) && incoming.products.length > 0
          ? incoming.products.map((p, idx) => ({
              id: String(p.id ?? `sku-${idx + 1}`),
              name: String(p.name ?? `Produto ${idx + 1}`),
              price: Number(p.price ?? (amountNum || 0)),
              quantity: Number(p.quantity ?? 1),
            }))
          : [
              {
                id: 'sku-1',
                name: 'Produto Teste',
                price: amountNum || 0,
                quantity: 1,
              },
            ],
      metadata:
        typeof incoming.metadata === 'string'
          ? incoming.metadata
          : { ...(incoming.metadata || {}), source: 'Site' },
    };

    const resp = await fetch(`${CWAY_BASE_URL}/gateway/pix/receive`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(payload),
    });

    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!resp.ok) {
      console.error('[CWAY] receive ERROR', resp.status, data);
      return res.status(resp.status).json({ error: 'gateway_error', details: data });
    }

    const transactionId = data.transactionId || data.id || data?.transaction?.id;
    let status = data.status || data?.transaction?.status;

    let qrFromPix =
      data?.brCode ||
      data?.pix?.qrCode ||
      data?.pix?.brCode ||
      data?.pixInformation?.qrCode ||
      null;

    if (!qrFromPix && transactionId) {
      try {
        const url = new URL(`${CWAY_BASE_URL}/gateway/transactions`);
        url.searchParams.set('id', transactionId);
        const st = await fetch(url.toString(), {
          method: 'GET',
          headers: authHeaders(),
        });
        const stText = await st.text();
        let stData;
        try {
          stData = JSON.parse(stText);
        } catch {
          stData = { raw: stText };
        }

        qrFromPix =
          stData?.pixInformation?.qrCode ||
          stData?.transaction?.pixInformation?.qrCode ||
          stData?.pix?.qrCode ||
          stData?.pix?.brCode ||
          null;

        if (!status) {
          const stStatus =
            stData?.status || stData?.transaction?.status || stData?.statusDescription;
          if (stStatus) status = stStatus;
        }
      } catch (e) {
        console.warn('[CWAY] fallback status fetch failed:', e.message);
      }
    }

    return res.json({
      success: true,
      transactionId,
      status: status || 'PENDING',
      brCode: qrFromPix,
      pix: { qrCode: qrFromPix },
      raw: data,
    });
  } catch (err) {
    console.error('create-payment error', err);
    return res.status(500).json({ error: 'internal_error', details: err.message });
  }
});

app.get('/status', async (req, res) => {
  try {
    const { id, clientIdentifier } = req.query;
    if (!id && !clientIdentifier) {
      return res.status(400).json({ error: 'id or clientIdentifier is required' });
    }

    const url = new URL(`${CWAY_BASE_URL}/gateway/transactions`);
    if (id) url.searchParams.set('id', id);
    if (clientIdentifier) url.searchParams.set('clientIdentifier', clientIdentifier);

    const resp = await fetch(url.toString(), {
      method: 'GET',
      headers: authHeaders(),
    });
    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }

    if (!resp.ok) {
      console.error('[CWAY] status ERROR', resp.status, data);
      return res.status(resp.status).json({ error: 'gateway_error', details: data });
    }
    return res.json(data);
  } catch (err) {
    console.error('status error', err);
    return res.status(500).json({ error: 'internal_error', details: err.message });
  }
});

app.post('/webhook', (req, res) => {
  const event = req.body;
  const token = event?.token;
  if (WEBHOOK_TOKEN_VALIDATION && token && token !== WEBHOOK_TOKEN_VALIDATION) {
    console.warn('[Webhook] token inválido');
    return res.status(401).send('invalid token');
  }
  console.log('Webhook recebido:', JSON.stringify(event, null, 2));
  res.status(200).send('ok');
});

app.post('/webhook/pix', (req, res) => {
  const tokenHeader = req.headers['x-cway-token'] || req.body?.token;

  if (WEBHOOK_TOKEN_VALIDATION && tokenHeader !== WEBHOOK_TOKEN_VALIDATION) {
    console.log('[WEBHOOK] Token inválido:', tokenHeader);
    return res.status(401).json({ error: 'invalid token' });
  }

  console.log('[WEBHOOK] Payload recebido:', JSON.stringify(req.body, null, 2));
  return res.status(200).json({ ok: true });
});

app.get('/', (req, res) => {
  res.send('✅ Cway backend is running!');
});

app.listen(PORT, () => {
  console.log(`Cway backend on http://localhost:${PORT}`);
});
