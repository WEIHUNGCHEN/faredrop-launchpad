import { Link } from "react-router-dom";
import { Plane, BellRing, LineChart, ArrowRight } from "lucide-react";

import { usePageMeta } from "@/lib/page-meta";

const features = [
  {
    icon: Plane,
    title: "全航線比價",
    subtitle: "All-airline price tracking",
    description:
      "Covers major airlines and OTAs across the routes you care about. Prices are refreshed hourly, around the clock.",
  },
  {
    icon: BellRing,
    title: "降價立即通知",
    subtitle: "Instant drop alerts",
    description:
      "Your routes are monitored in the background. The second a fare falls, an email lands in your inbox — no daily checking.",
  },
  {
    icon: LineChart,
    title: "歷史價格曲線",
    subtitle: "Price history charts",
    description:
      "See the seasonal pattern behind every route and know whether today's fare is actually a good deal — or worth waiting on.",
  },
];

export default function LandingPage() {
  usePageMeta("FareDrop — 設定航線，票價一降就通知你", [
    {
      name: "description",
      content:
        "FareDrop watches flight prices on the routes you care about and emails you the moment they drop. Set your route, get an alert the moment the price drops.",
    },
    { property: "og:title", content: "FareDrop — Flight price drop alerts" },
    {
      property: "og:description",
      content:
        "Set your route, get an alert the moment the price drops. FareDrop watches fares so you don't have to.",
    },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary_large_image" },
  ]);

  return (
    <div className="night-sky min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="flex items-center gap-2.5">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Plane className="size-4.5" />
            </span>
            <span className="text-lg font-semibold tracking-tight">FareDrop</span>
          </Link>
          <Link
            to="/sign-in"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/20"
          >
            Sign in / 登入
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="hero-glow relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 pb-28 pt-24 text-center sm:pt-32">
          <p className="animate-fade-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-secondary/60 px-4 py-1.5 text-xs font-medium text-muted-foreground">
            <span className="size-1.5 rounded-full bg-primary" />
            Flight price alerts for frequent travelers
          </p>
          <h1 className="animate-fade-up-delay-1 text-balance text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            設定航線，
            <span className="text-primary">票價一降</span>
            就通知你。
          </h1>
          <p className="animate-fade-up-delay-2 mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            Set your route, get an alert the moment the price drops.
          </p>
          <div className="animate-fade-up-delay-3 mt-10 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/sign-in"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/25"
            >
              Start watching fares
              <ArrowRight className="size-4" />
            </Link>
            <a
              href="#features"
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-6 py-3 text-sm font-medium text-secondary-foreground transition-colors hover:bg-secondary"
            >
              See how it works
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-border/60">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="reveal-on-scroll mb-14 text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Never overpay for a flight again
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Built for frequent travelers, digital nomads, and families planning
              trips — without refreshing fare sites every day.
            </p>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="reveal-on-scroll cloud-card group rounded-2xl border border-border bg-card p-8 transition-colors hover:border-primary/40"
              >
                <div className="mb-5 inline-flex size-11 items-center justify-center rounded-xl bg-accent text-accent-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="size-5" />
                </div>
                <h3 className="text-lg font-semibold text-card-foreground">
                  {feature.title}
                  <span className="ml-2 text-sm font-normal text-muted-foreground">
                    ({feature.subtitle})
                  </span>
                </h3>
                <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/60">
        <div className="mx-auto flex h-20 max-w-6xl items-center justify-center px-6 text-sm text-muted-foreground">
          © 2026 FareDrop
        </div>
      </footer>
    </div>
  );
}
