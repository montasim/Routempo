import { z } from "zod"

export const appSearchSchema = z.object({
  demo: z
    .union([
      z.boolean(),
      z.literal(1).transform(() => true),
      z.literal("1").transform(() => true),
    ])
    .optional(),
})
