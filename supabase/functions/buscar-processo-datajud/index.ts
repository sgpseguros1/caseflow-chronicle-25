import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DataJudProcesso {
  numeroProcesso: string;
  classe?: { nome: string; codigo: number };
  orgaoJulgador?: { nome: string; codigoMunicipioIBGE?: number };
  assuntos?: Array<{ nome: string; codigo: number }>;
  movimentos?: Array<{
    nome: string;
    dataHora: string;
    codigo?: number;
    complementosTabelados?: Array<{ nome: string; valor: string }>;
  }>;
  dataAjuizamento?: string;
  grau?: string;
  nivelSigilo?: number;
  formato?: { nome: string };
}

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
    const { numero_processo } = await req.json();

    if (!numero_processo) {
      throw new Error('Número do processo é obrigatório');
    }

    console.log(`Buscando processo: ${numero_processo}`);

    // Identifica o tribunal pelo número do processo
    const tribunalInfo = identificarTribunal(numero_processo);
    console.log('Tribunal identificado:', tribunalInfo);

    // Busca o processo no DataJud
    const processo = await buscarNoDataJud(numero_processo, tribunalInfo.api, datajudApiKey);
    
    if (!processo) {
      throw new Error('Processo não encontrado no DataJud');
    }

    console.log('Processo encontrado:', processo.numeroProcesso);

    // Formata as datas
    const dataAjuizamento = formatarDataDataJud(processo.dataAjuizamento);
    const dataUltimoMovimento = formatarDataDataJud(processo.movimentos?.[0]?.dataHora);

    // Extrai partes do processo (se disponível nos movimentos/complementos)
    const partes = extrairPartes(processo);

    // Insere ou atualiza o processo no banco
    const { data: processoSalvo, error: insertError } = await supabase
      .from('processos_judiciais')
      .upsert({
        numero_processo: formatarNumeroProcesso(numero_processo),
        tribunal: tribunalInfo.nome,
        grau: processo.grau || tribunalInfo.grau,
        classe_processual: processo.classe?.nome || null,
        assunto_principal: processo.assuntos?.[0]?.nome || null,
        assuntos_secundarios: processo.assuntos?.slice(1).map(a => a.nome) || null,
        vara: processo.orgaoJulgador?.nome || null,
        status: determinarStatus(processo),
        status_detalhado: processo.formato?.nome || null,
        ultima_movimentacao: processo.movimentos?.[0]?.nome || null,
        data_ultima_movimentacao: dataUltimoMovimento,
        data_distribuicao: dataAjuizamento,
        autor_nome: partes.autor || null,
        reu_nome: partes.reu || null,
        dados_completos: processo,
        link_externo: gerarLinkExterno(numero_processo, tribunalInfo.nome),
        sincronizado_em: new Date().toISOString(),
      }, {
        onConflict: 'numero_processo',
      })
      .select()
      .single();

    if (insertError) {
      console.error('Erro ao salvar processo:', insertError);
      throw insertError;
    }

    // Insere os andamentos
    if (processo.movimentos && processo.movimentos.length > 0) {
      const andamentos = processo.movimentos.map((mov, index) => ({
        processo_id: processoSalvo.id,
        data_andamento: formatarDataDataJud(mov.dataHora) || new Date().toISOString(),
        tipo: classificarTipoMovimento(mov.nome),
        descricao: mov.nome,
        complemento: mov.complementosTabelados?.map(c => `${c.nome}: ${c.valor}`).join('; ') || null,
        codigo_movimento: mov.codigo || null,
        destaque: isMovimentoDestaque(mov.nome),
        lido: false,
      }));

      const { error: andamentosError } = await supabase
        .from('andamentos_processo')
        .upsert(andamentos, {
          onConflict: 'id',
          ignoreDuplicates: true,
        });

      if (andamentosError) {
        console.error('Erro ao inserir andamentos:', andamentosError);
      }
    }

    // Registra no histórico
    await supabase.from('historico_processo').insert({
      processo_id: processoSalvo.id,
      acao: 'criacao',
      campo_alterado: 'processo',
      valor_novo: 'Processo importado via DataJud',
    });

    return new Response(JSON.stringify({
      success: true,
      processo: processoSalvo,
      andamentos: processo.movimentos?.length || 0,
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

function identificarTribunal(numeroProcesso: string): { nome: string; api: string; grau: string } {
  const numero = numeroProcesso.replace(/\D/g, '');
  
  // Formato CNJ: NNNNNNN-DD.AAAA.J.TR.OOOO
  // J = Justiça (8=Estadual, 4=Federal, 5=Trabalho, 2=STF, 3=STJ)
  // TR = Tribunal
  
  if (numero.length >= 20) {
    const justica = numero.charAt(13);
    const tribunal = numero.substring(14, 16);
    const grau = numero.charAt(16) === '0' ? '1º Grau' : '2º Grau';

    switch (justica) {
      case '8': // Justiça Estadual
        return { nome: `TJSP`, api: 'tjsp', grau }; // Simplificado para SP
      case '4': // Justiça Federal
        return { nome: `TRF${tribunal}`, api: `trf${tribunal}`, grau };
      case '5': // Justiça do Trabalho
        return { nome: `TRT${tribunal}`, api: `trt${tribunal}`, grau };
      case '2':
        return { nome: 'STF', api: 'stf', grau: 'Supremo' };
      case '3':
        return { nome: 'STJ', api: 'stj', grau: 'Superior' };
    }
  }

  // Padrão: tentar nos principais tribunais
  return { nome: 'Não identificado', api: 'tjsp', grau: '1º Grau' };
}

async function buscarNoDataJud(
  numeroProcesso: string, 
  tribunalApi: string,
  apiKey: string
): Promise<DataJudProcesso | null> {
  const numero = formatarNumeroProcesso(numeroProcesso);
  
  // Lista de tribunais para tentar
  const tribunais = [tribunalApi, 'tjsp', 'tjrj', 'tjmg', 'trf1', 'trf2', 'trf3', 'trf4', 'trf5'];
  
  for (const tribunal of tribunais) {
    try {
      const baseUrl = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal.toLowerCase()}/_search`;
      
      const query = {
        size: 1,
        query: {
          match: {
            "numeroProcesso": numero.replace(/\D/g, '')
          }
        }
      };

      console.log(`Tentando ${tribunal}...`);
      
      const response = await fetch(baseUrl, {
        method: 'POST',
        headers: {
          'Authorization': `APIKey ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(query),
      });

      if (!response.ok) {
        console.log(`${tribunal} retornou ${response.status}`);
        continue;
      }

      const data = await response.json();
      const processos = data.hits?.hits?.map((hit: any) => hit._source) || [];
      
      if (processos.length > 0) {
        console.log(`Processo encontrado no ${tribunal}`);
        return processos[0];
      }
    } catch (error) {
      console.error(`Erro ao consultar ${tribunal}:`, error);
    }
  }

  return null;
}

