import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
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
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const PageWithLayout = ({ children }: { children: React.ReactNode }) => (
  <AppLayout>{children}</AppLayout>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          {/* DPVAT */}
          <Route path="/dpvat" element={<PageWithLayout><DPVATModule /></PageWithLayout>} />
          <Route path="/dpvat/novo" element={<PageWithLayout><DPVATFormPage /></PageWithLayout>} />
          {/* INSS */}
          <Route path="/inss" element={<PageWithLayout><CasesListPage caseType="INSS" /></PageWithLayout>} />
          <Route path="/inss/novo" element={<PageWithLayout><INSSFormPage /></PageWithLayout>} />
          {/* Vida */}
          <Route path="/vida" element={<PageWithLayout><CasesListPage caseType="VIDA" /></PageWithLayout>} />
          <Route path="/vida/novo" element={<PageWithLayout><VidaFormPage /></PageWithLayout>} />
          {/* Vida Empresarial */}
          <Route path="/vida-empresarial" element={<PageWithLayout><CasesListPage caseType="VIDA_EMPRESARIAL" /></PageWithLayout>} />
          <Route path="/vida-empresarial/novo" element={<PageWithLayout><VidaEmpresarialFormPage /></PageWithLayout>} />
          {/* Danos */}
          <Route path="/danos" element={<PageWithLayout><CasesListPage caseType="DANOS" /></PageWithLayout>} />
          <Route path="/danos/novo" element={<PageWithLayout><DanosFormPage /></PageWithLayout>} />
          {/* Judicial */}
          <Route path="/judicial" element={<PageWithLayout><CasesListPage caseType="JUDICIAL" /></PageWithLayout>} />
          <Route path="/judicial/novo" element={<PageWithLayout><JudicialFormPage /></PageWithLayout>} />
          {/* Clientes */}
          <Route path="/clientes" element={<PageWithLayout><ClientsPage /></PageWithLayout>} />
          <Route path="/clientes/novo" element={<PageWithLayout><ClientFormPage /></PageWithLayout>} />
          {/* Financeiro */}
          <Route path="/financeiro" element={<PageWithLayout><div className="text-center py-12"><h1 className="text-2xl font-bold">Financeiro</h1></div></PageWithLayout>} />
          <Route path="/financeiro/novo" element={<PageWithLayout><FinanceiroFormPage /></PageWithLayout>} />
          {/* Outros */}
          <Route path="/arquivos" element={<PageWithLayout><div className="text-center py-12"><h1 className="text-2xl font-bold">Arquivos</h1><p className="text-muted-foreground">Arquivos são vinculados a clientes e processos</p></div></PageWithLayout>} />
          <Route path="/relatorios" element={<PageWithLayout><div className="text-center py-12"><h1 className="text-2xl font-bold">Relatórios</h1></div></PageWithLayout>} />
          <Route path="/configuracoes" element={<PageWithLayout><div className="text-center py-12"><h1 className="text-2xl font-bold">Configurações</h1></div></PageWithLayout>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
