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
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Database } from '@/integrations/supabase/types';

type EmailCategoria = Database['public']['Enums']['email_categoria'];
type PrazoPrioridade = Database['public']['Enums']['prazo_prioridade'];
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { usePZRegras, useCreatePZRegra, usePZUsuarios, PZRegra } from '@/hooks/usePrazoZero';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

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
  const createRegra = useCreatePZRegra();

  const [showRegraDialog, setShowRegraDialog] = useState(false);
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
        acao_categoria: (regraForm.acao_categoria || null) as EmailCategoria | null,
        acao_responsavel_id: regraForm.acao_responsavel_id || null,
        acao_prioridade: (regraForm.acao_prioridade || null) as PrazoPrioridade | null,
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
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Conectar E-mail
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium">Nenhuma caixa conectada</h3>
                <p className="text-muted-foreground mt-1 max-w-md">
                  Conecte sua conta Gmail, Outlook ou configure um servidor IMAP para começar a receber e-mails automaticamente.
                </p>
                <div className="flex gap-3 mt-6">
                  <Button variant="outline">
                    <img src="https://www.google.com/favicon.ico" className="h-4 w-4 mr-2" alt="" />
                    Gmail
                  </Button>
                  <Button variant="outline">
                    <img src="https://www.microsoft.com/favicon.ico" className="h-4 w-4 mr-2" alt="" />
                    Outlook
                  </Button>
                  <Button variant="outline">
                    <Mail className="h-4 w-4 mr-2" />
                    IMAP
                  </Button>
                </div>
              </div>
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
    </div>
  );
}
