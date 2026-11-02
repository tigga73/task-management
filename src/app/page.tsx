import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import Link from "next/link";
import { TaskList } from "@/components/task-list";
import { getQueryClient, trpc } from "@/trpc/server";

// Render on every request (SSR); otherwise Next would prerender the list at build time.
export const dynamic = "force-dynamic";

export default async function Home() {
  const queryClient = getQueryClient();
  // Only the first page is rendered on the server; the rest loads on scroll.
  await queryClient.prefetchInfiniteQuery(
    trpc.task.list.infiniteQueryOptions(
      {},
      { getNextPageParam: (page) => page.nextCursor },
    ),
  );

  return (
    <>
      <header className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tarefas</h1>
        <Link
          href="/tarefas/nova"
          className="rounded bg-foreground px-4 py-2 text-sm text-background"
        >
          Nova tarefa
        </Link>
      </header>
      <HydrationBoundary state={dehydrate(queryClient)}>
        <TaskList />
      </HydrationBoundary>
    </>
  );
}
