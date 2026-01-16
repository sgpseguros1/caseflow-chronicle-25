import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useProcessosSincronizados, useMovimentacoesProcesso } from '@/hooks/useProcessosSincronizados';
import { supabase } from '@/integrations/supabase/client';
import { Search, Scale, ExternalLink, AlertTriangle, CheckCircle, Clock, Trash2, Eye, Loader2, Gavel, FileText, User, Hash } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateOnly } from '@/lib/dateUtils';
import { toast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useQueryClient } from '@tanstack/react-query';

export default function MonitoramentoOABPage() {
  const [busca, setBusca] = useState('');
  const [buscando, setBuscando] = useState(false);
  const [processoDetalhe, setProcessoDetalhe] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: processos, isLoading: loadingProcessos } = useProcessosSincronizados();
  const { data: movimentacoes } = useMovimentacoesProcesso(processoDetalhe || undefined);

  const handleBuscar = async () => {
    const termo = busca.trim();
    if (!termo) {
      toast({
        title: 'Informe um termo de busca',
        description: 'Digite um CPF, nome ou número do processo (CNJ)',
        variant: 'destructive',
      });
      return;
    }

    setBuscando(true);

    try {
      // Detectar tipo de busca
      const isCNJ = /^\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4}$/.test(termo) || termo.replace(/\D/g, '').length === 20;
      const isCPF = termo.replace(/\D/g, '').length === 11;

      const { data, error } = await supabase.functions.invoke('buscar-processo-datajud', {
        body: {
          numero_processo: isCNJ ? termo : undefined,
          cpf: isCPF ? termo.replace(/\D/g, '') : undefined,
          nome: (!isCNJ && !isCPF) ? termo : undefined,
        },
      });

      if (error) throw error;

      if (data?.success) {
        toast({
          title: 'Processo encontrado!',
          description: `Dados do processo ${data.numero_processo || termo} foram importados.`,
        });
        queryClient.invalidateQueries({ queryKey: ['processos-sincronizados'] });
      } else {
        toast({
          title: 'Nenhum processo encontrado',
          description: data?.error || 'Verifique os dados informados e tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Erro na busca:', error);
      toast({
        title: 'Erro na busca',
        description: error.message || 'Ocorreu um erro ao buscar o processo.',
        variant: 'destructive',
      });
    } finally {
      setBuscando(false);
    }
  };

  const handleExcluirProcesso = async (id: string) => {
    try {
      // Primeiro excluir movimentações relacionadas
      await supabase.from('movimentacoes_processo').delete().eq('processo_id', id);
      // Depois excluir o processo
      const { error } = await supabase.from('processos_sincronizados').delete().eq('id', id);
      if (error) throw error;
      
      toast({
        title: 'Processo excluído',
        description: 'O processo foi removido do monitoramento.',
      });
      queryClient.invalidateQueries({ queryKey: ['processos-sincronizados'] });
    } catch (error: any) {
      toast({
        title: 'Erro ao excluir',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  const stats = {
    totalProcessos: processos?.length || 0,
    ativos: processos?.filter(p => p.situacao === 'Em andamento' || p.situacao === 'Ativo')?.length || 0,
    arquivados: processos?.filter(p => p.situacao === 'Arquivado' || p.situacao === 'Baixado')?.length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Monitoramento de Processos</h1>
        <p className="text-muted-foreground">Busque por CPF, nome ou número do processo (CNJ) para monitorar</p>
      </div>

      {/* Card de Busca Principal */}
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-primary/10">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Importar Processo
          </CardTitle>
          <CardDescription>
            Digite um CPF, nome da parte ou número CNJ para buscar e importar o processo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 space-y-2">
              <Label htmlFor="busca">Buscar por:</Label>
              <div className="flex gap-2">
                <Input
                  id="busca"
                  placeholder="Ex: 123.456.789-00 ou 0001234-56.2024.8.08.0001 ou João Silva"
                  value={busca}
                  onChange={(e) => setBusca(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleBuscar()}
                  className="flex-1"
                />
                <Button onClick={handleBuscar} disabled={buscando} className="gap-2">
                  {buscando ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  {buscando ? 'Buscando...' : 'Buscar'}
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="w-3 h-3" /> CPF: 123.456.789-00
                </span>
                <span className="flex items-center gap-1">
                  <Hash className="w-3 h-3" /> CNJ: 0001234-56.2024.8.08.0001
                </span>
                <span className="flex items-center gap-1">
                  <FileText className="w-3 h-3" /> Nome: João da Silva
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200 dark:border-purple-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Total Processos</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.totalProcessos}</p>
              </div>
              <div className="p-2 bg-purple-500/20 rounded-full">
                <Gavel className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200 dark:border-green-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Em Andamento</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.ativos}</p>
              </div>
              <div className="p-2 bg-green-500/20 rounded-full">
                <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-gray-500/10 to-gray-600/5 border-gray-200 dark:border-gray-800">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase">Arquivados</p>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">{stats.arquivados}</p>
              </div>
              <div className="p-2 bg-gray-500/20 rounded-full">
                <CheckCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Processos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="w-5 h-5" />
            Processos Monitorados
          </CardTitle>
          <CardDescription>
            Processos importados e sendo monitorados automaticamente
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingProcessos ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Carregando...</span>
            </div>
          ) : !processos?.length ? (
            <div className="text-center py-12">
              <Scale className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">Nenhum processo monitorado</h3>
              <p className="text-muted-foreground mb-4">
                Use o campo de busca acima para importar processos por CPF, nome ou número CNJ
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nº Processo</TableHead>
                    <TableHead>Classe</TableHead>
                    <TableHead>Tribunal</TableHead>
                    <TableHead>Situação</TableHead>
                    <TableHead>Última Movimentação</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processos.map((processo) => (
                    <TableRow key={processo.id}>
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          {processo.numero_processo}
                          {processo.link_externo && (
                            <a 
                              href={processo.link_externo} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-primary hover:text-primary/80"
                            >
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{processo.classe_processual || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{processo.tribunal?.toUpperCase() || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={
                          processo.situacao === 'Arquivado' || processo.situacao === 'Baixado' 
                            ? 'secondary' 
                            : 'default'
                        }>
                          {processo.situacao || 'Em andamento'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="truncate max-w-[200px]">{processo.ultimo_movimento || '-'}</p>
                          {processo.data_ultimo_movimento && (
                            <p className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(processo.data_ultimo_movimento), { addSuffix: true, locale: ptBR })}
                            </p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setProcessoDetalhe(processo.id)}
                          >
                            <Eye className="w-3 h-3" />
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleExcluirProcesso(processo.id)}
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal de Detalhes do Processo */}
      <Dialog open={!!processoDetalhe} onOpenChange={() => setProcessoDetalhe(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Movimentações do Processo</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[60vh]">
            {movimentacoes?.length ? (
              <div className="space-y-3">
                {movimentacoes.map((mov) => (
                  <div key={mov.id} className={`p-4 border rounded-lg ${mov.urgente ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''}`}>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium">{mov.descricao}</p>
                        {mov.complemento && (
                          <p className="text-sm text-muted-foreground mt-1">{mov.complemento}</p>
                        )}
                        {mov.decisao_teor && (
                          <div className="mt-2 p-2 bg-muted rounded text-sm">
                            {mov.decisao_teor}
                          </div>
                        )}
                      </div>
                      <div className="text-right text-sm text-muted-foreground">
                        {formatDateOnly(mov.data_movimento)}
                      </div>
                    </div>
                    {mov.urgente && (
                      <Badge variant="destructive" className="mt-2">
                        <AlertTriangle className="w-3 h-3 mr-1" /> Urgente
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma movimentação registrada
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
