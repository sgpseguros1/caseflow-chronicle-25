import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { differenceInDays, parseISO, startOfMonth, startOfWeek, startOfDay, format } from 'date-fns';

export interface PainelGeralStats {
  // Clientes
  totalClientes: number;
  clientesNovosMes: number;
  
  // Processos Gerais
  totalProcessos: number;
  processosAtivos: number;
  processosEmAlerta: number;
  processosCriticos: number;
  processosConcluidos: number;
  
  // Processos Judiciais
  processosJudiciaisAtivos: number;
  processosJudiciaisParados7: number;
  processosJudiciaisParados15: number;
  processosJudiciaisParados30: number;
  
  // Protocolos
  protocolosAtivos: number;
  protocolosParados7: number;
  protocolosParados15: number;
  protocolosParados30: number;
  protocolosSemResposta: number;
  
  // BAU
  bausTotal: number;
  bausEmAndamento: number;
  bausMais10Dias: number;
  bausCriticos: number;
  bausRecebidosMes: number;
  bausIncompletos: number;
  hospitaisCriticos: number;
  
  // Perícias
  periciasAgendadas: number;
  periciasAguardandoPagamento: number;
  periciasClienteFaltou: number;
  juntasMedicas: number;
  periciasProximas: any[];
  
  // Financeiro
  valorTotalEmAnalise: number;
  valorPendente: number;
  valorRecebido: number;
  valorEmAtraso: number;
  comissoesPendentes: number;
  comissoesPagas: number;
  
  // Por tipo
  processosPorTipo: { name: string; value: number; color: string }[];
  financeiroPortTipo: { name: string; value: number }[];
  
  // Alertas
  alertasPendentes: number;
  alertasCriticos: any[];
  
  // Produtividade
  producaoPorAnalista: {
    nome: string;
    processos: number;
    protocolos: number;
    baus: number;
    atrasados: number;
  }[];
  
  // Métricas do dia
  metricasHoje: {
    protocolosHoje: number;
    periciasHoje: number;
    bausHoje: number;
    pagamentosHoje: number;
    clientesHoje: number;
  };
  
  // Listas rápidas
  processosParadosLista: any[];
  bausPendentesLista: any[];
  periciasProximasLista: any[];
}

const TIPO_COLORS: Record<string, string> = {
  'DPVAT': '#3b82f6',
  'INSS': '#10b981',
  'VIDA': '#8b5cf6',
  'VIDA_EMPRESARIAL': '#f59e0b',
  'DANOS': '#ef4444',
  'JUDICIAL': '#06b6d4',
  'TRABALHISTA': '#ec4899',
  'PREVIDENCIARIO': '#14b8a6',
};

