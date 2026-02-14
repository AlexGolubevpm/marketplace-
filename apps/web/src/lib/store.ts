// ============================================
// Types
// ============================================
export interface Request {
  id: string;
  display_id: string;
  customer_id: string;
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  cargo_description: string;
  weight_kg: string;
  volume_m3: string;
  cargo_type: string;
  delivery_type_preferred: string;
  budget_min: string;
  budget_max: string;
  status: RequestStatus;
  offer_count: number;
  source: string;
  created_at: string;
  updated_at: string;
}

export type RequestStatus =
  | "draft"
  | "new"
  | "matching"
  | "offers_received"
  | "offer_selected"
  | "in_transit"
  | "completed"
  | "cancelled"
  | "expired";

export interface Offer {
  id: string;
  display_id: string;
  request_id: string;
  carrier_id: string;
  carrier_name: string;
  price: number;
  currency: string;
  estimated_days_min: number;
  estimated_days_max: number;
  delivery_type: string;
  conditions: string;
  includes: string[];
  status: "active" | "selected" | "rejected" | "expired";
  response_time: string;
  rating: number;
  created_at: string;
}

export interface Order {
  id: string;
  display_id: string;
  request_id: string;
  offer_id: string;
  carrier_name: string;
  price: number;
  currency: string;
  status: string;
  tracking_number: string;
  timeline: { status: string; date: string; active: boolean }[];
  created_at: string;
}

// ============================================
// ID generation (lazy — safe for SSR)
// ============================================
function getCounter(key: string): number {
  if (typeof window === "undefined") return 0;
  return parseInt(localStorage.getItem(key) || "0");
}

function incCounter(key: string): number {
  const val = getCounter(key) + 1;
  localStorage.setItem(key, String(val));
  return val;
}

function nextReqId(): string {
  const n = incCounter("cargo_req_counter");
  return `REQ-2026-${String(n).padStart(4, "0")}`;
}

function nextOffId(): string {
  const n = incCounter("cargo_off_counter");
  return `OFF-2026-${String(n).padStart(4, "0")}`;
}

function nextOrdId(): string {
  const n = incCounter("cargo_ord_counter");
  return `ORD-2026-${String(n).padStart(4, "0")}`;
}

function uuid(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) return crypto.randomUUID();
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
  });
}

// ============================================
// Storage helpers
// ============================================
function getAll<T>(key: string): T[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(key) || "[]");
  } catch {
    return [];
  }
}

function setAll<T>(key: string, data: T[]): void {
  localStorage.setItem(key, JSON.stringify(data));
}

// ============================================
// Requests CRUD
// ============================================
const REQ_KEY = "cargo_requests";
const OFF_KEY = "cargo_offers";
const ORD_KEY = "cargo_orders";

export function getRequests(customerId?: string): Request[] {
  const all = getAll<Request>(REQ_KEY);
  if (customerId) return all.filter((r) => r.customer_id === customerId);
  return all;
}

export function getRequestById(id: string): Request | null {
  return getAll<Request>(REQ_KEY).find((r) => r.id === id) || null;
}

export function createRequest(data: {
  customer_id: string;
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  cargo_description: string;
  weight_kg: string;
  volume_m3: string;
  cargo_type?: string;
  delivery_type_preferred?: string;
  budget_min?: string;
  budget_max?: string;
}): Request {
  const now = new Date().toISOString();
  const req: Request = {
    id: uuid(),
    display_id: nextReqId(),
    customer_id: data.customer_id,
    origin_country: data.origin_country,
    origin_city: data.origin_city,
    destination_country: data.destination_country,
    destination_city: data.destination_city,
    cargo_description: data.cargo_description,
    weight_kg: data.weight_kg || "",
    volume_m3: data.volume_m3 || "",
    cargo_type: data.cargo_type || "general",
    delivery_type_preferred: data.delivery_type_preferred || "any",
    budget_min: data.budget_min || "",
    budget_max: data.budget_max || "",
    status: "new",
    offer_count: 0,
    source: "web_form",
    created_at: now,
    updated_at: now,
  };

  const all = getAll<Request>(REQ_KEY);
  all.unshift(req);
  setAll(REQ_KEY, all);

  // Simulate matching: after 2s, generate demo offers
  setTimeout(() => simulateOffers(req.id), 2000);

  return req;
}

export function updateRequestStatus(id: string, status: RequestStatus): void {
  const all = getAll<Request>(REQ_KEY);
  const idx = all.findIndex((r) => r.id === id);
  if (idx >= 0) {
    all[idx].status = status;
    all[idx].updated_at = new Date().toISOString();
    setAll(REQ_KEY, all);
  }
}

export function cancelRequest(id: string): void {
  updateRequestStatus(id, "cancelled");
}

// ============================================
// Offers CRUD
// ============================================
export function getOffersByRequest(requestId: string): Offer[] {
  return getAll<Offer>(OFF_KEY).filter((o) => o.request_id === requestId);
}

export function getAllOffers(): Offer[] {
  return getAll<Offer>(OFF_KEY);
}

export function getOffersByCarrier(carrierId: string): Offer[] {
  return getAll<Offer>(OFF_KEY).filter((o) => o.carrier_id === carrierId);
}

