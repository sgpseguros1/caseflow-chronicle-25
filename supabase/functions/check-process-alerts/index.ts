import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variáveis do Supabase não configuradas');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const body = await req.json().catch(() => ({}));
    const { dias_prazo = 5 } = body;

    let alertasCriados = 0;
    let totalMovimentacoes = 0;
    let totalPrazos = 0;
    let totalParados = 0;
    const errors: string[] = [];

    // 1. Buscar TODAS as movimentações não lidas com paginação
    console.log('Buscando movimentações não lidas...');
    let page = 0;
    const pageSize = 1000;
    let hasMoreMovs = true;
    const todasMovimentacoes: Array<{
      id: string;
      processo_id: string;
      data_movimento: string;
      descricao: string;
      prazo_fatal: string | null;
      prazo_dias: number | null;
      urgente: boolean | null;
      lido: boolean | null;
      processos_sincronizados: { numero_processo: string; tribunal: string } | null;
    }> = [];
    
    while (hasMoreMovs) {
      const { data: movimentacoes, error: movError } = await supabase
        .from('movimentacoes_processo')
        .select(`
          id,
          processo_id,
          data_movimento,
          descricao,
          prazo_fatal,
          prazo_dias,
          urgente,
          lido,
          processos_sincronizados (
            numero_processo,
            tribunal
          )
        `)
        .eq('lido', false)
        .order('data_movimento', { ascending: false })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (movError) {
        console.error('Erro ao buscar movimentações:', movError);
        errors.push(`Movimentações página ${page}: ${movError.message}`);
        break;
      }

      if (movimentacoes && movimentacoes.length > 0) {
        todasMovimentacoes.push(...movimentacoes.map(m => ({
          ...m,
          processos_sincronizados: Array.isArray(m.processos_sincronizados) 
            ? m.processos_sincronizados[0] 
            : m.processos_sincronizados
        })));
        hasMoreMovs = movimentacoes.length === pageSize;
        page++;
      } else {
        hasMoreMovs = false;
      }
    }

    totalMovimentacoes = todasMovimentacoes.length;
    console.log(`Total de movimentações não lidas: ${totalMovimentacoes}`);

    // Criar alertas para movimentações não lidas
    for (const mov of todasMovimentacoes) {
      const processo = mov.processos_sincronizados;
      if (!processo) continue;

      // Verificar se já existe alerta para esta movimentação
      const { data: alertaExistente } = await supabase
        .from('alertas')
        .select('id')
        .eq('tipo', 'movimentacao_nova')
        .ilike('descricao', `%${mov.id}%`)
        .maybeSingle();

      if (!alertaExistente) {
        const { error: insertError } = await supabase
          .from('alertas')
          .insert({
            tipo: 'movimentacao_nova',
            titulo: `Nova movimentação: ${processo.numero_processo}`,
            descricao: `${mov.descricao} (ID: ${mov.id})`,
            prioridade: mov.urgente ? 'alta' : 'normal',
            status: 'pendente',
          });

        if (insertError) {
          console.error('Erro ao criar alerta de movimentação:', insertError);
          errors.push(`Alerta mov ${mov.id}: ${insertError.message}`);
        } else {
          alertasCriados++;
        }
      }
    }

    // 2. Buscar TODOS os prazos fatais próximos com paginação
    console.log('Buscando prazos próximos...');
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + dias_prazo);
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];

    page = 0;
    let hasMorePrazos = true;
    const todosPrazos: Array<{
      id: string;
      processo_id: string;
      data_movimento: string;
      descricao: string;
      prazo_fatal: string | null;
      prazo_dias: number | null;
      processos_sincronizados: { numero_processo: string; tribunal: string } | null;
    }> = [];

    while (hasMorePrazos) {
      const { data: prazos, error: prazoError } = await supabase
        .from('movimentacoes_processo')
        .select(`
          id,
          processo_id,
          data_movimento,
          descricao,
          prazo_fatal,
          prazo_dias,
          processos_sincronizados (
            numero_processo,
            tribunal
          )
        `)
        .not('prazo_fatal', 'is', null)
        .gte('prazo_fatal', new Date().toISOString().split('T')[0])
        .lte('prazo_fatal', dataLimiteStr)
        .order('prazo_fatal', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (prazoError) {
        console.error('Erro ao buscar prazos:', prazoError);
        errors.push(`Prazos página ${page}: ${prazoError.message}`);
        break;
      }

      if (prazos && prazos.length > 0) {
        todosPrazos.push(...prazos.map(p => ({
          ...p,
          processos_sincronizados: Array.isArray(p.processos_sincronizados) 
            ? p.processos_sincronizados[0] 
            : p.processos_sincronizados
        })));
        hasMorePrazos = prazos.length === pageSize;
        page++;
      } else {
        hasMorePrazos = false;
      }
    }

    totalPrazos = todosPrazos.length;
    console.log(`Total de prazos próximos: ${totalPrazos}`);

    // Criar alertas para prazos próximos
    for (const prazo of todosPrazos) {
      const processo = prazo.processos_sincronizados;
      if (!processo || !prazo.prazo_fatal) continue;

      const diasRestantes = Math.ceil(
        (new Date(prazo.prazo_fatal).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      // Verificar se já existe alerta para este prazo
      const { data: alertaExistente } = await supabase
        .from('alertas')
        .select('id')
        .eq('tipo', 'prazo_fatal')
        .ilike('descricao', `%${prazo.id}%`)
        .eq('status', 'pendente')
        .maybeSingle();

      if (!alertaExistente) {
        const prioridade = diasRestantes <= 2 ? 'critica' : diasRestantes <= 3 ? 'alta' : 'normal';

        const { error: insertError } = await supabase
          .from('alertas')
          .insert({
            tipo: 'prazo_fatal',
            titulo: `Prazo em ${diasRestantes} dia(s): ${processo.numero_processo}`,
            descricao: `${prazo.descricao} - Prazo: ${prazo.prazo_fatal} (ID: ${prazo.id})`,
            prioridade: prioridade,
            status: 'pendente',
          });

        if (insertError) {
          console.error('Erro ao criar alerta de prazo:', insertError);
          errors.push(`Alerta prazo ${prazo.id}: ${insertError.message}`);
        } else {
          alertasCriados++;
        }
      }
    }

    // 3. Verificar TODOS os processos sem movimentação há muito tempo (processos parados)
    console.log('Buscando processos parados...');
    const dataParado = new Date();
    dataParado.setDate(dataParado.getDate() - 30);

    page = 0;
    let hasMoreParados = true;
    const todosParados: Array<{
      id: string;
      numero_processo: string;
      tribunal: string | null;
      classe_processual: string | null;
      ultimo_movimento: string | null;
      data_ultimo_movimento: string | null;
    }> = [];

    while (hasMoreParados) {
      const { data: parados, error: paradoError } = await supabase
        .from('processos_sincronizados')
        .select(`
          id,
          numero_processo,
          tribunal,
          classe_processual,
          ultimo_movimento,
          data_ultimo_movimento
        `)
        .lt('data_ultimo_movimento', dataParado.toISOString())
        .order('data_ultimo_movimento', { ascending: true })
        .range(page * pageSize, (page + 1) * pageSize - 1);

      if (paradoError) {
        console.error('Erro ao buscar processos parados:', paradoError);
        errors.push(`Processos parados página ${page}: ${paradoError.message}`);
        break;
      }

      if (parados && parados.length > 0) {
        todosParados.push(...parados);
        hasMoreParados = parados.length === pageSize;
        page++;
      } else {
        hasMoreParados = false;
      }
    }

    totalParados = todosParados.length;
    console.log(`Total de processos parados: ${totalParados}`);

    // Criar alertas para processos parados
    for (const processo of todosParados) {
      if (!processo.data_ultimo_movimento) continue;

      const diasParado = Math.ceil(
        (new Date().getTime() - new Date(processo.data_ultimo_movimento).getTime()) / (1000 * 60 * 60 * 24)
      );

      // Verificar se já existe alerta para este processo parado
      const { data: alertaExistente } = await supabase
        .from('alertas')
        .select('id')
        .eq('tipo', 'processo_parado')
        .ilike('titulo', `%${processo.numero_processo}%`)
        .eq('status', 'pendente')
        .maybeSingle();

      if (!alertaExistente) {
        const { error: insertError } = await supabase
          .from('alertas')
          .insert({
            tipo: 'processo_parado',
            titulo: `Processo parado há ${diasParado} dias`,
            descricao: `Processo ${processo.numero_processo} (${processo.tribunal || 'N/A'}) sem movimentação desde ${processo.data_ultimo_movimento}`,
            prioridade: diasParado > 60 ? 'alta' : 'normal',
            status: 'pendente',
          });

        if (insertError) {
          console.error('Erro ao criar alerta de processo parado:', insertError);
          errors.push(`Alerta parado ${processo.id}: ${insertError.message}`);
        } else {
          alertasCriados++;
        }
      }
    }

    console.log(`Verificação concluída: ${alertasCriados} alertas criados`);

    return new Response(
      JSON.stringify({
        message: 'Verificação de alertas concluída',
        alertas_criados: alertasCriados,
        movimentacoes_nao_lidas: totalMovimentacoes,
        prazos_proximos: totalPrazos,
        processos_parados: totalParados,
        errors: errors.length > 0 ? errors.slice(0, 50) : undefined,
        has_more_errors: errors.length > 50,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na verificação de alertas:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
