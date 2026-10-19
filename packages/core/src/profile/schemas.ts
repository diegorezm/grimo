import { z } from "zod";
import { GENRES } from "../books/genres";
import { cursorQuerySchema } from "../lib/pagination";

export const USERNAME_REGEX = /^[a-z0-9_.]{3,30}$/;

export const updateProfileSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  bio: z.string().trim().max(280).nullable().optional(),
  favoriteGenres: z.array(z.enum(GENRES)).max(5).optional(),
  /** Reading goal (number of books) for the current year. */
  yearlyGoal: z.number().int().min(1).max(1000).nullable().optional(),
});
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

/** Reader search (`GET /users?q=`): matches name or username. Paginated by cursor. */
export const searchReadersSchema = cursorQuerySchema.extend({
  q: z.string().trim().min(1).max(60),
});
export type SearchReadersInput = z.infer<typeof searchReadersSchema>;
