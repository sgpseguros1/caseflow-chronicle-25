import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ArrowLeft, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdvogado, useCreateAdvogado, useUpdateAdvogado } from '@/hooks/useAdvogados';
import { useState } from 'react';

const formSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  oab: z.string().min(1, 'OAB é obrigatório'),
  uf: z.string().min(2, 'UF é obrigatório'),
  cidade: z.string().optional(),
  situacao_oab: z.string().default('regular'),
  telefone: z.string().optional(),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
  status: z.string().default('ativo'),
});

type FormData = z.infer<typeof formSchema>;

const ufs = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];
const especialidadesOptions = ['Direito do Trabalho', 'Direito Securitário', 'Direito Civil', 'Direito Penal', 'Direito Previdenciário', 'Direito Tributário', 'Direito Empresarial'];

export default function AdvogadoFormPage() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [newEsp, setNewEsp] = useState('');

  const { data: advogado, isLoading: loadingAdvogado } = useAdvogado(id);
  const createAdvogado = useCreateAdvogado();
  const updateAdvogado = useUpdateAdvogado();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: { nome: '', oab: '', uf: '', cidade: '', situacao_oab: 'regular', telefone: '', email: '', status: 'ativo' },
  });

  useEffect(() => {
    if (advogado) {
      form.reset({
        nome: advogado.nome,
        oab: advogado.oab,
        uf: advogado.uf,
        cidade: advogado.cidade || '',
        situacao_oab: advogado.situacao_oab || 'regular',
        telefone: advogado.telefone || '',
        email: advogado.email || '',
        status: advogado.status,
      });
      setEspecialidades(advogado.especialidades || []);
    }
  }, [advogado, form]);

  const addEspecialidade = (esp: string) => {
    if (esp && !especialidades.includes(esp)) {
      setEspecialidades([...especialidades, esp]);
    }
    setNewEsp('');
  };

  const removeEspecialidade = (esp: string) => {
    setEspecialidades(especialidades.filter((e) => e !== esp));
  };

  const onSubmit = async (data: FormData) => {
    try {
      const payload = {
        nome: data.nome,
        oab: data.oab,
        uf: data.uf,
        cidade: data.cidade || null,
        situacao_oab: data.situacao_oab,
        especialidades,
        telefone: data.telefone || null,
        email: data.email || null,
        status: data.status,
        verificado_em: null,
      };
      if (isEditing && id) {
        await updateAdvogado.mutateAsync({ id, ...payload });
      } else {
        await createAdvogado.mutateAsync(payload);
      }
      navigate('/cadastros/advogados');
    } catch (error) {}
  };

  const isSubmitting = createAdvogado.isPending || updateAdvogado.isPending;

  if (isEditing && loadingAdvogado) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}><ArrowLeft className="h-5 w-5" /></Button>
        <div>
          <h1 className="text-2xl font-bold">{isEditing ? 'Editar Advogado' : 'Novo Advogado'}</h1>
          <p className="text-muted-foreground">{isEditing ? 'Atualize as informações' : 'Preencha os dados'}</p>
        </div>
      </div>

      <Card>
        <CardHeader><CardTitle>Dados do Advogado</CardTitle></CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <FormField control={form.control} name="nome" render={({ field }) => (
                  <FormItem><FormLabel>Nome *</FormLabel><FormControl><Input placeholder="Nome completo" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <div className="grid grid-cols-3 gap-2">
                  <FormField control={form.control} name="uf" render={({ field }) => (
                    <FormItem><FormLabel>UF *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl><SelectTrigger><SelectValue placeholder="UF" /></SelectTrigger></FormControl>
                        <SelectContent>{ufs.map((uf) => <SelectItem key={uf} value={uf}>{uf}</SelectItem>)}</SelectContent>
                      </Select><FormMessage />
                    </FormItem>
                  )} />
                  <FormField control={form.control} name="oab" render={({ field }) => (
                    <FormItem className="col-span-2"><FormLabel>OAB *</FormLabel><FormControl><Input placeholder="123456" {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                </div>
                <FormField control={form.control} name="cidade" render={({ field }) => (
                  <FormItem><FormLabel>Cidade</FormLabel><FormControl><Input placeholder="Cidade" {...field} /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="situacao_oab" render={({ field }) => (
                  <FormItem><FormLabel>Situação OAB</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="regular">Regular</SelectItem>
                        <SelectItem value="irregular">Irregular</SelectItem>
                        <SelectItem value="suspenso">Suspenso</SelectItem>
                      </SelectContent>
                    </Select><FormMessage />
                  </FormItem>
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
              <div>
                <FormLabel>Especialidades</FormLabel>
                <div className="flex flex-wrap gap-2 mt-2 mb-2">
                  {especialidades.map((esp) => (
                    <Badge key={esp} variant="secondary" className="gap-1">
                      {esp}<button type="button" onClick={() => removeEspecialidade(esp)}><X className="h-3 w-3" /></button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Select value={newEsp} onValueChange={(v) => { addEspecialidade(v); }}>
                    <SelectTrigger className="w-[200px]"><SelectValue placeholder="Adicionar..." /></SelectTrigger>
                    <SelectContent>
                      {especialidadesOptions.filter((e) => !especialidades.includes(e)).map((esp) => (
                        <SelectItem key={esp} value={esp}>{esp}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => navigate('/cadastros/advogados')}>Cancelar</Button>
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
