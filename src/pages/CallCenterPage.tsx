import { useState } from 'react';
import { Plus, Search, Loader2, Phone, MoreVertical, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useLeads, useUpdateLead, useCreateLead } from '@/hooks/useLeads';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';

const columns = [
  { id: 'novo', title: 'Base de Leads', color: 'bg-gray-100' },
  { id: 'ligacao_falha', title: 'Ligação Falha', color: 'bg-red-50' },
  { id: 'em_contato', title: 'Em Contato', color: 'bg-blue-50' },
  { id: 'cadastro', title: 'Processo de Cadastro', color: 'bg-green-50' },
];

export default function CallCenterPage() {
  const [search, setSearch] = useState('');
  const [newLead, setNewLead] = useState({ nome: '', telefone: '', origem: '', prioridade: 'normal' });
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: leads, isLoading } = useLeads();
  const updateLead = useUpdateLead();
  const createLead = useCreateLead();

  const filteredLeads = leads?.filter((l) =>
    l.nome.toLowerCase().includes(search.toLowerCase()) ||
    (l.telefone && l.telefone.includes(search))
  ) || [];

  const getLeadsByStatus = (status: string) => filteredLeads.filter((l) => l.status === status);

  const handleDragStart = (e: React.DragEvent, leadId: string) => {
    e.dataTransfer.setData('leadId', leadId);
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const leadId = e.dataTransfer.getData('leadId');
    if (leadId) {
      await updateLead.mutateAsync({ id: leadId, status: newStatus });
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleCreateLead = async () => {
    if (!newLead.nome) {
      toast({ title: 'Nome é obrigatório', variant: 'destructive' });
      return;
    }
    await createLead.mutateAsync({
      nome: newLead.nome,
      telefone: newLead.telefone || null,
      email: null,
      origem: newLead.origem || null,
      prioridade: newLead.prioridade,
      status: 'novo',
      responsavel_id: null,
      cliente_id: null,
      observacoes: null,
    });
    setNewLead({ nome: '', telefone: '', origem: '', prioridade: 'normal' });
    setDialogOpen(false);
  };

  const prioridadeColors: Record<string, string> = {
    alta: 'bg-red-100 text-red-700',
    normal: 'bg-blue-100 text-blue-700',
    baixa: 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Centro de Atendimento</h1>
          <p className="text-muted-foreground">Gerencie seus leads e contatos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Novo Lead</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Lead</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-4">
              <div><Label>Nome *</Label><Input value={newLead.nome} onChange={(e) => setNewLead({ ...newLead, nome: e.target.value })} placeholder="Nome do lead" /></div>
              <div><Label>Telefone</Label><Input value={newLead.telefone} onChange={(e) => setNewLead({ ...newLead, telefone: e.target.value })} placeholder="(00) 00000-0000" /></div>
              <div><Label>Origem</Label><Input value={newLead.origem} onChange={(e) => setNewLead({ ...newLead, origem: e.target.value })} placeholder="Ex: Instagram, Indicação" /></div>
              <Button onClick={handleCreateLead} className="w-full" disabled={createLead.isPending}>
                {createLead.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Lead
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input placeholder="Buscar leads..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {columns.map((col) => (
            <Card key={col.id} className={col.color} onDrop={(e) => handleDrop(e, col.id)} onDragOver={handleDragOver}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center justify-between">
                  {col.title}
                  <Badge variant="secondary">{getLeadsByStatus(col.id).length}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 min-h-[200px]">
                {getLeadsByStatus(col.id).map((lead) => (
                  <div
                    key={lead.id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, lead.id)}
                    className="bg-white rounded-lg p-3 shadow-sm border cursor-move hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">{lead.nome}</p>
                          {lead.telefone && (
                            <a href={`tel:${lead.telefone}`} className="text-xs text-muted-foreground flex items-center gap-1 hover:text-primary">
                              <Phone className="h-3 w-3" />{lead.telefone}
                            </a>
                          )}
                        </div>
                      </div>
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      {lead.origem && <Badge variant="outline" className="text-xs">{lead.origem}</Badge>}
                      <Badge className={`text-xs ${prioridadeColors[lead.prioridade || 'normal']}`}>
                        {lead.prioridade || 'normal'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
