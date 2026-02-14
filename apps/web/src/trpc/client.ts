"use client";

import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@cargo/api";

export const trpc = createTRPCReact<AppRouter>();
