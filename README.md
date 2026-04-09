# Gestrategic - Gestão Hospitalar Inteligente

Sistema completo de gestão hospitalar para UPA Nova Serrana.

## Tecnologias

- **Frontend:** React 18 + TypeScript + Vite
- **UI:** shadcn-ui + Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Estado:** TanStack React Query + Context API

## Como executar localmente

```sh
# Instale as dependências
npm install

# Inicie o servidor de desenvolvimento
npm run dev
```

## Build para produção

```sh
npm run build
```

## Variáveis de ambiente

Crie um arquivo `.env.local` com as seguintes variáveis:

```env
VITE_SUPABASE_URL=sua_url_do_supabase
VITE_SUPABASE_ANON_KEY=sua_chave_anonima
```

Para as Edge Functions que utilizam IA (Gemini), configure no Supabase Dashboard:

```env
GEMINI_API_KEY=sua_chave_api_gemini
```
