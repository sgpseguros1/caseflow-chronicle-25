import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth } from "@/hooks/useAuth";
import SessionTracker from "@/components/auth/SessionTracker";
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
import PericiasAgendadasPage from "./pages/PericiasAgendadasPage";
import ProtocolosPage from "./pages/ProtocolosPage";
import ProtocolosDashboardPage from "./pages/ProtocolosDashboardPage";
import ProtocoloViewPage from "./pages/ProtocoloViewPage";
import FuncionariosPage from "./pages/FuncionariosPage";
import FuncionarioFormPage from "./pages/FuncionarioFormPage";
import CallCenterPage from "./pages/CallCenterPage";
import MetricasDiariasPage from "./pages/MetricasDiariasPage";
import MetricaFormPage from "./pages/MetricaFormPage";
import AlertasPage from "./pages/AlertasPage";
import AlertasCriticosPage from "./pages/AlertasCriticosPage";
import BauPainelPage from "./pages/BauPainelPage";
import ComunicacaoPage from "./pages/ComunicacaoPage";
import ComunicacaoEnviarPage from "./pages/ComunicacaoEnviarPage";
import ComunicacaoMassaPage from "./pages/ComunicacaoMassaPage";
import ComunicacaoTemplateFormPage from "./pages/ComunicacaoTemplateFormPage";
import IAModulePage from "./pages/IAModulePage";
import UsersAdminPage from "./pages/UsersAdminPage";
import FinanceiroPainelPage from "./pages/FinanceiroPainelPage";
import FinanceiroFormPage from "./pages/FinanceiroFormPage";
import ControleProcessosPage from "./pages/ControleProcessosPage";
import MonitoramentoOABPage from "./pages/MonitoramentoOABPage";
import PainelTarefasUsuarioPage from "./pages/PainelTarefasUsuarioPage";
import ComunicacaoInternaPage from "./pages/ComunicacaoInternaPage";
import ProcessosJudiciaisPage from "./pages/ProcessosJudiciaisPage";
import ProcessoViewPage from "./pages/ProcessoViewPage";
import RelatoriosPage from "./pages/RelatoriosPage";
import ComissoesPage from "./pages/ComissoesPage";
import PainelGeralPage from "./pages/PainelGeralPage";
import MonitoramentoRealtimePage from "./pages/MonitoramentoRealtimePage";
import MonitoramentoSessoesPage from "./pages/MonitoramentoSessoesPage";
import NotFound from "./pages/NotFound";
import CalendarioPage from "./pages/CalendarioPage";
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
  return (
    <SessionTracker>
      <AppLayout>{children}</AppLayout>
    </SessionTracker>
  );
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
          <Route path="/painel-geral" element={<ProtectedRoute><PainelGeralPage /></ProtectedRoute>} />
          <Route path="/monitoramento" element={<ProtectedRoute><MonitoramentoRealtimePage /></ProtectedRoute>} />
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
          {/* Perícias Agendadas */}
          <Route path="/pericias" element={<ProtectedRoute><PericiasAgendadasPage /></ProtectedRoute>} />
          {/* Protocolos */}
          <Route path="/protocolos" element={<ProtectedRoute><ProtocolosPage /></ProtectedRoute>} />
          <Route path="/protocolos/dashboard" element={<ProtectedRoute><ProtocolosDashboardPage /></ProtectedRoute>} />
          <Route path="/protocolos/:id" element={<ProtectedRoute><ProtocoloViewPage /></ProtectedRoute>} />
          {/* Funcionários */}
          <Route path="/funcionarios" element={<ProtectedRoute><FuncionariosPage /></ProtectedRoute>} />
          <Route path="/funcionarios/novo" element={<ProtectedRoute><FuncionarioFormPage /></ProtectedRoute>} />
          <Route path="/funcionarios/:id/editar" element={<ProtectedRoute><FuncionarioFormPage /></ProtectedRoute>} />
          {/* Call Center */}
          <Route path="/call-center" element={<ProtectedRoute><CallCenterPage /></ProtectedRoute>} />
          {/* Placeholders */}
          <Route path="/calendario" element={<ProtectedRoute><CalendarioPage /></ProtectedRoute>} />
          <Route path="/metricas" element={<ProtectedRoute><MetricasDiariasPage /></ProtectedRoute>} />
          <Route path="/metricas/novo" element={<ProtectedRoute><MetricaFormPage /></ProtectedRoute>} />
          <Route path="/alertas" element={<ProtectedRoute><AlertasPage /></ProtectedRoute>} />
          <Route path="/alertas-criticos" element={<ProtectedRoute><AlertasCriticosPage /></ProtectedRoute>} />
          <Route path="/bau" element={<ProtectedRoute><BauPainelPage /></ProtectedRoute>} />
          <Route path="/controle-processos" element={<ProtectedRoute><ControleProcessosPage /></ProtectedRoute>} />
          <Route path="/comunicacao" element={<ProtectedRoute><ComunicacaoPage /></ProtectedRoute>} />
          <Route path="/comunicacao/enviar" element={<ProtectedRoute><ComunicacaoEnviarPage /></ProtectedRoute>} />
          <Route path="/comunicacao/massa" element={<ProtectedRoute><ComunicacaoMassaPage /></ProtectedRoute>} />
          <Route path="/comunicacao/templates/novo" element={<ProtectedRoute><ComunicacaoTemplateFormPage /></ProtectedRoute>} />
          <Route path="/ia" element={<ProtectedRoute><IAModulePage /></ProtectedRoute>} />
          <Route path="/admin/usuarios" element={<ProtectedRoute><UsersAdminPage /></ProtectedRoute>} />
          <Route path="/admin/sessoes" element={<ProtectedRoute><MonitoramentoSessoesPage /></ProtectedRoute>} />
          <Route path="/financeiro" element={<ProtectedRoute><FinanceiroPainelPage /></ProtectedRoute>} />
          <Route path="/financeiro/novo" element={<ProtectedRoute><FinanceiroFormPage /></ProtectedRoute>} />
          {/* Monitoramento OAB / Processos Judiciais */}
          <Route path="/monitoramento-oab" element={<ProtectedRoute><MonitoramentoOABPage /></ProtectedRoute>} />
          {/* Painel de Tarefas do Usuário */}
          <Route path="/painel-tarefas" element={<ProtectedRoute><PainelTarefasUsuarioPage /></ProtectedRoute>} />
          {/* Comunicação Interna Unificada (Chat + Solicitações) */}
          <Route path="/comunicacao-interna" element={<ProtectedRoute><ComunicacaoInternaPage /></ProtectedRoute>} />
          {/* Redirecionamentos para a nova página unificada */}
          <Route path="/chat" element={<Navigate to="/comunicacao-interna" replace />} />
          <Route path="/solicitacoes" element={<Navigate to="/comunicacao-interna" replace />} />
          {/* Processos Judiciais do Escritório */}
          <Route path="/processos-judiciais" element={<ProtectedRoute><ProcessosJudiciaisPage /></ProtectedRoute>} />
          <Route path="/processos-judiciais/:id" element={<ProtectedRoute><ProcessoViewPage /></ProtectedRoute>} />
          {/* Relatórios */}
          <Route path="/relatorios" element={<ProtectedRoute><RelatoriosPage /></ProtectedRoute>} />
          {/* Comissões */}
          <Route path="/comissoes" element={<ProtectedRoute><ComissoesPage /></ProtectedRoute>} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
