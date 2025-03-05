import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "./integrations/supabase/client";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import Statistics from "./pages/Statistics";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { HabitsProvider } from "./contexts/HabitsContext";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthenticated(!!session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isAuthenticated === null) {
    return null; // Or a loading spinner
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          {isAuthenticated ? (
            <HabitsProvider>
              <Routes>
                <Route
                  path="/"
                  element={<Index />}
                />
                <Route
                  path="/settings"
                  element={<Settings />}
                />
                <Route
                  path="/statistics"
                  element={<Statistics />}
                />
                <Route
                  path="/auth"
                  element={<Navigate to="/" replace />}
                />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </HabitsProvider>
          ) : (
            <Routes>
              <Route
                path="/auth"
                element={<Auth />}
              />
              <Route
                path="*"
                element={<Navigate to="/auth" replace />}
              />
            </Routes>
          )}
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
