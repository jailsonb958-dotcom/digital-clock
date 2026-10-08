const $ = (selector) => document.querySelector(selector);
const pad = (value) => String(value).padStart(2, "0");
const elements = { hours: $("#hours"), minutes: $("#minutes"), seconds: $("#seconds"), date: $("#date"), period: $("#period"), timezone: $("#timezone"), formatToggle: $("#format-toggle"), locationButton: $("#location-button"), locationStatus: $("#location-status") };
let use24HourFormat = localStorage.getItem("chronos-format-24h") === "true";
let alarms = JSON.parse(localStorage.getItem("chronos-alarms") || "[]");
let worldZones = JSON.parse(localStorage.getItem("chronos-world-zones") || "[{\"label\":\"São Paulo\",\"zone\":\"America/Sao_Paulo\"},{\"label\":\"Nova York\",\"zone\":\"America/New_York\"},{\"label\":\"Tóquio\",\"zone\":\"Asia/Tokyo\"}]");
let audioContext;
let alarmSoundMode = localStorage.getItem("chronos-alarm-sound-mode") || "default";
let customSound = localStorage.getItem("chronos-custom-sound") || "";

function beep() {
  const Audio = window.AudioContext || window.webkitAudioContext;
  if (!Audio) return;
  audioContext ||= new Audio();
  [0, 0.18, 0.36].forEach((delay) => { const oscillator = audioContext.createOscillator(); const gain = audioContext.createGain(); oscillator.frequency.value = 880; oscillator.type = "sine"; gain.gain.setValueAtTime(.0001, audioContext.currentTime + delay); gain.gain.exponentialRampToValueAtTime(.22, audioContext.currentTime + delay + .02); gain.gain.exponentialRampToValueAtTime(.0001, audioContext.currentTime + delay + .14); oscillator.connect(gain).connect(audioContext.destination); oscillator.start(audioContext.currentTime + delay); oscillator.stop(audioContext.currentTime + delay + .15); });
}
function playAlarmSound() { if (alarmSoundMode === "custom" && customSound) { const audio = new Audio(customSound); audio.play().catch(() => beep()); } else beep(); }
function notify(title, body) { playAlarmSound(); if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body, tag: "chronos-alert" }); }
function updateFormatButton() { elements.formatToggle.textContent = use24HourFormat ? "Usar formato 12h" : "Ativar formato 24h"; elements.formatToggle.setAttribute("aria-pressed", String(use24HourFormat)); }
function updateClock() { const now = new Date(); const hour = now.getHours(); elements.hours.textContent = pad(use24HourFormat ? hour : (hour % 12 || 12)); elements.minutes.textContent = pad(now.getMinutes()); elements.seconds.textContent = pad(now.getSeconds()); elements.period.textContent = use24HourFormat ? "24 horas" : (hour >= 12 ? "PM" : "AM"); elements.date.textContent = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now); elements.timezone.textContent = `Horário local · ${Intl.DateTimeFormat().resolvedOptions().timeZone}`; checkAlarms(now); updateWorldClocks(now); }
function checkAlarms(now) { const current = `${pad(now.getHours())}:${pad(now.getMinutes())}`; alarms.forEach((alarm) => { const key = `${now.toDateString()}-${alarm.id}`; if (alarm.enabled && alarm.time === current && sessionStorage.getItem(key) !== "fired") { sessionStorage.setItem(key, "fired"); notify(`Alarme: ${alarm.label}`, `O horário ${alarm.time} chegou.`); renderAlarms(); } }); }
function escapeHtml(value) { return value.replace(/[&<>']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;" }[char])); }
function renderAlarms() { const list = $("#alarm-list"); list.innerHTML = alarms.length ? alarms.map((alarm) => `<article class="list-item"><div><strong>${alarm.time}</strong><span>${escapeHtml(alarm.label)}</span></div><div class="item-actions"><button class="alarm-toggle ${alarm.enabled ? "is-on" : ""}" data-id="${alarm.id}" type="button">${alarm.enabled ? "Ativo" : "Pausado"}</button><button class="delete-button" data-delete="${alarm.id}" type="button" aria-label="Excluir alarme">×</button></div></article>`).join("") : '<p class="empty-state">Nenhum alarme configurado.</p>'; list.querySelectorAll("[data-id]").forEach((button) => button.addEventListener("click", () => { const alarm = alarms.find((item) => item.id === Number(button.dataset.id)); alarm.enabled = !alarm.enabled; saveAlarms(); })); list.querySelectorAll("[data-delete]").forEach((button) => button.addEventListener("click", () => { alarms = alarms.filter((item) => item.id !== Number(button.dataset.delete)); saveAlarms(); })); }
function saveAlarms() { localStorage.setItem("chronos-alarms", JSON.stringify(alarms)); renderAlarms(); }

async function reverseGeocode(latitude, longitude) {
  const providers = [`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`, `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`];
  for (const url of providers) { try { const response = await fetch(url, { headers: { Accept: "application/json" } }); if (!response.ok) continue; const place = await response.json(); const address = place.address || {}; return place.city || place.locality || address.city || address.town || address.village || place.principalSubdivision || address.state || "Local identificado"; } catch { /* tenta o próximo provedor */ } }
  return null;
}
const weatherCodes = { 0: ["Céu limpo", "☀"], 1: ["Predominantemente limpo", "🌤"], 2: ["Parcialmente nublado", "⛅"], 3: ["Nublado", "☁"], 45: ["Neblina", "🌫"], 48: ["Neblina congelante", "🌫"], 51: ["Garoa leve", "🌦"], 53: ["Garoa", "🌦"], 55: ["Garoa intensa", "🌧"], 61: ["Chuva leve", "🌦"], 63: ["Chuva", "🌧"], 65: ["Chuva intensa", "🌧"], 71: ["Neve leve", "🌨"], 73: ["Neve", "🌨"], 75: ["Neve intensa", "❄"], 80: ["Pancadas leves", "🌦"], 81: ["Pancadas", "🌧"], 82: ["Pancadas intensas", "⛈"], 95: ["Trovoada", "⛈"], 96: ["Trovoada com granizo", "⛈"], 99: ["Trovoada forte", "⛈"] };
async function loadWeather(latitude, longitude, placeName) {
  const panel = $("#weather-panel");
  panel.hidden = false;
  $("#weather-place").textContent = `${placeName || "Sua localização"} · atualizando…`;
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&forecast_days=4&timezone=auto`;
    const response = await fetch(url);
    if (!response.ok) throw new Error("Clima indisponível");
    const data = await response.json();
    const current = data.current;
    const condition = weatherCodes[current.weather_code] || ["Condição desconhecida", "☁"];
    $("#weather-place").textContent = `${placeName || "Sua localização"} · ${data.timezone}`;
    $("#weather-icon").textContent = condition[1];
    $("#weather-temperature").textContent = `${Math.round(current.temperature_2m)}°C`;
    $("#weather-condition").textContent = `${condition[0]} · umidade ${current.relative_humidity_2m}%`;
    $("#weather-feels").textContent = `Sensação: ${Math.round(current.apparent_temperature)}°C`;
    $("#weather-forecast").innerHTML = data.daily.time.map((date, index) => { const day = new Intl.DateTimeFormat("pt-BR", { weekday: "short", timeZone: data.timezone }).format(new Date(`${date}T12:00:00`)); const forecast = weatherCodes[data.daily.weather_code[index]] || ["--", "☁"]; return `<div class="forecast-day"><strong>${day.replace(".", "")}</strong><span>${forecast[1]}</span><span>${Math.round(data.daily.temperature_2m_max[index])}° / ${Math.round(data.daily.temperature_2m_min[index])}°</span></div>`; }).join("");
  } catch { $("#weather-place").textContent = "Clima temporariamente indisponível"; $("#weather-condition").textContent = "Verifique sua conexão e tente localizar novamente."; }
}
async function showLocation(position) {
  const { latitude, longitude, accuracy } = position.coords;
  const coordinates = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  elements.locationStatus.textContent = `Coordenadas: ${coordinates} · precisão de ${Math.round(accuracy)} m`;
  try { const city = await reverseGeocode(latitude, longitude); if (city) elements.locationStatus.textContent = `${city} · ${coordinates} · precisão de ${Math.round(accuracy)} m`; loadWeather(latitude, longitude, city || "Sua localização"); } finally { elements.locationButton.disabled = false; elements.locationButton.textContent = "Atualizar localização"; }
}
function locationError(error) { const messages = { 1: "Permissão negada. Clique no cadeado do endereço e permita a localização.", 2: "Posição indisponível. Ative o GPS/Wi-Fi e tente novamente.", 3: "Tempo esgotado. Tente novamente em uma área com sinal." }; elements.locationStatus.textContent = messages[error.code] || "Não foi possível localizar você."; elements.locationButton.disabled = false; elements.locationButton.textContent = "Tentar novamente"; }
function detectLocation() { if (!navigator.geolocation) { elements.locationStatus.textContent = "Seu navegador não oferece geolocalização."; return; } elements.locationButton.disabled = true; elements.locationButton.textContent = "Localizando…"; elements.locationStatus.textContent = "Obtendo GPS/rede com alta precisão…"; navigator.geolocation.getCurrentPosition(showLocation, locationError, { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 }); }

function worldTime(zone, options = {}) { return new Intl.DateTimeFormat("pt-BR", { timeZone: zone, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, ...options }).format(new Date()); }
function renderWorldClocks() { const list = $("#world-list"); list.innerHTML = worldZones.map((item, index) => `<article class="world-card"><div><strong data-world-time="${item.zone}">--:--:--</strong><small>${escapeHtml(item.label)} · ${item.zone}</small></div><button class="world-remove" data-world-remove="${index}" type="button" aria-label="Remover ${escapeHtml(item.label)}">×</button></article>`).join(""); list.querySelectorAll("[data-world-remove]").forEach((button) => button.addEventListener("click", () => { worldZones.splice(Number(button.dataset.worldRemove), 1); localStorage.setItem("chronos-world-zones", JSON.stringify(worldZones)); renderWorldClocks(); })); updateWorldClocks(new Date()); }
function updateWorldClocks(now) { document.querySelectorAll("[data-world-time]").forEach((element) => { element.textContent = new Intl.DateTimeFormat("pt-BR", { timeZone: element.dataset.worldTime, hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now); }); }

let stopwatch = { running: false, elapsed: 0, startedAt: 0, interval: null, laps: [] };
function stopwatchText(milliseconds) { const total = Math.floor(milliseconds / 1000); return `${pad(Math.floor(total / 3600))}:${pad(Math.floor(total / 60) % 60)}:${pad(total % 60)}<span>.${pad(Math.floor(milliseconds % 1000 / 10))}</span>`; }
function updateStopwatch() { const elapsed = stopwatch.running ? stopwatch.elapsed + performance.now() - stopwatch.startedAt : stopwatch.elapsed; $("#stopwatch-display").innerHTML = stopwatchText(elapsed); }
function renderLaps() { $("#lap-list").innerHTML = stopwatch.laps.map((lap, index) => `<div class="list-item"><span>Volta ${index + 1}</span><strong>${stopwatchText(lap)}</strong></div>`).join(""); }
let timer = { running: false, remaining: 0, interval: null };
function timerText(seconds) { return `${pad(Math.floor(seconds / 3600))}:${pad(Math.floor(seconds / 60) % 60)}:${pad(seconds % 60)}`; }
function updateTimer() { $("#timer-display").textContent = timerText(timer.remaining); }
function finishTimer() { timer.running = false; clearInterval(timer.interval); $("#timer-state").textContent = "Concluído"; $("#timer-start").textContent = "Iniciar"; notify("Temporizador concluído", "Seu tempo acabou."); }

function applyTheme(theme) { document.documentElement.dataset.theme = theme; localStorage.setItem("chronos-theme", theme); $("#theme-toggle").textContent = theme === "light" ? "☾" : "☼"; $("#theme-toggle").setAttribute("aria-label", theme === "light" ? "Ativar tema escuro" : "Ativar tema claro"); }
const savedTheme = localStorage.getItem("chronos-theme") || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
applyTheme(savedTheme);
$("#theme-toggle").addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "light" ? "dark" : "light"));

document.querySelectorAll(".mode-tab").forEach((tab) => tab.addEventListener("click", () => { document.querySelectorAll(".mode-tab").forEach((item) => item.classList.toggle("is-active", item === tab)); document.querySelectorAll(".tool-view").forEach((view) => { const visible = view.id === tab.dataset.view; view.hidden = !visible; view.classList.toggle("is-visible", visible); }); }));
$("#format-toggle").addEventListener("click", () => { use24HourFormat = !use24HourFormat; localStorage.setItem("chronos-format-24h", String(use24HourFormat)); updateFormatButton(); updateClock(); });
$("#location-button").addEventListener("click", detectLocation);
$("#notification-button").addEventListener("click", async () => { if (!("Notification" in window)) return; const permission = await Notification.requestPermission(); $("#notification-button").textContent = permission === "granted" ? "Notificações ativas" : "Permissão não concedida"; });
$("#alarm-form").addEventListener("submit", (event) => { event.preventDefault(); alarms.push({ id: Date.now(), time: $("#alarm-time").value, label: $("#alarm-label").value.trim() || "Alarme", enabled: true }); saveAlarms(); event.target.reset(); $("#alarm-label").value = "Alarme"; });
$("#alarm-sound").value = alarmSoundMode;
$("#sound-status").textContent = customSound ? "Som personalizado pronto para uso." : "Nenhum arquivo personalizado carregado.";
$("#alarm-sound").addEventListener("change", (event) => { alarmSoundMode = event.target.value; localStorage.setItem("chronos-alarm-sound-mode", alarmSoundMode); });
$("#custom-sound").addEventListener("change", (event) => { const [file] = event.target.files; if (!file) return; if (file.size > 2 * 1024 * 1024) { $("#sound-status").textContent = "Escolha um arquivo de até 2 MB."; return; } const reader = new FileReader(); reader.onload = () => { customSound = reader.result; alarmSoundMode = "custom"; localStorage.setItem("chronos-custom-sound", customSound); localStorage.setItem("chronos-alarm-sound-mode", alarmSoundMode); $("#alarm-sound").value = "custom"; $("#sound-status").textContent = `${file.name} pronto para os próximos alarmes.`; }; reader.readAsDataURL(file); });
$("#world-add-button").addEventListener("click", () => { $("#world-form").hidden = !$("#world-form").hidden; });
$("#world-form").addEventListener("submit", (event) => { event.preventDefault(); worldZones.push({ label: $("#world-label").value.trim(), zone: $("#world-zone").value }); localStorage.setItem("chronos-world-zones", JSON.stringify(worldZones)); renderWorldClocks(); event.target.reset(); $("#world-form").hidden = true; });
$("#stopwatch-start").addEventListener("click", () => { if (stopwatch.running) { stopwatch.elapsed += performance.now() - stopwatch.startedAt; stopwatch.running = false; clearInterval(stopwatch.interval); $("#stopwatch-start").textContent = "Continuar"; $("#stopwatch-state").textContent = "Pausado"; } else { stopwatch.startedAt = performance.now(); stopwatch.running = true; stopwatch.interval = setInterval(updateStopwatch, 40); $("#stopwatch-start").textContent = "Pausar"; $("#stopwatch-lap").disabled = false; $("#stopwatch-state").textContent = "Contando"; } updateStopwatch(); });
$("#stopwatch-lap").addEventListener("click", () => { if (stopwatch.running) { stopwatch.laps.unshift(stopwatch.elapsed + performance.now() - stopwatch.startedAt); renderLaps(); } });
$("#stopwatch-reset").addEventListener("click", () => { clearInterval(stopwatch.interval); stopwatch = { running: false, elapsed: 0, startedAt: 0, interval: null, laps: [] }; $("#stopwatch-start").textContent = "Iniciar"; $("#stopwatch-lap").disabled = true; $("#stopwatch-state").textContent = "Parado"; updateStopwatch(); renderLaps(); });
$("#timer-start").addEventListener("click", () => { if (timer.running) { timer.running = false; clearInterval(timer.interval); $("#timer-start").textContent = "Continuar"; $("#timer-state").textContent = "Pausado"; return; } if (!timer.remaining) timer.remaining = Number($("#timer-minutes").value) * 60 + Number($("#timer-seconds").value); if (!timer.remaining) return; timer.running = true; $("#timer-start").textContent = "Pausar"; $("#timer-state").textContent = "Contando"; timer.interval = setInterval(() => { timer.remaining -= 1; updateTimer(); if (timer.remaining <= 0) finishTimer(); }, 1000); updateTimer(); });
$("#timer-reset").addEventListener("click", () => { timer.running = false; clearInterval(timer.interval); timer.remaining = Number($("#timer-minutes").value) * 60 + Number($("#timer-seconds").value); $("#timer-start").textContent = "Iniciar"; $("#timer-state").textContent = "Pronto"; updateTimer(); });

updateFormatButton(); updateClock(); renderAlarms(); renderWorldClocks(); updateStopwatch(); updateTimer(); setInterval(updateClock, 1000);
