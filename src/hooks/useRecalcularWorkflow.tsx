import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook centralizado para recalcular o status do workflow de triagem.
 * Verifica dados reais no banco (checklist, BAUs, protocolos, perícias, etc.)
 * e atualiza o client_workflow automaticamente.
 */
export function useRecalcularWorkflow() {
  const queryClient = useQueryClient();

  const recalcular = useCallback(async (clientId: string) => {
    if (!clientId) return;

    try {
      // Fetch all related data in parallel (including documents for auto-detection)
      const [checklistRes, bausRes, protocolosRes, periciasRes, financeiroRes, workflowRes, clientRes, docsRes]: any[] = await Promise.all([
        supabase.from('client_checklist_ia' as any).select('status, concluido_em').eq('client_id', clientId).maybeSingle(),
        supabase.from('client_baus' as any).select('id, status').eq('client_id', clientId),
        supabase.from('protocolos' as any).select('id, status').eq('cliente_id', clientId),
        supabase.from('pericias' as any).select('id, status').eq('cliente_id', clientId),
        supabase.from('lancamentos_financeiros' as any).select('id').eq('cliente_id', clientId).limit(1),
        supabase.from('client_workflow' as any).select('*').eq('client_id', clientId).maybeSingle(),
        supabase.from('clients' as any).select('id, name, has_police_report, police_report_number').eq('id', clientId).single(),
        supabase.from('client_documents' as any).select('file_name, document_category').eq('client_id', clientId),
      ]);

      const checklist = checklistRes.data;
      const baus = bausRes.data || [];
      const protocolos = protocolosRes.data || [];
      const pericias = periciasRes.data || [];
      const temFinanceiro = (financeiroRes.data || []).length > 0;
      const client = clientRes.data;
      const docs: { file_name: string; document_category: string | null }[] = docsRes.data || [];

      // --- Auto-detect from document names ---
      const docNames = docs.map(d => (d.file_name || '').toUpperCase());
      const hasDocBAU = docNames.some(n => n.includes('BAU') || n.includes('PRONTUARIO') || n.includes('PRONTUÁRIO'));
      const hasDocBO = docNames.some(n => n.includes('BO') || n.includes('BOLETIM') || n.includes('CAT'));
      const hasDocLaudo = docNames.some(n => n.includes('LAUDO') || n.includes('ATESTADO') || n.includes('PARECER'));
      const hasDocCTPS = docNames.some(n => n.includes('CTPS') || n.includes('CARTEIRA DE TRABALHO'));
      const hasDocRX = docNames.some(n => n.includes('RAIO') || n.includes('RX') || n.includes('EXAME') || n.includes('TOMOGRAFIA') || n.includes('RESSONANCIA'));
      const hasDocCNH = docNames.some(n => n.includes('CNH') || n.includes('HABILITACAO') || n.includes('HABILITAÇÃO'));
      const hasDocContaBancaria = docNames.some(n => n.includes('CONTA') || n.includes('BANCARI') || n.includes('PICPAY') || n.includes('NUBANK'));
      const hasDocCompResid = docNames.some(n => n.includes('COMP') && n.includes('RESID') || n.includes('COMPROVANTE DE RESIDENCIA'));

      // --- Calculate each step status ---

      // 1. Cliente cadastrado - always true if client exists
      const clienteCadastrado = !!client;

      // 2. Checklist IA - check record OR infer from documents
      let checklistStatus: string = 'pendente';
      if (checklist) {
        if (checklist.status === 'concluido' || checklist.concluido_em) {
          checklistStatus = 'concluido';
        } else {
          // Count filled fields to determine real completion
          const checklistFullRes: any = await supabase
            .from('client_checklist_ia' as any)
            .select('*')
            .eq('client_id', clientId)
            .maybeSingle();
          const checklistFull = checklistFullRes.data;
          if (checklistFull) {
            const skipFields = ['id', 'client_id', 'created_at', 'updated_at', 'status', 'concluido_em', 'concluido_por'];
            const allFields = Object.keys(checklistFull).filter(k => !skipFields.includes(k));
            const filledFields = allFields.filter(k => checklistFull[k] !== null && checklistFull[k] !== '' && checklistFull[k] !== undefined);
            const fillRatio = allFields.length > 0 ? filledFields.length / allFields.length : 0;
            if (fillRatio >= 0.8) {
              checklistStatus = 'concluido';
            } else if (filledFields.length > 0) {
              checklistStatus = 'em_preenchimento';
            }
          } else if (checklist.status === 'em_preenchimento') {
            checklistStatus = 'em_preenchimento';
          } else if (checklist.status) {
            checklistStatus = checklist.status;
          }
        }
      } else if (docs.length >= 3) {
        checklistStatus = 'concluido';
      }

      // 3. BAU Hospitalar - check records OR documents
      let bauAcionado = baus.length > 0 || hasDocBAU;
      let bauStatus: string | null = null;
      if (baus.length > 0) {
        const allConcluido = baus.every(b => ['concluido', 'recebido', 'validado'].includes(b.status));
        const anyEmAndamento = baus.some(b => ['em_andamento', 'solicitado', 'em_analise', 'aguardando'].includes(b.status));
        if (allConcluido) {
          bauStatus = 'concluido';
        } else if (anyEmAndamento || bauAcionado) {
          bauStatus = 'em_andamento';
        }
      } else if (hasDocBAU) {
        // Document exists but no formal BAU record - mark as concluido (doc received)
        bauStatus = 'concluido';
      }

      // 4. Boletim de Ocorrência - check records OR documents (CAT/BO)
      let boStatus: string | null = null;
      if (client?.has_police_report === true || client?.police_report_number || hasDocBO) {
        boStatus = 'concluido';
      } else if (checklist && checklist.status) {
        const checklistFullRes: any = await supabase
          .from('client_checklist_ia' as any)
          .select('bo_status')
          .eq('client_id', clientId)
          .maybeSingle();
        const checklistFull = checklistFullRes.data;
        if (checklistFull?.bo_status === 'sim_anexado') {
          boStatus = 'concluido';
        } else if (checklistFull?.bo_status && checklistFull.bo_status !== 'nao') {
          boStatus = 'em_andamento';
        }
      }

      // 5. Laudo Médico - check workflow data OR documents
      const existingWorkflow = workflowRes.data;
      let laudoStatus = existingWorkflow?.laudo_status || null;
      if (existingWorkflow?.laudo_medico && existingWorkflow?.laudo_cid) {
        laudoStatus = 'concluido';
      } else if (existingWorkflow?.laudo_medico || existingWorkflow?.laudo_cid) {
        laudoStatus = 'em_andamento';
      } else if (hasDocLaudo) {
        // Document with laudo/atestado exists - mark as concluido
        laudoStatus = 'concluido';
      }

      // 6. Protocolo
      let protocoloStatus: string | null = null;
      if (protocolos.length > 0) {
        const anyConcluido = protocolos.some(p => 
          ['concluido', 'deferido', 'pago', 'finalizado'].includes(p.status)
        );
        if (anyConcluido) {
          protocoloStatus = 'concluido';
        } else {
          protocoloStatus = 'em_andamento';
        }
      }

      // 7. Perícia
      let periciaLiberada = false;
      if (pericias.length > 0) {
        periciaLiberada = pericias.some(p => 
          ['realizada', 'concluida', 'concluido'].includes(p.status)
        );
      }

      // 8. Financeiro
      const financeiroLiberado = temFinanceiro || hasDocContaBancaria;

      // 9. Jurídico - check if there's a judicial process
      const processosRes: any = await supabase
        .from('processos_judiciais' as any)
        .select('id')
        .eq('cliente_id', clientId)
        .limit(1);
      const processos = processosRes.data;
      const juridicoLiberado = (processos || []).length > 0;

      // --- Build workflow update ---
      const workflowData = {
        client_id: clientId,
        cliente_cadastrado: clienteCadastrado,
        checklist_ia_status: checklistStatus,
        bau_acionado: bauAcionado,
        bau_status: bauStatus,
        bo_status: boStatus,
        laudo_status: laudoStatus,
        protocolo_status: protocoloStatus,
        pericia_liberada: periciaLiberada,
        financeiro_liberado: financeiroLiberado,
        juridico_liberado: juridicoLiberado,
        updated_at: new Date().toISOString(),
      };

      // Upsert workflow
      if (existingWorkflow) {
        await supabase
          .from('client_workflow' as any)
          .update(workflowData)
          .eq('client_id', clientId);
      } else {
        await supabase
          .from('client_workflow' as any)
          .insert(workflowData);
      }

      // Invalidate all related queries to refresh UI
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['client-workflow', clientId] }),
        queryClient.invalidateQueries({ queryKey: ['client-checklist', clientId] }),
      ]);

      return workflowData;
    } catch (error) {
      console.error('Erro ao recalcular workflow:', error);
    }
  }, [queryClient]);

  return { recalcular };
}
