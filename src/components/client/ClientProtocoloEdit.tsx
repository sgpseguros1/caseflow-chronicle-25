import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  useUpdateProtocolo, 
  useUpsertAuxilioAcidente, 
  useUpsertProtocoloFinanceiro,
  useProtocoloAuxilioAcidente,
  useProtocoloFinanceiro,
  useProtocoloDocumentos,
  useUpdateDocumentoStatus,
} from '@/hooks/useProtocolos';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useAdvogados } from '@/hooks/useAdvogados';
import { useSeguradoras } from '@/hooks/useSeguradoras';
import { useAuth } from '@/hooks/useAuth';
import { 
  NATUREZA_LABELS, 
  PRIORIDADE_LABELS,
  STATUS_PROTOCOLO_LABELS,
  TIPO_BENEFICIO_LABELS,
  STATUS_DOCUMENTO_LABELS,
  STATUS_DOCUMENTO_COLORS,
  NaturezaProtocolo,
  PrioridadeProtocolo,
  StatusProtocolo,
  TipoBeneficio,
  StatusDocumento,
} from '@/types/protocolo';
import type { Protocolo } from '@/types/protocolo';
import { Loader2, FileText, DollarSign, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ClientProtocoloEditProps {
  protocolo: Protocolo;
  onSuccess: () => void;
}

export function ClientProtocoloEdit({ protocolo, onSuccess }: ClientProtocoloEditProps) {
  const { user } = useAuth();
  const [observacaoHistorico, setObservacaoHistorico] = useState('');
  
  const updateProtocolo = useUpdateProtocolo();
  const upsertAuxilio = useUpsertAuxilioAcidente();
  const upsertFinanceiro = useUpsertProtocoloFinanceiro();
  const updateDocStatus = useUpdateDocumentoStatus();
  
  const { data: auxilioAcidente } = useProtocoloAuxilioAcidente(protocolo.id);
  const { data: financeiro } = useProtocoloFinanceiro(protocolo.id);
  const { data: documentos = [] } = useProtocoloDocumentos(protocolo.id);
  
  const { data: funcionarios = [] } = useFuncionarios();
  const { data: advogados = [] } = useAdvogados();
  const { data: seguradoras = [] } = useSeguradoras();

  const { register, handleSubmit, setValue, watch } = useForm({
    defaultValues: {
      natureza: protocolo.natureza,
      prioridade: protocolo.prioridade,
      status: protocolo.status,
      funcionario_id: protocolo.funcionario_id || '',
      advogado_id: protocolo.advogado_id || '',
      seguradora_id: protocolo.seguradora_id || '',
      observacoes: protocolo.observacoes || '',
      sla_dias: protocolo.sla_dias,
      prazo_estimado: protocolo.prazo_estimado || '',
    }
  });

  const { register: registerAuxilio, handleSubmit: handleSubmitAuxilio, setValue: setValueAuxilio, watch: watchAuxilio } = useForm({
    defaultValues: {
      data_acidente: auxilioAcidente?.data_acidente || '',
      data_requerimento: auxilioAcidente?.data_requerimento || '',
      numero_protocolo_inss: auxilioAcidente?.numero_protocolo_inss || '',
      tipo_beneficio: auxilioAcidente?.tipo_beneficio || '',
      situacao_atual: auxilioAcidente?.situacao_atual || '',
      pericia_realizada: auxilioAcidente?.pericia_realizada || false,
      data_pericia: auxilioAcidente?.data_pericia || '',
      resultado_pericia: auxilioAcidente?.resultado_pericia || '',
      judicializado: auxilioAcidente?.judicializado || false,
      numero_processo_judicial: auxilioAcidente?.numero_processo_judicial || '',
    }
  });

  const { register: registerFinanceiro, handleSubmit: handleSubmitFinanceiro } = useForm({
    defaultValues: {
      valor_estimado: financeiro?.valor_estimado || 0,
      valor_recebido: financeiro?.valor_recebido || 0,
      valor_a_receber: financeiro?.valor_a_receber || 0,
      percentual_honorario: financeiro?.percentual_honorario || null,
      valor_fixo_honorario: financeiro?.valor_fixo_honorario || null,
      honorarios_calculados: financeiro?.honorarios_calculados || 0,
      comissao_interna: financeiro?.comissao_interna || 0,
      prejuizo_registrado: financeiro?.prejuizo_registrado || 0,
      motivo_prejuizo: financeiro?.motivo_prejuizo || '',
      data_pagamento: financeiro?.data_pagamento || '',
    }
  });

  const periciaRealizada = watchAuxilio('pericia_realizada');
  const judicializado = watchAuxilio('judicializado');

  const onSubmitPrincipal = async (data: any) => {
    if (!observacaoHistorico.trim()) {
      alert('Por favor, informe a observação para o histórico');
      return;
    }
    
    await updateProtocolo.mutateAsync({
      id: protocolo.id,
      observacaoHistorico,
      natureza: data.natureza,
      prioridade: data.prioridade,
      status: data.status,
      funcionario_id: data.funcionario_id || null,
      advogado_id: data.advogado_id || null,
      seguradora_id: data.seguradora_id || null,
      observacoes: data.observacoes || null,
      sla_dias: data.sla_dias,
      prazo_estimado: data.prazo_estimado || null,
    });
    
    onSuccess();
  };

  const onSubmitAuxilio = async (data: any) => {
    await upsertAuxilio.mutateAsync({
      protocolo_id: protocolo.id,
      data_acidente: data.data_acidente || null,
      data_requerimento: data.data_requerimento || null,
      numero_protocolo_inss: data.numero_protocolo_inss || null,
      tipo_beneficio: data.tipo_beneficio || null,
      situacao_atual: data.situacao_atual || null,
      pericia_realizada: data.pericia_realizada,
      data_pericia: data.data_pericia || null,
      resultado_pericia: data.resultado_pericia || null,
      judicializado: data.judicializado,
      numero_processo_judicial: data.numero_processo_judicial || null,
    });
  };

  const onSubmitFinanceiro = async (data: any) => {
    await upsertFinanceiro.mutateAsync({
      protocolo_id: protocolo.id,
      valor_estimado: data.valor_estimado || 0,
      valor_recebido: data.valor_recebido || 0,
      valor_a_receber: data.valor_a_receber || 0,
      percentual_honorario: data.percentual_honorario || null,
      valor_fixo_honorario: data.valor_fixo_honorario || null,
      honorarios_calculados: data.honorarios_calculados || 0,
      comissao_interna: data.comissao_interna || 0,
      prejuizo_registrado: data.prejuizo_registrado || 0,
      motivo_prejuizo: data.motivo_prejuizo || null,
      data_pagamento: data.data_pagamento || null,
    });
  };

  const handleDocumentStatusChange = async (docId: string, newStatus: StatusDocumento) => {
    await updateDocStatus.mutateAsync({
      id: docId,
      status: newStatus,
      validado_por: newStatus === 'validado' ? user?.id : undefined,
    });
  };

  const isLoading = updateProtocolo.isPending || upsertAuxilio.isPending || upsertFinanceiro.isPending;

  return (
    <Tabs defaultValue="dados" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="dados">
          <ClipboardList className="h-4 w-4 mr-2" />
          Dados
        </TabsTrigger>
        {protocolo.tipo === 'AUXILIO_ACIDENTE' && (
          <TabsTrigger value="auxilio">INSS</TabsTrigger>
        )}
        <TabsTrigger value="documentos">
          <FileText className="h-4 w-4 mr-2" />
          Documentos
        </TabsTrigger>
        <TabsTrigger value="financeiro">
          <DollarSign className="h-4 w-4 mr-2" />
          Financeiro
        </TabsTrigger>
      </TabsList>

      {/* Aba Dados Principais */}
      <TabsContent value="dados">
        <form onSubmit={handleSubmit(onSubmitPrincipal)} className="space-y-4">
          <Card>
            <CardContent className="pt-6 grid gap-4 md:grid-cols-2">
              {/* Status */}
              <div className="space-y-2">
                <Label>Status *</Label>
                <Select 
                  defaultValue={protocolo.status} 
                  onValueChange={(v) => setValue('status', v as StatusProtocolo)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_PROTOCOLO_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Prioridade */}
              <div className="space-y-2">
                <Label>Prioridade</Label>
                <Select 
                  defaultValue={protocolo.prioridade} 
                  onValueChange={(v) => setValue('prioridade', v as PrioridadeProtocolo)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORIDADE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Natureza */}
              <div className="space-y-2">
                <Label>Natureza</Label>
                <Select 
                  defaultValue={protocolo.natureza} 
                  onValueChange={(v) => setValue('natureza', v as NaturezaProtocolo)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NATUREZA_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Funcionário Responsável */}
              <div className="space-y-2">
                <Label>Funcionário Responsável</Label>
                <Select 
                  defaultValue={protocolo.funcionario_id || ''}
                  onValueChange={(v) => setValue('funcionario_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {funcionarios.filter(f => f.status === 'ativo').map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Advogado */}
              <div className="space-y-2">
                <Label>Advogado</Label>
                <Select 
                  defaultValue={protocolo.advogado_id || ''}
                  onValueChange={(v) => setValue('advogado_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {advogados.filter(a => a.status === 'ativo').map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Seguradora */}
              <div className="space-y-2">
                <Label>Seguradora</Label>
                <Select 
                  defaultValue={protocolo.seguradora_id || ''}
                  onValueChange={(v) => setValue('seguradora_id', v)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {seguradoras.filter(s => s.status === 'ativo').map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.razao_social}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* SLA */}
              <div className="space-y-2">
                <Label>SLA (dias)</Label>
                <Input type="number" {...register('sla_dias', { valueAsNumber: true })} />
              </div>

              {/* Prazo Estimado */}
              <div className="space-y-2">
                <Label>Prazo Estimado</Label>
                <Input type="date" {...register('prazo_estimado')} />
              </div>

              {/* Observações */}
              <div className="space-y-2 md:col-span-2">
                <Label>Observações</Label>
                <Textarea {...register('observacoes')} rows={3} />
              </div>

              {/* Observação para histórico (obrigatória) */}
              <div className="space-y-2 md:col-span-2 border-t pt-4">
                <Label className="text-destructive">Motivo da Alteração (obrigatório para histórico) *</Label>
                <Textarea 
                  value={observacaoHistorico}
                  onChange={(e) => setObservacaoHistorico(e.target.value)}
                  placeholder="Descreva o motivo desta alteração..."
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={onSuccess}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isLoading || !observacaoHistorico.trim()}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Alterações
            </Button>
          </div>
        </form>
      </TabsContent>

      {/* Aba Auxílio-Acidente */}
      {protocolo.tipo === 'AUXILIO_ACIDENTE' && (
        <TabsContent value="auxilio">
          <form onSubmit={handleSubmitAuxilio(onSubmitAuxilio)} className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Auxílio-Acidente (INSS)</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Data do Acidente</Label>
                  <Input type="date" {...registerAuxilio('data_acidente')} />
                </div>

                <div className="space-y-2">
                  <Label>Data do Requerimento</Label>
                  <Input type="date" {...registerAuxilio('data_requerimento')} />
                </div>

                <div className="space-y-2">
                  <Label>Nº Protocolo INSS</Label>
                  <Input {...registerAuxilio('numero_protocolo_inss')} />
                </div>

                <div className="space-y-2">
                  <Label>Tipo de Benefício</Label>
                  <Select 
                    defaultValue={auxilioAcidente?.tipo_beneficio || ''}
                    onValueChange={(v) => setValueAuxilio('tipo_beneficio', v as TipoBeneficio)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.entries(TIPO_BENEFICIO_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label>Situação Atual</Label>
                  <Input {...registerAuxilio('situacao_atual')} />
                </div>

                <div className="flex items-center gap-3">
                  <Switch 
                    checked={periciaRealizada}
                    onCheckedChange={(v) => setValueAuxilio('pericia_realizada', v)}
                  />
                  <Label>Perícia Realizada</Label>
                </div>

                {periciaRealizada && (
                  <>
                    <div className="space-y-2">
                      <Label>Data da Perícia</Label>
                      <Input type="date" {...registerAuxilio('data_pericia')} />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <Label>Resultado da Perícia</Label>
                      <Input {...registerAuxilio('resultado_pericia')} />
                    </div>
                  </>
                )}

                <div className="flex items-center gap-3">
                  <Switch 
                    checked={judicializado}
                    onCheckedChange={(v) => setValueAuxilio('judicializado', v)}
                  />
                  <Label>Judicializado</Label>
                </div>

                {judicializado && (
                  <div className="space-y-2">
                    <Label>Nº Processo Judicial</Label>
                    <Input {...registerAuxilio('numero_processo_judicial')} />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button type="submit" disabled={upsertAuxilio.isPending}>
                {upsertAuxilio.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Salvar Dados INSS
              </Button>
            </div>
          </form>
        </TabsContent>
      )}

      {/* Aba Documentos */}
      <TabsContent value="documentos">
        <Card>
          <CardHeader>
            <CardTitle>Documentos do Protocolo</CardTitle>
          </CardHeader>
          <CardContent>
            {documentos.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhum documento cadastrado</p>
            ) : (
              <div className="space-y-3">
                {documentos.map((doc) => (
                  <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium">{doc.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {doc.categoria}
                          {doc.obrigatorio && <span className="text-destructive ml-2">• Obrigatório</span>}
                        </p>
                      </div>
                    </div>
                    <Select 
                      value={doc.status}
                      onValueChange={(v) => handleDocumentStatusChange(doc.id, v as StatusDocumento)}
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_DOCUMENTO_LABELS).map(([key, label]) => (
                          <SelectItem key={key} value={key}>{label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </TabsContent>

      {/* Aba Financeiro */}
      <TabsContent value="financeiro">
        <form onSubmit={handleSubmitFinanceiro(onSubmitFinanceiro)} className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Dados Financeiros</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Valor Estimado (R$)</Label>
                <Input type="number" step="0.01" {...registerFinanceiro('valor_estimado', { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label>Valor Recebido (R$)</Label>
                <Input type="number" step="0.01" {...registerFinanceiro('valor_recebido', { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label>Valor a Receber (R$)</Label>
                <Input type="number" step="0.01" {...registerFinanceiro('valor_a_receber', { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label>% Honorário</Label>
                <Input type="number" step="0.1" {...registerFinanceiro('percentual_honorario', { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label>Valor Fixo Honorário (R$)</Label>
                <Input type="number" step="0.01" {...registerFinanceiro('valor_fixo_honorario', { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label>Honorários Calculados (R$)</Label>
                <Input type="number" step="0.01" {...registerFinanceiro('honorarios_calculados', { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label>Comissão Interna (R$)</Label>
                <Input type="number" step="0.01" {...registerFinanceiro('comissao_interna', { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label>Data do Pagamento</Label>
                <Input type="date" {...registerFinanceiro('data_pagamento')} />
              </div>

              <div className="space-y-2">
                <Label>Prejuízo Registrado (R$)</Label>
                <Input type="number" step="0.01" {...registerFinanceiro('prejuizo_registrado', { valueAsNumber: true })} />
              </div>

              <div className="space-y-2">
                <Label>Motivo do Prejuízo</Label>
                <Input {...registerFinanceiro('motivo_prejuizo')} />
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button type="submit" disabled={upsertFinanceiro.isPending}>
              {upsertFinanceiro.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Salvar Dados Financeiros
            </Button>
          </div>
        </form>
      </TabsContent>
    </Tabs>
  );
}
