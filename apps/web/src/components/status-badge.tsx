import { Badge } from "@/components/ui/badge";
import {
  requestStatusLabels,
  orderStatusLabels,
  offerStatusLabels,
  carrierStatusLabels,
  customerStatusLabels,
  statusColors,
} from "@cargo/shared";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline" | "success" | "warning" | "danger" | "info" | "purple" | "gray";

const colorToVariant: Record<string, BadgeVariant> = {
  green: "success",
  emerald: "success",
  blue: "info",
  indigo: "info",
  purple: "purple",
  red: "danger",
  orange: "warning",
  yellow: "warning",
  gray: "gray",
};

function getVariant(status: string): BadgeVariant {
  const color = statusColors[status] || "gray";
  return colorToVariant[color] || "secondary";
}

export function StatusBadge({
  status,
  type = "request",
}: {
  status: string;
  type?: "request" | "order" | "offer" | "carrier" | "customer";
}) {
  const labels: Record<string, Record<string, string>> = {
    request: requestStatusLabels,
    order: orderStatusLabels,
    offer: offerStatusLabels,
    carrier: carrierStatusLabels,
    customer: customerStatusLabels,
  };

  const label = labels[type]?.[status] || status;
  const variant = getVariant(status);

  return <Badge variant={variant}>{label}</Badge>;
}
