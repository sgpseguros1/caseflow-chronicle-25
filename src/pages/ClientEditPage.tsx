import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Save, User, MapPin, Phone, Building2, Car, Stethoscope, Hospital, UserPlus, FileText, Upload, Loader2, Sparkles, FileStack, Bot, AlertTriangle, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useExtendedClient, useUpdateExtendedClient, useClientDocuments, useUploadClientDocument } from '@/hooks/useExtendedClients';
import { useClientPermissions } from '@/hooks/useClientPermissions';
import { useAdvogados } from '@/hooks/useAdvogados';
import { useSeguradoras } from '@/hooks/useSeguradoras';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { useAuth } from '@/hooks/useAuth';
import { useClientChecklist, useChecklistProgress } from '@/hooks/useClientChecklist';
import { isValidCPF, formatCPF } from '@/lib/documentValidation';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ACCIDENT_TYPES, INJURY_SEVERITIES, BODY_PARTS, REFERRAL_TYPES, DOCUMENT_CATEGORIES } from '@/types/client';
import type { ExtendedClient } from '@/types/client';
import { supabase } from '@/integrations/supabase/client';
import { ClientProtocolosTab } from '@/components/client/ClientProtocolosTab';
import { ClientIAAnaliseSection } from '@/components/client/ClientIAAnaliseSection';
import { ClientChecklistTab } from '@/components/client/ClientChecklistTab';
import { ClientSeguradorasTab } from '@/components/client/ClientSeguradorasTab';
import { ClientWorkflowSection } from '@/components/client/ClientWorkflowSection';
import type { ClienteContexto } from '@/hooks/useIAAnalise';

