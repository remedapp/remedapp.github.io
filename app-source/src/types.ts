export enum TabId {
  SCHEDULE = 'schedule',
  VITALS = 'vitals',
  NOTES = 'notes',
  PROFILE = 'profile',
  SUMMARY = 'summary',
  SETTINGS = 'settings',
  SUPPORT = 'support',
}

export type VitalType =
  | 'blood_pressure'
  | 'glucose'
  | 'temperature'
  | 'heart_rate'
  | 'oxygen'
  | 'weight';

export interface VitalReading {
  id: string;
  type: VitalType;
  value: string;
  secondaryValue?: string; // Ex: diastólica
  context?: string; // Ex: Em jejum, Após refeição, Repouso
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  notes?: string;
}

export interface HydrationState {
  date: string;
  ml: number;
  goalMl: number;
}

export interface ForbiddenMedication {
  id: string;
  name: string;
  reason: string;
}

export interface UserHealthProfile {
  fullName: string;
  birthDate: string;
  bloodType: string;
  weightKg: string;
  heightCm: string;
  healthPlanOrSus: string;
  forbiddenMedications: ForbiddenMedication[];
  otherAllergies: string;
  chronicConditions: string;
  emergencyContactName: string;
  emergencyContactRelation: string;
  emergencyContactPhone: string;
  primaryDoctor: string;
  primaryDoctorPhone: string;
  generalNotes: string;
  updatedAt?: string;
}

export type ReminderType = 'medication' | 'appointment';

export type RecurrenceType = 'daily' | 'weekly' | 'once';

export interface MedicationItem {
  id: string;
  name: string;
  type: ReminderType;
  dosageOrDetails: string;
  time: string; // HH:mm
  recurrence: RecurrenceType;
  weekDays: number[]; // 0 = Dom .. 6 = Sáb
  date: string; // YYYY-MM-DD (used for 'once' or start date)
  active: boolean;
  takenDates: string[]; // YYYY-MM-DD array for completed doses
  lastSyncedAt?: string;
}

export type NoteCategory =
  | 'Consulta'
  | 'Exame'
  | 'Receita'
  | 'Sintoma'
  | 'Orientação';

export type NoteStatus = 'Ativo' | 'Aguardando Retorno' | 'Arquivado';

export interface MedicalNote {
  id: string;
  title: string;
  category: NoteCategory;
  date: string; // YYYY-MM-DD
  doctorOrLocation: string;
  specialty: string;
  content: string;
  followUpDate?: string; // YYYY-MM-DD
  followUpTime?: string; // HH:mm
  status: NoteStatus;
  updatedAt: string;
}

export interface AppSettings {
  appsScriptUrl: string;
  reminderMinutesBefore: number;
  enablePopupReminder: boolean;
  enableEmailReminder: boolean;
  autoSyncOnSave: boolean;
  enableBrowserNotifications: boolean;
  enableSoundAlert: boolean;
  patientName: string;
  useSampleData: boolean;
  lastGlobalSyncAt?: string;
}

export interface SyncLogEntry {
  id: string;
  timestamp: string;
  status: 'success' | 'error';
  message: string;
}

export interface ActiveAlert {
  itemId: string;
  title: string;
  details: string;
  time: string;
  type: ReminderType;
}
