import { useState, useEffect } from 'react';
import { Save, AlertTriangle, CheckCircle2, Car, Briefcase, Heart, Search, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import { useClientChecklist, useCreateOrUpdateChecklist, useChecklistProgress, ClientChecklistIA } from '@/hooks/useClientChecklist';
import { useCreateOrUpdateWorkflow } from '@/hooks/useClientWorkflow';
import { useRecalcularWorkflow } from '@/hooks/useRecalcularWorkflow';

interface ClientChecklistTabProps {
  clientId: string;
}

const PERFIS_VITIMA = [
  { value: 'motorista', label: 'Motorista' },
  { value: 'passageiro', label: 'Passageiro' },
  { value: 'pedestre', label: 'Pedestre' },
  { value: 'ciclista', label: 'Ciclista' },
  { value: 'motoqueiro', label: 'Motoqueiro' },
  { value: 'motorista_app', label: 'Motorista de App' },
  { value: 'passageiro_onibus', label: 'Passageiro de Ônibus' },
  { value: 'passageiro_uber', label: 'Passageiro de App' },
];

const REGIMES_TRABALHO = [
  { value: 'clt', label: 'CLT' },
  { value: 'mei', label: 'MEI' },
  { value: 'autonomo', label: 'Autônomo' },
  { value: 'informal', label: 'Informal' },
  { value: 'servidor', label: 'Servidor Público' },
];

const PROVAS_DISPONIVEIS = [
  { value: 'video', label: 'Vídeo' },
  { value: 'foto', label: 'Fotos' },
  { value: 'testemunha', label: 'Testemunhas' },
  { value: 'bo', label: 'Boletim de Ocorrência' },
  { value: 'laudo', label: 'Laudos Médicos' },
  { value: 'orcamento', label: 'Orçamentos' },
  { value: 'nota_fiscal', label: 'Notas Fiscais' },
];

const DANOS_MATERIAIS = [
  { value: 'veiculo', label: 'Veículo' },
  { value: 'celular', label: 'Celular' },
  { value: 'oculos', label: 'Óculos' },
  { value: 'roupa', label: 'Roupas' },
  { value: 'bolsa', label: 'Bolsa/Carteira' },
  { value: 'equipamento', label: 'Equipamentos' },
  { value: 'outros', label: 'Outros' },
];

const IMPACTOS_MORAIS = [
  { value: 'trauma_psicologico', label: 'Trauma Psicológico' },
  { value: 'dificuldade_locomocao', label: 'Dificuldade de Locomoção' },
  { value: 'perda_qualidade_vida', label: 'Perda de Qualidade de Vida' },
  { value: 'abalo_emocional', label: 'Abalo Emocional' },
  { value: 'isolamento_social', label: 'Isolamento Social' },
  { value: 'depressao', label: 'Depressão' },
];

export function ClientChecklistTab({ clientId }: ClientChecklistTabProps) {
  const { data: checklist, isLoading } = useClientChecklist(clientId);
  const saveChecklist = useCreateOrUpdateChecklist();
  const updateWorkflow = useCreateOrUpdateWorkflow();
  const { recalcular } = useRecalcularWorkflow();
  const [formData, setFormData] = useState<Partial<ClientChecklistIA>>({});
  
  useEffect(() => {
    if (checklist) {
      setFormData(checklist);
    }
  }, [checklist]);

  const progress = useChecklistProgress(formData as ClientChecklistIA);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayToggle = (field: string, value: string) => {
    const current = (formData as any)[field] || [];
    const updated = current.includes(value)
      ? current.filter((v: string) => v !== value)
      : [...current, value];
    handleChange(field, updated);
  };

  const handleSave = async () => {
    try {
      const currentProgress = progress;
      
      const checklistStatus = currentProgress.isComplete ? 'concluido' : 'em_preenchimento';
      const completionData: Partial<ClientChecklistIA> = {
        ...formData,
        status: checklistStatus,
      };
      
      if (currentProgress.isComplete) {
        completionData.concluido_em = new Date().toISOString();
      }
      
      await saveChecklist.mutateAsync({ clientId, data: completionData });
      
      // Recalcular workflow completo baseado em dados reais
      await recalcular(clientId);
      
      toast.success('Checklist salvo com sucesso!');
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-32 bg-muted rounded-lg" />)}
    </div>;
  }

  const isTransito = formData.tipo_ocorrencia === 'transito';
  const isTrabalho = formData.tipo_ocorrencia === 'trabalho';

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="border-primary/20">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              {progress.isComplete ? (
                <CheckCircle2 className="h-8 w-8 text-green-600" />
              ) : (
                <AlertTriangle className="h-8 w-8 text-yellow-600" />
              )}
              <div>
                <h3 className="font-semibold text-lg">Checklist Obrigatório IA</h3>
                <p className="text-sm text-muted-foreground">
                  {progress.filled} de {progress.total} campos preenchidos
                </p>
              </div>
            </div>
            <Badge variant={progress.isComplete ? 'default' : 'secondary'} className="text-lg px-4 py-2">
              {progress.percentage}%
            </Badge>
          </div>
          <Progress value={progress.percentage} className="h-3" />
          {!progress.isComplete && (
            <p className="text-sm text-yellow-600 mt-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Preencha todos os campos obrigatórios para liberar a análise da IA
            </p>
          )}
        </CardContent>
      </Card>

      {/* Identificação do Caso */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5 text-primary" />
            Identificação do Caso
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Tipo de Ocorrência *</Label>
            <Select value={formData.tipo_ocorrencia || ''} onValueChange={(v) => handleChange('tipo_ocorrencia', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="transito">Trânsito</SelectItem>
                <SelectItem value="trabalho">Trabalho</SelectItem>
                <SelectItem value="pessoal">Pessoal (queda, doméstico)</SelectItem>
                <SelectItem value="outro">Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Data do Evento *</Label>
            <Input
              type="date"
              value={formData.data_evento || ''}
              onChange={(e) => handleChange('data_evento', e.target.value)}
            />
          </div>
          <div>
            <Label>Cidade/UF do Evento *</Label>
            <Input
              value={formData.cidade_uf_evento || ''}
              onChange={(e) => handleChange('cidade_uf_evento', e.target.value)}
              placeholder="Ex: São Paulo/SP"
            />
          </div>
          <div>
            <Label>Boletim de Ocorrência *</Label>
            <Select value={formData.bo_status || ''} onValueChange={(v) => handleChange('bo_status', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sim_anexado">Sim, anexado</SelectItem>
                <SelectItem value="sim_nao_anexado">Sim, mas não anexado</SelectItem>
                <SelectItem value="nao">Não possui</SelectItem>
                <SelectItem value="nao_sabe">Não sabe</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-4">
            <Switch
              checked={formData.atendimento_medico || false}
              onCheckedChange={(v) => handleChange('atendimento_medico', v)}
            />
            <Label>Teve atendimento médico? *</Label>
          </div>
          <div className="flex items-center gap-4">
            <Switch
              checked={formData.internacao || false}
              onCheckedChange={(v) => handleChange('internacao', v)}
            />
            <Label>Foi internado?</Label>
          </div>
        </CardContent>
      </Card>

      {/* Bloco Trânsito */}
      {isTransito && (
        <Card className="border-blue-200 bg-blue-50/30 dark:bg-blue-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-400">
              <Car className="h-5 w-5" />
              Bloco Trânsito
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Perfil da Vítima *</Label>
              <Select value={formData.perfil_vitima || ''} onValueChange={(v) => handleChange('perfil_vitima', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {PERFIS_VITIMA.map(p => (
                    <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Usava Equipamento de Segurança? *</Label>
              <Select value={formData.usava_equipamento_seguranca || ''} onValueChange={(v) => handleChange('usava_equipamento_seguranca', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim (cinto/capacete)</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="nao_sabe">Não sabe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Veículos Envolvidos *</Label>
              <Input
                type="number"
                min="1"
                value={formData.veiculos_envolvidos || ''}
                onChange={(e) => handleChange('veiculos_envolvidos', parseInt(e.target.value) || null)}
              />
            </div>
            <div>
              <Label>Terceiro Identificado? *</Label>
              <Select value={formData.terceiro_identificado || ''} onValueChange={(v) => handleChange('terceiro_identificado', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="nao_sabe">Não sabe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.terceiro_identificado === 'sim' && (
              <>
                <div>
                  <Label>Placa do Terceiro</Label>
                  <Input
                    value={formData.placa_terceiro || ''}
                    onChange={(e) => handleChange('placa_terceiro', e.target.value.toUpperCase())}
                    placeholder="ABC-1234"
                  />
                </div>
                <div>
                  <Label>Terceiro Tem Seguro?</Label>
                  <Select value={formData.terceiro_tem_seguro || ''} onValueChange={(v) => handleChange('terceiro_tem_seguro', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sim">Sim</SelectItem>
                      <SelectItem value="nao">Não</SelectItem>
                      <SelectItem value="nao_sabe">Não sabe</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
            <div>
              <Label>Veículo do Cliente *</Label>
              <Select value={formData.veiculo_cliente || ''} onValueChange={(v) => handleChange('veiculo_cliente', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="proprio">Próprio</SelectItem>
                  <SelectItem value="emprestado">Emprestado</SelectItem>
                  <SelectItem value="alugado">Alugado</SelectItem>
                  <SelectItem value="empresa">Da Empresa</SelectItem>
                  <SelectItem value="nao_tinha">Não tinha veículo</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Veículo Financiado?</Label>
              <Select value={formData.veiculo_financiado || ''} onValueChange={(v) => handleChange('veiculo_financiado', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quitado">Quitado</SelectItem>
                  <SelectItem value="financiado">Financiado</SelectItem>
                  <SelectItem value="consorcio">Consórcio</SelectItem>
                  <SelectItem value="nao_sabe">Não sabe</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-4">
              <Switch
                checked={formData.veiculo_segurado || false}
                onCheckedChange={(v) => handleChange('veiculo_segurado', v)}
              />
              <Label>Veículo é segurado?</Label>
            </div>
            <div>
              <Label>Culpa do Cliente? *</Label>
              <Select value={formData.culpa_cliente || ''} onValueChange={(v) => handleChange('culpa_cliente', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="certo">Cliente estava certo</SelectItem>
                  <SelectItem value="errado">Cliente estava errado</SelectItem>
                  <SelectItem value="parcial">Culpa parcial</SelectItem>
                  <SelectItem value="nao_sabe">Não sabe</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bloco Trabalho */}
      {(isTrabalho || formData.trabalhava) && (
        <Card className="border-orange-200 bg-orange-50/30 dark:bg-orange-950/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700 dark:text-orange-400">
              <Briefcase className="h-5 w-5" />
              Bloco Trabalho / INSS
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-4">
              <Switch
                checked={formData.trabalhava || false}
                onCheckedChange={(v) => handleChange('trabalhava', v)}
              />
              <Label>Trabalhava na época? *</Label>
            </div>
            {formData.trabalhava && (
              <>
                <div>
                  <Label>Regime de Trabalho *</Label>
                  <Select value={formData.regime_trabalho || ''} onValueChange={(v) => handleChange('regime_trabalho', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGIMES_TRABALHO.map(r => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>CNPJ da Empresa</Label>
                  <Input
                    value={formData.empresa_cnpj || ''}
                    onChange={(e) => handleChange('empresa_cnpj', e.target.value)}
                    placeholder="00.000.000/0000-00"
                  />
                </div>
                <div>
                  <Label>Função/Cargo</Label>
                  <Input
                    value={formData.funcao_cargo || ''}
                    onChange={(e) => handleChange('funcao_cargo', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={formData.havia_epi || false}
                    onCheckedChange={(v) => handleChange('havia_epi', v)}
                  />
                  <Label>Havia EPI disponível?</Label>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={formData.havia_treinamento || false}
                    onCheckedChange={(v) => handleChange('havia_treinamento', v)}
                  />
                  <Label>Teve treinamento?</Label>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={formData.houve_cat || false}
                    onCheckedChange={(v) => handleChange('houve_cat', v)}
                  />
                  <Label>Houve CAT? *</Label>
                </div>
                <div>
                  <Label>Tipo de Acidente *</Label>
                  <Select value={formData.tipo_acidente_trabalho || ''} onValueChange={(v) => handleChange('tipo_acidente_trabalho', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="dentro">Dentro da empresa</SelectItem>
                      <SelectItem value="trajeto">No trajeto</SelectItem>
                      <SelectItem value="fora">Fora (a serviço)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    checked={formData.e_motorista_app || false}
                    onCheckedChange={(v) => handleChange('e_motorista_app', v)}
                  />
                  <Label>É motorista de App?</Label>
                </div>
              </>
            )}
            
            {/* INSS */}
            <div className="md:col-span-2 border-t pt-4 mt-2">
              <h4 className="font-semibold mb-3">Dados INSS</h4>
            </div>
            <div className="flex items-center gap-4">
              <Switch
                checked={formData.contribuia_inss || false}
                onCheckedChange={(v) => handleChange('contribuia_inss', v)}
              />
              <Label>Contribuía INSS? *</Label>
            </div>
            <div className="flex items-center gap-4">
              <Switch
                checked={formData.afastamento_15_dias || false}
                onCheckedChange={(v) => handleChange('afastamento_15_dias', v)}
              />
              <Label>Afastamento +15 dias? *</Label>
            </div>
            <div className="flex items-center gap-4">
              <Switch
                checked={formData.recebeu_beneficio || false}
                onCheckedChange={(v) => handleChange('recebeu_beneficio', v)}
              />
              <Label>Recebeu benefício?</Label>
            </div>
            {formData.recebeu_beneficio && (
              <div>
                <Label>Qual benefício?</Label>
                <Input
                  value={formData.beneficio_recebido || ''}
                  onChange={(e) => handleChange('beneficio_recebido', e.target.value)}
                  placeholder="Ex: Auxílio-doença"
                />
              </div>
            )}
            <div>
              <Label>Incapacidade Atual</Label>
              <Select value={formData.incapacidade_atual || ''} onValueChange={(v) => handleChange('incapacidade_atual', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                  <SelectItem value="em_avaliacao">Em avaliação</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Danos e Lesões */}
      <Card className="border-red-200 bg-red-50/30 dark:bg-red-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
            <Heart className="h-5 w-5" />
            Danos e Lesões
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-4">
            <Switch
              checked={formData.lesao_corporal || false}
              onCheckedChange={(v) => handleChange('lesao_corporal', v)}
            />
            <Label>Houve lesão corporal? *</Label>
          </div>
          <div>
            <Label>Sequelas *</Label>
            <Select value={formData.sequelas || ''} onValueChange={(v) => handleChange('sequelas', v)}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
                <SelectItem value="em_avaliacao">Em avaliação</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {formData.sequelas === 'sim' && (
            <div>
              <Label>Sequela Permanente?</Label>
              <Select value={formData.sequela_permanente || ''} onValueChange={(v) => handleChange('sequela_permanente', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sim">Sim</SelectItem>
                  <SelectItem value="nao">Não</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          <div className="flex items-center gap-4">
            <Switch
              checked={formData.obito || false}
              onCheckedChange={(v) => handleChange('obito', v)}
            />
            <Label>Houve óbito?</Label>
          </div>
          <div className="flex items-center gap-4">
            <Switch
              checked={formData.afastamento || false}
              onCheckedChange={(v) => handleChange('afastamento', v)}
            />
            <Label>Houve afastamento do trabalho?</Label>
          </div>
          <div className="flex items-center gap-4">
            <Switch
              checked={formData.perda_renda || false}
              onCheckedChange={(v) => handleChange('perda_renda', v)}
            />
            <Label>Houve perda de renda?</Label>
          </div>

          <div className="md:col-span-2">
            <Label>Danos Materiais</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {DANOS_MATERIAIS.map(d => (
                <label key={d.value} className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted">
                  <Checkbox
                    checked={(formData.danos_materiais || []).includes(d.value)}
                    onCheckedChange={() => handleArrayToggle('danos_materiais', d.value)}
                  />
                  <span className="text-sm">{d.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <Label>Provas Disponíveis</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {PROVAS_DISPONIVEIS.map(p => (
                <label key={p.value} className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted">
                  <Checkbox
                    checked={(formData.provas_disponiveis || []).includes(p.value)}
                    onCheckedChange={() => handleArrayToggle('provas_disponiveis', p.value)}
                  />
                  <span className="text-sm">{p.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="md:col-span-2">
            <Label>Impacto Moral</Label>
            <div className="flex flex-wrap gap-2 mt-2">
              {IMPACTOS_MORAIS.map(i => (
                <label key={i.value} className="flex items-center gap-2 border rounded-lg px-3 py-2 cursor-pointer hover:bg-muted">
                  <Checkbox
                    checked={(formData.impacto_moral || []).includes(i.value)}
                    onCheckedChange={() => handleArrayToggle('impacto_moral', i.value)}
                  />
                  <span className="text-sm">{i.label}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Caça-Seguro */}
      <Card className="border-purple-200 bg-purple-50/30 dark:bg-purple-950/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-purple-700 dark:text-purple-400">
            <Shield className="h-5 w-5" />
            🔍 Caça-Seguro (Detector de Seguros)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            A IA utiliza esses dados para identificar possíveis seguros que o cliente pode ter
          </p>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="flex items-center gap-4">
            <Switch
              checked={formData.tem_conta_banco || false}
              onCheckedChange={(v) => handleChange('tem_conta_banco', v)}
            />
            <Label>Possui conta bancária? *</Label>
          </div>
          <div className="flex items-center gap-4">
            <Switch
              checked={formData.tem_cartao_credito || false}
              onCheckedChange={(v) => handleChange('tem_cartao_credito', v)}
            />
            <Label>Possui cartão de crédito? *</Label>
          </div>
          <div className="flex items-center gap-4">
            <Switch
              checked={formData.tem_emprestimo || false}
              onCheckedChange={(v) => handleChange('tem_emprestimo', v)}
            />
            <Label>Possui empréstimo ativo? *</Label>
          </div>
          <div className="flex items-center gap-4">
            <Switch
              checked={formData.fez_financiamento || false}
              onCheckedChange={(v) => handleChange('fez_financiamento', v)}
            />
            <Label>Fez financiamento? *</Label>
          </div>
          <div className="flex items-center gap-4">
            <Switch
              checked={formData.usa_fintech || false}
              onCheckedChange={(v) => handleChange('usa_fintech', v)}
            />
            <Label>Usa app de pagamento (Nubank, PicPay)?</Label>
          </div>
          <div className="flex items-center gap-4">
            <Switch
              checked={formData.e_clt || false}
              onCheckedChange={(v) => handleChange('e_clt', v)}
            />
            <Label>É CLT?</Label>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end gap-3">
        <Button
          onClick={handleSave}
          disabled={saveChecklist.isPending}
          className="gap-2"
          size="lg"
        >
          <Save className="h-5 w-5" />
          {saveChecklist.isPending ? 'Salvando...' : 'Salvar Checklist'}
        </Button>
      </div>
    </div>
  );
}
