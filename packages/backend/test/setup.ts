/// <reference types="vite/client" />
import { convexTest } from "convex-test";
import schema from "../convex/schema";

/** Every Convex module, for convex-test. */
export const modules = import.meta.glob("../convex/**/*.ts");

export const newTest = () => convexTest(schema, modules);

/** Creates a reader (as the Better Auth trigger would) and returns a client acting as them. */
export async function reader(t: ReturnType<typeof newTest>, username: string) {
  const id = await t.run((ctx) =>
    ctx.db.insert("users", {
      authId: `auth-${username}`,
      name: username,
      username,
      image: null,
      bio: null,
      favoriteGenres: [],
      followers: 0,
      following: 0,
      bookCount: 0,
      searchText: username,
    }),
  );
  return { id, as: t.withIdentity({ subject: `auth-${username}` }) };
}
