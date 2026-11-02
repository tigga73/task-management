import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { publicProcedure, router } from "../trpc";

export type Task = {
  id: string;
  titulo: string;
  descricao?: string;
  // Unix timestamp in ms: survives JSON as-is, so no transformer (superjson) is needed.
  dataCriacao: number;
};

// Next.js loads this module separately for pages and API routes (and again on
// hot reload), so the store lives on globalThis to be shared between them.
const globalForTasks = globalThis as { tasks?: Map<string, Task> };
const tasks = (globalForTasks.tasks ??= new Map<string, Task>());

const taskInput = z.object({
  titulo: z
    .string({ error: "O título é obrigatório" })
    .trim()
    .min(1, "O título é obrigatório"),
  descricao: z.string().trim().optional(),
});

const idInput = z.object({ id: z.string() });

function findTask(id: string) {
  const task = tasks.get(id);
  if (!task) {
    throw new TRPCError({
      code: "NOT_FOUND",
      message: `Tarefa com id "${id}" não encontrada`,
    });
  }
  return task;
}

export const taskRouter = router({
  // Offset-based cursor: the simplest option for an in-memory list. Shifts
  // caused by deletes are harmless because the client refetches all loaded
  // pages from the start after every mutation.
  list: publicProcedure
    .input(
      z.object({
        limit: z.number().int().min(1).max(50).default(10),
        cursor: z.number().int().min(0).nullish(),
      }),
    )
    .query(({ input: { limit, cursor } }) => {
      const start = cursor ?? 0;
      const all = Array.from(tasks.values()).reverse(); // newest first
      const end = start + limit;
      return {
        items: all.slice(start, end),
        nextCursor: end < all.length ? end : null,
      };
    }),

  byId: publicProcedure.input(idInput).query(({ input }) => findTask(input.id)),

  create: publicProcedure.input(taskInput).mutation(({ input }) => {
    const task: Task = {
      id: crypto.randomUUID(),
      ...input,
      dataCriacao: Date.now(),
    };
    tasks.set(task.id, task);
    return task;
  }),

  update: publicProcedure
    .input(taskInput.partial().extend(idInput.shape))
    .mutation(({ input: { id, titulo, descricao } }) => {
      const current = findTask(id);
      const task = {
        ...current,
        titulo: titulo ?? current.titulo,
        descricao: descricao ?? current.descricao,
      };
      tasks.set(id, task);
      return task;
    }),

  delete: publicProcedure.input(idInput).mutation(({ input }) => {
    const task = findTask(input.id);
    tasks.delete(input.id);
    return task;
  }),
});
