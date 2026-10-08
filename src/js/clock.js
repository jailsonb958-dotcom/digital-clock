const $ = (selector) => document.querySelector(selector);
const pad = (value) => String(value).padStart(2, "0");
const elements = {
  hours: $("#hours"), minutes: $("#minutes"), seconds: $("#seconds"), date: $("#date"),
  period: $("#period"), timezone: $("#timezone"), formatToggle: $("#format-toggle"),
  locationButton: $("#location-button"), locationStatus: $("#location-status"),
};

let use24HourFormat = localStorage.getItem("chronos-format-24h") === "true";
let alarms = JSON.parse(localStorage.getItem("chronos-alarms") || "[]");
let audioContext;

function beep() {
  audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
  [0, 0.18, 0.36].forEach((delay) => {
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();
    oscillator.frequency.value = 880;
    oscillator.type = "sine";
    gain.gain.setValueAtTime(0.0001, audioContext.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.22, audioContext.currentTime + delay + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + delay + 0.14);
    oscillator.connect(gain).connect(audioContext.destination);
    oscillator.start(audioContext.currentTime + delay);
    oscillator.stop(audioContext.currentTime + delay + 0.15);
  });
}

function notify(title, body) {
  beep();
  if (Notification.permission === "granted") new Notification(title, { body, tag: "chronos-alert" });
}

function updateFormatButton() {
  elements.formatToggle.textContent = use24HourFormat ? "Usar formato 12h" : "Ativar formato 24h";
  elements.formatToggle.setAttribute("aria-pressed", String(use24HourFormat));
}

function updateClock() {
  const now = new Date();
  const hour = now.getHours();
  elements.hours.textContent = pad(use24HourFormat ? hour : (hour % 12 || 12));
  elements.minutes.textContent = pad(now.getMinutes());
  elements.seconds.textContent = pad(now.getSeconds());
  elements.period.textContent = use24HourFormat ? "24 horas" : (hour >= 12 ? "PM" : "AM");
  elements.date.textContent = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
  elements.timezone.textContent = `Horário local · ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
  checkAlarms(now);
}

function checkAlarms(now) {
  const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  alarms.forEach((alarm) => {
    const key = `${now.toDateString()}-${alarm.id}`;
    if (alarm.enabled && alarm.time === current && sessionStorage.getItem(key) !== "fired") {
      sessionStorage.setItem(key, "fired");
      notify(`Alarme: ${alarm.label}`, `O horário ${alarm.time} chegou.`);
      renderAlarms();
    }
  });
}

function escapeHtml(value) {
  return value.replace(/[&<>']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;" }[char]));
}

function renderAlarms() {
  const list = $("#alarm-list");
  list.innerHTML = alarms.length ? alarms.map((alarm) => `<article class="list-item"><div><strong>${alarm.time}</strong><span>${escapeHtml(alarm.label)}</span></div><div class="item-actions"><button class="alarm-toggle ${alarm.enabled ? "is-on" : ""}" data-id="${alarm.id}" type="button">${alarm.enabled ? "Ativo" : "Pausado"}</button><button class="delete-button" data-delete="${alarm.id}" type="button" aria-label="Excluir alarme">×</button></div></article>`).join("") : '<p class="empty-state">Nenhum alarme configurado.</p>';
  list.querySelectorAll("[data-id]").forEach((button) => button.addEventListener("click", () => {
    const alarm = alarms.find((item) => item.id === Number(button.dataset.id));
    alarm.enabled = !alarm.enabled;
    saveAlarms();
  }));
  list.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => {
    alarms = alarms.filter((item) => item.id !== Number(button.dataset.delete));
    saveAlarms();
  }));
}

function saveAlarms() { localStorage.setItem("chronos-alarms", JSON.stringify(alarms)); renderAlarms(); }

function showLocation({ latitude, longitude }) {
  const coordinates = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  elements.locationStatus.textContent = `Coordenadas exatas: ${coordinates}`;
  fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`).then((response) => response.json()).then((place) => {
    const city = place.city || place.locality || place.principalSubdivision || "Local identificado";
    elements.locationStatus.textContent = `${city}, ${place.countryName || "Brasil"} · ${coordinates}`;
  }).catch(() => {});
}

