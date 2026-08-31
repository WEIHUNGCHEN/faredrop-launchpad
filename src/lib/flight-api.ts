/**
 * Client for the flight notifier API (AWS API Gateway -> Lambda).
 *
 * The browser holds NO AWS credentials: it only POSTs to this HTTP API, and
 * the Lambdas behind it are the only things that touch DynamoDB.
 */

// Not a secret — a public HTTP API endpoint. Override per-environment with
// VITE_FLIGHT_API_URL if the API is ever recreated.
const DEFAULT_API_BASE = "https://vhfxysyugh.execute-api.us-east-1.amazonaws.com";

export const API_BASE: string = import.meta.env["VITE_FLIGHT_API_URL"] || DEFAULT_API_BASE;

export type PlanName = "tokyo" | "seoul" | "london";

export type Plan = {
  name: PlanName;
  label: string;
  origin: string;
  destination: string;
  route: string;
  /** Recent cheapest fare in TWD, shown as a hint so people pick a sane target. */
  hint: number;
};

export const PLANS: Plan[] = [
  {
    name: "tokyo",
    label: "台北 ✈ 東京",
    origin: "TPE",
    destination: "TYO",
    route: "TPE-TYO",
    hint: 7055,
  },
  {
    name: "seoul",
    label: "台北 ✈ 首爾",
    origin: "TPE",
    destination: "SEL",
    route: "TPE-SEL",
    hint: 4298,
  },
  {
    name: "london",
    label: "台北 ✈ 倫敦",
    origin: "TPE",
    destination: "LON",
    route: "TPE-LON",
    hint: 24473,
  },
];

/** Monthly price, in whole TWD. The Lambdas read it from the flight/ecpay
 * secret; this copy is only what the UI quotes before you reach the cashier. */
export const MONTHLY_PRICE_TWD = 300;

/**
 * Where a subscription is in its life.
 *
 * pending_payment -> active <-> (target updates) -> cancelled (grace) -> expired
 *
 * A row written before M2 has no status at all; the UI treats that the same as
 * pending_payment, so the owner can self-migrate by paying.
 */
export type SubscriptionStatus = "pending_payment" | "active" | "cancelled" | "expired";

export type Subscription = {
  email: string;
  route: string;
  plan_name: PlanName;
  origin: string;
  destination: string;
  target_price: number;
  currency: string;
  created_at: string;
  updated_at: string;
  subscription_status?: SubscriptionStatus;
  /** Paid through this day (YYYY-MM-DD). Present once a charge has landed. */
  current_period_end_date?: string;
  merchant_trade_no?: string;
};

/** What the UI should render for a row, with the legacy case folded in. */
export function statusOf(s: Subscription | null): SubscriptionStatus | null {
  if (!s) return null;
  return s.subscription_status ?? "pending_payment";
}

async function readError(res: Response): Promise<string> {
  try {
    const body = (await res.json()) as { error?: string };
    if (body?.error) return body.error;
  } catch {
    /* fall through to the status text */
  }
  return `請求失敗（${res.status}）`;
}

export async function listSubscriptions(email: string): Promise<Subscription[]> {
  const res = await fetch(`${API_BASE}/subscriptions?email=${encodeURIComponent(email)}`);
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { subscriptions?: Subscription[] };
  return body.subscriptions ?? [];
}

/**
 * The result of POSTing /subscribe.
 *
 * The endpoint answers one of two content types and the caller MUST branch on
 * it: an unpaid route returns an auto-submitting ECPay form as text/html (we
 * hand the document over to it, and the browser leaves for the cashier), while
 * a route that is already paid for returns JSON and is updated in place.
 * Calling res.json() on the HTML is the mistake that makes the button do
 * nothing at all.
 */
export type SaveResult =
  | { kind: "checkout" }
  | {
      kind: "updated";
      route: string;
      target_price: number;
      subscription_status: SubscriptionStatus;
    };

export async function saveSubscription(input: {
  email: string;
  plan_name: PlanName;
  target_price: number;
}): Promise<SaveResult> {
  const res = await fetch(`${API_BASE}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));

  if ((res.headers.get("content-type") ?? "").includes("text/html")) {
    const html = await res.text();
    // Replacing the document runs the form's inline submit script, which POSTs
    // the signed fields to ECPay. Nothing after this point matters.
    document.open();
    document.write(html);
    document.close();
    return { kind: "checkout" };
  }

  const body = (await res.json()) as {
    route: string;
    target_price: number;
    subscription_status: SubscriptionStatus;
  };
  return { kind: "updated", ...body };
}

/**
 * Stop future charges. Service continues until current_period_end_date, so the
 * row comes back as "cancelled", not "expired".
 */
export async function cancelSubscription(input: { email: string; route: string }): Promise<{
  subscription_status: SubscriptionStatus;
  current_period_end_date?: string;
}> {
  const res = await fetch(`${API_BASE}/cancel`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as {
    subscription_status: SubscriptionStatus;
    current_period_end_date?: string;
  };
}

export function formatTwd(n: number): string {
  return `NT$${n.toLocaleString("en-US")}`;
}
