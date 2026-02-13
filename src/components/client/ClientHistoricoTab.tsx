import { useClientHistorico } from '@/hooks/useClientHistorico';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, History, FileText, ClipboardList, AlertTriangle, Settings, Shield, FolderOpen, UserCheck } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const categoriaConfig: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  dados_cliente: { label: 'Dados do Cliente', icon: <UserCheck className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-700 border-blue-200' },
  documento: { label: 'Documento', icon: <FileText className="h-4 w-4" />, color: 'bg-green-500/10 text-green-700 border-green-200' },
  protocolo: { label: 'Protocolo', icon: <ClipboardList className="h-4 w-4" />, color: 'bg-purple-500/10 text-purple-700 border-purple-200' },
  alerta: { label: 'Alerta', icon: <AlertTriangle className="h-4 w-4" />, color: 'bg-yellow-500/10 text-yellow-700 border-yellow-200' },
  workflow: { label: 'Workflow', icon: <Settings className="h-4 w-4" />, color: 'bg-orange-500/10 text-orange-700 border-orange-200' },
  bau: { label: 'BAU', icon: <FolderOpen className="h-4 w-4" />, color: 'bg-teal-500/10 text-teal-700 border-teal-200' },
  checklist_ia: { label: 'Checklist IA', icon: <Shield className="h-4 w-4" />, color: 'bg-indigo-500/10 text-indigo-700 border-indigo-200' },
  seguradora: { label: 'Seguradora', icon: <Shield className="h-4 w-4" />, color: 'bg-pink-500/10 text-pink-700 border-pink-200' },
  geral: { label: 'Geral', icon: <History className="h-4 w-4" />, color: 'bg-gray-500/10 text-gray-700 border-gray-200' },
};

const acaoLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  criacao: { label: 'Criação', variant: 'default' },
  alteracao: { label: 'Alteração', variant: 'secondary' },
  exclusao: { label: 'Exclusão', variant: 'destructive' },
};

interface Props {
  clientId: string;
}

export function ClientHistoricoTab({ clientId }: Props) {
  const { data: historico = [], isLoading } = useClientHistorico(clientId);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (historico.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <History className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Nenhum histórico registrado ainda.</p>
          <p className="text-sm text-muted-foreground mt-1">As alterações feitas neste cliente aparecerão aqui automaticamente.</p>
        </CardContent>
      </Card>
    );
  }

  // Group by date
  const grouped = historico.reduce<Record<string, typeof historico>>((acc, item) => {
    const dateKey = format(new Date(item.created_at), 'yyyy-MM-dd');
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <History className="h-5 w-5 text-primary" />
          Histórico Completo ({historico.length} registros)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[600px] pr-4">
          <div className="space-y-6">
            {Object.entries(grouped).map(([dateKey, items]) => (
              <div key={dateKey}>
                <div className="sticky top-0 z-10 bg-background py-2">
                  <h3 className="text-sm font-semibold text-muted-foreground border-b pb-2">
                    {format(new Date(dateKey), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                  </h3>
                </div>
                <div className="space-y-3 mt-3">
                  {items.map((item) => {
                    const catConfig = categoriaConfig[item.categoria] || categoriaConfig.geral;
                    const acaoConfig = acaoLabels[item.acao] || { label: item.acao, variant: 'outline' as const };

                    return (
                      <div key={item.id} className="flex gap-3 p-3 rounded-lg border bg-card hover:bg-accent/30 transition-colors">
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${catConfig.color}`}>
                          {catConfig.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge variant={acaoConfig.variant} className="text-xs">
                              {acaoConfig.label}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {catConfig.label}
                            </Badge>
                            <span className="text-xs text-muted-foreground ml-auto">
                              {format(new Date(item.created_at), "HH:mm:ss", { locale: ptBR })}
                            </span>
                          </div>
                          <p className="text-sm font-medium mt-1">{item.descricao}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            por {item.usuario_nome || 'Sistema'}
                          </p>
                          
                          {/* Show old/new values for changes */}
                          {item.dados_anteriores && item.dados_novos && (
                            <div className="mt-2 text-xs space-y-1 bg-muted/50 rounded p-2">
                              {Object.keys(item.dados_novos).map((key) => (
                                <div key={key} className="flex gap-2">
                                  <span className="text-muted-foreground">{key}:</span>
                                  <span className="line-through text-destructive">{String(item.dados_anteriores?.[key] ?? '-')}</span>
                                  <span>→</span>
                                  <span className="text-green-600 font-medium">{String(item.dados_novos?.[key] ?? '-')}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
