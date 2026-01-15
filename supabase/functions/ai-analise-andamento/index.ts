import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT_ANDAMENTO = `Você é um ANALISTA JURÍDICO DIGITAL especializado em processos judiciais brasileiros.

Sua função é analisar andamentos processuais vindos de tribunais (PJe, e-SAJ, eproc, Projudi, DataJud).

REGRAS ABSOLUTAS:
1. NUNCA invente informações
2. NUNCA crie dados sem fonte oficial
3. SEMPRE baseie decisões em andamentos reais
4. NUNCA apague dados - apenas registre e evolua

AO ANALISAR UM ANDAMENTO, VOCÊ DEVE RETORNAR UM JSON COM:

{
  "gera_prazo": true/false,
  "quem_deve_agir": "autor" | "réu" | "ambas_partes" | "advogado" | "juiz" | "ninguém",
  "acao_exigida": "Descrição da ação jurídica exigida",
  "tipo_peca_provavel": "contestação" | "réplica" | "manifestação" | "recurso" | "embargos" | "petição" | "documentos" | "nenhuma",
  "categoria_andamento": "prazo_contestar" | "prazo_replica" | "prazo_manifestar" | "prazo_documentos" | "audiencia_designada" | "concluso_decisao" | "sentenca_proferida" | "processo_parado" | "aguardando_parte_contraria" | "arquivamento" | "pagamento_cumprimento" | "outros",
  "prazo_dias_uteis": número ou null,
  "urgencia": "baixa" | "media" | "alta" | "critica",
  "explicacao_simples": "Explicação em linguagem simples do que aconteceu",
  "acao_recomendada": "O que deve ser feito agora"
}

TERMOS QUE INDICAM PRAZO:
- "intime-se", "prazo", "manifestar", "apresentar", "juntar", "contestação", "réplica", "recurso", "15 dias", "10 dias", "5 dias"

PRAZOS PADRÃO:
- Contestação: 15 dias úteis
- Réplica: 15 dias úteis
- Manifestação genérica: 5 dias úteis
- Recurso ordinário: 15 dias úteis
- Embargos: 5 dias úteis
- Juntada de documentos: 5-15 dias úteis

Responda APENAS com o JSON, sem texto adicional.`;

const SYSTEM_PROMPT_PROCESSO = `Você é um ANALISTA JURÍDICO DIGITAL SÊNIOR.

Sua função é analisar um processo judicial completo e gerar um relatório executivo.

REGRAS ABSOLUTAS:
1. NUNCA invente informações
2. NUNCA crie dados sem fonte oficial
3. NUNCA prometa valores específicos
4. Você ORGANIZA, ALERTA e SUGERE - mas NÃO decide pelo advogado

AO ANALISAR UM PROCESSO, RETORNE UM JSON COM:

{
  "resumo_processo": "Síntese de 2-3 frases sobre do que se trata o processo",
  "fase_atual": "Fase processual atual (ex: instrução, julgamento, recurso, execução)",
  "o_que_falta_para_avancar": "O que precisa acontecer para o processo avançar",
  "entendimento_ia": "Explicação em linguagem simples do estado do processo",
  "acao_necessaria_agora": "Ação concreta que precisa ser feita imediatamente",
  "proxima_acao_sugerida": "Próximo passo recomendado (ex: apresentar réplica, aguardar sentença)",
  "risco_processual": "baixo" | "medio" | "alto",
  "impacto_financeiro": "sem_impacto" | "medio" | "alto",
  "depende_bau": true/false,
  "depende_cliente": true/false,
  "depende_pericia": true/false,
  "alertas": ["Lista de alertas importantes"],
  "pontos_atencao": ["Pontos que merecem atenção do advogado"]
}

Responda APENAS com o JSON, sem texto adicional.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tipo, andamento, processo, andamentos } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    if (tipo === "andamento" && andamento) {
      // Análise de andamento individual
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT_ANDAMENTO },
            { role: "user", content: `Analise este andamento processual:\n\n"${andamento.descricao}"\n\nData: ${andamento.data_andamento}\nCódigo movimento: ${andamento.codigo_movimento || 'N/A'}` },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Gateway error:", response.status, errorText);
        throw new Error(`Erro na API de IA: ${response.status}`);
      }

      const aiData = await response.json();
      const resultadoTexto = aiData.choices?.[0]?.message?.content || "{}";
      
      // Tentar parsear JSON
      let resultado;
      try {
        resultado = JSON.parse(resultadoTexto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
      } catch {
        resultado = {
          gera_prazo: false,
          categoria_andamento: "outros",
          explicacao_simples: resultadoTexto
        };
      }

      // Salvar análise no banco
      if (andamento.id && andamento.processo_id) {
        await supabase.from('andamentos_ia_analise').insert({
          andamento_id: andamento.id,
          processo_id: andamento.processo_id,
          texto_original: andamento.descricao,
          gera_prazo: resultado.gera_prazo || false,
          quem_deve_agir: resultado.quem_deve_agir,
          acao_exigida: resultado.acao_exigida,
          tipo_peca_provavel: resultado.tipo_peca_provavel,
          categoria_andamento: resultado.categoria_andamento,
          prazo_dias_uteis: resultado.prazo_dias_uteis,
          modelo_utilizado: 'google/gemini-3-flash-preview'
        });

        // Se gera prazo, atualizar o processo
        if (resultado.gera_prazo && resultado.prazo_dias_uteis) {
          const dataFinal = new Date();
          dataFinal.setDate(dataFinal.getDate() + resultado.prazo_dias_uteis);
          
          await supabase.from('processos_judiciais').update({
            prazo_aberto: true,
            tipo_prazo: resultado.tipo_peca_provavel,
            prazo_acao_quem: resultado.quem_deve_agir,
            prazo_data_final: dataFinal.toISOString().split('T')[0],
            prazo_dias_restantes: resultado.prazo_dias_uteis,
            proxima_acao: resultado.acao_recomendada || resultado.acao_exigida
          }).eq('id', andamento.processo_id);
        }
      }

      return new Response(
        JSON.stringify({ resultado }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );

    } else if (tipo === "processo" && processo) {
      // Análise completa do processo
      const andamentosTexto = andamentos?.map((a: any, i: number) => 
        `${i + 1}. [${a.data_andamento}] ${a.descricao}`
      ).join('\n') || 'Nenhum andamento disponível';

      const processoInfo = `
