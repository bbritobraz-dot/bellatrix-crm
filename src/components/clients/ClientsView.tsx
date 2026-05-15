"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Plus,
  Search,
  MapPin,
  Phone,
  Mail,
  Clock,
  LayoutList,
  KanbanSquare,
  X,
  Pencil,
  Copy,
  Check,
  Users,
  XCircle,
  Calendar,
} from "lucide-react";
import {
  updateClientStatus,
  markClientLost,
  updateClient,
} from "@/app/actions/clients";
import { scheduleVisit } from "@/app/actions/visits";

// Definição das colunas do Kanban com cores do sistema Bellatrix
const KANBAN_COLUMNS = [
  {
    id: "novo_lead",
    title: "Novo Lead",
    color: "bg-primary/5 text-primary border-primary/10",
  },
  {
    id: "visita_agendada",
    title: "Visita Agendada",
    color: "bg-vibrant-cyan/10 text-vibrant-cyan-deep border-vibrant-cyan/20",
  },
  {
    id: "visita_realizada",
    title: "Visita Realizada",
    color: "bg-slate-100 text-slate-700 border-slate-200",
  },
  {
    id: "orcamento_enviado",
    title: "Orçamento Enviado",
    color: "bg-vibrant-cyan/10 text-primary border-vibrant-cyan/20 font-bold",
  },
  {
    id: "em_negociacao",
    title: "Em Negociação",
    color: "bg-sage-green/10 text-primary border-sage-green/20",
  },
  {
    id: "fechado",
    title: "Fechado",
    color: "bg-sage-green text-emerald-900 border-emerald-200",
  },
  {
    id: "perdido",
    title: "Perdido",
    color: "bg-slate-100 text-slate-500 border-slate-200",
  },
];

const formatWhatsAppLink = (phone: string) => {
  const cleanPhone = phone.replace(/\D/g, "");
  const finalPhone = cleanPhone.length <= 11 ? `55${cleanPhone}` : cleanPhone;
  return `https://wa.me/${finalPhone}`;
};

