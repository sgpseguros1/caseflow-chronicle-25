import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { MessageSquare, Mail, Phone, Zap, Search } from 'lucide-react';
import { useCreateConversa, useEnviarMensagem } from '@/hooks/useComunicacaoCentral';
import { useClients } from '@/hooks/useClients';

const CANAIS = [
  { value: 'whatsapp', label: 'WhatsApp', icon: MessageSquare, color: 'text-green-600' },
  { value: 'email', label: 'E-mail', icon: Mail, color: 'text-blue-600' },
  { value: 'sms', label: 'SMS', icon: Phone, color: 'text-purple-600' },
  { value: 'interno', label: 'Interno', icon: Zap, color: 'text-amber-600' },
];

interface NovaConversaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (id: string) => void;
}

export function NovaConversaDialog({ open, onOpenChange, onCreated }: NovaConversaDialogProps) {
  const [canal, setCanal] = useState('whatsapp');
  const [titulo, setTitulo] = useState('');
  const [mensagem, setMensagem] = useState('');
  const [clienteId, setClienteId] = useState<string>('');
  const [searchCliente, setSearchCliente] = useState('');

  const createConversa = useCreateConversa();
  const enviarMensagem = useEnviarMensagem();
  const { data: clientes = [] } = useClients();

  const clientesFiltrados = clientes.filter(c => {
    if (!searchCliente) return true;
    const search = searchCliente.toLowerCase();
    return (
      c.name.toLowerCase().includes(search) ||
      c.code?.toString().includes(search) ||
      c.cpf?.includes(search)
    );
  }).slice(0, 10);

  const clienteSelecionado = clientes.find(c => c.id === clienteId);

  const handleSubmit = async () => {
    if (!mensagem.trim()) return;

    try {
      const conversa = await createConversa.mutateAsync({
        canal,
        titulo: titulo || clienteSelecionado?.name || 'Nova conversa',
        cliente_id: clienteId || undefined,
      });

      await enviarMensagem.mutateAsync({
        conversa_id: conversa.id,
        canal,
        conteudo: mensagem.trim(),
        cliente_id: clienteId || undefined,
      });

      // Reset form
      setCanal('whatsapp');
      setTitulo('');
      setMensagem('');
      setClienteId('');
      setSearchCliente('');
      
      onCreated?.(conversa.id);
    } catch (error) {
      console.error('Error creating conversation:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Conversa</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Canal */}
          <div className="space-y-2">
            <Label>Canal de Comunicação</Label>
            <div className="grid grid-cols-4 gap-2">
              {CANAIS.map((c) => {
                const Icon = c.icon;
                const isSelected = canal === c.value;
                return (
                  <Button
                    key={c.value}
                    type="button"
                    variant={isSelected ? 'default' : 'outline'}
                    className="flex flex-col h-auto py-3"
                    onClick={() => setCanal(c.value)}
                  >
                    <Icon className={`h-5 w-5 mb-1 ${!isSelected ? c.color : ''}`} />
                    <span className="text-xs">{c.label}</span>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Cliente */}
          <div className="space-y-2">
            <Label>Cliente (opcional)</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar cliente por nome, código ou CPF..."
                value={searchCliente}
                onChange={(e) => {
                  setSearchCliente(e.target.value);
                  setClienteId('');
                }}
                className="pl-9"
              />
            </div>
            {searchCliente && !clienteId && clientesFiltrados.length > 0 && (
              <div className="border rounded-md max-h-40 overflow-y-auto">
                {clientesFiltrados.map((cliente) => (
                  <div
                    key={cliente.id}
                    onClick={() => {
                      setClienteId(cliente.id);
                      setSearchCliente(cliente.name);
                    }}
                    className="p-2 hover:bg-muted cursor-pointer text-sm"
                  >
                    <span className="font-medium">#{cliente.code}</span> - {cliente.name}
                    {cliente.cpf && <span className="text-muted-foreground ml-2">({cliente.cpf})</span>}
                  </div>
                ))}
              </div>
            )}
            {clienteSelecionado && (
              <div className="text-sm text-muted-foreground">
                Cliente selecionado: <strong>#{clienteSelecionado.code} - {clienteSelecionado.name}</strong>
              </div>
            )}
          </div>

          {/* Título */}
          <div className="space-y-2">
            <Label>Título/Assunto (opcional)</Label>
            <Input
              placeholder="Ex: Dúvida sobre processo, Solicitação de documentos..."
              value={titulo}
              onChange={(e) => setTitulo(e.target.value)}
            />
          </div>

          {/* Mensagem */}
          <div className="space-y-2">
            <Label>Primeira Mensagem *</Label>
            <Textarea
              placeholder="Digite a mensagem inicial da conversa..."
              value={mensagem}
              onChange={(e) => setMensagem(e.target.value)}
              rows={4}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!mensagem.trim() || createConversa.isPending || enviarMensagem.isPending}
          >
            Iniciar Conversa
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
