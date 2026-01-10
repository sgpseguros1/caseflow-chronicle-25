import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, DollarSign, FileText, User, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useClients } from '@/hooks/useClients';
import { useProtocolos } from '@/hooks/useProtocolos';
import { useCreateLancamento, useUpdateLancamento, useLancamentoFinanceiro } from '@/hooks/useFinanceiro';
import { useAuth } from '@/hooks/useAuth';

const TIPO_RECEITA_OPTIONS = [
  { value: 'seguro_vida', label: 'Seguro de Vida' },
  { value: 'judicial', label: 'Judicial' },
  { value: 'danos', label: 'Danos' },
  { value: 'dpvat', label: 'DPVAT' },
  { value: 'previdenciario', label: 'Previdenciário' },
  { value: 'outros', label: 'Outros' }
];

const FORMA_PAGAMENTO_OPTIONS = [
  { value: 'pix', label: 'PIX' },
  { value: 'transferencia', label: 'Transferência' },
  { value: 'dinheiro', label: 'Dinheiro' },
  { value: 'cheque', label: 'Cheque' },
  { value: 'cartao', label: 'Cartão' },
  { value: 'boleto', label: 'Boleto' }
];

const STATUS_OPTIONS = [
  { value: 'recebido', label: 'Recebido' },
  { value: 'parcial', label: 'Parcial' },
  { value: 'em_aberto', label: 'Em Aberto' },
  { value: 'negociado', label: 'Negociado' },
  { value: 'cancelado', label: 'Cancelado' }
];

