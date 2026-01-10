import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bot, 
  MessageSquare, 
  TrendingUp, 
  DollarSign, 
  Send,
  Users,
  AlertTriangle,
  Loader2
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export default function IAModulePage() {
  const [tab, setTab] = useState('atendimento');
  const [message, setMessage] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async () => {
    if (!message.trim()) return;
    
    setIsLoading(true);
    setResponse('');
    
    try {
      const res = await supabase.functions.invoke('ai-assistant', {
        body: { 
          message: message,
          type: tab 
        }
      });
      
      if (res.error) {
        if (res.error.message?.includes('429')) {
          toast({ 
            title: 'Limite de requisições excedido', 
            description: 'Aguarde alguns segundos e tente novamente.',
            variant: 'destructive' 
          });
        } else if (res.error.message?.includes('402')) {
          toast({ 
            title: 'Créditos insuficientes', 
            description: 'Entre em contato com o administrador.',
            variant: 'destructive' 
          });
        } else {
          throw res.error;
        }
        return;
      }
      
      setResponse(res.data?.response || 'Sem resposta');
    } catch (error: any) {
      console.error('Erro ao chamar IA:', error);
      toast({ 
        title: 'Erro ao processar', 
        description: error.message,
        variant: 'destructive' 
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <Bot className="h-8 w-8 text-primary" />
          Módulo de IA
        </h1>
        <p className="text-muted-foreground">Assistentes inteligentes para o escritório</p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setTab('atendimento')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-blue-100">
                <MessageSquare className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Atendimento</CardTitle>
                <CardDescription>Respostas a clientes</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setTab('cobranca')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-green-100">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Cobrança</CardTitle>
                <CardDescription>Documentos pendentes</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setTab('producao')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-purple-100">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Produção</CardTitle>
                <CardDescription>Análise de produtividade</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        <Card className="cursor-pointer hover:border-primary transition-colors" onClick={() => setTab('financeiro')}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 rounded-full bg-amber-100">
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <CardTitle className="text-lg">Financeiro</CardTitle>
                <CardDescription>Previsões e alertas</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="atendimento">IA Atendimento</TabsTrigger>
          <TabsTrigger value="cobranca">IA Cobrança</TabsTrigger>
          <TabsTrigger value="producao">IA Produção</TabsTrigger>
          <TabsTrigger value="financeiro">IA Financeiro</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>
                {tab === 'atendimento' && 'Assistente de Atendimento'}
                {tab === 'cobranca' && 'Assistente de Cobrança'}
                {tab === 'producao' && 'Análise de Produtividade'}
                {tab === 'financeiro' && 'Análise Financeira'}
              </CardTitle>
              <CardDescription>
                {tab === 'atendimento' && 'Gere respostas para clientes baseadas no contexto do processo'}
                {tab === 'cobranca' && 'Crie mensagens de cobrança de documentos pendentes'}
                {tab === 'producao' && 'Analise a produtividade dos analistas e identifique gargalos'}
                {tab === 'financeiro' && 'Previsões de recebimento e alertas de pagamentos'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Textarea
                  placeholder={
                    tab === 'atendimento' ? 'Descreva a situação do cliente ou processo para gerar uma resposta...' :
                    tab === 'cobranca' ? 'Informe o documento pendente e dados do cliente...' :
                    tab === 'producao' ? 'Pergunte sobre produtividade, processos parados, ranking de analistas...' :
                    'Pergunte sobre previsões financeiras, pagamentos pendentes...'
                  }
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                />
              </div>
              <Button onClick={handleSendMessage} disabled={isLoading || !message.trim()}>
                {isLoading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Send className="mr-2 h-4 w-4" />
                )}
                {isLoading ? 'Processando...' : 'Enviar para IA'}
              </Button>

              {response && (
                <Card className="mt-4 bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Bot className="h-4 w-4" />
                      Resposta da IA
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="whitespace-pre-wrap text-sm">{response}</div>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
