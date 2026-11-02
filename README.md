# Gerenciador de Tarefas

Aplicação simples de gerenciamento de tarefas em **Next.js 15 (App Router)** com backend **tRPC**. As tarefas ficam em memória.

**Stack:** Next.js 15 · React 19 · tRPC v11 · TanStack Query v5 · Zod v4 · Tailwind CSS v4 · sonner (toasts)

## Como executar

Requer Node.js 20+ e pnpm.

```bash
pnpm install
pnpm dev          # http://localhost:3000
```

Build de produção:

```bash
pnpm build
pnpm start
```

> Os dados ficam em memória: reiniciar o servidor apaga todas as tarefas.

## Funcionalidades

- **Listagem** (`/`): renderizada no servidor (SSR) a cada requisição, com infinite scroll de 10 em 10 tarefas, mais recentes primeiro.
- **Exclusão** direto na listagem, com toast de sucesso ou erro.
- **Criação** (`/tarefas/nova`) e **edição** (`/tarefas/[id]/editar`) usando o mesmo formulário, com validação no cliente e no servidor.
- **Estados de carregamento, sucesso e erro** em todas as operações. Os botões ficam desabilitados durante o envio, e erros do backend aparecem no campo ou em toast.

## Como funciona

Backend e frontend vivem no mesmo app Next.js. O backend é um router tRPC exposto por um Route Handler.

```
Browser ── HTTP ──> /api/trpc/[trpc]/route.ts ──> appRouter (src/server)
                                                    ▲
Server Component (SSR) ── chamada direta ───────────┘
```

- **SSR da listagem:** `src/app/page.tsx` chama o router diretamente, sem HTTP, e faz o prefetch da primeira página. O resultado vai para o cliente via `HydrationBoundary`, então a lista já chega no HTML e o React Query não refaz a busca ao hidratar.
- **No cliente:** os componentes usam `useInfiniteQuery` e `useMutation` com as opções geradas pelo tRPC (`trpc.task.list.infiniteQueryOptions(...)`), tipadas a partir do tipo `AppRouter`, sem gerar código.
- **Após cada mutação** as queries de tarefas são invalidadas, e a lista é recarregada a partir do servidor.

### API (tRPC)

| Procedure     | Tipo     | Input                                   | Erros                     |
| ------------- | -------- | --------------------------------------- | ------------------------- |
| `task.list`   | query    | `{ limit?, cursor? }`                   | —                         |
| `task.byId`   | query    | `{ id }`                                | `NOT_FOUND`               |
| `task.create` | mutation | `{ titulo, descricao? }`                | `BAD_REQUEST` (validação) |
| `task.update` | mutation | `{ id, titulo?, descricao? }` (parcial) | `BAD_REQUEST`, `NOT_FOUND` |
| `task.delete` | mutation | `{ id }`                                | `NOT_FOUND`               |

Tarefa: `{ id, titulo, descricao?, dataCriacao }`. O `id` é um UUID e `dataCriacao` é um timestamp em ms.

### Estrutura

```
src/
├── server/            backend: init do tRPC e routers (store em memória, validação Zod)
├── app/
│   ├── api/trpc/      Route Handler que expõe o router via HTTP
│   ├── page.tsx       listagem (SSR)
│   └── tarefas/       páginas de criação e edição
├── components/        TaskList (infinite scroll, exclusão) e TaskForm
└── trpc/              cliente tRPC/React Query (browser) e proxy para chamadas no servidor
```

## Decisões principais

- **Zod para validação:** os tipos do TypeScript não existem em runtime, e o endpoint aceita qualquer JSON. O mesmo schema valida o input e gera o tipo que chega até o frontend. Erros de validação voltam separados por campo (`zodError.fieldErrors`) para aparecer no formulário.
- **`dataCriacao` como número:** um `Date` vira string em JSON. Com um número, os tipos continuam corretos sem adicionar um transformer como o superjson.
- **Store em `globalThis`:** o Next carrega o módulo do router separadamente para as páginas e para a API (e de novo no hot reload). Sem o `globalThis`, a página SSR e a API teriam listas diferentes.
- **`force-dynamic` na listagem:** sem isso, o Next geraria a página no build (SSG) em vez de renderizar a cada requisição (SSR).
- **Cursor por offset no infinite scroll:** é a opção mais simples para uma lista em memória. Exclusões não causam itens pulados ou duplicados, porque toda mutação invalida a query e o React Query recarrega as páginas desde o início.
- **Update parcial:** só os campos enviados mudam. O `titulo`, se enviado, não pode ser vazio.

## Limitações

- Sem persistência: os dados vivem no processo do servidor e não são compartilhados entre múltiplas instâncias.
- Sem autenticação.