export function createOffer(data: {
  request_id: string;
  carrier_id: string;
  carrier_name: string;
  price: number;
  currency?: string;
  estimated_days_min: number;
  estimated_days_max: number;
  delivery_type: string;
  conditions?: string;
  includes?: string[];
}): Offer {
  const offer: Offer = {
    id: uuid(),
    display_id: nextOffId(),
    request_id: data.request_id,
    carrier_id: data.carrier_id,
    carrier_name: data.carrier_name,
    price: data.price,
    currency: data.currency || "USD",
    estimated_days_min: data.estimated_days_min,
    estimated_days_max: data.estimated_days_max,
    delivery_type: data.delivery_type,
    conditions: data.conditions || "",
    includes: data.includes || [],
    status: "active",
    response_time: `${Math.floor(Math.random() * 120) + 15} мин`,
    rating: Math.round((4 + Math.random()) * 10) / 10,
    created_at: new Date().toISOString(),
  };

  const all = getAll<Offer>(OFF_KEY);
  all.unshift(offer);
  setAll(OFF_KEY, all);

  // Update request offer count and status
  const reqs = getAll<Request>(REQ_KEY);
  const reqIdx = reqs.findIndex((r) => r.id === data.request_id);
  if (reqIdx >= 0) {
    reqs[reqIdx].offer_count = (reqs[reqIdx].offer_count || 0) + 1;
    if (reqs[reqIdx].status === "new" || reqs[reqIdx].status === "matching") {
      reqs[reqIdx].status = "offers_received";
    }
    reqs[reqIdx].updated_at = new Date().toISOString();
    setAll(REQ_KEY, reqs);
  }

  return offer;
}

export function selectOffer(offerId: string): Order | null {
  const offers = getAll<Offer>(OFF_KEY);
  const offerIdx = offers.findIndex((o) => o.id === offerId);
  if (offerIdx < 0) return null;

  const offer = offers[offerIdx];

  // Mark selected
  offers[offerIdx].status = "selected";
  // Reject others for same request
  offers.forEach((o, i) => {
    if (o.request_id === offer.request_id && o.id !== offerId && o.status === "active") {
      offers[i].status = "rejected";
    }
  });
  setAll(OFF_KEY, offers);

  // Update request status
  updateRequestStatus(offer.request_id, "offer_selected");

  // Create order
  const order: Order = {
    id: uuid(),
    display_id: nextOrdId(),
    request_id: offer.request_id,
    offer_id: offer.id,
    carrier_name: offer.carrier_name,
    price: offer.price,
    currency: offer.currency,
    status: "confirmed",
    tracking_number: "",
    timeline: [
      { status: "Оффер выбран", date: new Date().toLocaleDateString("ru-RU"), active: true },
      { status: "Груз передан", date: "", active: false },
      { status: "В пути", date: "", active: false },
      { status: "Таможня", date: "", active: false },
      { status: "Доставлено", date: "", active: false },
    ],
    created_at: new Date().toISOString(),
  };

  const orders = getAll<Order>(ORD_KEY);
  orders.unshift(order);
  setAll(ORD_KEY, orders);

  return order;
}

// ============================================
// Orders
// ============================================
export function getOrders(customerId?: string): Order[] {
  return getAll<Order>(ORD_KEY);
}

// ============================================
// Simulate offers from carriers
// ============================================
const DEMO_CARRIERS = [
  { id: "c1", name: "SilkWay Express" },
  { id: "c2", name: "FastCargo" },
  { id: "c3", name: "RailBridge" },
  { id: "c4", name: "GlobalFreight" },
  { id: "c5", name: "ChinaRoad Logistics" },
];

function simulateOffers(requestId: string) {
  const req = getRequestById(requestId);
  if (!req || req.status === "cancelled") return;

  // Update to matching
  updateRequestStatus(requestId, "matching");

  // Generate 2-4 offers over time
  const count = 2 + Math.floor(Math.random() * 3);
  const carriers = [...DEMO_CARRIERS].sort(() => Math.random() - 0.5).slice(0, count);

  carriers.forEach((carrier, i) => {
    setTimeout(() => {
      const types = ["air", "sea", "rail", "road"];
      const type = types[Math.floor(Math.random() * types.length)];
      const basePrices: Record<string, number> = { air: 7000, sea: 4000, rail: 5000, road: 3500 };
      const baseDays: Record<string, number> = { air: 7, sea: 22, rail: 16, road: 28 };
      const price = Math.round(basePrices[type] * (0.8 + Math.random() * 0.5));
      const daysMin = Math.round(baseDays[type] * (0.8 + Math.random() * 0.3));
      const daysMax = daysMin + Math.round(Math.random() * 5) + 2;

      const allIncludes = ["Забор груза", "Таможня", "До двери", "Страховка", "Упаковка"];
      const inc = allIncludes.filter(() => Math.random() > 0.4);

      createOffer({
        request_id: requestId,
        carrier_id: carrier.id,
        carrier_name: carrier.name,
        price,
        estimated_days_min: daysMin,
        estimated_days_max: daysMax,
        delivery_type: type,
        includes: inc,
      });
    }, (i + 1) * 1500);
  });
}

// ============================================
// Get all requests for carrier view
// ============================================
export function getCarrierRequests(): Request[] {
  return getAll<Request>(REQ_KEY).filter(
    (r) => r.status !== "cancelled" && r.status !== "draft"
  );
}
