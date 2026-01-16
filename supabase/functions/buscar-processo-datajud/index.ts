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
    const { numero_processo, cpf, nome } = await req.json();

    // Validar entrada
    if (!numero_processo && !cpf && !nome) {
      throw new Error('Informe número do processo, CPF ou nome para buscar');
    }

    console.log(`Buscando processo - CNJ: ${numero_processo}, CPF: ${cpf}, Nome: ${nome}`);

    let processo: DataJudProcesso | null = null;
    let tribunalInfo = { nome: 'Não identificado', api: 'tjsp', grau: '1º Grau' };

    // Busca por número do processo (CNJ)
    if (numero_processo) {
      tribunalInfo = identificarTribunal(numero_processo);
      console.log('Tribunal identificado:', tribunalInfo);
      processo = await buscarNoDataJud(numero_processo, tribunalInfo.api, datajudApiKey);
    } 
    // Busca por CPF ou Nome
    else if (cpf || nome) {
      processo = await buscarPorParteDataJud(cpf, nome, datajudApiKey);
      if (processo) {
        tribunalInfo = identificarTribunal(processo.numeroProcesso);
      }
    }
    
    if (!processo) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Nenhum processo encontrado para os dados informados',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    console.log('Processo encontrado:', processo.numeroProcesso);

    // Formata as datas
    const dataAjuizamento = formatarDataDataJud(processo.dataAjuizamento);
    const dataUltimoMovimento = formatarDataDataJud(processo.movimentos?.[0]?.dataHora);

    // Formata o número do processo
    const numeroFormatado = formatarNumeroProcesso(processo.numeroProcesso);

    // Primeiro insere na tabela processos_sincronizados (monitoramento)
    const { data: processoSync, error: syncError } = await supabase
      .from('processos_sincronizados')
      .upsert({
        numero_processo: numeroFormatado,
        tribunal: tribunalInfo.nome.toLowerCase(),
        classe_processual: processo.classe?.nome || null,
        assunto: processo.assuntos?.[0]?.nome || null,
        orgao_julgador: processo.orgaoJulgador?.nome || null,
        data_ajuizamento: dataAjuizamento,
        ultimo_movimento: processo.movimentos?.[0]?.nome || null,
        data_ultimo_movimento: dataUltimoMovimento,
        situacao: determinarSituacao(processo),
        nivel_sigilo: processo.nivelSigilo?.toString() || '0',
        link_externo: gerarLinkExterno(numeroFormatado, tribunalInfo.nome),
        dados_completos: processo,
      }, {
        onConflict: 'numero_processo',
      })
      .select()
      .single();

    if (syncError) {
      console.error('Erro ao salvar processo sincronizado:', syncError);
      throw syncError;
    }

    // Insere as movimentações
    if (processo.movimentos && processo.movimentos.length > 0) {
      const movimentacoes = processo.movimentos.slice(0, 50).map((mov) => ({
        processo_id: processoSync.id,
        data_movimento: formatarDataDataJud(mov.dataHora) || new Date().toISOString(),
        codigo_movimento: mov.codigo || null,
        descricao: mov.nome,
        complemento: mov.complementosTabelados?.map(c => `${c.nome}: ${c.valor}`).join('; ') || null,
        urgente: isMovimentoUrgente(mov.nome),
        lido: false,
      }));

      // Limpa movimentações antigas e insere novas
      await supabase.from('movimentacoes_processo').delete().eq('processo_id', processoSync.id);
      
      const { error: movError } = await supabase
        .from('movimentacoes_processo')
        .insert(movimentacoes);

      if (movError) {
        console.error('Erro ao inserir movimentações:', movError);
      }
    }

    return new Response(JSON.stringify({
      success: true,
      numero_processo: numeroFormatado,
      processo: processoSync,
      movimentacoes: processo.movimentos?.length || 0,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Erro:', error);
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(JSON.stringify({ success: false, error: message }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function identificarTribunal(numeroProcesso: string): { nome: string; api: string; grau: string } {
  const numero = numeroProcesso.replace(/\D/g, '');
  
  if (numero.length >= 20) {
    const justica = numero.charAt(13);
    const tribunal = numero.substring(14, 16);
    const grau = numero.charAt(16) === '0' ? '1º Grau' : '2º Grau';

    // Mapeamento de tribunais estaduais
    const tjMap: { [key: string]: string } = {
      '01': 'TJAC', '02': 'TJAL', '03': 'TJAP', '04': 'TJAM', '05': 'TJBA',
      '06': 'TJCE', '07': 'TJDF', '08': 'TJES', '09': 'TJGO', '10': 'TJMA',
      '11': 'TJMT', '12': 'TJMS', '13': 'TJMG', '14': 'TJPA', '15': 'TJPB',
      '16': 'TJPR', '17': 'TJPE', '18': 'TJPI', '19': 'TJRJ', '20': 'TJRN',
      '21': 'TJRS', '22': 'TJRO', '23': 'TJRR', '24': 'TJSC', '25': 'TJSP', '26': 'TJSE', '27': 'TJTO',
    };

    switch (justica) {
      case '8': // Justiça Estadual
        const tjNome = tjMap[tribunal] || 'TJ' + tribunal;
        return { nome: tjNome, api: tjNome.toLowerCase(), grau };
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

  return { nome: 'Não identificado', api: 'tjsp', grau: '1º Grau' };
}

async function buscarNoDataJud(
  numeroProcesso: string, 
  tribunalApi: string,
  apiKey: string
): Promise<DataJudProcesso | null> {
  const numero = numeroProcesso.replace(/\D/g, '');
  
  // Lista de tribunais para tentar - começa pelo identificado
  const tribunaisBase = ['tjsp', 'tjrj', 'tjmg', 'tjes', 'tjba', 'tjpr', 'tjrs', 'tjsc', 'trf1', 'trf2', 'trf3', 'trf4', 'trf5'];
  const tribunais = [tribunalApi.toLowerCase(), ...tribunaisBase.filter(t => t !== tribunalApi.toLowerCase())];
  
  for (const tribunal of tribunais.slice(0, 5)) { // Limita a 5 tentativas
    try {
      const baseUrl = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`;
      
      const query = {
        size: 1,
        query: {
          match: {
            "numeroProcesso": numero
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

async function buscarPorParteDataJud(
  cpf: string | undefined,
  nome: string | undefined,
  apiKey: string
): Promise<DataJudProcesso | null> {
  // DataJud público não permite busca direta por CPF/nome das partes
  // Tenta buscar em múltiplos tribunais usando query genérica
  
  const tribunais = ['tjsp', 'tjrj', 'tjmg', 'tjes', 'tjba', 'tjpr'];
  const termoBusca = cpf || nome || '';
  
  for (const tribunal of tribunais) {
    try {
      const baseUrl = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal}/_search`;
      
      const query = {
        size: 5,
        query: {
          query_string: {
            query: `"${termoBusca}"`,
            default_operator: "AND",
            lenient: true
          }
        },
        sort: [{ "dataAjuizamento": { "order": "desc" } }]
      };

      console.log(`Buscando por "${termoBusca}" no ${tribunal}...`);
      
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
        console.log(`Encontrado ${processos.length} processos no ${tribunal}`);
        return processos[0]; // Retorna o mais recente
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

function determinarSituacao(processo: DataJudProcesso): string {
  const ultimoMovimento = processo.movimentos?.[0]?.nome?.toLowerCase() || '';
  
  if (ultimoMovimento.includes('arquiv') || ultimoMovimento.includes('baixa')) return 'Arquivado';
  if (ultimoMovimento.includes('sentença') || ultimoMovimento.includes('sentenca')) return 'Sentenciado';
  if (ultimoMovimento.includes('transit')) return 'Transitado em Julgado';
  
  return 'Em andamento';
}

function isMovimentoUrgente(nome: string): boolean {
  const lower = nome.toLowerCase();
  return (
    lower.includes('sentença') ||
    lower.includes('sentenca') ||
    lower.includes('decisão') ||
    lower.includes('decisao') ||
    lower.includes('prazo') ||
    lower.includes('citação') ||
    lower.includes('citacao') ||
    lower.includes('intimação') ||
    lower.includes('intimacao') ||
    lower.includes('audiência') ||
    lower.includes('audiencia') ||
    lower.includes('perícia') ||
    lower.includes('pericia')
  );
}

function gerarLinkExterno(numeroProcesso: string, tribunal: string): string {
  const numero = numeroProcesso.replace(/\D/g, '');
  const tribunalUpper = tribunal.toUpperCase();
  
  // Links diretos para consulta nos tribunais
  const links: { [key: string]: string } = {
    'TJSP': `https://esaj.tjsp.jus.br/cpopg/show.do?processo.numero=${numero}`,
    'TJRJ': `https://www3.tjrj.jus.br/consultaprocessual/#/consultapublica#${numero}`,
    'TJMG': `https://www4.tjmg.jus.br/juridico/sf/proc_resultado.jsp?comrCodigo=${numero}`,
    'TJES': `https://sistemas.tjes.jus.br/pje/ConsultaPublica/listView.seam`,
    'TJBA': `https://pje.tjba.jus.br/pje/ConsultaPublica/listView.seam`,
    'TJPR': `https://projudi.tjpr.jus.br/projudi/`,
    'TJRS': `https://www.tjrs.jus.br/novo/busca/?return=proc&client=wp_index`,
    'TJSC': `https://esaj.tjsc.jus.br/cpopg/open.do`,
  };
  
  if (links[tribunalUpper]) {
    return links[tribunalUpper];
  }
  
  if (tribunalUpper.startsWith('TRF')) {
    const regiao = tribunalUpper.replace('TRF', '');
    return `https://pje.trf${regiao}.jus.br/consultapublica/ConsultaPublica/listView.seam`;
  }
  
  return `https://www.cnj.jus.br/busca-de-processos/`;
}
