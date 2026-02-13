import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateProtocolo, useUpsertAuxilioAcidente, useUpsertProtocoloFinanceiro } from '@/hooks/useProtocolos';
import { useRecalcularWorkflow } from '@/hooks/useRecalcularWorkflow';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useAdvogados } from '@/hooks/useAdvogados';
import { useSeguradoras } from '@/hooks/useSeguradoras';
import { 
  TIPO_PROTOCOLO_LABELS, 
  NATUREZA_LABELS, 
  PRIORIDADE_LABELS,
  STATUS_PROTOCOLO_LABELS,
  TIPO_BENEFICIO_LABELS,
  TipoProtocolo,
  NaturezaProtocolo,
  PrioridadeProtocolo,
  StatusProtocolo,
  TipoBeneficio,
} from '@/types/protocolo';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ClientProtocoloFormProps {
  clienteId: string;
  onSuccess: () => void;
}

interface FormData {
  natureza: NaturezaProtocolo;
  prioridade: PrioridadeProtocolo;
  status: StatusProtocolo;
  funcionario_id: string;
  advogado_id: string;
  seguradora_id: string;
  observacoes: string;
  sla_dias: number;
  prazo_estimado: string;
  data_acidente: string;
  data_requerimento: string;
  numero_protocolo_inss: string;
  tipo_beneficio: TipoBeneficio | '' | '__none__';
  situacao_atual: string;
  pericia_realizada: boolean;
  data_pericia: string;
  resultado_pericia: string;
  judicializado: boolean;
  numero_processo_judicial: string;
  valor_estimado: number;
}

