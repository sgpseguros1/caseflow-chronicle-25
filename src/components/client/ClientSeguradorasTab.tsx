import { useState } from 'react';
import { Plus, Trash2, Edit2, Save, X, Shield, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { 
  useClientSeguradoras, 
  useCreateClientSeguradora, 
  useUpdateClientSeguradora,
  useDeleteClientSeguradora,
  TIPOS_PRODUTO,
  ClientSeguradora 
} from '@/hooks/useClientSeguradoras';

interface ClientSeguradorasTabProps {
  clientId: string;
}

const EMPTY_FORM = {
  nome_seguradora: '',
  tipo_produto: '',
  numero_apolice: '',
  numero_certificado: '',
  data_vigencia_inicio: '',
  data_vigencia_fim: '',
  status: 'ativo',
  observacoes: '',
};

export function ClientSeguradorasTab({ clientId }: ClientSeguradorasTabProps) {
  const { data: seguradoras = [], isLoading } = useClientSeguradoras(clientId);
  const createSeguradora = useCreateClientSeguradora();
  const updateSeguradora = useUpdateClientSeguradora();
  const deleteSeguradora = useDeleteClientSeguradora();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleOpenCreate = () => {
    setFormData(EMPTY_FORM);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (seg: ClientSeguradora) => {
    setFormData({
      nome_seguradora: seg.nome_seguradora,
      tipo_produto: seg.tipo_produto || '',
      numero_apolice: seg.numero_apolice || '',
      numero_certificado: seg.numero_certificado || '',
      data_vigencia_inicio: seg.data_vigencia_inicio || '',
      data_vigencia_fim: seg.data_vigencia_fim || '',
      status: seg.status || 'ativo',
      observacoes: seg.observacoes || '',
    });
    setEditingId(seg.id);
    setIsDialogOpen(true);
  };

  const handleSave = async () => {
    if (!formData.nome_seguradora.trim()) return;

    if (editingId) {
      await updateSeguradora.mutateAsync({
        id: editingId,
        clientId,
        data: formData
      });
    } else {
      await createSeguradora.mutateAsync({
        clientId,
        data: formData
      });
    }
    setIsDialogOpen(false);
    setFormData(EMPTY_FORM);
    setEditingId(null);
  };

  const handleDelete = async (id: string) => {
    await deleteSeguradora.mutateAsync({ id, clientId });
  };

  const getTipoLabel = (tipo: string | null) => {
    return TIPOS_PRODUTO.find(t => t.value === tipo)?.label || tipo || '-';
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'ativo': return 'bg-green-100 text-green-700 border-green-300';
      case 'encerrado': return 'bg-gray-100 text-gray-700 border-gray-300';
      case 'nao_sabe': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  if (isLoading) {
    return <div className="animate-pulse space-y-4">
      {[1,2,3].map(i => <div key={i} className="h-24 bg-muted rounded-lg" />)}
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Shield className="h-6 w-6 text-primary" />
              <div>
                <CardTitle>Seguradoras do Cliente</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Cadastre até 10 seguradoras vinculadas ao cliente
                </p>
              </div>
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleOpenCreate} disabled={seguradoras.length >= 10} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Adicionar Seguradora
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg">
                <DialogHeader>
                  <DialogTitle>
                    {editingId ? 'Editar Seguradora' : 'Nova Seguradora'}
                  </DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div>
                    <Label>Nome da Seguradora *</Label>
                    <Input
                      value={formData.nome_seguradora}
                      onChange={(e) => handleChange('nome_seguradora', e.target.value)}
                      placeholder="Ex: Bradesco Seguros"
                    />
                  </div>
                  <div>
                    <Label>Tipo de Produto</Label>
                    <Select value={formData.tipo_produto} onValueChange={(v) => handleChange('tipo_produto', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        {TIPOS_PRODUTO.map(t => (
                          <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Nº Apólice</Label>
                      <Input
                        value={formData.numero_apolice}
                        onChange={(e) => handleChange('numero_apolice', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Nº Certificado</Label>
                      <Input
                        value={formData.numero_certificado}
                        onChange={(e) => handleChange('numero_certificado', e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Vigência Início</Label>
                      <Input
                        type="date"
                        value={formData.data_vigencia_inicio}
                        onChange={(e) => handleChange('data_vigencia_inicio', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Vigência Fim</Label>
                      <Input
                        type="date"
                        value={formData.data_vigencia_fim}
                        onChange={(e) => handleChange('data_vigencia_fim', e.target.value)}
                      />
                    </div>
                  </div>
                  <div>
                    <Label>Status</Label>
                    <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="encerrado">Encerrado</SelectItem>
                        <SelectItem value="nao_sabe">Não sabe</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Observações</Label>
                    <Textarea
                      value={formData.observacoes}
                      onChange={(e) => handleChange('observacoes', e.target.value)}
                      rows={3}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-3">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleSave} 
                    disabled={!formData.nome_seguradora.trim() || createSeguradora.isPending || updateSeguradora.isPending}
                    className="gap-2"
                  >
                    <Save className="h-4 w-4" />
                    Salvar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
          {seguradoras.length >= 10 && (
            <p className="text-sm text-destructive mt-2">
              Limite máximo de 10 seguradoras atingido
            </p>
          )}
        </CardHeader>
      </Card>

      {/* Lista */}
      {seguradoras.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 mx-auto text-muted-foreground opacity-50 mb-4" />
            <h3 className="font-medium text-lg mb-2">Nenhuma seguradora cadastrada</h3>
            <p className="text-muted-foreground text-sm mb-4">
              Adicione as seguradoras vinculadas ao cliente para a análise da IA
            </p>
            <Button onClick={handleOpenCreate} className="gap-2">
              <Plus className="h-4 w-4" />
              Adicionar Seguradora
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {seguradoras.map((seg) => (
            <Card key={seg.id} className="relative">
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-lg">{seg.nome_seguradora}</h4>
                    <p className="text-sm text-muted-foreground">{getTipoLabel(seg.tipo_produto)}</p>
                  </div>
                  <Badge variant="outline" className={getStatusColor(seg.status)}>
                    {seg.status === 'ativo' ? 'Ativo' : 
                     seg.status === 'encerrado' ? 'Encerrado' : 'Não sabe'}
                  </Badge>
                </div>
                
                <div className="space-y-2 text-sm">
                  {seg.numero_apolice && (
                    <p><span className="text-muted-foreground">Apólice:</span> {seg.numero_apolice}</p>
                  )}
                  {seg.numero_certificado && (
                    <p><span className="text-muted-foreground">Certificado:</span> {seg.numero_certificado}</p>
                  )}
                  {(seg.data_vigencia_inicio || seg.data_vigencia_fim) && (
                    <p>
                      <span className="text-muted-foreground">Vigência:</span>{' '}
                      {seg.data_vigencia_inicio || '?'} a {seg.data_vigencia_fim || '?'}
                    </p>
                  )}
                  {seg.observacoes && (
                    <p className="text-muted-foreground italic">"{seg.observacoes}"</p>
                  )}
                </div>

                <div className="flex gap-2 mt-4 pt-4 border-t">
                  <Button variant="outline" size="sm" onClick={() => handleOpenEdit(seg)} className="gap-1">
                    <Edit2 className="h-3 w-3" />
                    Editar
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-1 text-destructive hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                        Remover
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Remover seguradora?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Essa ação não pode ser desfeita. A seguradora será removida permanentemente.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(seg.id)}>
                          Remover
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
