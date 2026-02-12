import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, Clock, AlertTriangle, FileText, Stethoscope, Building2, Scale, Banknote, RefreshCw } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useRecalcularWorkflow } from '@/hooks/useRecalcularWorkflow';
import { Button } from '@/components/ui/button';

interface ClientWorkflowSectionProps {
  clientId: string;
}

interface WorkflowData {
  id: string;
  client_id: string;
  cliente_cadastrado: boolean;
  checklist_ia_status: string | null;
  bau_acionado: boolean;
  bau_status: string | null;
  bo_status: string | null;
  bo_numero: string | null;
  laudo_status: string | null;
  laudo_medico: string | null;
  protocolo_status: string | null;
  pericia_liberada: boolean;
  financeiro_liberado: boolean;
  juridico_liberado: boolean;
  created_at: string;
  updated_at: string;
}

const WORKFLOW_STEPS = [
  { key: 'cliente', label: 'Cliente Cadastrado', icon: CheckCircle2, field: 'cliente_cadastrado' },
  { key: 'checklist', label: 'Checklist IA', icon: FileText, field: 'checklist_ia_status' },
  { key: 'bau', label: 'BAU Hospitalar', icon: Building2, field: 'bau_status' },
  { key: 'bo', label: 'Boletim de Ocorrência', icon: FileText, field: 'bo_status' },
  { key: 'laudo', label: 'Laudo Médico', icon: Stethoscope, field: 'laudo_status' },
  { key: 'protocolo', label: 'Protocolo', icon: FileText, field: 'protocolo_status' },
  { key: 'pericia', label: 'Perícia', icon: Stethoscope, field: 'pericia_liberada' },
  { key: 'financeiro', label: 'Financeiro', icon: Banknote, field: 'financeiro_liberado' },
  { key: 'juridico', label: 'Jurídico', icon: Scale, field: 'juridico_liberado' },
];

const STATUS_COLORS: Record<string, string> = {
  pendente: 'bg-gray-100 text-gray-700 border-gray-300',
  em_andamento: 'bg-blue-100 text-blue-700 border-blue-300',
  concluido: 'bg-green-100 text-green-700 border-green-300',
  incompleto: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  erro: 'bg-red-100 text-red-700 border-red-300',
};

function getStepStatus(workflow: WorkflowData | null, step: typeof WORKFLOW_STEPS[0]): 'pendente' | 'em_andamento' | 'concluido' | 'incompleto' {
  if (!workflow) return 'pendente';
  
  const value = (workflow as any)[step.field];
  
  if (typeof value === 'boolean') {
    return value ? 'concluido' : 'pendente';
  }
  
  if (typeof value === 'string') {
    if (['concluido', 'recebido', 'validado', 'aprovado'].includes(value)) return 'concluido';
    if (['em_andamento', 'em_analise', 'solicitado', 'em_preenchimento'].includes(value)) return 'em_andamento';
    if (['incompleto', 'pendente_documento'].includes(value)) return 'incompleto';
  }
  
  return 'pendente';
}

function getStepIcon(status: string) {
  switch (status) {
    case 'concluido':
      return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    case 'em_andamento':
      return <Clock className="h-5 w-5 text-blue-600 animate-pulse" />;
    case 'incompleto':
      return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
    default:
      return <Circle className="h-5 w-5 text-gray-400" />;
  }
}

export function ClientWorkflowSection({ clientId }: ClientWorkflowSectionProps) {
  const { recalcular } = useRecalcularWorkflow();

  // Auto-recalculate on mount to sync with real data
  useEffect(() => {
    if (clientId) {
      recalcular(clientId);
    }
  }, [clientId, recalcular]);

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['client-workflow', clientId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('client_workflow')
        .select('*')
        .eq('client_id', clientId)
        .maybeSingle();
      
      if (error) throw error;
      return data as WorkflowData | null;
    },
    enabled: !!clientId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-10 bg-muted rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  // Calculate progress
  const completedSteps = WORKFLOW_STEPS.filter(step => 
    getStepStatus(workflow, step) === 'concluido'
  ).length;
  const progress = Math.round((completedSteps / WORKFLOW_STEPS.length) * 100);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            Workflow de Triagem
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => recalcular(clientId)}
              title="Recalcular status"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Badge variant="outline" className="text-sm">
              {progress}% concluído
            </Badge>
          </div>
        </div>
        {/* Progress bar */}
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mt-2">
          <div 
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-2">
        {WORKFLOW_STEPS.map((step, index) => {
          const status = getStepStatus(workflow, step);
          const Icon = step.icon;
          const isLast = index === WORKFLOW_STEPS.length - 1;
          
          return (
            <div key={step.key} className="relative">
              <div className={`flex items-center gap-3 p-3 rounded-lg border ${STATUS_COLORS[status]}`}>
                <div className="flex-shrink-0">
                  {getStepIcon(status)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm">{step.label}</p>
                  {workflow && (step.key === 'bo' && workflow.bo_numero) && (
                    <p className="text-xs opacity-75">Nº: {workflow.bo_numero}</p>
                  )}
                  {workflow && (step.key === 'laudo' && workflow.laudo_medico) && (
                    <p className="text-xs opacity-75">Dr. {workflow.laudo_medico}</p>
                  )}
                </div>
                <Badge 
                  variant="secondary" 
                  className={`text-xs ${
                    status === 'concluido' ? 'bg-green-500 text-white' :
                    status === 'em_andamento' ? 'bg-blue-500 text-white' :
                    status === 'incompleto' ? 'bg-yellow-500 text-white' :
                    'bg-gray-200 text-gray-600'
                  }`}
                >
                  {status === 'concluido' ? 'Concluído' :
                   status === 'em_andamento' ? 'Em Andamento' :
                   status === 'incompleto' ? 'Incompleto' : 'Pendente'}
                </Badge>
              </div>
              
              {/* Connector line */}
              {!isLast && (
                <div className="absolute left-6 top-full w-0.5 h-2 bg-border" />
              )}
            </div>
          );
        })}
        
        {workflow?.updated_at && (
          <p className="text-xs text-muted-foreground text-center pt-2">
            Última atualização: {format(parseISO(workflow.updated_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
