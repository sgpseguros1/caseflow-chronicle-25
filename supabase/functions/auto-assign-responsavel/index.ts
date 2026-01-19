import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ProtocoloSemResponsavel {
  id: string;
  codigo: number;
  tipo: string;
  status: string;
  cliente_id: string;
  cliente_nome?: string;
  dias_parado: number;
  data_ultima_movimentacao: string | null;
}

interface HistoricoItem {
  usuario_id: string;
  created_at: string;
  usuario_nome?: string;
  usuario_email?: string;
  funcionario_id?: string;
}

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
    const { enviar_alerta = true, dias_critico = 30 } = body;

    let protocolosProcessados = 0;
    let alertasCriados = 0;
    let atribuicoesRealizadas = 0;
    const errors: string[] = [];
    const resultados: Array<{
      protocolo_id: string;
      codigo: number;
      acao: string;
      responsavel_atribuido?: string;
    }> = [];

    console.log('Iniciando verificação de protocolos sem responsável...');

    // 1. Buscar protocolos sem responsável (funcionario_id IS NULL)
    const { data: protocolosSemResp, error: protocolosError } = await supabase
      .from('protocolos')
      .select(`
        id,
        codigo,
        tipo,
        status,
        cliente_id,
        data_ultima_movimentacao,
        clients(name)
      `)
      .is('funcionario_id', null)
      .not('status', 'in', '("encerrado","arquivado","cancelado")')
      .order('data_ultima_movimentacao', { ascending: true, nullsFirst: true });

    if (protocolosError) {
      throw new Error(`Erro ao buscar protocolos: ${protocolosError.message}`);
    }

    console.log(`Encontrados ${protocolosSemResp?.length || 0} protocolos sem responsável`);

    // Processar cada protocolo
    for (const protocolo of protocolosSemResp || []) {
      protocolosProcessados++;
      const clienteNome = (protocolo.clients as any)?.name || 'Cliente não identificado';
      
      // Calcular dias parado
      const diasParado = protocolo.data_ultima_movimentacao
        ? Math.floor((Date.now() - new Date(protocolo.data_ultima_movimentacao).getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      // 2. Buscar última interação no histórico do protocolo
      const { data: historico } = await supabase
        .from('protocolo_historico')
        .select('usuario_id, created_at')
        .eq('protocolo_id', protocolo.id)
        .not('usuario_id', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1);

      let responsavelAtribuido: { id: string; nome: string } | null = null;
      let usuarioUltimaInteracao: string | null = null;

      if (historico && historico.length > 0) {
        usuarioUltimaInteracao = historico[0].usuario_id;

        // Buscar funcionário associado ao usuário
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, funcionario_id')
          .eq('id', usuarioUltimaInteracao)
          .single();

        if (profile?.funcionario_id) {
          // Verificar se funcionário está ativo
          const { data: funcionario } = await supabase
            .from('funcionarios')
            .select('id, nome, status')
            .eq('id', profile.funcionario_id)
            .eq('status', 'ativo')
            .is('deleted_at', null)
            .single();

          if (funcionario) {
            responsavelAtribuido = { id: funcionario.id, nome: funcionario.nome };
          }
        } else if (profile) {
          // Se não tem funcionário associado, tenta buscar por email
          const { data: funcionarioPorEmail } = await supabase
            .from('funcionarios')
            .select('id, nome, status')
            .eq('email', profile.name)
            .eq('status', 'ativo')
            .is('deleted_at', null)
            .single();

          if (funcionarioPorEmail) {
            responsavelAtribuido = { id: funcionarioPorEmail.id, nome: funcionarioPorEmail.nome };
          }
        }
      }

      // Se não encontrou no histórico, buscar no log de workflow do cliente
      if (!responsavelAtribuido) {
        const { data: workflowLog } = await supabase
          .from('client_workflow_log')
          .select('usuario_id, created_at')
          .not('usuario_id', 'is', null)
          .order('created_at', { ascending: false })
          .limit(1);

        if (workflowLog && workflowLog.length > 0) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('funcionario_id')
            .eq('id', workflowLog[0].usuario_id)
            .single();

          if (profile?.funcionario_id) {
            const { data: funcionario } = await supabase
              .from('funcionarios')
              .select('id, nome')
              .eq('id', profile.funcionario_id)
              .eq('status', 'ativo')
              .is('deleted_at', null)
              .single();

            if (funcionario) {
              responsavelAtribuido = { id: funcionario.id, nome: funcionario.nome };
            }
          }
        }
      }

      // 3. Atribuir responsável se encontrado
      if (responsavelAtribuido) {
        const { error: updateError } = await supabase
          .from('protocolos')
          .update({ 
            funcionario_id: responsavelAtribuido.id,
            updated_at: new Date().toISOString()
          })
          .eq('id', protocolo.id);

        if (updateError) {
          errors.push(`Erro ao atribuir protocolo ${protocolo.codigo}: ${updateError.message}`);
          continue;
        }

        atribuicoesRealizadas++;

        // Registrar no log de atribuição automática
        await supabase.from('atribuicao_automatica_log').insert({
          protocolo_id: protocolo.id,
          responsavel_novo_id: responsavelAtribuido.id,
          motivo: 'Atribuição automática baseada na última interação',
          usuario_ultima_interacao: usuarioUltimaInteracao,
        });

        // Registrar no histórico do protocolo
        await supabase.from('protocolo_historico').insert({
          protocolo_id: protocolo.id,
          campo_alterado: 'funcionario_id',
          valor_anterior: null,
          valor_novo: responsavelAtribuido.id,
          observacao: `[AUTOMÁTICO] Responsável atribuído automaticamente: ${responsavelAtribuido.nome}`,
        });

        resultados.push({
          protocolo_id: protocolo.id,
          codigo: protocolo.codigo,
          acao: 'atribuido',
          responsavel_atribuido: responsavelAtribuido.nome,
        });

        // 4. Criar alerta crítico se dias parado >= limite
        if (enviar_alerta && diasParado >= dias_critico) {
          // Buscar profile do funcionário para enviar alerta
          const { data: funcionarioProfile } = await supabase
            .from('funcionarios')
            .select('user_id')
            .eq('id', responsavelAtribuido.id)
            .single();

          const { error: alertaError } = await supabase.from('alertas').insert({
            tipo: 'atribuicao_automatica',
            titulo: `Alerta Crítico: Protocolo ${protocolo.codigo} em Risco!`,
            descricao: `O protocolo do cliente **${clienteNome}** (Código: ${protocolo.codigo}) foi atribuído automaticamente a você. Está parado há ${diasParado} dias e requer atenção imediata.`,
            prioridade: diasParado >= 60 ? 'critica' : diasParado >= 45 ? 'alta' : 'normal',
            status: 'pendente',
            protocolo_id: protocolo.id,
            funcionario_id: responsavelAtribuido.id,
            usuario_alvo_id: funcionarioProfile?.user_id || null,
            atribuicao_automatica: true,
            responsavel_atribuido_id: responsavelAtribuido.id,
          });

          if (!alertaError) {
            alertasCriados++;
          } else {
            errors.push(`Erro ao criar alerta para protocolo ${protocolo.codigo}: ${alertaError.message}`);
          }
        }
      } else {
        // Não encontrou responsável para atribuir, apenas criar alerta se crítico
        if (enviar_alerta && diasParado >= dias_critico) {
          // Verificar se já existe alerta pendente para este protocolo
          const { data: alertaExistente } = await supabase
            .from('alertas')
            .select('id')
            .eq('tipo', 'sem_responsavel')
            .eq('protocolo_id', protocolo.id)
            .eq('status', 'pendente')
            .maybeSingle();

          if (!alertaExistente) {
            await supabase.from('alertas').insert({
              tipo: 'sem_responsavel',
              titulo: `Protocolo ${protocolo.codigo} SEM RESPONSÁVEL`,
              descricao: `O protocolo do cliente **${clienteNome}** (Código: ${protocolo.codigo}) está há ${diasParado} dias SEM RESPONSÁVEL atribuído. Não foi possível identificar automaticamente um responsável.`,
              prioridade: diasParado >= 60 ? 'critica' : diasParado >= 45 ? 'alta' : 'normal',
              status: 'pendente',
              protocolo_id: protocolo.id,
              atribuicao_automatica: false,
            });
            alertasCriados++;
          }
        }

        resultados.push({
          protocolo_id: protocolo.id,
          codigo: protocolo.codigo,
          acao: 'sem_historico',
        });
      }
    }

    console.log(`Processamento concluído: ${atribuicoesRealizadas} atribuições, ${alertasCriados} alertas`);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Verificação de atribuição automática concluída',
        protocolos_processados: protocolosProcessados,
        atribuicoes_realizadas: atribuicoesRealizadas,
        alertas_criados: alertasCriados,
        resultados: resultados.slice(0, 20),
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na atribuição automática:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
