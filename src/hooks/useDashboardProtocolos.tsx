import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { TipoProtocolo, StatusProtocolo } from '@/types/protocolo';

export interface DashboardProtocoloStats {
  // Totais
  totalProtocolos: number;
  protocolosAtivos: number;
  protocolosEncerrados: number;
  
  // Por natureza
  administrativos: number;
  judiciais: number;
  
  // Por tipo
  porTipo: { tipo: TipoProtocolo; quantidade: number; cor: string }[];
  auxilioAcidenteAtivos: number;
  dpvatEmAnalise: number;
  
  // Por status
  porStatus: { status: StatusProtocolo; quantidade: number }[];
  novos: number;
  emAndamento: number;
  aguardandoPagamento: number;
  pagos: number;
  
  // Tempo
  paradosMais30Dias: number;
  paradosMais45Dias: number;
  paradosMais60Dias: number;
  comRisco: number;
  
  // Financeiro
  valorTotalEstimado: number;
  valorTotalRecebido: number;
  valorPendente: number;
  prejuizoAcumulado: number;
  
  // Por seguradora
  porSeguradora: { nome: string; quantidade: number; valor: number }[];
  
  // Por funcionário
  porFuncionario: { nome: string; quantidade: number; paradosMais30: number }[];
  
  // Alertas
  alertasAtivos: number;
  alertasCriticos: number;
  
  // Protocolos recentes
  protocolosRecentes: any[];
  
  // Alertas pendentes
  alertasPendentes: any[];
  
  // KPIs
  tempoMedioPorTipo: { tipo: string; dias: number }[];
  taxaJudicializacao: number;
  taxaSucesso: number;
}

const TIPO_COLORS: Record<TipoProtocolo, string> = {
  AUXILIO_ACIDENTE: '#8b5cf6',
  DPVAT: '#3b82f6',
  SEGURO_VIDA: '#10b981',
  SEGURO_VIDA_EMPRESARIAL: '#059669',
  DANOS_ADMINISTRATIVO: '#f97316',
  JUDICIAL: '#e11d48',
  PREVIDENCIARIO: '#f59e0b',
  JUDICIAL_CIVEL: '#ef4444',
  ADMINISTRATIVO_SEGURADORA: '#06b6d4',
  RAFAEL_PROTOCOLAR: '#4f46e5',
  INSS: '#14b8a6',
};

