import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

// Lazy Load heavy pages (Code Splitting)
const Settings = lazy(() => import("./pages/Settings"));
const FanClubPage = lazy(() => import("./pages/FanClub"));
const BiographyPage = lazy(() => import("./pages/Biography"));

const queryClient = new QueryClient();

const PageLoader = () => (
  <div className="h-screen w-screen flex items-center justify-center bg-deep-black">
    <Loader2 className="w-10 h-10 text-golden animate-spin" />
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/fanclub" element={<FanClubPage />} />
            <Route path="/biography" element={<BiographyPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
