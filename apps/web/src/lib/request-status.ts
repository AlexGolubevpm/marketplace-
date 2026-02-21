/** Customer-facing request status styles for badges */
export const requestStatusConfig: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: "Черновик", color: "text-gray-500", bg: "bg-gray-100" },
  new: { label: "Новая", color: "text-blue-400", bg: "bg-blue-500/10" },
  matching: { label: "Ищем карго...", color: "text-indigo-400", bg: "bg-indigo-500/10" },
  offers_received: { label: "Есть офферы", color: "text-yellow-400", bg: "bg-yellow-500/10" },
  offer_selected: { label: "Оффер выбран", color: "text-purple-400", bg: "bg-purple-500/10" },
  in_transit: { label: "В доставке", color: "text-cyan-400", bg: "bg-cyan-500/10" },
  completed: { label: "Завершено", color: "text-green-400", bg: "bg-green-500/10" },
  cancelled: { label: "Отменено", color: "text-red-400", bg: "bg-red-500/10" },
  expired: { label: "Истекла", color: "text-orange-400", bg: "bg-orange-500/10" },
};

/** Statuses considered "archived" (no longer active) */
export const archivedStatuses = ["offer_selected", "completed", "cancelled", "expired"];

/** Statuses considered "active" */
export const activeStatuses = (status: string) =>
  !["cancelled", "completed", "expired"].includes(status);
