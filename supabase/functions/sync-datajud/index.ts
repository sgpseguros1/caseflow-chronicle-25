import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DataJudProcesso {
  numeroProcesso: string;
  classe?: {
    codigo?: number;
    nome?: string;
  };
  orgaoJulgador?: {
    nome?: string;
    codigoMunicipioIBGE?: number;
  };
  sistema?: {
    nome?: string;
  };
  formato?: {
    nome?: string;
  };
  tribunal?: string;
  dataAjuizamento?: string;
  movimentos?: Array<{
    codigo?: number;
    nome?: string;
    dataHora?: string;
    complementosTabelados?: Array<{
      codigo?: number;
      nome?: string;
      valor?: string;
      descricao?: string;
    }>;
  }>;
  assuntos?: Array<{
    codigo?: number;
    nome?: string;
  }>;
  nivelSigilo?: number;
}

interface DataJudResponse {
  hits?: {
    hits?: Array<{
      _source?: DataJudProcesso;
    }>;
    total?: {
      value?: number;
    };
  };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const DATAJUD_API_KEY = Deno.env.get('DATAJUD_API_KEY');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!DATAJUD_API_KEY) {
      throw new Error('DATAJUD_API_KEY não configurada');
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Variáveis do Supabase não configuradas');
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { oab_id, numero_oab, uf, force_sync = false, max_pages = 50 } = body;

    // Se OAB específica foi passada, sincroniza apenas ela
    let oabsToSync: Array<{ id: string; numero_oab: string; uf: string }> = [];

    if (oab_id) {
      const { data: oab, error } = await supabase
        .from('oab_monitoradas')
        .select('id, numero_oab, uf')
        .eq('id', oab_id)
        .eq('ativo', true)
        .single();

      if (error || !oab) {
        throw new Error('OAB não encontrada ou inativa');
      }
      oabsToSync = [oab];
    } else if (numero_oab && uf) {
      oabsToSync = [{ id: '', numero_oab, uf }];
    } else {
      // Busca todas as OABs ativas para sincronização
      const { data: oabs, error } = await supabase
        .from('oab_monitoradas')
        .select('id, numero_oab, uf')
        .eq('ativo', true);

      if (error) {
        throw new Error(`Erro ao buscar OABs: ${error.message}`);
      }
      oabsToSync = oabs || [];
    }

    if (oabsToSync.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Nenhuma OAB para sincronizar', synced: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    let totalSynced = 0;
    let totalProcessos = 0;
    const errors: string[] = [];

    for (const oab of oabsToSync) {
      try {
        console.log(`Iniciando sincronização para OAB ${oab.numero_oab}/${oab.uf}`);
        
        // Consulta API DataJud por processos do advogado
        const tribunais = getTribunaisPorUF(oab.uf);
        
        for (const tribunal of tribunais) {
          // Busca todos os processos com paginação
          let page = 0;
          let hasMore = true;
          const pageSize = 1000; // Máximo permitido pelo DataJud
          
          while (hasMore && page < max_pages) {
            const from = page * pageSize;
            
            console.log(`Buscando página ${page + 1} do tribunal ${tribunal} (from: ${from})`);
            
            const result = await consultarDataJudPaginado(
              DATAJUD_API_KEY,
              oab.numero_oab,
              oab.uf,
              tribunal,
              pageSize,
              from
            );
            
            const processos = result.processos;
            const total = result.total;
            
            console.log(`Página ${page + 1}: ${processos.length} processos de ${total} total`);
            
            for (const processo of processos) {
              try {
                // Formata datas do DataJud para ISO
                const dataAjuizamento = formatarDataDataJud(processo.dataAjuizamento);
                const dataUltimoMovimento = formatarDataDataJud(processo.movimentos?.[0]?.dataHora);

                // Upsert processo no banco
                const { error: upsertError } = await supabase
                  .from('processos_sincronizados')
                  .upsert({
                    numero_processo: processo.numeroProcesso,
                    oab_id: oab.id || null,
                    tribunal: tribunal,
                    classe_processual: processo.classe?.nome || null,
                    orgao_julgador: processo.orgaoJulgador?.nome || null,
                    data_ajuizamento: dataAjuizamento,
                    assunto: processo.assuntos?.[0]?.nome || null,
                    situacao: processo.formato?.nome || null,
                    nivel_sigilo: processo.nivelSigilo?.toString() || null,
                    ultimo_movimento: processo.movimentos?.[0]?.nome || null,
                    data_ultimo_movimento: dataUltimoMovimento,
                    dados_completos: processo,
                    link_externo: gerarLinkExterno(processo.numeroProcesso, tribunal),
                    updated_at: new Date().toISOString(),
                  }, {
                    onConflict: 'numero_processo'
                  });

                if (upsertError) {
                  console.error(`Erro ao salvar processo ${processo.numeroProcesso}:`, upsertError);
                  errors.push(`Processo ${processo.numeroProcesso}: ${upsertError.message}`);
                } else {
                  totalSynced++;

                  // Salvar movimentações - sem limite
                  if (processo.movimentos && processo.movimentos.length > 0) {
                    const { data: processoDb } = await supabase
                      .from('processos_sincronizados')
                      .select('id')
                      .eq('numero_processo', processo.numeroProcesso)
                      .single();

                    if (processoDb) {
                      // Salva TODAS as movimentações, sem limite
                      for (const mov of processo.movimentos) {
                        const dataMovimento = formatarDataDataJud(mov.dataHora);
                        await supabase
                          .from('movimentacoes_processo')
                          .upsert({
                            processo_id: processoDb.id,
                            data_movimento: dataMovimento || new Date().toISOString(),
                            descricao: mov.nome || 'Movimentação',
                            codigo_movimento: mov.codigo || null,
                            complemento: mov.complementosTabelados?.map(c => c.descricao || c.valor).join('; ') || null,
                          }, {
                            onConflict: 'processo_id,data_movimento,descricao'
                          });
                      }
                    }
                  }
                }
              } catch (procError: unknown) {
                const errorMsg = procError instanceof Error ? procError.message : 'Erro desconhecido';
                console.error(`Erro ao processar ${processo.numeroProcesso}:`, procError);
                errors.push(`${processo.numeroProcesso}: ${errorMsg}`);
              }
            }
            
            totalProcessos += processos.length;
            
            // Verifica se há mais páginas
            hasMore = processos.length >= pageSize && (from + processos.length) < total;
            page++;
            
            // Pequena pausa para não sobrecarregar a API
            if (hasMore) {
              await new Promise(resolve => setTimeout(resolve, 500));
            }
          }
        }

        // Atualiza última sincronização da OAB
        if (oab.id) {
          await supabase
            .from('oab_monitoradas')
            .update({ ultima_sincronizacao: new Date().toISOString() })
            .eq('id', oab.id);
        }
        
        console.log(`OAB ${oab.numero_oab}/${oab.uf} sincronizada: ${totalSynced} processos`);
        
      } catch (oabError: unknown) {
        const errorMessage = oabError instanceof Error ? oabError.message : 'Erro desconhecido';
        console.error(`Erro ao sincronizar OAB ${oab.numero_oab}/${oab.uf}:`, oabError);
        errors.push(`OAB ${oab.numero_oab}/${oab.uf}: ${errorMessage}`);
      }
    }

    return new Response(
      JSON.stringify({
        message: `Sincronização concluída`,
        synced: totalSynced,
        total_encontrados: totalProcessos,
        oabs_processed: oabsToSync.length,
        errors: errors.length > 0 ? errors.slice(0, 50) : undefined, // Limita erros no response
        has_more_errors: errors.length > 50,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    console.error('Erro na sincronização DataJud:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});

async function consultarDataJudPaginado(
  apiKey: string,
  numeroOab: string,
  uf: string,
  tribunal: string,
  size: number = 100, // Reduzido para evitar timeout
  from: number = 0
): Promise<{ processos: DataJudProcesso[]; total: number }> {
  const baseUrl = `https://api-publica.datajud.cnj.jus.br/api_publica_${tribunal.toLowerCase()}/_search`;

  // Query simples que funciona em TODOS os tribunais
  // A API DataJud não suporta nested queries em todos os índices
  // Usamos query_string para buscar pela OAB nos campos disponíveis
  const oabBusca = `${numeroOab}/${uf.toUpperCase()}`;
  const oabBuscaAlternativa = `OAB ${numeroOab} ${uf.toUpperCase()}`;
  
  const query = {
    size: size,
    from: from,
    query: {
      bool: {
        should: [
          // Busca pelo formato padrão OAB: 12345/ES
          {
            query_string: {
              query: `"${oabBusca}"`,
              default_operator: "AND"
            }
          },
          // Busca alternativa: OAB 12345 ES
          {
            query_string: {
              query: `"${numeroOab}" AND "${uf.toUpperCase()}"`,
              default_operator: "AND"
            }
          },
          // Busca pelo número da inscrição
          {
            multi_match: {
              query: numeroOab,
              fields: ["*inscricao*", "*oab*", "*advogado*"],
              type: "phrase"
            }
          }
        ],
        minimum_should_match: 1
      }
    },
    sort: [
      { "dataAjuizamento": { "order": "desc" } }
    ]
  };

  console.log(`Consultando DataJud OAB ${numeroOab}/${uf} - Tribunal: ${tribunal}, Size: ${size}, From: ${from}`);

  try {
    const response = await fetch(baseUrl, {
      method: 'POST',
      headers: {
        'Authorization': `APIKey ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(query),
    });

    console.log(`DataJud response status (${tribunal}):`, response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`DataJud API error (${tribunal}):`, response.status, errorText);
      return { processos: [], total: 0 };
    }

    const data: DataJudResponse = await response.json();
    const processos = data.hits?.hits?.map(hit => hit._source).filter(Boolean) as DataJudProcesso[] || [];
    const total = data.hits?.total?.value || processos.length;
    
    console.log(`DataJud retornou ${processos.length} processos da OAB ${numeroOab}/${uf} no ${tribunal} (total: ${total})`);
    
    return { processos, total };
  } catch (error) {
    console.error(`Erro ao consultar DataJud (${tribunal}):`, error);
    return { processos: [], total: 0 };
  }
}

// Converte data do formato DataJud (YYYYMMDDHHmmss) para ISO
function formatarDataDataJud(data: string | undefined): string | null {
  if (!data) return null;
  
  // Se já está em formato ISO, retorna como está
  if (data.includes('-') || data.includes('T')) {
    return data;
  }
  
  // Formato DataJud: YYYYMMDDHHmmss ou YYYYMMDD
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

function getTribunaisPorUF(uf: string): string[] {
  // Mapeia UF para tribunais relevantes
  const tribunaisEstaduais: Record<string, string> = {
    'AC': 'tjac', 'AL': 'tjal', 'AM': 'tjam', 'AP': 'tjap', 'BA': 'tjba',
    'CE': 'tjce', 'DF': 'tjdft', 'ES': 'tjes', 'GO': 'tjgo', 'MA': 'tjma',
    'MG': 'tjmg', 'MS': 'tjms', 'MT': 'tjmt', 'PA': 'tjpa', 'PB': 'tjpb',
    'PE': 'tjpe', 'PI': 'tjpi', 'PR': 'tjpr', 'RJ': 'tjrj', 'RN': 'tjrn',
    'RO': 'tjro', 'RR': 'tjrr', 'RS': 'tjrs', 'SC': 'tjsc', 'SE': 'tjse',
    'SP': 'tjsp', 'TO': 'tjto'
  };

  const tribunais: string[] = [];
  
  // Adiciona tribunal estadual
  if (tribunaisEstaduais[uf]) {
    tribunais.push(tribunaisEstaduais[uf]);
  }

  // Adiciona TRFs baseado na região
  const trfPorUF: Record<string, string> = {
    'AC': 'trf1', 'AM': 'trf1', 'AP': 'trf1', 'BA': 'trf1', 'DF': 'trf1',
    'GO': 'trf1', 'MA': 'trf1', 'MG': 'trf1', 'MT': 'trf1', 'PA': 'trf1',
    'PI': 'trf1', 'RO': 'trf1', 'RR': 'trf1', 'TO': 'trf1',
    'ES': 'trf2', 'RJ': 'trf2',
    'MS': 'trf3', 'SP': 'trf3',
    'PR': 'trf4', 'RS': 'trf4', 'SC': 'trf4',
    'AL': 'trf5', 'CE': 'trf5', 'PB': 'trf5', 'PE': 'trf5', 'RN': 'trf5', 'SE': 'trf5'
  };

  if (trfPorUF[uf]) {
    tribunais.push(trfPorUF[uf]);
  }

  return tribunais;
}

function gerarLinkExterno(numeroProcesso: string, tribunal: string): string {
  // Gera link oficial do tribunal - NÃO usar JusBrasil
  const numero = numeroProcesso.replace(/\D/g, '');
  const tribunalUpper = tribunal.toUpperCase();
  
  // TJs Estaduais - Consulta pública oficial
  if (tribunalUpper.startsWith('TJ') || tribunalUpper.startsWith('TJ')) {
    const siglaTJ = tribunalUpper.replace('TJ', '').toLowerCase();
    
    // Tribunais com e-SAJ
    if (['sp', 'sc', 'ms', 'am', 'ac', 'al', 'ce'].includes(siglaTJ)) {
      return `https://esaj.tj${siglaTJ}.jus.br/cpopg/open.do`;
    }
    
    // TJES - Espírito Santo (PJe)
    if (siglaTJ === 'es') {
      return `https://pje.tjes.jus.br/pje/ConsultaPublica/listView.seam`;
    }
    
    // TJRJ - Rio de Janeiro
    if (siglaTJ === 'rj') {
      return `https://www3.tjrj.jus.br/consultaprocessual/`;
    }
    
    // TJMG - Minas Gerais
    if (siglaTJ === 'mg') {
      return `https://pje.tjmg.jus.br/pje/ConsultaPublica/listView.seam`;
    }
    
    // TJBA - Bahia
    if (siglaTJ === 'ba') {
      return `https://pje.tjba.jus.br/pje/ConsultaPublica/listView.seam`;
    }
    
    // TJPR - Paraná
    if (siglaTJ === 'pr') {
      return `https://projudi.tjpr.jus.br/projudi/`;
    }
    
    // TJRS - Rio Grande do Sul
    if (siglaTJ === 'rs') {
      return `https://www.tjrs.jus.br/novo/busca/?return=proc`;
    }
    
    // TJGO - Goiás
    if (siglaTJ === 'go') {
      return `https://pje.tjgo.jus.br/ConsultaPublica/listView.seam`;
    }
    
    // TJPE - Pernambuco
    if (siglaTJ === 'pe') {
      return `https://srv01.tjpe.jus.br/consultaprocessualunificada/`;
    }
    
    // TJDF - Distrito Federal
    if (siglaTJ === 'df' || siglaTJ === 'dft') {
      return `https://pje.tjdft.jus.br/consultapublica/ConsultaPublica/listView.seam`;
    }
  }
  
  // TRFs - Tribunais Regionais Federais
  if (tribunalUpper.startsWith('TRF')) {
    const regiao = tribunalUpper.replace('TRF', '');
    return `https://pje.trf${regiao}.jus.br/pje/ConsultaPublica/listView.seam`;
  }
  
  // TRTs - Tribunais Regionais do Trabalho
  if (tribunalUpper.startsWith('TRT')) {
    const regiao = tribunalUpper.replace('TRT', '');
    return `https://pje.trt${regiao}.jus.br/consultaprocessual/pages/consultas/ConsultaProcessual.seam`;
  }
  
  // STJ
  if (tribunalUpper === 'STJ') {
    return `https://processo.stj.jus.br/processo/pesquisa/`;
  }
  
  // STF
  if (tribunalUpper === 'STF') {
    return `https://portal.stf.jus.br/processos/`;
  }
  
  // TST
  if (tribunalUpper === 'TST') {
    return `https://pje.tst.jus.br/consultaprocessual/pages/consultas/ConsultaProcessual.seam`;
  }
  
  // Fallback - Busca no portal do CNJ (oficial)
  return `https://www.cnj.jus.br/busca-de-processos/?termo=${numero}`;
}
