import { useState } from 'react';
import { 
  Calendar as CalendarIcon, 
  Plus, 
  ChevronLeft, 
  ChevronRight,
  Clock,
  User,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { usePZAgenda, useCreatePZEvento, usePZUsuarios, PZAgenda } from '@/hooks/usePrazoZero';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, addMonths, subMonths, startOfWeek, endOfWeek, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const tipoConfig: Record<string, { label: string; color: string }> = {
  prazo: { label: 'Prazo', color: 'bg-red-500' },
  audiencia: { label: 'Audiência', color: 'bg-purple-500' },
  pagamento: { label: 'Pagamento', color: 'bg-green-500' },
  reuniao: { label: 'Reunião', color: 'bg-blue-500' },
  outro: { label: 'Outro', color: 'bg-gray-500' },
};

function EventoItem({ evento }: { evento: PZAgenda }) {
  const config = tipoConfig[evento.tipo] || tipoConfig.outro;

  return (
    <div className={cn(
      "p-2 rounded text-xs text-white mb-1 truncate",
      config.color,
      evento.concluido && "opacity-50 line-through"
    )}>
      {!evento.dia_inteiro && evento.data_inicio && (
        <span className="mr-1">{format(new Date(evento.data_inicio), 'HH:mm')}</span>
      )}
      {evento.titulo}
    </div>
  );
}

export default function PZAgendaPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [showEventDialog, setShowEventDialog] = useState(false);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });

  const { data: eventos, isLoading } = usePZAgenda(
    calendarStart.toISOString(),
    calendarEnd.toISOString()
  );
  const { data: usuarios } = usePZUsuarios();
  const createEvento = useCreatePZEvento();

  const [formData, setFormData] = useState({
    titulo: '',
    descricao: '',
    tipo: 'outro',
    data_inicio: '',
    hora_inicio: '09:00',
    data_fim: '',
    hora_fim: '10:00',
    dia_inteiro: false,
    responsavel_id: '',
  });

  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const getEventosForDay = (date: Date) => {
    return eventos?.filter(e => {
      const eventoDate = new Date(e.data_inicio);
      return isSameDay(eventoDate, date);
    }) || [];
  };

  const handlePrevMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setFormData(prev => ({
      ...prev,
      data_inicio: format(date, 'yyyy-MM-dd'),
      data_fim: format(date, 'yyyy-MM-dd'),
    }));
    setShowEventDialog(true);
  };

  const handleCreateEvento = async () => {
    if (!formData.titulo.trim()) {
      toast.error('Título é obrigatório');
      return;
    }

    const dataInicio = formData.dia_inteiro 
      ? `${formData.data_inicio}T00:00:00`
      : `${formData.data_inicio}T${formData.hora_inicio}:00`;

    const dataFim = formData.dia_inteiro
      ? `${formData.data_fim || formData.data_inicio}T23:59:59`
      : `${formData.data_fim || formData.data_inicio}T${formData.hora_fim}:00`;

    try {
      await createEvento.mutateAsync({
        titulo: formData.titulo,
        descricao: formData.descricao || null,
        tipo: formData.tipo,
        data_inicio: new Date(dataInicio).toISOString(),
        data_fim: new Date(dataFim).toISOString(),
        dia_inteiro: formData.dia_inteiro,
        responsavel_id: formData.responsavel_id || null,
      });

      setShowEventDialog(false);
      setFormData({
        titulo: '',
        descricao: '',
        tipo: 'outro',
        data_inicio: '',
        hora_inicio: '09:00',
        data_fim: '',
        hora_fim: '10:00',
        dia_inteiro: false,
        responsavel_id: '',
      });
    } catch (error) {
      console.error('Erro ao criar evento:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <CalendarIcon className="h-6 w-6" />
            Agenda
          </h1>
          <p className="text-muted-foreground">
            {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleToday}>
            Hoje
          </Button>
          <Button variant="outline" size="icon" onClick={handlePrevMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button size="sm" onClick={() => {
            setFormData(prev => ({
              ...prev,
              data_inicio: format(new Date(), 'yyyy-MM-dd'),
              data_fim: format(new Date(), 'yyyy-MM-dd'),
            }));
            setShowEventDialog(true);
          }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Evento
          </Button>
        </div>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-4">
        {Object.entries(tipoConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded", config.color)} />
            <span className="text-sm">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Calendário */}
      <Card>
        <CardContent className="p-0">
          {/* Dias da semana */}
          <div className="grid grid-cols-7 border-b">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
              <div key={day} className="p-3 text-center font-medium text-sm text-muted-foreground">
                {day}
              </div>
            ))}
          </div>

          {/* Grid de dias */}
          <div className="grid grid-cols-7">
            {days.map((day, index) => {
              const dayEvents = getEventosForDay(day);
              const isCurrentMonth = day.getMonth() === currentDate.getMonth();
              const isCurrentDay = isToday(day);

              return (
                <div
                  key={index}
                  onClick={() => handleDayClick(day)}
                  className={cn(
                    "min-h-[120px] p-2 border-b border-r cursor-pointer hover:bg-accent/50 transition-colors",
                    !isCurrentMonth && "bg-muted/30 text-muted-foreground",
                    isCurrentDay && "bg-primary/5"
                  )}
                >
                  <div className={cn(
                    "text-sm font-medium mb-1",
                    isCurrentDay && "bg-primary text-primary-foreground w-7 h-7 rounded-full flex items-center justify-center"
                  )}>
                    {format(day, 'd')}
                  </div>

                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map(evento => (
                      <EventoItem key={evento.id} evento={evento} />
                    ))}
                    {dayEvents.length > 3 && (
                      <p className="text-xs text-muted-foreground">
                        +{dayEvents.length - 3} mais
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Novo Evento */}
      <Dialog open={showEventDialog} onOpenChange={setShowEventDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Evento</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="titulo">Título *</Label>
              <Input
                id="titulo"
                value={formData.titulo}
                onChange={(e) => setFormData({ ...formData, titulo: e.target.value })}
                placeholder="Nome do evento..."
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição</Label>
              <Textarea
                id="descricao"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Detalhes..."
                rows={2}
              />
            </div>

            <div>
              <Label>Tipo</Label>
              <Select value={formData.tipo} onValueChange={(v) => setFormData({ ...formData, tipo: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="prazo">📅 Prazo</SelectItem>
                  <SelectItem value="audiencia">🏛️ Audiência</SelectItem>
                  <SelectItem value="pagamento">💰 Pagamento</SelectItem>
                  <SelectItem value="reuniao">👥 Reunião</SelectItem>
                  <SelectItem value="outro">📌 Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Checkbox
                id="dia_inteiro"
                checked={formData.dia_inteiro}
                onCheckedChange={(checked) => setFormData({ ...formData, dia_inteiro: !!checked })}
              />
              <Label htmlFor="dia_inteiro" className="cursor-pointer">Dia inteiro</Label>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Data Início</Label>
                <Input
                  type="date"
                  value={formData.data_inicio}
                  onChange={(e) => setFormData({ ...formData, data_inicio: e.target.value })}
                />
              </div>
              {!formData.dia_inteiro && (
                <div>
                  <Label>Hora</Label>
                  <Input
                    type="time"
                    value={formData.hora_inicio}
                    onChange={(e) => setFormData({ ...formData, hora_inicio: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div>
              <Label>Responsável</Label>
              <Select value={formData.responsavel_id || '__none__'} onValueChange={(v) => setFormData({ ...formData, responsavel_id: v === '__none__' ? '' : v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">Nenhum</SelectItem>
                  {usuarios?.filter(u => u.id).map(u => (
                    <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEventDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateEvento} disabled={createEvento.isPending}>
              Criar Evento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
