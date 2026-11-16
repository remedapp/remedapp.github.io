import React, { useMemo, useState } from 'react';
import {
  Bell,
  CalendarPlus,
  Check,
  Clock,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Stethoscope,
  Trash2,
  X,
} from 'lucide-react';
import {
  AppSettings,
  MedicationItem,
  RecurrenceType,
  ReminderType,
} from '../types';
import { getTodayIso } from '../data/initialData';

interface ScheduleViewProps {
  items: MedicationItem[];
  notesCount: number;
  settings: AppSettings;
  isSyncing: boolean;
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onSaveItem: (item: MedicationItem) => void;
  onDeleteItem: (id: string) => void;
  onToggleTakenToday: (id: string) => void;
  onSyncAll: () => void;
  onGoToSettings: () => void;
  onTriggerTestAlert: () => void;
}

const WEEKDAY_LABELS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

type FilterMode = 'today' | 'all' | 'medication' | 'appointment';

function formatRecurrence(item: MedicationItem): string {
  if (item.recurrence === 'daily') return 'Todos os dias';
  if (item.recurrence === 'once') {
    const [y, m, d] = item.date.split('-');
    return y && m && d ? `Data única · ${d}/${m}/${y}` : 'Data única';
  }
  const days = item.weekDays.map((d) => WEEKDAY_LABELS[d]).join(', ');
  return days ? `Semanal · ${days}` : 'Semanal';
}

function isScheduledForToday(item: MedicationItem, todayIso: string): boolean {
  if (!item.active) return false;
  if (item.recurrence === 'daily') return true;
  if (item.recurrence === 'once') return item.date === todayIso;
  const todayDay = new Date().getDay();
  return item.weekDays.includes(todayDay);
}

