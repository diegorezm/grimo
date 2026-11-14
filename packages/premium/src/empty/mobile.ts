import type { PremiumPlatform } from "../types";

/** No paid content: the private repository is not checked out. */
export const platform: PremiumPlatform<never, never, never, never> = {
  models: {},
  backPatterns: {},
  finishes: {},
  lights: {},
  cards: {},
};
