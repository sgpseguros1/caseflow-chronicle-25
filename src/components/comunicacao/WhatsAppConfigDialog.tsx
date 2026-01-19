import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Phone, Key, AlertCircle, ExternalLink, QrCode, CheckCircle, Loader2, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { 
  useEvolutionConfig, 
  useSaveEvolutionConfig, 
  useGetQRCode, 
  useCheckConnection,
  useDisconnectWhatsApp 
} from '@/hooks/useEvolutionAPI';

interface WhatsAppConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WhatsAppConfigDialog({ open, onOpenChange }: WhatsAppConfigDialogProps) {
  const [step, setStep] = useState<'config' | 'connect'>('config');
  const [config, setConfig] = useState({
    instanceUrl: '',
    apiKey: '',
    instanceName: 'juspro',
  });

  const { data: savedConfig, isLoading: loadingConfig } = useEvolutionConfig();
  const saveConfig = useSaveEvolutionConfig();
  const { qrCode, loading: loadingQR, error: qrError, fetchQRCode, setQRCode } = useGetQRCode();
  const { data: connectionState, refetch: checkConnection, isFetching: checkingConnection } = useCheckConnection();
  const disconnectMutation = useDisconnectWhatsApp();

  // Load saved config
  useEffect(() => {
    if (savedConfig?.configuracao) {
      const cfg = savedConfig.configuracao as any;
      setConfig({
        instanceUrl: cfg.instanceUrl || '',
        apiKey: cfg.apiKey || '',
        instanceName: cfg.instanceName || 'juspro',
      });
      // If already configured, go to connect step
      if (cfg.instanceUrl && cfg.apiKey) {
        setStep('connect');
      }
    }
  }, [savedConfig]);

