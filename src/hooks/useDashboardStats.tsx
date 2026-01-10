import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  totalProcessos: number;
  judiciais: number;
  administrativos: number;
  pendentes: number;
  emAndamento: number;
  pagos: number;
  finalizados: number;
  valorTotalEstimado: number;
  valorTotalRecebido: number;
  valorPendente: number;
  porTipo: { name: string; value: number; color: string }[];
  porStatus: { name: string; value: number }[];
  porAdvogado: { name: string; processos: number }[];
  porSeguradora: { name: string; processos: number }[];
  processosRecentes: any[];
  alertasPendentes: number;
}

const TIPO_COLORS: Record<string, string> = {
  'DPVAT': '#3b82f6',
  'INSS': '#10b981',
  'VIDA': '#8b5cf6',
  'VIDA_EMPRESARIAL': '#f59e0b',
  'DANOS': '#ef4444',
  'JUDICIAL': '#06b6d4',
};

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async (): Promise<DashboardStats> => {
      // Buscar processos
      const { data: processos, error: processosError } = await supabase
        .from('processos')
        .select('*, clients(name), advogados(nome), seguradoras(razao_social)');
      
      if (processosError) throw processosError;

      // Buscar alertas pendentes
      const { count: alertasPendentes } = await supabase
        .from('alertas')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pendente');

      const lista = processos || [];

      // Calcular estatísticas
      const totalProcessos = lista.length;
      const judiciais = lista.filter(p => p.tipo === 'JUDICIAL').length;
      const administrativos = lista.filter(p => p.tipo !== 'JUDICIAL').length;
      const pendentes = lista.filter(p => p.status === 'pendente').length;
      const emAndamento = lista.filter(p => p.status === 'em_andamento').length;
      const pagos = lista.filter(p => p.status === 'pago').length;
      const finalizados = lista.filter(p => p.status === 'finalizado').length;

      const valorTotalEstimado = lista.reduce((acc, p) => acc + (Number(p.valor_estimado) || 0), 0);
      const valorTotalRecebido = lista.reduce((acc, p) => acc + (Number(p.valor_final) || 0), 0);
      const valorPendente = valorTotalEstimado - valorTotalRecebido;

      // Por tipo
      const tipoCount: Record<string, number> = {};
      lista.forEach(p => {
        tipoCount[p.tipo] = (tipoCount[p.tipo] || 0) + 1;
      });
      const porTipo = Object.entries(tipoCount).map(([name, value]) => ({
        name,
        value,
        color: TIPO_COLORS[name] || '#64748b',
      }));

      // Por status
      const statusCount: Record<string, number> = {};
      lista.forEach(p => {
        statusCount[p.status] = (statusCount[p.status] || 0) + 1;
      });
      const porStatus = Object.entries(statusCount).map(([name, value]) => ({
        name,
        value,
      }));

      // Por advogado
      const advogadoCount: Record<string, number> = {};
      lista.forEach(p => {
        const nome = p.advogados?.nome || 'Sem advogado';
        advogadoCount[nome] = (advogadoCount[nome] || 0) + 1;
      });
      const porAdvogado = Object.entries(advogadoCount)
        .map(([name, processos]) => ({ name, processos }))
        .sort((a, b) => b.processos - a.processos)
        .slice(0, 5);

      // Por seguradora
      const seguradoraCount: Record<string, number> = {};
      lista.forEach(p => {
        const nome = p.seguradoras?.razao_social || 'Sem seguradora';
        seguradoraCount[nome] = (seguradoraCount[nome] || 0) + 1;
      });
      const porSeguradora = Object.entries(seguradoraCount)
        .map(([name, processos]) => ({ name, processos }))
        .sort((a, b) => b.processos - a.processos)
        .slice(0, 5);

      // Processos recentes
      const processosRecentes = lista
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          numero: p.numero || p.titulo || 'Sem número',
          tipo: p.tipo,
          status: p.status,
          cliente: p.clients?.name || 'Sem cliente',
          dataAbertura: p.data_abertura,
        }));

      return {
        totalProcessos,
        judiciais,
        administrativos,
        pendentes,
        emAndamento,
        pagos,
        finalizados,
        valorTotalEstimado,
        valorTotalRecebido,
        valorPendente,
        porTipo,
        porStatus,
        porAdvogado,
        porSeguradora,
        processosRecentes,
        alertasPendentes: alertasPendentes || 0,
      };
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
}
