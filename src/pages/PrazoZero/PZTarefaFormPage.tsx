import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Plus, Trash2, Send, CheckSquare, MessageSquare, Paperclip } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  useCreatePZTarefa, 
  useUpdatePZTarefa, 
  usePZTarefa,
  usePZUsuarios,
  usePZChecklistTemplates,
  useTogglePZChecklist,
  useAddPZComentario
} from '@/hooks/usePrazoZero';
import { useClients } from '@/hooks/useClients';
import { format } from 'date-fns';
import type { Database } from '@/integrations/supabase/types';

type EmailCategoria = Database['public']['Enums']['email_categoria'];
type PrazoPrioridade = Database['public']['Enums']['prazo_prioridade'];
type TarefaStatus = Database['public']['Enums']['tarefa_status_pz'];
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PZTarefaFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const { data: tarefa, isLoading } = usePZTarefa(id || '');
  const { data: usuarios } = usePZUsuarios();
  const { data: clients } = useClients();
  const { data: templates } = usePZChecklistTemplates();

  const createTarefa = useCreatePZTarefa();
  const updateTarefa = useUpdatePZTarefa();
  const toggleChecklist = useTogglePZChecklist();
  const addComentario = useAddPZComentario();

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    categoria: '',
    prioridade: 'media',
    status: 'pendente',
    data_prazo: '',
    valor: '',
    responsavel_id: '',
    cliente_id: '',
  });

  const [checklistItems, setChecklistItems] = useState<string[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState('');
  const [novoComentario, setNovoComentario] = useState('');

  useEffect(() => {
    if (tarefa && isEditing) {
      setFormData({
        titulo: tarefa.titulo || '',
        descricao: tarefa.descricao || '',
        categoria: tarefa.categoria || '',
        prioridade: tarefa.prioridade || 'media',
        status: tarefa.status || 'pendente',
        data_prazo: tarefa.data_prazo ? tarefa.data_prazo.slice(0, 16) : '',
        valor: tarefa.valor?.toString() || '',
        responsavel_id: tarefa.responsavel_id || '',
        cliente_id: tarefa.cliente_id || '',
      });
    }
  }, [tarefa, isEditing]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    const data = {
      titulo: formData.titulo,
      descricao: formData.descricao || null,
      valor: formData.valor ? parseFloat(formData.valor) : null,
      data_prazo: formData.data_prazo ? new Date(formData.data_prazo).toISOString() : null,
      responsavel_id: formData.responsavel_id || null,
      cliente_id: formData.cliente_id || null,
      categoria: (formData.categoria || null) as EmailCategoria | null,
      prioridade: formData.prioridade as PrazoPrioridade,
      status: formData.status as TarefaStatus,
    };

    try {
      if (isEditing && id) {
        await updateTarefa.mutateAsync({ id, ...data });
      } else {
        await createTarefa.mutateAsync({
          ...data,
          checklist_items: checklistItems.filter(i => i.trim()),
        });
      }
      navigate('/prazo-zero/tarefas');
    } catch (error) {
      console.error('Erro ao salvar tarefa:', error);
    }
  };

  const handleAddChecklistItem = () => {
    if (newChecklistItem.trim()) {
      setChecklistItems([...checklistItems, newChecklistItem.trim()]);
      setNewChecklistItem('');
    }
  };

  const handleRemoveChecklistItem = (index: number) => {
    setChecklistItems(checklistItems.filter((_, i) => i !== index));
  };

  const handleApplyTemplate = (categoria: string) => {
    const template = templates?.find(t => t.categoria === categoria);
    if (template && template.itens) {
      const itens = JSON.parse(typeof template.itens === 'string' ? template.itens : JSON.stringify(template.itens));
      setChecklistItems(itens.map((i: any) => i.texto));
      toast.success('Template aplicado!');
    }
  };

  const handleToggleChecklistItem = (itemId: string, concluido: boolean) => {
    toggleChecklist.mutate({ id: itemId, concluido });
  };

  const handleAddComentario = () => {
    if (novoComentario.trim() && id) {
      addComentario.mutate({ tarefa_id: id, comentario: novoComentario.trim() });
      setNovoComentario('');
    }
  };

  if (isEditing && isLoading) {
    return <div className="flex items-center justify-center h-96">Carregando...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">
            {isEditing ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h1>
          {isEditing && tarefa?.created_at && (
            <p className="text-sm text-muted-foreground">
              Criada em {format(new Date(tarefa.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
            </p>
          )}
        </div>
      </div>

      <Tabs defaultValue="dados" className="space-y-6">
        <TabsList>
          <TabsTrigger value="dados">Dados</TabsTrigger>
          {isEditing && (
            <>
              <TabsTrigger value="checklist">
                <CheckSquare className="h-4 w-4 mr-2" />
                Checklist
              </TabsTrigger>
              <TabsTrigger value="comentarios">
                <MessageSquare className="h-4 w-4 mr-2" />
                Comentários
              </TabsTrigger>
              <TabsTrigger value="anexos">
                <Paperclip className="h-4 w-4 mr-2" />
                Anexos
              </TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="dados">
          <form onSubmit={handleSubmit}>
            <div className="grid gap-6 md:grid-cols-2">
              {/* Dados Principais */}
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Informações da Tarefa</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="titulo">Título *</Label>
                    <Input
                      id="titulo"
                      value={formData.titulo}
                      onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                      placeholder="Descreva a tarefa..."
                    />
                  </div>

                  <div>
                    <Label htmlFor="descricao">Descrição</Label>
                    <Textarea
                      id="descricao"
                      value={formData.descricao}
                      onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                      placeholder="Detalhes adicionais..."
                      rows={3}
                    />
                  </div>

                  <div className="grid gap-4 md:grid-cols-3">
                    <div>
                      <Label>Categoria</Label>
                      <Select
                        value={formData.categoria}
                        onValueChange={(v) => {
                          setFormData({ ...formData, categoria: v });
                          if (!isEditing) handleApplyTemplate(v);
                        }}
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
                        value={formData.prioridade}
                        onValueChange={(v) => setFormData({ ...formData, prioridade: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="baixa">Baixa</SelectItem>
                          <SelectItem value="media">Média</SelectItem>
                          <SelectItem value="alta">Alta</SelectItem>
                          <SelectItem value="urgente">Urgente</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Status</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(v) => setFormData({ ...formData, status: v })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pendente">Pendente</SelectItem>
                          <SelectItem value="em_andamento">Em Andamento</SelectItem>
                          <SelectItem value="aguardando">Aguardando</SelectItem>
                          <SelectItem value="concluida">Concluída</SelectItem>
                          <SelectItem value="cancelada">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Prazos e Valores */}
              <Card>
                <CardHeader>
                  <CardTitle>Prazo e Valor</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="data_prazo">Data/Hora do Prazo</Label>
                    <Input
                      id="data_prazo"
                      type="datetime-local"
                      value={formData.data_prazo}
                      onChange={(e) => setFormData({ ...formData, data_prazo: e.target.value })}
                    />
                  </div>

                  <div>
                    <Label htmlFor="valor">Valor (R$)</Label>
                    <Input
                      id="valor"
                      type="number"
                      step="0.01"
                      value={formData.valor}
                      onChange={(e) => setFormData({ ...formData, valor: e.target.value })}
                      placeholder="0,00"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Responsáveis */}
              <Card>
                <CardHeader>
                  <CardTitle>Responsável e Cliente</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Responsável</Label>
                    <Select
                      value={formData.responsavel_id}
                      onValueChange={(v) => setFormData({ ...formData, responsavel_id: v })}
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

                  <div>
                    <Label>Cliente Vinculado</Label>
                    <Select
                      value={formData.cliente_id}
                      onValueChange={(v) => setFormData({ ...formData, cliente_id: v })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                      <SelectContent>
                        {clients?.map(c => (
                          <SelectItem key={c.id} value={c.id}>
                            #{c.code} - {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </CardContent>
              </Card>

              {/* Checklist (apenas na criação) */}
              {!isEditing && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle>Checklist Inicial</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Novo item do checklist..."
                        value={newChecklistItem}
                        onChange={(e) => setNewChecklistItem(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddChecklistItem())}
                      />
                      <Button type="button" variant="outline" onClick={handleAddChecklistItem}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {checklistItems.length > 0 && (
                      <div className="space-y-2">
                        {checklistItems.map((item, index) => (
                          <div key={index} className="flex items-center gap-2 p-2 bg-muted rounded">
                            <span className="flex-1">{item}</span>
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveChecklistItem(index)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <p className="text-sm text-muted-foreground">
                      💡 Dica: Selecione uma categoria para aplicar um template de checklist automaticamente.
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Botões */}
            <div className="flex justify-end gap-3 mt-6">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createTarefa.isPending || updateTarefa.isPending}>
                <Save className="h-4 w-4 mr-2" />
                {isEditing ? 'Salvar Alterações' : 'Criar Tarefa'}
              </Button>
            </div>
          </form>
        </TabsContent>

        {/* Tab Checklist (apenas edição) */}
        {isEditing && (
          <TabsContent value="checklist">
            <Card>
              <CardHeader>
                <CardTitle>Checklist</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tarefa?.checklist && tarefa.checklist.length > 0 ? (
                  tarefa.checklist.map((item) => (
                    <div
                      key={item.id}
                      className={cn(
                        "flex items-center gap-3 p-3 rounded border",
                        item.concluido && "bg-green-50 border-green-200"
                      )}
                    >
                      <Checkbox
                        checked={item.concluido}
                        onCheckedChange={(checked) => handleToggleChecklistItem(item.id, !!checked)}
                      />
                      <span className={cn(item.concluido && "line-through text-muted-foreground")}>
                        {item.texto}
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-center text-muted-foreground py-6">
                    Nenhum item no checklist
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab Comentários (apenas edição) */}
        {isEditing && (
          <TabsContent value="comentarios">
            <Card>
              <CardHeader>
                <CardTitle>Comentários</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Textarea
                    placeholder="Adicionar comentário..."
                    value={novoComentario}
                    onChange={(e) => setNovoComentario(e.target.value)}
                    rows={2}
                  />
                  <Button onClick={handleAddComentario} disabled={!novoComentario.trim()}>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>

                <Separator />

                {tarefa?.comentarios && tarefa.comentarios.length > 0 ? (
                  <div className="space-y-4">
                    {tarefa.comentarios.map((c) => (
                      <div key={c.id} className="p-3 bg-muted rounded">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-medium text-sm">{c.usuario?.name || 'Usuário'}</span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(c.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm">{c.comentario}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-6">
                    Nenhum comentário ainda
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {/* Tab Anexos (apenas edição) */}
        {isEditing && (
          <TabsContent value="anexos">
            <Card>
              <CardHeader>
                <CardTitle>Anexos</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-6">
                  Funcionalidade de anexos em desenvolvimento
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
