export const APPS_SCRIPT_CODE = `/**
 * RemedApp — Integração com Google Agenda (Google Calendar)
 * Cole este código em https://script.google.com -> Novo projeto
 * Depois clique em: Implantar -> Nova implantação -> Tipo: App da Web
 * Executar como: Eu | Quem pode acessar: Qualquer pessoa
 */

function doGet(e) {
  try {
    var calendar = CalendarApp.getDefaultCalendar();
    return jsonResponse({
      ok: true,
      service: "RemedApp Google Agenda Bridge",
      calendarName: calendar.getName(),
      timeZone: Session.getScriptTimeZone(),
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    return jsonResponse({ ok: false, error: err.message });
  }
}

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return jsonResponse({ ok: false, error: "Corpo da requisição vazio." });
    }

    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || "sync_all";
    var calendar = CalendarApp.getDefaultCalendar();
    var minutesBefore = typeof payload.reminderMinutesBefore === "number"
      ? payload.reminderMinutesBefore
      : 5;
    var enablePopup = payload.enablePopupReminder !== false;
    var enableEmail = payload.enableEmailReminder === true;

    if (action === "test") {
      var now = new Date();
      var start = new Date(now.getTime() + 2 * 60 * 1000);
      var end = new Date(start.getTime() + 15 * 60 * 1000);
      var testEvent = calendar.createEvent(
        "[RemedApp] Teste de Notificação",
        start,
        end,
        {
          description: "Evento de teste criado pelo RemedApp. Se você recebeu este alerta, sua integração está funcionando!"
        }
      );
      if (enablePopup) testEvent.addPopupReminder(1);
      if (enableEmail) testEvent.addEmailReminder(1);

      return jsonResponse({
        ok: true,
        message: "Conexão confirmada! Evento de teste criado para daqui a 2 minutos na agenda: " + calendar.getName(),
        calendarName: calendar.getName()
      });
    }

    if (action === "delete_item" && payload.itemId) {
      var removed = removeEventsByRemedAppId(calendar, payload.itemId);
      return jsonResponse({
        ok: true,
        message: "Eventos removidos da agenda (" + removed + ")."
      });
    }

    var items = payload.items || [];
    var createdCount = 0;

    for (var i = 0; i < items.length; i++) {
      var item = items[i];
      if (!item || !item.id || !item.time) continue;

      // Remove eventos futuros antigos deste item para evitar duplicidade
      removeEventsByRemedAppId(calendar, item.id);

      if (item.active === false) continue;

      var parts = item.time.split(":");
      var hour = parseInt(parts[0], 10);
      var minute = parseInt(parts[1], 10);
      if (isNaN(hour) || isNaN(minute)) continue;

      var baseDate = parseDateLocal(item.date) || new Date();
      var startTime = new Date(
        baseDate.getFullYear(),
        baseDate.getMonth(),
        baseDate.getDate(),
        hour,
        minute,
        0
      );

      // Se for recorrente e a data inicial já passou, inicia hoje (ou amanhã se o horário de hoje já passou)
      if (item.recurrence !== "once") {
        var today = new Date();
        startTime = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate(),
          hour,
          minute,
          0
        );
        if (startTime.getTime() < today.getTime()) {
          startTime.setDate(startTime.getDate() + 1);
        }
      }

      var endTime = new Date(startTime.getTime() + 15 * 60 * 1000);
      var prefix = item.type === "appointment" ? "Consulta/Exame: " : "Remédio: ";
      var title = "[RemedApp] " + prefix + item.name;
      var description =
        (item.dosageOrDetails ? item.dosageOrDetails + "\\n\\n" : "") +
        "[RemedAppID:" + item.id + "]";

      if (item.recurrence === "once") {
        var singleEvent = calendar.createEvent(title, startTime, endTime, {
          description: description
        });
        applyReminders(singleEvent, minutesBefore, enablePopup, enableEmail);
        createdCount++;
      } else {
        var recurrence = CalendarApp.newRecurrence();
        if (item.recurrence === "weekly" && item.weekDays && item.weekDays.length > 0) {
          var mappedDays = mapWeekDays(item.weekDays);
          recurrence.addWeeklyRule().onlyOnWeekdays(mappedDays).times(12);
        } else {
          recurrence.addDailyRule().times(30);
        }

        var series = calendar.createEventSeries(title, startTime, endTime, recurrence, {
          description: description
        });
        applyReminders(series, minutesBefore, enablePopup, enableEmail);
        createdCount++;
      }
    }

    return jsonResponse({
      ok: true,
      syncedCount: createdCount,
      calendarName: calendar.getName(),
      message: createdCount + " horário(s) sincronizado(s) com o Google Agenda (" + calendar.getName() + ")."
    });
  } catch (err) {
    return jsonResponse({
      ok: false,
      error: "Erro no Apps Script: " + err.message
    });
  }
}

function applyReminders(eventOrSeries, minutesBefore, enablePopup, enableEmail) {
  eventOrSeries.removeAllReminders();
  if (enablePopup) {
    eventOrSeries.addPopupReminder(minutesBefore);
  }
  if (enableEmail) {
    eventOrSeries.addEmailReminder(minutesBefore);
  }
}

function removeEventsByRemedAppId(calendar, itemId) {
  var now = new Date();
  var searchStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  var searchEnd = new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  var marker = "[RemedAppID:" + itemId + "]";
  var events = calendar.getEvents(searchStart, searchEnd, { search: marker });
  var count = 0;

  for (var i = 0; i < events.length; i++) {
    var desc = events[i].getDescription() || "";
    if (desc.indexOf(marker) !== -1) {
      try {
        events[i].deleteEvent();
        count++;
      } catch (e) {
        // Ignora se já foi removido pela série
      }
    }
  }
  return count;
}

function parseDateLocal(dateStr) {
  if (!dateStr || typeof dateStr !== "string") return null;
  var parts = dateStr.split("-");
  if (parts.length !== 3) return null;
  var y = parseInt(parts[0], 10);
  var m = parseInt(parts[1], 10) - 1;
  var d = parseInt(parts[2], 10);
  return new Date(y, m, d);
}

function mapWeekDays(dayNumbers) {
  var map = [
    CalendarApp.Weekday.SUNDAY,
    CalendarApp.Weekday.MONDAY,
    CalendarApp.Weekday.TUESDAY,
    CalendarApp.Weekday.WEDNESDAY,
    CalendarApp.Weekday.THURSDAY,
    CalendarApp.Weekday.FRIDAY,
    CalendarApp.Weekday.SATURDAY
  ];
  var result = [];
  for (var i = 0; i < dayNumbers.length; i++) {
    var wd = map[dayNumbers[i]];
    if (wd) result.push(wd);
  }
  return result.length > 0 ? result : [CalendarApp.Weekday.MONDAY];
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
`;
