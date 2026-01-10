import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPTS: Record<string, string> = {
  atendimento: `Você é um assistente jurídico especializado em atendimento a clientes de um escritório de advocacia.
Sua função é ajudar a elaborar respostas profissionais, claras e empáticas para clientes que perguntam sobre:
- Status de processos (DPVAT, INSS, Seguro de Vida, Danos, Judiciais)
- Prazos e próximos passos
- Documentação necessária
- Valores e pagamentos

Sempre mantenha um tom profissional mas acolhedor. Não prometa resultados específicos.
Responda em português brasileiro.`,

  cobranca: `Você é um assistente especializado em cobrança de documentos para processos jurídicos.
Sua função é gerar mensagens educadas mas assertivas para solicitar:
- Documentos pendentes
- Assinaturas necessárias
- Comprovantes e certidões

Mantenha tom profissional e urgente quando necessário, mas sempre respeitoso.
Responda em português brasileiro.`,

  producao: `Você é um assistente de análise de produtividade para escritórios de advocacia.
Sua função é ajudar gestores a:
- Analisar produtividade de analistas
- Identificar processos parados
- Sugerir melhorias de fluxo de trabalho
- Gerar insights sobre métricas

Baseie suas análises em dados concretos quando fornecidos.
Responda em português brasileiro.`,

  financeiro: `Você é um assistente de análise financeira para escritórios de advocacia.
Sua função é ajudar com:
- Previsões de recebimento
- Análise de honorários
- Alertas de pagamentos pendentes
- Análise de rentabilidade por tipo de processo

Seja preciso e baseie-se em dados quando fornecidos.
Responda em português brasileiro.`
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, type = 'atendimento' } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    const systemPrompt = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.atendimento;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded" }), 
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "Payment required" }), 
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI Gateway error:", response.status, errorText);
      throw new Error(`AI Gateway error: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.choices?.[0]?.message?.content || "Sem resposta";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in ai-assistant:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
