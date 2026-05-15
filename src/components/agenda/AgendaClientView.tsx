"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Calendar as CalendarIcon, 
  MapPin, 
  Clock, 
  User, 
  Phone, 
  CheckCircle, 
  XCircle, 
  ChevronLeft, 
  ChevronRight, 
  List, 
  Grid3X3, 
  Columns, 
  Layout,
  CalendarCheck,
  CalendarX,
  RefreshCw,
  MoreVertical,
  Copy,
  Check
} from "lucide-react";
import { updateVisitStatus } from "@/app/actions/visits";
import { 
  format, 
  addMonths, 
  subMonths, 
  addWeeks, 
  subWeeks, 
  addDays, 
  subDays,
  startOfMonth, 
  endOfMonth, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  isToday,
  parseISO
} from "date-fns";
import { ptBR } from "date-fns/locale";

type ViewType = 'month' | 'week' | 'day' | 'list';

export function AgendaClientView({ initialVisits, initialInstallations = [] }: { initialVisits: any[], initialInstallations?: any[] }) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>('month');
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isRescheduleModalOpen, setIsRescheduleModalOpen] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  // Navegação
  const next = () => {
    if (viewType === 'month') setCurrentDate(addMonths(currentDate, 1));
    if (viewType === 'week') setCurrentDate(addWeeks(currentDate, 1));
    if (viewType === 'day') setCurrentDate(addDays(currentDate, 1));
  };
  const prev = () => {
    if (viewType === 'month') setCurrentDate(subMonths(currentDate, 1));
    if (viewType === 'week') setCurrentDate(subWeeks(currentDate, 1));
    if (viewType === 'day') setCurrentDate(subDays(currentDate, 1));
  };
  const today = () => setCurrentDate(new Date());

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const formatWhatsAppLink = (phone: string) => {
    const cleanPhone = phone.replace(/\D/g, "");
    const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
    return `https://wa.me/${finalPhone}`;
  };

  const handleCopyAddress = (event: any) => {
    const addr = event.address || event.client?.address || event.clients?.address;
    const neighborhood = event.neighborhood || event.client?.neighborhood || event.clients?.neighborhood;
    const city = event.city || event.client?.city || event.clients?.city;
    
    const parts = [addr, neighborhood, city];
    const fullAddress = parts.filter(p => p && p.trim() !== "").join(", ");
    if (!fullAddress) return;
    
    navigator.clipboard.writeText(fullAddress);
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'agendada': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'confirmada': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
      case 'realizada': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'reagendada': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'cancelada': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'instalação': return 'bg-slate-900 text-vibrant-cyan border-slate-800';
      default: return 'bg-slate-50 text-slate-500 border-slate-100';
    }
  };

  const normalizedVisits = initialVisits.map(v => ({
    ...v,
    eventType: 'visit',
    eventDate: v.date,
    eventTime: v.time
  }));

  const normalizedInstallations = initialInstallations.map(i => {
    const dt = new Date(i.installation_date);
    return {
      ...i,
      eventType: 'installation',
      eventDate: dt.toISOString().split('T')[0],
      eventTime: dt.toLocaleTimeString('pt-BR', {hour: '2-digit', minute:'2-digit'}),
      status: 'instalação'
    };
  });

  const allEvents = [...normalizedVisits, ...normalizedInstallations].sort((a,b) => {
    const dateComp = a.eventDate.localeCompare(b.eventDate);
    if (dateComp !== 0) return dateComp;
    return a.eventTime.localeCompare(b.eventTime);
  });

  const renderVisitCard = (event: any, compact = false) => {
    if (compact) {
      return (
        <div 
          key={event.id} 
          onClick={() => { setSelectedVisit(event); setIsStatusModalOpen(true); }}
          className={`p-3 text-[10px] rounded-xl border ${getStatusBadge(event.status)} transition-all cursor-pointer hover:shadow-lg active:scale-95 mb-2 flex items-center justify-between group`}
        >
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="font-heading font-bold opacity-50 shrink-0">{event.eventTime.substring(0, 5)}</span>
            <span className="font-heading font-bold uppercase tracking-tight truncate">{event.client?.name || event.clients?.name}</span>
          </div>
          <div className="w-1.5 h-1.5 rounded-full bg-current opacity-50 shrink-0" />
        </div>
      );
    }
    
    return (
      <div key={event.id} className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-xl hover:shadow-primary/5 transition-all duration-500">
        <div className="bg-slate-50/50 border-b border-slate-50 p-8 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center shadow-sm text-primary">
              <CalendarIcon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest leading-none">
                {new Date(event.eventDate).toLocaleDateString('pt-BR', { weekday: 'long' })}
              </p>
              <p className="text-sm font-heading font-bold text-slate-900 uppercase tracking-tight mt-1">
                {new Date(event.eventDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-slate-100 shadow-sm">
            <Clock className="w-4 h-4 text-slate-300" />
            <span className="font-heading font-bold text-slate-900 text-sm">{event.eventTime.substring(0, 5)}</span>
          </div>
        </div>
        
        <div className="p-8 flex-1 space-y-6">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="font-heading font-bold text-slate-900 text-lg uppercase tracking-tight group-hover:text-primary transition-colors">
                {event.client?.name || event.clients?.name}
              </h3>
              <a 
                href={formatWhatsAppLink(event.client?.phone || event.clients?.phone || "")}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-heading font-bold text-primary/60 hover:text-primary uppercase tracking-[0.1em] flex items-center gap-2 transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                {event.client?.phone || event.clients?.phone}
              </a>
            </div>
            <span className={`px-4 py-2 rounded-full text-[9px] font-heading font-bold uppercase tracking-widest border ${getStatusBadge(event.status)}`}>
              {event.eventType === 'installation' ? 'Instalação' : event.status}
            </span>
          </div>

          <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-50 flex items-center justify-between group/addr">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-8 h-8 bg-white rounded-xl flex items-center justify-center text-slate-300 shrink-0">
                <MapPin className="w-4 h-4" />
              </div>
              <span className="text-[11px] font-medium text-slate-500 truncate leading-snug">
                {event.address || event.client?.address || event.clients?.address || 'Endereço não informado'}
              </span>
            </div>
            {(event.address || event.client?.address || event.clients?.address) && (
              <button 
                onClick={() => handleCopyAddress(event)}
                className="w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-300 hover:text-primary transition-all ml-2"
              >
                {copiedId === event.id ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              </button>
            )}
          </div>

          {event.status === 'agendada' && event.eventType === 'visit' && (
            <div className="grid grid-cols-3 gap-3 pt-2">
              <button 
                onClick={() => { setSelectedVisit(event); setIsStatusModalOpen(true); }}
                className="bg-emerald-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/10 active:scale-95"
              >
                <CalendarCheck className="w-4 h-4" />
                <span className="text-[8px] font-heading font-bold uppercase tracking-widest">Realizada</span>
              </button>
              <button 
                onClick={() => handleUpdateStatus(event.id, 'cancelada', event.client_id)}
                className="bg-rose-500 text-white p-3 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/10 active:scale-95"
              >
                <CalendarX className="w-4 h-4" />
                <span className="text-[8px] font-heading font-bold uppercase tracking-widest">Cancelar</span>
              </button>
              <button 
                onClick={() => { setSelectedVisit(event); setIsRescheduleModalOpen(true); }}
                className="bg-primary text-vibrant-cyan p-3 rounded-2xl flex flex-col items-center justify-center gap-1 hover:bg-primary/95 transition-all shadow-lg shadow-primary/10 active:scale-95"
              >
                <RefreshCw className="w-4 h-4" />
                <span className="text-[8px] font-heading font-bold uppercase tracking-widest">Reagendar</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handleUpdateStatus = async (visitId: string, status: any, clientId: string, hasQuote?: boolean, rescheduleDate?: string, rescheduleTime?: string) => {
    setIsUpdating(true);
    const res = await updateVisitStatus(visitId, status, clientId, hasQuote, rescheduleDate, rescheduleTime);
    if (res.success) {
      window.location.reload(); 
    } else {
      alert("Erro ao atualizar status: " + res.error);
    }
    setIsUpdating(false);
    setIsStatusModalOpen(false);
    setIsRescheduleModalOpen(false);
  };

  const renderMonthView = () => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart);
    const endDate = endOfWeek(monthEnd);
    const dateFormat = "d";
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
        <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/50">
          {weekDays.map(day => (
            <div key={day} className="py-6 text-center text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em]">{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 auto-rows-[160px]">
          {days.map((day, i) => {
            const dayVisits = allEvents.filter(v => isSameDay(parseISO(v.eventDate), day));
            const isSelected = isToday(day);
            const isCurrentMonth = isSameMonth(day, monthStart);

            return (
              <div 
                key={day.toString()} 
                className={`p-4 border-r border-b border-slate-50 relative overflow-y-auto transition-all ${!isCurrentMonth ? 'bg-slate-50/30 opacity-40' : 'bg-white'} ${isSelected ? 'bg-primary/[0.02]' : ''}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className={`text-xs font-heading font-bold ${isSelected ? 'bg-primary text-vibrant-cyan w-8 h-8 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 scale-110' : 'text-slate-400'}`}>
                    {format(day, dateFormat)}
                  </div>
                  {dayVisits.length > 0 && (
                    <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                  )}
                </div>
                <div className="space-y-1">
                  {dayVisits.map(v => renderVisitCard(v, true))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderWeekView = () => {
    const startDate = startOfWeek(currentDate);
    const endDate = endOfWeek(currentDate);
    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="bg-white rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm flex flex-col h-[calc(100vh-250px)]">
        <div className="grid grid-cols-7 border-b border-slate-50 bg-slate-50/50">
          {days.map(day => (
            <div key={day.toString()} className={`p-8 text-center border-r border-slate-50 transition-colors ${isToday(day) ? 'bg-primary/[0.02]' : ''}`}>
              <div className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em]">{format(day, 'EEE', { locale: ptBR })}</div>
              <div className={`text-2xl font-heading font-bold mt-2 ${isToday(day) ? 'text-primary' : 'text-slate-900'}`}>
                {format(day, 'd')}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 flex-1 overflow-y-auto">
          {days.map(day => {
            const dayVisits = allEvents.filter(v => isSameDay(parseISO(v.eventDate), day));
            return (
              <div key={day.toString()} className="border-r border-slate-50 p-4 space-y-3 min-h-[300px]">
                {dayVisits.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 opacity-20">
                    <div className="w-8 h-8 rounded-full border-2 border-slate-200 border-dashed" />
                  </div>
                ) : (
                  dayVisits.map(v => (
                    <div 
                      key={v.id} 
                      onClick={() => { setSelectedVisit(v); setIsStatusModalOpen(true); }}
                      className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm hover:shadow-xl hover:shadow-primary/5 transition-all group cursor-pointer"
                    >
                      <div className={`text-[9px] font-heading font-bold mb-2 flex items-center gap-2 ${v.eventType === 'installation' ? 'text-primary' : 'text-blue-500'}`}>
                        <div className="w-1.5 h-1.5 rounded-full bg-current" />
                        {v.eventTime.substring(0, 5)} {v.eventType === 'installation' && '(Instalação)'}
                      </div>
                      <div className="text-xs font-heading font-bold text-slate-900 uppercase tracking-tight leading-tight group-hover:text-primary transition-colors">{v.client?.name || v.clients?.name}</div>
                      <div className="text-[10px] text-slate-400 mt-2 flex items-center gap-2 truncate">
                        <MapPin className="w-3 h-3 text-slate-300 shrink-0"/>
                        {v.client?.neighborhood || v.clients?.neighborhood || 'S/N'}
                      </div>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDayView = () => {
    const dayVisits = allEvents.filter(v => isSameDay(parseISO(v.eventDate), currentDate));
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="flex items-center gap-6 mb-16">
          <div className="w-20 h-20 bg-primary rounded-[2.5rem] flex flex-col items-center justify-center text-vibrant-cyan shadow-2xl shadow-primary/20">
            <span className="text-2xl font-heading font-bold leading-none">{format(currentDate, "d")}</span>
            <span className="text-[8px] font-heading font-bold uppercase tracking-widest mt-1">{format(currentDate, "MMM", { locale: ptBR })}</span>
          </div>
          <div>
            <h3 className="text-3xl font-heading font-bold text-slate-900 uppercase tracking-tighter">
              {format(currentDate, "EEEE", { locale: ptBR })}
            </h3>
            <p className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em] mt-2">Programação do dia</p>
          </div>
        </div>
        
        {dayVisits.length === 0 ? (
          <div className="bg-slate-50/50 p-24 rounded-[3rem] border border-slate-100 text-center shadow-inner">
            <Clock className="w-12 h-12 text-slate-200 mx-auto mb-6" />
            <h3 className="text-sm font-heading font-bold text-slate-400 uppercase tracking-widest">Dia livre</h3>
            <p className="text-slate-300 text-[10px] font-heading font-bold uppercase tracking-widest mt-2">Nenhum agendamento para esta data</p>
          </div>
        ) : (
          <div className="space-y-12 relative before:absolute before:inset-0 before:ml-[2.5rem] before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-100 before:to-transparent">
            {dayVisits.sort((a,b) => a.eventTime.localeCompare(b.eventTime)).map(visit => (
              <div key={visit.id} className="relative pl-24 group">
                <div className={`absolute left-0 top-0 flex items-center justify-center w-20 h-20 rounded-[2rem] border-4 border-white shadow-xl relative z-10 transition-all group-hover:scale-110 ${visit.eventType === 'installation' ? 'bg-primary text-vibrant-cyan shadow-primary/20' : 'bg-slate-50 text-slate-400 border-slate-50 shadow-slate-200'}`}>
                  <span className="font-heading font-bold text-sm tracking-tighter">{visit.eventTime.substring(0, 5)}</span>
                </div>
                
                <div 
                  onClick={() => { setSelectedVisit(visit); setIsStatusModalOpen(true); }}
                  className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-1">
                      <h4 className="text-xl font-heading font-bold text-slate-900 uppercase tracking-tight group-hover:text-primary transition-colors">
                        {visit.client?.name || visit.clients?.name}
                      </h4>
                      <div className="flex items-center gap-4">
                        <a 
                          href={formatWhatsAppLink(visit.client?.phone || visit.clients?.phone || "")}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] font-heading font-bold text-primary/60 hover:text-primary uppercase tracking-[0.1em] flex items-center gap-2 transition-colors"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone className="w-3.5 h-3.5"/>{visit.client?.phone || visit.clients?.phone}
                        </a>
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-[9px] font-heading font-bold uppercase tracking-widest border ${getStatusBadge(visit.status)}`}>
                      {visit.status}
                    </span>
                  </div>
                  
                  <div className="bg-slate-50/50 p-6 rounded-2xl border border-slate-50 flex items-center justify-between group/addrday">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-slate-300">
                        <MapPin className="w-5 h-5"/>
                      </div>
                      <span className="text-xs font-medium text-slate-500">{visit.address || visit.client?.address || visit.clients?.address}</span>
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleCopyAddress(visit); }}
                      className="w-10 h-10 flex items-center justify-center bg-white rounded-xl shadow-sm text-slate-300 hover:text-primary transition-all opacity-0 group-hover/addrday:opacity-100"
                    >
                      {copiedId === visit.id ? <Check className="w-5 h-5 text-emerald-500" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderListView = () => {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {allEvents.length === 0 ? (
          <div className="col-span-full bg-slate-50/50 p-24 rounded-[3rem] border border-slate-100 text-center shadow-inner">
            <CalendarIcon className="w-12 h-12 text-slate-200 mx-auto mb-6" />
            <h3 className="text-sm font-heading font-bold text-slate-400 uppercase tracking-widest">Nenhum agendamento</h3>
            <p className="text-slate-300 text-[10px] font-heading font-bold uppercase tracking-widest mt-2">Sua agenda está vazia no momento</p>
          </div>
        ) : (
          allEvents.map(v => renderVisitCard(v))
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* HEADER E CONTROLES LUMINA */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 uppercase tracking-tighter">Agenda</h1>
          <p className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">
            {viewType !== 'list' ? format(currentDate, "MMMM 'de' yyyy", { locale: ptBR }) : 'Todos os Agendamentos'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          {/* Navegação de Data */}
          {viewType !== 'list' && (
            <div className="flex items-center bg-slate-50 p-1.5 rounded-[2rem] border border-slate-100 shadow-inner">
              <button 
                onClick={prev} 
                className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white rounded-full transition-all active:scale-90"
              >
                <ChevronLeft className="w-5 h-5"/>
              </button>
              <button 
                onClick={today} 
                className="px-8 h-12 flex items-center justify-center font-heading font-bold text-[10px] uppercase tracking-widest text-slate-600 hover:text-primary transition-colors"
              >
                Hoje
              </button>
              <button 
                onClick={next} 
                className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-primary hover:bg-white rounded-full transition-all active:scale-90"
              >
                <ChevronRight className="w-5 h-5"/>
              </button>
            </div>
          )}

          {/* Seletores de Visão */}
          <div className="flex bg-slate-50 p-1.5 rounded-[2rem] border border-slate-100 shadow-inner">
            {[
              { id: 'month', label: 'Mês', icon: Grid3X3 },
              { id: 'week', label: 'Semana', icon: Columns },
              { id: 'day', label: 'Dia', icon: Layout },
              { id: 'list', label: 'Lista', icon: List }
            ].map((view) => (
              <button 
                key={view.id}
                onClick={() => setViewType(view.id as ViewType)}
                className={`flex items-center gap-2 px-6 py-4 rounded-[1.5rem] transition-all font-heading font-bold uppercase text-[10px] tracking-widest whitespace-nowrap ${viewType === view.id ? 'bg-white text-primary shadow-sm border border-slate-100' : 'text-slate-400 hover:text-primary'}`}
              >
                <view.icon className={`w-3.5 h-3.5 ${viewType === view.id ? 'text-primary' : 'text-slate-300'}`} /> 
                <span className="hidden sm:inline">{view.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ÁREA DA AGENDA */}
      <div className="mt-6">
        {viewType === 'month' && renderMonthView()}
        {viewType === 'week' && renderWeekView()}
        {viewType === 'day' && renderDayView()}
        {viewType === 'list' && renderListView()}
      </div>

      {/* Modal de Resultado da Visita LUMINA */}
      {isStatusModalOpen && selectedVisit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100">
            <div className="p-12 border-b border-slate-50 bg-slate-50/30">
              <div className="w-16 h-16 bg-primary rounded-3xl flex items-center justify-center text-vibrant-cyan mb-6 shadow-xl shadow-primary/20">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h2 className="text-3xl font-heading font-bold text-slate-900 uppercase tracking-tighter">Visita Realizada</h2>
              <p className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">Cliente: {selectedVisit.client?.name || selectedVisit.clients?.name}</p>
            </div>
            
            <div className="p-12 space-y-10">
              <p className="text-lg font-medium text-slate-600 text-center leading-relaxed">
                O orçamento para este cliente já foi <span className="text-primary font-bold">gerado e enviado</span>?
              </p>
              
              <div className="grid grid-cols-2 gap-6">
                <button 
                  onClick={() => handleUpdateStatus(selectedVisit.id, 'realizada', selectedVisit.client_id, true)}
                  disabled={isUpdating}
                  className="flex flex-col items-center gap-6 p-10 rounded-[2.5rem] border border-slate-100 hover:border-primary hover:bg-primary/[0.02] transition-all group active:scale-95"
                >
                  <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <span className="font-heading font-bold text-slate-900 uppercase tracking-widest text-[10px]">Sim, enviado</span>
                </button>
                
                <button 
                  onClick={() => handleUpdateStatus(selectedVisit.id, 'realizada', selectedVisit.client_id, false)}
                  disabled={isUpdating}
                  className="flex flex-col items-center gap-6 p-10 rounded-[2.5rem] border border-slate-100 hover:border-primary hover:bg-primary/[0.02] transition-all group active:scale-95"
                >
                  <div className="w-16 h-16 rounded-3xl bg-blue-50 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform shadow-sm">
                    <Clock className="w-8 h-8" />
                  </div>
                  <span className="font-heading font-bold text-slate-900 uppercase tracking-widest text-[10px]">Não, pendente</span>
                </button>
              </div>
              
              <p className="text-[10px] font-heading font-bold text-slate-400 text-center uppercase tracking-widest">
                {isUpdating ? "Atualizando fluxo..." : "Isso atualizará automaticamente a posição do cliente no Kanban."}
              </p>
            </div>
            
            <div className="p-8 border-t border-slate-50 bg-slate-50/30 flex justify-center">
              <button 
                onClick={() => setIsStatusModalOpen(false)}
                className="px-12 py-4 text-[10px] font-heading font-bold text-slate-400 hover:text-primary uppercase tracking-widest transition-colors"
              >
                Voltar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Reagendamento LUMINA */}
      {isRescheduleModalOpen && selectedVisit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xl z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100">
            <div className="p-10 border-b border-slate-50 bg-amber-50/30">
              <div className="w-16 h-16 bg-amber-500 rounded-3xl flex items-center justify-center text-white mb-6 shadow-xl shadow-amber-500/20">
                <RefreshCw className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-heading font-bold text-slate-900 uppercase tracking-tighter">Reagendar Visita</h3>
              <p className="text-[10px] font-heading font-bold text-amber-600/60 uppercase tracking-widest mt-2 leading-relaxed">
                Nova data e horário para {selectedVisit.client?.name || selectedVisit.clients?.name}
              </p>
            </div>
            <div className="p-10 space-y-8">
              <div className="space-y-3">
                <label className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-4">Nova Data</label>
                <input 
                  type="date"
                  className="w-full bg-slate-50 border-none rounded-2xl p-6 focus:ring-2 focus:ring-primary/20 transition-all font-medium text-slate-900"
                  value={newDate}
                  onChange={e => setNewDate(e.target.value)}
                />
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-4">Novo Horário</label>
                <input 
                  type="time"
                  className="w-full bg-slate-50 border-none rounded-2xl p-6 focus:ring-2 focus:ring-primary/20 transition-all font-medium text-slate-900"
                  value={newTime}
                  onChange={e => setNewTime(e.target.value)}
                />
              </div>
            </div>
            <div className="p-8 border-t border-slate-50 flex flex-col gap-4 bg-slate-50/30 px-10">
              <button 
                onClick={() => handleUpdateStatus(selectedVisit.id, 'reagendada', selectedVisit.client_id, undefined, newDate, newTime)}
                className="w-full py-6 bg-primary text-vibrant-cyan font-heading font-bold uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
                disabled={isUpdating || !newDate || !newTime}
              >
                {isUpdating ? "Salvando..." : "Confirmar Reagendamento"}
              </button>
              <button 
                onClick={() => setIsRescheduleModalOpen(false)}
                className="w-full py-4 text-[10px] font-heading font-bold text-slate-400 hover:text-primary uppercase tracking-widest transition-colors"
                disabled={isUpdating}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
