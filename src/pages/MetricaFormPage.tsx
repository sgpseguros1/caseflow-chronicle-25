import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateMetricaDiaria } from '@/hooks/useMetricasDiarias';
import { useFuncionarios } from '@/hooks/useFuncionarios';
import { ArrowLeft, Save, Users, FileText, FolderOpen, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';

const formSchema = z.object({
  funcionario_id: z.string().min(1, 'Selecione um funcionário'),
  data: z.string().min(1, 'Data é obrigatória'),
  clientes_atendidos: z.coerce.number().min(0, 'Valor inválido'),
  processos_movidos: z.coerce.number().min(0, 'Valor inválido'),
  pastas_liberadas: z.coerce.number().min(0, 'Valor inválido'),
  descricao: z.string().optional(),
  pendencias: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function MetricaFormPage() {
  const navigate = useNavigate();
  const { data: funcionarios } = useFuncionarios();
  const createMetrica = useCreateMetricaDiaria();

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      funcionario_id: '',
      data: format(new Date(), 'yyyy-MM-dd'),
      clientes_atendidos: 0,
      processos_movidos: 0,
      pastas_liberadas: 0,
      descricao: '',
      pendencias: '',
    },
  });

  const onSubmit = async (data: FormData) => {
    await createMetrica.mutateAsync({
      funcionario_id: data.funcionario_id,
      data: data.data,
      clientes_atendidos: data.clientes_atendidos,
      processos_movidos: data.processos_movidos,
      pastas_liberadas: data.pastas_liberadas,
      descricao: data.descricao || null,
      pendencias: data.pendencias || null,
    });
    navigate('/metricas');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate('/metricas')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Registrar Métrica Diária</h1>
          <p className="text-muted-foreground">Informe os atendimentos e atividades do dia</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Identificação</CardTitle>
              <CardDescription>Funcionário e data do registro</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="funcionario_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Funcionário *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o funcionário" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {funcionarios?.filter(f => f.status === 'ativo').map((f) => (
                          <SelectItem key={f.id} value={f.id}>{f.nome}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="data"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data *</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Métricas de Produtividade</CardTitle>
              <CardDescription>Quantidades de atividades realizadas</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              <FormField
                control={form.control}
                name="clientes_atendidos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <Users className="h-4 w-4 text-blue-500" />
                      Clientes Atendidos
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormDescription>Quantidade de clientes atendidos hoje</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="processos_movidos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-green-500" />
                      Processos Movidos
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormDescription>Processos com andamento hoje</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pastas_liberadas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <FolderOpen className="h-4 w-4 text-purple-500" />
                      Pastas Liberadas
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min="0" {...field} />
                    </FormControl>
                    <FormDescription>Pastas finalizadas ou liberadas</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Observações</CardTitle>
              <CardDescription>Detalhes adicionais do dia</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-6">
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição das Atividades</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Descreva as principais atividades realizadas..."
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pendencias"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Pendências
                    </FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Liste pendências que ficaram para o próximo dia..."
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Tarefas não concluídas ou que precisam de acompanhamento</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => navigate('/metricas')}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createMetrica.isPending}>
              <Save className="mr-2 h-4 w-4" />
              {createMetrica.isPending ? 'Salvando...' : 'Salvar Métrica'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
