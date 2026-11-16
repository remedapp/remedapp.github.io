import { AppSettings, MedicationItem } from '../types';

export interface SyncResponse {
  ok: boolean;
  message: string;
  syncedCount?: number;
  calendarName?: string;
}

export function isValidAppsScriptUrl(url: string): boolean {
  const trimmed = url.trim();
  return (
    trimmed.startsWith('https://script.google.com/') &&
    trimmed.includes('/exec')
  );
}

async function postToAppsScript(
  url: string,
  payload: Record<string, unknown>
): Promise<SyncResponse> {
  const cleanUrl = url.trim();
  if (!cleanUrl) {
    return {
      ok: false,
      message: 'Cole o link do Web App do Google Apps Script antes de sincronizar.',
    };
  }

  if (!isValidAppsScriptUrl(cleanUrl)) {
    return {
      ok: false,
      message:
        'A URL precisa começar com https://script.google.com/ e terminar com /exec (link da implantação como App da Web).',
    };
  }

  try {
    // Usamos text/plain para evitar preflight OPTIONS de CORS, que o Apps Script não responde.
    const response = await fetch(cleanUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    const rawText = await response.text();
    try {
      const data = JSON.parse(rawText) as {
        ok?: boolean;
        message?: string;
        error?: string;
        syncedCount?: number;
        calendarName?: string;
      };
      if (data.ok) {
        return {
          ok: true,
          message: data.message || 'Sincronizado com sucesso no Google Agenda.',
          syncedCount: data.syncedCount,
          calendarName: data.calendarName,
        };
      }
      return {
        ok: false,
        message: data.error || data.message || 'O Apps Script retornou um erro.',
      };
    } catch {
      if (response.ok) {
        return {
          ok: true,
          message: 'Requisição enviada ao Google Apps Script.',
        };
      }
      return {
        ok: false,
        message:
          'Resposta inesperada do Google Apps Script. Verifique se implantou como "App da Web" e autorizou o acesso à agenda.',
      };
    }
  } catch {
    return {
      ok: false,
      message:
        'Não foi possível conectar ao Apps Script. Confira na implantação se "Quem pode acessar" está definido como "Qualquer pessoa" e se a URL termina em /exec.',
    };
  }
}

export async function testAppsScriptConnection(
  settings: AppSettings
): Promise<SyncResponse> {
  return postToAppsScript(settings.appsScriptUrl, {
    action: 'test',
    reminderMinutesBefore: settings.reminderMinutesBefore,
    enablePopupReminder: settings.enablePopupReminder,
    enableEmailReminder: settings.enableEmailReminder,
  });
}

export async function syncItemsToCalendar(
  settings: AppSettings,
  items: MedicationItem[]
): Promise<SyncResponse> {
  return postToAppsScript(settings.appsScriptUrl, {
    action: 'sync_all',
    reminderMinutesBefore: settings.reminderMinutesBefore,
    enablePopupReminder: settings.enablePopupReminder,
    enableEmailReminder: settings.enableEmailReminder,
    items,
  });
}

export async function deleteItemFromCalendar(
  settings: AppSettings,
  itemId: string
): Promise<SyncResponse> {
  return postToAppsScript(settings.appsScriptUrl, {
    action: 'delete_item',
    itemId,
  });
}

export async function requestBrowserNotificationPermission(): Promise<NotificationPermission | 'unsupported'> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return 'unsupported';
  }
  if (Notification.permission === 'granted') {
    return 'granted';
  }
  return Notification.requestPermission();
}

export function triggerBrowserNotification(title: string, body: string): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }
  if (Notification.permission === 'granted') {
    new Notification(title, {
      body,
      tag: `remedapp-${title}`,
    });
  }
}

export function playReminderChime(): void {
  if (typeof window === 'undefined') return;
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!AudioCtx) return;

  try {
    const ctx = new AudioCtx();
    const notes = [587.33, 880]; // D5 -> A5 gentle chime
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.16);
      gain.gain.setValueAtTime(0.001, ctx.currentTime + idx * 0.16);
      gain.gain.exponentialRampToValueAtTime(0.12, ctx.currentTime + idx * 0.16 + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + idx * 0.16 + 0.45);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(ctx.currentTime + idx * 0.16);
      osc.stop(ctx.currentTime + idx * 0.16 + 0.48);
    });
  } catch {
    // AudioContext may be blocked until first user gesture
  }
}
