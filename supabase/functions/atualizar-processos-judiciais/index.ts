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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const datajudApiKey = Deno.env.get('DATAJUD_API_KEY');

    if (!datajudApiKey) {
      throw new Error('DATAJUD_API_KEY não configurada');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Busca todos os processos que precisam ser atualizados
    const { data: processos, error: fetchError } = await supabase
      .from('processos_judiciais')
      .select('id, numero_processo, tribunal, status')
      .not('status', 'in', '(arquivado,pago_cumprido)')
      .order('sincronizado_em', { ascending: true, nullsFirst: true })
      .limit(20);

    if (fetchError) throw fetchError;

    console.log(`Atualizando ${processos?.length || 0} processos...`);

    let atualizados = 0;
    let novosAndamentos = 0;
    const erros: string[] = [];

    for (const processo of processos || []) {
      try {
        const resultado = await atualizarProcesso(
          supabase,
          processo,
          datajudApiKey
        );
        
        if (resultado.atualizado) {
          atualizados++;
          novosAndamentos += resultado.novosAndamentos;
        }
      } catch (error: unknown) {
        console.error(`Erro ao atualizar ${processo.numero_processo}:`, error);
        const message = error instanceof Error ? error.message : 'Erro desconhecido';
        erros.push(`${processo.numero_processo}: ${message}`);
      }
    }

    // Gera alertas de prazo
    await gerarAlertasPrazo(supabase);

    return new Response(JSON.stringify({
      success: true,
      atualizados,
      novosAndamentos,
      erros: erros.length > 0 ? erros : undefined,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

async function atualizarProcesso(
  supabase: any,
  processo: any,
  apiKey: string
): Promise<{ atualizado: boolean; novosAndamentos: number }> {
  const numero = processo.numero_processo.replace(/\D/g, '');
  const tribunal = processo.tribunal?.toLowerCase().replace(/[^a-z0-9]/g, '') || 'tjsp';
  
  const baseUrl = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`;
  
  const query = {
    size: 1,
    query: {
      match: {
        "numeroProcesso": numero
      }
    }
  };

  const response = await fetch(baseUrl, {
    method: 'POST',
    headers: {
      'Authorization': `APIKey ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(query),
  });

  if (!response.ok) {
    throw new Error(`DataJud retornou ${response.status}`);
  }

  const data = await response.json();
  const processoDataJud = data.hits?.hits?.[0]?._source;

  if (!processoDataJud) {
    return { atualizado: false, novosAndamentos: 0 };
  }

  // Busca andamentos existentes
  const { data: andamentosExistentes } = await supabase
    .from('andamentos_processo')
    .select('descricao, data_andamento')
    .eq('processo_id', processo.id);

  const andamentosSet = new Set(
    (andamentosExistentes || []).map(
      (a: any) => `${a.descricao}_${a.data_andamento}`
    )
  );

  // Insere novos andamentos
  let novosAndamentos = 0;
  const movimentos = processoDataJud.movimentos || [];

  for (const mov of movimentos) {
    const dataAndamento = formatarDataDataJud(mov.dataHora);
    const key = `${mov.nome}_${dataAndamento}`;

    if (!andamentosSet.has(key) && dataAndamento) {
      const { error } = await supabase.from('andamentos_processo').insert({
        processo_id: processo.id,
        data_andamento: dataAndamento,
        tipo: classificarTipoMovimento(mov.nome),
        descricao: mov.nome,
        complemento: mov.complementosTabelados?.map((c: any) => `${c.nome}: ${c.valor}`).join('; ') || null,
        codigo_movimento: mov.codigo || null,
        destaque: isMovimentoDestaque(mov.nome),
        lido: false,
      });

      if (!error) {
        novosAndamentos++;
      }
    }
  }

  // Atualiza dados do processo
  const ultimoMovimento = movimentos[0];
  const novoStatus = determinarStatus(processoDataJud);

  await supabase.from('processos_judiciais').update({
    status: novoStatus,
    ultima_movimentacao: ultimoMovimento?.nome || null,
    data_ultima_movimentacao: formatarDataDataJud(ultimoMovimento?.dataHora),
    dados_completos: processoDataJud,
    sincronizado_em: new Date().toISOString(),
  }).eq('id', processo.id);

  return { atualizado: true, novosAndamentos };
}

async function gerarAlertasPrazo(supabase: any) {
  const hoje = new Date();
  
  // Busca processos com prazo próximo
  const { data: processos } = await supabase
    .from('processos_judiciais')
    .select('id, numero_processo, prazo_processual, alerta_prazo_dias, responsavel_id')
    .not('prazo_processual', 'is', null)
    .gte('prazo_processual', hoje.toISOString().split('T')[0]);

  for (const processo of processos || []) {
    const prazo = new Date(processo.prazo_processual);
    const diasRestantes = Math.ceil((prazo.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    const alertaDias = processo.alerta_prazo_dias || 5;

    if (diasRestantes <= alertaDias) {
      // Verifica se já existe alerta para este prazo
      const { data: alertaExistente } = await supabase
        .from('alertas_prazo')
        .select('id')
        .eq('processo_id', processo.id)
        .eq('data_prazo', processo.prazo_processual)
        .eq('status', 'pendente')
        .single();

      if (!alertaExistente) {
        await supabase.from('alertas_prazo').insert({
          processo_id: processo.id,
          tipo: diasRestantes <= 1 ? 'urgente' : 'prazo',
          titulo: `Prazo em ${diasRestantes} dia(s)`,
          descricao: `Processo ${processo.numero_processo} tem prazo em ${processo.prazo_processual}`,
          data_prazo: processo.prazo_processual,
          dias_restantes: diasRestantes,
          usuario_alvo_id: processo.responsavel_id,
        });
      }
    }
  }
}

function formatarDataDataJud(data: string | undefined): string | null {
  if (!data) return null;
  
  if (data.includes('-') || data.includes('T')) {
    return data;
  }
  
  const str = data.replace(/\D/g, '');
  if (str.length >= 8) {
    const year = str.substring(0, 4);
    const month = str.substring(4, 6);
    const day = str.substring(6, 8);
    const hour = str.length >= 10 ? str.substring(8, 10) : '00';
    const min = str.length >= 12 ? str.substring(10, 12) : '00';
    const sec = str.length >= 14 ? str.substring(12, 14) : '00';
    
    return `${year}-${month}-${day}T${hour}:${min}:${sec}Z`;
  }
  
  return null;
}

function determinarStatus(processo: any): string {
  const ultimoMovimento = processo.movimentos?.[0]?.nome?.toLowerCase() || '';
  
  if (ultimoMovimento.includes('arquiv')) return 'arquivado';
  if (ultimoMovimento.includes('sentença') || ultimoMovimento.includes('sentenca')) return 'sentenciado';
  if (ultimoMovimento.includes('audiência') || ultimoMovimento.includes('audiencia')) return 'aguardando_audiencia';
  if (ultimoMovimento.includes('perícia') || ultimoMovimento.includes('pericia')) return 'aguardando_pericia';
  if (ultimoMovimento.includes('conclus')) return 'concluso_decisao';
  if (ultimoMovimento.includes('recurso')) return 'em_recurso';
  if (ultimoMovimento.includes('pago') || ultimoMovimento.includes('cumprido')) return 'pago_cumprido';
  
  return 'em_andamento';
}

function classificarTipoMovimento(nome: string): string {
  const lower = nome.toLowerCase();
  
  if (lower.includes('despacho')) return 'despacho';
  if (lower.includes('decisão') || lower.includes('decisao')) return 'decisao';
  if (lower.includes('sentença') || lower.includes('sentenca')) return 'sentenca';
  if (lower.includes('audiência') || lower.includes('audiencia')) return 'audiencia';
  if (lower.includes('arquiv')) return 'arquivamento';
  if (lower.includes('recurso')) return 'recurso';
  if (lower.includes('citação') || lower.includes('citacao')) return 'citacao';
  if (lower.includes('intimação') || lower.includes('intimacao')) return 'intimacao';
  
  return 'movimentacao';
}

function isMovimentoDestaque(nome: string): boolean {
  const lower = nome.toLowerCase();
  return (
    lower.includes('sentença') ||
    lower.includes('sentenca') ||
    lower.includes('decisão') ||
    lower.includes('decisao') ||
    lower.includes('audiência') ||
    lower.includes('audiencia') ||
    lower.includes('arquiv') ||
    lower.includes('recurso') ||
    lower.includes('prazo')
  );
}
