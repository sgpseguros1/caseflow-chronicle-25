import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format, startOfMonth, endOfMonth, subMonths, differenceInDays } from 'date-fns';
import { useEffect } from 'react';

export interface ProcessoStats {
  totalProtocolos: number;
  protocolosAtivos: number;
  protocolosLiquidados: number;
  protocolosPendentes: number;
  valorTotalEstimado: number;
  valorTotalRecebido: number;
  tempoMedioLiquidacao: number;
  porTipo: {
    tipo: string;
    quantidade: number;
    valor: number;
    percentual: number;
  }[];
  porSeguradora: {
    seguradora: string;
    quantidade: number;
    valor: number;
    taxaConversao: number;
  }[];
  porIndicador: {
    indicador: string;
    quantidade: number;
    valor: number;
  }[];
  porStatus: {
    status: string;
    quantidade: number;
    percentual: number;
  }[];
  porMes: {
    mes: string;
    entradas: number;
    liquidacoes: number;
    valor: number;
  }[];
  porResponsavel: {
    nome: string;
    ativos: number;
    liquidados: number;
    valorTotal: number;
  }[];
  protocolosRecentes: {
    id: string;
    codigo: number;
    cliente: string;
    tipo: string;
    status: string;
    data: string;
    seguradora?: string;
  }[];
  liquidacoesRecentes: {
    id: string;
    codigo: number;
    cliente: string;
    tipo: string;
    valor: number;
    data: string;
    diasTramitacao: number;
  }[];
}

interface PeriodoFilter {
  inicio: string;
  fim: string;
}

