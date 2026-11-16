import {
  AppSettings,
  HydrationState,
  MedicalNote,
  MedicationItem,
  SyncLogEntry,
  UserHealthProfile,
  VitalReading,
} from '../types';

export function getTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getTomorrowIso(): string {
  const now = new Date();
  now.setDate(now.getDate() + 1);
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

const TODAY = getTodayIso();

export const DEFAULT_MEDICATIONS: MedicationItem[] = [
  {
    id: 'med-1',
    name: 'Losartana Potássica 50 mg',
    type: 'medication',
    dosageOrDetails: '1 comprimido pela manhã, antes do café',
    time: '08:00',
    recurrence: 'daily',
    weekDays: [0, 1, 2, 3, 4, 5, 6],
    date: TODAY,
    active: true,
    takenDates: [TODAY],
  },
  {
    id: 'med-2',
    name: 'Vitamina D3 2.000 UI',
    type: 'medication',
    dosageOrDetails: '1 cápsula após o almoço (melhor absorção com refeição)',
    time: '13:00',
    recurrence: 'daily',
    weekDays: [0, 1, 2, 3, 4, 5, 6],
    date: TODAY,
    active: true,
    takenDates: [],
  },
  {
    id: 'med-3',
    name: 'Metformina XR 500 mg',
    type: 'medication',
    dosageOrDetails: '1 comprimido junto com o jantar',
    time: '20:00',
    recurrence: 'daily',
    weekDays: [0, 1, 2, 3, 4, 5, 6],
    date: TODAY,
    active: true,
    takenDates: [],
  },
  {
    id: 'med-4',
    name: 'Retorno Cardiologia — Dr. Ricardo Mendes',
    type: 'appointment',
    dosageOrDetails: 'Levar resultados de hemograma, perfil lipídico e mapa de pressão',
    time: '10:30',
    recurrence: 'once',
    weekDays: [],
    date: getTomorrowIso(),
    active: true,
    takenDates: [],
  },
];

export const DEFAULT_MEDICAL_NOTES: MedicalNote[] = [
  {
    id: 'note-1',
    title: 'Consulta de Rotina — Avaliação Cardiovascular',
    category: 'Consulta',
    date: TODAY,
    doctorOrLocation: 'Dr. Ricardo Mendes · Clínica São Lucas',
    specialty: 'Cardiologia',
    content:
      'Pressão arterial aferida no consultório: 124/78 mmHg.\nFrequência cardíaca: 70 bpm em repouso.\n\nOrientações passadas pelo médico:\n- Manter Losartana 50 mg às 08:00 diariamente.\n- Reduzir consumo de sódio nas refeições noturnas.\n- Caminhada leve de 30 minutos pelo menos 4 vezes na semana.\n- Registrar episódios de tontura ou dor de cabeça para o próximo retorno.',
    followUpDate: getTomorrowIso(),
    followUpTime: '10:30',
    status: 'Aguardando Retorno',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-2',
    title: 'Resultado de Exames Laboratoriais (Jejum 12h)',
    category: 'Exame',
    date: TODAY,
    doctorOrLocation: 'Laboratório Fleury · Unidade Centro',
    specialty: 'Clínica Médica',
    content:
      'Principais marcadores observados:\n- Hemoglobina Glicada (HbA1c): 5,8%\n- Glicemia em jejum: 96 mg/dL\n- Vitamina D (25-OH): 28 ng/mL (iniciada suplementação com 2.000 UI/dia)\n- Colesterol LDL: 108 mg/dL\n- Creatinina: 0,92 mg/dL\n\nObservação: Levar cópia impressa na próxima consulta para comparação com o exame anterior.',
    status: 'Ativo',
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'note-3',
    title: 'Receita Atualizada — Uso Contínuo',
    category: 'Receita',
    date: TODAY,
    doctorOrLocation: 'Dra. Camila Nogueira · UBS Jardim Paulista',
    specialty: 'Endocrinologia',
    content:
      'Prescrição válida por 6 meses (receita simples em 2 vias):\n1. Metformina XR 500 mg — 1 comprimido ao dia no jantar.\n2. Colecalciferol (Vitamina D3) 2.000 UI — 1 cápsula após o almoço.\n\nRenovação prevista da receita em 90 dias.',
    status: 'Ativo',
    updatedAt: new Date().toISOString(),
  },
];

export const DEFAULT_SETTINGS: AppSettings = {
  appsScriptUrl: '',
  reminderMinutesBefore: 5,
  enablePopupReminder: true,
  enableEmailReminder: false,
  autoSyncOnSave: true,
  enableBrowserNotifications: true,
  enableSoundAlert: true,
  patientName: 'Meu Acompanhamento',
  useSampleData: true,
};

const STORAGE_KEYS = {
  medications: 'medagenda_medications_v1',
  notes: 'medagenda_notes_v1',
  settings: 'medagenda_settings_v1',
  logs: 'medagenda_sync_logs_v1',
  profile: 'medagenda_health_profile_v1',
  vitals: 'remedapp_vitals_v1',
  hydration: 'remedapp_hydration_v1',
};

export const SAMPLE_MED_IDS = new Set(['med-1', 'med-2', 'med-3', 'med-4']);
export const SAMPLE_NOTE_IDS = new Set(['note-1', 'note-2', 'note-3']);
export const SAMPLE_FORBIDDEN_IDS = new Set(['forb-example-1']);
export const SAMPLE_VITAL_IDS = new Set(['vital-1', 'vital-2', 'vital-3']);

export const DEFAULT_VITALS: VitalReading[] = [
  {
    id: 'vital-1',
    type: 'blood_pressure',
    value: '124',
    secondaryValue: '78',
    context: 'Em repouso (manhã)',
    date: TODAY,
    time: '08:15',
    notes: 'Aferida antes do café da manhã',
  },
  {
    id: 'vital-2',
    type: 'glucose',
    value: '96',
    context: 'Em jejum',
    date: TODAY,
    time: '07:45',
    notes: 'Dentro da faixa de referência',
  },
  {
    id: 'vital-3',
    type: 'heart_rate',
    value: '70',
    context: 'Repouso',
    date: TODAY,
    time: '08:15',
  },
];

export const DEFAULT_HYDRATION: HydrationState = {
  date: TODAY,
  ml: 1000,
  goalMl: 2000,
};

export const DEFAULT_HEALTH_PROFILE: UserHealthProfile = {
  fullName: '',
  birthDate: '',
  bloodType: 'Não informado',
  weightKg: '',
  heightCm: '',
  healthPlanOrSus: '',
  forbiddenMedications: [
    {
      id: 'forb-example-1',
      name: 'Exemplo: Dipirona Sódica',
      reason: 'Alergia medicamentosa (edite ou remova conforme seus dados)',
    },
  ],
  otherAllergies: '',
  chronicConditions: '',
  emergencyContactName: '',
  emergencyContactRelation: '',
  emergencyContactPhone: '',
  primaryDoctor: '',
  primaryDoctorPhone: '',
  generalNotes: '',
};

export function loadMedications(): MedicationItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.medications);
    if (!raw) return DEFAULT_MEDICATIONS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_MEDICATIONS;
  } catch {
    return DEFAULT_MEDICATIONS;
  }
}

