import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { RootErrorBoundary } from "@/components/root-error-boundary";
import { RequireAuth } from "@/components/require-auth";
import { AuthProvider } from "@/lib/auth";
import AuthPage from "@/pages/auth";
import DashboardPage from "@/pages/dashboard";
import LandingPage from "@/pages/landing";
import NotFoundPage from "@/pages/not-found";

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <RootErrorBoundary>
            <Routes>
              <Route path="/" element={<LandingPage />} />
              <Route path="/auth" element={<Navigate to="/sign-in" replace />} />
              <Route path="/sign-in" element={<AuthPage initialMode="sign-in" />} />
              <Route path="/sign-up" element={<AuthPage initialMode="sign-up" />} />
              <Route element={<RequireAuth />}>
                <Route path="/app" element={<DashboardPage />} />
              </Route>
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </RootErrorBoundary>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
