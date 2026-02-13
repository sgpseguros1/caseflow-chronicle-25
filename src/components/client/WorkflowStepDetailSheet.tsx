import { useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { FileText, Download, User, Stethoscope, Building2, Scale, Banknote, CheckCircle2, Clock, AlertTriangle, Circle, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { classificarDocumentos, type WorkflowStepKey, type ClassifiedDocument } from '@/lib/documentClassification';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface WorkflowStepDetailSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stepKey: WorkflowStepKey | null;
  clientId: string;
  stepStatus: string;
}

const STEP_CONFIG: Record<WorkflowStepKey, { title: string; icon: any; description: string }> = {
  cliente: { title: 'Cliente Cadastrado', icon: User, description: 'Dados cadastrais e documentos pessoais do cliente.' },
  checklist: { title: 'Checklist IA', icon: FileText, description: 'Respostas do checklist, análise da IA e resultado final.' },
  bau: { title: 'BAU Hospitalar', icon: Building2, description: 'BAU hospitalar, prontuário e documentos hospitalares.' },
  bo: { title: 'Boletim de Ocorrência / CAT', icon: FileText, description: 'Boletim de ocorrência e CAT (se houver).' },
  conta: { title: 'Conta Bancária', icon: Banknote, description: 'Dados bancários e comprovantes de conta do cliente.' },
  laudo: { title: 'Laudo Médico', icon: Stethoscope, description: 'Laudos médicos e exames anexados.' },
  protocolo: { title: 'Protocolo', icon: FileText, description: 'Protocolos realizados e comprovantes.' },
  pericia: { title: 'Perícia', icon: Stethoscope, description: 'Documentos de perícia e relatórios periciais.' },
  financeiro: { title: 'Financeiro', icon: Banknote, description: 'Comprovantes financeiros, pagamentos e valores.' },
  juridico: { title: 'Jurídico', icon: Scale, description: 'Procuração, declarações e documentos jurídicos.' },
};

function StatusIcon({ status }: { status: string }) {
  switch (status) {
    case 'concluido': return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'em_andamento': return <Clock className="h-5 w-5 text-blue-600" />;
    case 'incompleto': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    default: return <Circle className="h-5 w-5 text-gray-400" />;
  }
}

function StatusLabel({ status }: { status: string }) {
  const map: Record<string, { label: string; className: string }> = {
    concluido: { label: 'Concluído', className: 'bg-green-500 text-white' },
    em_andamento: { label: 'Em Andamento', className: 'bg-blue-500 text-white' },
    incompleto: { label: 'Incompleto', className: 'bg-yellow-500 text-white' },
    pendente: { label: 'Pendente', className: 'bg-gray-200 text-gray-600' },
  };
  const s = map[status] || map.pendente;
  return <Badge className={s.className}>{s.label}</Badge>;
}

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function WorkflowStepDetailSheet({ open, onOpenChange, stepKey, clientId, stepStatus }: WorkflowStepDetailSheetProps) {
  const config = stepKey ? STEP_CONFIG[stepKey] : null;

  // Fetch documents
  const { data: documents = [] } = useQuery({
    queryKey: ['client-documents-workflow', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_documents')
        .select('id, file_name, file_path, file_type, file_size, document_category, created_at')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId && open,
  });

  // Fetch client data
  const { data: client } = useQuery({
    queryKey: ['client-detail-workflow', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .eq('id', clientId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && open && stepKey === 'cliente',
  });

  // Fetch checklist data
  const { data: checklist } = useQuery({
    queryKey: ['client-checklist-workflow', clientId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('client_checklist_ia') as any)
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!clientId && open && stepKey === 'checklist',
  });

  // Fetch BAU data
  const { data: baus = [] } = useQuery({
    queryKey: ['client-baus-workflow', clientId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('client_baus') as any)
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId && open && stepKey === 'bau',
  });

  // Fetch protocolos
  const { data: protocolos = [] } = useQuery({
    queryKey: ['client-protocolos-workflow', clientId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('protocolos') as any)
        .select('*')
        .eq('cliente_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId && open && stepKey === 'protocolo',
  });

  // Fetch pericias
  const { data: pericias = [] } = useQuery({
    queryKey: ['client-pericias-workflow', clientId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('pericias') as any)
        .select('*')
        .eq('cliente_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId && open && stepKey === 'pericia',
  });

  // Fetch financeiro
  const { data: lancamentos = [] } = useQuery({
    queryKey: ['client-financeiro-workflow', clientId],
    queryFn: async () => {
      const { data, error } = await (supabase.from('lancamentos_financeiros') as any)
        .select('*')
        .eq('cliente_id', clientId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!clientId && open && stepKey === 'financeiro',
  });

  // Classify documents
  const classifiedDocs = useMemo(() => classificarDocumentos(documents), [documents]);
  const stepDocs = stepKey ? classifiedDocs[stepKey] : [];

  const handleDownload = async (filePath: string, fileName: string) => {
    try {
      const { data, error } = await supabase.storage.from('client-documents').download(filePath);
      if (error) throw error;
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Erro ao baixar documento:', e);
    }
  };

  if (!stepKey || !config) return null;

  const Icon = config.icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-lg">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Icon className="h-5 w-5 text-primary" />
            {config.title}
          </SheetTitle>
          <SheetDescription className="flex items-center gap-2">
            <StatusIcon status={stepStatus} />
            <StatusLabel status={stepStatus} />
            <span className="text-xs text-muted-foreground ml-2">{config.description}</span>
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="h-[calc(100vh-140px)] mt-4 pr-2">
          {/* Step-specific data */}
          {stepKey === 'cliente' && client && (
            <div className="space-y-3 mb-4">
              <h4 className="font-semibold text-sm">Dados Cadastrais</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <InfoRow label="Nome" value={client.name} />
                <InfoRow label="CPF" value={client.cpf} />
                <InfoRow label="RG" value={client.rg} />
                <InfoRow label="Nascimento" value={client.birth_date ? format(parseISO(client.birth_date), 'dd/MM/yyyy') : null} />
                <InfoRow label="Telefone" value={client.phone1} />
                <InfoRow label="Email" value={client.email} />
                <InfoRow label="Cidade" value={client.city} />
                <InfoRow label="UF" value={client.uf} />
                <InfoRow label="Endereço" value={client.address} />
                <InfoRow label="Profissão" value={client.profession} />
              </div>
            </div>
          )}

          {stepKey === 'checklist' && checklist && (
            <div className="space-y-3 mb-4">
              <h4 className="font-semibold text-sm">Checklist IA</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <InfoRow label="Status" value={checklist.status} />
                <InfoRow label="Tipo Ocorrência" value={checklist.tipo_ocorrencia} />
                <InfoRow label="Data Evento" value={checklist.data_evento} />
                <InfoRow label="Perfil Vítima" value={checklist.perfil_vitima} />
                <InfoRow label="Lesão Corporal" value={checklist.lesao_corporal ? 'Sim' : 'Não'} />
                <InfoRow label="Sequelas" value={checklist.sequelas} />
                <InfoRow label="Internação" value={checklist.internacao ? 'Sim' : 'Não'} />
                <InfoRow label="Atendimento Médico" value={checklist.atendimento_medico ? 'Sim' : 'Não'} />
                <InfoRow label="BO Status" value={checklist.bo_status} />
                <InfoRow label="Incapacidade" value={checklist.incapacidade_atual} />
              </div>
              {checklist.concluido_em && (
                <p className="text-xs text-muted-foreground">
                  Concluído em: {format(parseISO(checklist.concluido_em), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>
          )}

          {stepKey === 'bau' && baus.length > 0 && (
            <div className="space-y-3 mb-4">
              <h4 className="font-semibold text-sm">BAUs Hospitalares ({baus.length})</h4>
              {baus.map((bau: any) => (
                <div key={bau.id} className="border rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{bau.hospital_nome}</span>
                    <Badge variant="outline">{bau.status}</Badge>
                  </div>
                  <InfoRow label="Tipo" value={bau.tipo_solicitacao} />
                  <InfoRow label="Solicitação" value={bau.data_solicitacao ? format(parseISO(bau.data_solicitacao), 'dd/MM/yyyy') : null} />
                  {bau.observacoes && <p className="text-xs text-muted-foreground">{bau.observacoes}</p>}
                </div>
              ))}
            </div>
          )}

          {stepKey === 'protocolo' && protocolos.length > 0 && (
            <div className="space-y-3 mb-4">
              <h4 className="font-semibold text-sm">Protocolos ({protocolos.length})</h4>
              {protocolos.map((p: any) => (
                <div key={p.id} className="border rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">#{p.numero_protocolo || p.id.slice(0, 8)}</span>
                    <Badge variant="outline">{p.status}</Badge>
                  </div>
                  <InfoRow label="Tipo" value={p.tipo} />
                  <InfoRow label="Seguradora" value={p.seguradora} />
                </div>
              ))}
            </div>
          )}

          {stepKey === 'pericia' && pericias.length > 0 && (
            <div className="space-y-3 mb-4">
              <h4 className="font-semibold text-sm">Perícias ({pericias.length})</h4>
              {pericias.map((p: any) => (
                <div key={p.id} className="border rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{p.tipo || 'Perícia'}</span>
                    <Badge variant="outline">{p.status}</Badge>
                  </div>
                  <InfoRow label="Data" value={p.data_pericia ? format(parseISO(p.data_pericia), 'dd/MM/yyyy') : null} />
                  <InfoRow label="Local" value={p.local} />
                </div>
              ))}
            </div>
          )}

          {stepKey === 'financeiro' && lancamentos.length > 0 && (
            <div className="space-y-3 mb-4">
              <h4 className="font-semibold text-sm">Lançamentos ({lancamentos.length})</h4>
              {lancamentos.map((l: any) => (
                <div key={l.id} className="border rounded-lg p-3 space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{l.descricao || 'Lançamento'}</span>
                    <Badge variant="outline">{l.status}</Badge>
                  </div>
                  <InfoRow label="Valor" value={l.valor_bruto ? `R$ ${Number(l.valor_bruto).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` : null} />
                  <InfoRow label="Vencimento" value={l.data_vencimento ? format(parseISO(l.data_vencimento), 'dd/MM/yyyy') : null} />
                </div>
              ))}
            </div>
          )}

          {/* Documents section - always shown */}
          <Separator className="my-4" />
          <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documentos Vinculados ({stepDocs.length})
          </h4>

          {stepDocs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <File className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p className="text-sm">Nenhum documento vinculado a esta etapa.</p>
            </div>
          ) : (
            <div className="space-y-2">
              {stepDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 p-2 rounded-lg border hover:bg-muted/50 transition-colors">
                  <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{doc.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(doc.file_size)}
                      {doc.created_at && ` • ${format(parseISO(doc.created_at), 'dd/MM/yyyy', { locale: ptBR })}`}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 flex-shrink-0"
                    onClick={() => handleDownload(doc.file_path, doc.file_name)}
                    title="Baixar documento"
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div>
      <span className="text-muted-foreground">{label}:</span>{' '}
      <span className="font-medium">{value}</span>
    </div>
  );
}
