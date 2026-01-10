import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, AlertTriangle, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { mockClients, mockUsers } from '@/data/mockData';

export default function DanosFormPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    damageType: '',
    responsibleEntity: '',
    fundament: '',
    claimedValue: '',
    status: 'TRIAGEM',
    responsibleId: '',
    notes: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.damageType) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha cliente e tipo de dano.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: 'Caso criado!', description: 'O caso de danos foi cadastrado com sucesso.' });
    setLoading(false);
    navigate('/danos');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/danos')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Caso - Danos Administrativos</h1>
          <p className="text-muted-foreground">Cadastre um novo caso de danos</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Label>Selecionar Cliente *</Label>
            <Select value={formData.clientId} onValueChange={(v) => handleChange('clientId', v)}>
              <SelectTrigger><SelectValue placeholder="Buscar cliente..." /></SelectTrigger>
              <SelectContent>
                {mockClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.cpf}</SelectItem>)}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <AlertTriangle className="h-5 w-5 text-primary" />
              Dados do Dano
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Tipo de Dano *</Label>
              <Select value={formData.damageType} onValueChange={(v) => handleChange('damageType', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="material">Dano Material</SelectItem>
                  <SelectItem value="moral">Dano Moral</SelectItem>
                  <SelectItem value="estetico">Dano Estético</SelectItem>
                  <SelectItem value="existencial">Dano Existencial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Órgão/Empresa Responsável</Label>
              <Input value={formData.responsibleEntity} onChange={(e) => handleChange('responsibleEntity', e.target.value)} placeholder="Nome do órgão ou empresa" />
            </div>
            <div className="md:col-span-2">
              <Label>Fundamentação Administrativa</Label>
              <Textarea value={formData.fundament} onChange={(e) => handleChange('fundament', e.target.value)} rows={3} placeholder="Fundamentos do caso..." />
            </div>
            <div>
              <Label>Valor Pretendido (R$)</Label>
              <Input type="number" value={formData.claimedValue} onChange={(e) => handleChange('claimedValue', e.target.value)} placeholder="0,00" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIAGEM">Triagem</SelectItem>
                  <SelectItem value="COLETA_PROVAS">Coleta de Provas</SelectItem>
                  <SelectItem value="PROTOCOLO">Protocolo Administrativo</SelectItem>
                  <SelectItem value="ANALISE">Análise</SelectItem>
                  <SelectItem value="NEGOCIACAO">Negociação</SelectItem>
                  <SelectItem value="ACORDO">Acordo</SelectItem>
                  <SelectItem value="JUDICIALIZADO">Judicializado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável</Label>
              <Select value={formData.responsibleId} onValueChange={(v) => handleChange('responsibleId', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  {mockUsers.filter(u => u.role !== 'ADMIN').map(u => <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Observações</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={4} placeholder="Observações..." />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/danos')}>Cancelar</Button>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Salvando...' : 'Salvar Caso'}
          </Button>
        </div>
      </form>
    </div>
  );
}
