import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Snapshot from "./pages/Snapshot";
import Addons from "./pages/Addons";
import Admin from "./pages/Admin";
import NotFound from "./pages/NotFound";
import PortalNav from "./components/PortalNav";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PortalNav />
        <Routes>
          <Route path="/" element={<Admin />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/snapshot" element={<Snapshot />} />
          <Route path="/addons" element={<Addons />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;