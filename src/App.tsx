import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import FanClubPage from "./pages/FanClub";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient} data-oid="7jdi_l6">
    <TooltipProvider data-oid="_ra8k2.">
      <Toaster data-oid="hqspojg" />
      <Sonner data-oid="6pr7jn2" />
      <BrowserRouter data-oid="eyu:f8_">
        <Routes data-oid="4rsjtdq">
          <Route
            path="/"
            element={<Index data-oid="lo0:f63" />}
            data-oid="e9yy4-r"
          />

          <Route
            path="/settings"
            element={<Settings data-oid="k4j9f69" />}
            data-oid="u1-i74a"
          />

          <Route
            path="/fanclub"
            element={<FanClubPage data-oid="ld-8aqt" />}
            data-oid="rq4t5.r"
          />

          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route
            path="*"
            element={<NotFound data-oid=".0h5j_7" />}
            data-oid="a6uz_sl"
          />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
