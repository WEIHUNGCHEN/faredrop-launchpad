import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Plane, LogOut, Loader2, BellRing, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePageMeta } from "@/lib/page-meta";
import {
  PLANS,
  formatTwd,
  listSubscriptions,
  saveSubscription,
  type Plan,
  type Subscription,
} from "@/lib/flight-api";

type SaveState = { pending: boolean; error: string | null };

export default function DashboardPage() {
  usePageMeta("Your watchlist — FareDrop", [
    { name: "description", content: "Your FareDrop route watchlist and price alerts." },
    { name: "robots", content: "noindex" },
  ]);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

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
            選一條航線、設定你的目標價，降到目標價時我們就寄信通知你。
          </p>
        </div>

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

  const showForm = subscription === null || editing;

  async function submit(e: FormEvent) {
    e.preventDefault();
    const target = Number(value);
    if (!Number.isFinite(target) || target <= 0) {
      setState({ pending: false, error: "請輸入大於 0 的目標價" });
      return;
    }
    setState({ pending: true, error: null });
    try {
      const saved = await saveSubscription({
        email,
        plan_name: plan.name,
        target_price: target,
      });
      const now = new Date().toISOString();
      onSaved({
        email,
        route: saved.route,
        plan_name: plan.name,
        origin: plan.origin,
        destination: plan.destination,
        target_price: saved.target_price,
        currency: "TWD",
        created_at: subscription?.created_at ?? now,
        updated_at: now,
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

  return (
    <div className="cloud-card flex flex-col rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold tracking-tight text-card-foreground">
            {plan.label}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            近期最低約 {formatTwd(plan.hint)}
          </p>
        </div>
        {subscription !== null ? (
          <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
            <Check className="size-3.5" />
            已訂閱
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
              {state.error ? (
                <p className="text-sm text-destructive">{state.error}</p>
              ) : null}
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={state.pending}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {state.pending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <BellRing className="size-4" />
                  )}
                  {subscription !== null ? "儲存新目標價" : "開始追蹤"}
                </button>
                {subscription !== null ? (
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
          ) : subscription !== null ? (
            <button
              type="button"
              onClick={() => {
                setValue(String(subscription.target_price));
                setEditing(true);
              }}
              className="mt-4 inline-flex items-center justify-center rounded-md border border-border px-4 py-2.5 text-sm font-medium text-card-foreground transition-colors hover:bg-secondary"
            >
              更新目標價
            </button>
          ) : null}
        </>
      )}
    </div>
  );
}
