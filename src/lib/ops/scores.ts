import { createServerFn } from "@tanstack/react-start";
import { authMiddleware } from "@/lib/auth/middleware";
import { getSql } from "@/lib/db";
import { z } from "zod";

const runSchema = z.object({
  theaterId: z.string(),
  difficultyId: z.string(),
  side: z.string(),
  won: z.boolean(),
  durationS: z.number(),
  damage: z.number(),
});

export const saveRun = createServerFn({ method: "POST" })
  .middleware([authMiddleware])
  .validator((d: unknown) => runSchema.parse(d))
  .handler(async ({ context, data }) => {
    const sql = await getSql();
    await sql`insert into ops_runs (user_id, theater_id, difficulty_id, side, won, duration_s, damage)
      values (${context.userId}, ${data.theaterId}, ${data.difficultyId}, ${data.side}, ${data.won}, ${Math.round(data.durationS)}, ${Math.round(data.damage)})`;
  });
