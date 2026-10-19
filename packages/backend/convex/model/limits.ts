/**
 * Lists load by growing `limit` (20, 40, 60…) instead of cursors: one reactive query per list,
 * so new items appear live and the persisted cache holds the whole visible list.
 */
export const MAX_LIST_LIMIT = 200;

export const listLimit = (limit: number) =>
  Number.isFinite(limit) ? Math.min(MAX_LIST_LIMIT, Math.max(1, Math.floor(limit))) : 20;
