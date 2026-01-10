import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, FileText, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { mockClients, mockUsers } from '@/data/mockData';

export default function INSSFormPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    benefitType: '',
    requestDate: '',
    benefitNumber: '',
    status: 'TRIAGEM',
    hasExpertise: false,
    expertiseDate: '',
    responsibleId: '',
    notes: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.benefitType) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha cliente e tipo de benefício.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: 'Processo INSS criado!', description: 'O processo foi cadastrado com sucesso.' });
    setLoading(false);
    navigate('/inss');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/inss')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Processo INSS</h1>
          <p className="text-muted-foreground">Cadastre um novo processo INSS</p>
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
              <Building2 className="h-5 w-5 text-primary" />
              Dados do Benefício
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Tipo de Benefício *</Label>
              <Select value={formData.benefitType} onValueChange={(v) => handleChange('benefitType', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="auxilio_doenca">Auxílio-doença</SelectItem>
                  <SelectItem value="aposentadoria_invalidez">Aposentadoria por Invalidez</SelectItem>
                  <SelectItem value="bpc_loas">BPC/LOAS</SelectItem>
                  <SelectItem value="auxilio_acidente">Auxílio-acidente</SelectItem>
                  <SelectItem value="pensao_morte">Pensão por Morte</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data do Requerimento</Label>
              <Input type="date" value={formData.requestDate} onChange={(e) => handleChange('requestDate', e.target.value)} />
            </div>
            <div>
              <Label>Número do Benefício (NB)</Label>
              <Input value={formData.benefitNumber} onChange={(e) => handleChange('benefitNumber', e.target.value)} placeholder="000.000.000-0" />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="TRIAGEM">Triagem</SelectItem>
                  <SelectItem value="PROTOCOLADO">Protocolado</SelectItem>
                  <SelectItem value="EM_ANALISE">Em Análise</SelectItem>
                  <SelectItem value="EXIGENCIA">Exigência</SelectItem>
                  <SelectItem value="PERICIA">Perícia</SelectItem>
                  <SelectItem value="CONCEDIDO">Concedido</SelectItem>
                  <SelectItem value="INDEFERIDO">Indeferido</SelectItem>
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
            <div className="flex items-center gap-2 pt-6">
              <Checkbox id="hasExpertise" checked={formData.hasExpertise} onCheckedChange={(c) => handleChange('hasExpertise', c)} />
              <Label htmlFor="hasExpertise">Tem perícia agendada?</Label>
            </div>
            {formData.hasExpertise && (
              <div>
                <Label>Data da Perícia</Label>
                <Input type="date" value={formData.expertiseDate} onChange={(e) => handleChange('expertiseDate', e.target.value)} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-lg">Observações</CardTitle></CardHeader>
          <CardContent>
            <Textarea value={formData.notes} onChange={(e) => handleChange('notes', e.target.value)} rows={4} placeholder="Observações..." />
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/inss')}>Cancelar</Button>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Salvando...' : 'Salvar Processo'}
          </Button>
        </div>
      </form>
    </div>
  );
}
