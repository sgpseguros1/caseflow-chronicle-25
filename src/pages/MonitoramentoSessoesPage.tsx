import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAllUserSessions, useUserSessionStats } from '@/hooks/useSessionTracking';
import { useAuth } from '@/hooks/useAuth';
import { format, formatDistanceStrict } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  Users, Clock, LogIn, LogOut, AlertTriangle, 
  Timer, TrendingUp, Shield, Eye, RefreshCw
} from 'lucide-react';
import { Navigate } from 'react-router-dom';

export default function MonitoramentoSessoesPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { data: sessions, isLoading, refetch } = useAllUserSessions();
  const { data: stats } = useUserSessionStats();
  const [activeTab, setActiveTab] = useState('visao-geral');

  // Somente admin pode acessar
  if (!authLoading && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  const formatDuration = (seconds: number | null) => {
    if (!seconds) return '-';
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) return `${hours}h ${mins}min`;
    return `${mins}min`;
  };

  const getLogoutReasonBadge = (reason: string | null) => {
    if (!reason) return <Badge variant="outline">Ativa</Badge>;
    switch (reason) {
      case 'manual': return <Badge className="bg-green-100 text-green-800">Manual</Badge>;
      case 'inactivity': return <Badge className="bg-orange-100 text-orange-800">Inatividade</Badge>;
      case 'session_expired': return <Badge className="bg-gray-100 text-gray-800">Expirada</Badge>;
      default: return <Badge variant="outline">{reason}</Badge>;
    }
  };

  // Stats calculadas
  const activeSessions = sessions?.filter(s => !s.logout_at) || [];
  const totalLogins = sessions?.length || 0;
  const logoutsByInactivity = sessions?.filter(s => s.logout_reason === 'inactivity').length || 0;
  const avgSessionTime = stats?.reduce((acc, s) => acc + s.avg_session_minutes, 0) / (stats?.length || 1) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="w-8 h-8 text-primary" />
            Monitoramento de Sessões
          </h1>
          <p className="text-muted-foreground">
            Acompanhe o tempo de login dos funcionários e atividade no sistema
          </p>
        </div>
        <Button onClick={() => refetch()} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Atualizar
        </Button>
      </div>

      {/* Alert */}
      <Alert className="bg-primary/10 border-primary">
        <Eye className="h-4 w-4" />
        <AlertTitle>Área Restrita</AlertTitle>
        <AlertDescription>
          Este painel é exclusivo para administradores. O logout automático ocorre após 60 minutos de inatividade.
        </AlertDescription>
      </Alert>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-green-100 dark:bg-green-900">
                <Users className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Sessões Ativas</p>
                <p className="text-2xl font-bold">{activeSessions.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900">
                <LogIn className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Logins no Mês</p>
                <p className="text-2xl font-bold">{totalLogins}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900">
                <AlertTriangle className="w-6 h-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Logouts Inatividade</p>
                <p className="text-2xl font-bold">{logoutsByInactivity}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900">
                <Timer className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tempo Médio/Sessão</p>
                <p className="text-2xl font-bold">{Math.round(avgSessionTime)}min</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="visao-geral">Visão por Usuário</TabsTrigger>
          <TabsTrigger value="sessoes-ativas">Sessões Ativas ({activeSessions.length})</TabsTrigger>
          <TabsTrigger value="historico">Histórico de Sessões</TabsTrigger>
        </TabsList>

        <TabsContent value="visao-geral" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Estatísticas por Funcionário
              </CardTitle>
              <CardDescription>
                Resumo de atividade de cada funcionário no mês atual
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!stats?.length ? (
                <p className="text-center text-muted-foreground py-8">Nenhuma sessão registrada ainda</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Funcionário</TableHead>
                      <TableHead className="text-center">Total Logins</TableHead>
                      <TableHead className="text-center">Tempo Total</TableHead>
                      <TableHead className="text-center">Média/Sessão</TableHead>
                      <TableHead className="text-center">Logouts Inatividade</TableHead>
                      <TableHead>Último Login</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.map((user) => (
                      <TableRow key={user.user_id}>
                        <TableCell>
                          <div>
                            <p className="font-medium">{user.nome}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-center font-medium">{user.total_logins}</TableCell>
                        <TableCell className="text-center">{formatDuration(user.total_seconds)}</TableCell>
                        <TableCell className="text-center">{user.avg_session_minutes}min</TableCell>
                        <TableCell className="text-center">
                          {user.logout_by_inactivity > 0 ? (
                            <Badge variant="destructive">{user.logout_by_inactivity}</Badge>
                          ) : (
                            <Badge variant="outline">0</Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {user.last_login ? format(new Date(user.last_login), "dd/MM HH:mm", { locale: ptBR }) : '-'}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessoes-ativas" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5 text-green-600" />
                Usuários Online Agora
              </CardTitle>
              <CardDescription>
                Sessões ativas em tempo real
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!activeSessions.length ? (
                <p className="text-center text-muted-foreground py-8">Nenhum usuário online no momento</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeSessions.map((session) => (
                    <Card key={session.id} className="border-green-200 bg-green-50/50 dark:bg-green-900/10">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                          <div className="flex-1">
                            <p className="font-medium">{session.profile?.name || 'Usuário'}</p>
                            <p className="text-xs text-muted-foreground">{session.profile?.email}</p>
                          </div>
                        </div>
                        <div className="mt-3 text-sm text-muted-foreground">
                          <p>
                            <Clock className="w-3 h-3 inline mr-1" />
                            Online há {formatDistanceStrict(new Date(session.login_at), new Date(), { locale: ptBR })}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <LogOut className="w-5 h-5" />
                Histórico de Sessões
              </CardTitle>
              <CardDescription>
                Últimas 500 sessões registradas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px]">
                {isLoading ? (
                  <p className="text-center py-8">Carregando...</p>
                ) : !sessions?.length ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma sessão registrada</p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Usuário</TableHead>
                        <TableHead>Login</TableHead>
                        <TableHead>Logout</TableHead>
                        <TableHead className="text-center">Duração</TableHead>
                        <TableHead>Motivo Saída</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sessions.map((session) => (
                        <TableRow key={session.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{session.profile?.name || 'Usuário'}</p>
                              <p className="text-xs text-muted-foreground">{session.profile?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(session.login_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                          </TableCell>
                          <TableCell>
                            {session.logout_at 
                              ? format(new Date(session.logout_at), "dd/MM/yyyy HH:mm", { locale: ptBR })
                              : <Badge className="bg-green-100 text-green-800">Ativa</Badge>
                            }
                          </TableCell>
                          <TableCell className="text-center">
                            {formatDuration(session.duration_seconds)}
                          </TableCell>
                          <TableCell>
                            {getLogoutReasonBadge(session.logout_reason)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
