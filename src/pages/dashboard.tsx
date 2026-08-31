import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plane, LogOut, Loader2, BellRing, Check, CreditCard, Clock, XCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePageMeta } from "@/lib/page-meta";
import {
  MONTHLY_PRICE_TWD,
  PLANS,
  cancelSubscription,
  formatTwd,
  listSubscriptions,
  saveSubscription,
  statusOf,
  type Plan,
  type Subscription,
} from "@/lib/flight-api";

type SaveState = { pending: boolean; error: string | null };

/** How each lifecycle state presents on a card. */
const STATUS_BADGE = {
  active: { label: "已訂閱（有效）", icon: Check, tone: "bg-accent text-accent-foreground" },
  pending_payment: { label: "未完成付款", icon: Clock, tone: "bg-amber-500/15 text-amber-300" },
  cancelled: { label: "已取消", icon: Clock, tone: "bg-secondary text-secondary-foreground" },
  expired: { label: "已結束", icon: XCircle, tone: "bg-secondary text-muted-foreground" },
} as const;

export default function DashboardPage() {
  usePageMeta("Your watchlist — FareDrop", [
    { name: "description", content: "Your FareDrop route watchlist and price alerts." },
    { name: "robots", content: "noindex" },
  ]);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  // ECPay returns the browser here through a redirect Lambda, which appends
  // ?purchase=success|failed. The row itself is activated by the server-to-
  // server callback, never by this page, so all we do is say what happened.
  const purchase = new URLSearchParams(window.location.search).get("purchase");

  const email = user?.email ?? "";
  const [subs, setSubs] = useState<Subscription[] | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    if (!email) return;
    let active = true;
    setLoadError(null);
    listSubscriptions(email)
      .then((rows) => {
        if (active) setSubs(rows);
      })
      .catch((err: unknown) => {
        if (!active) return;
        setSubs([]);
        setLoadError(err instanceof Error ? err.message : "無法載入訂閱狀態");
      });
    return () => {
      active = false;
    };
  }, [email]);

  const byRoute = useMemo(() => {
    const map = new Map<string, Subscription>();
    for (const s of subs ?? []) map.set(s.route, s);
    return map;
  }, [subs]);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  function upsertLocal(next: Subscription) {
    setSubs((prev) => {
      const rest = (prev ?? []).filter((s) => s.route !== next.route);
      return [...rest, next];
    });
  }

  return (
    <div className="night-sky flex min-h-screen flex-col bg-background text-foreground">
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Plane className="size-4.5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">FareDrop</span>
          </div>
          <button
            onClick={handleSignOut}
            disabled={signingOut}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-secondary/50 px-4 py-2 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary disabled:opacity-60"
          >
            {signingOut ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <LogOut className="size-4" />
            )}
            Sign out
          </button>
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-6 py-16">
        <div className="animate-fade-up">
          <h1 className="text-3xl font-bold tracking-tight">Hi {email}</h1>
          <p className="mt-2 text-muted-foreground">
            選一條航線、設定你的目標價，降到目標價時我們就寄信通知你。月費{" "}
            {formatTwd(MONTHLY_PRICE_TWD)}，隨時可以取消。
          </p>
        </div>

        {purchase === "success" ? (
          <p className="animate-fade-up mt-6 rounded-lg border border-primary/40 bg-primary/10 px-4 py-3 text-sm">
            付款完成，謝謝訂閱！狀態會在綠界通知我們後更新（通常幾秒內）—
            重新整理即可看到「已訂閱」。
          </p>
        ) : null}
        {purchase === "failed" ? (
          <p className="animate-fade-up mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            這次付款沒有完成，你可以在下面的卡片按「完成付款」再試一次。
          </p>
        ) : null}

        {loadError ? (
          <p className="animate-fade-up mt-6 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {loadError}
          </p>
        ) : null}

        <div className="animate-fade-up-delay-1 mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.name}
              plan={plan}
              email={email}
              subscription={byRoute.get(plan.route) ?? null}
              loading={subs === null}
              onSaved={upsertLocal}
            />
          ))}
        </div>
      </main>
    </div>
  );
}