export function usePainelGeralStats() {
  return useQuery({
    queryKey: ['painel-geral-stats'],
    queryFn: async (): Promise<PainelGeralStats> => {
      const hoje = new Date();
      const inicioMes = startOfMonth(hoje);
      const inicioSemana = startOfWeek(hoje, { weekStartsOn: 1 });
      const inicioDia = startOfDay(hoje);
      
      // Fetch all data in parallel
      const [
        clientsResult,
        processosResult,
        processosJudiciaisResult,
        protocolosResult,
        bausResult,
        periciasResult,
        financeirosResult,
        alertasResult,
        funcionariosResult,
        comissoesResult,
      ] = await Promise.all([
        // Clientes
        supabase.from('clients').select('id, created_at, responsavel_id').is('deleted_at', null),
        // Processos (gerais)
        supabase.from('processos').select('id, tipo, status, created_at, advogado_id, data_abertura, valor_estimado, valor_final'),
        // Processos Judiciais
        supabase.from('processos_judiciais').select('id, status, data_ultima_movimentacao, dias_parado, processo_parado, processo_critico, responsavel_id, valor_causa'),
        // Protocolos
        supabase.from('protocolos').select('id, status, data_ultima_movimentacao, funcionario_id, tipo, natureza, created_at'),
        // BAUs
        supabase.from('client_baus').select('id, status, data_solicitacao, data_recebimento, hospital_nome, responsavel_id, qualidade_status').neq('status', 'cancelado'),
        // Perícias
        supabase.from('pericias').select('id, status, tipo_pericia, data_pericia, hora_pericia, cliente:clients(name)'),
        // Financeiro
        supabase.from('lancamentos_financeiros').select('id, tipo_receita, valor_bruto, valor_pago, valor_pendente, status, data_recebimento, created_at'),
        // Alertas
        supabase.from('alertas').select('id, tipo, titulo, descricao, prioridade, status, created_at').eq('status', 'pendente'),
        // Funcionários
        supabase.from('funcionarios').select('id, nome').eq('status', 'ativo'),
        // Comissões
        supabase.from('comissoes').select('id, status, valor').is('deleted_at', null),
      ]);

      const clients = clientsResult.data || [];
      const processos = processosResult.data || [];
      const processosJudiciais = processosJudiciaisResult.data || [];
      const protocolos = protocolosResult.data || [];
      const baus = bausResult.data || [];
      const pericias = periciasResult.data || [];
      const financeiros = financeirosResult.data || [];
      const alertas = alertasResult.data || [];
      const funcionarios = funcionariosResult.data || [];
      const comissoes = comissoesResult.data || [];

      // ============= CLIENTES =============
      const totalClientes = clients.length;
      const clientesNovosMes = clients.filter(c => 
        c.created_at && parseISO(c.created_at) >= inicioMes
      ).length;
      const clientesHoje = clients.filter(c => 
        c.created_at && parseISO(c.created_at) >= inicioDia
      ).length;

      // ============= PROCESSOS GERAIS =============
      const totalProcessos = processos.length;
      const processosAtivos = processos.filter(p => 
        !['finalizado', 'pago', 'arquivado', 'cancelado'].includes(p.status)
      ).length;
      const processosConcluidos = processos.filter(p => 
        ['finalizado', 'pago'].includes(p.status)
      ).length;

      // Por tipo
      const tipoCount: Record<string, number> = {};
      processos.forEach(p => {
        tipoCount[p.tipo] = (tipoCount[p.tipo] || 0) + 1;
      });
      const processosPorTipo = Object.entries(tipoCount).map(([name, value]) => ({
        name,
        value,
        color: TIPO_COLORS[name] || '#64748b',
      }));

      // ============= PROCESSOS JUDICIAIS =============
      const processosJudiciaisAtivos = processosJudiciais.filter(p => 
        !['arquivado', 'baixado', 'transitado'].includes(p.status)
      ).length;
      
      const processosJudiciaisParados7 = processosJudiciais.filter(p => {
        if (!p.data_ultima_movimentacao) return false;
        const dias = differenceInDays(hoje, parseISO(p.data_ultima_movimentacao));
        return dias >= 7 && dias < 15 && !['arquivado', 'baixado'].includes(p.status);
      }).length;
      
      const processosJudiciaisParados15 = processosJudiciais.filter(p => {
        if (!p.data_ultima_movimentacao) return false;
        const dias = differenceInDays(hoje, parseISO(p.data_ultima_movimentacao));
        return dias >= 15 && dias < 30 && !['arquivado', 'baixado'].includes(p.status);
      }).length;
      
      const processosJudiciaisParados30 = processosJudiciais.filter(p => {
        if (!p.data_ultima_movimentacao) return false;
        const dias = differenceInDays(hoje, parseISO(p.data_ultima_movimentacao));
        return dias >= 30 && !['arquivado', 'baixado'].includes(p.status);
      }).length;

      const processosEmAlerta = processosJudiciaisParados7 + processosJudiciaisParados15;
      const processosCriticos = processosJudiciaisParados30;

      // Lista de processos parados
      const processosParadosLista = processosJudiciais
        .filter(p => p.processo_parado || p.processo_critico)
        .map(p => ({
          id: p.id,
          status: p.status,
          diasParado: p.dias_parado,
          critico: p.processo_critico,
        }))
        .slice(0, 10);

      // ============= PROTOCOLOS =============
      const protocolosAtivos = protocolos.filter(p => 
        !['concluido', 'arquivado', 'cancelado'].includes(p.status)
      ).length;
      
      const calcularDiasParadoProtocolo = (p: any) => {
        if (!p.data_ultima_movimentacao) return 0;
        return differenceInDays(hoje, parseISO(p.data_ultima_movimentacao));
      };
      
      const protocolosParados7 = protocolos.filter(p => {
        const dias = calcularDiasParadoProtocolo(p);
        return dias >= 7 && dias < 15 && !['concluido', 'arquivado'].includes(p.status);
      }).length;
      
      const protocolosParados15 = protocolos.filter(p => {
        const dias = calcularDiasParadoProtocolo(p);
        return dias >= 15 && dias < 30 && !['concluido', 'arquivado'].includes(p.status);
      }).length;
      
      const protocolosParados30 = protocolos.filter(p => {
        const dias = calcularDiasParadoProtocolo(p);
        return dias >= 30 && !['concluido', 'arquivado'].includes(p.status);
      }).length;
      
      const protocolosSemResposta = protocolos.filter(p => 
        p.status === 'aguardando_seguradora'
      ).length;

      const protocolosHoje = protocolos.filter(p => 
        p.created_at && parseISO(p.created_at) >= inicioDia
      ).length;

      // ============= BAU =============
      const bausComDias = baus.map(bau => ({
        ...bau,
        diasCorridos: differenceInDays(hoje, parseISO(bau.data_solicitacao)),
      }));

      const bausTotal = baus.length;
      const bausEmAndamento = bausComDias.filter(b => 
        ['solicitado', 'em_andamento'].includes(b.status)
      ).length;
      const bausMais10Dias = bausComDias.filter(b => 
        b.diasCorridos >= 10 && !['recebido', 'validado'].includes(b.status)
      ).length;
      const bausCriticos = bausComDias.filter(b => 
        b.diasCorridos >= 15 && !['recebido', 'validado'].includes(b.status)
      ).length;
      const bausRecebidosMes = bausComDias.filter(b => 
        b.data_recebimento && parseISO(b.data_recebimento) >= inicioMes
      ).length;
      const bausIncompletos = bausComDias.filter(b => 
        b.qualidade_status === 'recebido_incompleto' || b.status === 'incompleto'
      ).length;

      // Hospitais críticos
      const hospitalCriticoSet = new Set<string>();
      bausComDias.forEach(bau => {
        if (bau.diasCorridos >= 15 && !['recebido', 'validado'].includes(bau.status)) {
          hospitalCriticoSet.add(bau.hospital_nome);
        }
      });
      const hospitaisCriticos = hospitalCriticoSet.size;

      const bausHoje = bausComDias.filter(b => 
        parseISO(b.data_solicitacao) >= inicioDia
      ).length;

      const bausPendentesLista = bausComDias
        .filter(b => b.diasCorridos >= 10 && !['recebido', 'validado'].includes(b.status))
        .sort((a, b) => b.diasCorridos - a.diasCorridos)
        .slice(0, 10);

      // ============= PERÍCIAS =============
      const periciasAgendadas = pericias.filter(p => p.status === 'agendada').length;
      const periciasAguardandoPagamento = pericias.filter(p => 
        p.status === 'realizada_aguardando_pagamento'
      ).length;
      const periciasClienteFaltou = pericias.filter(p => p.status === 'cliente_faltou').length;
      const juntasMedicas = pericias.filter(p => p.tipo_pericia === 'junta_medica').length;

      // Próximas 3 dias
      const periciasProximas = pericias
        .filter(p => {
          if (p.status !== 'agendada') return false;
          const dataPericia = parseISO(p.data_pericia);
          const diffDays = differenceInDays(dataPericia, hoje);
          return diffDays >= 0 && diffDays <= 3;
        })
        .map(p => ({
          id: p.id,
          data: p.data_pericia,
          hora: p.hora_pericia,
          cliente: (p.cliente as any)?.name,
          tipo: p.tipo_pericia,
        }))
        .slice(0, 10);

      const periciasProximasLista = periciasProximas;

      const periciasHoje = pericias.filter(p => 
        p.data_pericia === format(hoje, 'yyyy-MM-dd')
      ).length;

      // ============= FINANCEIRO =============
      const valorTotalEmAnalise = financeiros
        .filter(f => ['em_aberto', 'parcial'].includes(f.status))
        .reduce((sum, f) => sum + Number(f.valor_bruto || 0), 0);

      const valorPendente = financeiros
        .filter(f => ['em_aberto', 'parcial'].includes(f.status))
        .reduce((sum, f) => sum + Number(f.valor_pendente || 0), 0);

      const valorRecebido = financeiros
        .filter(f => f.status === 'recebido')
        .reduce((sum, f) => sum + Number(f.valor_pago || 0), 0);

      const valorEmAtraso = financeiros
        .filter(f => f.status === 'em_atraso')
        .reduce((sum, f) => sum + Number(f.valor_pendente || 0), 0);

      // Por tipo
      const financeiroTipoCount: Record<string, number> = {};
      financeiros.forEach(f => {
        const tipo = f.tipo_receita || 'outros';
        financeiroTipoCount[tipo] = (financeiroTipoCount[tipo] || 0) + Number(f.valor_bruto || 0);
      });
      const financeiroPortTipo = Object.entries(financeiroTipoCount).map(([name, value]) => ({
        name,
        value,
      }));

      const pagamentosHoje = financeiros.filter(f => 
        f.data_recebimento && format(parseISO(f.data_recebimento), 'yyyy-MM-dd') === format(hoje, 'yyyy-MM-dd')
      ).length;

      // Comissões
      const comissoesPendentes = comissoes
        .filter(c => c.status === 'pendente')
        .reduce((sum, c) => sum + Number(c.valor || 0), 0);
      const comissoesPagas = comissoes
        .filter(c => c.status === 'pago')
        .reduce((sum, c) => sum + Number(c.valor || 0), 0);

      // ============= ALERTAS =============
      const alertasPendentes = alertas.length;
      const alertasCriticos = alertas
        .filter(a => a.prioridade === 'critica' || a.prioridade === 'alta')
        .slice(0, 10);

      // ============= PRODUTIVIDADE =============
      const producaoMap = new Map<string, {
        id: string;
        nome: string;
        processos: number;
        protocolos: number;
        baus: number;
        atrasados: number;
      }>();

      funcionarios.forEach(f => {
        producaoMap.set(f.id, {
          id: f.id,
          nome: f.nome,
          processos: 0,
          protocolos: 0,
          baus: 0,
          atrasados: 0,
        });
      });

      // Contar processos judiciais por responsável
      processosJudiciais.forEach(p => {
        if (p.responsavel_id && producaoMap.has(p.responsavel_id)) {
          const atual = producaoMap.get(p.responsavel_id)!;
          atual.processos++;
          if (p.processo_parado || p.processo_critico) atual.atrasados++;
        }
      });

      // Contar protocolos
      protocolos.forEach(p => {
        if (p.funcionario_id && producaoMap.has(p.funcionario_id)) {
          const atual = producaoMap.get(p.funcionario_id)!;
          atual.protocolos++;
          const dias = calcularDiasParadoProtocolo(p);
          if (dias >= 15) atual.atrasados++;
        }
      });

      // Contar BAUs
      bausComDias.forEach(b => {
        if (b.responsavel_id && producaoMap.has(b.responsavel_id)) {
          const atual = producaoMap.get(b.responsavel_id)!;
          atual.baus++;
          if (b.diasCorridos >= 10 && !['recebido', 'validado'].includes(b.status)) {
            atual.atrasados++;
          }
        }
      });

      const producaoPorAnalista = Array.from(producaoMap.values())
        .filter(a => a.processos > 0 || a.protocolos > 0 || a.baus > 0)
        .sort((a, b) => 
          (b.processos + b.protocolos + b.baus) - (a.processos + a.protocolos + a.baus)
        )
        .slice(0, 10);

      // ============= MÉTRICAS HOJE =============
      const metricasHoje = {
        protocolosHoje,
        periciasHoje,
        bausHoje,
        pagamentosHoje,
        clientesHoje,
      };

      return {
        // Clientes
        totalClientes,
        clientesNovosMes,
        
        // Processos Gerais
        totalProcessos,
        processosAtivos,
        processosEmAlerta,
        processosCriticos,
        processosConcluidos,
        
        // Processos Judiciais
        processosJudiciaisAtivos,
        processosJudiciaisParados7,
        processosJudiciaisParados15,
        processosJudiciaisParados30,
        
        // Protocolos
        protocolosAtivos,
        protocolosParados7,
        protocolosParados15,
        protocolosParados30,
        protocolosSemResposta,
        
        // BAU
        bausTotal,
        bausEmAndamento,
        bausMais10Dias,
        bausCriticos,
        bausRecebidosMes,
        bausIncompletos,
        hospitaisCriticos,
        
        // Perícias
        periciasAgendadas,
        periciasAguardandoPagamento,
        periciasClienteFaltou,
        juntasMedicas,
        periciasProximas,
        
        // Financeiro
        valorTotalEmAnalise,
        valorPendente,
        valorRecebido,
        valorEmAtraso,
        comissoesPendentes,
        comissoesPagas,
        
        // Por tipo
        processosPorTipo,
        financeiroPortTipo,
        
        // Alertas
        alertasPendentes,
        alertasCriticos,
        
        // Produtividade
        producaoPorAnalista,
        
        // Métricas do dia
        metricasHoje,
        
        // Listas rápidas
        processosParadosLista,
        bausPendentesLista,
        periciasProximasLista,
      };
    },
    refetchInterval: 30000, // Atualizar a cada 30 segundos
  });
}
