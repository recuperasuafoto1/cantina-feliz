import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TemaProvider } from "@/contexts/TemaContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { GlobalCss } from "./components/painel/GlobalCss.tsx";
import Index from "./pages/Index.tsx";
import Painel from "./pages/Painel.tsx";
import Operador from "./pages/Operador.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <GlobalCss />
    <TemaProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pain3l" element={<Painel />} />
              <Route path="/operador" element={<Operador />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </TemaProvider>
  </QueryClientProvider>
);

export default App;