function detectLocation() {
  if (!navigator.geolocation) { elements.locationStatus.textContent = "Seu navegador não oferece geolocalização."; return; }
  elements.locationButton.disabled = true;
  elements.locationButton.textContent = "Localizando…";
  elements.locationStatus.textContent = "Obtendo sua posição com alta precisão…";
  navigator.geolocation.getCurrentPosition(showLocation, (error) => {
    elements.locationStatus.textContent = ({ 1: "Permissão negada. Autorize a localização.", 2: "Não foi possível determinar sua posição.", 3: "Tempo esgotado. Tente novamente." })[error.code] || "Não foi possível localizar você.";
    elements.locationButton.disabled = false;
    elements.locationButton.textContent = "Tentar novamente";
  }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
}

let stopwatch = { running: false, elapsed: 0, startedAt: 0, interval: null, laps: [] };
function stopwatchText(milliseconds) { const total = Math.floor(milliseconds / 1000); return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}<span>.${pad(Math.floor(milliseconds % 1000 / 10))}</span>`; }
function updateStopwatch() { const elapsed = stopwatch.running ? stopwatch.elapsed + performance.now() - stopwatch.startedAt : stopwatch.elapsed; $("#stopwatch-display").innerHTML = stopwatchText(elapsed); }
function renderLaps() { $("#lap-list").innerHTML = stopwatch.laps.map((lap, index) => `<div class="list-item"><span>Volta ${index + 1}</span><strong>${stopwatchText(lap)}</strong></div>`).join(""); }

let timer = { running: false, remaining: 0, interval: null };
function timerText(seconds) { return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`; }
function updateTimer() { $("#timer-display").textContent = timerText(timer.remaining); }
function finishTimer() { timer.running = false; clearInterval(timer.interval); $("#timer-state").textContent = "Concluído"; $("#timer-start").textContent = "Iniciar"; notify("Temporizador concluído", "Seu tempo acabou."); }

document.querySelectorAll(".mode-tab").forEach((tab) => tab.addEventListener("click", () => {
  document.querySelectorAll(".mode-tab").forEach((item) => item.classList.toggle("is-active", item === tab));
  document.querySelectorAll(".tool-view").forEach((view) => { const visible = view.id === tab.dataset.view; view.hidden = !visible; view.classList.toggle("is-visible", visible); });
}));

$("#format-toggle").addEventListener("click", () => { use24HourFormat = !use24HourFormat; localStorage.setItem("chronos-format-24h", String(use24HourFormat)); updateFormatButton(); updateClock(); });
$("#location-button").addEventListener("click", detectLocation);
$("#notification-button").addEventListener("click", async () => { if (!("Notification" in window)) return; const permission = await Notification.requestPermission(); $("#notification-button").textContent = permission === "granted" ? "Notificações ativas" : "Permissão não concedida"; });
$("#alarm-form").addEventListener("submit", (event) => { event.preventDefault(); alarms.push({ id: Date.now(), time: $("#alarm-time").value, label: $("#alarm-label").value.trim() || "Alarme", enabled: true }); saveAlarms(); event.target.reset(); $("#alarm-label").value = "Alarme"; });

$("#stopwatch-start").addEventListener("click", () => {
  if (stopwatch.running) { stopwatch.elapsed += performance.now() - stopwatch.startedAt; stopwatch.running = false; clearInterval(stopwatch.interval); $("#stopwatch-start").textContent = "Continuar"; $("#stopwatch-state").textContent = "Pausado"; }
  else { stopwatch.startedAt = performance.now(); stopwatch.running = true; stopwatch.interval = setInterval(updateStopwatch, 40); $("#stopwatch-start").textContent = "Pausar"; $("#stopwatch-lap").disabled = false; $("#stopwatch-state").textContent = "Contando"; }
  updateStopwatch();
});
$("#stopwatch-lap").addEventListener("click", () => { if (stopwatch.running) { stopwatch.laps.unshift(stopwatch.elapsed + performance.now() - stopwatch.startedAt); renderLaps(); } });
$("#stopwatch-reset").addEventListener("click", () => { clearInterval(stopwatch.interval); stopwatch = { running: false, elapsed: 0, startedAt: 0, interval: null, laps: [] }; $("#stopwatch-start").textContent = "Iniciar"; $("#stopwatch-lap").disabled = true; $("#stopwatch-state").textContent = "Parado"; updateStopwatch(); renderLaps(); });

$("#timer-start").addEventListener("click", () => {
  if (timer.running) { timer.running = false; clearInterval(timer.interval); $("#timer-start").textContent = "Continuar"; $("#timer-state").textContent = "Pausado"; return; }
  if (!timer.remaining) timer.remaining = Number($("#timer-minutes").value) * 60 + Number($("#timer-seconds").value);
  if (!timer.remaining) return;
  timer.running = true; $("#timer-start").textContent = "Pausar"; $("#timer-state").textContent = "Contando";
  timer.interval = setInterval(() => { timer.remaining -= 1; updateTimer(); if (timer.remaining <= 0) finishTimer(); }, 1000); updateTimer();
});
$("#timer-reset").addEventListener("click", () => { timer.running = false; clearInterval(timer.interval); timer.remaining = Number($("#timer-minutes").value) * 60 + Number($("#timer-seconds").value); $("#timer-start").textContent = "Iniciar"; $("#timer-state").textContent = "Pronto"; updateTimer(); });

updateFormatButton(); updateClock(); renderAlarms(); updateStopwatch(); updateTimer(); setInterval(updateClock, 1000);
