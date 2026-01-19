import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Send, 
  FileText, 
  Clock, 
  Plus,
  Users,
  Zap,
  Settings,
  Inbox,
  BarChart3,
  PhoneCall,
  Facebook,
  Instagram,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { CaixaEntradaUnificada } from '@/components/comunicacao/CaixaEntradaUnificada';
import { WhatsAppConfigDialog } from '@/components/comunicacao/WhatsAppConfigDialog';
import { useComunicacaoStats, useCanaisConfig } from '@/hooks/useComunicacaoCentral';
import { useComunicacaoRegistros } from '@/hooks/useComunicacaoRegistros';

const CANAL_CONFIG: Record<string, { icon: React.ReactNode; color: string; bg: string; label: string }> = {
  whatsapp: { icon: <MessageSquare className="h-5 w-5" />, color: 'text-primary', bg: 'bg-primary/10', label: 'WhatsApp' },
  email: { icon: <Mail className="h-5 w-5" />, color: 'text-blue-600', bg: 'bg-blue-100', label: 'E-mail' },
  sms: { icon: <Phone className="h-5 w-5" />, color: 'text-purple-600', bg: 'bg-purple-100', label: 'SMS' },
  interno: { icon: <Zap className="h-5 w-5" />, color: 'text-amber-600', bg: 'bg-amber-100', label: 'Chat Interno' },
  telefone: { icon: <PhoneCall className="h-5 w-5" />, color: 'text-orange-600', bg: 'bg-orange-100', label: 'Telefone' },
  facebook: { icon: <Facebook className="h-5 w-5" />, color: 'text-blue-700', bg: 'bg-blue-50', label: 'Facebook' },
  instagram: { icon: <Instagram className="h-5 w-5" />, color: 'text-pink-600', bg: 'bg-pink-100', label: 'Instagram' },
};

