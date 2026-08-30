/**
 * Client for the flight notifier API (AWS API Gateway -> Lambda).
 *
 * The browser holds NO AWS credentials: it only POSTs to this HTTP API, and
 * the Lambdas behind it are the only things that touch DynamoDB.
 */

// Not a secret — a public HTTP API endpoint. Override per-environment with
// VITE_FLIGHT_API_URL if the API is ever recreated.
const DEFAULT_API_BASE = "https://vhfxysyugh.execute-api.us-east-1.amazonaws.com";

export const API_BASE: string =
  import.meta.env["VITE_FLIGHT_API_URL"] || DEFAULT_API_BASE;

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
};

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
  const res = await fetch(
    `${API_BASE}/subscriptions?email=${encodeURIComponent(email)}`,
  );
  if (!res.ok) throw new Error(await readError(res));
  const body = (await res.json()) as { subscriptions?: Subscription[] };
  return body.subscriptions ?? [];
}

export async function saveSubscription(input: {
  email: string;
  plan_name: PlanName;
  target_price: number;
}): Promise<{ route: string; target_price: number; updated: boolean }> {
  const res = await fetch(`${API_BASE}/subscribe`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) throw new Error(await readError(res));
  return (await res.json()) as {
    route: string;
    target_price: number;
    updated: boolean;
  };
}

export function formatTwd(n: number): string {
  return `NT$${n.toLocaleString("en-US")}`;
}