function PlanCard({
  plan,
  email,
  subscription,
  loading,
  onSaved,
}: {
  plan: Plan;
  email: string;
  subscription: Subscription | null;
  loading: boolean;
  onSaved: (s: Subscription) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState("");
  const [state, setState] = useState<SaveState>({ pending: false, error: null });

  const status = statusOf(subscription);
  // Only a paid route can be edited in place; anything else has to go through
  // the cashier, so the form doubles as the checkout trigger.
  const isPaid = status === "active" || status === "cancelled";
  const showForm = subscription === null || status === "expired" || editing;
  const badge = status ? STATUS_BADGE[status] : null;

  async function save(target: number) {
    setState({ pending: true, error: null });
    try {
      const saved = await saveSubscription({
        email,
        plan_name: plan.name,
        target_price: target,
      });
      // "checkout" means the document has been replaced and the browser is on
      // its way to ECPay — there is no state left to update here.
      if (saved.kind === "checkout") return;
      const now = new Date().toISOString();
      onSaved({
        ...(subscription ?? {
          email,
          route: saved.route,
          plan_name: plan.name,
          origin: plan.origin,
          destination: plan.destination,
          currency: "TWD",
          created_at: now,
        }),
        email,
        route: saved.route,
        plan_name: plan.name,
        origin: plan.origin,
        destination: plan.destination,
        target_price: saved.target_price,
        currency: "TWD",
        created_at: subscription?.created_at ?? now,
        updated_at: now,
        subscription_status: saved.subscription_status,
      });
      setEditing(false);
      setValue("");
      setState({ pending: false, error: null });
    } catch (err: unknown) {
      setState({
        pending: false,
        error: err instanceof Error ? err.message : "儲存失敗，請再試一次",
      });
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const target = Number(value);
    if (!Number.isFinite(target) || target <= 0) {
      setState({ pending: false, error: "請輸入大於 0 的目標價" });
      return;
    }
    await save(target);
  }

  async function cancel() {
    if (!subscription) return;
    setState({ pending: true, error: null });
    try {
      const res = await cancelSubscription({ email, route: subscription.route });
      const paidThrough = res.current_period_end_date ?? subscription.current_period_end_date;
      onSaved({
        ...subscription,
        subscription_status: res.subscription_status,
        ...(paidThrough ? { current_period_end_date: paidThrough } : {}),
      });
      setState({ pending: false, error: null });
    } catch (err: unknown) {
      setState({
        pending: false,
        error: err instanceof Error ? err.message : "取消失敗，請再試一次",
      });
    }
  }

  return (
    <div className="cloud-card flex flex-col rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-card-foreground">
            {plan.label}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">近期最低約 {formatTwd(plan.hint)}</p>
        </div>
        {badge ? (
          <span
            className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium ${badge.tone}`}
          >
            <badge.icon className="size-3.5" />
            {badge.label}
          </span>
        ) : null}
      </div>

      {loading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          載入中…
        </p>
      ) : (
        <>
          {subscription !== null ? (
            <p className="mt-6 text-sm text-muted-foreground">
              目前目標價{" "}
              <span className="font-semibold text-card-foreground">
                {formatTwd(subscription.target_price)}
              </span>
            </p>
          ) : null}

          {status === "cancelled" ? (
            <p className="mt-2 text-sm text-muted-foreground">
              已取消續訂
              {subscription?.current_period_end_date
                ? `，${subscription.current_period_end_date} 前仍會通知你`
                : "，本期結束前仍會通知你"}
              。
            </p>
          ) : null}

          {status === "pending_payment" ? (
            <p className="mt-2 text-sm text-muted-foreground">
              完成付款後才會開始追蹤這條航線。月費 {formatTwd(MONTHLY_PRICE_TWD)}。
            </p>
          ) : null}

          {state.error ? <p className="mt-3 text-sm text-destructive">{state.error}</p> : null}

          {showForm ? (
            <form onSubmit={submit} className="mt-4 flex flex-col gap-3">
              <label
                className="text-sm font-medium text-card-foreground"
                htmlFor={`target-${plan.name}`}
              >
                目標價（TWD）
              </label>
              <input
                id={`target-${plan.name}`}
                type="number"
                inputMode="numeric"
                min={1}
                step={1}
                required
                placeholder={String(plan.hint)}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={state.pending}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {state.pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : isPaid ? (
                    <BellRing className="size-4" />
                  ) : (
                    <CreditCard className="size-4" />
                  )}
                  {isPaid ? "儲存新目標價" : `訂閱並付款 · ${formatTwd(MONTHLY_PRICE_TWD)}/月`}
                </button>
                {editing ? (
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setState({ pending: false, error: null });
                    }}
                    className="rounded-md border border-border px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary"
                  >
                    取消
                  </button>
                ) : null}
              </div>
            </form>
          ) : (
            <div className="mt-4 flex flex-col gap-2">
              {status === "pending_payment" ? (
                <button
                  type="button"
                  disabled={state.pending}
                  onClick={() => save(subscription?.target_price ?? plan.hint)}
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {state.pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <CreditCard className="size-4" />
                  )}
                  完成付款
                </button>
              ) : null}

              <button
                type="button"
                onClick={() => {
                  setValue(String(subscription?.target_price ?? plan.hint));
                  setEditing(true);
                }}
                className="inline-flex items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-secondary"
              >
                更新目標價
              </button>

              {status === "active" ? (
                <button
                  type="button"
                  disabled={state.pending}
                  onClick={cancel}
                  className="inline-flex items-center justify-center rounded-md px-4 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:text-destructive disabled:opacity-60"
                >
                  {state.pending ? "處理中…" : "取消訂閱"}
                </button>
              ) : null}
            </div>
          )}
        </>
      )}
    </div>
  );
}
