import React, { useMemo, useState } from 'react';
import {
  Activity,
  Droplets,
  Minus,
  Plus,
  Trash2,
} from 'lucide-react';
import { HydrationState, VitalReading, VitalType } from '../types';
import { getTodayIso } from '../data/initialData';

interface VitalsTabViewProps {
  vitals: VitalReading[];
  hydration: HydrationState;
  onAddVital: (reading: VitalReading) => void;
  onDeleteVital: (id: string) => void;
  onUpdateHydration: (next: HydrationState) => void;
}

const VITAL_META: Record<
  VitalType,
  {
    label: string;
    unit: string;
    placeholder: string;
    contexts: string[];
  }
> = {
  blood_pressure: {
    label: 'Pressão Arterial',
    unit: 'mmHg',
    placeholder: '120',
    contexts: ['Em repouso (manhã)', 'Tarde', 'Noite', 'Após caminhada'],
  },
  glucose: {
    label: 'Glicemia',
    unit: 'mg/dL',
    placeholder: '95',
    contexts: ['Em jejum', 'Antes da refeição', '2h após refeição', 'Ao deitar'],
  },
  temperature: {
    label: 'Temperatura',
    unit: '°C',
    placeholder: '36.5',
    contexts: ['Axilar', 'Timpânica', 'Oral'],
  },
  heart_rate: {
    label: 'Frequência Cardíaca',
    unit: 'bpm',
    placeholder: '72',
    contexts: ['Repouso', 'Após esforço'],
  },
  oxygen: {
    label: 'Saturação (SpO₂)',
    unit: '%',
    placeholder: '98',
    contexts: ['Ar ambiente', 'Em repouso'],
  },
  weight: {
    label: 'Peso Corporal',
    unit: 'kg',
    placeholder: '70.5',
    contexts: ['Em jejum (manhã)', 'Fim do dia'],
  },
};

function classifyVital(reading: VitalReading): {
  label: string;
  className: string;
} {
  const v1 = parseFloat(reading.value.replace(',', '.'));
  const v2 = reading.secondaryValue
    ? parseFloat(reading.secondaryValue.replace(',', '.'))
    : NaN;

  if (isNaN(v1)) return { label: 'Registrado', className: 'text-slate-600' };

  switch (reading.type) {
    case 'blood_pressure': {
      if (isNaN(v2)) return { label: 'Registrado', className: 'text-slate-600' };
      if (v1 >= 140 || v2 >= 90) {
        return { label: 'Elevada', className: 'text-red-700 font-medium' };
      }
      if (v1 >= 130 || v2 >= 85) {
        return { label: 'Atenção', className: 'text-amber-700 font-medium' };
      }
      if (v1 < 90 || v2 < 60) {
        return { label: 'Baixa', className: 'text-amber-700 font-medium' };
      }
      return { label: 'Normal', className: 'text-emerald-700 font-medium' };
    }
    case 'glucose': {
      const fasting = (reading.context || '').toLowerCase().includes('jejum');
      if (v1 < 70) {
        return { label: 'Baixa (Hipo)', className: 'text-red-700 font-medium' };
      }
      if (fasting && v1 >= 126) {
        return { label: 'Elevada', className: 'text-red-700 font-medium' };
      }
      if (fasting && v1 >= 100) {
        return { label: 'Atenção', className: 'text-amber-700 font-medium' };
      }
      if (!fasting && v1 >= 180) {
        return { label: 'Elevada', className: 'text-red-700 font-medium' };
      }
      return { label: 'Normal', className: 'text-emerald-700 font-medium' };
    }
    case 'temperature': {
      if (v1 >= 37.8) {
        return { label: 'Febre', className: 'text-red-700 font-medium' };
      }
      if (v1 >= 37.3) {
        return { label: 'Estado febril', className: 'text-amber-700 font-medium' };
      }
      if (v1 < 35.5) {
        return { label: 'Baixa', className: 'text-amber-700 font-medium' };
      }
      return { label: 'Normal', className: 'text-emerald-700 font-medium' };
    }
    case 'oxygen': {
      if (v1 < 92) {
        return { label: 'Baixa — Atenção', className: 'text-red-700 font-medium' };
      }
      if (v1 < 95) {
        return { label: 'Atenção', className: 'text-amber-700 font-medium' };
      }
      return { label: 'Normal', className: 'text-emerald-700 font-medium' };
    }
    case 'heart_rate': {
      if (v1 > 100 || v1 < 50) {
        return { label: 'Atenção', className: 'text-amber-700 font-medium' };
      }
      return { label: 'Normal', className: 'text-emerald-700 font-medium' };
    }
    default:
      return { label: 'Registrado', className: 'text-slate-600' };
  }
}

