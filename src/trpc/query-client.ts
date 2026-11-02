import { QueryClient } from "@tanstack/react-query";

export function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      // Avoid refetching right after hydrating data prefetched on the server.
      queries: { staleTime: 30 * 1000 },
    },
  });
}
