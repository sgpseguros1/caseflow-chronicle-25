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
import { useFuncionario, useCreateFuncionario, useUpdateFuncionario } from '@/hooks/useFuncionarios';
import { cpfValidation, formatCPF } from '@/lib/documentValidation';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  email: z.string().email('Email inválido'),
  telefone: z.string().optional(),
  cpf: z.string().optional().refine(cpfValidation, { message: 'CPF inválido' }),
  cargo: z.string().min(1, 'Cargo é obrigatório'),
  departamento: z.string().optional(),
  status: z.string().default('ativo'),
});

type FormData = z.infer<typeof formSchema>;

export default function FuncionarioFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;

  const { data: funcionario, isLoading: loading } = useFuncionario(id);
  const createFuncionario = useCreateFuncionario();
  const updateFuncionario = useUpdateFuncionario();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', email: '', telefone: '', cpf: '', cargo: 'funcionario', departamento: '', status: 'ativo' },
  });

  useEffect(() => {
    if (funcionario) {
      form.reset({
        nome: funcionario.nome,
        email: funcionario.email,
        telefone: funcionario.telefone || '',
        cpf: funcionario.cpf || '',
        cargo: funcionario.cargo,
        departamento: funcionario.departamento || '',
        status: funcionario.status,
      });
    }
  }, [funcionario, form]);

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        user_id: null,
        nome: data.nome,
        email: data.email,
        telefone: data.telefone || null,
        cpf: data.cpf || null,
        cargo: data.cargo,
        departamento: data.departamento || null,
        status: data.status,
      };
      if (isEditing && id) {
        await updateFuncionario.mutateAsync({ id, ...payload });
      } else {
        await createFuncionario.mutateAsync(payload);
      }
      navigate('/funcionarios');
    } catch (error) {}
  };

  const isSubmitting = createFuncionario.isPending || updateFuncionario.isPending;

  if (isEditing && loading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Editar Funcionário' : 'Novo Funcionário'}</h1>
          <p className="text-muted-foreground">{isEditing ? 'Atualize as informações' : 'Preencha os dados'}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Dados do Funcionário</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField control={form.control} name="nome" render={({ field }) => (
                  <FormItem><FormLabel>Nome *</FormLabel><FormControl><Input placeholder="Nome completo" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem><FormLabel>Email *</FormLabel><FormControl><Input type="email" placeholder="email@exemplo.com" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="telefone" render={({ field }) => (
                  <FormItem><FormLabel>Telefone</FormLabel><FormControl><Input placeholder="(00) 00000-0000" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cpf" render={({ field }) => (
                  <FormItem><FormLabel>CPF</FormLabel><FormControl><Input placeholder="000.000.000-00" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cargo" render={({ field }) => (
                  <FormItem><FormLabel>Cargo *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="gestor">Gestor</SelectItem>
                        <SelectItem value="funcionario">Funcionário</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="departamento" render={({ field }) => (
                  <FormItem><FormLabel>Departamento</FormLabel><FormControl><Input placeholder="Ex: Jurídico, Administrativo" {...field} /></FormControl><FormMessage /></FormItem>
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
                <Button type="button" variant="outline" onClick={() => navigate('/funcionarios')}>Cancelar</Button>
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
