import { useState } from 'react';
import { 
  Inbox, 
  Mail, 
  Tag, 
  User, 
  Calendar, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  ChevronRight,
  Filter,
  RefreshCw,
  Bot
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { usePZEmailsTriagem, useClassificarEmail, usePZUsuarios, PZEmail } from '@/hooks/usePrazoZero';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

const categoriaConfig: Record<string, { label: string; color: string; icon: any }> = {
  prazo_processual: { label: 'Prazo Processual', color: 'bg-red-100 text-red-800', icon: Calendar },
  intimacao: { label: 'Intimação', color: 'bg-orange-100 text-orange-800', icon: AlertTriangle },
  audiencia: { label: 'Audiência', color: 'bg-purple-100 text-purple-800', icon: Calendar },
  pagamento: { label: 'Pagamento', color: 'bg-green-100 text-green-800', icon: Tag },
  cobranca: { label: 'Cobrança', color: 'bg-yellow-100 text-yellow-800', icon: Tag },
  cliente_retorno: { label: 'Cliente', color: 'bg-blue-100 text-blue-800', icon: User },
  documentacao_pendente: { label: 'Documentação', color: 'bg-cyan-100 text-cyan-800', icon: Mail },
  ignorar: { label: 'Ignorar', color: 'bg-gray-100 text-gray-800', icon: XCircle },
  nao_classificado: { label: 'Não Classificado', color: 'bg-gray-100 text-gray-500', icon: Inbox },
};

function EmailCard({ email, onClassificar }: { email: PZEmail; onClassificar: (email: PZEmail) => void }) {
  const confianca = email.confianca_ia ? Math.round(email.confianca_ia * 100) : null;
  const categoriaInfo = categoriaConfig[email.categoria] || categoriaConfig.nao_classificado;
  const CategoriaIcon = categoriaInfo.icon;

  return (
    <Card 
      className={cn(
        "hover:shadow-md transition-shadow cursor-pointer",
        email.categoria === 'nao_classificado' && "border-yellow-300 bg-yellow-50/50"
      )}
      onClick={() => onClassificar(email)}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn(
            "p-2 rounded-lg",
            categoriaInfo.color
          )}>
            <CategoriaIcon className="h-5 w-5" />
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3 className="font-medium truncate">{email.assunto || '(Sem assunto)'}</h3>
                <p className="text-sm text-muted-foreground truncate">
                  {email.remetente_nome || email.remetente}
                </p>
              </div>
              <div className="flex flex-col items-end gap-1">
                {email.data_recebimento && (
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(email.data_recebimento), "dd/MM HH:mm", { locale: ptBR })}
                  </span>
                )}
                {confianca !== null && (
                  <Badge variant="outline" className="text-xs">
                    <Bot className="h-3 w-3 mr-1" />
                    {confianca}%
                  </Badge>
                )}
              </div>
            </div>

            {email.corpo_texto && (
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {email.corpo_texto.slice(0, 200)}...
              </p>
            )}

            <div className="flex items-center gap-2 mt-3">
              <Badge className={cn(categoriaInfo.color, "text-xs")}>
                {categoriaInfo.label}
              </Badge>
              {email.tem_anexos && (
                <Badge variant="outline" className="text-xs">📎 Anexos</Badge>
              )}
              {email.dados_extraidos && (
                <Badge variant="outline" className="text-xs">📊 Dados extraídos</Badge>
              )}
            </div>
          </div>

          <ChevronRight className="h-5 w-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function PZTriagemPage() {
  const { isAdmin, isAdminOrGestor } = useAuth();
  const { data: emails, isLoading, refetch } = usePZEmailsTriagem();
  const { data: usuarios } = usePZUsuarios();
  const classificarEmail = useClassificarEmail();

  const [selectedEmail, setSelectedEmail] = useState<PZEmail | null>(null);
  const [novaCategoria, setNovaCategoria] = useState('');
  const [criarTarefa, setCriarTarefa] = useState(true);
  const [responsavelId, setResponsavelId] = useState('');

  const handleOpenDialog = (email: PZEmail) => {
    setSelectedEmail(email);
    setNovaCategoria(email.categoria !== 'nao_classificado' ? email.categoria : '');
    setCriarTarefa(true);
    setResponsavelId('');
  };

  const handleClassificar = () => {
    if (!selectedEmail || !novaCategoria) return;

    classificarEmail.mutate({
      id: selectedEmail.id,
      categoria: novaCategoria,
      criar_tarefa: criarTarefa,
    });

    setSelectedEmail(null);
  };

  const handleIgnorar = () => {
    if (!selectedEmail) return;

    classificarEmail.mutate({
      id: selectedEmail.id,
      categoria: 'ignorar',
      criar_tarefa: false,
    });

    setSelectedEmail(null);
  };

  if (!isAdminOrGestor) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <AlertTriangle className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium">Acesso Restrito</h3>
          <p className="text-muted-foreground text-center mt-1">
            A triagem de e-mails é exclusiva para administradores e gestores.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Inbox className="h-6 w-6" />
            Triagem de E-mails
          </h1>
          <p className="text-muted-foreground">
            {emails?.length || 0} e-mail(s) pendente(s) de classificação
          </p>
        </div>
        <Button variant="outline" onClick={() => refetch()}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Info Card */}
      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <Bot className="h-6 w-6 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Triagem com IA</h4>
              <p className="text-sm text-blue-700 mt-1">
                Os e-mails são pré-classificados pela IA. Revise as sugestões e confirme ou corrija a categoria.
                E-mails com baixa confiança (abaixo de 70%) aparecem em destaque amarelo.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de E-mails */}
      <div className="space-y-3">
        {isLoading ? (
          Array(5).fill(0).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))
        ) : emails && emails.length > 0 ? (
          emails.map(email => (
            <EmailCard key={email.id} email={email} onClassificar={handleOpenDialog} />
          ))
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
              <h3 className="text-lg font-medium">Tudo em dia!</h3>
              <p className="text-muted-foreground text-center mt-1">
                Não há e-mails pendentes de triagem.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialog de Classificação */}
      <Dialog open={!!selectedEmail} onOpenChange={(open) => !open && setSelectedEmail(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Classificar E-mail</DialogTitle>
          </DialogHeader>

          {selectedEmail && (
            <div className="space-y-4">
              {/* Resumo do E-mail */}
              <Card>
                <CardContent className="p-4">
                  <h4 className="font-medium">{selectedEmail.assunto || '(Sem assunto)'}</h4>
                  <p className="text-sm text-muted-foreground mt-1">
                    De: {selectedEmail.remetente_nome || selectedEmail.remetente}
                  </p>
                  {selectedEmail.corpo_texto && (
                    <p className="text-sm mt-3 p-3 bg-muted rounded max-h-40 overflow-y-auto">
                      {selectedEmail.corpo_texto}
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Dados Extraídos pela IA */}
              {selectedEmail.dados_extraidos && (
                <Card className="bg-purple-50 border-purple-200">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Dados Extraídos pela IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      {selectedEmail.dados_extraidos.valor && (
                        <div>
                          <span className="text-muted-foreground">Valor:</span>{' '}
                          <strong>R$ {selectedEmail.dados_extraidos.valor}</strong>
                        </div>
                      )}
                      {selectedEmail.dados_extraidos.data_prazo && (
                        <div>
                          <span className="text-muted-foreground">Prazo:</span>{' '}
                          <strong>{selectedEmail.dados_extraidos.data_prazo}</strong>
                        </div>
                      )}
                      {selectedEmail.dados_extraidos.processo && (
                        <div>
                          <span className="text-muted-foreground">Processo:</span>{' '}
                          <strong>{selectedEmail.dados_extraidos.processo}</strong>
                        </div>
                      )}
                      {selectedEmail.dados_extraidos.cliente && (
                        <div>
                          <span className="text-muted-foreground">Cliente:</span>{' '}
                          <strong>{selectedEmail.dados_extraidos.cliente}</strong>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Seleção de Categoria */}
              <div>
                <Label>Categoria</Label>
                <Select value={novaCategoria} onValueChange={setNovaCategoria}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a categoria..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prazo_processual">📅 Prazo Processual</SelectItem>
                    <SelectItem value="intimacao">⚠️ Intimação</SelectItem>
                    <SelectItem value="audiencia">🏛️ Audiência</SelectItem>
                    <SelectItem value="pagamento">💰 Pagamento</SelectItem>
                    <SelectItem value="cobranca">📋 Cobrança</SelectItem>
                    <SelectItem value="cliente_retorno">👤 Cliente</SelectItem>
                    <SelectItem value="documentacao_pendente">📄 Documentação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Opções */}
              <div className="flex items-center gap-2">
                <Checkbox
                  id="criar-tarefa"
                  checked={criarTarefa}
                  onCheckedChange={(checked) => setCriarTarefa(!!checked)}
                />
                <Label htmlFor="criar-tarefa" className="cursor-pointer">
                  Criar tarefa automaticamente
                </Label>
              </div>

              {criarTarefa && (
                <div>
                  <Label>Atribuir para</Label>
                  <Select value={responsavelId} onValueChange={setResponsavelId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o responsável..." />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios?.map(u => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleIgnorar}>
              <XCircle className="h-4 w-4 mr-2" />
              Ignorar
            </Button>
            <Button 
              onClick={handleClassificar} 
              disabled={!novaCategoria || classificarEmail.isPending}
            >
              <CheckCircle className="h-4 w-4 mr-2" />
              Classificar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
