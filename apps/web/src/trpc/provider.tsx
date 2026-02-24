"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "./client";
import { SESSION_KEYS } from "@/lib/auth";

function getBaseUrl() {
  if (typeof window !== "undefined") return "";
  return `http://localhost:${process.env.PORT ?? 3000}`;
}

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
          transformer: superjson,
          headers() {
            if (typeof window === "undefined") return {};
            const raw = localStorage.getItem(SESSION_KEYS.ADMIN);
            if (raw) {
              try {
                // Encode to base64 to avoid non-ISO-8859-1 chars in headers (e.g. Cyrillic full_name)
                return { "x-admin-session": btoa(encodeURIComponent(raw)) };
              } catch {
                // Corrupted session — clear and force re-login
                localStorage.removeItem(SESSION_KEYS.ADMIN);
                window.location.href = "/auth/admin";
                return {};
              }
            }
            return {};
          },
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
