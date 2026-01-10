import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Scale, Gavel } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { mockClients, mockUsers } from '@/data/mockData';

export default function JudicialFormPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    court: '',
    district: '',
    processNumber: '',
    actionType: '',
    lawyerName: '',
    lawyerOAB: '',
    phase: 'INICIAL',
    status: 'EM_ANDAMENTO',
    caseValue: '',
    responsibleId: '',
    notes: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.actionType) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha cliente e tipo de ação.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({ title: 'Processo judicial criado!', description: 'O processo foi cadastrado com sucesso.' });
    setLoading(false);
    navigate('/judicial');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/judicial')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Processo Judicial</h1>
          <p className="text-muted-foreground">Cadastre um novo processo judicial</p>
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
              <Scale className="h-5 w-5 text-primary" />
              Dados do Processo
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Vara</Label>
              <Input value={formData.court} onChange={(e) => handleChange('court', e.target.value)} placeholder="Ex: 1ª Vara Cível" />
            </div>
            <div>
              <Label>Comarca</Label>
              <Input value={formData.district} onChange={(e) => handleChange('district', e.target.value)} placeholder="Ex: São Paulo/SP" />
            </div>
            <div>
              <Label>Número do Processo</Label>
              <Input value={formData.processNumber} onChange={(e) => handleChange('processNumber', e.target.value)} placeholder="0000000-00.0000.0.00.0000" />
            </div>
            <div>
              <Label>Tipo de Ação *</Label>
              <Select value={formData.actionType} onValueChange={(v) => handleChange('actionType', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="indenizatoria">Ação Indenizatória</SelectItem>
                  <SelectItem value="cobranca">Ação de Cobrança</SelectItem>
                  <SelectItem value="obrigacao_fazer">Obrigação de Fazer</SelectItem>
                  <SelectItem value="revisional">Ação Revisional</SelectItem>
                  <SelectItem value="consignatoria">Consignatória</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Valor da Causa (R$)</Label>
              <Input type="number" value={formData.caseValue} onChange={(e) => handleChange('caseValue', e.target.value)} placeholder="0,00" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Gavel className="h-5 w-5 text-primary" />
              Advogado e Fase
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Nome do Advogado</Label>
              <Input value={formData.lawyerName} onChange={(e) => handleChange('lawyerName', e.target.value)} placeholder="Nome completo" />
            </div>
            <div>
              <Label>OAB</Label>
              <Input value={formData.lawyerOAB} onChange={(e) => handleChange('lawyerOAB', e.target.value)} placeholder="000000/UF" />
            </div>
            <div>
              <Label>Fase Processual</Label>
              <Select value={formData.phase} onValueChange={(v) => handleChange('phase', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="INICIAL">Inicial</SelectItem>
                  <SelectItem value="CITACAO">Citação</SelectItem>
                  <SelectItem value="CONTESTACAO">Contestação</SelectItem>
                  <SelectItem value="REPLICA">Réplica</SelectItem>
                  <SelectItem value="SANEAMENTO">Saneamento</SelectItem>
                  <SelectItem value="INSTRUCAO">Instrução</SelectItem>
                  <SelectItem value="SENTENCA">Sentença</SelectItem>
                  <SelectItem value="RECURSO">Recurso</SelectItem>
                  <SelectItem value="CUMPRIMENTO">Cumprimento</SelectItem>
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Status</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="EM_ANDAMENTO">Em Andamento</SelectItem>
                  <SelectItem value="SUSPENSO">Suspenso</SelectItem>
                  <SelectItem value="SENTENCIADO">Sentenciado</SelectItem>
                  <SelectItem value="TRANSITADO">Transitado em Julgado</SelectItem>
                  <SelectItem value="ARQUIVADO">Arquivado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Responsável Interno</Label>
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
          <Button type="button" variant="outline" onClick={() => navigate('/judicial')}>Cancelar</Button>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Salvando...' : 'Salvar Processo'}
          </Button>
        </div>
      </form>
    </div>
  );
}
