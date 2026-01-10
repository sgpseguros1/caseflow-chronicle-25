import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, User, MapPin, Phone, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateClient } from '@/hooks/useClients';
import { isValidCPF, formatCPF } from '@/lib/documentValidation';
import { toast } from 'sonner';

export default function ClientFormPage() {
  const navigate = useNavigate();
  const createClient = useCreateClient();
  const [cpfError, setCpfError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    cpf: '',
    rg: '',
    birth_date: '',
    civil_status: '',
    profession: '',
    phone1: '',
    phone2: '',
    email: '',
    cep: '',
    address: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    uf: '',
    bank_name: '',
    bank_agency: '',
    bank_account: '',
    bank_account_type: '',
    notes: '',
  });

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'cpf') {
      setCpfError('');
    }
  };

  const handleCpfBlur = () => {
    if (formData.cpf && formData.cpf.trim() !== '') {
      if (!isValidCPF(formData.cpf)) {
        setCpfError('CPF inválido');
      } else {
        setCpfError('');
        // Auto-format CPF
        setFormData(prev => ({ ...prev, cpf: formatCPF(prev.cpf) }));
      }
    }
  };

  const handleCepSearch = async () => {
    if (formData.cep.length < 8) return;
    const cleanCep = formData.cep.replace(/\D/g, '');
    try {
      const res = await fetch(`https://viacep.com.br/ws/${cleanCep}/json/`);
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({
          ...prev,
          address: data.logradouro || '',
          neighborhood: data.bairro || '',
          city: data.localidade || '',
          uf: data.uf || '',
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate CPF if provided
    if (formData.cpf && formData.cpf.trim() !== '' && !isValidCPF(formData.cpf)) {
      setCpfError('CPF inválido');
      toast.error('Por favor, corrija o CPF antes de salvar.');
      return;
    }
    
    await createClient.mutateAsync({
      name: formData.name,
      cpf: formData.cpf || null,
      rg: formData.rg || null,
      birth_date: formData.birth_date || null,
      civil_status: formData.civil_status || null,
      profession: formData.profession || null,
      phone1: formData.phone1 || null,
      phone2: formData.phone2 || null,
      email: formData.email || null,
      cep: formData.cep || null,
      address: formData.address || null,
      number: formData.number || null,
      complement: formData.complement || null,
      neighborhood: formData.neighborhood || null,
      city: formData.city || null,
      uf: formData.uf || null,
      nationality: 'Brasileira',
      naturality: null,
      bank_name: formData.bank_name || null,
      bank_agency: formData.bank_agency || null,
      bank_account: formData.bank_account || null,
      bank_account_type: formData.bank_account_type || null,
      notes: formData.notes || null,
      created_by: null,
    });
    
    navigate('/clientes');
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/clientes')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Novo Cliente</h1>
          <p className="text-muted-foreground">Preencha os dados do cliente</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Dados Pessoais
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div className="md:col-span-2">
              <Label htmlFor="name">Nome Completo *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Nome completo do cliente"
                required
              />
            </div>
            <div>
              <Label htmlFor="cpf">CPF *</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => handleChange('cpf', e.target.value)}
                onBlur={handleCpfBlur}
                placeholder="000.000.000-00"
                className={cpfError ? 'border-destructive' : ''}
                required
              />
              {cpfError && <p className="text-sm text-destructive mt-1">{cpfError}</p>}
            </div>
            <div>
              <Label htmlFor="rg">RG</Label>
              <Input
                id="rg"
                value={formData.rg}
                onChange={(e) => handleChange('rg', e.target.value)}
                placeholder="00.000.000-0"
              />
            </div>
            <div>
              <Label htmlFor="birth_date">Data de Nascimento</Label>
              <Input
                id="birth_date"
                type="date"
                value={formData.birth_date}
                onChange={(e) => handleChange('birth_date', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="civil_status">Estado Civil</Label>
              <Select value={formData.civil_status} onValueChange={(v) => handleChange('civil_status', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                  <SelectItem value="casado">Casado(a)</SelectItem>
                  <SelectItem value="divorciado">Divorciado(a)</SelectItem>
                  <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                  <SelectItem value="uniao_estavel">União Estável</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="profession">Profissão</Label>
              <Input
                id="profession"
                value={formData.profession}
                onChange={(e) => handleChange('profession', e.target.value)}
                placeholder="Profissão"
              />
            </div>
          </CardContent>
        </Card>

        {/* Contato */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Phone className="h-5 w-5 text-primary" />
              Contato
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <Label htmlFor="phone1">Telefone 1 *</Label>
              <Input
                id="phone1"
                value={formData.phone1}
                onChange={(e) => handleChange('phone1', e.target.value)}
                placeholder="(00) 00000-0000"
                required
              />
            </div>
            <div>
              <Label htmlFor="phone2">Telefone 2</Label>
              <Input
                id="phone2"
                value={formData.phone2}
                onChange={(e) => handleChange('phone2', e.target.value)}
                placeholder="(00) 00000-0000"
              />
            </div>
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="email@exemplo.com"
              />
            </div>
          </CardContent>
        </Card>

        {/* Endereço */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-primary" />
              Endereço
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="cep">CEP</Label>
              <Input
                id="cep"
                value={formData.cep}
                onChange={(e) => handleChange('cep', e.target.value)}
                onBlur={handleCepSearch}
                placeholder="00000-000"
              />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="address">Logradouro</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                placeholder="Rua, Av, etc"
              />
            </div>
            <div>
              <Label htmlFor="number">Número</Label>
              <Input
                id="number"
                value={formData.number}
                onChange={(e) => handleChange('number', e.target.value)}
                placeholder="Nº"
              />
            </div>
            <div>
              <Label htmlFor="complement">Complemento</Label>
              <Input
                id="complement"
                value={formData.complement}
                onChange={(e) => handleChange('complement', e.target.value)}
                placeholder="Apto, Sala, etc"
              />
            </div>
            <div>
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input
                id="neighborhood"
                value={formData.neighborhood}
                onChange={(e) => handleChange('neighborhood', e.target.value)}
                placeholder="Bairro"
              />
            </div>
            <div>
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder="Cidade"
              />
            </div>
            <div>
              <Label htmlFor="uf">UF</Label>
              <Select value={formData.uf} onValueChange={(v) => handleChange('uf', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="UF" />
                </SelectTrigger>
                <SelectContent>
                  {['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'].map(uf => (
                    <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Dados Bancários */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Building2 className="h-5 w-5 text-primary" />
              Dados Bancários
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-4">
            <div>
              <Label htmlFor="bank_name">Banco</Label>
              <Input
                id="bank_name"
                value={formData.bank_name}
                onChange={(e) => handleChange('bank_name', e.target.value)}
                placeholder="Nome do banco"
              />
            </div>
            <div>
              <Label htmlFor="bank_agency">Agência</Label>
              <Input
                id="bank_agency"
                value={formData.bank_agency}
                onChange={(e) => handleChange('bank_agency', e.target.value)}
                placeholder="0000"
              />
            </div>
            <div>
              <Label htmlFor="bank_account">Conta</Label>
              <Input
                id="bank_account"
                value={formData.bank_account}
                onChange={(e) => handleChange('bank_account', e.target.value)}
                placeholder="00000-0"
              />
            </div>
            <div>
              <Label htmlFor="bank_account_type">Tipo</Label>
              <Select value={formData.bank_account_type} onValueChange={(v) => handleChange('bank_account_type', v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CORRENTE">Corrente</SelectItem>
                  <SelectItem value="POUPANCA">Poupança</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Observações */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Observações</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="Observações internas sobre o cliente..."
              rows={4}
            />
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/clientes')}>
            Cancelar
          </Button>
          <Button type="submit" disabled={createClient.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {createClient.isPending ? 'Salvando...' : 'Salvar Cliente'}
          </Button>
        </div>
      </form>
    </div>
  );
}