import { useQueryClient } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

import { supabase } from "@/integrations/supabase/client";

type AuthState = {
  user: User | null;
  /** True until the initial session check resolves. */
  loading: boolean;
};

const AuthContext = createContext<AuthState>({ user: null, loading: true });

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AuthState>({ user: null, loading: true });

  useEffect(() => {
    let active = true;

    // Server-validated check on boot, matching the old route `beforeLoad` guard.
    void supabase.auth.getUser().then(({ data, error }) => {
      if (!active) return;
      setState({ user: error ? null : data.user, loading: false });
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "USER_UPDATED") return;
      setState({ user: session?.user ?? null, loading: false });
      if (event !== "SIGNED_OUT") queryClient.invalidateQueries();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [queryClient]);

  return <AuthContext.Provider value={state}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  return useContext(AuthContext);
}
