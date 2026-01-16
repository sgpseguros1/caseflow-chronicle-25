import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Collapsible, 
  CollapsibleContent, 
  CollapsibleTrigger 
} from '@/components/ui/collapsible';
import { 
  ChevronDown, 
  ChevronUp, 
  Brain, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  Gavel,
  FileText,
  Calendar,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { format, parseISO, formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAnalisarAndamentoIA } from '@/hooks/useProcessoIA';

interface AndamentoProps {
  andamento: {
    id: string;
    processo_id: string;
    data_andamento: string;
    descricao: string;
    complemento?: string | null;
    codigo_movimento?: number | null;
    tipo?: string | null;
    destaque?: boolean | null;
    lido?: boolean | null;
  };
  iaAnalise?: {
    categoria_andamento?: string | null;
    gera_prazo?: boolean | null;
    prazo_dias_uteis?: number | null;
    prazo_data_final?: string | null;
    quem_deve_agir?: string | null;
    acao_exigida?: string | null;
    tipo_peca_provavel?: string | null;
  } | null;
  isLast?: boolean;
}

const TIPO_ICONS: Record<string, any> = {
  decisao: Gavel,
  despacho: FileText,
  audiencia: Calendar,
  sentenca: Gavel,
  intimacao: AlertTriangle,
  default: FileText,
};

const CATEGORIA_COLORS: Record<string, string> = {
  'prazo_contestar': 'bg-red-500',
  'prazo_replica': 'bg-orange-500',
  'prazo_manifestacao': 'bg-yellow-500',
  'audiencia_designada': 'bg-purple-500',
  'concluso_decisao': 'bg-blue-500',
  'sentenca_proferida': 'bg-green-600',
  'aguardando_parte': 'bg-gray-500',
  'arquivamento': 'bg-gray-400',
  'pagamento': 'bg-emerald-500',
};

export function AndamentoTeorCompleto({ andamento, iaAnalise, isLast = false }: AndamentoProps) {
  const [isOpen, setIsOpen] = useState(false);
  const analisarIA = useAnalisarAndamentoIA();
  
  const IconComponent = TIPO_ICONS[andamento.tipo || 'default'] || TIPO_ICONS.default;
  const hasTeorCompleto = !!andamento.complemento;
  const hasIaAnalise = !!iaAnalise;

  const handleAnalisarAndamento = () => {
    analisarIA.mutate({ andamento });
  };

  return (
    <div className={`relative pl-6 pb-4 ${!isLast ? 'border-l-2 border-muted' : ''}`}>
      {/* Timeline dot */}
      <div className={`absolute left-[-5px] top-0 w-3 h-3 rounded-full ${
        andamento.destaque ? 'bg-red-500' : 
        iaAnalise?.gera_prazo ? 'bg-orange-500' : 
        'bg-primary'
      }`} />
      
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card className={`transition-all ${
          andamento.destaque ? 'border-red-500/50 bg-red-500/5' :
          iaAnalise?.gera_prazo ? 'border-orange-500/50 bg-orange-500/5' :
          'border-muted'
        }`}>
          <CardContent className="p-4">
            {/* Header do Andamento */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <IconComponent className="h-4 w-4 text-muted-foreground" />
                  <Badge variant="outline" className="text-xs">
                    {format(parseISO(andamento.data_andamento), "dd/MM/yyyy", { locale: ptBR })}
                  </Badge>
                  {andamento.destaque && (
                    <Badge variant="destructive" className="text-xs">Destaque</Badge>
                  )}
                  {iaAnalise?.gera_prazo && (
                    <Badge className="bg-orange-500 text-xs">⏰ Prazo</Badge>
                  )}
                  {andamento.codigo_movimento && (
                    <span className="text-xs text-muted-foreground">
                      Cód: {andamento.codigo_movimento}
                    </span>
                  )}
                </div>
                
                {/* Descrição principal */}
                <p className="text-sm font-medium">{andamento.descricao}</p>
                
                {/* Preview do complemento */}
                {hasTeorCompleto && !isOpen && (
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {andamento.complemento}
                  </p>
                )}
                
                {/* Análise IA resumida */}
                {hasIaAnalise && !isOpen && (
                  <div className="flex items-center gap-2 mt-2">
                    <Brain className="h-3 w-3 text-primary" />
                    <span className="text-xs text-primary">
                      {iaAnalise.categoria_andamento?.replace(/_/g, ' ') || 'Analisado'}
                      {iaAnalise.quem_deve_agir && ` • ${iaAnalise.quem_deve_agir}`}
                    </span>
                  </div>
                )}
              </div>
              
              {/* Botão expandir */}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="shrink-0">
                  {isOpen ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <>
                      <ChevronDown className="h-4 w-4" />
                      <span className="text-xs ml-1">
                        {hasTeorCompleto ? 'Ver teor' : 'Detalhes'}
                      </span>
                    </>
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
            
            {/* Conteúdo Expandido */}
            <CollapsibleContent className="mt-4 space-y-4">
              {/* Teor Completo da Decisão */}
              {hasTeorCompleto && (
                <div className="p-4 bg-muted/50 rounded-lg border">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      TEOR COMPLETO DA DECISÃO
                    </span>
                  </div>
                  <p className="text-sm whitespace-pre-wrap">{andamento.complemento}</p>
                </div>
              )}
              
              {/* Análise da IA */}
              {hasIaAnalise ? (
                <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="h-4 w-4 text-primary" />
                    <span className="text-xs font-medium text-primary">
                      🧠 ANÁLISE INTELIGENTE
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Categoria</p>
                      <Badge className={CATEGORIA_COLORS[iaAnalise.categoria_andamento || ''] || 'bg-gray-500'}>
                        {iaAnalise.categoria_andamento?.replace(/_/g, ' ') || 'N/A'}
                      </Badge>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Gera Prazo?</p>
                      <div className="flex items-center gap-1">
                        {iaAnalise.gera_prazo ? (
                          <>
                            <AlertTriangle className="h-4 w-4 text-orange-500" />
                            <span className="font-medium text-orange-500">SIM</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span className="text-green-500">NÃO</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {iaAnalise.gera_prazo && (
                    <div className="p-3 bg-orange-500/10 rounded border border-orange-500/30 mb-3">
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <p className="text-xs text-orange-400">Prazo (dias úteis)</p>
                          <p className="font-bold text-orange-500">{iaAnalise.prazo_dias_uteis || 0}</p>
                        </div>
                        <div>
                          <p className="text-xs text-orange-400">Data Final</p>
                          <p className="font-bold text-orange-500">
                            {iaAnalise.prazo_data_final 
                              ? format(parseISO(iaAnalise.prazo_data_final), "dd/MM/yyyy")
                              : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-orange-400">Quem deve agir</p>
                          <p className="font-medium text-orange-500">{iaAnalise.quem_deve_agir || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {iaAnalise.acao_exigida && (
                    <div className="p-2 bg-background rounded border">
                      <p className="text-xs text-muted-foreground">Ação Exigida</p>
                      <p className="text-sm font-medium">{iaAnalise.acao_exigida}</p>
                    </div>
                  )}
                  
                  {iaAnalise.tipo_peca_provavel && (
                    <div className="mt-2">
                      <p className="text-xs text-muted-foreground">Peça Provável</p>
                      <Badge variant="outline">{iaAnalise.tipo_peca_provavel}</Badge>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-muted/30 rounded-lg border border-dashed text-center">
                  <Brain className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground mb-3">
                    Este andamento ainda não foi analisado pela IA
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleAnalisarAndamento}
                    disabled={analisarIA.isPending}
                  >
                    {analisarIA.isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Analisando...
                      </>
                    ) : (
                      <>
                        <Brain className="h-4 w-4 mr-2" />
                        Analisar com IA
                      </>
                    )}
                  </Button>
                </div>
              )}
              
              {/* Metadados */}
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>
                  <Clock className="h-3 w-3 inline mr-1" />
                  {formatDistanceToNow(parseISO(andamento.data_andamento), { addSuffix: true, locale: ptBR })}
                </span>
                {andamento.tipo && (
                  <Badge variant="secondary" className="text-xs">
                    {andamento.tipo}
                  </Badge>
                )}
              </div>
            </CollapsibleContent>
          </CardContent>
        </Card>
      </Collapsible>
    </div>
  );
}
