import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  MessageSquare, 
  Mail, 
  Phone, 
  Send, 
  FileText, 
  Clock, 
  Plus,
  Users,
  Zap
} from 'lucide-react';

export default function ComunicacaoPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('central');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            Central de Comunicação
          </h1>
          <p className="text-muted-foreground">Gerenciamento unificado de mensagens</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => navigate('/comunicacao/enviar')}>
            <Send className="mr-2 h-4 w-4" />
            Nova Mensagem
          </Button>
          <Button variant="outline" onClick={() => navigate('/comunicacao/massa')}>
            <Users className="mr-2 h-4 w-4" />
            Envio em Massa
          </Button>
        </div>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="central">Central</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="historico">Histórico</TabsTrigger>
          <TabsTrigger value="automacao">Automação</TabsTrigger>
        </TabsList>

        <TabsContent value="central" className="mt-6">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/comunicacao/enviar?canal=whatsapp')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-green-100">
                    <MessageSquare className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">WhatsApp</CardTitle>
                    <CardDescription>Mensagens diretas</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/comunicacao/enviar?canal=email')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-blue-100">
                    <Mail className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">E-mail</CardTitle>
                    <CardDescription>Comunicações formais</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/comunicacao/enviar?canal=sms')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-purple-100">
                    <Phone className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">SMS</CardTitle>
                    <CardDescription>Mensagens curtas</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>

            <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => navigate('/comunicacao/enviar?canal=interno')}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-full bg-amber-100">
                    <Zap className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Interno</CardTitle>
                    <CardDescription>Notificações internas</CardDescription>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>

          <div className="grid gap-6 mt-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="h-5 w-5" />
                  Mensagens Enviadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">Hoje</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Templates Ativos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">Configurados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Agendadas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">0</div>
                <p className="text-sm text-muted-foreground">Para envio</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="templates" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Templates de Mensagem</CardTitle>
                <CardDescription>Modelos pré-definidos para comunicação</CardDescription>
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

        <TabsContent value="historico" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Histórico de Comunicação</CardTitle>
              <CardDescription>Todas as mensagens enviadas</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Clock className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma mensagem enviada ainda</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="automacao" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Automações de Comunicação</CardTitle>
                <CardDescription>Mensagens automáticas baseadas em eventos</CardDescription>
              </div>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Automação
              </Button>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Zap className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhuma automação configurada</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
