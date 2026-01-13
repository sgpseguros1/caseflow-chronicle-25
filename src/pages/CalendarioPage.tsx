import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar as CalendarIcon, Clock, User, MapPin, ChevronLeft, ChevronRight } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';

interface Evento {
  id: string;
  titulo: string;
  tipo: 'pericia' | 'protocolo' | 'prazo' | 'agenda';
  data: string;
  hora?: string;
  local?: string;
  cliente_nome?: string;
  cliente_id?: string;
  protocolo_id?: string;
  cor: string;
}

function useEventosCalendario(mes: Date) {
  return useQuery({
    queryKey: ['eventos-calendario', format(mes, 'yyyy-MM')],
    queryFn: async () => {
      const inicio = startOfMonth(mes).toISOString();
      const fim = endOfMonth(mes).toISOString();

      // Buscar perícias agendadas
      const { data: pericias } = await supabase
        .from('agenda')
        .select(`
          id, titulo, data_evento, descricao, tipo, status,
          processo:processos(id, titulo, cliente:clients(id, name))
        `)
        .eq('tipo', 'pericia')
        .gte('data_evento', inicio)
        .lte('data_evento', fim);

      // Buscar prazos de protocolos
      const { data: protocolos } = await supabase
        .from('protocolos')
        .select(`
          id, codigo, prazo_estimado, tipo, status,
          cliente:clients(id, name)
        `)
        .not('prazo_estimado', 'is', null)
        .gte('prazo_estimado', inicio)
        .lte('prazo_estimado', fim);

      // Buscar eventos da agenda
      const { data: agenda } = await supabase
        .from('agenda')
        .select(`
          id, titulo, data_evento, descricao, tipo, status
        `)
        .neq('tipo', 'pericia')
        .gte('data_evento', inicio)
        .lte('data_evento', fim);

      const eventos: Evento[] = [];

      // Converter perícias em eventos
      pericias?.forEach((p: any) => {
        eventos.push({
          id: `pericia-${p.id}`,
          titulo: p.titulo || 'Perícia',
          tipo: 'pericia',
          data: p.data_evento,
          hora: format(new Date(p.data_evento), 'HH:mm'),
          local: p.descricao,
          cliente_nome: p.processo?.cliente?.name,
          cliente_id: p.processo?.cliente?.id,
          protocolo_id: p.processo?.id,
          cor: 'bg-purple-500',
        });
      });

      // Converter prazos em eventos
      protocolos?.forEach((p: any) => {
        eventos.push({
          id: `prazo-${p.id}`,
          titulo: `Prazo #${p.codigo} - ${p.tipo}`,
          tipo: 'prazo',
          data: p.prazo_estimado!,
          cliente_nome: p.cliente?.name,
          cliente_id: p.cliente?.id,
          protocolo_id: p.id,
          cor: 'bg-orange-500',
        });
      });

      // Converter agenda em eventos
      agenda?.forEach((a: any) => {
        eventos.push({
          id: `agenda-${a.id}`,
          titulo: a.titulo,
          tipo: 'agenda',
          data: a.data_evento,
          hora: format(new Date(a.data_evento), 'HH:mm'),
          cor: 'bg-blue-500',
        });
      });

      return eventos;
    },
  });
}

