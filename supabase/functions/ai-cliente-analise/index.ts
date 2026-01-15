import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `Você é um ADVOGADO-ANALISTA DIGITAL SÊNIOR especializado em:
- DPVAT (acidentes até 15/11/2023)
- Seguros (vida, AP, prestamista, auto, empresarial, cartão, banco, fintech)
- Previdenciário (INSS: auxílio-doença, auxílio-acidente, BPC/LOAS, aposentadoria por incapacidade)
- Trabalhista (acidente de trabalho, trajeto, estabilidade, CAT, reintegração, danos)
- Responsabilidade civil (danos materiais, morais, lucros cessantes, pensionamento)

VOCÊ NÃO promete valores, NÃO altera dados e NÃO cria processos automaticamente.

Analise os dados do cliente e as observações do analista para gerar um relatório estruturado.

FORMATO OBRIGATÓRIO DA RESPOSTA:

📌 **RESUMO DO OCORRIDO**
[Síntese objetiva do que aconteceu]

🚗 **DADOS RELEVANTES IDENTIFICADOS**
- Veículo envolvido: [sim/não/não informado]
- Financiamento: [sim/não/não sabe]
- Terceiros envolvidos: [sim/não/não sabe]
- Tipo de acidente: [tipo]
- Perfil do cliente: [perfil]

💰 **INDENIZAÇÕES E DIREITOS POSSÍVEIS**
Para cada direito identificado, indique:
- [DIREITO] — Chance: [ALTA/MÉDIA/BAIXA] - [Justificativa breve]

Direitos a considerar:
- DPVAT (se acidente até 15/11/2023 e houver sequela/invalidez)
- Auxílio-Doença (INSS)
- Auxílio-Acidente (se redução de capacidade)
- Seguro de Vida/AP (se existir vínculo contratual)
- Ação Trabalhista (se CLT + acidente de trabalho)
- Danos Materiais/Morais (se terceiro responsável)
- Previdenciário

⚠️ **ALERTAS IMPORTANTES**
- Documentos necessários
- Riscos identificados
- Pontos de atenção jurídica
- Pendências no cadastro

✅ **PRÓXIMOS PASSOS RECOMENDADOS**
1. [Ação específica]
2. [Módulo a acionar: perícia/BAU/financeiro/judicial]
3. [Documentos a solicitar]`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { cliente, observacao } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY não configurada");
    }

    // Construir prompt com dados do cliente
    const clienteInfo = `
DADOS DO CLIENTE:
- Nome: ${cliente.name || 'Não informado'}
- CPF: ${cliente.cpf || 'Não informado'}
- Data de Nascimento: ${cliente.birth_date || 'Não informado'}
- Telefone: ${cliente.phone1 || 'Não informado'}
- Email: ${cliente.email || 'Não informado'}

DADOS DO ACIDENTE:
- Data: ${cliente.accident_date || 'Não informado'}
- Tipo: ${cliente.accident_type || 'Não informado'}
- Local: ${cliente.accident_location || 'Não informado'}
- Possui B.O.: ${cliente.has_police_report ? 'Sim' : cliente.has_police_report === false ? 'Não' : 'Não informado'}

DADOS MÉDICOS:
- Lesões: ${cliente.injuries || 'Não informado'}
- CID: ${cliente.cid_code || 'Não informado'}
- Parte afetada: ${cliente.body_part_affected || 'Não informado'}
- Gravidade: ${cliente.injury_severity || 'Não informado'}
- Sequelas: ${cliente.has_sequelae ? 'Sim' : cliente.has_sequelae === false ? 'Não' : 'Não informado'}
- % Invalidez: ${cliente.disability_percentage || 'Não informado'}
- Hospital: ${cliente.admission_hospital || 'Não informado'}
- Internação: ${cliente.was_hospitalized ? 'Sim' : cliente.was_hospitalized === false ? 'Não' : 'Não informado'}
- Dias internado: ${cliente.hospitalization_days || 'Não informado'}
- Cirurgia: ${cliente.had_surgery ? 'Sim' : cliente.had_surgery === false ? 'Não' : 'Não informado'}

DADOS TRABALHISTAS:
- CLT: ${cliente.is_clt ? 'Sim' : cliente.is_clt === false ? 'Não' : 'Não informado'}
- Empresa: ${cliente.company_name || 'Não informado'}

OBSERVAÇÕES EXISTENTES:
${cliente.notes || 'Nenhuma observação anterior'}

---

OBSERVAÇÃO DO ANALISTA (TEXTO ATUAL):
${observacao || 'Nenhuma observação fornecida'}
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
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: clienteInfo },
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
    const resultado = aiData.choices?.[0]?.message?.content || "Análise não disponível.";

    return new Response(
      JSON.stringify({ resultado }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Erro:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
