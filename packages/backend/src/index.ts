/**
 * What clients import from the backend: the typed function references (`api.shelves.list`…)
 * and the document id type. Never import server code (convex/*.ts) from clients.
 */
export { api } from "../convex/_generated/api";
export type { Id } from "../convex/_generated/dataModel";
