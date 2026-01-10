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
import { useSeguradora, useCreateSeguradora, useUpdateSeguradora } from '@/hooks/useSeguradoras';

const formSchema = z.object({
  razao_social: z.string().min(1, 'Razão social é obrigatória'),
  nome_fantasia: z.string().optional(),
  cnpj: z.string().optional(),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  status: z.string().default('ativo'),
});

type FormData = z.infer<typeof formSchema>;

export default function SeguradoraFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const { data: seguradora, isLoading: loading } = useSeguradora(id);
  const createSeguradora = useCreateSeguradora();
  const updateSeguradora = useUpdateSeguradora();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { razao_social: '', nome_fantasia: '', cnpj: '', telefone: '', email: '', status: 'ativo' },
  });

  useEffect(() => {
    if (seguradora) {
      form.reset({
        razao_social: seguradora.razao_social,
        nome_fantasia: seguradora.nome_fantasia || '',
        cnpj: seguradora.cnpj || '',
        telefone: seguradora.telefone || '',
        email: seguradora.email || '',
        status: seguradora.status,
      });
    }
  }, [seguradora, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        razao_social: data.razao_social,
        nome_fantasia: data.nome_fantasia || null,
        cnpj: data.cnpj || null,
        telefone: data.telefone || null,
        email: data.email || null,
        status: data.status,
      };
      if (isEditing && id) {
        await updateSeguradora.mutateAsync({ id, ...payload });
      } else {
        await createSeguradora.mutateAsync(payload);
      }
      navigate('/cadastros/seguradoras');
    } catch (error) {}
  };

  const isSubmitting = createSeguradora.isPending || updateSeguradora.isPending;

  if (isEditing && loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Editar Seguradora' : 'Nova Seguradora'}</h1>
          <p className="text-muted-foreground">{isEditing ? 'Atualize as informações' : 'Preencha os dados'}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Dados da Seguradora</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField control={form.control} name="razao_social" render={({ field }) => (
                  <FormItem><FormLabel>Razão Social *</FormLabel><FormControl><Input placeholder="Razão social" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="nome_fantasia" render={({ field }) => (
                  <FormItem><FormLabel>Nome Fantasia</FormLabel><FormControl><Input placeholder="Nome fantasia" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cnpj" render={({ field }) => (
                  <FormItem><FormLabel>CNPJ</FormLabel><FormControl><Input placeholder="00.000.000/0000-00" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="telefone" render={({ field }) => (
                  <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(00) 0000-0000" {...field} /></FormControl><FormMessage /></FormItem>
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
                <Button type="button" variant="outline" onClick={() => navigate('/cadastros/seguradoras')}>Cancelar</Button>
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
