import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import NotFound from "./pages/NotFound";
import Vente from "./pages/Vente";
import Historique from "./pages/Historique";
import Admin from "./pages/Admin";
import { PosProvider, usePos } from "@/context/PosStore";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { InitialSelectionDialog } from "@/components/pos/InitialSelectionDialog";
import { NetworkStatus } from "@/components/NetworkStatus";
import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient();

const AppContent = () => {
  const { pathname } = useLocation();
  const { refreshData } = usePos();
  const showInitialSelector = pathname !== "/admin";

  const handleRetry = async () => {
    try {
      await refreshData();
    } catch (error) {
      console.error("Retry failed:", error);
    }
  };

  return (
    <>
      <Header />
      <div className="container mx-auto px-4 py-2">
        <NetworkStatus onRetry={handleRetry} />
      </div>
      {showInitialSelector && <InitialSelectionDialog />}
      <main className="min-h-[calc(100vh-4rem)] pb-16 md:pb-0">
        <Routes>
          <Route path="/" element={<Navigate to="/vente" replace />} />
          <Route path="/vente" element={<Vente />} />
          <Route path="/historique" element={<Historique />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <MobileNav />
    </>
  );
};

const AppShell = () => (
  <PosProvider>
    <AppContent />
  </PosProvider>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AppShell />
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