PROCESSO: ${processo.numero_processo}
TRIBUNAL: ${processo.tribunal || 'N/A'}
VARA: ${processo.vara || 'N/A'}
CLASSE: ${processo.classe_processual || 'N/A'}
STATUS ATUAL: ${processo.status || 'N/A'}
VALOR DA CAUSA: R$ ${processo.valor_causa || 0}
AUTOR: ${processo.autor_nome || 'N/A'}
RÉU: ${processo.reu_nome || 'N/A'}
ÚLTIMA MOVIMENTAÇÃO: ${processo.ultima_movimentacao || 'N/A'}
DATA ÚLTIMA MOVIMENTAÇÃO: ${processo.data_ultima_movimentacao || 'N/A'}

ANDAMENTOS RECENTES:
${andamentosTexto}
`;

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${LOVABLE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages: [
            { role: "system", content: SYSTEM_PROMPT_PROCESSO },
            { role: "user", content: processoInfo },
          ],
          stream: false,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI Gateway error:", response.status, errorText);
        throw new Error(`Erro na API de IA: ${response.status}`);
      }

      const aiData = await response.json();
      const resultadoTexto = aiData.choices?.[0]?.message?.content || "{}";
      
      let resultado;
      try {
        resultado = JSON.parse(resultadoTexto.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
      } catch {
        resultado = {
          resumo_processo: resultadoTexto,
          risco_processual: "nao_avaliado"
        };
      }

      // Atualizar processo com análise da IA
      await supabase.from('processos_judiciais').update({
        ia_resumo_processo: resultado.resumo_processo,
        ia_entendimento: resultado.entendimento_ia,
        ia_acao_necessaria: resultado.acao_necessaria_agora,
        ia_proxima_acao_sugerida: resultado.proxima_acao_sugerida,
        ia_risco_processual: resultado.risco_processual,
        ia_impacto_financeiro: resultado.impacto_financeiro,
        ia_depende_bau: resultado.depende_bau,
        ia_depende_cliente: resultado.depende_cliente,
        ia_depende_pericia: resultado.depende_pericia,
        ia_analisado_em: new Date().toISOString()
      }).eq('id', processo.id);

      // Salvar no histórico
      await supabase.from('processo_ia_historico').insert({
        processo_id: processo.id,
        tipo_analise: 'analise_completa',
        resultado_analise: resultado,
        modelo_utilizado: 'google/gemini-3-flash-preview'
      });

      return new Response(
        JSON.stringify({ resultado }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    throw new Error("Tipo de análise inválido");

  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
