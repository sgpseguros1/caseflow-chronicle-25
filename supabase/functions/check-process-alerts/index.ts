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
    const errors: string[] = [];

    // 1. Buscar movimentações não lidas
    const { data: movimentacoesNaoLidas, error: movError } = await supabase
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
      .limit(100);

    if (movError) {
      console.error('Erro ao buscar movimentações:', movError);
      errors.push(`Movimentações: ${movError.message}`);
    }

    // Criar alertas para movimentações não lidas
    if (movimentacoesNaoLidas && movimentacoesNaoLidas.length > 0) {
      for (const mov of movimentacoesNaoLidas) {
        const processoData = mov.processos_sincronizados;
        const processo = Array.isArray(processoData) ? processoData[0] : processoData;
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
    }

    // 2. Buscar prazos fatais próximos
    const dataLimite = new Date();
    dataLimite.setDate(dataLimite.getDate() + dias_prazo);
    const dataLimiteStr = dataLimite.toISOString().split('T')[0];

    const { data: prazosProximos, error: prazoError } = await supabase
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
      .order('prazo_fatal', { ascending: true });

    if (prazoError) {
      console.error('Erro ao buscar prazos:', prazoError);
      errors.push(`Prazos: ${prazoError.message}`);
    }

    // Criar alertas para prazos próximos
    if (prazosProximos && prazosProximos.length > 0) {
      for (const prazo of prazosProximos) {
        const processoData = prazo.processos_sincronizados;
        const processo = Array.isArray(processoData) ? processoData[0] : processoData;
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
    }

    // 3. Verificar processos sem movimentação há muito tempo (processos parados)
    const dataParado = new Date();
    dataParado.setDate(dataParado.getDate() - 30);

    const { data: processosParados, error: paradoError } = await supabase
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
      .limit(50);

    if (paradoError) {
      console.error('Erro ao buscar processos parados:', paradoError);
      errors.push(`Processos parados: ${paradoError.message}`);
    }

    // Criar alertas para processos parados
    if (processosParados && processosParados.length > 0) {
      for (const processo of processosParados) {
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
    }

    return new Response(
      JSON.stringify({
        message: 'Verificação de alertas concluída',
        alertas_criados: alertasCriados,
        movimentacoes_nao_lidas: movimentacoesNaoLidas?.length || 0,
        prazos_proximos: prazosProximos?.length || 0,
        processos_parados: processosParados?.length || 0,
        errors: errors.length > 0 ? errors : undefined,
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
