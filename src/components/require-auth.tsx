import { Loader2 } from "lucide-react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "@/lib/auth";

/**
 * Client-side guard replacing the `_authenticated` route's `beforeLoad` redirect.
 * Renders nothing but a spinner until the session check resolves, so a signed-in
 * user deep-linking to /app is never bounced to the auth page.
 */
export function RequireAuth() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="size-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) return <Navigate to="/sign-in" replace state={{ from: location.pathname }} />;

  return <Outlet />;
}
