import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Building2, Briefcase } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { mockClients, mockUsers } from '@/data/mockData';

export default function VidaEmpresarialFormPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    companyName: '',
    cnpj: '',
    employeeRole: '',
    policyNumber: '',
    eventType: '',
    invalidityType: '',
    status: 'TRIAGEM',
    responsibleId: '',
    notes: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.companyName) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha cliente e empresa.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: 'Acionamento criado!', description: 'O seguro empresarial foi cadastrado com sucesso.' });
    setLoading(false);
    navigate('/vida-empresarial');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/vida-empresarial')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Acionamento - Vida Empresarial</h1>
          <p className="text-muted-foreground">Cadastre um novo acionamento de seguro empresarial</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Funcionário / Segurado
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label>Selecionar Cliente *</Label>
              <Select value={formData.clientId} onValueChange={(v) => handleChange('clientId', v)}>
                <SelectTrigger><SelectValue placeholder="Buscar cliente..." /></SelectTrigger>
                <SelectContent>
                  {mockClients.map(c => <SelectItem key={c.id} value={c.id}>{c.name} - {c.cpf}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Função/Cargo</Label>
              <Input value={formData.employeeRole} onChange={(e) => handleChange('employeeRole', e.target.value)} placeholder="Ex: Operador" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Dados da Empresa
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nome da Empresa *</Label>
              <Input value={formData.companyName} onChange={(e) => handleChange('companyName', e.target.value)} placeholder="Razão Social" />
            </div>
            <div>
              <Label>CNPJ</Label>
              <Input value={formData.cnpj} onChange={(e) => handleChange('cnpj', e.target.value)} placeholder="00.000.000/0000-00" />
            </div>
            <div>
              <Label>Número da Apólice</Label>
              <Input value={formData.policyNumber} onChange={(e) => handleChange('policyNumber', e.target.value)} placeholder="000000" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Briefcase className="h-5 w-5 text-primary" />
              Dados do Evento
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Tipo de Evento</Label>
              <Select value={formData.eventType} onValueChange={(v) => handleChange('eventType', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="invalidez">Invalidez</SelectItem>
                  <SelectItem value="morte">Morte</SelectItem>
                  <SelectItem value="doenca">Doença</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Tipo de Invalidez</Label>
              <Select value={formData.invalidityType} onValueChange={(v) => handleChange('invalidityType', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="total">Total</SelectItem>
                  <SelectItem value="parcial">Parcial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIAGEM">Triagem</SelectItem>
                  <SelectItem value="ANALISE_CONTRATO">Análise do Contrato</SelectItem>
                  <SelectItem value="ABERTURA_SINISTRO">Abertura do Sinistro</SelectItem>
                  <SelectItem value="REGULACAO">Regulação</SelectItem>
                  <SelectItem value="PENDENTE">Pendente</SelectItem>
                  <SelectItem value="PAGO">Pago</SelectItem>
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
          <Button type="button" variant="outline" onClick={() => navigate('/vida-empresarial')}>Cancelar</Button>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Salvando...' : 'Salvar Acionamento'}
          </Button>
        </div>
      </form>
    </div>
  );
}
