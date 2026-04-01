# Restitua Frontend

Frontend React + Vite integrado ao backend NestJS local (sem dependência operacional do Base44 para runtime).

## Pré-requisitos
- Node.js 20+
- Backend rodando em `http://localhost:3000` (ou ajuste `VITE_API_BASE_URL`)

## Variáveis de ambiente
Crie `frontend/.env.local`:

```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
```

## Rodando localmente

```bash
npm install
npm run dev
```

## Build

```bash
npm run build
```

## Deploy na Vercel
- O projeto já inclui [`vercel.json`](./vercel.json) com:
  - `buildCommand: npm run build`
  - `outputDirectory: dist`
  - fallback SPA para `index.html` (evita `404 NOT_FOUND` em rotas React Router)
- Em **Project Settings > General**, confirme `Root Directory = frontend` se estiver usando monorepo.
- Em **Project Settings > Environment Variables**, configure:

```env
VITE_API_BASE_URL=https://SEU_BACKEND/api/v1
```

Sem `VITE_API_BASE_URL` absoluto no deploy, o frontend pode tentar chamar `/api/v1` no domínio da Vercel e falhar no login.

## Nota de compatibilidade
- O arquivo `src/api/base44Client.js` funciona como adapter de compatibilidade para preservar o código existente no frontend (`base44.auth`, `base44.entities.NotaFiscal`, `base44.integrations.Core.*`) agora apontando para o backend próprio.
