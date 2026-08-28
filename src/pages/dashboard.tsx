import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { Plane, LogOut, BellRing, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { usePageMeta } from "@/lib/page-meta";

export default function DashboardPage() {
  usePageMeta("Your watchlist — FareDrop", [
    { name: "description", content: "Your FareDrop route watchlist and price alerts." },
    { name: "robots", content: "noindex" },
  ]);

  const { user } = useAuth();
  const navigate = useNavigate();
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    await supabase.auth.signOut();
    navigate("/", { replace: true });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">
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
          <h1 className="text-3xl font-bold tracking-tight">Hi {user?.email}</h1>
          <p className="mt-2 text-muted-foreground">Welcome to your FareDrop dashboard.</p>
        </div>

        <div className="animate-fade-up-delay-1 mt-10 flex flex-1 items-start justify-center">
          <div className="flex w-full max-w-lg flex-col items-center rounded-2xl border border-dashed border-border bg-card/50 px-8 py-16 text-center">
            <span className="mb-5 flex size-12 items-center justify-center rounded-xl bg-accent text-accent-foreground">
              <BellRing className="size-5" />
            </span>
            <h2 className="text-lg font-semibold text-card-foreground">
              Your watchlist is coming soon
            </h2>
            <p className="mt-3 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Your watchlist is coming soon. Route tracking and price alerts will be
              added in the next milestone.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