const UF_OPTIONS = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export default function ClientEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'dados';
  const { user } = useAuth();
  const { canEdit } = useClientPermissions();
  const { data: client, isLoading } = useExtendedClient(id);
  const updateClient = useUpdateExtendedClient();
  const { data: documents = [] } = useClientDocuments(id);
  const uploadDocument = useUploadClientDocument();
  // REMOVIDO: deleteDocument - ninguém pode excluir documentos
  const { data: advogados = [] } = useAdvogados();
  const { data: seguradoras = [] } = useSeguradoras();
  const { data: funcionarios = [] } = useFuncionarios();
  
  // Checklist validation
  const { data: checklist, isLoading: isChecklistLoading } = useClientChecklist(id);
  const checklistProgress = useChecklistProgress(checklist);
  
  const [cpfError, setCpfError] = useState('');
  const [formData, setFormData] = useState<Partial<ExtendedClient>>({});
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCategory, setUploadCategory] = useState('');
  const [showChecklistError, setShowChecklistError] = useState(false);

  useEffect(() => {
    if (client) {
      setFormData(client);
    }
  }, [client]);

  if (!canEdit) {
    navigate(`/clientes/${id}`);
    return null;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Cliente não encontrado</p>
        <Button className="mt-4" onClick={() => navigate('/clientes')}>
          Voltar para Clientes
        </Button>
      </div>
    );
  }

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'cpf') {
      setCpfError('');
    }
  };

  const handleCpfBlur = () => {
    if (formData.cpf && formData.cpf.trim() !== '') {
      if (!isValidCPF(formData.cpf)) {
        setCpfError('CPF inválido');
      } else {
        setCpfError('');
        setFormData(prev => ({ ...prev, cpf: formatCPF(prev.cpf || '') }));
      }
    }
  };

  const handleCepSearch = async () => {
    if (!formData.cep || formData.cep.length < 8) return;
    const cleanCep = formData.cep.replace(/\D/g, '');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          uf: data.uf || '',
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação do CPF apenas como aviso (não bloqueia salvamento)
    if (formData.cpf && formData.cpf.trim() !== '' && !isValidCPF(formData.cpf)) {
      setCpfError('CPF inválido');
      // Apenas aviso, não impede salvamento
    }

    if (!id) return;

    try {
      // Salvar os dados do cliente - SEMPRE SALVA independente de campos vazios
      await updateClient.mutateAsync({
        id,
        ...formData,
      });
      
      toast.success('Cliente salvo com sucesso!');
      
      // Mostrar aviso sobre checklist se incompleto (apenas informativo)
      if (!checklistProgress.isComplete) {
        toast.info(
          `Checklist IA em ${checklistProgress.percentage}%. Complete para análise automática.`,
          { duration: 4000 }
        );
      }
      
      navigate(`/clientes/${id}`);
    } catch (error) {
      console.error('Erro ao salvar cliente:', error);
      // O toast de erro já é exibido pelo hook
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;

    await uploadDocument.mutateAsync({
      clientId: id,
      file,
      category: uploadCategory,
      userId: user?.id,
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    setUploadCategory('');
  };

  // REMOVIDO: Ninguém pode excluir documentos
  // const handleDeleteDocument = async (docId: string, filePath: string) => {
  //   if (!id) return;
  //   await deleteDocument.mutateAsync({ id: docId, filePath, clientId: id });
  // };

  // Download de documento
  const downloadDocument = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('client-documents').download(filePath);
      if (error) throw error;
      if (data) {
        const url = URL.createObjectURL(data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Erro ao baixar documento:', error);
      toast.error('Erro ao baixar documento');
    }
  };

  const getAiSuggestion = async () => {
    if (!formData.accident_type || !formData.injuries) {
      toast.error('Preencha o tipo de acidente e as lesões para obter sugestões.');
      return;
    }

    setIsAiLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: {
          message: `Com base nas seguintes informações de um cliente:
- Tipo de acidente: ${formData.accident_type}
- Lesões: ${formData.injuries}
- Parte do corpo afetada: ${formData.body_part_affected || 'Não informado'}
- Grau da lesão: ${formData.injury_severity || 'Não informado'}
- Possui sequelas: ${formData.has_sequelae ? 'Sim' : 'Não'}

Por favor, sugira:
1. Tipo de processo mais adequado (DPVAT, INSS, Vida, etc.)
2. Riscos potenciais do caso
3. Documentos que devem ser solicitados
4. Próximos passos recomendados

Responda de forma objetiva e profissional.`,
          type: 'legal_analysis'
        }
      });

      if (error) throw error;
      setAiSuggestion(data.response);
    } catch (error) {
      console.error('Erro ao obter sugestão:', error);
      toast.error('Erro ao obter sugestão da IA.');
    } finally {
      setIsAiLoading(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(`/clientes/${id}`)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Editar Cliente</h1>
          <p className="text-muted-foreground">{client.name} - #{client.code}</p>
        </div>
      </div>

      {/* Workflow Section - Always visible at top */}
      {id && (
        <ClientWorkflowSection clientId={id} />
      )}

      {/* Alerta de Checklist - Apenas Informativo */}
      {!checklistProgress.isComplete && (
        <Alert className="border-warning/50 bg-warning/10">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <AlertDescription className="text-warning-foreground">
            <strong>Checklist IA incompleto ({checklistProgress.percentage}%)</strong> - Complete para liberar análise automática da IA.
          </AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue={defaultTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-8">
          <TabsTrigger value="dados">Pessoais</TabsTrigger>
          <TabsTrigger 
            value="checklist" 
            className={`gap-1 font-semibold ${
              !checklistProgress.isComplete 
                ? 'text-destructive bg-destructive/10' 
                : 'text-primary'
            }`}
          >
            <Bot className="h-4 w-4" />
            Checklist IA
            {!checklistProgress.isComplete && (
              <span className="ml-1 text-xs">({checklistProgress.percentage}%)</span>
            )}
          </TabsTrigger>
          <TabsTrigger value="seguradoras">Seguradoras</TabsTrigger>
          <TabsTrigger value="acidente">Acidente</TabsTrigger>
          <TabsTrigger value="medico">Médico</TabsTrigger>
          <TabsTrigger value="vinculos">Vínculos</TabsTrigger>
          <TabsTrigger value="documentos">Docs</TabsTrigger>
          <TabsTrigger value="protocolos">Protocolos</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="dados" className="space-y-4">
            {/* Personal Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="name">Nome Completo *</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    disabled
                    className="bg-muted cursor-not-allowed"
                    title="O nome do cliente não pode ser alterado"
                  />
                  <p className="text-xs text-muted-foreground mt-1">O nome não pode ser alterado</p>
                </div>
                <div>
                  <Label htmlFor="cpf">CPF</Label>
                  <Input
                    id="cpf"
                    value={formData.cpf || ''}
                    onChange={(e) => handleChange('cpf', e.target.value)}
                    onBlur={handleCpfBlur}
                    className={cpfError ? 'border-destructive' : ''}
                  />
                  {cpfError && <p className="text-sm text-destructive mt-1">{cpfError}</p>}
                </div>
                <div>
                  <Label htmlFor="rg">RG</Label>
                  <Input
                    id="rg"
                    value={formData.rg || ''}
                    onChange={(e) => handleChange('rg', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="birth_date">Data de Nascimento</Label>
                  <Input
                    id="birth_date"
                    type="date"
                    value={formData.birth_date || ''}
                    disabled
                    className="bg-muted cursor-not-allowed"
                    title="A data de nascimento não pode ser alterada"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Não pode ser alterada</p>
                </div>
                <div>
                  <Label htmlFor="civil_status">Estado Civil</Label>
                  <Select value={formData.civil_status || ''} onValueChange={(v) => handleChange('civil_status', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                      <SelectItem value="casado">Casado(a)</SelectItem>
                      <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                      <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                      <SelectItem value="uniao_estavel">União Estável</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="profession">Profissão</Label>
                  <Input
                    id="profession"
                    value={formData.profession || ''}
                    onChange={(e) => handleChange('profession', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Switch
                      id="is_clt"
                      checked={formData.is_clt || false}
                      onCheckedChange={(v) => handleChange('is_clt', v)}
                    />
                    <Label htmlFor="is_clt">Trabalha CLT</Label>
                  </div>
                </div>
                {formData.is_clt && (
                  <div>
                    <Label htmlFor="company_name">Empresa</Label>
                    <Input
                      id="company_name"
                      value={formData.company_name || ''}
                      onChange={(e) => handleChange('company_name', e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Phone className="h-5 w-5 text-primary" />
                  Contato
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-3">
                <div>
                  <Label htmlFor="phone1">Telefone 1</Label>
                  <Input
                    id="phone1"
                    value={formData.phone1 || ''}
                    onChange={(e) => handleChange('phone1', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="phone2">Telefone 2</Label>
                  <Input
                    id="phone2"
                    value={formData.phone2 || ''}
                    onChange={(e) => handleChange('phone2', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">E-mail</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => handleChange('email', e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Address */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <MapPin className="h-5 w-5 text-primary" />
                  Endereço
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="cep">CEP</Label>
                  <Input
                    id="cep"
                    value={formData.cep || ''}
                    onChange={(e) => handleChange('cep', e.target.value)}
                    onBlur={handleCepSearch}
                  />
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="address">Logradouro</Label>
                  <Input
                    id="address"
                    value={formData.address || ''}
                    onChange={(e) => handleChange('address', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="number">Número</Label>
                  <Input
                    id="number"
                    value={formData.number || ''}
                    onChange={(e) => handleChange('number', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="complement">Complemento</Label>
                  <Input
                    id="complement"
                    value={formData.complement || ''}
                    onChange={(e) => handleChange('complement', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="neighborhood">Bairro</Label>
                  <Input
                    id="neighborhood"
                    value={formData.neighborhood || ''}
                    onChange={(e) => handleChange('neighborhood', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="city">Cidade</Label>
                  <Input
                    id="city"
                    value={formData.city || ''}
                    onChange={(e) => handleChange('city', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="uf">UF</Label>
                  <Select value={formData.uf || ''} onValueChange={(v) => handleChange('uf', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="UF" />
                    </SelectTrigger>
                    <SelectContent>
                      {UF_OPTIONS.map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Banking */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Building2 className="h-5 w-5 text-primary" />
                  Dados Bancários
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-4">
                <div>
                  <Label htmlFor="bank_name">Banco</Label>
                  <Input
                    id="bank_name"
                    value={formData.bank_name || ''}
                    onChange={(e) => handleChange('bank_name', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bank_agency">Agência</Label>
                  <Input
                    id="bank_agency"
                    value={formData.bank_agency || ''}
                    onChange={(e) => handleChange('bank_agency', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bank_account">Conta</Label>
                  <Input
                    id="bank_account"
                    value={formData.bank_account || ''}
                    onChange={(e) => handleChange('bank_account', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="bank_account_type">Tipo</Label>
                  <Select value={formData.bank_account_type || ''} onValueChange={(v) => handleChange('bank_account_type', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Tipo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CORRENTE">Corrente</SelectItem>
                      <SelectItem value="POUPANCA">Poupança</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Notes + IA Análise Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  Observações
                  <Bot className="h-4 w-4 text-primary" />
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <Textarea
                  value={formData.notes || ''}
                  onChange={(e) => handleChange('notes', e.target.value)}
                  rows={4}
                  placeholder="Digite observações sobre o cliente..."
                />
                
                {/* IA Análise Section - Integrada */}
                {id && client && (
                  <ClientIAAnaliseSection
                    clienteId={id}
                    cliente={{
                      id: client.id,
                      name: client.name,
                      cpf: client.cpf,
                      birth_date: client.birth_date,
                      phone1: client.phone1,
                      email: client.email,
                      accident_date: client.accident_date,
                      accident_type: client.accident_type,
                      accident_location: client.accident_location,
                      injuries: client.injuries,
                      cid_code: client.cid_code,
                      body_part_affected: client.body_part_affected,
                      injury_severity: client.injury_severity,
                      has_sequelae: client.has_sequelae,
                      disability_percentage: client.disability_percentage,
                      admission_hospital: client.admission_hospital,
                      was_hospitalized: client.was_hospitalized,
                      hospitalization_days: client.hospitalization_days,
                      had_surgery: client.had_surgery,
                      has_police_report: client.has_police_report,
                      is_clt: client.is_clt,
                      company_name: client.company_name,
                      notes: formData.notes || client.notes
                    } as ClienteContexto}
                    observacaoAtual={formData.notes || ''}
                  />
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Checklist IA Tab */}
          <TabsContent value="checklist">
            {id && <ClientChecklistTab clientId={id} />}
          </TabsContent>

          {/* Seguradoras Tab */}
          <TabsContent value="seguradoras">
            {id && <ClientSeguradorasTab clientId={id} />}
          </TabsContent>

          <TabsContent value="acidente" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="h-5 w-5 text-primary" />
                  Dados do Acidente
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="accident_date">Data do Acidente</Label>
                  <Input
                    id="accident_date"
                    type="date"
                    value={formData.accident_date || ''}
                    onChange={(e) => handleChange('accident_date', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="accident_type">Tipo de Acidente</Label>
                  <Select value={formData.accident_type || ''} onValueChange={(v) => handleChange('accident_type', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {ACCIDENT_TYPES.map(type => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="md:col-span-2">
                  <Label htmlFor="accident_location">Local do Acidente</Label>
                  <Input
                    id="accident_location"
                    value={formData.accident_location || ''}
                    onChange={(e) => handleChange('accident_location', e.target.value)}
                  />
                </div>
                <div className="flex items-center gap-4">
                  <Switch
                    id="has_police_report"
                    checked={formData.has_police_report || false}
                    onCheckedChange={(v) => handleChange('has_police_report', v)}
                  />
                  <Label htmlFor="has_police_report">Possui Boletim de Ocorrência</Label>
                </div>
                {formData.has_police_report && (
                  <div>
                    <Label htmlFor="police_report_number">Número do B.O.</Label>
                    <Input
                      id="police_report_number"
                      value={formData.police_report_number || ''}
                      onChange={(e) => handleChange('police_report_number', e.target.value)}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="medico" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Stethoscope className="h-5 w-5 text-primary" />
                    Dados Médicos
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="injuries">Lesões</Label>
                    <Textarea
                      id="injuries"
                      value={formData.injuries || ''}
                      onChange={(e) => handleChange('injuries', e.target.value)}
                      rows={3}
                    />
                  </div>
                  <div>
                    <Label htmlFor="cid_code">CID</Label>
                    <Input
                      id="cid_code"
                      value={formData.cid_code || ''}
                      onChange={(e) => handleChange('cid_code', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="body_part_affected">Parte do Corpo Afetada</Label>
                    <Select value={formData.body_part_affected || ''} onValueChange={(v) => handleChange('body_part_affected', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {BODY_PARTS.map(part => (
                          <SelectItem key={part} value={part}>{part}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="injury_severity">Grau da Lesão</Label>
                    <Select value={formData.injury_severity || ''} onValueChange={(v) => handleChange('injury_severity', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {INJURY_SEVERITIES.map(sev => (
                          <SelectItem key={sev} value={sev}>{sev}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch
                      id="has_sequelae"
                      checked={formData.has_sequelae || false}
                      onCheckedChange={(v) => handleChange('has_sequelae', v)}
                    />
                    <Label htmlFor="has_sequelae">Possui Sequelas</Label>
                  </div>
                  {formData.has_sequelae && (
                    <div>
                      <Label htmlFor="disability_percentage">% Invalidez</Label>
                      <Input
                        id="disability_percentage"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.disability_percentage || ''}
                        onChange={(e) => handleChange('disability_percentage', parseFloat(e.target.value) || null)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Hospital className="h-5 w-5 text-primary" />
                    Atendimento Médico
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="admission_hospital">Hospital de Entrada</Label>
                    <Input
                      id="admission_hospital"
                      value={formData.admission_hospital || ''}
                      onChange={(e) => handleChange('admission_hospital', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="admission_date">Data da Entrada</Label>
                    <Input
                      id="admission_date"
                      type="date"
                      value={formData.admission_date || ''}
                      onChange={(e) => handleChange('admission_date', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="transfer_hospital">Hospital de Transferência</Label>
                    <Input
                      id="transfer_hospital"
                      value={formData.transfer_hospital || ''}
                      onChange={(e) => handleChange('transfer_hospital', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="transfer_date">Data da Transferência</Label>
                    <Input
                      id="transfer_date"
                      type="date"
                      value={formData.transfer_date || ''}
                      onChange={(e) => handleChange('transfer_date', e.target.value)}
                    />
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch
                      id="had_surgery"
                      checked={formData.had_surgery || false}
                      onCheckedChange={(v) => handleChange('had_surgery', v)}
                    />
                    <Label htmlFor="had_surgery">Realizou Cirurgia</Label>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch
                      id="was_hospitalized"
                      checked={formData.was_hospitalized || false}
                      onCheckedChange={(v) => handleChange('was_hospitalized', v)}
                    />
                    <Label htmlFor="was_hospitalized">Foi Internado</Label>
                  </div>
                  {formData.was_hospitalized && (
                    <div>
                      <Label htmlFor="hospitalization_days">Dias de Internação</Label>
                      <Input
                        id="hospitalization_days"
                        type="number"
                        min="0"
                        value={formData.hospitalization_days || ''}
                        onChange={(e) => handleChange('hospitalization_days', parseInt(e.target.value) || null)}
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* AI Suggestion */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="h-5 w-5 text-primary" />
                  Sugestões da IA
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  type="button"
                  variant="outline"
                  onClick={getAiSuggestion}
                  disabled={isAiLoading}
                  className="gap-2 mb-4"
                >
                  {isAiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  Obter Sugestões
                </Button>
                {aiSuggestion && (
                  <div className="bg-muted/50 rounded-lg p-4 whitespace-pre-wrap text-sm">
                    {aiSuggestion}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vinculos" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <UserPlus className="h-5 w-5 text-primary" />
                    Origem / Indicação
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="referral_type">Tipo de Indicação</Label>
                    <Select value={formData.referral_type || ''} onValueChange={(v) => handleChange('referral_type', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {REFERRAL_TYPES.map(type => (
                          <SelectItem key={type} value={type}>{type}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="referral_source">Origem</Label>
                    <Input
                      id="referral_source"
                      value={formData.referral_source || ''}
                      onChange={(e) => handleChange('referral_source', e.target.value)}
                    />
                  </div>
                  <div>
                    <Label htmlFor="referrer_name">Nome do Indicador</Label>
                    <Input
                      id="referrer_name"
                      value={formData.referrer_name || ''}
                      onChange={(e) => handleChange('referrer_name', e.target.value)}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Responsáveis</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="advogado_id">Advogado Responsável</Label>
                    <Select value={formData.advogado_id || '__none__'} onValueChange={(v) => handleChange('advogado_id', v === '__none__' ? null : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {advogados.map(adv => (
                          <SelectItem key={adv.id} value={adv.id}>{adv.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="seguradora_id">Seguradora</Label>
                    <Select value={formData.seguradora_id || '__none__'} onValueChange={(v) => handleChange('seguradora_id', v === '__none__' ? null : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhuma</SelectItem>
                        {seguradoras.map(seg => (
                          <SelectItem key={seg.id} value={seg.id}>{seg.razao_social}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="responsavel_id">Funcionário Responsável</Label>
                    <Select value={formData.responsavel_id || '__none__'} onValueChange={(v) => handleChange('responsavel_id', v === '__none__' ? null : v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Nenhum</SelectItem>
                        {funcionarios.map(func => (
                          <SelectItem key={func.id} value={func.id}>{func.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="client_status">Status do Cliente</Label>
                    <Select value={formData.client_status || 'ativo'} onValueChange={(v) => handleChange('client_status', v)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                        <SelectItem value="arquivado">Arquivado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="documentos" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <FileText className="h-5 w-5 text-primary" />
                  Documentos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Upload Area */}
                <div className="border-2 border-dashed rounded-lg p-6 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
                    <Select value={uploadCategory} onValueChange={setUploadCategory}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Categoria" />
                      </SelectTrigger>
                      <SelectContent>
                        {DOCUMENT_CATEGORIES.map(cat => (
                          <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploadDocument.isPending}
                      className="gap-2"
                    >
                      {uploadDocument.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      Enviar Documento
                    </Button>
                  </div>
                </div>

                {/* Documents List */}
                {documents.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">Nenhum documento cadastrado</p>
                ) : (
                  <div className="space-y-2">
                    {documents.map((doc) => (
                      <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-muted-foreground" />
                          <div>
                            <p className="font-medium">{doc.file_name}</p>
                            <p className="text-xs text-muted-foreground">
                              {doc.document_category} • {format(new Date(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}
                            </p>
                          </div>
                      </div>
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => downloadDocument(doc.file_path, doc.file_name)}
                          title="Baixar documento"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Actions - dentro do form */}
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="outline" onClick={() => navigate(`/clientes/${id}`)}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={updateClient.isPending} 
              className="gap-2"
            >
              <Save className="h-4 w-4" />
              {updateClient.isPending ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>

        {/* Aba de Protocolos - fora do form para não conflitar com submit */}
        <TabsContent value="protocolos" className="space-y-4">
          {id && client && (
            <ClientProtocolosTab 
              clienteId={id} 
              clienteName={client.name} 
              canEdit={canEdit} 
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
