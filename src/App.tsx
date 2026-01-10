import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ClientsPage from "./pages/ClientsPage";
import ClientFormPage from "./pages/ClientFormPage";
import ClientViewPage from "./pages/ClientViewPage";
import ClientEditPage from "./pages/ClientEditPage";
import GestoresPage from "./pages/GestoresPage";
import GestorFormPage from "./pages/GestorFormPage";
import AdvogadosPage from "./pages/AdvogadosPage";
import AdvogadoFormPage from "./pages/AdvogadoFormPage";
import SeguradorasPage from "./pages/SeguradorasPage";
import SeguradoraFormPage from "./pages/SeguradoraFormPage";
import PeritosPage from "./pages/PeritosPage";
import PeritoFormPage from "./pages/PeritoFormPage";
import ProcessosPage from "./pages/ProcessosPage";
import ProcessoFormPage from "./pages/ProcessoFormPage";
import FuncionariosPage from "./pages/FuncionariosPage";
import FuncionarioFormPage from "./pages/FuncionarioFormPage";
import CallCenterPage from "./pages/CallCenterPage";
import MetricasDiariasPage from "./pages/MetricasDiariasPage";
import MetricaFormPage from "./pages/MetricaFormPage";
import AlertasPage from "./pages/AlertasPage";
import ComunicacaoPage from "./pages/ComunicacaoPage";
import IAModulePage from "./pages/IAModulePage";
import UsersAdminPage from "./pages/UsersAdminPage";
import NotFound from "./pages/NotFound";
import { Loader2 } from "lucide-react";

const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;
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
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/" element={<ProtectedRoute><Index /></ProtectedRoute>} />
          {/* Cadastros */}
          <Route path="/cadastros/gestores" element={<ProtectedRoute><GestoresPage /></ProtectedRoute>} />
          <Route path="/cadastros/gestores/novo" element={<ProtectedRoute><GestorFormPage /></ProtectedRoute>} />
          <Route path="/cadastros/gestores/:id/editar" element={<ProtectedRoute><GestorFormPage /></ProtectedRoute>} />
          <Route path="/clientes" element={<ProtectedRoute><ClientsPage /></ProtectedRoute>} />
          <Route path="/clientes/novo" element={<ProtectedRoute><ClientFormPage /></ProtectedRoute>} />
          <Route path="/clientes/:id" element={<ProtectedRoute><ClientViewPage /></ProtectedRoute>} />
          <Route path="/clientes/:id/editar" element={<ProtectedRoute><ClientEditPage /></ProtectedRoute>} />
          <Route path="/cadastros/advogados" element={<ProtectedRoute><AdvogadosPage /></ProtectedRoute>} />
          <Route path="/cadastros/advogados/novo" element={<ProtectedRoute><AdvogadoFormPage /></ProtectedRoute>} />
          <Route path="/cadastros/advogados/:id/editar" element={<ProtectedRoute><AdvogadoFormPage /></ProtectedRoute>} />
          <Route path="/cadastros/seguradoras" element={<ProtectedRoute><SeguradorasPage /></ProtectedRoute>} />
          <Route path="/cadastros/seguradoras/novo" element={<ProtectedRoute><SeguradoraFormPage /></ProtectedRoute>} />
          <Route path="/cadastros/seguradoras/:id/editar" element={<ProtectedRoute><SeguradoraFormPage /></ProtectedRoute>} />
          <Route path="/cadastros/peritos" element={<ProtectedRoute><PeritosPage /></ProtectedRoute>} />
          <Route path="/cadastros/peritos/novo" element={<ProtectedRoute><PeritoFormPage /></ProtectedRoute>} />
          <Route path="/cadastros/peritos/:id/editar" element={<ProtectedRoute><PeritoFormPage /></ProtectedRoute>} />
          {/* Processos */}
          <Route path="/processos" element={<ProtectedRoute><ProcessosPage /></ProtectedRoute>} />
          <Route path="/processos/novo" element={<ProtectedRoute><ProcessoFormPage /></ProtectedRoute>} />
          {/* Funcionários */}
          <Route path="/funcionarios" element={<ProtectedRoute><FuncionariosPage /></ProtectedRoute>} />
          <Route path="/funcionarios/novo" element={<ProtectedRoute><FuncionarioFormPage /></ProtectedRoute>} />
          <Route path="/funcionarios/:id/editar" element={<ProtectedRoute><FuncionarioFormPage /></ProtectedRoute>} />
          {/* Call Center */}
          <Route path="/call-center" element={<ProtectedRoute><CallCenterPage /></ProtectedRoute>} />
          {/* Placeholders */}
          <Route path="/calendario" element={<ProtectedRoute><div className="text-center py-12"><h1 className="text-2xl font-bold">Calendário</h1><p className="text-muted-foreground">Em desenvolvimento</p></div></ProtectedRoute>} />
          <Route path="/metricas" element={<ProtectedRoute><MetricasDiariasPage /></ProtectedRoute>} />
          <Route path="/metricas/novo" element={<ProtectedRoute><MetricaFormPage /></ProtectedRoute>} />
          <Route path="/alertas" element={<ProtectedRoute><AlertasPage /></ProtectedRoute>} />
          <Route path="/comunicacao" element={<ProtectedRoute><ComunicacaoPage /></ProtectedRoute>} />
          <Route path="/ia" element={<ProtectedRoute><IAModulePage /></ProtectedRoute>} />
          <Route path="/admin/usuarios" element={<ProtectedRoute><UsersAdminPage /></ProtectedRoute>} />
          <Route path="/relatorios" element={<ProtectedRoute><div className="text-center py-12"><h1 className="text-2xl font-bold">Relatórios</h1><p className="text-muted-foreground">Acesso restrito a administradores</p></div></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
