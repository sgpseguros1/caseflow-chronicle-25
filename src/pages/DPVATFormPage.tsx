import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, Car, FileText, Tag, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { dpvatTags, dpvatClients } from '@/data/dpvatMockData';
import { mockUsers } from '@/data/mockData';
import { DPVAT_STATUS_LABELS, ACCIDENT_TYPE_LABELS } from '@/types/dpvat';

export default function DPVATFormPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    clientId: '',
    accidentDate: '',
    accidentTime: '',
    accidentType: '',
    accidentStreet: '',
    accidentNeighborhood: '',
    accidentCity: '',
    accidentUf: '',
    accidentDescription: '',
    hasBO: false,
    hasMedicalCare: false,
    status: 'CADASTRO_INICIADO',
    priority: 'NORMAL',
    attendantId: '',
    adminResponsibleId: '',
    legalResponsibleId: '',
    tags: [] as string[],
    feePercentage: '30',
    estimatedValue: '',
  });

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tagId: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(t => t !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId || !formData.accidentDate || !formData.accidentDescription) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Preencha cliente, data do acidente e relato.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    toast({
      title: 'Processo DPVAT criado!',
      description: 'O processo foi cadastrado com sucesso.',
    });
    setLoading(false);
    navigate('/dpvat');
  };

  const analysts = mockUsers.filter(u => u.role === 'ANALISTA' || u.role === 'GERENTE');

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/dpvat')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Processo DPVAT</h1>
          <p className="text-muted-foreground">Cadastre um novo processo DPVAT</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Cliente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <Label htmlFor="clientId">Selecionar Cliente *</Label>
                <Select value={formData.clientId} onValueChange={(v) => handleChange('clientId', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Buscar cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    {dpvatClients.map(client => (
                      <SelectItem key={client.id} value={client.id}>
                        {client.name} - {client.cpf}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="md:col-span-2">
                <Button type="button" variant="outline" size="sm" onClick={() => navigate('/clientes/novo')}>
                  + Cadastrar Novo Cliente
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dados do Acidente */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Car className="h-5 w-5 text-primary" />
              Dados do Acidente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label htmlFor="accidentDate">Data do Acidente *</Label>
                <Input
                  id="accidentDate"
                  type="date"
                  value={formData.accidentDate}
                  onChange={(e) => handleChange('accidentDate', e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="accidentTime">Hora</Label>
                <Input
                  id="accidentTime"
                  type="time"
                  value={formData.accidentTime}
                  onChange={(e) => handleChange('accidentTime', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="accidentType">Tipo de Acidente *</Label>
                <Select value={formData.accidentType} onValueChange={(v) => handleChange('accidentType', v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(ACCIDENT_TYPE_LABELS).map(([key, label]) => (
                      <SelectItem key={key} value={key}>{label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-4">
              <div className="md:col-span-2">
                <Label htmlFor="accidentStreet">Logradouro</Label>
                <Input
                  id="accidentStreet"
                  value={formData.accidentStreet}
                  onChange={(e) => handleChange('accidentStreet', e.target.value)}
                  placeholder="Rua, Av, etc"
                />
              </div>
              <div>
                <Label htmlFor="accidentNeighborhood">Bairro</Label>
                <Input
                  id="accidentNeighborhood"
                  value={formData.accidentNeighborhood}
                  onChange={(e) => handleChange('accidentNeighborhood', e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="accidentCity">Cidade</Label>
                <Input
                  id="accidentCity"
                  value={formData.accidentCity}
                  onChange={(e) => handleChange('accidentCity', e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="accidentDescription">Relato Detalhado do Acidente *</Label>
              <Textarea
                id="accidentDescription"
                value={formData.accidentDescription}
                onChange={(e) => handleChange('accidentDescription', e.target.value)}
                placeholder="Descreva como ocorreu o acidente..."
                rows={5}
                required
              />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasBO"
                  checked={formData.hasBO}
                  onCheckedChange={(checked) => handleChange('hasBO', checked)}
                />
                <Label htmlFor="hasBO" className="cursor-pointer">Houve B.O.?</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="hasMedicalCare"
                  checked={formData.hasMedicalCare}
                  onCheckedChange={(checked) => handleChange('hasMedicalCare', checked)}
                />
                <Label htmlFor="hasMedicalCare" className="cursor-pointer">Houve atendimento médico?</Label>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Status e Responsáveis */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Users className="h-5 w-5 text-primary" />
              Status e Responsáveis
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="status">Status Inicial</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(DPVAT_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="priority">Prioridade</Label>
              <Select value={formData.priority} onValueChange={(v) => handleChange('priority', v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="BAIXA">Baixa</SelectItem>
                  <SelectItem value="NORMAL">Normal</SelectItem>
                  <SelectItem value="ALTA">Alta</SelectItem>
                  <SelectItem value="URGENTE">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="attendantId">Responsável Atendimento</Label>
              <Select value={formData.attendantId} onValueChange={(v) => handleChange('attendantId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {analysts.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="adminResponsibleId">Responsável Administrativo</Label>
              <Select value={formData.adminResponsibleId} onValueChange={(v) => handleChange('adminResponsibleId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {analysts.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="legalResponsibleId">Responsável Jurídico</Label>
              <Select value={formData.legalResponsibleId} onValueChange={(v) => handleChange('legalResponsibleId', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {analysts.map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Etiquetas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Tag className="h-5 w-5 text-primary" />
              Etiquetas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {dpvatTags.filter(t => !t.isEmployeeTag).map(tag => (
                <button
                  key={tag.id}
                  type="button"
                  onClick={() => toggleTag(tag.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                    formData.tags.includes(tag.id)
                      ? 'ring-2 ring-offset-2'
                      : 'opacity-60 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: `${tag.color}20`,
                    color: tag.color,
                    borderColor: tag.color,
                  }}
                >
                  {tag.name}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financeiro */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Dados Financeiros
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="feePercentage">Percentual de Honorários (%)</Label>
              <Input
                id="feePercentage"
                type="number"
                min="0"
                max="100"
                value={formData.feePercentage}
                onChange={(e) => handleChange('feePercentage', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="estimatedValue">Valor Estimado (R$)</Label>
              <Input
                id="estimatedValue"
                type="number"
                value={formData.estimatedValue}
                onChange={(e) => handleChange('estimatedValue', e.target.value)}
                placeholder="0,00"
              />
            </div>
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/dpvat')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={loading} className="gap-2">
            <Save className="h-4 w-4" />
            {loading ? 'Salvando...' : 'Salvar Processo'}
          </Button>
        </div>
      </form>
    </div>
  );
}
