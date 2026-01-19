import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { 
  UserCog, 
  Play, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Clock,
  History,
  Settings,
  Bell,
  ExternalLink
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Link } from 'react-router-dom';
import { 
  useExecutarAtribuicaoAutomatica,
  useAtribuicaoLogs,
  useAlertasCriticosResponsavel
} from '@/hooks/useAtribuicaoAutomatica';
import { TIPO_PROTOCOLO_LABELS } from '@/types/protocolo';

export default function AtribuicaoAutomaticaPanel() {
  const [enviarAlerta, setEnviarAlerta] = useState(true);
  const [diasCritico, setDiasCritico] = useState([30]);
  const [showConfig, setShowConfig] = useState(false);

  const { mutate: executar, isPending: executando } = useExecutarAtribuicaoAutomatica();
  const { data: logs, isLoading: loadingLogs } = useAtribuicaoLogs(10);
  const { data: alertasCriticos, isLoading: loadingAlertas } = useAlertasCriticosResponsavel();

  const handleExecutar = () => {
    executar({
      enviar_alerta: enviarAlerta,
      dias_critico: diasCritico[0],
    });
  };

  const getPrioridadeCor = (prioridade: string) => {
    switch (prioridade) {
      case 'critica': return 'bg-black text-white';
      case 'alta': return 'bg-red-600 text-white';
      case 'normal': return 'bg-orange-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      {/* Painel de Controle */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <UserCog className="h-5 w-5 text-primary" />
              Atribuição Automática de Responsável
            </CardTitle>
            <div className="flex gap-2">
              <Dialog open={showConfig} onOpenChange={setShowConfig}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-1" />
                    Configurar
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Configurações de Atribuição Automática</DialogTitle>
                    <DialogDescription>
                      Ajuste os parâmetros para a execução da atribuição automática
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 py-4">
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <Label htmlFor="enviar-alerta">Enviar Alertas</Label>
                        <p className="text-xs text-muted-foreground">
                          Notificar responsáveis sobre protocolos críticos
                        </p>
                      </div>
                      <Switch
                        id="enviar-alerta"
                        checked={enviarAlerta}
                        onCheckedChange={setEnviarAlerta}
                      />
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <Label>Dias para Alerta Crítico</Label>
                        <span className="text-sm font-medium">{diasCritico[0]} dias</span>
                      </div>
                      <Slider
                        value={diasCritico}
                        onValueChange={setDiasCritico}
                        min={15}
                        max={90}
                        step={5}
                      />
                      <p className="text-xs text-muted-foreground">
                        Protocolos parados há mais de {diasCritico[0]} dias geram alerta crítico
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
              
              <Button 
                onClick={handleExecutar} 
                disabled={executando}
                className="gap-2"
              >
                {executando ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Executar Agora
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Detecta protocolos sem responsável e atribui automaticamente o último usuário que interagiu.
            Alertas críticos são enviados para responsáveis de protocolos em risco.
          </p>
        </CardContent>
      </Card>

      {/* Alertas Críticos Pendentes */}
      <Card className="border-red-200 dark:border-red-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <Bell className="h-5 w-5" />
            Alertas Críticos Pendentes ({alertasCriticos?.length || 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingAlertas ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : alertasCriticos && alertasCriticos.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Prioridade</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Responsável</TableHead>
                  <TableHead>Criado em</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {alertasCriticos.map(alerta => (
                  <TableRow key={alerta.id} className="hover:bg-muted/50">
                    <TableCell>
                      <Badge className={getPrioridadeCor(alerta.prioridade)}>
                        {alerta.prioridade.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {alerta.atribuicao_automatica ? 'Atribuição Auto' : 'Sem Responsável'}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {alerta.protocolo ? (
                        <span>
                          #{alerta.protocolo.codigo} - {TIPO_PROTOCOLO_LABELS[alerta.protocolo.tipo as keyof typeof TIPO_PROTOCOLO_LABELS] || alerta.protocolo.tipo}
                        </span>
                      ) : 'N/A'}
                    </TableCell>
                    <TableCell>
                      {alerta.protocolo?.cliente?.name || 'N/A'}
                    </TableCell>
                    <TableCell>
                      {alerta.funcionario?.nome || (
                        <span className="text-red-500 flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Não atribuído
                        </span>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(parseISO(alerta.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      {alerta.protocolo_id && (
                        <Button variant="ghost" size="sm" asChild>
                          <Link to={`/protocolos/${alerta.protocolo_id}`}>
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50 text-green-500" />
              <p>Nenhum alerta crítico pendente</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Histórico de Atribuições */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Histórico de Atribuições Automáticas
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loadingLogs ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : logs && logs.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data/Hora</TableHead>
                  <TableHead>Protocolo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Responsável Atribuído</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map(log => (
                  <TableRow key={log.id}>
                    <TableCell className="text-muted-foreground whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      #{log.protocolo?.codigo || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {TIPO_PROTOCOLO_LABELS[log.protocolo?.tipo as keyof typeof TIPO_PROTOCOLO_LABELS] || log.protocolo?.tipo || 'N/A'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        {log.responsavel_novo?.nome || 'N/A'}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                      {log.motivo}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma atribuição automática registrada</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