  // Poll connection status when on connect step
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'connect' && config.instanceUrl && config.apiKey) {
      checkConnection();
      interval = setInterval(() => {
        checkConnection();
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [step, config.instanceUrl, config.apiKey]);

  const handleSaveConfig = async () => {
    if (!config.instanceUrl || !config.apiKey) return;
    await saveConfig.mutateAsync(config);
    setStep('connect');
  };

  const handleGetQRCode = async () => {
    await fetchQRCode();
  };

  const isConnected = connectionState?.state === 'open';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5 text-primary" />
            Configurar WhatsApp (Evolution API)
          </DialogTitle>
          <DialogDescription>
            Conecte seu WhatsApp escaneando o QR Code - igual ao WhatsApp Web!
          </DialogDescription>
        </DialogHeader>

        <Tabs value={step} onValueChange={(v) => setStep(v as 'config' | 'connect')} className="mt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="config">1. Configuração</TabsTrigger>
            <TabsTrigger value="connect" disabled={!config.instanceUrl || !config.apiKey}>
              2. Conectar
            </TabsTrigger>
          </TabsList>

          <TabsContent value="config" className="space-y-4 mt-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Evolution API</CardTitle>
                <CardDescription className="text-sm">
                  Insira os dados da sua instância Evolution API. 
                  <a 
                    href="https://doc.evolution-api.com/v2/pt/get-started/introduction" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline ml-1 inline-flex items-center gap-1"
                  >
                    Ver documentação <ExternalLink className="h-3 w-3" />
                  </a>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="instanceUrl" className="flex items-center gap-2">
                    <Phone className="h-3 w-3" />
                    URL da Instância *
                  </Label>
                  <Input
                    id="instanceUrl"
                    placeholder="https://sua-evolution-api.com"
                    value={config.instanceUrl}
                    onChange={(e) => setConfig({ ...config, instanceUrl: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    URL base da sua Evolution API
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiKey" className="flex items-center gap-2">
                    <Key className="h-3 w-3" />
                    API Key *
                  </Label>
                  <Input
                    id="apiKey"
                    type="password"
                    placeholder="Sua Global API Key..."
                    value={config.apiKey}
                    onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instanceName">Nome da Instância</Label>
                  <Input
                    id="instanceName"
                    placeholder="juspro"
                    value={config.instanceName}
                    onChange={(e) => setConfig({ ...config, instanceName: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Nome único para identificar esta conexão
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-primary/20 bg-primary/5">
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <div className="text-sm space-y-2">
                    <p className="font-medium">Não tem uma Evolution API?</p>
                    <p className="text-muted-foreground text-xs">
                      Você pode usar um serviço hospedado ou instalar sua própria instância:
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://evolution-api.com/" target="_blank" rel="noopener noreferrer">
                          Evolution Cloud (Hospedado)
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <a href="https://doc.evolution-api.com/v2/pt/get-started/install-with-docker" target="_blank" rel="noopener noreferrer">
                          Instalar com Docker
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Button 
              onClick={handleSaveConfig} 
              disabled={!config.instanceUrl || !config.apiKey || saveConfig.isPending}
              className="w-full"
            >
              {saveConfig.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                'Salvar e Continuar'
              )}
            </Button>
          </TabsContent>

          <TabsContent value="connect" className="space-y-4 mt-4">
            {/* Connection Status */}
            <Card className={isConnected ? 'border-green-500/50 bg-green-500/5' : ''}>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {isConnected ? (
                      <Wifi className="h-6 w-6 text-green-500" />
                    ) : (
                      <WifiOff className="h-6 w-6 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-medium">
                        {isConnected ? 'WhatsApp Conectado!' : 'WhatsApp Desconectado'}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {isConnected 
                          ? 'Pronto para enviar e receber mensagens' 
                          : 'Escaneie o QR Code para conectar'}
                      </p>
                    </div>
                  </div>
                  <Badge variant={isConnected ? 'default' : 'secondary'}>
                    {checkingConnection ? (
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                    ) : isConnected ? (
                      <CheckCircle className="h-3 w-3 mr-1" />
                    ) : null}
                    {connectionState?.state || 'verificando...'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {!isConnected && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    QR Code
                  </CardTitle>
                  <CardDescription>
                    Escaneie com seu WhatsApp: Configurações → Aparelhos Conectados → Conectar Aparelho
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                  {qrCode?.base64 ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-white rounded-lg">
                        <img 
                          src={qrCode.base64} 
                          alt="QR Code WhatsApp" 
                          className="w-64 h-64"
                        />
                      </div>
                      {qrCode.pairingCode && (
                        <div className="text-center">
                          <p className="text-sm text-muted-foreground">Código de pareamento:</p>
                          <p className="text-2xl font-mono font-bold tracking-widest">
                            {qrCode.pairingCode}
                          </p>
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        onClick={handleGetQRCode}
                        disabled={loadingQR}
                      >
                        <RefreshCw className={`mr-2 h-4 w-4 ${loadingQR ? 'animate-spin' : ''}`} />
                        Atualizar QR Code
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-8 space-y-4">
                      {qrError ? (
                        <div className="text-destructive">
                          <AlertCircle className="h-12 w-12 mx-auto mb-2" />
                          <p className="font-medium">Erro ao obter QR Code</p>
                          <p className="text-sm text-muted-foreground">{qrError}</p>
                        </div>
                      ) : (
                        <QrCode className="h-24 w-24 mx-auto text-muted-foreground/30" />
                      )}
                      <Button onClick={handleGetQRCode} disabled={loadingQR}>
                        {loadingQR ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Gerando...
                          </>
                        ) : (
                          <>
                            <QrCode className="mr-2 h-4 w-4" />
                            Gerar QR Code
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {isConnected && (
              <div className="flex justify-center">
                <Button 
                  variant="destructive" 
                  onClick={() => disconnectMutation.mutate()}
                  disabled={disconnectMutation.isPending}
                >
                  {disconnectMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <WifiOff className="mr-2 h-4 w-4" />
                  )}
                  Desconectar WhatsApp
                </Button>
              </div>
            )}

            <Button 
              variant="outline" 
              onClick={() => setStep('config')}
              className="w-full"
            >
              Voltar para Configuração
            </Button>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
