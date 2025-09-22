import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import NotFound from "./pages/NotFound";
import Vente from "./pages/Vente";
import Historique from "./pages/Historique";
import Admin from "./pages/Admin";
import { PosProvider } from "@/context/PosStore";
import { Header } from "@/components/Header";
import { MobileNav } from "@/components/MobileNav";
import { InitialSelectionDialog } from "@/components/pos/InitialSelectionDialog";

const queryClient = new QueryClient();

const AppShell = () => (
  <PosProvider>
    <Header />
    <InitialSelectionDialog />
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
