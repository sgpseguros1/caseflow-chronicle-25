import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface EvolutionConfig {
  instanceUrl: string;
  apiKey: string;
  instanceName?: string;
}

interface ConnectionState {
  state: 'open' | 'close' | 'connecting';
  statusReason?: number;
}

interface QRCodeResponse {
  pairingCode?: string;
  code?: string;
  base64?: string;
  count?: number;
}

async function callEvolutionAPI(action: string, params?: any) {
  const { data, error } = await supabase.functions.invoke('whatsapp-evolution', {
    body: { action, ...params },
  });

  if (error) throw error;
  return data;
}

export function useEvolutionConfig() {
  return useQuery({
    queryKey: ['evolution-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('comunicacao_canais_config')
        .select('*')
        .eq('canal', 'whatsapp')
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });
}

export function useSaveEvolutionConfig() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (config: EvolutionConfig) => {
      const { data: existing } = await supabase
        .from('comunicacao_canais_config')
        .select('id')
        .eq('canal', 'whatsapp')
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('comunicacao_canais_config')
          .update({
            ativo: false,
            configuracao: {
              provider: 'evolution',
              instanceUrl: config.instanceUrl,
              apiKey: config.apiKey,
              instanceName: config.instanceName || 'juspro',
            },
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('comunicacao_canais_config')
          .insert({
            canal: 'whatsapp',
            nome_exibicao: 'WhatsApp',
            ativo: false,
            configuracao: {
              provider: 'evolution',
              instanceUrl: config.instanceUrl,
              apiKey: config.apiKey,
              instanceName: config.instanceName || 'juspro',
            },
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-config'] });
      toast({
        title: 'Configuração salva!',
        description: 'Agora você pode conectar seu WhatsApp.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao salvar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useCreateInstance() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (config: EvolutionConfig) => {
      return callEvolutionAPI('create-instance', config);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-connection'] });
    },
  });
}

export function useGetQRCode() {
  const [qrCode, setQRCode] = useState<QRCodeResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQRCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await callEvolutionAPI('get-qrcode');
      setQRCode(data);
      return data;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { qrCode, loading, error, fetchQRCode, setQRCode };
}

export function useCheckConnection() {
  return useQuery({
    queryKey: ['evolution-connection'],
    queryFn: async () => {
      const data = await callEvolutionAPI('check-connection');
      return data as ConnectionState;
    },
    refetchInterval: 5000, // Check every 5 seconds when active
    enabled: false, // Manual control
  });
}

export function useSendWhatsAppMessage() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ to, message, mediaUrl, mediaType }: { 
      to: string; 
      message: string; 
      mediaUrl?: string;
      mediaType?: string;
    }) => {
      return callEvolutionAPI('send-message', { to, message, mediaUrl, mediaType });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversas'] });
      toast({
        title: 'Mensagem enviada!',
        description: 'Mensagem enviada via WhatsApp com sucesso.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Erro ao enviar',
        description: error.message,
        variant: 'destructive',
      });
    },
  });
}

export function useListWhatsAppChats() {
  return useQuery({
    queryKey: ['whatsapp-chats'],
    queryFn: async () => {
      return callEvolutionAPI('list-chats');
    },
    enabled: false,
  });
}

export function useDisconnectWhatsApp() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async () => {
      return callEvolutionAPI('disconnect');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evolution-connection'] });
      queryClient.invalidateQueries({ queryKey: ['evolution-config'] });
      toast({
        title: 'Desconectado',
        description: 'WhatsApp desconectado com sucesso.',
      });
    },
  });
}
