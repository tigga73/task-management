"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { TRPCClientErrorLike } from "@trpc/client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import type { AppRouter } from "@/server/routers/_app";
import type { Task } from "@/server/routers/task";
import { useTRPC } from "@/trpc/client";

export function TaskForm({ task }: { task?: Task }) {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();

  const [titulo, setTitulo] = useState(task?.titulo ?? "");
  const [descricao, setDescricao] = useState(task?.descricao ?? "");
  const [tituloError, setTituloError] = useState<string>();

  const callbacks = {
    onSuccess: async () => {
      toast.success(task ? "Tarefa atualizada" : "Tarefa criada");
      await queryClient.invalidateQueries(trpc.task.pathFilter());
      router.push("/");
    },
    onError: (error: TRPCClientErrorLike<AppRouter>) => {
      const fieldError = error.data?.zodError?.fieldErrors.titulo?.[0];
      if (fieldError) setTituloError(fieldError);
      else toast.error(error.message);
    },
  };
  const createTask = useMutation(trpc.task.create.mutationOptions(callbacks));
  const updateTask = useMutation(trpc.task.update.mutationOptions(callbacks));
  // Stays true after success: router.push doesn't wait for the next page, so
  // the button would be clickable again until the navigation finishes.
  const isSaving =
    createTask.isPending ||
    updateTask.isPending ||
    createTask.isSuccess ||
    updateTask.isSuccess;

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!titulo.trim()) {
      setTituloError("O título é obrigatório");
      return;
    }

    if (task) updateTask.mutate({ id: task.id, titulo, descricao });
    else createTask.mutate({ titulo, descricao });
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="titulo" className="text-sm font-medium">
          Título *
        </label>
        <input
          id="titulo"
          value={titulo}
          onChange={(e) => {
            setTitulo(e.target.value);
            setTituloError(undefined);
          }}
          aria-invalid={!!tituloError}
          aria-describedby={tituloError ? "titulo-error" : undefined}
          className="rounded border border-gray-300 px-3 py-2 aria-invalid:border-red-600"
        />
        {tituloError && (
          <p id="titulo-error" role="alert" className="text-sm text-red-600">
            {tituloError}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="descricao" className="text-sm font-medium">
          Descrição
        </label>
        <textarea
          id="descricao"
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
          className="rounded border border-gray-300 px-3 py-2"
        />
      </div>

      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={isSaving}
          className="rounded bg-foreground px-4 py-2 text-sm text-background disabled:opacity-50"
        >
          {isSaving ? "Salvando..." : "Salvar"}
        </button>
        <Link href="/" className="text-sm underline">
          Cancelar
        </Link>
      </div>
    </form>
  );
}
