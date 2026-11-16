import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Activity,
  BellRing,
  CalendarCheck,
  Check,
  ClipboardList,
  Clock,
  Download,
  FileText,
  HeartHandshake,
  Menu,
  Plus,
  RefreshCw,
  Settings,
  Store,
  ToggleLeft,
  ToggleRight,
  UserRound,
  X,
} from 'lucide-react';
import {
  ActiveAlert,
  AppSettings,
  HydrationState,
  MedicalNote,
  MedicationItem,
  PharmacyItem,
  SyncLogEntry,
  TabId,
  UserHealthProfile,
  VitalReading,
} from './types';
import {
  DEFAULT_HEALTH_PROFILE,
  DEFAULT_MEDICAL_NOTES,
  DEFAULT_MEDICATIONS,
  DEFAULT_PHARMACIES,
  DEFAULT_VITALS,
  getTodayIso,
  loadHealthProfile,
  loadHydration,
  loadMedicalNotes,
  loadMedications,
  loadPharmacies,
  loadSettings,
  loadSyncLogs,
  loadVitals,
  SAMPLE_FORBIDDEN_IDS,
  SAMPLE_MED_IDS,
  SAMPLE_NOTE_IDS,
  SAMPLE_PHARMACY_IDS,
  SAMPLE_VITAL_IDS,
  saveHealthProfile,
  saveHydration,
  saveMedicalNotes,
  saveMedications,
  savePharmacies,
  saveSettings,
  saveSyncLogs,
  saveVitals,
} from './data/initialData';
import {
  deleteItemFromCalendar,
  isValidAppsScriptUrl,
  playReminderChime,
  syncItemsToCalendar,
  testAppsScriptConnection,
  triggerBrowserNotification,
} from './services/calendarSync';
import { ScheduleView } from './components/ScheduleView';
import { VitalsTabView } from './components/VitalsTabView';
import { MedicalNotesView } from './components/MedicalNotesView';
import { PharmaciesTabView } from './components/PharmaciesTabView';
import { ProfileTabView } from './components/ProfileTabView';
import { SummaryTabView } from './components/SummaryTabView';
import { SettingsTabView } from './components/SettingsTabView';
import { SupportTabView } from './components/SupportTabView';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function resolveTabFromPath(pathname: string): TabId {
  if (pathname.includes('/app/medicoes')) return TabId.VITALS;
  if (pathname.includes('/app/anotacoes')) return TabId.NOTES;
  if (pathname.includes('/app/farmacias')) return TabId.PHARMACIES;
  if (pathname.includes('/app/dados')) return TabId.PROFILE;
  if (pathname.includes('/app/resumo')) return TabId.SUMMARY;
  if (pathname.includes('/app/configuracoes')) return TabId.SETTINGS;
  if (pathname.includes('/app/apoio')) return TabId.SUPPORT;
  return TabId.SCHEDULE;
}

