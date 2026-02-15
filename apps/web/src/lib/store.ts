// ============================================
// API-backed store with localStorage fallback
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
  weight_kg: string | null;
  volume_m3: string | null;
  cargo_type: string | null;
  delivery_type_preferred: string | null;
  budget_min: string | null;
  budget_max: string | null;
  status: string;
  offer_count: number;
  source: string;
  created_at: string;
  updated_at: string;
  offers?: Offer[];
}

export interface Offer {
  id: string;
  display_id: string;
  request_id: string;
  carrier_id: string;
  carrier_name?: string;
  price: number | string;
  currency: string;
  estimated_days: number;
  estimated_days_min?: number;
  estimated_days_max?: number;
  delivery_type: string;
  conditions: string | null;
  includes?: string[];
  status: string;
  response_time?: string;
  rating?: number;
  selected_at?: string | null;
  created_at: string;
}

export interface Order {
  id: string;
  display_id: string;
  request_id: string;
  offer_id: string;
  carrier_name?: string;
  price: number | string;
  currency: string;
  status: string;
  tracking_number?: string | null;
  created_at: string;
}

// ============================================
// API calls
// ============================================
const API = "";

async function api<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API}${url}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || "API error");
  }
  return res.json();
}

// ============================================
// Requests
// ============================================
export async function getRequests(customerId?: string): Promise<Request[]> {
  const params = customerId ? `?customer_id=${customerId}` : "";
  return api<Request[]>(`/api/requests${params}`);
}

export async function getRequestById(id: string): Promise<Request | null> {
  try {
    return await api<Request>(`/api/requests/${id}`);
  } catch {
    return null;
  }
}

export async function createRequest(data: {
  customer_id: string;
  customer_name?: string;
  customer_email?: string;
  origin_country: string;
  origin_city: string;
  destination_country: string;
  destination_city: string;
  cargo_description: string;
  weight_kg?: string;
  volume_m3?: string;
  cargo_type?: string;
  delivery_type_preferred?: string;
}): Promise<Request> {
  return api<Request>("/api/requests", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateRequestStatus(id: string, status: string): Promise<Request> {
  return api<Request>(`/api/requests/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export async function cancelRequest(id: string): Promise<Request> {
  return updateRequestStatus(id, "cancelled");
}

// ============================================
// Offers
// ============================================
export async function getOffersByRequest(requestId: string): Promise<Offer[]> {
  return api<Offer[]>(`/api/offers?request_id=${requestId}`);
}

export async function getOffersByCarrier(carrierId: string): Promise<Offer[]> {
  return api<Offer[]>(`/api/offers?carrier_id=${carrierId}`);
}

export async function createOffer(data: {
  request_id: string;
  carrier_id: string;
  carrier_name: string;
  carrier_email?: string;
  price: number;
  currency?: string;
  estimated_days_min: number;
  estimated_days_max?: number;
  delivery_type: string;
  conditions?: string;
  includes?: string[];
}): Promise<Offer> {
  return api<Offer>("/api/offers", {
    method: "POST",
    body: JSON.stringify({
      ...data,
      estimated_days: data.estimated_days_min,
    }),
  });
}

export async function selectOffer(offerId: string): Promise<Offer> {
  return api<Offer>("/api/offers", {
    method: "PATCH",
    body: JSON.stringify({ offer_id: offerId, action: "select" }),
  });
}

// ============================================
// Carrier view
// ============================================
export async function getCarrierRequests(): Promise<Request[]> {
  const all = await api<Request[]>("/api/requests");
  return all.filter((r) => !["cancelled", "draft"].includes(r.status));
}

// ============================================
// SSE: subscribe to request updates
// ============================================
export function subscribeToRequest(
  requestId: string,
  onEvent: (event: any) => void
): () => void {
  const eventSource = new EventSource(`/api/events?request_id=${requestId}`);

  eventSource.onmessage = (e) => {
    try {
      const data = JSON.parse(e.data);
      onEvent(data);
    } catch {}
  };

  eventSource.onerror = () => {
    // Will auto-reconnect
  };

  return () => eventSource.close();
}
