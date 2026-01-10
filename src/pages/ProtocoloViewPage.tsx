import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle, Clock, User, Building2, Calendar, DollarSign, FileText, History, TrendingUp, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { 
  useProtocolo, 
  useProtocoloHistorico, 
  useProtocoloDocumentos, 
  useProtocoloFinanceiro,
  useProtocoloAlertas,
  useProtocoloAuxilioAcidente,
} from '@/hooks/useProtocolos';
import { ProtocoloStatusBadge } from '@/components/protocolos/ProtocoloStatusBadge';
import { ProtocoloTipoBadge } from '@/components/protocolos/ProtocoloTipoBadge';
import { ProtocoloEtiquetas } from '@/components/protocolos/ProtocoloEtiquetas';
import { 
  TIPO_PROTOCOLO_LABELS, 
  NATUREZA_LABELS, 
  STATUS_DOCUMENTO_LABELS, 
  STATUS_DOCUMENTO_COLORS,
  TIPO_BENEFICIO_LABELS,
  PRIORIDADE_LABELS,
} from '@/types/protocolo';
import { cn } from '@/lib/utils';

export default function ProtocoloViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: protocolo, isLoading } = useProtocolo(id);
  const { data: historico = [] } = useProtocoloHistorico(id);
  const { data: documentos = [] } = useProtocoloDocumentos(id);
  const { data: financeiro } = useProtocoloFinanceiro(id);
  const { data: alertas = [] } = useProtocoloAlertas(id);
  const { data: auxilioAcidente } = useProtocoloAuxilioAcidente(id);

  const formatCurrency = (value: number | null | undefined) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value || 0);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!protocolo) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Protocolo não encontrado</p>
        <Button className="mt-4" onClick={() => navigate('/protocolos')}>
          Voltar para Protocolos
        </Button>
      </div>
    );
  }

  // Cálculos do dashboard
  const diasTotal = Math.floor((Date.now() - new Date(protocolo.data_protocolo).getTime()) / (1000 * 60 * 60 * 24));
  const slaProgress = protocolo.sla_dias ? Math.min((diasTotal / protocolo.sla_dias) * 100, 100) : 0;
  const docsExigidos = documentos.length;
  const docsValidados = documentos.filter(d => d.status === 'validado').length;
  const docsPendentes = documentos.filter(d => d.status !== 'validado').length;
  const alertasAtivos = alertas.filter(a => a.status === 'ativo');

  // Determinar risco
  const getRisco = () => {
    if (protocolo.dias_parado && protocolo.dias_parado >= 60) return { label: 'Crítico', color: 'bg-red-500' };
    if (protocolo.dias_parado && protocolo.dias_parado >= 45) return { label: 'Atenção', color: 'bg-orange-500' };
    if (protocolo.dias_parado && protocolo.dias_parado >= 30) return { label: 'Monitorar', color: 'bg-yellow-500' };
    return { label: 'Normal', color: 'bg-green-500' };
  };
  const risco = getRisco();

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/protocolos')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <span className="font-mono font-bold text-xl">#{protocolo.codigo}</span>
              <ProtocoloTipoBadge tipo={protocolo.tipo} />
              <ProtocoloStatusBadge status={protocolo.status} />
            </div>
            <p className="text-muted-foreground flex items-center gap-2">
              <User className="h-4 w-4" />
              {protocolo.cliente?.name || 'Cliente não informado'}
            </p>
          </div>
        </div>
        
        {/* Botão para editar via Cliente */}
        {protocolo.cliente_id && (
          <Button onClick={() => navigate(`/clientes/${protocolo.cliente_id}?tab=protocolos`)}>
            Editar via Cliente
          </Button>
        )}
      </div>

      {/* Alertas Banner */}
      {alertasAtivos.length > 0 && (
        <Card className="border-destructive bg-destructive/10">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2 text-destructive mb-2">
              <AlertTriangle className="h-5 w-5" />
              <span className="font-semibold">{alertasAtivos.length} alerta(s) ativo(s)</span>
            </div>
            <div className="space-y-2">
              {alertasAtivos.slice(0, 3).map((alerta) => (
                <div key={alerta.id} className="flex items-center justify-between bg-background rounded-lg p-2">
                  <div>
                    <p className="font-medium text-sm">{alerta.titulo}</p>
                    <p className="text-xs text-muted-foreground">{alerta.descricao}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabs - Dashboard é a primeira aba */}
      <Tabs defaultValue="dashboard" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="dashboard" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="historico" className="gap-2">
            <History className="h-4 w-4" />
            Histórico
          </TabsTrigger>
          <TabsTrigger value="documentos" className="gap-2">
            <FileText className="h-4 w-4" />
            Documentos
          </TabsTrigger>
          <TabsTrigger value="financeiro" className="gap-2">
            <DollarSign className="h-4 w-4" />
            Financeiro
          </TabsTrigger>
        </TabsList>

        {/* ABA 1 - Dashboard do Protocolo (SOMENTE LEITURA) */}
        <TabsContent value="dashboard" className="space-y-4">
          {/* Cards Principais */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Tipo */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Tipo do Protocolo</CardTitle>
              </CardHeader>
              <CardContent>
                <ProtocoloTipoBadge tipo={protocolo.tipo} className="text-sm" />
              </CardContent>
            </Card>

            {/* Natureza */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Natureza</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge variant={protocolo.natureza === 'JUDICIAL' ? 'destructive' : 'secondary'}>
                  {NATUREZA_LABELS[protocolo.natureza]}
                </Badge>
              </CardContent>
            </Card>

            {/* Status */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Status Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <ProtocoloStatusBadge status={protocolo.status} />
              </CardContent>
            </Card>

            {/* Dias Parado */}
            <Card className={cn(protocolo.dias_parado && protocolo.dias_parado >= 45 && 'border-destructive')}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Dias Parado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className={cn(
                  "text-2xl font-bold",
                  protocolo.dias_parado && protocolo.dias_parado >= 60 && 'text-destructive',
                  protocolo.dias_parado && protocolo.dias_parado >= 45 && protocolo.dias_parado < 60 && 'text-orange-500',
                )}>
                  {protocolo.dias_parado || 0} dias
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Segunda linha de cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* Responsável */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Responsável Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="font-medium">{protocolo.funcionario?.nome || 'Não definido'}</p>
              </CardContent>
            </Card>

            {/* Risco */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Risco Atual</CardTitle>
              </CardHeader>
              <CardContent>
                <Badge className={cn('text-white border-0', risco.color)}>
                  {risco.label}
                </Badge>
              </CardContent>
            </Card>

            {/* Valor Estimado */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Valor Estimado
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold text-green-600">
                  {formatCurrency(financeiro?.valor_estimado)}
                </p>
              </CardContent>
            </Card>

            {/* Valor Recebido */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <DollarSign className="h-4 w-4" />
                  Valor Recebido
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xl font-bold">
                  {formatCurrency(financeiro?.valor_recebido)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Info Geral + SLA */}
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Data do Protocolo</span>
                  <span className="font-medium">{format(new Date(protocolo.data_protocolo), 'dd/MM/yyyy', { locale: ptBR })}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Última Movimentação</span>
                  <span className="font-medium">
                    {protocolo.data_ultima_movimentacao 
                      ? format(new Date(protocolo.data_ultima_movimentacao), 'dd/MM/yyyy', { locale: ptBR })
                      : '-'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Prioridade</span>
                  <span className="font-medium">{PRIORIDADE_LABELS[protocolo.prioridade]}</span>
                </div>
                {protocolo.seguradora && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Seguradora</span>
                    <span className="font-medium">{protocolo.seguradora.razao_social}</span>
                  </div>
                )}
                {protocolo.advogado && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Advogado</span>
                    <span className="font-medium">{protocolo.advogado.nome}</span>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">SLA e Tempo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-sm text-muted-foreground">Progresso do SLA</span>
                    <span className="text-sm font-medium">{diasTotal} / {protocolo.sla_dias || 30} dias</span>
                  </div>
                  <Progress value={slaProgress} className={cn(slaProgress >= 100 && '[&>div]:bg-destructive')} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{diasTotal}</p>
                    <p className="text-xs text-muted-foreground">Dias Total</p>
                  </div>
                  <div className="text-center p-3 bg-muted rounded-lg">
                    <p className="text-2xl font-bold">{protocolo.dias_parado || 0}</p>
                    <p className="text-xs text-muted-foreground">Dias Parado</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Documentos Resumo */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Documentos</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{docsExigidos}</p>
                  <p className="text-sm text-muted-foreground">Exigidos</p>
                </div>
                <div className="p-4 bg-green-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">{docsValidados}</p>
                  <p className="text-sm text-muted-foreground">Validados</p>
                </div>
                <div className="p-4 bg-orange-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">{docsPendentes}</p>
                  <p className="text-sm text-muted-foreground">Pendentes</p>
                </div>
              </div>
              {docsExigidos > 0 && (
                <div className="mt-4">
                  <Progress value={(docsValidados / docsExigidos) * 100} />
                  <p className="text-sm text-muted-foreground mt-1 text-center">
                    {Math.round((docsValidados / docsExigidos) * 100)}% completo
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Etiquetas */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Etiquetas</CardTitle>
            </CardHeader>
            <CardContent>
              <ProtocoloEtiquetas 
                etiquetas={protocolo.etiquetas || []} 
                diasParado={protocolo.dias_parado}
              />
            </CardContent>
          </Card>

          {/* Dados específicos Auxílio-Acidente */}
          {protocolo.tipo === 'AUXILIO_ACIDENTE' && auxilioAcidente && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Dados do Auxílio-Acidente (INSS)</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <div>
                  <span className="text-sm text-muted-foreground">Data do Acidente</span>
                  <p className="font-medium">
                    {auxilioAcidente.data_acidente 
                      ? format(new Date(auxilioAcidente.data_acidente), 'dd/MM/yyyy', { locale: ptBR })
                      : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Nº Protocolo INSS</span>
                  <p className="font-medium">{auxilioAcidente.numero_protocolo_inss || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Tipo de Benefício</span>
                  <p className="font-medium">
                    {auxilioAcidente.tipo_beneficio 
                      ? TIPO_BENEFICIO_LABELS[auxilioAcidente.tipo_beneficio]
                      : '-'}
                  </p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Situação Atual</span>
                  <p className="font-medium">{auxilioAcidente.situacao_atual || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Perícia Realizada</span>
                  <p className="font-medium">{auxilioAcidente.pericia_realizada ? 'Sim' : 'Não'}</p>
                </div>
                {auxilioAcidente.pericia_realizada && (
                  <>
                    <div>
                      <span className="text-sm text-muted-foreground">Data da Perícia</span>
                      <p className="font-medium">
                        {auxilioAcidente.data_pericia 
                          ? format(new Date(auxilioAcidente.data_pericia), 'dd/MM/yyyy', { locale: ptBR })
                          : '-'}
                      </p>
                    </div>
                    <div>
                      <span className="text-sm text-muted-foreground">Resultado da Perícia</span>
                      <p className="font-medium">{auxilioAcidente.resultado_pericia || '-'}</p>
                    </div>
                  </>
                )}
                <div>
                  <span className="text-sm text-muted-foreground">Judicializado</span>
                  <p className="font-medium">{auxilioAcidente.judicializado ? 'Sim' : 'Não'}</p>
                </div>
                {auxilioAcidente.judicializado && (
                  <div>
                    <span className="text-sm text-muted-foreground">Nº Processo Judicial</span>
                    <p className="font-medium">{auxilioAcidente.numero_processo_judicial || '-'}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Observações */}
          {protocolo.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="whitespace-pre-wrap">{protocolo.observacoes}</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ABA 2 - Histórico (SOMENTE LEITURA) */}
        <TabsContent value="historico" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <History className="h-5 w-5 text-primary" />
                Histórico de Movimentações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {historico.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhuma movimentação registrada</p>
              ) : (
                <div className="space-y-4">
                  {historico.map((item) => (
                    <div key={item.id} className="border-l-2 border-primary pl-4 pb-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">Campo: {item.campo_alterado}</p>
                          <p className="text-sm text-muted-foreground">
                            <span className="text-red-500 line-through">{item.valor_anterior || '(vazio)'}</span>
                            {' → '}
                            <span className="text-green-500">{item.valor_novo || '(vazio)'}</span>
                          </p>
                          <p className="text-sm mt-1">{item.observacao}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 3 - Documentos (VISUAL + STATUS) */}
        <TabsContent value="documentos" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileText className="h-5 w-5 text-primary" />
                Documentos ({documentos.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {documentos.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">Nenhum documento cadastrado</p>
              ) : (
                <div className="space-y-3">
                  {documentos.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <div>
                          <p className="font-medium">{doc.nome}</p>
                          <p className="text-xs text-muted-foreground">
                            {doc.categoria} 
                            {doc.obrigatorio && <span className="text-destructive ml-2">• Obrigatório</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={cn('text-white border-0', STATUS_DOCUMENTO_COLORS[doc.status])}>
                          {STATUS_DOCUMENTO_LABELS[doc.status]}
                        </Badge>
                        {doc.validado_em && (
                          <span className="text-xs text-muted-foreground">
                            Validado em {format(new Date(doc.validado_em), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Aviso de edição via cliente */}
              <div className="mt-4 p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Upload e validação de documentos devem ser feitos pela aba do cliente
                </p>
                {protocolo.cliente_id && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate(`/clientes/${protocolo.cliente_id}?tab=protocolos`)}
                  >
                    Ir para Cliente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ABA 4 - Financeiro (VISUAL) */}
        <TabsContent value="financeiro" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="h-5 w-5 text-primary" />
                Dados Financeiros
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!financeiro ? (
                <p className="text-muted-foreground text-center py-8">Nenhum dado financeiro cadastrado</p>
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor Estimado</p>
                    <p className="text-2xl font-bold text-green-600">{formatCurrency(financeiro.valor_estimado)}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor Recebido</p>
                    <p className="text-2xl font-bold">{formatCurrency(financeiro.valor_recebido)}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Valor a Receber</p>
                    <p className="text-2xl font-bold text-blue-600">{formatCurrency(financeiro.valor_a_receber)}</p>
                  </div>
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm text-muted-foreground">Honorários Calculados</p>
                    <p className="text-2xl font-bold">{formatCurrency(financeiro.honorarios_calculados)}</p>
                  </div>
                  {financeiro.comissao_interna > 0 && (
                    <div className="p-4 bg-muted rounded-lg">
                      <p className="text-sm text-muted-foreground">Comissão Interna</p>
                      <p className="text-xl font-bold">{formatCurrency(financeiro.comissao_interna)}</p>
                    </div>
                  )}
                  {financeiro.prejuizo_registrado > 0 && (
                    <div className="p-4 bg-red-500/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Prejuízo Registrado</p>
                      <p className="text-xl font-bold text-red-600">{formatCurrency(financeiro.prejuizo_registrado)}</p>
                      {financeiro.motivo_prejuizo && (
                        <p className="text-sm mt-1">{financeiro.motivo_prejuizo}</p>
                      )}
                    </div>
                  )}
                  {financeiro.data_pagamento && (
                    <div className="p-4 bg-green-500/10 rounded-lg">
                      <p className="text-sm text-muted-foreground">Data do Pagamento</p>
                      <p className="text-xl font-bold">
                        {format(new Date(financeiro.data_pagamento), 'dd/MM/yyyy', { locale: ptBR })}
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Aviso de edição via cliente */}
              <div className="mt-4 p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Edição de dados financeiros deve ser feita pela aba do cliente
                </p>
                {protocolo.cliente_id && (
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="mt-2"
                    onClick={() => navigate(`/clientes/${protocolo.cliente_id}?tab=protocolos`)}
                  >
                    Ir para Cliente
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
