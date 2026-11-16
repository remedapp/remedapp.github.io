import React, { useMemo, useState } from 'react';
import {
  CalendarPlus,
  FileText,
  Pencil,
  Plus,
  Printer,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import { MedicalNote, NoteCategory, NoteStatus } from '../types';
import { getTodayIso } from '../data/initialData';

interface MedicalNotesViewProps {
  notes: MedicalNote[];
  isModalOpen: boolean;
  onOpenModal: () => void;
  onCloseModal: () => void;
  onSaveNote: (note: MedicalNote) => void;
  onDeleteNote: (id: string) => void;
  onCreateFollowUpReminder: (note: MedicalNote) => void;
}

const CATEGORIES: NoteCategory[] = [
  'Consulta',
  'Exame',
  'Receita',
  'Sintoma',
  'Orientação',
];

const STATUSES: NoteStatus[] = ['Ativo', 'Aguardando Retorno', 'Arquivado'];

function formatDateBr(isoDate?: string): string {
  if (!isoDate) return '';
  const [y, m, d] = isoDate.split('-');
  if (!y || !m || !d) return isoDate;
  return `${d}/${m}/${y}`;
}

export const MedicalNotesView: React.FC<MedicalNotesViewProps> = ({
  notes,
  isModalOpen,
  onOpenModal,
  onCloseModal,
  onSaveNote,
  onDeleteNote,
  onCreateFollowUpReminder,
}) => {
  const todayIso = getTodayIso();
  const [categoryFilter, setCategoryFilter] = useState<'Todas' | NoteCategory>(
    'Todas'
  );
  const [search, setSearch] = useState('');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(
    notes[0]?.id ?? null
  );
  const [editingNote, setEditingNote] = useState<MedicalNote | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<NoteCategory>('Consulta');
  const [date, setDate] = useState(todayIso);
  const [doctorOrLocation, setDoctorOrLocation] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [content, setContent] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpTime, setFollowUpTime] = useState('09:00');
  const [status, setStatus] = useState<NoteStatus>('Ativo');

  const filteredNotes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notes
      .filter((note) => {
        if (categoryFilter !== 'Todas' && note.category !== categoryFilter) {
          return false;
        }
        if (q) {
          return (
            note.title.toLowerCase().includes(q) ||
            note.content.toLowerCase().includes(q) ||
            note.doctorOrLocation.toLowerCase().includes(q) ||
            note.specialty.toLowerCase().includes(q)
          );
        }
        return true;
      })
      .sort((a, b) => b.date.localeCompare(a.date));
  }, [notes, categoryFilter, search]);

  const activeNote = useMemo(() => {
    return (
      filteredNotes.find((n) => n.id === selectedNoteId) ||
      filteredNotes[0] ||
      null
    );
  }, [filteredNotes, selectedNoteId]);

  const openCreateForm = () => {
    setEditingNote(null);
    setTitle('');
    setCategory('Consulta');
    setDate(todayIso);
    setDoctorOrLocation('');
    setSpecialty('');
    setContent('');
    setFollowUpDate('');
    setFollowUpTime('09:00');
    setStatus('Ativo');
    onOpenModal();
  };

  const openEditForm = (note: MedicalNote) => {
    setEditingNote(note);
    setTitle(note.title);
    setCategory(note.category);
    setDate(note.date);
    setDoctorOrLocation(note.doctorOrLocation);
    setSpecialty(note.specialty);
    setContent(note.content);
    setFollowUpDate(note.followUpDate || '');
    setFollowUpTime(note.followUpTime || '09:00');
    setStatus(note.status);
    onOpenModal();
  };

  React.useEffect(() => {
    if (isModalOpen && !editingNote) {
      setTitle('');
      setCategory('Consulta');
      setDate(todayIso);
      setDoctorOrLocation('');
      setSpecialty('');
      setContent('');
      setFollowUpDate('');
      setFollowUpTime('09:00');
      setStatus('Ativo');
    }
  }, [isModalOpen, editingNote, todayIso]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    const newNote: MedicalNote = {
      id: editingNote ? editingNote.id : `note-${Date.now()}`,
      title: title.trim(),
      category,
      date: date || todayIso,
      doctorOrLocation: doctorOrLocation.trim(),
      specialty: specialty.trim(),
      content: content.trim(),
      followUpDate: followUpDate || undefined,
      followUpTime: followUpDate ? followUpTime || '09:00' : undefined,
      status,
      updatedAt: new Date().toISOString(),
    };

    onSaveNote(newNote);
    setSelectedNoteId(newNote.id);
    setEditingNote(null);
    onCloseModal();
  };

  return (
    <div className="space-y-5">
      {/* Filter & Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 no-print">
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
          {(['Todas', ...CATEGORIES] as const).map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                categoryFilter === cat
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {cat}
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
              placeholder="Buscar médico, exame, sintoma..."
              className="w-full sm:w-64 pl-9 pr-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          <button
            type="button"
            onClick={openCreateForm}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Nova Anotação Médica
          </button>
        </div>
      </div>

      {/* Master-Detail Workspace */}
      {filteredNotes.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <FileText className="w-8 h-8 text-slate-300 mx-auto" />
          <h3 className="mt-3 text-sm font-semibold text-slate-900">
            Nenhuma anotação médica encontrada
          </h3>
          <p className="mt-1 text-sm text-slate-500 max-w-md mx-auto">
            Registre orientações de consultas, resultados de exames, receitas médicas e sintomas para manter seu histórico sempre à mão.
          </p>
          <button
            type="button"
            onClick={openCreateForm}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Criar Primeira Anotação
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column: Notes List */}
          <div className="lg:col-span-5 bg-white border border-slate-200 rounded-xl divide-y divide-slate-200 overflow-hidden no-print">
            {filteredNotes.map((note) => {
              const isSelected = activeNote?.id === note.id;
              return (
                <button
                  key={note.id}
                  type="button"
                  onClick={() => setSelectedNoteId(note.id)}
                  className={`w-full text-left p-4 transition-colors cursor-pointer block ${
                    isSelected
                      ? 'bg-teal-50/70'
                      : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                    <span className="font-medium text-teal-800">
                      {note.category}
                    </span>
                    <span className="font-mono tabular-nums">
                      {formatDateBr(note.date)}
                    </span>
                  </div>
                  <h3 className="mt-1 text-sm font-semibold text-slate-900 line-clamp-1">
                    {note.title}
                  </h3>
                  {(note.doctorOrLocation || note.specialty) && (
                    <p className="mt-1 text-xs text-slate-500 line-clamp-1">
                      {[note.doctorOrLocation, note.specialty]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                  <p className="mt-1.5 text-xs text-slate-600 line-clamp-2">
                    {note.content}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Right Column: Active Note Detail */}
          {activeNote && (
            <div className="lg:col-span-7 bg-white border border-slate-200 rounded-xl p-6 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-slate-200">
                <div>
                  <div className="flex items-center flex-wrap gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-teal-800">
                      {activeNote.category}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span className="font-mono tabular-nums">
                      {formatDateBr(activeNote.date)}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span
                      className={
                        activeNote.status === 'Aguardando Retorno'
                          ? 'text-amber-700 font-medium'
                          : activeNote.status === 'Ativo'
                          ? 'text-emerald-700 font-medium'
                          : 'text-slate-500'
                      }
                    >
                      {activeNote.status}
                    </span>
                  </div>

                  <h2 className="mt-2 text-xl font-semibold text-slate-900 text-balance">
                    {activeNote.title}
                  </h2>

                  {(activeNote.doctorOrLocation || activeNote.specialty) && (
                    <p className="mt-1 text-sm text-slate-600">
                      {[activeNote.doctorOrLocation, activeNote.specialty]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 no-print">
                  <button
                    type="button"
                    onClick={() => window.print()}
                    title="Imprimir ou salvar PDF"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    Imprimir
                  </button>

                  <button
                    type="button"
                    onClick={() => openEditForm(activeNote)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Editar
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onDeleteNote(activeNote.id);
                      setSelectedNoteId(null);
                    }}
                    aria-label="Excluir anotação"
                    className="p-2 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="py-5">
                <div className="text-sm text-slate-800 leading-relaxed whitespace-pre-line">
                  {activeNote.content}
                </div>
              </div>

              {activeNote.followUpDate && (
                <div className="mt-2 pt-5 border-t border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-medium text-slate-500">
                      Retorno / Próximo Compromisso
                    </p>
                    <p className="mt-0.5 text-sm font-semibold text-slate-900 font-mono tabular-nums">
                      {formatDateBr(activeNote.followUpDate)} às{' '}
                      {activeNote.followUpTime || '09:00'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => onCreateFollowUpReminder(activeNote)}
                    className="no-print inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Agendar Retorno & Notificar
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Create / Edit Note Modal */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-900/40 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="modal-note-title"
        >
          <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl shadow-xl overflow-hidden max-h-[92vh] flex flex-col">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between shrink-0">
              <h2
                id="modal-note-title"
                className="text-base font-semibold text-slate-900"
              >
                {editingNote ? 'Editar Anotação Médica' : 'Nova Anotação Médica'}
              </h2>
              <button
                type="button"
                onClick={() => {
                  setEditingNote(null);
                  onCloseModal();
                }}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={handleSubmit}
              className="p-6 space-y-4 overflow-y-auto"
            >
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Título da anotação
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex.: Consulta Cardiologia — Ajuste de medicação"
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as NoteCategory)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Data
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Situação
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as NoteStatus)}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  >
                    {STATUSES.map((st) => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Médico / Clínica / Laboratório
                  </label>
                  <input
                    type="text"
                    value={doctorOrLocation}
                    onChange={(e) => setDoctorOrLocation(e.target.value)}
                    placeholder="Ex.: Dr. Ricardo Mendes · Hospital Santa Cruz"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Especialidade
                  </label>
                  <input
                    type="text"
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                    placeholder="Ex.: Cardiologia, Endocrinologia..."
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Anotações clínicas, resultados ou orientações
                </label>
                <textarea
                  required
                  rows={6}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Descreva sintomas, pressão arterial, orientações passadas pelo médico, dosagens ou observações de exames..."
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Data de retorno (opcional)
                  </label>
                  <input
                    type="date"
                    value={followUpDate}
                    onChange={(e) => setFollowUpDate(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Horário do retorno
                  </label>
                  <input
                    type="time"
                    value={followUpTime}
                    disabled={!followUpDate}
                    onChange={(e) => setFollowUpTime(e.target.value)}
                    className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg disabled:bg-slate-100 disabled:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setEditingNote(null);
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
                  {editingNote ? 'Salvar Alterações' : 'Salvar Anotação'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
