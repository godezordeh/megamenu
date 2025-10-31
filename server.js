// backend/server.js
import 'dotenv/config';
import express from 'express';
<<<<<<< HEAD
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import cors from 'cors';

const app = express();

// 1) CORS primeiro
const allowedOrigins = [
  'https://megamenu.shop',     // seu domínio na Hostinger
  'https://www.megamenu.shop', // se usar www
  'http://localhost:5173'      // dev
];

app.use(
  cors({
    origin: (origin, cb) => {
      // requisições sem origin (Postman, health) libera
      if (!origin) return cb(null, true);
      if (allowedOrigins.includes(origin)) return cb(null, true);
      return cb(new Error('Not allowed by CORS'));
    },
  })
);

// 2) body parser
app.use(bodyParser.json());

=======
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';

const app = express();
app.use(bodyParser.json());

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || '*'
}));

>>>>>>> da8245251e396ea66d24c1e93401cfc19f860383
const {
  CWAY_BASE_URL,
  CWAY_PUBLIC_KEY,
  CWAY_SECRET_KEY,
  PUBLIC_BACKEND_URL,
  WEBHOOK_TOKEN_VALIDATION,
<<<<<<< HEAD
  PORT = 3333,
=======
  PORT = 3333
>>>>>>> da8245251e396ea66d24c1e93401cfc19f860383
} = process.env;

function authHeaders() {
  if (!CWAY_PUBLIC_KEY || !CWAY_SECRET_KEY) {
    console.warn('[CWAY] Faltam chaves CWAY_PUBLIC_KEY e/ou CWAY_SECRET_KEY no .env');
  }
  return {
    'Content-Type': 'application/json',
    'x-public-key': CWAY_PUBLIC_KEY,
<<<<<<< HEAD
    'x-secret-key': CWAY_SECRET_KEY,
=======
    'x-secret-key': CWAY_SECRET_KEY
>>>>>>> da8245251e396ea66d24c1e93401cfc19f860383
  };
}

// healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

// ===================== CREATE PAYMENT (PIX) =====================
app.post('/create-payment', async (req, res) => {
  try {
    const incoming = req.body || {};
    const amountNum = Number(incoming.amount);

    // documento (CPF/CNPJ) — só dígitos
    const docRaw =
<<<<<<< HEAD
      (incoming.client &&
        (incoming.client.document || incoming.client.cpf || incoming.client.cnpj)) ||
      '';
    const docDigits = String(docRaw).replace(/\D/g, '');
    const isCNPJ = docDigits.length === 14;
    const isCPF = docDigits.length === 11;
=======
      (incoming.client && (incoming.client.document || incoming.client.cpf || incoming.client.cnpj)) || '';
    const docDigits = String(docRaw).replace(/\D/g, '');
    const isCNPJ = docDigits.length === 14;
    const isCPF  = docDigits.length === 11;
>>>>>>> da8245251e396ea66d24c1e93401cfc19f860383

    // PAYLOAD
    const payload = {
      identifier: incoming.identifier || `ord_${Date.now()}`,
      amount: isNaN(amountNum) ? 0 : amountNum,

      client: {
        identifier: incoming?.client?.identifier || `cust_${Date.now()}`,
        name: incoming?.client?.name || 'Cliente Teste',
        email: incoming?.client?.email || 'cliente@example.com',
        document: docDigits || undefined,
        documentType: isCNPJ ? 'CNPJ' : 'CPF',
<<<<<<< HEAD
        cpf: isCPF ? docDigits : undefined,
        cnpj: isCNPJ ? docDigits : undefined,
        phone: incoming?.client?.phone?.replace?.(/\D/g, '') || '11999999999',
        address: incoming?.client?.address || undefined,
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

      shippingFee: incoming.shippingFee == null ? undefined : Number(incoming.shippingFee),
      extraFee: incoming.extraFee == null ? undefined : Number(incoming.extraFee),
      discount: incoming.discount == null ? undefined : Number(incoming.discount),
      dueDate: incoming.dueDate || undefined,

      metadata:
        typeof incoming.metadata === 'string'
          ? incoming.metadata
          : { ...(incoming.metadata || {}), source: 'Site' },

=======
        cpf:  isCPF  ? docDigits : undefined,   // compatibilidade
        cnpj: isCNPJ ? docDigits : undefined,   // compatibilidade
        phone: incoming?.client?.phone?.replace?.(/\D/g, '') || '11999999999',
        address: incoming?.client?.address || undefined
      },

      products: (Array.isArray(incoming.products) && incoming.products.length > 0)
        ? incoming.products.map((p, idx) => ({
            id: String(p.id ?? `sku-${idx + 1}`),
            name: String(p.name ?? `Produto ${idx + 1}`),
            price: Number(p.price ?? (amountNum || 0)),
            quantity: Number(p.quantity ?? 1)
          }))
        : [{
            id: 'sku-1',
            name: 'Produto Teste',
            price: amountNum || 0,
            quantity: 1
          }],

      shippingFee: incoming.shippingFee == null ? undefined : Number(incoming.shippingFee),
      extraFee:    incoming.extraFee    == null ? undefined : Number(incoming.extraFee),
      discount:    incoming.discount    == null ? undefined : Number(incoming.discount),
      dueDate: incoming.dueDate || undefined,

      metadata: (typeof incoming.metadata === 'string')
        ? incoming.metadata
        : { ...(incoming.metadata || {}), source: 'Site' },

      // Em DEV, não enviar callbackUrl (localhost não é alcançável pela Cway).
      // Quando publicar (ou usar ngrok), descomente:
>>>>>>> da8245251e396ea66d24c1e93401cfc19f860383
      // callbackUrl: `${PUBLIC_BACKEND_URL}/webhook`,
    };

    // chamada à Cway
    const resp = await fetch(`${CWAY_BASE_URL}/gateway/pix/receive`, {
      method: 'POST',
      headers: authHeaders(),
<<<<<<< HEAD
      body: JSON.stringify(payload),
=======
      body: JSON.stringify(payload)
>>>>>>> da8245251e396ea66d24c1e93401cfc19f860383
    });

    const text = await resp.text();
    let data;
<<<<<<< HEAD
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
=======
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
>>>>>>> da8245251e396ea66d24c1e93401cfc19f860383

    if (!resp.ok) {
      console.error('[CWAY] receive ERROR', resp.status, data);
      return res.status(resp.status).json({ error: 'gateway_error', details: data });
    }

    // sucesso da criação
<<<<<<< HEAD
    const transactionId = data.transactionId || data.id || data?.transaction?.id;
    let status = data.status || data?.transaction?.status;

    // 1) tenta extrair o BR Code direto da resposta
    let qrFromPix =
      data?.pix?.qrCode || data?.pix?.brCode || data?.pixInformation?.qrCode || null;

    // 2) se não veio, consulta a transação imediatamente
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
      // se quiser ajudar o front antigo:
      pix: { qrCode: qrFromPix },
      raw: data,
    });
=======
const transactionId = data.transactionId || data.id || data?.transaction?.id;
const status        = data.status || data?.transaction?.status;

// 1) tenta extrair o BR Code direto da resposta
let qrFromPix = data?.pix?.qrCode || data?.pix?.brCode || data?.pixInformation?.qrCode || null;

// 2) se não veio, consulta a transação imediatamente para pegar o pixInformation.qrCode
if (!qrFromPix && transactionId) {
  try {
    const url = new URL(`${CWAY_BASE_URL}/gateway/transactions`);
    url.searchParams.set('id', transactionId);
    const st = await fetch(url.toString(), { method: 'GET', headers: authHeaders() });
    const stText = await st.text();
    let stData; try { stData = JSON.parse(stText); } catch { stData = { raw: stText }; }

    // possíveis caminhos
    qrFromPix =
      stData?.pixInformation?.qrCode ||
      stData?.transaction?.pixInformation?.qrCode ||
      stData?.pix?.qrCode ||
      stData?.pix?.brCode ||
      null;

    // atualiza status também (se vier detalhado na consulta)
    if (!status) {
      const stStatus = stData?.status || stData?.transaction?.status || stData?.statusDescription;
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
  brCode: qrFromPix,   // agora deve vir preenchido
  raw: data
});


>>>>>>> da8245251e396ea66d24c1e93401cfc19f860383
  } catch (err) {
    console.error('create-payment error', err);
    return res.status(500).json({ error: 'internal_error', details: err.message });
  }
});

