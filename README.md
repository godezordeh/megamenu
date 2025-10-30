# Backend (Cway Pay - PIX)

## Passos

1. Copie `.env.example` para `.env` e preencha:
```
CWAY_BASE_URL=https://app.cwaypay.com.br/api/v1
CWAY_PUBLIC_KEY=SEU_PUBLIC_KEY
CWAY_SECRET_KEY=SEU_SECRET_KEY
PUBLIC_BACKEND_URL=https://seu-dominio.com
WEBHOOK_TOKEN_VALIDATION=token_do_webhook
FRONTEND_ORIGIN=http://localhost:5173
PORT=3333
```

2. Instale deps:
```
npm i
```

3. Rode local:
```
npm run dev
```

Rotas:
- `POST /create-payment` -> cria cobrança PIX na Cway
- `GET /status?id=...` ou `GET /status?clientIdentifier=...` -> consulta transação
- `POST /webhook` -> receba notificações (configure no painel ou enviando `callbackUrl` ao criar a cobrança)
