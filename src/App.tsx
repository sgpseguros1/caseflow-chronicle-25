import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import DPVATModule from "./pages/DPVATModule";
import CasesListPage from "./pages/CasesListPage";
import ClientsPage from "./pages/ClientsPage";
import ClientFormPage from "./pages/ClientFormPage";
import DPVATFormPage from "./pages/DPVATFormPage";
import INSSFormPage from "./pages/INSSFormPage";
import VidaFormPage from "./pages/VidaFormPage";
import VidaEmpresarialFormPage from "./pages/VidaEmpresarialFormPage";
import DanosFormPage from "./pages/DanosFormPage";
import JudicialFormPage from "./pages/JudicialFormPage";
import FinanceiroFormPage from "./pages/FinanceiroFormPage";
import GestoresPage from "./pages/GestoresPage";
import GestorFormPage from "./pages/GestorFormPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <AppLayout>{children}</AppLayout>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          {/* DPVAT */}
          <Route path="/dpvat" element={<ProtectedRoute><DPVATModule /></ProtectedRoute>} />
          <Route path="/dpvat/novo" element={<ProtectedRoute><DPVATFormPage /></ProtectedRoute>} />
          {/* INSS */}
          <Route path="/inss" element={<ProtectedRoute><CasesListPage caseType="INSS" /></ProtectedRoute>} />
          <Route path="/inss/novo" element={<ProtectedRoute><INSSFormPage /></ProtectedRoute>} />
          {/* Vida */}
          <Route path="/vida" element={<ProtectedRoute><CasesListPage caseType="VIDA" /></ProtectedRoute>} />
          <Route path="/vida/novo" element={<ProtectedRoute><VidaFormPage /></ProtectedRoute>} />
          {/* Vida Empresarial */}
          <Route path="/vida-empresarial" element={<ProtectedRoute><CasesListPage caseType="VIDA_EMPRESARIAL" /></ProtectedRoute>} />
          <Route path="/vida-empresarial/novo" element={<ProtectedRoute><VidaEmpresarialFormPage /></ProtectedRoute>} />
          {/* Danos */}
          <Route path="/danos" element={<ProtectedRoute><CasesListPage caseType="DANOS" /></ProtectedRoute>} />
          <Route path="/danos/novo" element={<ProtectedRoute><DanosFormPage /></ProtectedRoute>} />
          {/* Judicial */}
          <Route path="/judicial" element={<ProtectedRoute><CasesListPage caseType="JUDICIAL" /></ProtectedRoute>} />
          <Route path="/judicial/novo" element={<ProtectedRoute><JudicialFormPage /></ProtectedRoute>} />
          {/* Clientes */}
          <Route path="/clientes" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
          <Route path="/clientes/novo" element={<ProtectedRoute><ClientFormPage /></ProtectedRoute>} />
          {/* Gestores */}
          <Route path="/cadastros/gestores" element={<ProtectedRoute><GestoresPage /></ProtectedRoute>} />
          <Route path="/cadastros/gestores/novo" element={<ProtectedRoute><GestorFormPage /></ProtectedRoute>} />
          <Route path="/cadastros/gestores/:id/editar" element={<ProtectedRoute><GestorFormPage /></ProtectedRoute>} />
          {/* Financeiro */}
          <Route path="/financeiro" element={<ProtectedRoute><div className="text-center py-12"><h1 className="text-2xl font-bold">Financeiro</h1></div></ProtectedRoute>} />
          <Route path="/financeiro/novo" element={<ProtectedRoute><FinanceiroFormPage /></ProtectedRoute>} />
          {/* Outros */}
          <Route path="/arquivos" element={<ProtectedRoute><div className="text-center py-12"><h1 className="text-2xl font-bold">Arquivos</h1><p className="text-muted-foreground">Arquivos são vinculados a clientes e processos</p></div></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><div className="text-center py-12"><h1 className="text-2xl font-bold">Relatórios</h1></div></ProtectedRoute>} />
          <Route path="/configuracoes" element={<ProtectedRoute><div className="text-center py-12"><h1 className="text-2xl font-bold">Configurações</h1></div></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
