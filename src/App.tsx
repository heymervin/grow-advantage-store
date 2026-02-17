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
import ControlDashboard from "./pages/ControlDashboard";
import BulkSnapshotCreate from "./pages/BulkSnapshotCreate";
import GA4Connect from "./pages/GA4Connect";
import GA4Dashboard from "./pages/GA4Dashboard";
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
          <Route path="/control-dashboard" element={<ControlDashboard />} />
          <Route path="/bulk-snapshot-create" element={<BulkSnapshotCreate />} />
          <Route path="/connect" element={<GA4Connect />} />
          <Route path="/ga4" element={<GA4Dashboard />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;