export default function CalendarioPage() {
  const [mesSelecionado, setMesSelecionado] = useState(new Date());
  const [diaSelecionado, setDiaSelecionado] = useState<Date | null>(new Date());

  const { data: eventos = [], isLoading } = useEventosCalendario(mesSelecionado);

  const diasDoMes = useMemo(() => {
    const inicio = startOfMonth(mesSelecionado);
    const fim = endOfMonth(mesSelecionado);
    return eachDayOfInterval({ start: inicio, end: fim });
  }, [mesSelecionado]);

  const eventosDodia = useMemo(() => {
    if (!diaSelecionado) return [];
    return eventos.filter(e => isSameDay(new Date(e.data), diaSelecionado));
  }, [diaSelecionado, eventos]);

  const getEventosDoDia = (dia: Date) => {
    return eventos.filter(e => isSameDay(new Date(e.data), dia));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
          <CalendarIcon className="h-8 w-8 text-primary" />
          Calendário
        </h1>
        <p className="text-muted-foreground">Perícias, prazos e eventos importantes</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Calendário */}
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{format(mesSelecionado, 'MMMM yyyy', { locale: ptBR })}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setMesSelecionado(subMonths(mesSelecionado, 1))}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="icon" onClick={() => setMesSelecionado(addMonths(mesSelecionado, 1))}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dia => (
                <div key={dia} className="text-center text-sm font-medium text-muted-foreground py-2">
                  {dia}
                </div>
              ))}
              
              {/* Espaços vazios para o início do mês */}
              {Array.from({ length: diasDoMes[0].getDay() }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              
              {diasDoMes.map(dia => {
                const eventosHoje = getEventosDoDia(dia);
                const isHoje = isSameDay(dia, new Date());
                const isSelecionado = diaSelecionado && isSameDay(dia, diaSelecionado);
                
                return (
                  <button
                    key={dia.toISOString()}
                    onClick={() => setDiaSelecionado(dia)}
                    className={cn(
                      'aspect-square p-1 rounded-lg relative hover:bg-muted transition-colors',
                      isHoje && 'ring-2 ring-primary',
                      isSelecionado && 'bg-primary/10'
                    )}
                  >
                    <span className={cn(
                      'text-sm',
                      !isSameMonth(dia, mesSelecionado) && 'text-muted-foreground'
                    )}>
                      {format(dia, 'd')}
                    </span>
                    {eventosHoje.length > 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                        {eventosHoje.slice(0, 3).map((e, i) => (
                          <div key={i} className={cn('w-1.5 h-1.5 rounded-full', e.cor)} />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="flex flex-wrap gap-4 mt-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-purple-500" />
                <span>Perícias</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-orange-500" />
                <span>Prazos</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Agenda</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Eventos do dia */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {diaSelecionado 
                ? format(diaSelecionado, "dd 'de' MMMM", { locale: ptBR })
                : 'Selecione um dia'
              }
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Carregando...</div>
            ) : eventosDodia.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Nenhum evento neste dia</p>
              </div>
            ) : (
              <div className="space-y-3">
                {eventosDodia.map(evento => (
                  <div 
                    key={evento.id} 
                    className={cn(
                      'p-3 rounded-lg border-l-4',
                      evento.tipo === 'pericia' && 'border-l-purple-500 bg-purple-50 dark:bg-purple-950/20',
                      evento.tipo === 'prazo' && 'border-l-orange-500 bg-orange-50 dark:bg-orange-950/20',
                      evento.tipo === 'agenda' && 'border-l-blue-500 bg-blue-50 dark:bg-blue-950/20'
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{evento.titulo}</p>
                        {evento.cliente_nome && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <User className="h-3 w-3" />
                            {evento.cliente_id ? (
                              <Link to={`/clientes/${evento.cliente_id}`} className="hover:underline text-primary">
                                {evento.cliente_nome}
                              </Link>
                            ) : (
                              <span>{evento.cliente_nome}</span>
                            )}
                          </div>
                        )}
                        {evento.hora && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{evento.hora}</span>
                          </div>
                        )}
                        {evento.local && (
                          <div className="flex items-center gap-1 mt-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            <span>{evento.local}</span>
                          </div>
                        )}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {evento.tipo === 'pericia' && 'Perícia'}
                        {evento.tipo === 'prazo' && 'Prazo'}
                        {evento.tipo === 'agenda' && 'Agenda'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Próximas Perícias */}
      <Card>
        <CardHeader>
          <CardTitle>Próximas Perícias</CardTitle>
        </CardHeader>
        <CardContent>
          {eventos.filter(e => e.tipo === 'pericia' && new Date(e.data) >= new Date()).length === 0 ? (
            <p className="text-muted-foreground text-center py-4">Nenhuma perícia agendada</p>
          ) : (
            <div className="space-y-2">
              {eventos
                .filter(e => e.tipo === 'pericia' && new Date(e.data) >= new Date())
                .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                .slice(0, 5)
                .map(evento => (
                  <div key={evento.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div>
                      <p className="font-medium">{evento.titulo}</p>
                      <p className="text-sm text-muted-foreground">
                        {evento.cliente_nome && `${evento.cliente_nome} • `}
                        {format(new Date(evento.data), "dd/MM 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                    {evento.cliente_id && (
                      <Button size="sm" variant="outline" asChild>
                        <Link to={`/clientes/${evento.cliente_id}`}>Ver Cliente</Link>
                      </Button>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
