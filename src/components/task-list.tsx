"use client";

import {
  useInfiniteQuery,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

// Fixed time zone so the server-rendered date matches the one rendered in the browser.
const dateFormat = new Intl.DateTimeFormat("pt-BR", {
  dateStyle: "short",
  timeStyle: "short",
  timeZone: "America/Sao_Paulo",
});

export function TaskList() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const {
    data,
    isPending,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetching,
    isFetchingNextPage,
    isFetchNextPageError,
  } = useInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(
      {},
      { getNextPageParam: (page) => page.nextCursor },
    ),
  );

  const deleteTask = useMutation(
    trpc.task.delete.mutationOptions({
      onSuccess: (task) => toast.success(`Tarefa "${task.titulo}" excluída`),
      onError: (error) => toast.error(error.message),
      onSettled: () =>
        queryClient.invalidateQueries(trpc.task.list.pathFilter()),
    }),
  );

  // Loads the next page when the element after the last task scrolls into view.
  // Paused after a failed page so it doesn't retry in a loop; the user retries instead.
  const sentinelRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetching || isFetchNextPageError) return;

    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && fetchNextPage(),
      { rootMargin: "200px" },
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, isFetchNextPageError, fetchNextPage]);

  if (isPending) return <p className="text-gray-500">Carregando tarefas...</p>;

  if (!data) {
    return (
      <p className="text-red-600">
        Não foi possível carregar as tarefas.{" "}
        <button onClick={() => refetch()} className="underline">
          Tentar novamente
        </button>
      </p>
    );
  }

  const tasks = data.pages.flatMap((page) => page.items);

  if (tasks.length === 0) {
    return <p className="text-gray-500">Nenhuma tarefa cadastrada.</p>;
  }

  return (
    <>
      <ul className="divide-y divide-gray-200 rounded border border-gray-200">
        {tasks.map((task) => {
          const isDeleting =
            deleteTask.isPending && deleteTask.variables.id === task.id;

          return (
            <li key={task.id} className="flex items-start gap-4 p-4">
              <div className="flex-1">
                <h2 className="font-medium">{task.titulo}</h2>
                {task.descricao && (
                  <p className="mt-1 text-sm text-gray-600">
                    {task.descricao}
                  </p>
                )}
                <time className="mt-1 block text-xs text-gray-400">
                  Criada em {dateFormat.format(task.dataCriacao)}
                </time>
              </div>
              <Link
                href={`/tarefas/${task.id}/editar`}
                className="text-sm underline"
              >
                Editar
              </Link>
              <button
                onClick={() => deleteTask.mutate({ id: task.id })}
                disabled={deleteTask.isPending}
                className="text-sm text-red-600 underline disabled:opacity-50"
              >
                {isDeleting ? "Excluindo..." : "Excluir"}
              </button>
            </li>
          );
        })}
      </ul>

      <div ref={sentinelRef} />
      {isFetchingNextPage && (
        <p className="mt-4 text-center text-sm text-gray-500">
          Carregando mais tarefas...
        </p>
      )}
      {isFetchNextPageError && (
        <p className="mt-4 text-center text-sm text-red-600">
          Não foi possível carregar mais tarefas.{" "}
          <button onClick={() => fetchNextPage()} className="underline">
            Tentar novamente
          </button>
        </p>
      )}
    </>
  );
}