export const ScheduleView: React.FC<ScheduleViewProps> = ({
  items,
  notesCount,
  settings,
  isSyncing,
  isModalOpen,
  onOpenModal,
  onCloseModal,
  onSaveItem,
  onDeleteItem,
  onToggleTakenToday,
  onSyncAll,
  onGoToSettings,
  onTriggerTestAlert,
}) => {
  const todayIso = getTodayIso();
  const [filter, setFilter] = useState<FilterMode>('today');
  const [search, setSearch] = useState('');
  const [editingItem, setEditingItem] = useState<MedicationItem | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<ReminderType>('medication');
  const [dosageOrDetails, setDosageOrDetails] = useState('');
  const [time, setTime] = useState('08:00');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('daily');
  const [weekDays, setWeekDays] = useState<number[]>([1, 3, 5]);
  const [date, setDate] = useState(todayIso);

  const openCreateForm = () => {
    setEditingItem(null);
    setName('');
    setType('medication');
    setDosageOrDetails('');
    setTime('08:00');
    setRecurrence('daily');
    setWeekDays([1, 3, 5]);
    setDate(todayIso);
    onOpenModal();
  };

  const openEditForm = (item: MedicationItem) => {
    setEditingItem(item);
    setName(item.name);
    setType(item.type);
    setDosageOrDetails(item.dosageOrDetails);
    setTime(item.time);
    setRecurrence(item.recurrence);
    setWeekDays(item.weekDays.length ? item.weekDays : [1, 3, 5]);
    setDate(item.date || todayIso);
    onOpenModal();
  };

  // Reset form to defaults whenever modal opens in create mode (e.g. from top bar CTA)
  React.useEffect(() => {
    if (isModalOpen && !editingItem) {
      setName('');
      setType('medication');
      setDosageOrDetails('');
      setTime('08:00');
      setRecurrence('daily');
      setWeekDays([1, 3, 5]);
      setDate(todayIso);
    }
  }, [isModalOpen, editingItem, todayIso]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const payload: MedicationItem = {
      id: editingItem ? editingItem.id : `med-${Date.now()}`,
      name: name.trim(),
      type,
      dosageOrDetails: dosageOrDetails.trim(),
      time,
      recurrence,
      weekDays:
        recurrence === 'daily'
          ? [0, 1, 2, 3, 4, 5, 6]
          : recurrence === 'weekly'
          ? weekDays
          : [],
      date: date || todayIso,
      active: editingItem ? editingItem.active : true,
      takenDates: editingItem ? editingItem.takenDates : [],
      lastSyncedAt: editingItem?.lastSyncedAt,
    };

    onSaveItem(payload);
    setEditingItem(null);
    setName('');
    setDosageOrDetails('');
    onCloseModal();
  };

  const toggleWeekDay = (dayIndex: number) => {
    setWeekDays((prev) =>
      prev.includes(dayIndex)
        ? prev.length > 1
          ? prev.filter((d) => d !== dayIndex)
          : prev
        : [...prev, dayIndex].sort((a, b) => a - b)
    );
  };

  const todayItems = useMemo(() => {
    return items
      .filter((item) => isScheduledForToday(item, todayIso))
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [items, todayIso]);

  const takenTodayCount = useMemo(
    () => todayItems.filter((i) => i.takenDates.includes(todayIso)).length,
    [todayItems, todayIso]
  );

  const nextPendingToday = useMemo(() => {
    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();
    const pending = todayItems.filter((i) => !i.takenDates.includes(todayIso));
    const upcoming = pending.find((i) => {
      const [h, m] = i.time.split(':').map(Number);
      return h * 60 + m >= nowMinutes;
    });
    return upcoming || pending[0] || null;
  }, [todayItems, todayIso]);

  const filteredItems = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items
      .filter((item) => {
        if (filter === 'today' && !isScheduledForToday(item, todayIso)) {
          return false;
        }
        if (filter === 'medication' && item.type !== 'medication') return false;
        if (filter === 'appointment' && item.type !== 'appointment')
          return false;
        if (q) {
          return (
            item.name.toLowerCase().includes(q) ||
            item.dosageOrDetails.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => a.time.localeCompare(b.time));
  }, [items, filter, search, todayIso]);

  const nowHHMM = useMemo(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
  }, []);

  const isCalendarConfigured = Boolean(settings.appsScriptUrl.trim());

  return (
    <div className="space-y-6">
      {/* Summary Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Doses e Eventos Hoje</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {takenTodayCount} / {todayItems.length}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            {todayItems.length === 0
              ? 'Nenhum horário para hoje'
              : takenTodayCount === todayItems.length
              ? 'Todos concluídos hoje'
              : `${todayItems.length - takenTodayCount} pendente(s) hoje`}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Próximo Horário</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 font-mono tabular-nums truncate">
            {nextPendingToday ? nextPendingToday.time : '--:--'}
          </p>
          <p className="mt-1 text-xs text-slate-600 truncate">
            {nextPendingToday
              ? nextPendingToday.name
              : 'Sem pendências para hoje'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">Anotações Médicas</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900 font-mono tabular-nums">
            {notesCount}
          </p>
          <p className="mt-1 text-xs text-slate-500">
            Consultas, exames e receitas salvos
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 flex flex-col justify-between">
          <div>
            <p className="text-xs font-medium text-slate-500">Google Agenda</p>
            <p
              className={`mt-2 text-base font-semibold ${
                isCalendarConfigured ? 'text-emerald-700' : 'text-amber-700'
              }`}
            >
              {isCalendarConfigured ? 'Conectado via Apps Script' : 'Não configurado'}
            </p>
          </div>
          {isCalendarConfigured ? (
            <button
              type="button"
              onClick={onSyncAll}
              disabled={isSyncing}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Sincronizando...' : 'Sincronizar horários agora'}
            </button>
          ) : (
            <button
              type="button"
              onClick={onGoToSettings}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-teal-700 hover:text-teal-800 cursor-pointer"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Configurar na aba Configurações
            </button>
          )}
        </div>
      </div>

      {/* Workspace Toolbar */}
      <div className="bg-white border border-slate-200 rounded-xl">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            {(
              [
                { id: 'today', label: 'Para Hoje' },
                { id: 'all', label: 'Todos os Horários' },
                { id: 'medication', label: 'Medicamentos' },
                { id: 'appointment', label: 'Consultas e Exames' },
              ] as { id: FilterMode; label: string }[]
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar medicamento ou consulta..."
                className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
            </div>

            <button
              type="button"
              onClick={onTriggerTestAlert}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Bell className="w-3.5 h-3.5" />
              Testar Alerta
            </button>

            <button
              type="button"
              onClick={openCreateForm}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar Horário
            </button>
          </div>
        </div>

        {/* Schedule List */}
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center">
            <Clock className="w-8 h-8 text-slate-300 mx-auto" />
            <h3 className="mt-3 text-sm font-semibold text-slate-900">
              Nenhum horário encontrado
            </h3>
            <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
              Cadastre seus medicamentos diários ou consultas médicas para receber alertas no navegador e sincronizar com o Google Agenda.
            </p>
            <button
              type="button"
              onClick={openCreateForm}
              className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Cadastrar Primeiro Horário
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredItems.map((item) => {
              const isToday = isScheduledForToday(item, todayIso);
              const isTakenToday = item.takenDates.includes(todayIso);
              const isOverdue =
                isToday && !isTakenToday && item.time < nowHHMM;

              return (
                <div
                  key={item.id}
                  className="px-4 sm:px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
                >
                  <div className="flex items-start gap-4 min-w-0">
                    <div className="pt-0.5 shrink-0">
                      <span className="inline-block font-mono tabular-nums text-lg font-semibold text-slate-900">
                        {item.time}
                      </span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          className={`text-sm font-semibold ${
                            isTakenToday
                              ? 'text-slate-400 line-through'
                              : 'text-slate-900'
                          }`}
                        >
                          {item.name}
                        </h3>
                      </div>

                      {item.dosageOrDetails && (
                        <p className="mt-0.5 text-sm text-slate-600">
                          {item.dosageOrDetails}
                        </p>
                      )}

                      <div className="mt-1.5 flex items-center flex-wrap gap-x-2 gap-y-1 text-xs text-slate-500">
                        <span className="inline-flex items-center gap-1">
                          {item.type === 'appointment' ? (
                            <Stethoscope className="w-3.5 h-3.5 text-slate-400" />
                          ) : (
                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                          )}
                          {item.type === 'appointment'
                            ? 'Consulta / Exame'
                            : 'Medicamento'}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{formatRecurrence(item)}</span>
                        <span aria-hidden="true">·</span>
                        {isTakenToday ? (
                          <span className="font-medium text-emerald-700">
                            Concluído hoje
                          </span>
                        ) : isOverdue ? (
                          <span className="font-medium text-amber-700">
                            Horário passou — pendente
                          </span>
                        ) : (
                          <span>Pendente</span>
                        )}
                        {item.lastSyncedAt && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="text-teal-700">
                              Sincronizado na Agenda
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {isToday && (
                      <button
                        type="button"
                        onClick={() => onToggleTakenToday(item.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                          isTakenToday
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 hover:bg-emerald-100'
                            : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                        {isTakenToday ? 'Tomado' : 'Marcar como tomado'}
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditForm(item)}
                      aria-label={`Editar ${item.name}`}
                      className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onDeleteItem(item.id)}
                      aria-label={`Excluir ${item.name}`}
                      className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-schedule-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-lg shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2
                id="modal-schedule-title"
                className="text-base font-semibold text-slate-900"
              >
                {editingItem ? 'Editar Horário' : 'Novo Medicamento ou Lembrete'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditingItem(null);
                  onCloseModal();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-lg">
                <button
                  type="button"
                  onClick={() => setType('medication')}
                  className={`py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    type === 'medication'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Medicamento
                </button>
                <button
                  type="button"
                  onClick={() => setType('appointment')}
                  className={`py-2 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                    type === 'appointment'
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Consulta / Exame
                </button>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  {type === 'medication'
                    ? 'Nome do medicamento e dosagem'
                    : 'Título da consulta ou exame'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={
                    type === 'medication'
                      ? 'Ex.: Losartana 50 mg'
                      : 'Ex.: Retorno Cardiologista'
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Instruções ou observações
                </label>
                <input
                  type="text"
                  value={dosageOrDetails}
                  onChange={(e) => setDosageOrDetails(e.target.value)}
                  placeholder="Ex.: 1 comprimido após o almoço com água"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Horário do alerta
                  </label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Frequência
                  </label>
                  <select
                    value={recurrence}
                    onChange={(e) =>
                      setRecurrence(e.target.value as RecurrenceType)
                    }
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  >
                    <option value="daily">Todos os dias</option>
                    <option value="weekly">Dias específicos</option>
                    <option value="once">Data única</option>
                  </select>
                </div>
              </div>

              {recurrence === 'weekly' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1.5">
                    Dias da semana
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {WEEKDAY_LABELS.map((label, idx) => {
                      const active = weekDays.includes(idx);
                      return (
                        <button
                          key={label}
                          type="button"
                          onClick={() => toggleWeekDay(idx)}
                          className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
                            active
                              ? 'bg-teal-700 border-teal-700 text-white'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {recurrence === 'once' && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Data do evento
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>
              )}

              <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingItem(null);
                    onCloseModal();
                  }}
                  className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                >
                  {editingItem ? 'Salvar Alterações' : 'Salvar Horário'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
