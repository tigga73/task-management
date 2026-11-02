import { TaskForm } from "@/components/task-form";

export default function NewTaskPage() {
  return (
    <>
      <h1 className="mb-6 text-2xl font-semibold">Nova tarefa</h1>
      <TaskForm />
    </>
  );
}
