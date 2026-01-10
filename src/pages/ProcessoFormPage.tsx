import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useCreateProcesso } from '@/hooks/useProcessos';
import { useClients } from '@/hooks/useClients';
import { useAdvogados } from '@/hooks/useAdvogados';
import { useSeguradoras } from '@/hooks/useSeguradoras';

const formSchema = z.object({
  numero: z.string().optional(),
  tipo: z.string().min(1, 'Tipo é obrigatório'),
  titulo: z.string().optional(),
  cliente_id: z.string().optional(),
  advogado_id: z.string().optional(),
  seguradora_id: z.string().optional(),
  status: z.string().default('pendente'),
  valor_estimado: z.string().optional(),
  observacoes: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function ProcessoFormPage() {
  const navigate = useNavigate();
  const createProcesso = useCreateProcesso();
  const { data: clientes } = useClients();
  const { data: advogados } = useAdvogados();
  const { data: seguradoras } = useSeguradoras();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      numero: '',
      tipo: '',
      titulo: '',
      cliente_id: '',
      advogado_id: '',
      seguradora_id: '',
      status: 'pendente',
      valor_estimado: '',
      observacoes: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    try {
      await createProcesso.mutateAsync({
        numero: data.numero || null,
        tipo: data.tipo,
        titulo: data.titulo || null,
        cliente_id: data.cliente_id || null,
        advogado_id: data.advogado_id || null,
        seguradora_id: data.seguradora_id || null,
        responsavel_id: null,
        status: data.status,
        valor_estimado: data.valor_estimado ? parseFloat(data.valor_estimado) : null,
        valor_final: null,
        honorarios: null,
        data_abertura: new Date().toISOString().split('T')[0],
        data_conclusao: null,
        observacoes: data.observacoes || null,
        etiquetas: [],
      });
      navigate('/processos');
    } catch (error) {}
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold">Novo Processo</h1>
          <p className="text-muted-foreground">Preencha os dados do processo</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Dados do Processo</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField control={form.control} name="tipo" render={({ field }) => (
                  <FormItem><FormLabel>Tipo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="DPVAT">DPVAT</SelectItem>
                        <SelectItem value="INSS">INSS</SelectItem>
                        <SelectItem value="VIDA">Seguro de Vida</SelectItem>
                        <SelectItem value="VIDA_EMPRESARIAL">Vida Empresarial</SelectItem>
                        <SelectItem value="DANOS">Danos</SelectItem>
                        <SelectItem value="JUDICIAL">Judicial</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="numero" render={({ field }) => (
                  <FormItem><FormLabel>Número do Processo</FormLabel><FormControl><Input placeholder="0000000-00.0000.0.00.0000" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="titulo" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Título</FormLabel><FormControl><Input placeholder="Título do processo" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cliente_id" render={({ field }) => (
                  <FormItem><FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione o cliente" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {clientes?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="advogado_id" render={({ field }) => (
                  <FormItem><FormLabel>Advogado</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione o advogado" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {advogados?.map((a) => <SelectItem key={a.id} value={a.id}>{a.nome} - {a.uf} {a.oab}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="seguradora_id" render={({ field }) => (
                  <FormItem><FormLabel>Seguradora</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue placeholder="Selecione a seguradora" /></SelectTrigger></FormControl>
                      <SelectContent>
                        {seguradoras?.map((s) => <SelectItem key={s.id} value={s.id}>{s.razao_social}</SelectItem>)}
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="pendente">Pendente</SelectItem>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="aguardando_documentos">Aguardando Documentos</SelectItem>
                        <SelectItem value="aguardando_pagamento">Aguardando Pagamento</SelectItem>
                        <SelectItem value="concluido">Concluído</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="valor_estimado" render={({ field }) => (
                  <FormItem><FormLabel>Valor Estimado (R$)</FormLabel><FormControl><Input type="number" step="0.01" placeholder="0,00" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="observacoes" render={({ field }) => (
                  <FormItem className="md:col-span-2"><FormLabel>Observações</FormLabel><FormControl><Textarea placeholder="Observações sobre o processo" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/processos')}>Cancelar</Button>
                <Button type="submit" disabled={createProcesso.isPending}>
                  {createProcesso.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Criar Processo
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
