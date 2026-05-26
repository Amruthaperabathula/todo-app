import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { db, todosTable } from "@workspace/db";
import type { Todo } from "@workspace/db";
import {
  ListTodosQueryParams,
  ListTodosResponse,
  CreateTodoBody,
  GetTodoParams,
  GetTodoResponse,
  UpdateTodoParams,
  UpdateTodoBody,
  UpdateTodoResponse,
  DeleteTodoParams,
  ToggleTodoParams,
  ToggleTodoResponse,
  GetTodoStatsResponse,
} from "@workspace/api-zod";

const router: IRouter = Router();

function serializeTodo(t: Todo) {
  return {
    ...t,
    createdAt: t.createdAt instanceof Date ? t.createdAt.toISOString() : t.createdAt,
    updatedAt: t.updatedAt instanceof Date ? t.updatedAt.toISOString() : t.updatedAt,
  };
}

router.get("/todos/stats", async (req, res): Promise<void> => {
  const all = await db.select().from(todosTable);
  const now = new Date().toISOString().split("T")[0];

  const total = all.length;
  const completed = all.filter((t) => t.completed).length;
  const active = all.filter((t) => !t.completed).length;
  const overdue = all.filter(
    (t) => !t.completed && t.dueDate != null && t.dueDate < now
  ).length;

  const byPriority = {
    low: all.filter((t) => t.priority === "low").length,
    medium: all.filter((t) => t.priority === "medium").length,
    high: all.filter((t) => t.priority === "high").length,
  };

  res.json(GetTodoStatsResponse.parse({ total, completed, active, overdue, byPriority }));
});

router.get("/todos", async (req, res): Promise<void> => {
  const parsed = ListTodosQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { status, priority } = parsed.data;

  let rows = await db.select().from(todosTable).orderBy(todosTable.createdAt);

  if (status === "active") {
    rows = rows.filter((t) => !t.completed);
  } else if (status === "completed") {
    rows = rows.filter((t) => t.completed);
  }

  if (priority) {
    rows = rows.filter((t) => t.priority === priority);
  }

  res.json(ListTodosResponse.parse(rows.map(serializeTodo)));
});

router.post("/todos", async (req, res): Promise<void> => {
  const parsed = CreateTodoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { title, description, priority, dueDate } = parsed.data;

  const [todo] = await db
    .insert(todosTable)
    .values({
      title,
      description: description ?? null,
      priority: priority ?? "medium",
      dueDate: dueDate ?? null,
      completed: false,
    })
    .returning();

  res.status(201).json(GetTodoResponse.parse(serializeTodo(todo)));
});

router.get("/todos/:id", async (req, res): Promise<void> => {
  const params = GetTodoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [todo] = await db
    .select()
    .from(todosTable)
    .where(eq(todosTable.id, params.data.id));

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.json(GetTodoResponse.parse(serializeTodo(todo)));
});

router.patch("/todos/:id/toggle", async (req, res): Promise<void> => {
  const params = ToggleTodoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [existing] = await db
    .select()
    .from(todosTable)
    .where(eq(todosTable.id, params.data.id));

  if (!existing) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  const [todo] = await db
    .update(todosTable)
    .set({ completed: !existing.completed, updatedAt: new Date() })
    .where(eq(todosTable.id, params.data.id))
    .returning();

  res.json(ToggleTodoResponse.parse(serializeTodo(todo!)));
});

router.patch("/todos/:id", async (req, res): Promise<void> => {
  const params = UpdateTodoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const parsed = UpdateTodoBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const updateData: Record<string, unknown> = { updatedAt: new Date() };
  if (parsed.data.title !== undefined) updateData.title = parsed.data.title;
  if (parsed.data.description !== undefined) updateData.description = parsed.data.description;
  if (parsed.data.priority !== undefined) updateData.priority = parsed.data.priority;
  if ("dueDate" in parsed.data) updateData.dueDate = parsed.data.dueDate ?? null;
  if (parsed.data.completed !== undefined) updateData.completed = parsed.data.completed;

  const [todo] = await db
    .update(todosTable)
    .set(updateData)
    .where(eq(todosTable.id, params.data.id))
    .returning();

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.json(UpdateTodoResponse.parse(serializeTodo(todo)));
});

router.delete("/todos/:id", async (req, res): Promise<void> => {
  const params = DeleteTodoParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [todo] = await db
    .delete(todosTable)
    .where(eq(todosTable.id, params.data.id))
    .returning();

  if (!todo) {
    res.status(404).json({ error: "Todo not found" });
    return;
  }

  res.sendStatus(204);
});

export default router;
