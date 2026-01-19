import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageCircle, Phone, Key, Building2, AlertCircle, ExternalLink, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WhatsAppConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const PROVIDERS = [
  { id: 'twilio', name: 'Twilio', description: 'Provedor robusto com API completa', url: 'https://www.twilio.com/whatsapp' },
  { id: '360dialog', name: '360Dialog', description: 'Integração direta com Meta', url: 'https://www.360dialog.com/' },
  { id: 'messagebird', name: 'MessageBird', description: 'Múltiplos canais integrados', url: 'https://messagebird.com/whatsapp' },
  { id: 'gupshup', name: 'Gupshup', description: 'Popular na América Latina', url: 'https://www.gupshup.io/' },
  { id: 'evolution', name: 'Evolution API', description: 'Solução open-source (QR Code)', url: 'https://doc.evolution-api.com/' },
];

export function WhatsAppConfigDialog({ open, onOpenChange }: WhatsAppConfigDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [provider, setProvider] = useState('');
  const [config, setConfig] = useState({
    apiKey: '',
    phoneNumberId: '',
    businessAccountId: '',
    webhookUrl: '',
    instanceUrl: '',
  });

  const handleSave = async () => {
    if (!provider) {
      toast({
        title: 'Selecione um provedor',
        description: 'Escolha o provedor de WhatsApp Business API que você utiliza.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      // Check if whatsapp config exists
      const { data: existing } = await supabase
        .from('comunicacao_canais_config')
        .select('id')
        .eq('canal', 'whatsapp')
        .maybeSingle();

      if (existing) {
        // Update existing
        const { error } = await supabase
          .from('comunicacao_canais_config')
          .update({
            ativo: true,
            configuracao: {
              provider,
              ...config,
            },
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        // Insert new
        const { error } = await supabase
          .from('comunicacao_canais_config')
          .insert({
            canal: 'whatsapp',
            nome_exibicao: 'WhatsApp',
            ativo: true,
            configuracao: {
              provider,
              ...config,
            },
          });

        if (error) throw error;
      }

      toast({
        title: 'Configuração salva!',
        description: 'WhatsApp Business API configurado com sucesso.',
      });
      onOpenChange(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Configurar WhatsApp Business API
          </DialogTitle>
          <DialogDescription>
            Conecte sua conta do WhatsApp Business para enviar e receber mensagens diretamente pela plataforma.
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="setup" className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="setup">Configuração</TabsTrigger>
            <TabsTrigger value="providers">Provedores</TabsTrigger>
          </TabsList>

          <TabsContent value="setup" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Provedor de API</Label>
                <Select value={provider} onValueChange={setProvider}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o provedor..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PROVIDERS.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        <div className="flex items-center gap-2">
                          <span>{p.name}</span>
                          <span className="text-xs text-muted-foreground">- {p.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {provider && (
                <>
                  {provider === 'evolution' ? (
                    // Evolution API - QR Code based
                    <Card className="border-primary/20 bg-primary/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2">
                          <QrCode className="h-4 w-4" />
                          Evolution API (QR Code)
                        </CardTitle>
                        <CardDescription className="text-xs">
                          Conexão via QR Code - Similar ao WhatsApp Web
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="instanceUrl">URL da Instância</Label>
                          <Input
                            id="instanceUrl"
                            placeholder="https://sua-instancia.evolution-api.com"
                            value={config.instanceUrl}
                            onChange={(e) => setConfig({ ...config, instanceUrl: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="apiKey">API Key da Instância</Label>
                          <Input
                            id="apiKey"
                            type="password"
                            placeholder="Sua API Key..."
                            value={config.apiKey}
                            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  ) : (
                    // Official Business API providers
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm">Credenciais da API</CardTitle>
                        <CardDescription className="text-xs">
                          Insira as credenciais fornecidas pelo seu provedor
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="space-y-2">
                          <Label htmlFor="apiKey" className="flex items-center gap-2">
                            <Key className="h-3 w-3" />
                            API Key / Token de Acesso
                          </Label>
                          <Input
                            id="apiKey"
                            type="password"
                            placeholder="Sua API Key..."
                            value={config.apiKey}
                            onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumberId" className="flex items-center gap-2">
                            <Phone className="h-3 w-3" />
                            Phone Number ID
                          </Label>
                          <Input
                            id="phoneNumberId"
                            placeholder="Ex: 123456789012345"
                            value={config.phoneNumberId}
                            onChange={(e) => setConfig({ ...config, phoneNumberId: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="businessAccountId" className="flex items-center gap-2">
                            <Building2 className="h-3 w-3" />
                            Business Account ID
                          </Label>
                          <Input
                            id="businessAccountId"
                            placeholder="Ex: 123456789012345"
                            value={config.businessAccountId}
                            onChange={(e) => setConfig({ ...config, businessAccountId: e.target.value })}
                          />
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Card className="border-accent/20 bg-accent/5">
                    <CardContent className="pt-4">
                      <div className="flex items-start gap-3">
                        <AlertCircle className="h-5 w-5 text-accent-foreground shrink-0 mt-0.5" />
                        <div className="space-y-1">
                          <p className="text-sm font-medium">Webhook URL</p>
                          <p className="text-xs text-muted-foreground">
                            Configure este URL no painel do seu provedor para receber mensagens:
                          </p>
                          <code className="text-xs bg-muted px-2 py-1 rounded block mt-2 break-all">
                            {window.location.origin}/api/webhooks/whatsapp
                          </code>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="providers" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Para usar o WhatsApp Business API, você precisa de uma conta em um dos provedores oficiais:
            </p>
            {PROVIDERS.map((p) => (
              <Card key={p.id} className="hover:border-primary/50 transition-colors">
                <CardContent className="pt-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <MessageCircle className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.description}</p>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <a href={p.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                        Acessar
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card className="border-warning/20 bg-warning/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium">Importante</p>
                    <p className="text-muted-foreground text-xs mt-1">
                      A API oficial do WhatsApp Business requer aprovação da Meta. O processo pode levar alguns dias.
                      A Evolution API é uma alternativa open-source que funciona via QR Code.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={loading || !provider}>
            {loading ? 'Salvando...' : 'Salvar Configuração'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