export function ClientProtocoloForm({ clienteId, onSuccess }: ClientProtocoloFormProps) {
  const [tipo, setTipo] = useState<TipoProtocolo>('AUXILIO_ACIDENTE');
  const [showAuxilioFields, setShowAuxilioFields] = useState(true);
  
  const createProtocolo = useCreateProtocolo();
  const upsertAuxilio = useUpsertAuxilioAcidente();
  const upsertFinanceiro = useUpsertProtocoloFinanceiro();
  const { recalcular } = useRecalcularWorkflow();
  
  const { data: funcionarios = [] } = useFuncionarios();
  const { data: advogados = [] } = useAdvogados();
  const { data: seguradoras = [] } = useSeguradoras();

  const { register, handleSubmit, setValue, watch, control, formState: { errors } } = useForm<FormData>({
    defaultValues: {
      natureza: 'ADMINISTRATIVO',
      prioridade: 'normal',
      status: 'novo',
      funcionario_id: '__none__',
      advogado_id: '__none__',
      seguradora_id: '__none__',
      observacoes: '',
      sla_dias: 30,
      prazo_estimado: '',
      data_acidente: '',
      data_requerimento: '',
      numero_protocolo_inss: '',
      tipo_beneficio: '__none__',
      situacao_atual: '',
      pericia_realizada: false,
      data_pericia: '',
      resultado_pericia: '',
      judicializado: false,
      numero_processo_judicial: '',
      valor_estimado: 0,
    }
  });

  const periciaRealizada = watch('pericia_realizada');
  const judicializado = watch('judicializado');

  const onSubmit = async (data: FormData) => {
    try {
      // Build clean insert payload - only include fields that exist in the protocolos table
      const insertPayload: Record<string, any> = {
        cliente_id: clienteId,
        tipo,
        natureza: data.natureza,
        prioridade: data.prioridade,
        status: data.status,
        observacoes: data.observacoes || null,
        sla_dias: data.sla_dias,
      };

      // Only add optional FK fields if they have valid values
      if (data.funcionario_id && data.funcionario_id !== '__none__') {
        insertPayload.funcionario_id = data.funcionario_id;
      }
      if (data.advogado_id && data.advogado_id !== '__none__') {
        insertPayload.advogado_id = data.advogado_id;
      }
      if (data.seguradora_id && data.seguradora_id !== '__none__') {
        insertPayload.seguradora_id = data.seguradora_id;
      }
      if (data.prazo_estimado) {
        insertPayload.prazo_estimado = data.prazo_estimado;
      }

      console.log('Inserindo protocolo:', insertPayload);

      // 1. Criar protocolo principal
      const result = await createProtocolo.mutateAsync(insertPayload as any);

      // 2. Se for Auxílio-Acidente, criar dados específicos
      if (tipo === 'AUXILIO_ACIDENTE') {
        await upsertAuxilio.mutateAsync({
          protocolo_id: result.id,
          data_acidente: data.data_acidente || null,
          data_requerimento: data.data_requerimento || null,
          numero_protocolo_inss: data.numero_protocolo_inss || null,
          tipo_beneficio: data.tipo_beneficio === '__none__' || !data.tipo_beneficio ? null : data.tipo_beneficio,
          situacao_atual: data.situacao_atual || null,
          pericia_realizada: data.pericia_realizada,
          data_pericia: data.data_pericia || null,
          resultado_pericia: data.resultado_pericia || null,
          judicializado: data.judicializado,
          numero_processo_judicial: data.numero_processo_judicial || null,
        });
      }

      // 3. Criar dados financeiros iniciais
      if (data.valor_estimado > 0) {
        await upsertFinanceiro.mutateAsync({
          protocolo_id: result.id,
          valor_estimado: data.valor_estimado,
        });
      }

      // Recalcular workflow após criação de protocolo
      await recalcular(clienteId);

      toast.success('Protocolo criado com sucesso!');
      onSuccess();
    } catch (error: any) {
      console.error('Erro ao criar protocolo:', error);
      const msg = error?.message || 'Erro desconhecido';
      toast.error(`Erro ao criar protocolo: ${msg}`);
    }
  };

  const handleTipoChange = (value: TipoProtocolo) => {
    setTipo(value);
    setShowAuxilioFields(value === 'AUXILIO_ACIDENTE');
  };

  const isLoading = createProtocolo.isPending || upsertAuxilio.isPending || upsertFinanceiro.isPending;

  // Filtrar apenas funcionários e advogados ativos
  const funcionariosAtivos = funcionarios.filter(f => f.status === 'ativo' && !f.deleted_at);
  const advogadosAtivos = advogados.filter(a => a.status === 'ativo');
  const seguradorasAtivas = seguradoras.filter(s => s.status === 'ativo');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Dados Principais */}
      <Card>
        <CardHeader>
          <CardTitle>Dados do Protocolo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          {/* Tipo */}
          <div className="space-y-2">
            <Label>Tipo do Protocolo *</Label>
            <Select value={tipo} onValueChange={handleTipoChange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TIPO_PROTOCOLO_LABELS).map(([key, label]) => (
                  <SelectItem key={key} value={key}>{label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Natureza */}
          <div className="space-y-2">
            <Label>Natureza *</Label>
            <Controller
              name="natureza"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(NATUREZA_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Prioridade */}
          <div className="space-y-2">
            <Label>Prioridade</Label>
            <Controller
              name="prioridade"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PRIORIDADE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Status Inicial */}
          <div className="space-y-2">
            <Label>Status Inicial</Label>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(STATUS_PROTOCOLO_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Funcionário Responsável */}
          <div className="space-y-2">
            <Label>Funcionário Responsável</Label>
            <Controller
              name="funcionario_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value || '__none__'} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {funcionariosAtivos.map((f) => (
                      <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Advogado */}
          <div className="space-y-2">
            <Label>Advogado</Label>
            <Controller
              name="advogado_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value || '__none__'} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhum</SelectItem>
                    {advogadosAtivos.map((a) => (
                      <SelectItem key={a.id} value={a.id}>{a.nome} - OAB {a.oab}/{a.uf}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>

          {/* Seguradora */}
          <div className="space-y-2">
            <Label>Seguradora</Label>
            <Controller
              name="seguradora_id"
              control={control}
              render={({ field }) => (
                <Select value={field.value || '__none__'} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none__">Nenhuma</SelectItem>
                    {seguradorasAtivas.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.razao_social}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
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

          {/* Valor Estimado */}
          <div className="space-y-2">
            <Label>Valor Estimado (R$)</Label>
            <Input type="number" step="0.01" {...register('valor_estimado', { valueAsNumber: true })} />
          </div>

          {/* Observações */}
          <div className="space-y-2 md:col-span-2">
            <Label>Observações</Label>
            <Textarea {...register('observacoes')} rows={3} />
          </div>
        </CardContent>
      </Card>

      {/* Campos específicos Auxílio-Acidente */}
      {showAuxilioFields && (
        <Card>
          <CardHeader>
            <CardTitle>Dados do Auxílio-Acidente (INSS)</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label>Data do Acidente</Label>
              <Input type="date" {...register('data_acidente')} />
            </div>

            <div className="space-y-2">
              <Label>Data do Requerimento</Label>
              <Input type="date" {...register('data_requerimento')} />
            </div>

            <div className="space-y-2">
              <Label>Nº Protocolo INSS</Label>
              <Input {...register('numero_protocolo_inss')} />
            </div>

            <div className="space-y-2">
              <Label>Tipo de Benefício</Label>
              <Controller
                name="tipo_beneficio"
                control={control}
                render={({ field }) => (
                  <Select value={field.value || '__none__'} onValueChange={field.onChange}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Nenhum</SelectItem>
                      {Object.entries(TIPO_BENEFICIO_LABELS).map(([key, label]) => (
                        <SelectItem key={key} value={key}>{label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label>Situação Atual</Label>
              <Input {...register('situacao_atual')} placeholder="Descreva a situação atual do processo" />
            </div>

            <div className="flex items-center gap-3">
              <Controller
                name="pericia_realizada"
                control={control}
                render={({ field }) => (
                  <Switch 
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label>Perícia Realizada</Label>
            </div>

            {periciaRealizada && (
              <>
                <div className="space-y-2">
                  <Label>Data da Perícia</Label>
                  <Input type="date" {...register('data_pericia')} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <Label>Resultado da Perícia</Label>
                  <Input {...register('resultado_pericia')} />
                </div>
              </>
            )}

            <div className="flex items-center gap-3">
              <Controller
                name="judicializado"
                control={control}
                render={({ field }) => (
                  <Switch 
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                )}
              />
              <Label>Judicializado</Label>
            </div>

            {judicializado && (
              <div className="space-y-2">
                <Label>Nº Processo Judicial</Label>
                <Input {...register('numero_processo_judicial')} />
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onSuccess}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Criar Protocolo
        </Button>
      </div>
    </form>
  );
}
