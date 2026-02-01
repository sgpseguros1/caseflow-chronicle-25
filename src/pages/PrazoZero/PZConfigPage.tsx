import { useState } from 'react';
import { 
  Settings, 
  Mail, 
  Plus, 
  Trash2, 
  Edit, 
  RefreshCw,
  Users,
  Shield,
  Bell,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { 
  usePZRegras, 
  useCreatePZRegra, 
  usePZUsuarios, 
  usePZEmailConexoes, 
  useCreatePZEmailConexao, 
  useDeletePZEmailConexao, 
  usePZGmailTokens,
  useGmailOAuth,
  useGmailSync,
  useGmailClassify,
  useDisconnectGmail,
  PZRegra 
} from '@/hooks/usePrazoZero';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function RegraCard({ regra }: { regra: PZRegra }) {
  const condicoes = regra.condicoes as any;

  return (
    <Card className={!regra.ativo ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <h4 className="font-medium">{regra.nome}</h4>
              <Badge variant={regra.ativo ? "default" : "secondary"}>
                {regra.ativo ? "Ativa" : "Inativa"}
              </Badge>
            </div>
            {regra.descricao && (
              <p className="text-sm text-muted-foreground mt-1">{regra.descricao}</p>
            )}

            <div className="mt-3 space-y-1 text-sm">
              <p className="font-medium text-muted-foreground">Condições:</p>
              {condicoes?.palavras?.length > 0 && (
                <p>• Palavras-chave: {condicoes.palavras.join(', ')}</p>
              )}
              {condicoes?.remetentes?.length > 0 && (
                <p>• Remetentes: {condicoes.remetentes.join(', ')}</p>
              )}
            </div>

            <div className="mt-2 space-y-1 text-sm">
              <p className="font-medium text-muted-foreground">Ações:</p>
              {regra.acao_categoria && (
                <p>• Categoria: {regra.acao_categoria}</p>
              )}
              {regra.acao_prioridade && (
                <p>• Prioridade: {regra.acao_prioridade}</p>
              )}
              {regra.acao_criar_tarefa && (
                <p>• Criar tarefa automaticamente</p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="ghost" size="icon">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function PZConfigPage() {
  const { isAdmin } = useAuth();
  const { data: regras, isLoading: regrasLoading } = usePZRegras();
  const { data: usuarios } = usePZUsuarios();
  const { data: emailConexoes, isLoading: conexoesLoading } = usePZEmailConexoes();
  const { data: gmailTokens, isLoading: gmailLoading } = usePZGmailTokens();
  const createRegra = useCreatePZRegra();
  const createEmailConexao = useCreatePZEmailConexao();
  const deleteEmailConexao = useDeletePZEmailConexao();
  
  // Gmail OAuth hooks
  const gmailOAuth = useGmailOAuth();
  const gmailSync = useGmailSync();
  const gmailClassify = useGmailClassify();
  const disconnectGmail = useDisconnectGmail();

  const [showRegraDialog, setShowRegraDialog] = useState(false);
  const [showEmailDialog, setShowEmailDialog] = useState<'gmail' | 'outlook' | 'imap' | null>(null);
  const [emailCredentials, setEmailCredentials] = useState({
    nome: '',
    email: '',
    clientId: '',
    clientSecret: '',
    imapHost: '',
    imapPort: '993',
    imapUser: '',
    imapPassword: '',
  });
  const [regraForm, setRegraForm] = useState({
    nome: '',
    descricao: '',
    palavras: '',
    remetentes: '',
    acao_categoria: '',
    acao_responsavel_id: '',
    acao_prioridade: '',
    acao_criar_tarefa: true,
  });

  const handleConnectGmail = () => {
    gmailOAuth.mutate();
  };

  const handleSyncGmail = () => {
    gmailSync.mutate();
  };

  const handleClassifyEmails = () => {
    gmailClassify.mutate();
  };

  const resetEmailForm = () => {
    setEmailCredentials({
      nome: '',
      email: '',
      clientId: '',
      clientSecret: '',
      imapHost: '',
      imapPort: '993',
      imapUser: '',
      imapPassword: '',
    });
  };

  const handleSaveEmailConnection = async () => {
    if (showEmailDialog === 'imap') {
      if (!emailCredentials.nome || !emailCredentials.imapHost || !emailCredentials.imapUser || !emailCredentials.imapPassword) {
        toast.error('Preencha todos os campos obrigatórios');
        return;
      }
      
      try {
        await createEmailConexao.mutateAsync({
          nome: emailCredentials.nome,
          tipo: 'imap',
          email: emailCredentials.imapUser,
          imap_host: emailCredentials.imapHost,
          imap_port: parseInt(emailCredentials.imapPort) || 993,
          imap_user: emailCredentials.imapUser,
          imap_password: emailCredentials.imapPassword,
        });
        setShowEmailDialog(null);
        resetEmailForm();
      } catch (error) {
        console.error('Erro ao salvar conexão:', error);
      }
    }
  };

  if (!isAdmin) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Shield className="h-12 w-12 text-yellow-500 mb-4" />
          <h3 className="text-lg font-medium">Acesso Restrito</h3>
          <p className="text-muted-foreground text-center mt-1">
            As configurações são exclusivas para administradores.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleCreateRegra = async () => {
    if (!regraForm.nome.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    const palavras = regraForm.palavras.split(',').map(p => p.trim()).filter(Boolean);
    const remetentes = regraForm.remetentes.split(',').map(r => r.trim()).filter(Boolean);

    try {
      await createRegra.mutateAsync({
        nome: regraForm.nome,
        descricao: regraForm.descricao || null,
        condicoes: { palavras, remetentes },
        acao_categoria: (regraForm.acao_categoria || null) as any,
        acao_responsavel_id: regraForm.acao_responsavel_id || null,
        acao_prioridade: (regraForm.acao_prioridade || null) as any,
        acao_criar_tarefa: regraForm.acao_criar_tarefa,
      });

      setShowRegraDialog(false);
      setRegraForm({
        nome: '',
        descricao: '',
        palavras: '',
        remetentes: '',
        acao_categoria: '',
        acao_responsavel_id: '',
        acao_prioridade: '',
        acao_criar_tarefa: true,
      });
    } catch (error) {
      console.error('Erro ao criar regra:', error);
    }
  };

  const hasGmailConnected = gmailTokens && gmailTokens.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-6 w-6" />
            Configurações
          </h1>
          <p className="text-muted-foreground">
            Gerencie caixas de e-mail, regras e preferências do sistema
          </p>
        </div>
      </div>

      <Tabs defaultValue="caixas" className="space-y-6">
        <TabsList>
          <TabsTrigger value="caixas">
            <Mail className="h-4 w-4 mr-2" />
            Caixas de E-mail
          </TabsTrigger>
          <TabsTrigger value="regras">
            <Zap className="h-4 w-4 mr-2" />
            Regras Automáticas
          </TabsTrigger>
          <TabsTrigger value="alertas">
            <Bell className="h-4 w-4 mr-2" />
            Alertas
          </TabsTrigger>
        </TabsList>

        {/* Tab Caixas de E-mail */}
        <TabsContent value="caixas">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Caixas de E-mail Conectadas</CardTitle>
                  <CardDescription>
                    Conecte seus e-mails para sincronização automática
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {/* Gmail Connections */}
              {gmailLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin" />
                </div>
              ) : hasGmailConnected ? (
                <div className="space-y-3 mb-6">
                  {gmailTokens.map((token) => (
                    <div key={token.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50 border-green-200">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-green-100">
                          <img src="https://www.google.com/favicon.ico" className="h-5 w-5" alt="Gmail" />
                        </div>
                        <div>
                          <p className="font-medium">{token.email}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge className="bg-green-600">Gmail Conectado</Badge>
                            <span className="text-xs text-muted-foreground">
                              Conectado em: {format(new Date(token.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleSyncGmail}
                          disabled={gmailSync.isPending}
                        >
                          {gmailSync.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <RefreshCw className="h-4 w-4 mr-2" />
                          )}
                          Sincronizar
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={handleClassifyEmails}
                          disabled={gmailClassify.isPending}
                        >
                          {gmailClassify.isPending ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          ) : (
                            <Zap className="h-4 w-4 mr-2" />
                          )}
                          Classificar IA
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="text-destructive"
                          onClick={() => {
                            if (confirm('Desconectar esta conta do Gmail?')) {
                              disconnectGmail.mutate(token.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma caixa conectada</h3>
                  <p className="text-muted-foreground mt-1 max-w-md">
                    Conecte sua conta do Gmail para começar a receber e-mails automaticamente.
                  </p>
                  <div className="flex gap-3 mt-6">
                    <Button 
                      onClick={handleConnectGmail}
                      disabled={gmailOAuth.isPending}
                      className="bg-red-600 hover:bg-red-700"
                    >
                      {gmailOAuth.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <img src="https://www.google.com/favicon.ico" className="h-4 w-4 mr-2" alt="" />
                      )}
                      Conectar Gmail
                    </Button>
                    <Button variant="outline" onClick={() => setShowEmailDialog('imap')}>
                      <Mail className="h-4 w-4 mr-2" />
                      IMAP Manual
                    </Button>
                  </div>
                </div>
              )}

              {/* Add more Gmail button if already connected */}
              {hasGmailConnected && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4"
                  onClick={handleConnectGmail}
                  disabled={gmailOAuth.isPending}
                >
                  {gmailOAuth.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Plus className="h-4 w-4 mr-2" />
                  )}
                  Conectar outra conta Gmail
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Info Card */}
          <Card className="mt-4 bg-blue-50 border-blue-200">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-blue-600" />
                Como Funciona
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              <p>Após conectar sua conta Gmail:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li><strong>Sincronizar:</strong> Busca os últimos 50 e-mails da caixa de entrada</li>
                <li><strong>Classificar IA:</strong> Usa inteligência artificial para categorizar e-mails</li>
                <li><strong>Triagem:</strong> E-mails não classificados aparecem na página de triagem</li>
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Regras Automáticas */}
        <TabsContent value="regras">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Regras de Classificação Automática</CardTitle>
                  <CardDescription>
                    Crie regras para classificar e-mails automaticamente
                  </CardDescription>
                </div>
                <Button onClick={() => setShowRegraDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Regra
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {regrasLoading ? (
                <p className="text-center py-8 text-muted-foreground">Carregando...</p>
              ) : regras && regras.length > 0 ? (
                <div className="space-y-4">
                  {regras.map(regra => (
                    <RegraCard key={regra.id} regra={regra} />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">Nenhuma regra criada</h3>
                  <p className="text-muted-foreground mt-1">
                    Crie regras para automatizar a classificação de e-mails.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Exemplos de Regras */}
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="text-lg">💡 Exemplos de Regras</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="p-3 bg-white rounded border">
                <p className="font-medium">Boletos e Faturas → Financeiro</p>
                <p className="text-muted-foreground">
                  Palavras: "boleto, vencimento, fatura, pagamento" → Categoria: Pagamento → Responsável: Usuário Financeiro
                </p>
              </div>
              <div className="p-3 bg-white rounded border">
                <p className="font-medium">Intimações → Jurídico</p>
                <p className="text-muted-foreground">
                  Palavras: "intimação, DJE, prazo, citação" → Categoria: Intimação → Responsável: Advogado
                </p>
              </div>
              <div className="p-3 bg-white rounded border">
                <p className="font-medium">Remetente Específico</p>
                <p className="text-muted-foreground">
                  Remetente: "@tribunal.jus.br" → Categoria: Prazo Processual → Prioridade: Alta
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Tab Alertas */}
        <TabsContent value="alertas">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Alertas</CardTitle>
              <CardDescription>
                Configure quando e como receber alertas de prazos
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-3">Alertas de Prazos Processuais</h4>
                <div className="space-y-3">
                  {[
                    { label: '7 dias antes', checked: true },
                    { label: '3 dias antes', checked: true },
                    { label: '1 dia antes', checked: true },
                    { label: '12 horas antes', checked: true },
                    { label: '2 horas antes', checked: true },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span>{item.label}</span>
                      <Switch defaultChecked={item.checked} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Alertas de Pagamentos</h4>
                <div className="space-y-3">
                  {[
                    { label: '5 dias antes', checked: true },
                    { label: '2 dias antes', checked: true },
                    { label: 'No dia do vencimento', checked: true },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between">
                      <span>{item.label}</span>
                      <Switch defaultChecked={item.checked} />
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-medium mb-3">Escalonamento Automático</h4>
                <p className="text-sm text-muted-foreground mb-3">
                  Se uma tarefa não for concluída próximo ao prazo, alertar gestores
                </p>
                <div className="flex items-center justify-between">
                  <span>Escalonamento ativo</span>
                  <Switch defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Nova Regra */}
      <Dialog open={showRegraDialog} onOpenChange={setShowRegraDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nova Regra Automática</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Nome da Regra *</Label>
              <Input
                value={regraForm.nome}
                onChange={(e) => setRegraForm({ ...regraForm, nome: e.target.value })}
                placeholder="Ex: Boletos para Financeiro"
              />
            </div>

            <div>
              <Label>Descrição</Label>
              <Textarea
                value={regraForm.descricao}
                onChange={(e) => setRegraForm({ ...regraForm, descricao: e.target.value })}
                placeholder="Descrição opcional..."
                rows={2}
              />
            </div>

            <div>
              <Label>Palavras-chave (separadas por vírgula)</Label>
              <Input
                value={regraForm.palavras}
                onChange={(e) => setRegraForm({ ...regraForm, palavras: e.target.value })}
                placeholder="boleto, fatura, vencimento"
              />
            </div>

            <div>
              <Label>Remetentes (separados por vírgula)</Label>
              <Input
                value={regraForm.remetentes}
                onChange={(e) => setRegraForm({ ...regraForm, remetentes: e.target.value })}
                placeholder="@banco.com.br, financeiro@"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Categoria</Label>
                <Select
                  value={regraForm.acao_categoria}
                  onValueChange={(v) => setRegraForm({ ...regraForm, acao_categoria: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="prazo_processual">Prazo Processual</SelectItem>
                    <SelectItem value="intimacao">Intimação</SelectItem>
                    <SelectItem value="audiencia">Audiência</SelectItem>
                    <SelectItem value="pagamento">Pagamento</SelectItem>
                    <SelectItem value="cobranca">Cobrança</SelectItem>
                    <SelectItem value="cliente_retorno">Cliente</SelectItem>
                    <SelectItem value="documentacao_pendente">Documentação</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Prioridade</Label>
                <Select
                  value={regraForm.acao_prioridade}
                  onValueChange={(v) => setRegraForm({ ...regraForm, acao_prioridade: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baixa">Baixa</SelectItem>
                    <SelectItem value="media">Média</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="urgente">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Responsável</Label>
              <Select
                value={regraForm.acao_responsavel_id}
                onValueChange={(v) => setRegraForm({ ...regraForm, acao_responsavel_id: v })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {usuarios?.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={regraForm.acao_criar_tarefa}
                onCheckedChange={(checked) => setRegraForm({ ...regraForm, acao_criar_tarefa: checked })}
              />
              <Label>Criar tarefa automaticamente</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRegraDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateRegra} disabled={createRegra.isPending}>
              Criar Regra
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Conexão de E-mail */}
      <Dialog open={!!showEmailDialog} onOpenChange={(open) => !open && setShowEmailDialog(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {showEmailDialog === 'gmail' && (
                <>
                  <img src="https://www.google.com/favicon.ico" className="h-5 w-5" alt="" />
                  Conectar Gmail
                </>
              )}
              {showEmailDialog === 'outlook' && (
                <>
                  <img src="https://www.microsoft.com/favicon.ico" className="h-5 w-5" alt="" />
                  Conectar Outlook
                </>
              )}
              {showEmailDialog === 'imap' && (
                <>
                  <Mail className="h-5 w-5" />
                  Configurar IMAP
                </>
              )}
            </DialogTitle>
          </DialogHeader>

          {(showEmailDialog === 'gmail' || showEmailDialog === 'outlook') && (
            <div className="space-y-4">
              <div className="p-4 bg-muted rounded-lg text-sm space-y-2">
                <p className="font-medium">Passos para obter as credenciais:</p>
                {showEmailDialog === 'gmail' ? (
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Acesse o <a href="https://console.cloud.google.com" target="_blank" rel="noopener" className="text-primary underline">Google Cloud Console</a></li>
                    <li>Crie um projeto ou selecione um existente</li>
                    <li>Habilite a <strong>Gmail API</strong></li>
                    <li>Vá em "Credenciais" → "Criar credenciais" → "ID do cliente OAuth"</li>
                    <li>Selecione "Aplicativo da Web"</li>
                    <li>Adicione como URI de redirecionamento: <code className="bg-background px-1 rounded">{window.location.origin}/api/gmail-callback</code></li>
                    <li>Copie o Client ID e Client Secret abaixo</li>
                  </ol>
                ) : (
                  <ol className="list-decimal list-inside space-y-1 text-muted-foreground">
                    <li>Acesse o <a href="https://portal.azure.com/#blade/Microsoft_AAD_RegisteredApps/ApplicationsListBlade" target="_blank" rel="noopener" className="text-primary underline">Azure Portal - App Registrations</a></li>
                    <li>Clique em "Novo registro"</li>
                    <li>Configure o redirect URI: <code className="bg-background px-1 rounded">{window.location.origin}/api/outlook-callback</code></li>
                    <li>Vá em "Certificados e segredos" para criar um Client Secret</li>
                    <li>Copie o Application ID (Client ID) e o Secret abaixo</li>
                  </ol>
                )}
              </div>

              <div>
                <Label>Client ID *</Label>
                <Input
                  value={emailCredentials.clientId}
                  onChange={(e) => setEmailCredentials({ ...emailCredentials, clientId: e.target.value })}
                  placeholder={showEmailDialog === 'gmail' ? 'xxx.apps.googleusercontent.com' : 'xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx'}
                />
              </div>

              <div>
                <Label>Client Secret *</Label>
                <Input
                  type="password"
                  value={emailCredentials.clientSecret}
                  onChange={(e) => setEmailCredentials({ ...emailCredentials, clientSecret: e.target.value })}
                  placeholder="Seu client secret"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-800">
                <strong>Importante:</strong> Suas credenciais serão armazenadas de forma segura e usadas apenas para sincronizar seus e-mails.
              </div>
            </div>
          )}

          {showEmailDialog === 'imap' && (
            <div className="space-y-4">
              <div>
                <Label>Nome da Conexão *</Label>
                <Input
                  value={emailCredentials.nome}
                  onChange={(e) => setEmailCredentials({ ...emailCredentials, nome: e.target.value })}
                  placeholder="Ex: E-mail do Escritório"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Servidor IMAP *</Label>
                  <Input
                    value={emailCredentials.imapHost}
                    onChange={(e) => setEmailCredentials({ ...emailCredentials, imapHost: e.target.value })}
                    placeholder="imap.gmail.com"
                  />
                </div>
                <div>
                  <Label>Porta</Label>
                  <Input
                    value={emailCredentials.imapPort}
                    onChange={(e) => setEmailCredentials({ ...emailCredentials, imapPort: e.target.value })}
                    placeholder="993"
                  />
                </div>
              </div>

              <div>
                <Label>E-mail / Usuário *</Label>
                <Input
                  value={emailCredentials.imapUser}
                  onChange={(e) => setEmailCredentials({ ...emailCredentials, imapUser: e.target.value })}
                  placeholder="seu@email.com"
                />
              </div>

              <div>
                <Label>Senha / Senha de App *</Label>
                <Input
                  type="password"
                  value={emailCredentials.imapPassword}
                  onChange={(e) => setEmailCredentials({ ...emailCredentials, imapPassword: e.target.value })}
                  placeholder="Sua senha ou senha de app"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Para Gmail, use uma <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" className="text-primary underline">Senha de App</a>
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowEmailDialog(null); resetEmailForm(); }}>
              Cancelar
            </Button>
            <Button 
              onClick={handleSaveEmailConnection}
              disabled={
                createEmailConexao.isPending ||
                (showEmailDialog !== 'imap' && (!emailCredentials.clientId || !emailCredentials.clientSecret)) ||
                (showEmailDialog === 'imap' && (!emailCredentials.nome || !emailCredentials.imapHost || !emailCredentials.imapUser || !emailCredentials.imapPassword))
              }
            >
              {createEmailConexao.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Conectar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
