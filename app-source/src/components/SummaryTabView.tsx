import React, { useMemo, useState } from 'react';
import { Check, Copy, Printer, ShieldAlert } from 'lucide-react';
import {
  MedicalNote,
  MedicationItem,
  UserHealthProfile,
  VitalReading,
} from '../types';

interface SummaryTabViewProps {
  profile: UserHealthProfile;
  medications: MedicationItem[];
  notes: MedicalNote[];
  vitals: VitalReading[];
}

function formatDateBr(isoDate?: string): string {
  if (!isoDate) return '—';
  const [y, m, d] = isoDate.split('-');
  return y && m && d ? `${d}/${m}/${y}` : isoDate;
}

export const SummaryTabView: React.FC<SummaryTabViewProps> = ({
  profile,
  medications,
  notes,
  vitals,
}) => {
  const [copied, setCopied] = useState(false);

  const activeMeds = useMemo(
    () =>
      medications
        .filter((m) => m.active && m.type === 'medication')
        .sort((a, b) => a.time.localeCompare(b.time)),
    [medications]
  );

  const recentVitals = useMemo(
    () =>
      [...vitals]
        .sort((a, b) =>
          `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`)
        )
        .slice(0, 6),
    [vitals]
  );

  const activeNotes = useMemo(
    () => notes.filter((n) => n.status !== 'Arquivado').slice(0, 5),
    [notes]
  );

  const buildPlainTextSummary = () => {
    const lines: string[] = [
      '=== RESUMO DE SAÚDE — REMEDAPP ===',
      `Nome: ${profile.fullName || 'Não informado'}`,
      `Tipo Sanguíneo: ${profile.bloodType}`,
      `Nascimento: ${formatDateBr(profile.birthDate)}`,
      profile.healthPlanOrSus
        ? `Convênio / SUS: ${profile.healthPlanOrSus}`
        : '',
      '',
      '--- REMÉDIOS QUE NÃO PODE TOMAR / ALERGIAS ---',
      ...(profile.forbiddenMedications.length > 0
        ? profile.forbiddenMedications.map(
            (f) => `- ${f.name}${f.reason ? ` (${f.reason})` : ''}`
          )
        : ['- Nenhum informado']),
      profile.otherAllergies ? `Outras alergias: ${profile.otherAllergies}` : '',
      profile.chronicConditions
        ? `Condições crônicas: ${profile.chronicConditions}`
        : '',
      '',
      '--- MEDICAMENTOS EM USO ---',
      ...(activeMeds.length > 0
        ? activeMeds.map(
            (m) =>
              `- ${m.time} | ${m.name}${
                m.dosageOrDetails ? ` — ${m.dosageOrDetails}` : ''
              }`
          )
        : ['- Nenhum medicamento ativo']),
      '',
      '--- CONTATO DE EMERGÊNCIA ---',
      profile.emergencyContactName
        ? `${profile.emergencyContactName} (${
            profile.emergencyContactRelation || 'Contato'
          }) — ${profile.emergencyContactPhone || 'Sem telefone'}`
        : 'Não informado',
    ];
    return lines.filter((l) => l !== '').join('\n');
  };

  const handleCopySummary = async () => {
    const text = buildPlainTextSummary();
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Top Action Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 no-print">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Resumo Completo para Consulta & Emergência
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            Reúne automaticamente seus dados pessoais, medicamentos proibidos, horários em uso e últimas medições para mostrar ao médico ou imprimir.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleCopySummary}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg cursor-pointer whitespace-nowrap"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Copiado!
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                Copiar Texto
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer whitespace-nowrap"
          >
            <Printer className="w-3.5 h-3.5" />
            Imprimir / PDF
          </button>
        </div>
      </div>

      {/* Printable Clinical Sheet */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 sm:p-8 space-y-6">
        <div className="border-b border-slate-200 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold text-teal-800">
              Ficha Clínica Resumida · RemedApp
            </p>
            <h3 className="mt-1 text-xl font-semibold text-slate-900">
              {profile.fullName.trim() || 'Paciente (Nome não preenchido)'}
            </h3>
          </div>

          <div className="text-xs text-slate-600 sm:text-right font-mono tabular-nums space-y-0.5">
            <p>
              Tipo Sanguíneo:{' '}
              <strong className="text-slate-900">{profile.bloodType}</strong>
            </p>
            <p>Nascimento: {formatDateBr(profile.birthDate)}</p>
            {profile.healthPlanOrSus && <p>SUS/Plano: {profile.healthPlanOrSus}</p>}
          </div>
        </div>

        {/* Forbidden Medications Alert Block */}
        <div className="border border-red-200 bg-red-50/50 rounded-xl p-5">
          <h4 className="text-sm font-semibold text-red-900 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-700 shrink-0" />
            Medicamentos que NÃO pode tomar e Alergias
          </h4>

          {profile.forbiddenMedications.length === 0 && !profile.otherAllergies ? (
            <p className="mt-2 text-xs text-red-800">
              Nenhuma alergia ou medicamento contraindicado informado na aba Meus Dados.
            </p>
          ) : (
            <ul className="mt-2.5 space-y-1.5 text-sm text-red-950">
              {profile.forbiddenMedications.map((f) => (
                <li key={f.id}>
                  <strong>{f.name}</strong>
                  {f.reason ? ` — ${f.reason}` : ''}
                </li>
              ))}
              {profile.otherAllergies && (
                <li className="pt-1 text-xs text-red-900">
                  <strong>Outras alergias:</strong> {profile.otherAllergies}
                </li>
              )}
            </ul>
          )}
        </div>

        {/* Chronic Conditions & Emergency Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Condições Crônicas / Observações
            </h4>
            <p className="mt-2 text-sm text-slate-800 whitespace-pre-line">
              {profile.chronicConditions || 'Nenhuma condição informada.'}
            </p>
            {profile.generalNotes && (
              <p className="mt-2 text-xs text-slate-600 whitespace-pre-line">
                {profile.generalNotes}
              </p>
            )}
          </div>

          <div>
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Emergência e Médico de Referência
            </h4>
            <div className="mt-2 space-y-1.5 text-sm text-slate-800">
              <p>
                <strong>Contato:</strong>{' '}
                {profile.emergencyContactName
                  ? `${profile.emergencyContactName}${
                      profile.emergencyContactRelation
                        ? ` (${profile.emergencyContactRelation})`
                        : ''
                    } · ${profile.emergencyContactPhone || 'Sem telefone'}`
                  : 'Não informado'}
              </p>
              <p>
                <strong>Médico:</strong>{' '}
                {profile.primaryDoctor
                  ? `${profile.primaryDoctor}${
                      profile.primaryDoctorPhone
                        ? ` · ${profile.primaryDoctorPhone}`
                        : ''
                    }`
                  : 'Não informado'}
              </p>
            </div>
          </div>
        </div>

        {/* Active Medications */}
        <div className="pt-5 border-t border-slate-200">
          <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Medicamentos em Uso ({activeMeds.length})
          </h4>
          {activeMeds.length === 0 ? (
            <p className="mt-2 text-sm text-slate-500">
              Nenhum medicamento ativo cadastrado.
            </p>
          ) : (
            <ul className="mt-3 divide-y divide-slate-100">
              {activeMeds.map((m) => (
                <li
                  key={m.id}
                  className="py-2 flex items-baseline justify-between gap-4 text-sm"
                >
                  <span>
                    <strong className="text-slate-900">{m.name}</strong>
                    {m.dosageOrDetails && (
                      <span className="text-slate-600">
                        {' '}
                        — {m.dosageOrDetails}
                      </span>
                    )}
                  </span>
                  <span className="font-mono tabular-nums text-xs font-semibold text-slate-700 shrink-0">
                    {m.time}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Vitals */}
        {recentVitals.length > 0 && (
          <div className="pt-5 border-t border-slate-200">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Últimas Medições Registradas
            </h4>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recentVitals.map((v) => {
                const label =
                  v.type === 'blood_pressure'
                    ? 'Pressão Arterial'
                    : v.type === 'glucose'
                    ? 'Glicemia'
                    : v.type === 'temperature'
                    ? 'Temperatura'
                    : v.type === 'heart_rate'
                    ? 'Freq. Cardíaca'
                    : v.type === 'oxygen'
                    ? 'Saturação SpO₂'
                    : 'Peso';
                const val =
                  v.type === 'blood_pressure' && v.secondaryValue
                    ? `${v.value}/${v.secondaryValue} mmHg`
                    : v.type === 'glucose'
                    ? `${v.value} mg/dL`
                    : v.type === 'temperature'
                    ? `${v.value} °C`
                    : v.type === 'heart_rate'
                    ? `${v.value} bpm`
                    : v.type === 'oxygen'
                    ? `${v.value}%`
                    : `${v.value} kg`;

                return (
                  <div
                    key={v.id}
                    className="border border-slate-200 rounded-lg px-3.5 py-2.5 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{label}</p>
                      <p className="text-slate-500 font-mono tabular-nums">
                        {formatDateBr(v.date)} {v.time}
                      </p>
                    </div>
                    <span className="font-mono tabular-nums text-sm font-semibold text-teal-800">
                      {val}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Active Medical Notes */}
        {activeNotes.length > 0 && (
          <div className="pt-5 border-t border-slate-200">
            <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Anotações Médicas Recentes
            </h4>
            <ul className="mt-3 space-y-2 text-sm">
              {activeNotes.map((n) => (
                <li key={n.id} className="text-slate-700">
                  <span className="font-mono tabular-nums text-xs text-slate-500 mr-2">
                    {formatDateBr(n.date)}
                  </span>
                  <strong className="text-slate-900">{n.title}</strong>
                  {n.doctorOrLocation ? ` · ${n.doctorOrLocation}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
