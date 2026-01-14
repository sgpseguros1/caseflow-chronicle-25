import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO, format, startOfMonth, endOfMonth, startOfWeek, endOfWeek } from 'date-fns';

export interface RelatorioProducao {
  funcionario_id: string;
  funcionario_nome: string;
  baus_solicitados: number;
  baus_recebidos: number;
  baus_incompletos: number;
  processos_movidos: number;
  audiencias: number;
  prazos_cumpridos: number;
  comunicacoes: number;
  alertas_resolvidos: number;
}

export interface RelatorioResumo {
  periodo: { inicio: string; fim: string };
  baus: {
    total: number;
    solicitados: number;
    recebidos: number;
    incompletos: number;
    tempo_medio: number;
  };
  processos: {
    total: number;
    em_andamento: number;
    sentenciados: number;
    audiencias_agendadas: number;
    prazos_proximos: number;
    valor_total: number;
    indenizacao_pleiteada: number;
    indenizacao_paga: number;
  };
  comunicacoes: {
    total: number;
    por_canal: Record<string, number>;
  };
  alertas: {
    total: number;
    resolvidos: number;
    pendentes: number;
  };
  producao_por_funcionario: RelatorioProducao[];
}

// ==========================================
// HOOK: Relatório Completo
// ==========================================
export function useRelatorioCompleto(periodo: 'hoje' | 'semana' | 'mes' | 'custom', dataInicio?: string, dataFim?: string) {
  return useQuery({
    queryKey: ['relatorio-completo', periodo, dataInicio, dataFim],
    queryFn: async () => {
      const hoje = new Date();
      let inicio: Date;
      let fim: Date = hoje;

      switch (periodo) {
        case 'hoje':
          inicio = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());
          fim = hoje;
          break;
        case 'semana':
          inicio = startOfWeek(hoje, { weekStartsOn: 1 });
          fim = endOfWeek(hoje, { weekStartsOn: 1 });
          break;
        case 'mes':
          inicio = startOfMonth(hoje);
          fim = endOfMonth(hoje);
          break;
        case 'custom':
          inicio = dataInicio ? parseISO(dataInicio) : startOfMonth(hoje);
          fim = dataFim ? parseISO(dataFim) : hoje;
          break;
        default:
          inicio = startOfMonth(hoje);
      }

      const inicioStr = inicio.toISOString();
      const fimStr = fim.toISOString();

      // Fetch BAUs
      const { data: baus } = await supabase
        .from('client_baus')
        .select('*, responsavel:funcionarios(id, nome)')
        .gte('created_at', inicioStr)
        .lte('created_at', fimStr);

      // Fetch Processos
      const { data: processos } = await supabase
        .from('processos_judiciais')
        .select('*');

      // Fetch Comunicações
      const { data: comunicacoes } = await supabase
        .from('comunicacao_registros')
        .select('canal, remetente_id, created_at')
        .gte('created_at', inicioStr)
        .lte('created_at', fimStr);

      // Fetch Alertas
      const { data: alertas } = await supabase
        .from('alertas')
        .select('status, funcionario_id, resolvido_em')
        .gte('created_at', inicioStr)
        .lte('created_at', fimStr);

      // Fetch Funcionarios
      const { data: funcionarios } = await supabase
        .from('funcionarios')
        .select('id, nome')
        .eq('status', 'ativo');

      // Calculate BAU stats
      const bausSolicitados = baus?.filter(b => b.status === 'solicitado').length || 0;
      const bausRecebidos = baus?.filter(b => ['recebido', 'validado'].includes(b.status)).length || 0;
      const bausIncompletos = baus?.filter(b => b.status === 'incompleto').length || 0;
      
      const temposBau = (baus || [])
        .filter(b => b.data_recebimento)
        .map(b => differenceInDays(parseISO(b.data_recebimento!), parseISO(b.data_solicitacao)));
      const tempoMedioBau = temposBau.length > 0 
        ? temposBau.reduce((a, b) => a + b, 0) / temposBau.length 
        : 0;

      // Calculate Processo stats
      const processosEmAndamento = processos?.filter(p => p.status === 'em_andamento').length || 0;
      const processosSentenciados = processos?.filter(p => p.status === 'sentenciado').length || 0;
      const audienciasAgendadas = processos?.filter(p => p.data_audiencia && parseISO(p.data_audiencia) >= hoje).length || 0;
      const prazosProximos = processos?.filter(p => {
        if (!p.prazo_processual) return false;
        const prazo = parseISO(p.prazo_processual);
        const dias = differenceInDays(prazo, hoje);
        return dias >= 0 && dias <= 7;
      }).length || 0;

      const valorTotal = (processos || []).reduce((sum, p) => sum + (p.valor_causa || 0), 0);
      const indenizacaoPleiteada = (processos || []).reduce((sum, p) => sum + (p.indenizacao_pleiteada || 0), 0);
      const indenizacaoPaga = (processos || []).reduce((sum, p) => sum + (p.indenizacao_paga || 0), 0);

      // Calculate Comunicação stats
      const porCanal: Record<string, number> = {};
      (comunicacoes || []).forEach(c => {
        porCanal[c.canal] = (porCanal[c.canal] || 0) + 1;
      });

      // Calculate Alerta stats
      const alertasResolvidos = alertas?.filter(a => a.status === 'resolvido').length || 0;
      const alertasPendentes = alertas?.filter(a => a.status !== 'resolvido').length || 0;

      // Calculate Produção por Funcionário
      const producao: RelatorioProducao[] = (funcionarios || []).map(f => {
        const bausFuncionario = baus?.filter(b => b.responsavel_id === f.id) || [];
        const comunicacoesFuncionario = comunicacoes?.filter(c => c.remetente_id === f.id) || [];
        const alertasFuncionario = alertas?.filter(a => a.funcionario_id === f.id && a.status === 'resolvido') || [];

        return {
          funcionario_id: f.id,
          funcionario_nome: f.nome,
          baus_solicitados: bausFuncionario.filter(b => b.status === 'solicitado').length,
          baus_recebidos: bausFuncionario.filter(b => ['recebido', 'validado'].includes(b.status)).length,
          baus_incompletos: bausFuncionario.filter(b => b.status === 'incompleto').length,
          processos_movidos: 0, // Would need andamentos data
          audiencias: 0, // Would need agenda data
          prazos_cumpridos: 0,
          comunicacoes: comunicacoesFuncionario.length,
          alertas_resolvidos: alertasFuncionario.length,
        };
      });

      return {
        periodo: {
          inicio: format(inicio, 'yyyy-MM-dd'),
          fim: format(fim, 'yyyy-MM-dd'),
        },
        baus: {
          total: baus?.length || 0,
          solicitados: bausSolicitados,
          recebidos: bausRecebidos,
          incompletos: bausIncompletos,
          tempo_medio: Math.round(tempoMedioBau),
        },
        processos: {
          total: processos?.length || 0,
          em_andamento: processosEmAndamento,
          sentenciados: processosSentenciados,
          audiencias_agendadas: audienciasAgendadas,
          prazos_proximos: prazosProximos,
          valor_total: valorTotal,
          indenizacao_pleiteada: indenizacaoPleiteada,
          indenizacao_paga: indenizacaoPaga,
        },
        comunicacoes: {
          total: comunicacoes?.length || 0,
          por_canal: porCanal,
        },
        alertas: {
          total: alertas?.length || 0,
          resolvidos: alertasResolvidos,
          pendentes: alertasPendentes,
        },
        producao_por_funcionario: producao.filter(p => 
          p.baus_solicitados > 0 || p.baus_recebidos > 0 || p.comunicacoes > 0 || p.alertas_resolvidos > 0
        ),
      } as RelatorioResumo;
    },
  });
}

