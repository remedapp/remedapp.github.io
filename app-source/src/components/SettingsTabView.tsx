import React, { useState } from 'react';
import {
  Bell,
  CalendarCheck,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  Send,
  Volume2,
} from 'lucide-react';
import { APPS_SCRIPT_CODE } from '../data/appsScriptTemplate';
import {
  isValidAppsScriptUrl,
  requestBrowserNotificationPermission,
} from '../services/calendarSync';
import { AppSettings, SyncLogEntry } from '../types';

interface SettingsTabViewProps {
  settings: AppSettings;
  logs: SyncLogEntry[];
  isSyncing: boolean;
  isTesting: boolean;
  onUpdateSettings: (next: AppSettings) => void;
  onTestConnection: () => void;
  onSyncAll: () => void;
  onTriggerTestAlert: () => void;
}

export const SettingsTabView: React.FC<SettingsTabViewProps> = ({
  settings,
  logs,
  isSyncing,
  isTesting,
  onUpdateSettings,
  onTestConnection,
  onSyncAll,
  onTriggerTestAlert,
}) => {
  const [copied, setCopied] = useState(false);
  const [savedNotice, setSavedNotice] = useState(false);
  const [draftUrl, setDraftUrl] = useState(settings.appsScriptUrl);
  const [draftPatientName, setDraftPatientName] = useState(settings.patientName);
  const [notifStatus, setNotifStatus] = useState<string>(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'Navegador sem suporte';
    }
    if (Notification.permission === 'granted') return 'Autorizado';
    if (Notification.permission === 'denied') return 'Bloqueado no navegador';
    return 'Aguardando permissão';
  });

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_CODE);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback via textarea selection
      const ta = document.createElement('textarea');
      ta.value = APPS_SCRIPT_CODE;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleSaveGeneral = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      appsScriptUrl: draftUrl.trim(),
      patientName: draftPatientName.trim() || 'Meu Acompanhamento',
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 2500);
  };

  const handleRequestNotif = async () => {
    const res = await requestBrowserNotificationPermission();
    if (res === 'granted') setNotifStatus('Autorizado');
    else if (res === 'denied') setNotifStatus('Bloqueado no navegador');
    else if (res === 'unsupported') setNotifStatus('Navegador sem suporte');
    else setNotifStatus('Aguardando permissão');
  };

  const urlTrimmed = draftUrl.trim();
  const urlHasInput = urlTrimmed.length > 0;
  const urlValid = isValidAppsScriptUrl(urlTrimmed);

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Intro & Google Agenda Explanation */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
          <div className="max-w-2xl">
            <h2 className="text-lg font-semibold text-slate-900">
              Integração com o Google Agenda (Google Calendar)
            </h2>
            <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">
              O <strong>Google Agenda</strong> e o <strong>Google Calendar</strong> são o mesmo serviço oficial do Google. Ao conectar via <strong>Google Apps Script</strong>, cada usuário usa a própria conta Google para criar eventos automáticos com notificações no celular e por e-mail — sem precisar de servidor backend ou login OAuth complexo, funcionando inclusive no GitHub Pages.
            </p>
          </div>
          <div className="shrink-0">
            <span
              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                isValidAppsScriptUrl(settings.appsScriptUrl)
                  ? 'text-emerald-700'
                  : 'text-amber-700'
              }`}
            >
              <CalendarCheck className="w-4 h-4" />
              {isValidAppsScriptUrl(settings.appsScriptUrl)
                ? 'Link do Apps Script configurado'
                : 'Aguardando link do Apps Script'}
            </span>
          </div>
        </div>
      </div>

      {/* Step 1 & 2: Copy Apps Script Code */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-semibold text-slate-900">
              01. Copie e implante o código no Google Apps Script
            </h3>
            <p className="mt-1 text-sm text-slate-600">
              Cada usuário executa os passos abaixo uma única vez na própria conta Google.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <a
              href="https://script.google.com/home/start"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Abrir Google Apps Script
            </a>

            <button
              type="button"
              onClick={handleCopyCode}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors whitespace-nowrap cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  Código Copiado!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Código
                </>
              )}
            </button>
          </div>
        </div>

        {/* Step-by-step instructions */}
        <div className="px-6 py-5 bg-slate-50/70 border-b border-slate-200 grid grid-cols-1 md:grid-cols-5 gap-4 text-xs text-slate-700">
          <div>
            <p className="font-semibold text-slate-900">1. Copiar código</p>
            <p className="mt-1 text-slate-600">
              Clique em <strong>Copiar Código</strong> acima para copiar o script completo.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">2. Novo projeto</p>
            <p className="mt-1 text-slate-600">
              Abra o Google Apps Script, clique em <strong>Novo projeto</strong> e cole substituindo tudo.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">3. Implantar</p>
            <p className="mt-1 text-slate-600">
              Vá em <strong>Implantar → Nova implantação</strong> e escolha o tipo <strong>App da Web</strong>.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">4. Permissões</p>
            <p className="mt-1 text-slate-600">
              Em <em>Executar como</em> deixe <strong>Eu</strong>, e em <em>Quem pode acessar</em> marque <strong>Qualquer pessoa</strong>.
            </p>
          </div>
          <div>
            <p className="font-semibold text-slate-900">5. Colar o link</p>
            <p className="mt-1 text-slate-600">
              Autorize sua conta Google, copie a URL terminada em <code className="font-mono">/exec</code> e cole abaixo.
            </p>
          </div>
        </div>

        {/* Code Viewer */}
        <div className="p-4 sm:p-6 bg-slate-950 text-slate-100 overflow-x-auto max-h-80">
          <pre className="text-xs font-mono leading-relaxed whitespace-pre">
            <code>{APPS_SCRIPT_CODE}</code>
          </pre>
        </div>
      </div>

      {/* Step 2: URL Input & Notification Preferences */}
      <form
        onSubmit={handleSaveGeneral}
        className="bg-white border border-slate-200 rounded-xl p-6 space-y-6"
      >
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            02. Cole o link do Web App e ajuste os alertas
          </h3>
          <p className="mt-1 text-sm text-slate-600">
            O link fica salvo no seu navegador. Ao salvar ou sincronizar, o programa envia os horários para sua Agenda.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-xs font-medium text-slate-700 mb-1">
              URL do App da Web (Google Apps Script)
            </label>
            <input
              type="url"
              value={draftUrl}
              onChange={(e) => setDraftUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycb.../exec"
              className="w-full px-3 py-2.5 text-sm font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
            {urlHasInput && !urlValid && (
              <p className="mt-1.5 text-xs text-amber-700">
                Atenção: o link oficial de implantação começa com{' '}
                <code className="font-mono">https://script.google.com/</code> e termina com{' '}
                <code className="font-mono">/exec</code>.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Nome do Perfil / Paciente
            </label>
            <input
              type="text"
              value={draftPatientName}
              onChange={(e) => setDraftPatientName(e.target.value)}
              placeholder="Meu Acompanhamento"
              className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-200">
          {/* Google Agenda Reminder Settings */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">
              Notificações no Google Agenda
            </h4>

            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">
                Avisar com antecedência de
              </label>
              <select
                value={settings.reminderMinutesBefore}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    reminderMinutesBefore: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600"
              >
                <option value={0}>Na hora exata (0 minutos antes)</option>
                <option value={5}>5 minutos antes</option>
                <option value={10}>10 minutos antes</option>
                <option value={15}>15 minutos antes</option>
                <option value={30}>30 minutos antes</option>
                <option value={60}>1 hora antes</option>
              </select>
            </div>

            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enablePopupReminder}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    enablePopupReminder: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              />
              Notificação Pop-up / Push no celular (Google Agenda)
            </label>

            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableEmailReminder}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    enableEmailReminder: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              />
              Enviar também lembrete por E-mail do Google
            </label>

            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoSyncOnSave}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    autoSyncOnSave: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              />
              Sincronizar automaticamente ao salvar ou editar horários
            </label>
          </div>

          {/* Local Browser Alerts */}
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-slate-900">
              Alertas Diretos no Programa (Navegador Aberto)
            </h4>

            <p className="text-xs text-slate-600">
              Além do Google Agenda no celular, o RemedApp monitora o relógio enquanto estiver aberto e alerta na hora exata.
            </p>

            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableBrowserNotifications}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    enableBrowserNotifications: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              />
              Exibir notificação do navegador no horário
            </label>

            <label className="flex items-center gap-2.5 text-sm text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableSoundAlert}
                onChange={(e) =>
                  onUpdateSettings({
                    ...settings,
                    enableSoundAlert: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-slate-300 text-teal-700 focus:ring-teal-600"
              />
              Tocar aviso sonoro suave no horário
            </label>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleRequestNotif}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                <Bell className="w-3.5 h-3.5" />
                Permissão: {notifStatus}
              </button>

              <button
                type="button"
                onClick={onTriggerTestAlert}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
              >
                <Volume2 className="w-3.5 h-3.5" />
                Testar Som e Alerta Agora
              </button>
            </div>
          </div>
        </div>

        {/* Action Footer */}
        <div className="pt-5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onUpdateSettings({
                  ...settings,
                  appsScriptUrl: draftUrl.trim(),
                  patientName: draftPatientName.trim() || 'Meu Acompanhamento',
                });
                onTestConnection();
              }}
              disabled={isTesting || !draftUrl.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg disabled:opacity-50 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {isTesting
                ? 'Testando...'
                : 'Testar Conexão (Criar Evento Teste)'}
            </button>

            <button
              type="button"
              onClick={() => {
                onUpdateSettings({
                  ...settings,
                  appsScriptUrl: draftUrl.trim(),
                  patientName: draftPatientName.trim() || 'Meu Acompanhamento',
                });
                onSyncAll();
              }}
              disabled={isSyncing || !draftUrl.trim()}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-teal-800 bg-teal-50 border border-teal-200 hover:bg-teal-100 rounded-lg disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`}
              />
              {isSyncing
                ? 'Sincronizando...'
                : 'Sincronizar Todos os Horários Agora'}
            </button>
          </div>

          <div className="flex items-center gap-3">
            {savedNotice && (
              <span className="text-xs font-medium text-emerald-700">
                Configurações salvas!
              </span>
            )}
            <button
              type="submit"
              className="px-5 py-2 text-xs font-medium text-white bg-teal-700 hover:bg-teal-800 rounded-lg transition-colors cursor-pointer"
            >
              Salvar Configurações
            </button>
          </div>
        </div>
      </form>

      {/* Sync Activity Log (Real responses only) */}
      <div className="bg-white border border-slate-200 rounded-xl p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900">
            Histórico de Sincronização com o Google Agenda
          </h3>
          {settings.lastGlobalSyncAt && (
            <span className="text-xs text-slate-500 font-mono tabular-nums">
              Última sincronização:{' '}
              {new Date(settings.lastGlobalSyncAt).toLocaleString('pt-BR')}
            </span>
          )}
        </div>

        {logs.length === 0 ? (
          <p className="mt-3 text-sm text-slate-500">
            Nenhuma sincronização realizada ainda. Cole o link do Apps Script acima e clique em <strong>Testar Conexão</strong>.
          </p>
        ) : (
          <ul className="mt-4 divide-y divide-slate-200">
            {logs.map((entry) => (
              <li
                key={entry.id}
                className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`font-semibold ${
                      entry.status === 'success'
                        ? 'text-emerald-700'
                        : 'text-red-700'
                    }`}
                  >
                    {entry.status === 'success' ? 'Sucesso' : 'Falha'}
                  </span>
                  <span className="text-slate-700">{entry.message}</span>
                </div>
                <span className="text-slate-400 font-mono tabular-nums shrink-0">
                  {new Date(entry.timestamp).toLocaleString('pt-BR')}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};
