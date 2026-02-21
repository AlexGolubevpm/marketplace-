import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { TRPCProvider } from "@/trpc/provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnalyticsScripts } from "@/components/analytics-scripts";

const inter = localFont({
  src: "./fonts/Inter-Variable.woff2",
  weight: "100 900",
  style: "normal",
  variable: "--font-inter",
  fallback: ["system-ui", "Arial", "sans-serif"],
});

export const metadata: Metadata = {
  title: "Cargo Marketplace — Admin",
  description: "Операционный центр управления маркетплейсом грузоперевозок",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body className={inter.className}>
        <AnalyticsScripts />
        <TRPCProvider>
          <TooltipProvider>{children}</TooltipProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
