import { createApiClient, createQueryClient } from "@grimo/client";

export const api = createApiClient({ baseUrl: window.location.origin });
export const queryClient = createQueryClient();
