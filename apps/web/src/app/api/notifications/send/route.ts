import { NextRequest, NextResponse } from "next/server";
import {
  notifyRequestStatusChanged,
  notifyNewOffer,
  notifyOrderStatusChanged,
  notifyNewMessage,
  notifyCarrierNewRequest,
} from "@/lib/telegram-notify";

/**
 * POST /api/notifications/send
 * Internal API for triggering Telegram notifications.
 * Called from tRPC mutations after status changes.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { type, ...params } = body;

    let success = false;

    switch (type) {
      case "request_status_changed":
        success = await notifyRequestStatusChanged(params);
        break;
      case "new_offer":
        success = await notifyNewOffer(params);
        break;
      case "order_status_changed":
        success = await notifyOrderStatusChanged(params);
        break;
      case "new_message":
        success = await notifyNewMessage(params);
        break;
      case "carrier_new_request":
        success = await notifyCarrierNewRequest(params);
        break;
      default:
        return NextResponse.json({ error: "Unknown notification type" }, { status: 400 });
    }

    return NextResponse.json({ success });
  } catch (error: any) {
    console.error("[Notifications API] Error:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