export function ClientsView({ initialClients }: { initialClients: any[] }) {
  const [viewMode, setViewMode] = useState<"list" | "kanban">("list");
  const [clients, setClients] = useState(initialClients);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [actionModal, setActionModal] = useState<{
    isOpen: boolean;
    type: "perdido" | "visita_agendada" | null;
    clientId: string;
    clientName: string;
  }>({ isOpen: false, type: null, clientId: "", clientName: "" });

  const [editModal, setEditModal] = useState<{
    isOpen: boolean;
    client: any | null;
  }>({ isOpen: false, client: null });

  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [lossReason, setLossReason] = useState("");
  const [visitDate, setVisitDate] = useState("");
  const [visitTime, setVisitTime] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const [editData, setEditData] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    neighborhood: "",
    city: "",
    notes: "",
  });

  const filteredClients = clients.filter((c) => {
    const matchesSearch =
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.includes(searchTerm) ||
      (c.email && c.email.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    return matchesSearch && matchesStatus;
  });

  const handleOpenEdit = (client: any) => {
    setEditModal({ isOpen: true, client });
    setEditData({
      name: client.name || "",
      phone: client.phone || "",
      email: client.email || "",
      address: client.address || "",
      neighborhood: client.neighborhood || "",
      city: client.city || "",
      notes: client.notes || "",
    });
  };

  const handleUpdateClient = async () => {
    if (!editModal.client) return;
    setIsProcessing(true);
    const res = await updateClient(editModal.client.id, editData);
    if (res.success) {
      setClients(
        clients.map((c) =>
          c.id === editModal.client.id ? { ...c, ...editData } : c,
        ),
      );
      setEditModal({ isOpen: false, client: null });
    }
    setIsProcessing(false);
  };

  const handleCopyAddress = (client: any) => {
    const parts = [client.address, client.neighborhood, client.city];
    const fullAddress = parts.filter((p) => p && p.trim() !== "").join(", ");
    if (!fullAddress) return;

    navigator.clipboard.writeText(fullAddress);
    setCopiedId(client.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDragStart = (e: React.DragEvent, clientId: string) => {
    e.dataTransfer.setData("clientId", clientId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, newStatus: string) => {
    e.preventDefault();
    const clientId = e.dataTransfer.getData("clientId");
    const client = clients.find((c) => c.id === clientId);
    if (!client || client.status === newStatus) return;

    if (newStatus === "perdido") {
      setActionModal({
        isOpen: true,
        type: "perdido",
        clientId,
        clientName: client.name,
      });
      return;
    }

    if (newStatus === "visita_agendada") {
      setActionModal({
        isOpen: true,
        type: "visita_agendada",
        clientId,
        clientName: client.name,
      });
      return;
    }

    const previousClients = [...clients];
    setClients(
      clients.map((c) => (c.id === clientId ? { ...c, status: newStatus } : c)),
    );

    const result = await updateClientStatus(clientId, newStatus);
    if (!result.success) {
      setClients(previousClients);
    }
  };

  const handleConfirmAction = async () => {
    if (!actionModal.type || !actionModal.clientId) return;
    setIsProcessing(true);

    try {
      if (actionModal.type === "perdido") {
        if (!lossReason) throw new Error("Informe o motivo");
        setClients(
          clients.map((c) =>
            c.id === actionModal.clientId ? { ...c, status: "perdido" } : c,
          ),
        );
        await markClientLost(actionModal.clientId, lossReason);
      } else if (actionModal.type === "visita_agendada") {
        if (!visitDate || !visitTime) throw new Error("Informe data e hora");
        const client = clients.find((c) => c.id === actionModal.clientId);
        setClients(
          clients.map((c) =>
            c.id === actionModal.clientId
              ? { ...c, status: "visita_agendada" }
              : c,
          ),
        );
        await scheduleVisit(
          actionModal.clientId,
          visitDate,
          visitTime,
          client?.address || "",
        );
      }
      closeModal();
    } catch (err: any) {
      console.error(err);
    }
    setIsProcessing(false);
  };

  const closeModal = () => {
    setActionModal({ isOpen: false, type: null, clientId: "", clientName: "" });
    setLossReason("");
    setVisitDate("");
    setVisitTime("");
  };

  const getStatusBadge = (status: string) => {
    const col = KANBAN_COLUMNS.find((c) => c.id === status);
    if (!col)
      return (
        <span className="px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border bg-slate-100 text-slate-700">
          DESCONHECIDO
        </span>
      );
    return (
      <span
        className={`px-3 py-1 rounded-full text-[10px] uppercase tracking-wider font-bold border ${col.color}`}
      >
        {col.title}
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">
      {/* HEADER PREMIUM */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-8">
        <div>
          <h1 className="text-4xl md:text-5xl font-heading font-bold text-slate-900 uppercase tracking-tighter">
            Clientes
          </h1>
          <p className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em] mt-3">
            Gestão de Leads e Carteira de Atendimento
          </p>
        </div>
        <Link
          href="/clientes/novo"
          className="bg-primary text-vibrant-cyan hover:bg-primary/95 font-heading font-bold uppercase tracking-widest py-4 px-10 rounded-2xl transition-all flex items-center gap-3 shadow-xl shadow-primary/10 active:scale-95 group"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          Novo Cliente
        </Link>
      </div>

      {/* CONTROLES E FILTROS LUMINA */}
      <div className="flex flex-col lg:flex-row items-center gap-6">
        <div className="relative flex-1 w-full group">
          <Search className="w-5 h-5 text-slate-300 absolute left-5 top-1/2 -translate-y-1/2 group-focus-within:text-primary transition-colors" />
          <input
            type="text"
            placeholder="Buscar por nome, telefone ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-14 pr-6 py-4.5 bg-white border border-border focus:ring-4 focus:ring-primary/5 focus:border-primary rounded-2xl outline-none transition-all font-medium text-sm shadow-sm placeholder:text-slate-300 text-slate-700"
          />
        </div>

        <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
          <div className="relative flex-1 md:flex-none">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-64 bg-white border border-border focus:ring-4 focus:ring-primary/5 focus:border-primary rounded-2xl px-6 py-4.5 outline-none transition-all font-heading font-bold uppercase text-[10px] tracking-widest text-slate-600 appearance-none shadow-sm cursor-pointer"
            >
              <option value="">Todos os Status</option>
              {KANBAN_COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
            <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-slate-300">
              <Clock className="w-4 h-4" />
            </div>
          </div>

          <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100 shadow-inner">
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-heading font-bold uppercase text-[9px] tracking-widest ${viewMode === "list" ? "bg-white text-primary shadow-sm border border-slate-100" : "text-slate-400 hover:text-primary"}`}
            >
              <LayoutList className="w-4 h-4" />
              Lista
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-2 px-5 py-3 rounded-xl transition-all font-heading font-bold uppercase text-[9px] tracking-widest ${viewMode === "kanban" ? "bg-white text-primary shadow-sm border border-slate-100" : "text-slate-400 hover:text-primary"}`}
            >
              <KanbanSquare className="w-4 h-4" />
              Kanban
            </button>
          </div>
        </div>
      </div>
      {viewMode === "list" ? (
        <div className="bg-white rounded-[2.5rem] border border-border overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left whitespace-nowrap table-responsive-stack">
              <thead>
                <tr className="bg-slate-50 border-b border-border">
                  <th className="px-10 py-6 font-heading font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px]">
                    Identificação
                  </th>
                  <th className="px-10 py-6 font-heading font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px]">
                    Contatos
                  </th>
                  <th className="px-10 py-6 font-heading font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px]">
                    Localização
                  </th>
                  <th className="px-10 py-6 font-heading font-bold text-slate-400 uppercase tracking-[0.2em] text-[10px] text-right">
                    Status & Gestão
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-10 py-24 text-center">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4 text-slate-200">
                          <Users className="w-8 h-8" />
                        </div>
                        <p className="text-[10px] font-heading font-bold uppercase tracking-widest text-slate-400">
                          Nenhum cliente encontrado
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredClients.map((client) => (
                    <tr
                      key={client.id}
                      className="hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-10 py-8">
                        <div className="font-heading font-bold text-slate-900 text-lg uppercase tracking-tight group-hover:text-primary transition-colors">
                          {client.name}
                        </div>
                        {client.created_at && (
                          <div className="text-[9px] text-slate-300 font-heading font-bold uppercase tracking-widest flex items-center gap-1.5 mt-2">
                            <Clock className="w-3.5 h-3.5 opacity-50" />
                            Desde{" "}
                            {new Date(client.created_at).toLocaleDateString(
                              "pt-BR",
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-10 py-8">
                        <div className="flex flex-col gap-2">
                          <a
                            href={formatWhatsAppLink(client.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2.5 text-vibrant-cyan hover:text-primary transition-colors font-heading font-bold text-[11px] uppercase tracking-widest"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {client.phone}
                          </a>
                          {client.email && (
                            <div className="flex items-center gap-2.5 text-slate-400 text-[10px] font-medium lowercase">
                              <Mail className="w-3.5 h-3.5 opacity-40" />
                              {client.email}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-10 py-8">
                        {client.address ? (
                          <div className="flex items-center gap-3 text-slate-500">
                            <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center shrink-0">
                              <MapPin className="w-4 h-4 text-primary opacity-60" />
                            </div>
                            <span
                              className="truncate max-w-[220px] font-medium text-xs text-slate-400"
                              title={client.address}
                            >
                              {client.address}
                            </span>
                            <button
                              onClick={() => handleCopyAddress(client)}
                              className="p-2 hover:bg-white rounded-xl text-slate-300 hover:text-primary transition-all shadow-sm active:scale-90"
                            >
                              {copiedId === client.id ? (
                                <Check className="w-4 h-4 text-emerald-500" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-heading font-bold uppercase tracking-widest text-slate-200">
                            Não informado
                          </span>
                        )}
                      </td>
                      <td className="px-10 py-8 text-right">
                        <div className="flex items-center justify-end gap-6">
                          <div className="scale-90 origin-right">
                            {getStatusBadge(client.status)}
                          </div>
                          <button
                            onClick={() => handleOpenEdit(client)}
                            className="w-12 h-12 bg-slate-50 text-slate-400 hover:bg-primary hover:text-vibrant-cyan rounded-2xl transition-all flex items-center justify-center border border-transparent hover:shadow-lg hover:shadow-primary/10 active:scale-90"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="flex gap-8 overflow-x-auto pb-12 pt-4 items-start min-h-[calc(100vh-320px)] scrollbar-hide">
          {KANBAN_COLUMNS.map((column) => {
            const columnClients = filteredClients.filter(
              (c) => c.status === column.id,
            );
            return (
              <div
                key={column.id}
                className="bg-slate-50/50 rounded-[2.5rem] flex flex-col flex-shrink-0 w-[340px] max-h-full border border-slate-100/50 group/column"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div
                  className={`p-6 pb-4 flex justify-between items-center relative`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-2.5 h-2.5 rounded-full ${column.id === "perdido" ? "bg-rose-400" : column.id === "fechado" ? "bg-emerald-400" : "bg-primary"}`}
                    />
                    <h3 className="font-heading font-bold text-slate-900 uppercase tracking-tighter text-sm">
                      {column.title}
                    </h3>
                  </div>
                  <span className="bg-white border border-slate-100 text-slate-400 text-[10px] px-3 py-1 rounded-full font-heading font-bold shadow-sm">
                    {columnClients.length}
                  </span>
                </div>

                <div className="p-4 flex-1 overflow-y-auto space-y-5 scrollbar-hide min-h-[200px]">
                  {columnClients.map((client) => (
                    <div
                      key={client.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, client.id)}
                      className="bg-white p-7 rounded-[2rem] border border-border cursor-grab active:cursor-grabbing hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 group relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-5 transition-opacity">
                        <Users className="w-12 h-12 text-primary" />
                      </div>

                      <button
                        onClick={() => handleOpenEdit(client)}
                        className="absolute top-6 right-6 w-10 h-10 bg-slate-50 text-slate-400 hover:bg-primary hover:text-vibrant-cyan rounded-xl transition-all flex items-center justify-center border border-transparent opacity-0 group-hover:opacity-100 z-10 scale-90 hover:scale-100 shadow-sm"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <h4 className="font-heading font-bold text-slate-900 uppercase text-base mb-4 pr-8 leading-tight group-hover:text-primary transition-colors">
                        {client.name}
                      </h4>

                      <div className="space-y-4 relative z-10">
                        <a
                          href={formatWhatsAppLink(client.phone)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2.5 text-vibrant-cyan hover:text-primary font-heading font-bold text-[10px] uppercase tracking-widest transition-colors"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          {client.phone}
                        </a>

                        {client.address && (
                          <div className="flex items-center gap-2.5 bg-slate-50/80 p-3 rounded-xl border border-slate-100 group/addr">
                            <MapPin className="w-3.5 h-3.5 text-slate-300 shrink-0" />
                            <span className="truncate text-slate-400 font-medium text-[10px] uppercase tracking-tight">
                              {client.address}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyAddress(client);
                              }}
                              className="ml-auto p-1.5 hover:bg-white rounded-lg text-slate-300 hover:text-primary opacity-0 group-hover/addr:opacity-100 transition-all active:scale-90"
                            >
                              {copiedId === client.id ? (
                                <Check className="w-3 h-3 text-emerald-500" />
                              ) : (
                                <Copy className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  {columnClients.length === 0 && (
                    <div className="text-center py-20 px-6 group-hover/column:bg-white/50 transition-colors rounded-[2rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center gap-3">
                      <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-200">
                        <Plus className="w-6 h-6" />
                      </div>
                      <p className="text-[9px] font-heading font-bold uppercase tracking-widest text-slate-300">
                        Arraste aqui
                      </p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL DE AÇÕES PREMIUM */}
      {actionModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[1000] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.4)] w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="flex items-center justify-between p-10 bg-primary text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                {actionModal.type === "perdido" ? (
                  <XCircle className="w-24 h-24" />
                ) : (
                  <Calendar className="w-24 h-24" />
                )}
              </div>
              <h3 className="font-heading font-bold uppercase tracking-widest text-sm relative z-10">
                {actionModal.type === "perdido"
                  ? "Encerrar Lead"
                  : "Agendar Visita"}
              </h3>
              <button
                onClick={closeModal}
                className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 relative z-10"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-10 space-y-8">
              <div>
                <p className="text-[10px] font-heading font-bold text-slate-400 uppercase tracking-[0.2em] mb-2">
                  Cliente Selecionado
                </p>
                <p className="text-2xl font-heading font-bold text-slate-900 uppercase tracking-tight">
                  {actionModal.clientName}
                </p>
              </div>

              {actionModal.type === "perdido" && (
                <div className="space-y-3">
                  <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">
                    Motivo da Desistência
                  </label>
                  <select
                    value={lossReason}
                    onChange={(e) => setLossReason(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione o motivo...</option>
                    <option value="Preço muito alto">Preço muito alto</option>
                    <option value="Fechou com a concorrência">
                      Fechou com a concorrência
                    </option>
                    <option value="Prazo de entrega longo">
                      Prazo de entrega longo
                    </option>
                    <option value="Apenas especulando / Sem resposta">
                      Apenas especulando / Sem resposta
                    </option>
                    <option value="Projeto cancelado">Projeto cancelado</option>
                    <option value="Outros">Outros</option>
                  </select>
                </div>
              )}

              {actionModal.type === "visita_agendada" && (
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-3">
                    <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Data da Visita
                    </label>
                    <input
                      type="date"
                      value={visitDate}
                      onChange={(e) => setVisitDate(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">
                      Horário Previsto
                    </label>
                    <input
                      type="time"
                      value={visitTime}
                      onChange={(e) => setVisitTime(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button
                onClick={closeModal}
                className="btn-cancel px-8 py-4 !rounded-2xl"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmAction}
                disabled={
                  isProcessing ||
                  (actionModal.type === "perdido"
                    ? !lossReason
                    : !visitDate || !visitTime)
                }
                className={`px-10 py-4 font-heading font-bold uppercase tracking-widest text-[10px] rounded-2xl transition-all shadow-xl disabled:opacity-50 active:scale-95 ${actionModal.type === "perdido" ? "bg-rose-500 text-white shadow-rose-500/20" : "bg-primary text-vibrant-cyan shadow-primary/20"}`}
              >
                {isProcessing ? "Enviando..." : "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE EDIÇÃO PREMIUM */}
      {editModal.isOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xl z-[1100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] shadow-[0_30px_100px_rgba(0,0,0,0.4)] w-full max-w-2xl my-8 overflow-hidden animate-in zoom-in-95 duration-300 border border-white/20">
            <div className="p-10 bg-primary text-white flex items-center justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                <Users className="w-32 h-32" />
              </div>
              <div className="relative z-10">
                <h3 className="text-3xl font-heading font-bold uppercase tracking-tight">
                  Editar Cliente
                </h3>
                <p className="text-vibrant-cyan/80 text-[10px] font-heading font-bold uppercase tracking-[0.2em] mt-2">
                  Atualização de Cadastro Estratégico
                </p>
              </div>
              <button
                onClick={() => setEditModal({ isOpen: false, client: null })}
                className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all active:scale-90 relative z-10"
              >
                <X className="w-8 h-8" />
              </button>
            </div>

            <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
              <div className="md:col-span-2 space-y-3">
                <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Nome Completo / Razão Social
                </label>
                <input
                  type="text"
                  value={editData.name}
                  onChange={(e) =>
                    setEditData({ ...editData, name: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold uppercase text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">
                  WhatsApp de Contato
                </label>
                <input
                  type="text"
                  value={editData.phone}
                  onChange={(e) =>
                    setEditData({ ...editData, phone: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">
                  E-mail Corporativo
                </label>
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) =>
                    setEditData({ ...editData, email: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="block text-[10px] font-heading font-bold text-vibrant-cyan uppercase tracking-widest flex items-center gap-2 ml-1">
                  <MapPin className="w-3.5 h-3.5" /> Endereço de Instalação
                </label>
                <input
                  type="text"
                  placeholder="Rua, número, complemento..."
                  value={editData.address}
                  onChange={(e) =>
                    setEditData({ ...editData, address: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Bairro
                </label>
                <input
                  type="text"
                  value={editData.neighborhood}
                  onChange={(e) =>
                    setEditData({ ...editData, neighborhood: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="space-y-3">
                <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Cidade
                </label>
                <input
                  type="text"
                  value={editData.city}
                  onChange={(e) =>
                    setEditData({ ...editData, city: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all"
                />
              </div>

              <div className="md:col-span-2 space-y-3">
                <label className="block text-[10px] font-heading font-bold text-slate-400 uppercase tracking-widest ml-1">
                  Notas de Negociação
                </label>
                <textarea
                  rows={4}
                  value={editData.notes}
                  onChange={(e) =>
                    setEditData({ ...editData, notes: e.target.value })
                  }
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-5 font-heading font-bold text-primary focus:ring-4 focus:ring-primary/5 focus:bg-white outline-none transition-all resize-none"
                  placeholder="Detalhes relevantes sobre o lead ou cliente..."
                />
              </div>
            </div>

            <div className="p-10 bg-slate-50 border-t border-slate-100 flex justify-end gap-4">
              <button
                onClick={() => setEditModal({ isOpen: false, client: null })}
                className="btn-cancel px-8 py-5 !rounded-2xl"
              >
                Descartar
              </button>
              <button
                onClick={handleUpdateClient}
                disabled={isProcessing || !editData.name || !editData.phone}
                className="px-10 py-5 bg-primary text-vibrant-cyan font-heading font-bold uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-primary/20 transition-all active:scale-95 disabled:opacity-50 flex items-center gap-3"
              >
                {isProcessing ? "Processando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
