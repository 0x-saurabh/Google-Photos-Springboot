"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { ApiError } from "@/lib/api";

/** A 4xx answer is final (not found, locked, forbidden); only retry network and server failures. */
const isClientError = (error: unknown) =>
  error instanceof ApiError && error.status >= 400 && error.status < 500;

const QueryProvider = ({ children }: { children: ReactNode }) => {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: (failureCount, error) => !isClientError(error) && failureCount < 3,
          },
        },
      }),
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
};

export default QueryProvider;
