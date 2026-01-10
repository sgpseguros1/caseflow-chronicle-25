import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import CasesListPage from "./pages/CasesListPage";
import ClientsPage from "./pages/ClientsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Wrapper component for pages that need layout
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
          <Route
            path="/dpvat"
            element={
              <PageWithLayout>
                <CasesListPage caseType="DPVAT" />
              </PageWithLayout>
            }
          />
          <Route
            path="/inss"
            element={
              <PageWithLayout>
                <CasesListPage caseType="INSS" />
              </PageWithLayout>
            }
          />
          <Route
            path="/vida"
            element={
              <PageWithLayout>
                <CasesListPage caseType="VIDA" />
              </PageWithLayout>
            }
          />
          <Route
            path="/vida-empresarial"
            element={
              <PageWithLayout>
                <CasesListPage caseType="VIDA_EMPRESARIAL" />
              </PageWithLayout>
            }
          />
          <Route
            path="/danos"
            element={
              <PageWithLayout>
                <CasesListPage caseType="DANOS" />
              </PageWithLayout>
            }
          />
          <Route
            path="/judicial"
            element={
              <PageWithLayout>
                <CasesListPage caseType="JUDICIAL" />
              </PageWithLayout>
            }
          />
          <Route
            path="/clientes"
            element={
              <PageWithLayout>
                <ClientsPage />
              </PageWithLayout>
            }
          />
          <Route
            path="/arquivos"
            element={
              <PageWithLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold">Arquivos</h1>
                  <p className="text-muted-foreground">Em desenvolvimento</p>
                </div>
              </PageWithLayout>
            }
          />
          <Route
            path="/financeiro"
            element={
              <PageWithLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold">Financeiro</h1>
                  <p className="text-muted-foreground">Em desenvolvimento</p>
                </div>
              </PageWithLayout>
            }
          />
          <Route
            path="/relatorios"
            element={
              <PageWithLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold">Relatórios</h1>
                  <p className="text-muted-foreground">Em desenvolvimento</p>
                </div>
              </PageWithLayout>
            }
          />
          <Route
            path="/configuracoes"
            element={
              <PageWithLayout>
                <div className="text-center py-12">
                  <h1 className="text-2xl font-bold">Configurações</h1>
                  <p className="text-muted-foreground">Em desenvolvimento</p>
                </div>
              </PageWithLayout>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