// ==========================================
// HOOK: Export to PDF/Excel (returns data)
// ==========================================
export function useExportRelatorio() {
  const exportToCsv = (data: RelatorioResumo, filename: string) => {
    const rows = [
      ['Relatório de Produção'],
      [`Período: ${data.periodo.inicio} a ${data.periodo.fim}`],
      [],
      ['RESUMO BAU'],
      ['Total', 'Solicitados', 'Recebidos', 'Incompletos', 'Tempo Médio (dias)'],
      [data.baus.total, data.baus.solicitados, data.baus.recebidos, data.baus.incompletos, data.baus.tempo_medio],
      [],
      ['RESUMO PROCESSOS'],
      ['Total', 'Em Andamento', 'Sentenciados', 'Audiências', 'Prazos Próximos', 'Valor Total'],
      [data.processos.total, data.processos.em_andamento, data.processos.sentenciados, data.processos.audiencias_agendadas, data.processos.prazos_proximos, data.processos.valor_total],
      [],
      ['PRODUÇÃO POR FUNCIONÁRIO'],
      ['Funcionário', 'BAUs Solicitados', 'BAUs Recebidos', 'Comunicações', 'Alertas Resolvidos'],
      ...data.producao_por_funcionario.map(p => [
        p.funcionario_nome, p.baus_solicitados, p.baus_recebidos, p.comunicacoes, p.alertas_resolvidos
      ]),
    ];

    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}.csv`;
    link.click();
  };

  return { exportToCsv };
}
