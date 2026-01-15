import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bot, Loader2, Sparkles, Clock, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useIAAnalises, useCreateIAAnalise, ClienteContexto } from '@/hooks/useIAAnalise';

interface ClientIAAnaliseSectionProps {
  clienteId: string;
  cliente: ClienteContexto;
  observacaoAtual: string;
}

export function ClientIAAnaliseSection({ clienteId, cliente, observacaoAtual }: ClientIAAnaliseSectionProps) {
  const [expandedAnalise, setExpandedAnalise] = useState<string | null>(null);
  const { data: analises = [], isLoading } = useIAAnalises(clienteId);
  const createAnalise = useCreateIAAnalise();

  const handleGerarAnalise = async () => {
    if (!observacaoAtual.trim()) {
      return;
    }
    await createAnalise.mutateAsync({
      clienteId,
      textoObservacao: observacaoAtual,
      cliente
    });
  };

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            🤖 IA – Análise Inteligente
          </div>
          <Button
            onClick={handleGerarAnalise}
            disabled={createAnalise.isPending || !observacaoAtual.trim()}
            size="sm"
            className="gap-2"
          >
            {createAnalise.isPending ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analisando...
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                Gerar Análise
              </>
            )}
          </Button>
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          A IA analisa o cadastro completo do cliente + observações para identificar direitos e próximos passos
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : analises.length === 0 ? (
          <div className="text-center py-6 text-muted-foreground">
            <Bot className="h-10 w-10 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma análise gerada ainda</p>
            <p className="text-xs mt-1">Digite observações e clique em "Gerar Análise"</p>
          </div>
        ) : (
          <div className="space-y-3">
            {analises.map((analise) => (
              <Collapsible
                key={analise.id}
                open={expandedAnalise === analise.id}
                onOpenChange={(open) => setExpandedAnalise(open ? analise.id : null)}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center justify-between p-3 bg-background rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline" className="gap-1">
                        <Clock className="h-3 w-3" />
                        {format(parseISO(analise.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </Badge>
                      <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                        {analise.texto_observacao?.slice(0, 50)}...
                      </span>
                    </div>
                    {expandedAnalise === analise.id ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <Card className="mt-2 border-primary/30">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        📄 ANÁLISE AUTOMÁTICA DE DIREITOS E INDENIZAÇÕES
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-[400px] pr-4">
                        <div className="prose prose-sm max-w-none dark:prose-invert">
                          <div className="whitespace-pre-wrap text-sm leading-relaxed">
                            {analise.resultado_ia}
                          </div>
                        </div>
                      </ScrollArea>
                      <div className="mt-4 pt-3 border-t flex items-center justify-between text-xs text-muted-foreground">
                        <span>Modelo: {analise.modelo_utilizado}</span>
                        <span>Observação usada: "{analise.texto_observacao?.slice(0, 100)}..."</span>
                      </div>
                    </CardContent>
                  </Card>
                </CollapsibleContent>
              </Collapsible>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