function formatarNumeroProcesso(numero: string): string {
  const digits = numero.replace(/\D/g, '');
  if (digits.length === 20) {
    return `${digits.slice(0, 7)}-${digits.slice(7, 9)}.${digits.slice(9, 13)}.${digits.charAt(13)}.${digits.slice(14, 16)}.${digits.slice(16)}`;
  }
  return numero;
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

function determinarStatus(processo: DataJudProcesso): string {
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

function extrairPartes(processo: DataJudProcesso): { autor: string | null; reu: string | null } {
  // DataJud geralmente não retorna partes diretamente na API pública
  // Isso precisaria de acesso a APIs específicas de cada tribunal
  return { autor: null, reu: null };
}

function gerarLinkExterno(numeroProcesso: string, tribunal: string): string {
  const numero = numeroProcesso.replace(/\D/g, '');
  
  if (tribunal.startsWith('TJ')) {
    if (tribunal === 'TJSP') {
      return `https://esaj.tjsp.jus.br/cpopg/show.do?processo.numero=${numero}`;
    }
    if (tribunal === 'TJRJ') {
      return `https://www3.tjrj.jus.br/consultaprocessual/#/consultapublica#702${numero}`;
    }
  }
  
  if (tribunal.startsWith('TRF')) {
    const regiao = tribunal.replace('TRF', '');
    return `https://pje.trf${regiao}.jus.br/consultapublica/ConsultaPublica/listView.seam`;
  }
  
  if (tribunal.startsWith('TRT')) {
    return `https://pje.trt${tribunal.replace('TRT', '')}.jus.br/consultaprocessual`;
  }
  
  return `https://www.cnj.jus.br/busca-de-processos/`;
}
