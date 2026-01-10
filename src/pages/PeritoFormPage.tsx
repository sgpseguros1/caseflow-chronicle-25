import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePerito, useCreatePerito, useUpdatePerito } from '@/hooks/usePeritos';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  especialidade: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  status: z.string().default('ativo'),
});

type FormData = z.infer<typeof formSchema>;

export default function PeritoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const { data: perito, isLoading: loading } = usePerito(id);
  const createPerito = useCreatePerito();
  const updatePerito = useUpdatePerito();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', especialidade: '', telefone: '', email: '', status: 'ativo' },
  });

  useEffect(() => {
    if (perito) {
      form.reset({
        nome: perito.nome,
        especialidade: perito.especialidade || '',
        telefone: perito.telefone || '',
        email: perito.email || '',
        status: perito.status,
      });
    }
  }, [perito, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        nome: data.nome,
        especialidade: data.especialidade || null,
        telefone: data.telefone || null,
        email: data.email || null,
        status: data.status,
      };
      if (isEditing && id) {
        await updatePerito.mutateAsync({ id, ...payload });
      } else {
        await createPerito.mutateAsync(payload);
      }
      navigate('/cadastros/peritos');
    } catch (error) {}
  };

  const isSubmitting = createPerito.isPending || updatePerito.isPending;

  if (isEditing && loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Editar Perito' : 'Novo Perito'}</h1>
          <p className="text-muted-foreground">{isEditing ? 'Atualize as informações' : 'Preencha os dados'}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Dados do Perito</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField control={form.control} name="nome" render={({ field }) => (
                  <FormItem><FormLabel>Nome *</FormLabel><FormControl><Input placeholder="Nome completo" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="especialidade" render={({ field }) => (
                  <FormItem><FormLabel>Especialidade</FormLabel><FormControl><Input placeholder="Ex: Médico, Engenheiro" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="telefone" render={({ field }) => (
                  <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="status" render={({ field }) => (
                  <FormItem><FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="ativo">Ativo</SelectItem>
                        <SelectItem value="inativo">Inativo</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/cadastros/peritos')}>Cancelar</Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isEditing ? 'Salvar' : 'Cadastrar'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
