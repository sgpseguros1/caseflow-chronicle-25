import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useOABMonitoradas, useCreateOABMonitorada, useDeleteOABMonitorada } from '@/hooks/useOABMonitoradas';
import { useProcessosSincronizados, useMovimentacoesPendentes, useMarcarMovimentacaoLida } from '@/hooks/useProcessosSincronizados';
import { Plus, Scale, ExternalLink, AlertTriangle, CheckCircle, Clock, Trash2, RefreshCw, Eye, Bell } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { formatDateOnly } from '@/lib/dateUtils';

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 
  'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

export default function MonitoramentoOABPage() {
  const [novaOAB, setNovaOAB] = useState({ numero_oab: '', uf: '', nome_advogado: '' });
  const [dialogOpen, setDialogOpen] = useState(false);
  const [oabSelecionada, setOabSelecionada] = useState<string | undefined>();

  const { data: oabs, isLoading: loadingOabs } = useOABMonitoradas();
  const { data: processos, isLoading: loadingProcessos } = useProcessosSincronizados(oabSelecionada);
  const { data: movimentacoesPendentes } = useMovimentacoesPendentes();
  const createOAB = useCreateOABMonitorada();
  const deleteOAB = useDeleteOABMonitorada();
  const marcarLida = useMarcarMovimentacaoLida();

  const handleAddOAB = async () => {
    if (!novaOAB.numero_oab || !novaOAB.uf) return;
    await createOAB.mutateAsync(novaOAB);
    setNovaOAB({ numero_oab: '', uf: '', nome_advogado: '' });
    setDialogOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Monitoramento Judicial</h1>
          <p className="text-muted-foreground">Acompanhe processos vinculados às OABs cadastradas</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" /> Adicionar OAB</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar OAB para Monitoramento</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Número OAB</Label>
                  <Input 
                    placeholder="123456" 
                    value={novaOAB.numero_oab}
                    onChange={(e) => setNovaOAB({ ...novaOAB, numero_oab: e.target.value })}
                  />
                </div>
                <div>
                  <Label>UF</Label>
                  <Select 
                    value={novaOAB.uf} 
                    onValueChange={(v) => setNovaOAB({ ...novaOAB, uf: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione" />
                    </SelectTrigger>
                    <SelectContent>
                      {UF_OPTIONS.map(uf => (
                        <SelectItem key={uf} value={uf}>{uf}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Nome do Advogado (opcional)</Label>
                <Input 
                  placeholder="Dr. João Silva"
                  value={novaOAB.nome_advogado}
                  onChange={(e) => setNovaOAB({ ...novaOAB, nome_advogado: e.target.value })}
                />
              </div>
              <Button onClick={handleAddOAB} disabled={createOAB.isPending} className="w-full">
                {createOAB.isPending ? 'Adicionando...' : 'Adicionar OAB'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Alerta de Integrações */}
      <Card className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-amber-500 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-700 dark:text-amber-400">Integração com DataJud (CNJ)</h3>
              <p className="text-sm text-amber-600 dark:text-amber-300 mt-1">
                Para sincronizar processos automaticamente, é necessário configurar a API do DataJud.
                Acesse <a href="https://datajud-wiki.cnj.jus.br/" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  https://datajud-wiki.cnj.jus.br/
                </a> para solicitar uma chave de API.
              </p>
              <p className="text-sm text-amber-600 dark:text-amber-300 mt-2">
                Alternativamente, use o <a href="https://www.jusbrasil.com.br" target="_blank" rel="noopener noreferrer" className="underline font-medium">
                  JusBrasil
                </a> para consulta manual de processos.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="oabs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="oabs" className="gap-2">
            <Scale className="w-4 h-4" /> OABs Monitoradas
          </TabsTrigger>
          <TabsTrigger value="pendentes" className="gap-2">
            <Bell className="w-4 h-4" /> 
            Movimentações Pendentes
            {(movimentacoesPendentes?.length || 0) > 0 && (
              <Badge variant="destructive" className="ml-1">{movimentacoesPendentes?.length}</Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="processos" className="gap-2">
            <Eye className="w-4 h-4" /> Processos
          </TabsTrigger>
        </TabsList>

        <TabsContent value="oabs" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {loadingOabs ? (
              <p className="text-muted-foreground col-span-full">Carregando...</p>
            ) : oabs?.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="pt-6 text-center">
                  <Scale className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma OAB cadastrada para monitoramento</p>
                  <Button variant="outline" className="mt-4" onClick={() => setDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" /> Adicionar primeira OAB
                  </Button>
                </CardContent>
              </Card>
            ) : (
              oabs?.map((oab) => (
                <Card key={oab.id} className={`cursor-pointer transition-colors ${oabSelecionada === oab.id ? 'ring-2 ring-primary' : 'hover:bg-muted/50'}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">OAB {oab.numero_oab}/{oab.uf}</CardTitle>
                        <CardDescription>{oab.nome_advogado || 'Advogado não informado'}</CardDescription>
                      </div>
                      <Badge variant={oab.ativo ? 'default' : 'secondary'}>
                        {oab.ativo ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {oab.ultima_sincronizacao 
                          ? formatDistanceToNow(new Date(oab.ultima_sincronizacao), { addSuffix: true, locale: ptBR })
                          : 'Nunca sincronizado'
                        }
                      </span>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => { e.stopPropagation(); setOabSelecionada(oab.id); }}
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={(e) => { e.stopPropagation(); deleteOAB.mutate(oab.id); }}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="pendentes">
          <Card>
            <CardHeader>
              <CardTitle>Movimentações Pendentes de Leitura</CardTitle>
              <CardDescription>Decisões e despachos que requerem sua atenção</CardDescription>
            </CardHeader>
            <CardContent>
              {!movimentacoesPendentes?.length ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhuma movimentação pendente</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {movimentacoesPendentes.map((mov: any) => (
                    <div key={mov.id} className={`p-4 border rounded-lg ${mov.urgente ? 'border-red-500 bg-red-50 dark:bg-red-950/20' : ''}`}>
                      <div className="flex justify-between items-start gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {mov.urgente && <Badge variant="destructive">URGENTE</Badge>}
                            <span className="font-medium">{mov.processos_sincronizados?.numero_processo}</span>
                            <Badge variant="outline">{mov.processos_sincronizados?.tribunal}</Badge>
                          </div>
                          <p className="text-sm">{mov.descricao}</p>
                          {mov.prazo_fatal && (
                            <p className="text-xs text-red-600 mt-1">
                              Prazo Fatal: {formatDateOnly(mov.prazo_fatal)}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            {formatDistanceToNow(new Date(mov.data_movimento), { addSuffix: true, locale: ptBR })}
                          </p>
                        </div>
                        <Button size="sm" onClick={() => marcarLida.mutate(mov.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Marcar como lida
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="processos">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle>Processos Sincronizados</CardTitle>
                  <CardDescription>
                    {oabSelecionada 
                      ? `Processos da OAB ${oabs?.find(o => o.id === oabSelecionada)?.numero_oab}/${oabs?.find(o => o.id === oabSelecionada)?.uf}`
                      : 'Selecione uma OAB para filtrar os processos'
                    }
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  {oabSelecionada && (
                    <Button variant="outline" size="sm" onClick={() => setOabSelecionada(undefined)}>
                      Ver Todos
                    </Button>
                  )}
                  <Button variant="outline" size="sm" disabled>
                    <RefreshCw className="w-4 h-4 mr-2" /> Sincronizar
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingProcessos ? (
                <p className="text-center py-8 text-muted-foreground">Carregando processos...</p>
              ) : !processos?.length ? (
                <div className="text-center py-8">
                  <Scale className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum processo sincronizado</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Configure a API do DataJud para sincronizar processos automaticamente
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Número</TableHead>
                      <TableHead>Tribunal</TableHead>
                      <TableHead>Classe</TableHead>
                      <TableHead>Situação</TableHead>
                      <TableHead>Último Movimento</TableHead>
                      <TableHead></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {processos.map((processo) => (
                      <TableRow key={processo.id}>
                        <TableCell className="font-mono text-sm">{processo.numero_processo}</TableCell>
                        <TableCell>{processo.tribunal}</TableCell>
                        <TableCell>{processo.classe_processual || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{processo.situacao || 'Em andamento'}</Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate">{processo.ultimo_movimento || '-'}</TableCell>
                        <TableCell>
                          {processo.link_externo && (
                            <Button variant="ghost" size="sm" asChild>
                              <a href={processo.link_externo} target="_blank" rel="noopener noreferrer">
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