export function useDashboardProtocolos() {
  return useQuery({
    queryKey: ['dashboard-protocolos'],
    queryFn: async (): Promise<DashboardProtocoloStats> => {
      // Buscar protocolos com relacionamentos
      const { data: protocolos, error } = await supabase
        .from('protocolos')
        .select(`
          *,
          cliente:clients(name),
          seguradora:seguradoras(razao_social),
          funcionario:funcionarios(nome),
          financeiro:protocolo_financeiro(valor_estimado, valor_recebido, prejuizo_registrado)
        `);
      
      if (error) throw error;
      
      // Buscar alertas ativos
      const { data: alertas } = await supabase
        .from('protocolo_alertas')
        .select('*, protocolo:protocolos(codigo, tipo, cliente:clients(name))')
        .eq('status', 'ativo')
        .order('created_at', { ascending: false })
        .limit(10);
      
      const lista = protocolos || [];
      const now = Date.now();
      
      // Calcular dias parado para cada protocolo
      const protocolosComDias = lista.map(p => ({
        ...p,
        diasParado: p.data_ultima_movimentacao 
          ? Math.floor((now - new Date(p.data_ultima_movimentacao).getTime()) / (1000 * 60 * 60 * 24))
          : 0,
      }));
      
      // Totais
      const totalProtocolos = lista.length;
      const statusEncerrados = ['encerrado_sucesso', 'encerrado_prejuizo', 'arquivado'];
      const protocolosEncerrados = lista.filter(p => statusEncerrados.includes(p.status)).length;
      const protocolosAtivos = totalProtocolos - protocolosEncerrados;
      
      // Por natureza
      const administrativos = lista.filter(p => p.natureza === 'ADMINISTRATIVO').length;
      const judiciais = lista.filter(p => p.natureza === 'JUDICIAL').length;
      
      // Por tipo
      const tipoCount: Record<string, number> = {};
      lista.forEach(p => {
        tipoCount[p.tipo] = (tipoCount[p.tipo] || 0) + 1;
      });
      const porTipo = Object.entries(tipoCount).map(([tipo, quantidade]) => ({
        tipo: tipo as TipoProtocolo,
        quantidade,
        cor: TIPO_COLORS[tipo as TipoProtocolo] || '#64748b',
      }));
      
      const auxilioAcidenteAtivos = lista.filter(p => 
        p.tipo === 'AUXILIO_ACIDENTE' && !statusEncerrados.includes(p.status)
      ).length;
      
      const dpvatEmAnalise = lista.filter(p => 
        p.tipo === 'DPVAT' && p.status === 'em_analise'
      ).length;
      
      // Por status
      const statusCount: Record<string, number> = {};
      lista.forEach(p => {
        statusCount[p.status] = (statusCount[p.status] || 0) + 1;
      });
      const porStatus = Object.entries(statusCount).map(([status, quantidade]) => ({
        status: status as StatusProtocolo,
        quantidade,
      }));
      
      const novos = statusCount['novo'] || 0;
      const emAndamento = statusCount['em_andamento'] || 0;
      const aguardandoPagamento = statusCount['aguardando_pagamento'] || 0;
      const pagos = statusCount['pago'] || 0;
      
      // Tempo parado
      const paradosMais30Dias = protocolosComDias.filter(p => 
        p.diasParado >= 30 && !statusEncerrados.includes(p.status)
      ).length;
      const paradosMais45Dias = protocolosComDias.filter(p => 
        p.diasParado >= 45 && !statusEncerrados.includes(p.status)
      ).length;
      const paradosMais60Dias = protocolosComDias.filter(p => 
        p.diasParado >= 60 && !statusEncerrados.includes(p.status)
      ).length;
      const comRisco = paradosMais45Dias;
      
      // Financeiro
      let valorTotalEstimado = 0;
      let valorTotalRecebido = 0;
      let prejuizoAcumulado = 0;
      
      lista.forEach(p => {
        const fin = Array.isArray(p.financeiro) ? p.financeiro[0] : p.financeiro;
        if (fin) {
          valorTotalEstimado += Number(fin.valor_estimado) || 0;
          valorTotalRecebido += Number(fin.valor_recebido) || 0;
          prejuizoAcumulado += Number(fin.prejuizo_registrado) || 0;
        }
      });
      const valorPendente = valorTotalEstimado - valorTotalRecebido;
      
      // Por seguradora
      const seguradoraData: Record<string, { quantidade: number; valor: number }> = {};
      lista.forEach(p => {
        const nome = p.seguradora?.razao_social || 'Sem seguradora';
        if (!seguradoraData[nome]) {
          seguradoraData[nome] = { quantidade: 0, valor: 0 };
        }
        seguradoraData[nome].quantidade++;
        const fin = Array.isArray(p.financeiro) ? p.financeiro[0] : p.financeiro;
        if (fin) {
          seguradoraData[nome].valor += Number(fin.valor_estimado) || 0;
        }
      });
      const porSeguradora = Object.entries(seguradoraData)
        .map(([nome, data]) => ({ nome, ...data }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10);
      
      // Por funcionário
      const funcionarioData: Record<string, { quantidade: number; paradosMais30: number }> = {};
      protocolosComDias.forEach(p => {
        if (!statusEncerrados.includes(p.status)) {
          const nome = p.funcionario?.nome || 'Sem responsável';
          if (!funcionarioData[nome]) {
            funcionarioData[nome] = { quantidade: 0, paradosMais30: 0 };
          }
          funcionarioData[nome].quantidade++;
          if (p.diasParado >= 30) {
            funcionarioData[nome].paradosMais30++;
          }
        }
      });
      const porFuncionario = Object.entries(funcionarioData)
        .map(([nome, data]) => ({ nome, ...data }))
        .sort((a, b) => b.quantidade - a.quantidade)
        .slice(0, 10);
      
      // Alertas
      const alertasAtivos = alertas?.length || 0;
      const alertasCriticos = alertas?.filter(a => a.nivel === 'critico' || a.nivel === 'urgente').length || 0;
      
      // Protocolos recentes
      const protocolosRecentes = lista
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 5)
        .map(p => ({
          id: p.id,
          codigo: p.codigo,
          tipo: p.tipo,
          status: p.status,
          cliente: p.cliente?.name || 'Sem cliente',
          dataProtocolo: p.data_protocolo,
        }));
      
      // KPIs
      // Tempo médio por tipo (apenas encerrados com sucesso)
      const encerradosSucesso = lista.filter(p => p.status === 'encerrado_sucesso');
      const tempoMedioPorTipoMap: Record<string, { total: number; count: number }> = {};
      encerradosSucesso.forEach(p => {
        if (p.data_protocolo && p.updated_at) {
          const dias = Math.floor(
            (new Date(p.updated_at).getTime() - new Date(p.data_protocolo).getTime()) / (1000 * 60 * 60 * 24)
          );
          if (!tempoMedioPorTipoMap[p.tipo]) {
            tempoMedioPorTipoMap[p.tipo] = { total: 0, count: 0 };
          }
          tempoMedioPorTipoMap[p.tipo].total += dias;
          tempoMedioPorTipoMap[p.tipo].count++;
        }
      });
      const tempoMedioPorTipo = Object.entries(tempoMedioPorTipoMap).map(([tipo, data]) => ({
        tipo,
        dias: Math.round(data.total / data.count),
      }));
      
      // Taxa de judicialização
      const judicializados = lista.filter(p => p.natureza === 'JUDICIAL').length;
      const taxaJudicializacao = totalProtocolos > 0 ? (judicializados / totalProtocolos) * 100 : 0;
      
      // Taxa de sucesso
      const encerrados = lista.filter(p => statusEncerrados.includes(p.status));
      const sucessos = encerrados.filter(p => p.status === 'encerrado_sucesso').length;
      const taxaSucesso = encerrados.length > 0 ? (sucessos / encerrados.length) * 100 : 0;
      
      return {
        totalProtocolos,
        protocolosAtivos,
        protocolosEncerrados,
        administrativos,
        judiciais,
        porTipo,
        auxilioAcidenteAtivos,
        dpvatEmAnalise,
        porStatus,
        novos,
        emAndamento,
        aguardandoPagamento,
        pagos,
        paradosMais30Dias,
        paradosMais45Dias,
        paradosMais60Dias,
        comRisco,
        valorTotalEstimado,
        valorTotalRecebido,
        valorPendente,
        prejuizoAcumulado,
        porSeguradora,
        porFuncionario,
        alertasAtivos,
        alertasCriticos,
        protocolosRecentes,
        alertasPendentes: alertas || [],
        tempoMedioPorTipo,
        taxaJudicializacao,
        taxaSucesso,
      };
    },
    refetchInterval: 30000,
  });
}