export function saveMedications(items: MedicationItem[]): void {
  localStorage.setItem(STORAGE_KEYS.medications, JSON.stringify(items));
}

export function loadMedicalNotes(): MedicalNote[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.notes);
    if (!raw) return DEFAULT_MEDICAL_NOTES;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_MEDICAL_NOTES;
  } catch {
    return DEFAULT_MEDICAL_NOTES;
  }
}

export function saveMedicalNotes(notes: MedicalNote[]): void {
  localStorage.setItem(STORAGE_KEYS.notes, JSON.stringify(notes));
}

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.settings);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEYS.settings, JSON.stringify(settings));
}

export function loadSyncLogs(): SyncLogEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.logs);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveSyncLogs(logs: SyncLogEntry[]): void {
  localStorage.setItem(STORAGE_KEYS.logs, JSON.stringify(logs.slice(0, 12)));
}

export function loadHealthProfile(): UserHealthProfile {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.profile);
    if (!raw) return DEFAULT_HEALTH_PROFILE;
    const parsed = JSON.parse(raw);
    return {
      ...DEFAULT_HEALTH_PROFILE,
      ...parsed,
      forbiddenMedications: Array.isArray(parsed?.forbiddenMedications)
        ? parsed.forbiddenMedications
        : DEFAULT_HEALTH_PROFILE.forbiddenMedications,
    };
  } catch {
    return DEFAULT_HEALTH_PROFILE;
  }
}

export function saveHealthProfile(profile: UserHealthProfile): void {
  localStorage.setItem(STORAGE_KEYS.profile, JSON.stringify(profile));
}

export function loadVitals(): VitalReading[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.vitals);
    if (!raw) return DEFAULT_VITALS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : DEFAULT_VITALS;
  } catch {
    return DEFAULT_VITALS;
  }
}

export function saveVitals(vitals: VitalReading[]): void {
  localStorage.setItem(STORAGE_KEYS.vitals, JSON.stringify(vitals));
}

export function loadHydration(): HydrationState {
  const todayIso = getTodayIso();
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.hydration);
    if (!raw) return { ...DEFAULT_HYDRATION, date: todayIso };
    const parsed = JSON.parse(raw) as Partial<HydrationState>;
    const goalMl = typeof parsed.goalMl === 'number' ? parsed.goalMl : 2000;
    if (parsed.date !== todayIso) {
      return { date: todayIso, ml: 0, goalMl };
    }
    return {
      date: todayIso,
      ml: typeof parsed.ml === 'number' ? parsed.ml : 0,
      goalMl,
    };
  } catch {
    return { ...DEFAULT_HYDRATION, date: todayIso };
  }
}

export function saveHydration(hydration: HydrationState): void {
  localStorage.setItem(STORAGE_KEYS.hydration, JSON.stringify(hydration));
}
