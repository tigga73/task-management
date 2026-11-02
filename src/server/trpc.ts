import { initTRPC } from "@trpc/server";
import { z, ZodError } from "zod";

const t = initTRPC.create({
  // Sends validation errors per field so the form can show them next to each input.
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError
            ? z.flattenError(error.cause as ZodError<Record<string, unknown>>)
            : null,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;
