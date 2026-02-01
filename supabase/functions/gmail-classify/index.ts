import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const CATEGORIAS = {
  'prazo_processual': ['prazo', 'intimação', 'ciência', 'manifestação', 'contestação', 'recurso', 'apelação'],
  'audiencia': ['audiência', 'audiencia', 'sessão', 'julgamento', 'oitiva'],
  'pagamento': ['pagamento', 'honorário', 'custas', 'depósito', 'alvará'],
  'intimacao': ['intima', 'intimado', 'intimação'],
  'citacao': ['citação', 'citado', 'citar'],
  'sentenca': ['sentença', 'decisão', 'julgado', 'procedente', 'improcedente'],
  'despacho': ['despacho', 'despachado', 'determino'],
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Não autorizado' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { 
        status: 401, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      });
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Get unclassified emails
    const { data: emails, error: fetchError } = await adminClient
      .from('pz_emails')
      .select('*')
      .eq('categoria', 'nao_classificado')
      .limit(20);

    if (fetchError) throw fetchError;

    let classified = 0;

    for (const email of emails || []) {
      const text = `${email.assunto} ${email.corpo_resumo}`.toLowerCase();
      let categoria = 'outros';
      let prioridade = 'media';

      // Check against keywords
      for (const [cat, keywords] of Object.entries(CATEGORIAS)) {
        if (keywords.some(kw => text.includes(kw))) {
          categoria = cat;
          break;
        }
      }

      // Set priority based on category
      if (['prazo_processual', 'audiencia', 'citacao'].includes(categoria)) {
        prioridade = 'alta';
      } else if (['intimacao', 'sentenca'].includes(categoria)) {
        prioridade = 'media';
      }

      // Try AI classification with Lovable AI
      try {
        const aiResponse = await fetch('https://godkshfqvslyxgwagkpc.supabase.co/functions/v1/ai-assistant', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            prompt: `Classifique este email jurídico em UMA das categorias: prazo_processual, audiencia, pagamento, intimacao, citacao, sentenca, despacho, outros.

Assunto: ${email.assunto}
Corpo: ${email.corpo_resumo}

Responda APENAS com a categoria, sem explicações.`,
          }),
        });

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          const aiCategoria = aiResult.response?.toLowerCase().trim();
          if (Object.keys(CATEGORIAS).includes(aiCategoria) || aiCategoria === 'outros') {
            categoria = aiCategoria;
          }
        }
      } catch (e) {
        console.log('AI classification fallback to keywords');
      }

      // Update email
      await adminClient
        .from('pz_emails')
        .update({
          categoria,
          classificado_por_ia: true,
        })
        .eq('id', email.id);

      classified++;
    }

    return new Response(JSON.stringify({ 
      success: true, 
      classified,
      total: emails?.length || 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Classify error:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