export default function FinanceiroFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { toast } = useToast();
  const { isAdmin, isGestor, loading: authLoading } = useAuth();
  
  const { data: clients } = useClients();
  const { data: protocolos } = useProtocolos();
  const { data: lancamentoExistente, isLoading: loadingLancamento } = useLancamentoFinanceiro(id);
  const createLancamento = useCreateLancamento();
  const updateLancamento = useUpdateLancamento();

  const [formData, setFormData] = useState({
    cliente_id: '',
    protocolo_id: '',
    tipo_receita: 'seguro_vida' as string,
    tipo_receita_justificativa: '',
    valor_bruto: '',
    valor_pago: '',
    forma_pagamento: '',
    data_recebimento: '',
    data_vencimento: '',
    status: 'em_aberto' as string,
    observacoes: ''
  });

  useEffect(() => {
    if (lancamentoExistente) {
      setFormData({
        cliente_id: lancamentoExistente.cliente_id,
        protocolo_id: lancamentoExistente.protocolo_id || '',
        tipo_receita: lancamentoExistente.tipo_receita,
        tipo_receita_justificativa: lancamentoExistente.tipo_receita_justificativa || '',
        valor_bruto: String(lancamentoExistente.valor_bruto),
        valor_pago: String(lancamentoExistente.valor_pago),
        forma_pagamento: lancamentoExistente.forma_pagamento || '',
        data_recebimento: lancamentoExistente.data_recebimento || '',
        data_vencimento: lancamentoExistente.data_vencimento || '',
        status: lancamentoExistente.status,
        observacoes: lancamentoExistente.observacoes || ''
      });
    }
  }, [lancamentoExistente]);

  const temPermissao = isAdmin || isGestor;

  if (authLoading || (id && loadingLancamento)) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!temPermissao) {
    return (
      <div className="flex flex-col items-center justify-center h-96 gap-4">
        <Lock className="h-16 w-16 text-muted-foreground" />
        <h2 className="text-2xl font-bold">Acesso Restrito</h2>
        <p className="text-muted-foreground">Apenas Gestores e Administradores podem acessar o financeiro.</p>
        <Button onClick={() => navigate('/dashboard')}>Voltar ao Dashboard</Button>
      </div>
    );
  }

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.cliente_id || !formData.valor_bruto || !formData.tipo_receita) {
      toast({ title: 'Campos obrigatórios', description: 'Preencha cliente, tipo e valor bruto.', variant: 'destructive' });
      return;
    }

    if (formData.tipo_receita === 'outros' && !formData.tipo_receita_justificativa) {
      toast({ title: 'Justificativa obrigatória', description: 'Informe a justificativa para tipo "Outros".', variant: 'destructive' });
      return;
    }

    const payload = {
      cliente_id: formData.cliente_id,
      protocolo_id: formData.protocolo_id || null,
      tipo_receita: formData.tipo_receita,
      tipo_receita_justificativa: formData.tipo_receita_justificativa || null,
      valor_bruto: parseFloat(formData.valor_bruto) || 0,
      valor_pago: parseFloat(formData.valor_pago) || 0,
      forma_pagamento: formData.forma_pagamento || null,
      data_recebimento: formData.data_recebimento || null,
      data_vencimento: formData.data_vencimento || null,
      status: formData.status,
      observacoes: formData.observacoes || null
    };

    if (id) {
      updateLancamento.mutate({ id, ...payload } as any, {
        onSuccess: () => navigate('/financeiro')
      });
    } else {
      createLancamento.mutate(payload as any, {
        onSuccess: () => navigate('/financeiro')
      });
    }
  };

  const protocolosDoCliente = protocolos?.filter(p => p.cliente_id === formData.cliente_id) || [];

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/financeiro')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {id ? 'Editar Lançamento' : 'Novo Lançamento Financeiro'}
          </h1>
          <p className="text-muted-foreground">
            {id ? 'Atualize os dados do lançamento' : 'Registre uma nova entrada de receita'}
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-primary" />
              Vinculação
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Cliente *</Label>
              <Select value={formData.cliente_id} onValueChange={(v) => handleChange('cliente_id', v)}>
                <SelectTrigger><SelectValue placeholder="Selecionar cliente..." /></SelectTrigger>
                <SelectContent>
                  {clients?.map(c => (
                    <SelectItem key={c.id} value={c.id}>#{c.code} - {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Protocolo Vinculado</Label>
              <Select value={formData.protocolo_id} onValueChange={(v) => handleChange('protocolo_id', v)} disabled={!formData.cliente_id}>
                <SelectTrigger><SelectValue placeholder="Selecionar protocolo (opcional)..." /></SelectTrigger>
                <SelectContent>
                  {protocolosDoCliente.map(p => (
                    <SelectItem key={p.id} value={p.id}>#{p.codigo} - {p.tipo}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <FileText className="h-5 w-5 text-primary" />
              Tipo de Receita
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Tipo de Indenização *</Label>
              <Select value={formData.tipo_receita} onValueChange={(v) => handleChange('tipo_receita', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPO_RECEITA_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {formData.tipo_receita === 'outros' && (
              <div>
                <Label>Justificativa *</Label>
                <Input 
                  value={formData.tipo_receita_justificativa} 
                  onChange={(e) => handleChange('tipo_receita_justificativa', e.target.value)}
                  placeholder="Descreva o tipo..."
                />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <DollarSign className="h-5 w-5 text-primary" />
              Valores e Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <Label>Valor Bruto (R$) *</Label>
              <Input 
                type="number" 
                step="0.01"
                value={formData.valor_bruto} 
                onChange={(e) => handleChange('valor_bruto', e.target.value)} 
                placeholder="0,00" 
              />
            </div>
            <div>
              <Label>Valor Pago (R$)</Label>
              <Input 
                type="number" 
                step="0.01"
                value={formData.valor_pago} 
                onChange={(e) => handleChange('valor_pago', e.target.value)} 
                placeholder="0,00" 
              />
            </div>
            <div>
              <Label>Status *</Label>
              <Select value={formData.status} onValueChange={(v) => handleChange('status', v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Data de Recebimento</Label>
              <Input 
                type="date" 
                value={formData.data_recebimento} 
                onChange={(e) => handleChange('data_recebimento', e.target.value)} 
              />
            </div>
            <div>
              <Label>Data de Vencimento</Label>
              <Input 
                type="date" 
                value={formData.data_vencimento} 
                onChange={(e) => handleChange('data_vencimento', e.target.value)} 
              />
            </div>
            <div>
              <Label>Forma de Pagamento</Label>
              <Select value={formData.forma_pagamento} onValueChange={(v) => handleChange('forma_pagamento', v)}>
                <SelectTrigger><SelectValue placeholder="Selecione..." /></SelectTrigger>
                <SelectContent>
                  {FORMA_PAGAMENTO_OPTIONS.map(opt => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <Label>Observações</Label>
              <Textarea 
                value={formData.observacoes} 
                onChange={(e) => handleChange('observacoes', e.target.value)} 
                rows={3} 
                placeholder="Observações sobre o lançamento..." 
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="outline" onClick={() => navigate('/financeiro')}>Cancelar</Button>
          <Button type="submit" disabled={createLancamento.isPending || updateLancamento.isPending} className="gap-2">
            <Save className="h-4 w-4" />
            {createLancamento.isPending || updateLancamento.isPending ? 'Salvando...' : 'Salvar Lançamento'}
          </Button>
        </div>
      </form>
    </div>
  );
}