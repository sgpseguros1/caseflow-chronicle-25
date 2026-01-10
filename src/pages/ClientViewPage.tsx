import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, FileText, AlertTriangle, User, MapPin, Phone, Building2, Car, Stethoscope, Hospital, UserPlus, Briefcase, Loader2, Download, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useExtendedClient, useClientDocuments, useClientAlerts, useClientProcesses, useSoftDeleteClient, useResolveClientAlert, useUpdateLastContact } from '@/hooks/useExtendedClients';
import { useClientPermissions } from '@/hooks/useClientPermissions';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

export default function ClientViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { canEdit, canDelete } = useClientPermissions();
  const { data: client, isLoading } = useExtendedClient(id);
  const { data: documents = [] } = useClientDocuments(id);
  const { data: alerts = [] } = useClientAlerts(id);
  const { data: processes = [] } = useClientProcesses(id);
  const softDeleteClient = useSoftDeleteClient();
  const resolveAlert = useResolveClientAlert();
  const updateLastContact = useUpdateLastContact();
  const [deleteReason, setDeleteReason] = useState('');

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

  const handleDelete = async () => {
    if (!deleteReason.trim() || !user) return;
    await softDeleteClient.mutateAsync({ id: client.id, reason: deleteReason, userId: user.id });
    navigate('/clientes');
  };

  const handleResolveAlert = async (alertId: string) => {
    if (!user || !id) return;
    await resolveAlert.mutateAsync({ id: alertId, userId: user.id, clientId: id });
  };

  const handleContactClient = async () => {
    if (!id) return;
    await updateLastContact.mutateAsync(id);
  };

  const downloadDocument = async (filePath: string, fileName: string) => {
    const { data } = await supabase.storage.from('client-documents').download(filePath);
    if (data) {
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const pendingAlerts = alerts.filter(a => a.status === 'pendente');

  const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
    <div className="py-2 border-b border-border/50 last:border-0">
      <span className="text-sm text-muted-foreground">{label}</span>
      <p className="font-medium">{value || '-'}</p>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-foreground">{client.name}</h1>
              <Badge variant={client.client_status === 'ativo' ? 'default' : 'secondary'}>
                {client.client_status || 'Ativo'}
              </Badge>
            </div>
            <p className="text-muted-foreground">Código #{client.code}</p>
          </div>
        </div>
        <div className="flex gap-2">
          {client.phone1 && (
            <Button variant="outline" onClick={handleContactClient} className="gap-2">
              <Phone className="h-4 w-4" />
              Registrar Contato
            </Button>
          )}
          {canEdit && (
            <Button onClick={() => navigate(`/clientes/${id}/editar`)} className="gap-2">
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          )}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                  <AlertDialogDescription>
                    Informe o motivo da exclusão do cliente. Esta ação não pode ser desfeita.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <div className="py-4">
                  <Label htmlFor="reason">Motivo da exclusão *</Label>
                  <Textarea
                    id="reason"
                    value={deleteReason}
                    onChange={(e) => setDeleteReason(e.target.value)}
                    placeholder="Informe o motivo..."
                    className="mt-2"
                  />
                </div>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={!deleteReason.trim() || softDeleteClient.isPending}
                    className="bg-destructive text-destructive-foreground"
                  >
                    Confirmar Exclusão
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {/* Alerts Banner */}
      {pendingAlerts.length > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-warning mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">{pendingAlerts.length} alerta(s) pendente(s)</span>
            </div>
            <div className="space-y-2">
              {pendingAlerts.slice(0, 3).map((alert) => (
                <div key={alert.id} className="flex items-center justify-between bg-background rounded-lg p-2">
                  <div>
                    <p className="font-medium text-sm">{alert.titulo}</p>
                    <p className="text-xs text-muted-foreground">{alert.descricao}</p>
                  </div>
                  {canEdit && (
                    <Button size="sm" variant="outline" onClick={() => handleResolveAlert(alert.id)}>
                      Resolver
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs */}
      <Tabs defaultValue="dados" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="dados">Dados Pessoais</TabsTrigger>
          <TabsTrigger value="acidente">Acidente</TabsTrigger>
          <TabsTrigger value="medico">Médico</TabsTrigger>
          <TabsTrigger value="documentos">Documentos ({documents.length})</TabsTrigger>
          <TabsTrigger value="processos">Processos ({processes.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="dados" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            {/* Personal Data */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <User className="h-5 w-5 text-primary" />
                  Dados Pessoais
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Nome Completo" value={client.name} />
                <InfoRow label="CPF" value={client.cpf} />
                <InfoRow label="RG" value={client.rg} />
                <InfoRow label="Data de Nascimento" value={client.birth_date ? format(new Date(client.birth_date), 'dd/MM/yyyy', { locale: ptBR }) : null} />
                <InfoRow label="Estado Civil" value={client.civil_status} />
                <InfoRow label="Profissão" value={client.profession} />
                <InfoRow label="Trabalha CLT" value={client.is_clt ? 'Sim' : 'Não'} />
                {client.is_clt && <InfoRow label="Empresa" value={client.company_name} />}
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
              <CardContent className="space-y-1">
                <InfoRow label="Telefone 1" value={client.phone1} />
                <InfoRow label="Telefone 2" value={client.phone2} />
                <InfoRow label="E-mail" value={client.email} />
                <InfoRow label="Último Contato" value={client.last_contact_date ? format(new Date(client.last_contact_date), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : 'Nunca'} />
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
              <CardContent className="space-y-1">
                <InfoRow label="CEP" value={client.cep} />
                <InfoRow label="Logradouro" value={client.address} />
                <InfoRow label="Número" value={client.number} />
                <InfoRow label="Complemento" value={client.complement} />
                <InfoRow label="Bairro" value={client.neighborhood} />
                <InfoRow label="Cidade/UF" value={client.city && client.uf ? `${client.city}/${client.uf}` : null} />
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
              <CardContent className="space-y-1">
                <InfoRow label="Banco" value={client.bank_name} />
                <InfoRow label="Agência" value={client.bank_agency} />
                <InfoRow label="Conta" value={client.bank_account} />
                <InfoRow label="Tipo" value={client.bank_account_type} />
              </CardContent>
            </Card>

            {/* Referral */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Origem / Indicação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Tipo de Indicação" value={client.referral_type} />
                <InfoRow label="Origem" value={client.referral_source} />
                <InfoRow label="Nome do Indicador" value={client.referrer_name} />
              </CardContent>
            </Card>

            {/* Relationships */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Briefcase className="h-5 w-5 text-primary" />
                  Vínculos
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Advogado Responsável" value={client.advogados?.nome} />
                <InfoRow label="Seguradora" value={client.seguradoras?.razao_social} />
                <InfoRow label="Funcionário Responsável" value={client.funcionarios?.nome} />
              </CardContent>
            </Card>
          </div>

          {/* Notes */}
          {client.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{client.notes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="acidente" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Car className="h-5 w-5 text-primary" />
                  Dados do Acidente
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Data do Acidente" value={client.accident_date ? format(new Date(client.accident_date), 'dd/MM/yyyy', { locale: ptBR }) : null} />
                <InfoRow label="Tipo de Acidente" value={client.accident_type} />
                <InfoRow label="Local do Acidente" value={client.accident_location} />
                <InfoRow label="Possui B.O." value={client.has_police_report ? 'Sim' : 'Não'} />
                {client.has_police_report && <InfoRow label="Número do B.O." value={client.police_report_number} />}
              </CardContent>
            </Card>
          </div>
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
              <CardContent className="space-y-1">
                <InfoRow label="Lesões" value={client.injuries} />
                <InfoRow label="CID" value={client.cid_code} />
                <InfoRow label="Parte do Corpo Afetada" value={client.body_part_affected} />
                <InfoRow label="Grau da Lesão" value={client.injury_severity} />
                <InfoRow label="Possui Sequelas" value={client.has_sequelae ? 'Sim' : 'Não'} />
                {client.has_sequelae && <InfoRow label="% Invalidez" value={client.disability_percentage?.toString()} />}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Hospital className="h-5 w-5 text-primary" />
                  Atendimento Médico
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                <InfoRow label="Hospital de Entrada" value={client.admission_hospital} />
                <InfoRow label="Data da Entrada" value={client.admission_date ? format(new Date(client.admission_date), 'dd/MM/yyyy', { locale: ptBR }) : null} />
                <InfoRow label="Hospital de Transferência" value={client.transfer_hospital} />
                <InfoRow label="Data da Transferência" value={client.transfer_date ? format(new Date(client.transfer_date), 'dd/MM/yyyy', { locale: ptBR }) : null} />
                <InfoRow label="Realizou Cirurgia" value={client.had_surgery ? 'Sim' : 'Não'} />
                <InfoRow label="Foi Internado" value={client.was_hospitalized ? 'Sim' : 'Não'} />
                {client.was_hospitalized && <InfoRow label="Dias de Internação" value={client.hospitalization_days?.toString()} />}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Documentos ({documents.length})
              </CardTitle>
              {canEdit && (
                <Button onClick={() => navigate(`/clientes/${id}/editar?tab=documentos`)} className="gap-2">
                  <FileText className="h-4 w-4" />
                  Gerenciar Documentos
                </Button>
              )}
            </CardHeader>
            <CardContent>
              {documents.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum documento cadastrado</p>
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
                      <div className="flex gap-2">
                        <Button size="icon" variant="ghost" onClick={() => downloadDocument(doc.file_path, doc.file_name)}>
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processos" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Briefcase className="h-5 w-5 text-primary" />
                Processos ({processes.length})
              </CardTitle>
              <Button onClick={() => navigate('/processos/novo')} className="gap-2">
                Novo Processo
              </Button>
            </CardHeader>
            <CardContent>
              {processes.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum processo vinculado</p>
              ) : (
                <div className="space-y-2">
                  {processes.map((proc: any) => (
                    <div key={proc.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div>
                        <p className="font-medium">{proc.titulo || proc.numero || 'Sem título'}</p>
                        <p className="text-xs text-muted-foreground">
                          {proc.tipo} • {proc.status} • {proc.data_abertura ? format(new Date(proc.data_abertura), 'dd/MM/yyyy', { locale: ptBR }) : '-'}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">{proc.status}</Badge>
                        <Button size="icon" variant="ghost" onClick={() => navigate(`/processos/${proc.id}`)}>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
