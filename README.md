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

## Nota de compatibilidade
- O arquivo `src/api/base44Client.js` funciona como adapter de compatibilidade para preservar o código existente no frontend (`base44.auth`, `base44.entities.NotaFiscal`, `base44.integrations.Core.*`) agora apontando para o backend próprio.