// ===================== STATUS =====================
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
<<<<<<< HEAD
      headers: authHeaders(),
    });
    const text = await resp.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text };
    }
=======
      headers: authHeaders()
    });
    const text = await resp.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { raw: text }; }
>>>>>>> da8245251e396ea66d24c1e93401cfc19f860383

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

// ===================== WEBHOOK =====================
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
<<<<<<< HEAD

// ======================================================
// ROTA DO WEBHOOK DA CWAY
// ======================================================
app.post('/webhook/pix', (req, res) => {
  const tokenHeader = req.headers['x-cway-token'] || req.body?.token;
=======
// ======================================================
// ROTA DO WEBHOOK DA CWAY
// ======================================================
app.post("/webhook/pix", (req, res) => {
  const tokenHeader = req.headers["x-cway-token"] || req.body?.token;
>>>>>>> da8245251e396ea66d24c1e93401cfc19f860383

  if (
    process.env.WEBHOOK_TOKEN_VALIDATION &&
    tokenHeader !== process.env.WEBHOOK_TOKEN_VALIDATION
  ) {
<<<<<<< HEAD
    console.log('[WEBHOOK] Token inválido:', tokenHeader);
    return res.status(401).json({ error: 'invalid token' });
  }

  console.log('[WEBHOOK] Payload recebido:', JSON.stringify(req.body, null, 2));
=======
    console.log("[WEBHOOK] Token inválido:", tokenHeader);
    return res.status(401).json({ error: "invalid token" });
  }

  console.log("[WEBHOOK] Payload recebido:", JSON.stringify(req.body, null, 2));
>>>>>>> da8245251e396ea66d24c1e93401cfc19f860383
  return res.status(200).json({ ok: true });
});

// ======================================================
// ROTA BASE / HEALTHCHECK
// ======================================================
<<<<<<< HEAD
app.get('/', (req, res) => {
  res.send('✅ Cway backend is running!');
=======
app.get("/", (req, res) => {
  res.send("✅ Cway backend is running!");
>>>>>>> da8245251e396ea66d24c1e93401cfc19f860383
});

app.listen(PORT, () => {
  console.log(`Cway backend on http://localhost:${PORT}`);
});