export default function ComunicacaoPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('inbox');
  const [whatsappDialogOpen, setWhatsappDialogOpen] = useState(false);
  const { data: stats } = useComunicacaoStats();
  const { data: canais = [] } = useCanaisConfig();
  const { data: historico = [] } = useComunicacaoRegistros();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            Central de Comunicação
          </h1>
          <p className="text-muted-foreground">Gerenciamento unificado de mensagens multicanal</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/comunicacao/massa')}>
            <Users className="mr-2 h-4 w-4" />
            Envio em Massa
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Inbox className="h-4 w-4 text-primary" />
              Conversas Abertas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.abertas || 0}</div>
            <p className="text-xs text-muted-foreground">Aguardando atendimento</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-blue-600" />
              Em Atendimento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.emAtendimento || 0}</div>
            <p className="text-xs text-muted-foreground">Sendo respondidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Send className="h-4 w-4 text-green-600" />
              Mensagens Hoje
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.mensagensHoje || 0}</div>
            <p className="text-xs text-muted-foreground">Enviadas e recebidas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-600" />
              Não Lidas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats?.naoLidas || 0}</div>
            <p className="text-xs text-muted-foreground">Precisam de atenção</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="inbox" className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            Caixa de Entrada
            {(stats?.naoLidas || 0) > 0 && (
              <Badge variant="destructive" className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                {stats?.naoLidas}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="templates" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Templates
          </TabsTrigger>
          <TabsTrigger value="historico" className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="relatorios" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="canais" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Canais
          </TabsTrigger>
        </TabsList>

        {/* Caixa de Entrada - Interface Principal */}
        <TabsContent value="inbox" className="mt-6">
          <CaixaEntradaUnificada />
        </TabsContent>

        {/* Templates */}
        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Templates de Mensagem</CardTitle>
                <CardDescription>Modelos pré-definidos para comunicação rápida</CardDescription>
              </div>
              <Button onClick={() => navigate('/comunicacao/templates/novo')}>
                <Plus className="mr-2 h-4 w-4" />
                Novo Template
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum template cadastrado</p>
                <Button variant="link" onClick={() => navigate('/comunicacao/templates/novo')}>
                  Criar primeiro template
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Histórico */}
        <TabsContent value="historico" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Comunicação</CardTitle>
              <CardDescription>Todas as mensagens enviadas e recebidas</CardDescription>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma mensagem registrada ainda</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {historico.slice(0, 20).map((msg) => {
                    const canalConfig = CANAL_CONFIG[msg.canal] || CANAL_CONFIG.interno;
                    return (
                      <div key={msg.id} className="flex items-center gap-3 p-3 border rounded-lg">
                        <div className={`p-2 rounded-full ${canalConfig.bg} ${canalConfig.color}`}>
                          {canalConfig.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {msg.cliente?.name || 'Sem cliente'}
                            </span>
                            <Badge variant="outline" className="text-xs">
                              {msg.direcao === 'saida' ? 'Enviado' : 'Recebido'}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground truncate">{msg.conteudo}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {new Date(msg.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Relatórios */}
        <TabsContent value="relatorios" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Mensagens por Canal</CardTitle>
                <CardDescription>Distribuição do mês atual</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(stats?.porCanal || {}).map(([canal, count]) => {
                    const config = CANAL_CONFIG[canal] || CANAL_CONFIG.interno;
                    return (
                      <div key={canal} className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-full ${config.bg} ${config.color}`}>
                            {config.icon}
                          </div>
                          <span>{config.label}</span>
                        </div>
                        <Badge variant="secondary">{count}</Badge>
                      </div>
                    );
                  })}
                  {Object.keys(stats?.porCanal || {}).length === 0 && (
                    <p className="text-center text-muted-foreground py-8">
                      Sem dados de comunicação este mês
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Resumo do Mês</CardTitle>
                <CardDescription>Métricas gerais de comunicação</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span>Total de Conversas</span>
                    <span className="font-bold text-xl">{stats?.total || 0}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span>Conversas Resolvidas</span>
                    <span className="font-bold text-xl text-green-600">
                      {(stats?.total || 0) - (stats?.abertas || 0) - (stats?.emAtendimento || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <span>Taxa de Resolução</span>
                    <span className="font-bold text-xl">
                      {stats?.total ? Math.round((((stats.total - stats.abertas - stats.emAtendimento) / stats.total) * 100)) : 0}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Configuração de Canais */}
        <TabsContent value="canais" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configuração de Canais</CardTitle>
              <CardDescription>
                Gerencie os canais de comunicação disponíveis. 
                Integrações com APIs externas serão configuradas aqui.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {canais.map((canal) => {
                  const config = CANAL_CONFIG[canal.canal] || CANAL_CONFIG.interno;
                  return (
                    <div key={canal.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-full ${config.bg} ${config.color}`}>
                          {config.icon}
                        </div>
                        <div>
                          <h4 className="font-medium">{canal.nome_exibicao}</h4>
                          <p className="text-sm text-muted-foreground">
                            {canal.ativo ? 'Canal ativo' : 'Canal desativado'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        {canal.ativo ? (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Ativo
                          </Badge>
                        ) : (
                          <Badge variant="secondary">
                            Desativado
                          </Badge>
                        )}
                        <Switch checked={canal.ativo} disabled />
                      </div>
                    </div>
                  );
                })}

                <div className="mt-6 p-4 bg-muted/50 rounded-lg">
                  <h4 className="font-medium mb-2">🔗 Integrações Externas</h4>
                  <p className="text-sm text-muted-foreground mb-4">
                    Para conectar APIs externas (WhatsApp Business, Facebook, Instagram), 
                    configure as credenciais do provedor.
                  </p>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => setWhatsappDialogOpen(true)}>
                      <MessageSquare className="mr-2 h-4 w-4" />
                      Configurar WhatsApp Business API
                    </Button>
                    <Button variant="outline" size="sm" disabled>
                      <Facebook className="mr-2 h-4 w-4" />
                      Conectar Facebook/Instagram
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    * Facebook/Instagram em breve
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* WhatsApp Config Dialog */}
      <WhatsAppConfigDialog 
        open={whatsappDialogOpen} 
        onOpenChange={setWhatsappDialogOpen} 
      />
    </div>
  );
}