function formatDateBr(isoDate: string): string {
  const [y, m, d] = isoDate.split('-');
  return y && m && d ? `${d}/${m}/${y}` : isoDate;
}

export const VitalsTabView: React.FC<VitalsTabViewProps> = ({
  vitals,
  hydration,
  onAddVital,
  onDeleteVital,
  onUpdateHydration,
}) => {
  const todayIso = getTodayIso();
  const [filterType, setFilterType] = useState<'all' | VitalType>('all');

  // Form state
  const [type, setType] = useState<VitalType>('blood_pressure');
  const [value, setValue] = useState('');
  const [secondaryValue, setSecondaryValue] = useState('');
  const [context, setContext] = useState(VITAL_META.blood_pressure.contexts[0]);
  const [date, setDate] = useState(todayIso);
  const [time, setTime] = useState(() => {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
  });
  const [notes, setNotes] = useState('');

  const handleTypeChange = (nextType: VitalType) => {
    setType(nextType);
    setValue('');
    setSecondaryValue('');
    setContext(VITAL_META[nextType].contexts[0]);
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!value.trim()) return;
    if (type === 'blood_pressure' && !secondaryValue.trim()) return;

    const reading: VitalReading = {
      id: `vital-${Date.now()}`,
      type,
      value: value.trim(),
      secondaryValue:
        type === 'blood_pressure' ? secondaryValue.trim() : undefined,
      context: context.trim() || undefined,
      date: date || todayIso,
      time: time || '08:00',
      notes: notes.trim() || undefined,
    };

    onAddVital(reading);
    setValue('');
    setSecondaryValue('');
    setNotes('');
  };

  const hydrationPercent = Math.min(
    100,
    Math.round((hydration.ml / Math.max(1, hydration.goalMl)) * 100)
  );

  const adjustWater = (deltaMl: number) => {
    onUpdateHydration({
      ...hydration,
      date: todayIso,
      ml: Math.max(0, hydration.ml + deltaMl),
    });
  };

  const filteredVitals = useMemo(() => {
    return vitals
      .filter((r) => (filterType === 'all' ? true : r.type === filterType))
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
  }, [vitals, filterType]);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Daily Hydration Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-teal-800">
              <Droplets className="w-4 h-4 text-teal-700" />
              <span>Hidratação Diária</span>
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="text-2xl font-semibold text-slate-900 font-mono tabular-nums">
                {hydration.ml} ml
              </span>
              <span className="text-sm text-slate-500 font-mono tabular-nums">
                / {hydration.goalMl} ml ({hydrationPercent}%)
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => adjustWater(-200)}
              disabled={hydration.ml <= 0}
              className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-40 cursor-pointer"
            >
              <Minus className="w-3.5 h-3.5" />
              200 ml
            </button>
            <button
              type="button"
              onClick={() => adjustWater(200)}
              className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Copo (200 ml)
            </button>
            <button
              type="button"
              onClick={() => adjustWater(350)}
              className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Garrafa (350 ml)
            </button>
            <button
              type="button"
              onClick={() => adjustWater(500)}
              className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              500 ml
            </button>
          </div>
        </div>

        <div className="mt-4 h-2.5 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-600 transition-all duration-200"
            style={{ width: `${hydrationPercent}%` }}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-500">
          <span>
            Manter boa hidratação auxilia na absorção de medicamentos e controle da pressão.
          </span>
          <label className="inline-flex items-center gap-2">
            <span>Meta diária (ml):</span>
            <input
              type="number"
              min={500}
              max={6000}
              step={100}
              value={hydration.goalMl}
              onChange={(e) =>
                onUpdateHydration({
                  ...hydration,
                  goalMl: Math.max(500, Number(e.target.value) || 2000),
                })
              }
              className="w-20 px-2 py-1 text-xs font-mono tabular-nums border border-slate-300 rounded-md text-slate-800"
            />
          </label>
        </div>
      </div>

      {/* Add Vital Reading Form */}
      <form
        onSubmit={handleAddSubmit}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-4"
      >
        <div>
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-teal-700" />
            Registrar Medição ou Sinal Vital
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Acompanhe pressão arterial, glicemia, temperatura, batimentos, oxigenação e peso.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Tipo de medição
            </label>
            <select
              value={type}
              onChange={(e) => handleTypeChange(e.target.value as VitalType)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            >
              {(Object.keys(VITAL_META) as VitalType[]).map((key) => (
                <option key={key} value={key}>
                  {VITAL_META[key].label}
                </option>
              ))}
            </select>
          </div>

          {type === 'blood_pressure' ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Sistólica / Diastólica (mmHg)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="120"
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
                <span className="text-slate-400 font-mono">/</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={secondaryValue}
                  onChange={(e) => setSecondaryValue(e.target.value)}
                  placeholder="80"
                  className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
                />
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Valor ({VITAL_META[type].unit})
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={VITAL_META[type].placeholder}
                className="w-full px-3 py-2 text-sm font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Momento / Contexto
            </label>
            <select
              value={context}
              onChange={(e) => setContext(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            >
              {VITAL_META[type].contexts.map((ctx) => (
                <option key={ctx} value={ctx}>
                  {ctx}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Data
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Hora
              </label>
              <input
                type="time"
                required
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full px-2.5 py-2 text-xs font-mono tabular-nums border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              />
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3">
          <input
            type="text"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Observação opcional (ex.: sintoma, tontura, após medicação...)"
            className="flex-1 px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
          />

          <button
            type="submit"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Registrar Medição
          </button>
        </div>
      </form>

      {/* Readings History Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="text-sm font-semibold text-slate-900">
            Histórico de Medições
          </h3>

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterType('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filterType === 'all'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Todas
            </button>
            {(Object.keys(VITAL_META) as VitalType[]).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilterType(key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filterType === key
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {VITAL_META[key].label}
              </button>
            ))}
          </div>
        </div>

        {filteredVitals.length === 0 ? (
          <div className="p-10 text-center">
            <Activity className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="mt-3 text-sm font-semibold text-slate-900">
              Nenhuma medição registrada
            </p>
            <p className="mt-1 text-xs text-slate-500">
              Use o formulário acima para registrar pressão, glicemia, temperatura ou peso.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {filteredVitals.map((r) => {
              const meta = VITAL_META[r.type];
              const status = classifyVital(r);
              const displayValue =
                r.type === 'blood_pressure' && r.secondaryValue
                  ? `${r.value}/${r.secondaryValue} ${meta.unit}`
                  : `${r.value} ${meta.unit}`;

              return (
                <div
                  key={r.id}
                  className="px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70"
                >
                  <div className="min-w-0">
                    <div className="flex items-center flex-wrap gap-2">
                      <span className="text-sm font-semibold text-slate-900">
                        {meta.label}
                      </span>
                      <span className="font-mono tabular-nums text-sm font-semibold text-teal-800">
                        {displayValue}
                      </span>
                      <span aria-hidden="true" className="text-slate-300">
                        ·
                      </span>
                      <span className={`text-xs ${status.className}`}>
                        {status.label}
                      </span>
                    </div>

                    <div className="mt-1 flex items-center flex-wrap gap-x-2 gap-y-0.5 text-xs text-slate-500">
                      <span className="font-mono tabular-nums">
                        {formatDateBr(r.date)} às {r.time}
                      </span>
                      {r.context && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{r.context}</span>
                        </>
                      )}
                      {r.notes && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span className="text-slate-600">{r.notes}</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onDeleteVital(r.id)}
                    aria-label="Excluir medição"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg self-end sm:self-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