export function useControleProcessosStats(periodo?: PeriodoFilter) {
  const queryClient = useQueryClient();

  // Realtime subscription para atualização automática
  useEffect(() => {
    const channel = supabase
      .channel('controle-processos-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'protocolos' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['controle-processos-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lancamentos_financeiros' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['controle-processos-stats'] });
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'protocolo_financeiro' },
        () => {
          queryClient.invalidateQueries({ queryKey: ['controle-processos-stats'] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ['controle-processos-stats', periodo],
    refetchInterval: 30000, // Atualiza a cada 30 segundos
    refetchOnWindowFocus: true,
    queryFn: async (): Promise<ProcessoStats> => {
      const hoje = new Date();
      const inicioDefault = startOfMonth(subMonths(hoje, 11)).toISOString();
      const fimDefault = endOfMonth(hoje).toISOString();
      
      const inicio = periodo?.inicio || inicioDefault;
      const fim = periodo?.fim || fimDefault;

      // Buscar protocolos com dados relacionados
      const { data: protocolos, error: protocolosError } = await supabase
        .from('protocolos')
        .select(`
          id,
          codigo,
          tipo,
          subtipo,
          natureza,
          status,
          prioridade,
          data_protocolo,
          data_ultima_movimentacao,
          prazo_estimado,
          cliente_id,
          seguradora_id,
          funcionario_id,
          advogado_id,
          created_at,
          cliente:clients(id, name, code, referral_source, referrer_name),
          seguradora:seguradoras(id, razao_social, nome_fantasia),
          funcionario:funcionarios(id, nome)
        `)
        .gte('data_protocolo', inicio.split('T')[0])
        .lte('data_protocolo', fim.split('T')[0])
        .order('data_protocolo', { ascending: false });

      if (protocolosError) throw protocolosError;

      // Buscar dados financeiros relacionados
      const { data: financeiros, error: financeiroError } = await supabase
        .from('lancamentos_financeiros')
        .select('*')
        .gte('created_at', inicio)
        .lte('created_at', fim);

      if (financeiroError) throw financeiroError;

      // Buscar dados do protocolo_financeiro
      const { data: protocoloFinanceiro, error: pfError } = await supabase
        .from('protocolo_financeiro')
        .select('*');

      if (pfError) throw pfError;

      // Calcular estatísticas
      const protocolosData = protocolos || [];
      const totalProtocolos = protocolosData.length;

      const statusLiquidado = ['concluido', 'pago', 'liquidado', 'finalizado'];
      const statusPendente = ['em_analise', 'aguardando_documentos', 'pendente'];

      const protocolosLiquidados = protocolosData.filter(p => 
        statusLiquidado.includes(p.status.toLowerCase())
      ).length;

      const protocolosPendentes = protocolosData.filter(p => 
        statusPendente.includes(p.status.toLowerCase())
      ).length;

      const protocolosAtivos = totalProtocolos - protocolosLiquidados;

      // Valores financeiros
      const valorTotalRecebido = (financeiros || [])
        .filter(f => f.status === 'recebido')
        .reduce((acc, f) => acc + (f.valor_pago || 0), 0);

      const valorTotalEstimado = (protocoloFinanceiro || [])
        .reduce((acc, pf) => acc + (pf.valor_estimado || 0), 0);

      // Tempo médio de liquidação (em dias)
      const protocolosComData = protocolosData.filter(p => 
        statusLiquidado.includes(p.status.toLowerCase()) && p.data_ultima_movimentacao
      );
      
      const tempoMedioLiquidacao = protocolosComData.length > 0
        ? protocolosComData.reduce((acc, p) => {
            const inicio = new Date(p.data_protocolo);
            const fim = new Date(p.data_ultima_movimentacao!);
            return acc + differenceInDays(fim, inicio);
          }, 0) / protocolosComData.length
        : 0;

      // Agrupar por tipo
      const tipoMap = new Map<string, { quantidade: number; valor: number }>();
      protocolosData.forEach(p => {
        const tipo = p.tipo || 'Não definido';
        const current = tipoMap.get(tipo) || { quantidade: 0, valor: 0 };
        const pf = (protocoloFinanceiro || []).find(f => f.protocolo_id === p.id);
        tipoMap.set(tipo, {
          quantidade: current.quantidade + 1,
          valor: current.valor + (pf?.valor_recebido || 0)
        });
      });

      const porTipo = Array.from(tipoMap.entries()).map(([tipo, data]) => ({
        tipo: formatTipoLabel(tipo),
        quantidade: data.quantidade,
        valor: data.valor,
        percentual: totalProtocolos > 0 ? (data.quantidade / totalProtocolos) * 100 : 0
      })).sort((a, b) => b.quantidade - a.quantidade);

      // Agrupar por seguradora
      const seguradoraMap = new Map<string, { quantidade: number; valor: number; liquidados: number }>();
      protocolosData.forEach(p => {
        const seg = (p.seguradora as any);
        const nome = seg?.nome_fantasia || seg?.razao_social || 'Sem seguradora';
        const current = seguradoraMap.get(nome) || { quantidade: 0, valor: 0, liquidados: 0 };
        const pf = (protocoloFinanceiro || []).find(f => f.protocolo_id === p.id);
        const isLiquidado = statusLiquidado.includes(p.status.toLowerCase());
        seguradoraMap.set(nome, {
          quantidade: current.quantidade + 1,
          valor: current.valor + (pf?.valor_recebido || 0),
          liquidados: current.liquidados + (isLiquidado ? 1 : 0)
        });
      });

      const porSeguradora = Array.from(seguradoraMap.entries()).map(([seguradora, data]) => ({
        seguradora,
        quantidade: data.quantidade,
        valor: data.valor,
        taxaConversao: data.quantidade > 0 ? (data.liquidados / data.quantidade) * 100 : 0
      })).sort((a, b) => b.quantidade - a.quantidade);

      // Agrupar por indicador (referral)
      const indicadorMap = new Map<string, { quantidade: number; valor: number }>();
      protocolosData.forEach(p => {
        const cliente = p.cliente as any;
        const indicador = cliente?.referrer_name || cliente?.referral_source || 'Direto';
        const current = indicadorMap.get(indicador) || { quantidade: 0, valor: 0 };
        const pf = (protocoloFinanceiro || []).find(f => f.protocolo_id === p.id);
        indicadorMap.set(indicador, {
          quantidade: current.quantidade + 1,
          valor: current.valor + (pf?.valor_recebido || 0)
        });
      });

      const porIndicador = Array.from(indicadorMap.entries()).map(([indicador, data]) => ({
        indicador,
        quantidade: data.quantidade,
        valor: data.valor
      })).sort((a, b) => b.quantidade - a.quantidade).slice(0, 10);

      // Agrupar por status
      const statusMap = new Map<string, number>();
      protocolosData.forEach(p => {
        const status = p.status || 'indefinido';
        statusMap.set(status, (statusMap.get(status) || 0) + 1);
      });

      const porStatus = Array.from(statusMap.entries()).map(([status, quantidade]) => ({
        status: formatStatusLabel(status),
        quantidade,
        percentual: totalProtocolos > 0 ? (quantidade / totalProtocolos) * 100 : 0
      })).sort((a, b) => b.quantidade - a.quantidade);

      // Agrupar por mês
      const mesMap = new Map<string, { entradas: number; liquidacoes: number; valor: number }>();
      protocolosData.forEach(p => {
        const mes = format(new Date(p.data_protocolo), 'yyyy-MM');
        const current = mesMap.get(mes) || { entradas: 0, liquidacoes: 0, valor: 0 };
        const isLiquidado = statusLiquidado.includes(p.status.toLowerCase());
        const pf = (protocoloFinanceiro || []).find(f => f.protocolo_id === p.id);
        mesMap.set(mes, {
          entradas: current.entradas + 1,
          liquidacoes: current.liquidacoes + (isLiquidado ? 1 : 0),
          valor: current.valor + (pf?.valor_recebido || 0)
        });
      });

      const porMes = Array.from(mesMap.entries())
        .map(([mes, data]) => ({
          mes: format(new Date(mes + '-01'), 'MMM/yy', { locale: require('date-fns/locale/pt-BR').ptBR }),
          ...data
        }))
        .sort((a, b) => a.mes.localeCompare(b.mes));

      // Agrupar por responsável
      const responsavelMap = new Map<string, { ativos: number; liquidados: number; valor: number }>();
      protocolosData.forEach(p => {
        const func = p.funcionario as any;
        const nome = func?.nome || 'Sem responsável';
        const current = responsavelMap.get(nome) || { ativos: 0, liquidados: 0, valor: 0 };
        const isLiquidado = statusLiquidado.includes(p.status.toLowerCase());
        const pf = (protocoloFinanceiro || []).find(f => f.protocolo_id === p.id);
        responsavelMap.set(nome, {
          ativos: current.ativos + (isLiquidado ? 0 : 1),
          liquidados: current.liquidados + (isLiquidado ? 1 : 0),
          valor: current.valor + (pf?.valor_recebido || 0)
        });
      });

      const porResponsavel = Array.from(responsavelMap.entries()).map(([nome, data]) => ({
        nome,
        ...data,
        valorTotal: data.valor
      })).sort((a, b) => b.liquidados - a.liquidados);

      // Protocolos recentes
      const protocolosRecentes = protocolosData.slice(0, 10).map(p => ({
        id: p.id,
        codigo: p.codigo,
        cliente: (p.cliente as any)?.name || 'Cliente não encontrado',
        tipo: formatTipoLabel(p.tipo),
        status: p.status,
        data: p.data_protocolo,
        seguradora: (p.seguradora as any)?.nome_fantasia || (p.seguradora as any)?.razao_social
      }));

      // Liquidações recentes
      const liquidacoesRecentes = protocolosData
        .filter(p => statusLiquidado.includes(p.status.toLowerCase()))
        .slice(0, 10)
        .map(p => {
          const pf = (protocoloFinanceiro || []).find(f => f.protocolo_id === p.id);
          const diasTramitacao = p.data_ultima_movimentacao 
            ? differenceInDays(new Date(p.data_ultima_movimentacao), new Date(p.data_protocolo))
            : 0;
          return {
            id: p.id,
            codigo: p.codigo,
            cliente: (p.cliente as any)?.name || 'Cliente não encontrado',
            tipo: formatTipoLabel(p.tipo),
            valor: pf?.valor_recebido || 0,
            data: p.data_ultima_movimentacao || p.data_protocolo,
            diasTramitacao
          };
        });

      return {
        totalProtocolos,
        protocolosAtivos,
        protocolosLiquidados,
        protocolosPendentes,
        valorTotalEstimado,
        valorTotalRecebido,
        tempoMedioLiquidacao,
        porTipo,
        porSeguradora,
        porIndicador,
        porStatus,
        porMes,
        porResponsavel,
        protocolosRecentes,
        liquidacoesRecentes
      };
    }
  });
}

function formatTipoLabel(tipo: string): string {
  const labels: Record<string, string> = {
    'dpvat': 'DPVAT',
    'seguro_vida': 'Seguro de Vida',
    'judicial': 'Judicial',
    'danos': 'Danos',
    'previdenciario': 'Previdenciário',
    'inss': 'INSS',
    'auxilio_acidente': 'Auxílio Acidente',
    'vida_empresarial': 'Vida Empresarial'
  };
  return labels[tipo.toLowerCase()] || tipo;
}

function formatStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'em_analise': 'Em Análise',
    'aguardando_documentos': 'Aguardando Docs',
    'em_andamento': 'Em Andamento',
    'protocolado': 'Protocolado',
    'concluido': 'Concluído',
    'pago': 'Pago',
    'liquidado': 'Liquidado',
    'finalizado': 'Finalizado',
    'pendente': 'Pendente',
    'cancelado': 'Cancelado'
  };
  return labels[status.toLowerCase()] || status;
}
