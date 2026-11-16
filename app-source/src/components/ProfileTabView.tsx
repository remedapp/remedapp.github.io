import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Plus,
  Printer,
  Save,
  Trash2,
  UserCheck,
} from 'lucide-react';
import { ForbiddenMedication, UserHealthProfile } from '../types';

interface ProfileTabViewProps {
  profile: UserHealthProfile;
  onSaveProfile: (next: UserHealthProfile) => void;
}

const BLOOD_TYPES = [
  'Não informado',
  'A+',
  'A-',
  'B+',
  'B-',
  'AB+',
  'AB-',
  'O+',
  'O-',
];

function calculateAge(birthDate: string): number | null {
  if (!birthDate) return null;
  const parts = birthDate.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  const [y, m, d] = parts;
  const today = new Date();
  let age = today.getFullYear() - y;
  const monthDiff = today.getMonth() + 1 - m;
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < d)) {
    age--;
  }
  return age >= 0 && age < 130 ? age : null;
}

export const ProfileTabView: React.FC<ProfileTabViewProps> = ({
  profile,
  onSaveProfile,
}) => {
  const [draft, setDraft] = useState<UserHealthProfile>(profile);
  const [newMedName, setNewMedName] = useState('');
  const [newMedReason, setNewMedReason] = useState('');
  const [savedNotice, setSavedNotice] = useState(false);

  React.useEffect(() => {
    setDraft(profile);
  }, [profile]);

  const age = useMemo(() => calculateAge(draft.birthDate), [draft.birthDate]);

  const handleFieldChange = <K extends keyof UserHealthProfile>(
    field: K,
    value: UserHealthProfile[K]
  ) => {
    setDraft((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddForbiddenMed = () => {
    const trimmedName = newMedName.trim();
    if (!trimmedName) return;

    const entry: ForbiddenMedication = {
      id: `forb-${Date.now()}`,
      name: trimmedName,
      reason: newMedReason.trim(),
    };

    const nextProfile: UserHealthProfile = {
      ...draft,
      forbiddenMedications: [...draft.forbiddenMedications, entry],
      updatedAt: new Date().toISOString(),
    };
    setDraft(nextProfile);
    onSaveProfile(nextProfile);
    setNewMedName('');
    setNewMedReason('');
  };

  const handleRemoveForbiddenMed = (id: string) => {
    const nextProfile: UserHealthProfile = {
      ...draft,
      forbiddenMedications: draft.forbiddenMedications.filter(
        (m) => m.id !== id
      ),
      updatedAt: new Date().toISOString(),
    };
    setDraft(nextProfile);
    onSaveProfile(nextProfile);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: UserHealthProfile = {
      ...draft,
      updatedAt: new Date().toISOString(),
    };
    setDraft(updated);
    onSaveProfile(updated);
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-5xl">
      {/* Header Summary Strip */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <UserCheck className="w-3.5 h-3.5 text-teal-700" />
            <span>Ficha Pessoal de Saúde · Salva localmente no dispositivo</span>
          </div>
          <h2 className="mt-1.5 text-lg font-semibold text-slate-900">
            {draft.fullName.trim() || 'Dados Pessoais & Restrições Médicas'}
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Mantenha tipo sanguíneo, medicamentos contraindicados, alergias e contatos de emergência sempre prontos para consultas ou atendimentos.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0 no-print">
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir Ficha
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" />
            Salvar Dados
          </button>
        </div>
      </div>

      {/* Quick Clinical Snapshot */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Tipo Sanguíneo</p>
          <p className="mt-1.5 text-xl font-semibold text-slate-900 font-mono tabular-nums">
            {draft.bloodType}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">Idade</p>
          <p className="mt-1.5 text-xl font-semibold text-slate-900 font-mono tabular-nums">
            {age !== null ? `${age} anos` : '—'}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4">
          <p className="text-xs font-medium text-slate-500">
            Remédios Contraindicados
          </p>
          <p
            className={`mt-1.5 text-xl font-semibold font-mono tabular-nums ${
              draft.forbiddenMedications.length > 0
                ? 'text-red-700'
                : 'text-slate-900'
            }`}
          >
            {draft.forbiddenMedications.length}
          </p>
        </div>
      </div>

      {/* Section 1: Identificação & Dados Clínicos */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            01. Identificação e Dados Básicos
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Informações essenciais para identificação e prontuário rápido.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nome completo
            </label>
            <input
              type="text"
              value={draft.fullName}
              onChange={(e) => handleFieldChange('fullName', e.target.value)}
              placeholder="Seu nome completo"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Data de nascimento
            </label>
            <input
              type="date"
              value={draft.birthDate}
              onChange={(e) => handleFieldChange('birthDate', e.target.value)}
              className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tipo sanguíneo
            </label>
            <select
              value={draft.bloodType}
              onChange={(e) => handleFieldChange('bloodType', e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            >
              {BLOOD_TYPES.map((bt) => (
                <option key={bt} value={bt}>
                  {bt}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Peso (kg)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={draft.weightKg}
              onChange={(e) => handleFieldChange('weightKg', e.target.value)}
              placeholder="Ex.: 72"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Altura (cm)
            </label>
            <input
              type="text"
              inputMode="numeric"
              value={draft.heightCm}
              onChange={(e) => handleFieldChange('heightCm', e.target.value)}
              placeholder="Ex.: 175"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Cartão SUS / Convênio
            </label>
            <input
              type="text"
              value={draft.healthPlanOrSus}
              onChange={(e) =>
                handleFieldChange('healthPlanOrSus', e.target.value)
              }
              placeholder="Número ou operadora"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>
        </div>
      </div>

      {/* Section 2: Remédios que NÃO pode tomar & Alergias */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
              02. Remédios que NÃO pode tomar e Alergias
            </h3>
            <p className="mt-0.5 text-xs text-slate-500">
              Liste medicamentos contraindicados, alergias medicamentosas ou substâncias a evitar.
            </p>
          </div>
        </div>

        {/* Add Forbidden Medication Inline Row */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end no-print">
          <div className="md:col-span-5">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nome do medicamento / princípio ativo
            </label>
            <input
              type="text"
              value={newMedName}
              onChange={(e) => setNewMedName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddForbiddenMed();
                }
              }}
              placeholder="Ex.: Dipirona, AAS, Penicilina..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          <div className="md:col-span-5">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Motivo ou reação observada
            </label>
            <input
              type="text"
              value={newMedReason}
              onChange={(e) => setNewMedReason(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddForbiddenMed();
                }
              }}
              placeholder="Ex.: Alergia cutânea, falta de ar, gastrite..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          <div className="md:col-span-2">
            <button
              type="button"
              onClick={handleAddForbiddenMed}
              disabled={!newMedName.trim()}
              className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-slate-900 hover:bg-slate-800 rounded-lg disabled:opacity-40 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Adicionar
            </button>
          </div>
        </div>

        {/* Forbidden Medications List */}
        {draft.forbiddenMedications.length === 0 ? (
          <p className="text-sm text-slate-500 py-2">
            Nenhum medicamento contraindicado cadastrado até o momento.
          </p>
        ) : (
          <div className="border border-red-200 bg-red-50/40 rounded-lg divide-y divide-red-100">
            {draft.forbiddenMedications.map((item) => (
              <div
                key={item.id}
                className="px-4 py-3 flex items-center justify-between gap-4"
              >
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-red-900">
                    {item.name}
                  </p>
                  {item.reason && (
                    <p className="text-xs text-red-800 mt-0.5">{item.reason}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveForbiddenMed(item.id)}
                  aria-label={`Remover ${item.name}`}
                  className="no-print p-1.5 text-red-600 hover:bg-red-100 rounded-lg cursor-pointer shrink-0"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Outras alergias (alimentos, látex, contraste, poeira...)
            </label>
            <textarea
              rows={3}
              value={draft.otherAllergies}
              onChange={(e) =>
                handleFieldChange('otherAllergies', e.target.value)
              }
              placeholder="Ex.: Alergia a frutos do mar e contraste iodado"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Condições crônicas / histórico clínico
            </label>
            <textarea
              rows={3}
              value={draft.chronicConditions}
              onChange={(e) =>
                handleFieldChange('chronicConditions', e.target.value)
              }
              placeholder="Ex.: Hipertensão arterial, asma leve, histórico cirúrgico..."
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>
        </div>
      </div>

      {/* Section 3: Contatos de Emergência & Observações */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-5">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            03. Contatos de Emergência e Médico de Referência
          </h3>
          <p className="mt-0.5 text-xs text-slate-500">
            Para acionamento rápido em situações de urgência.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Contato de emergência (Nome)
            </label>
            <input
              type="text"
              value={draft.emergencyContactName}
              onChange={(e) =>
                handleFieldChange('emergencyContactName', e.target.value)
              }
              placeholder="Ex.: Maria Silva"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Parentesco / Relação
            </label>
            <input
              type="text"
              value={draft.emergencyContactRelation}
              onChange={(e) =>
                handleFieldChange('emergencyContactRelation', e.target.value)
              }
              placeholder="Ex.: Cônjuge, Filho(a), Mãe"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Telefone de emergência
            </label>
            <input
              type="tel"
              value={draft.emergencyContactPhone}
              onChange={(e) =>
                handleFieldChange('emergencyContactPhone', e.target.value)
              }
              placeholder="(11) 99999-9999"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Médico de referência
            </label>
            <input
              type="text"
              value={draft.primaryDoctor}
              onChange={(e) =>
                handleFieldChange('primaryDoctor', e.target.value)
              }
              placeholder="Ex.: Dr. Ricardo Mendes — Cardiologia"
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Telefone do consultório / clínica
            </label>
            <input
              type="tel"
              value={draft.primaryDoctorPhone}
              onChange={(e) =>
                handleFieldChange('primaryDoctorPhone', e.target.value)
              }
              placeholder="(11) 3333-4444"
              className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-slate-700 mb-1">
            Observações adicionais importantes
          </label>
          <textarea
            rows={3}
            value={draft.generalNotes}
            onChange={(e) => handleFieldChange('generalNotes', e.target.value)}
            placeholder="Ex.: Doador de órgãos, uso de prótese/marcapasso, restrições alimentares..."
            className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
          />
        </div>

        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-4 no-print">
          <div className="text-xs text-slate-500">
            {draft.updatedAt
              ? `Última atualização: ${new Date(
                  draft.updatedAt
                ).toLocaleString('pt-BR')}`
              : 'Os dados ficam armazenados apenas no seu navegador.'}
          </div>

          <div className="flex items-center gap-3">
            {savedNotice && (
              <span className="text-xs font-medium text-emerald-700">
                Dados salvos com sucesso!
              </span>
            )}
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              Salvar Dados Pessoais
            </button>
          </div>
        </div>
      </div>
    </form>
  );
};
