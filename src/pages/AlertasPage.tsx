import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAlertas, useMarcarAlertaLido, useResolverAlerta } from '@/hooks/useAlertas';
import { Bell, Check, CheckCheck, Clock, AlertTriangle, FileText, Eye } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';

const TIPO_ICONS: Record<string, React.ReactNode> = {
  'processo_parado': <Clock className="h-4 w-4" />,
  'documento_pendente': <FileText className="h-4 w-4" />,
  'acesso_sem_acao': <Eye className="h-4 w-4" />,
  'processo_risco': <AlertTriangle className="h-4 w-4" />,
};

const TIPO_LABELS: Record<string, string> = {
  'processo_parado': 'Processo Parado',
  'documento_pendente': 'Documento Pendente',
  'acesso_sem_acao': 'Acesso sem Ação',
  'processo_risco': 'Processo em Risco',
};

const PRIORIDADE_COLORS: Record<string, string> = {
  'critica': 'destructive',
  'alta': 'default',
  'normal': 'secondary',
  'baixa': 'outline',
};

export default function AlertasPage() {
  const navigate = useNavigate();
  const { data: alertas, isLoading } = useAlertas();
  const marcarLido = useMarcarAlertaLido();
  const resolver = useResolverAlerta();
  const [tab, setTab] = useState('pendentes');

  const alertasFiltrados = alertas?.filter(a => {
    if (tab === 'pendentes') return a.status === 'pendente';
    if (tab === 'lidos') return a.status === 'lido';
    if (tab === 'resolvidos') return a.status === 'resolvido';
    return true;
  });

  const contadores = {
    pendentes: alertas?.filter(a => a.status === 'pendente').length || 0,
    lidos: alertas?.filter(a => a.status === 'lido').length || 0,
    resolvidos: alertas?.filter(a => a.status === 'resolvido').length || 0,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Bell className="h-8 w-8 text-primary" />
          Central de Alertas
        </h1>
        <p className="text-muted-foreground">Notificações automáticas do sistema</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="pendentes" className="gap-2">
            <AlertTriangle className="h-4 w-4" />
            Pendentes ({contadores.pendentes})
          </TabsTrigger>
          <TabsTrigger value="lidos" className="gap-2">
            <Check className="h-4 w-4" />
            Lidos ({contadores.lidos})
          </TabsTrigger>
          <TabsTrigger value="resolvidos" className="gap-2">
            <CheckCheck className="h-4 w-4" />
            Resolvidos ({contadores.resolvidos})
          </TabsTrigger>
          <TabsTrigger value="todos">Todos</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          <Card>
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-8 text-center text-muted-foreground">Carregando...</div>
              ) : alertasFiltrados?.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum alerta {tab !== 'todos' ? tab.slice(0, -1) : ''}</p>
                </div>
              ) : (
                <div className="divide-y">
                  {alertasFiltrados?.map((alerta) => (
                    <div 
                      key={alerta.id} 
                      className={`p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors ${
                        alerta.status === 'pendente' ? 'bg-destructive/5' : ''
                      }`}
                    >
                      <div className={`p-2 rounded-full ${
                        alerta.prioridade === 'critica' ? 'bg-red-100 text-red-600' :
                        alerta.prioridade === 'alta' ? 'bg-orange-100 text-orange-600' :
                        alerta.prioridade === 'normal' ? 'bg-blue-100 text-blue-600' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {TIPO_ICONS[alerta.tipo] || <Bell className="h-4 w-4" />}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium">{alerta.titulo}</h4>
                          <Badge variant={PRIORIDADE_COLORS[alerta.prioridade] as any}>
                            {alerta.prioridade}
                          </Badge>
                          <Badge variant="outline">
                            {TIPO_LABELS[alerta.tipo] || alerta.tipo}
                          </Badge>
                        </div>
                        {alerta.descricao && (
                          <p className="text-sm text-muted-foreground mb-2">{alerta.descricao}</p>
                        )}
                        {alerta.processos && (
                          <p className="text-xs text-muted-foreground">
                            Processo: {alerta.processos.numero || alerta.processos.titulo}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(parseISO(alerta.created_at), "dd 'de' MMMM 'às' HH:mm", { locale: ptBR })}
                        </p>
                      </div>

                      <div className="flex gap-2">
                        {alerta.status === 'pendente' && (
                          <>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => marcarLido.mutate(alerta.id)}
                              disabled={marcarLido.isPending}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm"
                              onClick={() => resolver.mutate(alerta.id)}
                              disabled={resolver.isPending}
                            >
                              Resolver
                            </Button>
                          </>
                        )}
                        {alerta.status === 'lido' && (
                          <Button 
                            size="sm"
                            onClick={() => resolver.mutate(alerta.id)}
                            disabled={resolver.isPending}
                          >
                            Resolver
                          </Button>
                        )}
                        {alerta.processo_id && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate('/processos')}
                          >
                            Ver Processo
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