function pathForTab(tab: TabId): string {
  switch (tab) {
    case TabId.VITALS:
      return '/app/medicoes';
    case TabId.NOTES:
      return '/app/anotacoes';
    case TabId.PHARMACIES:
      return '/app/farmacias';
    case TabId.PROFILE:
      return '/app/dados';
    case TabId.SUMMARY:
      return '/app/resumo';
    case TabId.SETTINGS:
      return '/app/configuracoes';
    case TabId.SUPPORT:
      return '/app/apoio';
    case TabId.SCHEDULE:
    default:
      return '/app';
  }
}

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>(() => {
    if (typeof window === 'undefined') return TabId.SCHEDULE;
    return resolveTabFromPath(window.location.pathname);
  });

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [medications, setMedications] = useState<MedicationItem[]>(() =>
    loadMedications()
  );
  const [vitals, setVitals] = useState<VitalReading[]>(() => loadVitals());
  const [hydration, setHydration] = useState<HydrationState>(() =>
    loadHydration()
  );
  const [notes, setNotes] = useState<MedicalNote[]>(() => loadMedicalNotes());
  const [pharmacies, setPharmacies] = useState<PharmacyItem[]>(() =>
    loadPharmacies()
  );
  const [profile, setProfile] = useState<UserHealthProfile>(() =>
    loadHealthProfile()
  );
  const [settings, setSettings] = useState<AppSettings>(() => loadSettings());
  const [syncLogs, setSyncLogs] = useState<SyncLogEntry[]>(() =>
    loadSyncLogs()
  );

  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isPharmacyModalOpen, setIsPharmacyModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  const [activeAlert, setActiveAlert] = useState<ActiveAlert | null>(null);
  const alertedMinutesRef = useRef<Set<string>>(new Set());

  // Normalize root path `/` -> `/app`
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.pathname === '/' || window.location.pathname === '') {
      window.history.replaceState(null, '', '/app');
    }
    const handlePopState = () => {
      setActiveTab(resolveTabFromPath(window.location.pathname));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as BeforeInstallPromptEvent);
    };
    const handleAppInstalled = () => setInstallPrompt(null);
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const navigateToTab = useCallback((tab: TabId) => {
    setActiveTab(tab);
    setMobileMenuOpen(false);
    if (typeof window !== 'undefined') {
      const target = pathForTab(tab);
      if (window.location.pathname !== target) {
        window.history.pushState(null, '', target);
      }
    }
  }, []);

  // Persist data changes
  useEffect(() => {
    saveMedications(medications);
  }, [medications]);

  useEffect(() => {
    saveVitals(vitals);
  }, [vitals]);

  useEffect(() => {
    saveHydration(hydration);
  }, [hydration]);

  useEffect(() => {
    saveMedicalNotes(notes);
  }, [notes]);

  useEffect(() => {
    savePharmacies(pharmacies);
  }, [pharmacies]);

  useEffect(() => {
    saveHealthProfile(profile);
  }, [profile]);

  useEffect(() => {
    saveSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveSyncLogs(syncLogs);
  }, [syncLogs]);

  const showFeedback = useCallback(
    (type: 'success' | 'error', text: string) => {
      setFeedbackBanner({ type, text });
    },
    []
  );

  const handleInstallApp = useCallback(async () => {
    if (installPrompt) {
      await installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      return;
    }
    showFeedback('success', 'Para instalar: abra o menu do navegador e escolha “Instalar app” ou “Adicionar à tela inicial”.');
  }, [installPrompt, showFeedback]);

  const appendLog = useCallback(
    (status: 'success' | 'error', message: string) => {
      const entry: SyncLogEntry = {
        id: `log-${Date.now()}`,
        timestamp: new Date().toISOString(),
        status,
        message,
      };
      setSyncLogs((prev) => [entry, ...prev].slice(0, 12));
    },
    []
  );

  const runSyncAll = useCallback(
    async (itemsToSync: MedicationItem[], currentSettings: AppSettings) => {
      if (!isValidAppsScriptUrl(currentSettings.appsScriptUrl)) {
        showFeedback(
          'error',
          'Configure primeiro a URL válida do Google Apps Script na aba Configurações.'
        );
        return;
      }

      setIsSyncing(true);
      const res = await syncItemsToCalendar(currentSettings, itemsToSync);
      setIsSyncing(false);

      if (res.ok) {
        const nowIso = new Date().toISOString();
        setMedications((prev) =>
          prev.map((m) => ({ ...m, lastSyncedAt: nowIso }))
        );
        setSettings((prev) => ({ ...prev, lastGlobalSyncAt: nowIso }));
        appendLog('success', res.message);
        showFeedback('success', res.message);
      } else {
        appendLog('error', res.message);
        showFeedback('error', res.message);
      }
    },
    [appendLog, showFeedback]
  );

  const handleTestConnection = useCallback(async () => {
    setIsTesting(true);
    const res = await testAppsScriptConnection(settings);
    setIsTesting(false);
    if (res.ok) {
      appendLog('success', res.message);
      showFeedback('success', res.message);
    } else {
      appendLog('error', res.message);
      showFeedback('error', res.message);
    }
  }, [settings, appendLog, showFeedback]);

  const handleSaveMedication = useCallback(
    async (item: MedicationItem) => {
      const nextList = medications.some((m) => m.id === item.id)
        ? medications.map((m) => (m.id === item.id ? item : m))
        : [...medications, item];
      setMedications(nextList);

      if (
        settings.autoSyncOnSave &&
        isValidAppsScriptUrl(settings.appsScriptUrl)
      ) {
        await runSyncAll(nextList, settings);
      } else {
        showFeedback('success', `Horário "${item.name}" salvo.`);
      }
    },
    [medications, settings, runSyncAll, showFeedback]
  );

  const handleDeleteMedication = useCallback(
    async (id: string) => {
      setMedications((prev) => prev.filter((m) => m.id !== id));
      if (isValidAppsScriptUrl(settings.appsScriptUrl)) {
        const res = await deleteItemFromCalendar(settings, id);
        if (res.ok) {
          appendLog('success', res.message);
        }
      }
      showFeedback('success', 'Horário removido.');
    },
    [settings, appendLog, showFeedback]
  );

  const handleToggleTakenToday = useCallback((id: string) => {
    const todayIso = getTodayIso();
    setMedications((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const already = item.takenDates.includes(todayIso);
        return {
          ...item,
          takenDates: already
            ? item.takenDates.filter((d) => d !== todayIso)
            : [...item.takenDates, todayIso],
        };
      })
    );
    setActiveAlert((curr) => (curr?.itemId === id ? null : curr));
  }, []);

  const handleSaveNote = useCallback(
    (note: MedicalNote) => {
      setNotes((prev) => {
        const exists = prev.some((n) => n.id === note.id);
        return exists
          ? prev.map((n) => (n.id === note.id ? note : n))
          : [note, ...prev];
      });
      showFeedback('success', `Anotação "${note.title}" salva.`);
    },
    [showFeedback]
  );

  const handleDeleteNote = useCallback(
    (id: string) => {
      setNotes((prev) => prev.filter((n) => n.id !== id));
      showFeedback('success', 'Anotação médica excluída.');
    },
    [showFeedback]
  );

  const handleSaveProfile = useCallback(
    (nextProfile: UserHealthProfile) => {
      setProfile(nextProfile);
      showFeedback('success', 'Seus dados pessoais de saúde foram salvos.');
    },
    [showFeedback]
  );

  const handleAddVital = useCallback(
    (reading: VitalReading) => {
      setVitals((prev) => [reading, ...prev]);
      showFeedback('success', 'Medição registrada.');
    },
    [showFeedback]
  );

  const handleDeleteVital = useCallback(
    (id: string) => {
      setVitals((prev) => prev.filter((v) => v.id !== id));
      showFeedback('success', 'Medição removida.');
    },
    [showFeedback]
  );

  const handleSavePharmacy = useCallback(
    (pharmacy: PharmacyItem) => {
      setPharmacies((prev) => {
        const exists = prev.some((p) => p.id === pharmacy.id);
        return exists
          ? prev.map((p) => (p.id === pharmacy.id ? pharmacy : p))
          : [...prev, pharmacy];
      });
      showFeedback('success', `Farmácia "${pharmacy.name}" salva.`);
    },
    [showFeedback]
  );

  const handleDeletePharmacy = useCallback(
    (id: string) => {
      setPharmacies((prev) => prev.filter((p) => p.id !== id));
      showFeedback('success', 'Farmácia removida.');
    },
    [showFeedback]
  );

  const handleToggleSampleData = useCallback(() => {
    const nextEnabled = !settings.useSampleData;

    if (!nextEnabled) {
      setMedications((prev) => prev.filter((m) => !SAMPLE_MED_IDS.has(m.id)));
      setNotes((prev) => prev.filter((n) => !SAMPLE_NOTE_IDS.has(n.id)));
      setVitals((prev) => prev.filter((v) => !SAMPLE_VITAL_IDS.has(v.id)));
      setPharmacies((prev) =>
        prev.filter((p) => !SAMPLE_PHARMACY_IDS.has(p.id))
      );
      setProfile((prev) => ({
        ...prev,
        forbiddenMedications: prev.forbiddenMedications.filter(
          (f) => !SAMPLE_FORBIDDEN_IDS.has(f.id)
        ),
      }));
      setHydration((prev) => ({ ...prev, ml: 0 }));
      setSettings((prev) => ({ ...prev, useSampleData: false }));
      showFeedback(
        'success',
        'Auto-preenchimento desativado. Os dados de exemplo foram apagados.'
      );
    } else {
      setMedications((prev) => {
        const existing = new Set(prev.map((m) => m.id));
        const toAdd = DEFAULT_MEDICATIONS.filter((m) => !existing.has(m.id));
        return [...prev, ...toAdd];
      });
      setNotes((prev) => {
        const existing = new Set(prev.map((n) => n.id));
        const toAdd = DEFAULT_MEDICAL_NOTES.filter((n) => !existing.has(n.id));
        return [...prev, ...toAdd];
      });
      setVitals((prev) => {
        const existing = new Set(prev.map((v) => v.id));
        const toAdd = DEFAULT_VITALS.filter((v) => !existing.has(v.id));
        return [...prev, ...toAdd];
      });
      setPharmacies((prev) => {
        const existing = new Set(prev.map((p) => p.id));
        const toAdd = DEFAULT_PHARMACIES.filter((p) => !existing.has(p.id));
        return [...prev, ...toAdd];
      });
      setProfile((prev) => {
        const existing = new Set(prev.forbiddenMedications.map((f) => f.id));
        const toAdd = DEFAULT_HEALTH_PROFILE.forbiddenMedications.filter(
          (f) => !existing.has(f.id)
        );
        return {
          ...prev,
          forbiddenMedications: [...prev.forbiddenMedications, ...toAdd],
        };
      });
      setSettings((prev) => ({ ...prev, useSampleData: true }));
      showFeedback(
        'success',
        'Auto-preenchimento ativado com dados de exemplo.'
      );
    }
  }, [settings.useSampleData, showFeedback]);

  const handleCreateFollowUpReminder = useCallback(
    async (note: MedicalNote) => {
      if (!note.followUpDate) return;
      const reminderId = `followup-${note.id}`;
      const newReminder: MedicationItem = {
        id: reminderId,
        name: `Retorno: ${note.title}`,
        type: 'appointment',
        dosageOrDetails: [note.doctorOrLocation, note.specialty]
          .filter(Boolean)
          .join(' · '),
        time: note.followUpTime || '09:00',
        recurrence: 'once',
        weekDays: [],
        date: note.followUpDate,
        active: true,
        takenDates: [],
      };

      const nextList = medications.some((m) => m.id === reminderId)
        ? medications.map((m) => (m.id === reminderId ? newReminder : m))
        : [...medications, newReminder];
      setMedications(nextList);

      if (isValidAppsScriptUrl(settings.appsScriptUrl)) {
        await runSyncAll(nextList, settings);
      } else {
        showFeedback(
          'success',
          'Retorno adicionado aos seus Horários! Configure o Google Apps Script para receber na Agenda.'
        );
      }
      navigateToTab(TabId.SCHEDULE);
    },
    [medications, settings, runSyncAll, showFeedback, navigateToTab]
  );

  const triggerAlertForItem = useCallback(
    (alert: ActiveAlert) => {
      setActiveAlert(alert);
      if (settings.enableSoundAlert) {
        playReminderChime();
      }
      if (settings.enableBrowserNotifications) {
        triggerBrowserNotification(
          `RemedApp · ${alert.time}`,
          `${alert.title}${alert.details ? ` — ${alert.details}` : ''}`
        );
      }
    },
    [settings.enableSoundAlert, settings.enableBrowserNotifications]
  );

  const handleTriggerTestAlert = useCallback(() => {
    const now = new Date();
    const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}`;
    triggerAlertForItem({
      itemId: 'test-alert',
      title: 'Teste de Alerta — Losartana 50 mg',
      details: 'Exemplo de notificação no horário programado.',
      time: hhmm,
      type: 'medication',
    });
  }, [triggerAlertForItem]);

  // Real-time minute checker for in-app + browser alerts
  useEffect(() => {
    const checkSchedule = () => {
      const now = new Date();
      const todayIso = getTodayIso();
      const todayDay = now.getDay();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;

      for (const item of medications) {
        if (!item.active) continue;
        if (item.takenDates.includes(todayIso)) continue;
        if (item.time !== hhmm) continue;

        const matchesToday =
          item.recurrence === 'daily' ||
          (item.recurrence === 'once' && item.date === todayIso) ||
          (item.recurrence === 'weekly' && item.weekDays.includes(todayDay));

        if (!matchesToday) continue;

        const key = `${todayIso}-${hhmm}-${item.id}`;
        if (alertedMinutesRef.current.has(key)) continue;
        alertedMinutesRef.current.add(key);

        triggerAlertForItem({
          itemId: item.id,
          title: item.name,
          details: item.dosageOrDetails,
          time: item.time,
          type: item.type,
        });
      }
    };

    checkSchedule();
    const timer = window.setInterval(checkSchedule, 15000);
    return () => window.clearInterval(timer);
  }, [medications, triggerAlertForItem]);

  const navItems = [
    {
      id: TabId.SCHEDULE,
      label: 'Horários & Remédios',
      icon: Clock,
    },
    {
      id: TabId.VITALS,
      label: 'Sinais & Hidratação',
      icon: Activity,
    },
    {
      id: TabId.NOTES,
      label: 'Anotações Médicas',
      icon: FileText,
    },
    {
      id: TabId.PHARMACIES,
      label: 'Farmácias & Pedidos',
      icon: Store,
    },
    {
      id: TabId.PROFILE,
      label: 'Meus Dados',
      icon: UserRound,
    },
    {
      id: TabId.SUMMARY,
      label: 'Resumo p/ Consulta',
      icon: ClipboardList,
    },
    {
      id: TabId.SETTINGS,
      label: 'Configurações',
      icon: Settings,
    },
    {
      id: TabId.SUPPORT,
      label: 'Apoio',
      icon: HeartHandshake,
    },
  ];

  const currentTabTitle =
    activeTab === TabId.SCHEDULE
      ? 'Horários & Remédios'
      : activeTab === TabId.VITALS
      ? 'Sinais & Hidratação'
      : activeTab === TabId.NOTES
      ? 'Anotações Médicas'
      : activeTab === TabId.PHARMACIES
      ? 'Farmácias & Pedidos'
      : activeTab === TabId.PROFILE
      ? 'Meus Dados'
      : activeTab === TabId.SUMMARY
      ? 'Resumo p/ Consulta'
      : activeTab === TabId.SETTINGS
      ? 'Configurações'
      : 'Apoio Voluntário';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex">
      {/* Mobile Sidebar Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Left Workspace Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 flex flex-col justify-between transition-transform duration-200 lg:translate-x-0 ${
          mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div>
          <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={() => navigateToTab(TabId.SCHEDULE)}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 cursor-pointer"
            >
              RemedApp
            </button>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden p-1.5 text-slate-500 hover:text-slate-800 rounded-lg"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <nav className="p-4 space-y-1" aria-label="Navegação principal">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateToTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isActive
                      ? 'bg-teal-50 text-teal-800'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-teal-700' : 'text-slate-400'
                    }`}
                  />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Auto-fill Sample Data Toggle in Menu */}
          <div className="px-4 pt-2 pb-3 border-t border-slate-100">
            <button
              type="button"
              onClick={handleToggleSampleData}
              className="w-full flex items-center justify-between gap-2 px-3.5 py-2.5 text-xs font-medium text-slate-700 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg transition-colors cursor-pointer"
            >
              <span className="text-left leading-tight">
                Auto-preenchimento
                <span className="block text-[11px] font-normal text-slate-500">
                  {settings.useSampleData
                    ? 'Clique para apagar exemplos'
                    : 'Exemplos apagados (ativar)'}
                </span>
              </span>
              {settings.useSampleData ? (
                <ToggleRight className="w-5 h-5 text-teal-700 shrink-0" />
              ) : (
                <ToggleLeft className="w-5 h-5 text-slate-400 shrink-0" />
              )}
            </button>
          </div>
        </div>

        <div className="p-4 border-t border-slate-200">
          <div className="px-2 py-1">
            <p className="text-xs font-medium text-slate-500 truncate">
              {profile.fullName.trim() || settings.patientName}
            </p>
            <p className="mt-1 text-xs text-slate-600 flex items-center gap-1.5">
              <CalendarCheck
                className={`w-3.5 h-3.5 shrink-0 ${
                  isValidAppsScriptUrl(settings.appsScriptUrl)
                    ? 'text-emerald-600'
                    : 'text-amber-600'
                }`}
              />
              <span className="truncate">
                {isValidAppsScriptUrl(settings.appsScriptUrl)
                  ? 'Google Agenda conectado'
                  : 'Agenda não vinculada'}
              </span>
            </p>
          </div>
        </div>
      </aside>

      {/* Main Content Column */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar Contract (Breadcrumb left, 1 Primary CTA right) */}
        <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-8 flex items-center justify-between gap-8 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Abrir menu"
              className="lg:hidden p-2 -ml-2 text-slate-600 hover:text-slate-900 rounded-lg"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 text-sm min-w-0">
              <span className="text-slate-400 hidden sm:inline whitespace-nowrap">
                /app
              </span>
              <span className="text-slate-300 hidden sm:inline">/</span>
              <h1 className="font-semibold text-slate-900 truncate">
                {currentTabTitle}
              </h1>
            </div>
          </div>

          <div className="shrink-0">
            {activeTab === TabId.SCHEDULE && (
              <>
                <button
                  type="button"
                  onClick={handleInstallApp}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-teal-800 bg-teal-50 hover:bg-teal-100 border border-teal-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  title="Instalar RemedApp no celular ou computador"
                >
                  <Download className="w-3.5 h-3.5" />
                  Instalar app
                </button>
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Novo Horário
                </button>
              </>
            )}
            {activeTab === TabId.NOTES && (
              <button
                type="button"
                onClick={() => setIsNoteModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nova Anotação
              </button>
            )}
            {activeTab === TabId.PHARMACIES && (
              <button
                type="button"
                onClick={() => setIsPharmacyModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Nova Farmácia
              </button>
            )}
            {activeTab === TabId.SETTINGS && (
              <button
                type="button"
                onClick={() => runSyncAll(medications, settings)}
                disabled={isSyncing || !settings.appsScriptUrl.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap shrink-0 disabled:opacity-50 cursor-pointer"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
                />
                {isSyncing ? 'Sincronizando...' : 'Sincronizar Agenda'}
              </button>
            )}
          </div>
        </header>

        {/* Active Scheduled Alert Banner */}
        {activeAlert && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-8 py-3.5 no-print">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <BellRing className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-950">
                    Horário Programado ({activeAlert.time}) — {activeAlert.title}
                  </p>
                  {activeAlert.details && (
                    <p className="text-xs text-amber-900 mt-0.5">
                      {activeAlert.details}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {activeAlert.itemId !== 'test-alert' && (
                  <button
                    type="button"
                    onClick={() => handleToggleTakenToday(activeAlert.itemId)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg cursor-pointer"
                  >
                    <Check className="w-3.5 h-3.5" />
                    Marcar como tomado
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setActiveAlert(null)}
                  className="px-3 py-1.5 text-xs font-medium text-amber-900 bg-white border border-amber-300 hover:bg-amber-100 rounded-lg cursor-pointer"
                >
                  Dispensar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Feedback Banner */}
        {feedbackBanner && (
          <div
            className={`px-4 sm:px-8 py-3 border-b text-xs font-medium flex items-center justify-between gap-4 no-print ${
              feedbackBanner.type === 'success'
                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                : 'bg-red-50 border-red-200 text-red-900'
            }`}
          >
            <span>{feedbackBanner.text}</span>
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="p-1 hover:opacity-75 cursor-pointer"
              aria-label="Fechar aviso"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main Viewport */}
        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {activeTab === TabId.SCHEDULE && (
            <ScheduleView
              items={medications}
              notesCount={notes.length}
              settings={settings}
              isSyncing={isSyncing}
              isModalOpen={isScheduleModalOpen}
              onOpenModal={() => setIsScheduleModalOpen(true)}
              onCloseModal={() => setIsScheduleModalOpen(false)}
              onSaveItem={handleSaveMedication}
              onDeleteItem={handleDeleteMedication}
              onToggleTakenToday={handleToggleTakenToday}
              onSyncAll={() => runSyncAll(medications, settings)}
              onGoToSettings={() => navigateToTab(TabId.SETTINGS)}
              onTriggerTestAlert={handleTriggerTestAlert}
            />
          )}

          {activeTab === TabId.VITALS && (
            <VitalsTabView
              vitals={vitals}
              hydration={hydration}
              onAddVital={handleAddVital}
              onDeleteVital={handleDeleteVital}
              onUpdateHydration={setHydration}
            />
          )}

          {activeTab === TabId.NOTES && (
            <MedicalNotesView
              notes={notes}
              isModalOpen={isNoteModalOpen}
              onOpenModal={() => setIsNoteModalOpen(true)}
              onCloseModal={() => setIsNoteModalOpen(false)}
              onSaveNote={handleSaveNote}
              onDeleteNote={handleDeleteNote}
              onCreateFollowUpReminder={handleCreateFollowUpReminder}
            />
          )}

          {activeTab === TabId.PHARMACIES && (
            <PharmaciesTabView
              pharmacies={pharmacies}
              medications={medications}
              profile={profile}
              isModalOpen={isPharmacyModalOpen}
              onOpenModal={() => setIsPharmacyModalOpen(true)}
              onCloseModal={() => setIsPharmacyModalOpen(false)}
              onSavePharmacy={handleSavePharmacy}
              onDeletePharmacy={handleDeletePharmacy}
            />
          )}

          {activeTab === TabId.PROFILE && (
            <ProfileTabView
              profile={profile}
              onSaveProfile={handleSaveProfile}
            />
          )}

          {activeTab === TabId.SUMMARY && (
            <SummaryTabView
              profile={profile}
              medications={medications}
              notes={notes}
              vitals={vitals}
            />
          )}

          {activeTab === TabId.SETTINGS && (
            <SettingsTabView
              settings={settings}
              logs={syncLogs}
              isSyncing={isSyncing}
              isTesting={isTesting}
              onUpdateSettings={setSettings}
              onTestConnection={handleTestConnection}
              onSyncAll={() => runSyncAll(medications, settings)}
              onTriggerTestAlert={handleTriggerTestAlert}
            />
          )}

          {activeTab === TabId.SUPPORT && <SupportTabView />}
        </main>

        {/* Footer */}
        <footer className="border-t border-slate-200 bg-white px-4 sm:px-8 py-6 text-center text-xs text-slate-500 no-print">
          <div className="max-w-6xl mx-auto space-y-2">
            <p className="font-medium text-slate-700">
              RemedApp · gratuito · privado · offline
            </p>
            <div className="flex items-center justify-center gap-2">
              <a
                href="https://saulomgg.github.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 hover:text-teal-800 hover:underline transition-colors"
              >
                Site oficial
              </a>
              <span aria-hidden="true">·</span>
              <a
                href="https://link.mercadopago.com.br/saulomgg"
                target="_blank"
                rel="noopener noreferrer"
                className="text-teal-700 hover:text-teal-800 hover:underline transition-colors"
              >
                Apoiar o projeto
              </a>
            </div>
            <p className="text-slate-500">Desenvolvido por Saulomgg</p>
          </div>
        </footer>
      </div>
    </div>
  );
}
