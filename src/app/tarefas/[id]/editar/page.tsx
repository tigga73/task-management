import { notFound } from "next/navigation";
import { TaskForm } from "@/components/task-form";
import { getQueryClient, trpc } from "@/trpc/server";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  // byId only fails with NOT_FOUND.
  const task = await getQueryClient()
    .fetchQuery(trpc.task.byId.queryOptions({ id }))
    .catch(() => notFound());

  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Editar tarefa</h1>
      <TaskForm task={task} />
    </>
  );
}
