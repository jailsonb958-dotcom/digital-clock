const elements = {
  hours: document.querySelector("#hours"), minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"), date: document.querySelector("#date"),
  period: document.querySelector("#period"), timezone: document.querySelector("#timezone"),
  formatToggle: document.querySelector("#format-toggle"), locationButton: document.querySelector("#location-button"),
  locationStatus: document.querySelector("#location-status"),
};

let use24HourFormat = localStorage.getItem("chronos-format-24h") === "true";
const pad = (value) => String(value).padStart(2, "0");

function updateFormatButton() {
  elements.formatToggle.textContent = use24HourFormat ? "Usar formato 12h" : "Ativar formato 24h";
  elements.formatToggle.setAttribute("aria-pressed", String(use24HourFormat));
}

function updateClock() {
  const now = new Date();
  const currentHour = now.getHours();
  const displayHour = use24HourFormat ? currentHour : (currentHour % 12 || 12);
  elements.hours.textContent = pad(displayHour);
  elements.minutes.textContent = pad(now.getMinutes());
  elements.seconds.textContent = pad(now.getSeconds());
  elements.period.textContent = use24HourFormat ? "24 horas" : (currentHour >= 12 ? "PM" : "AM");
  elements.date.textContent = new Intl.DateTimeFormat("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(now);
  elements.timezone.textContent = `Horário local · ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
}

async function showLocation({ latitude, longitude }) {
  const coordinates = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
  elements.locationStatus.textContent = `Coordenadas exatas: ${coordinates}`;
  try {
    const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=pt`);
    if (!response.ok) throw new Error("Falha no endereço");
    const place = await response.json();
    const city = place.city || place.locality || place.principalSubdivision || "Local identificado";
    elements.locationStatus.textContent = `${city}, ${place.countryName || "Brasil"} · ${coordinates}`;
  } catch {
    elements.locationStatus.textContent = `Coordenadas exatas: ${coordinates}`;
  }
}

function detectLocation() {
  if (!navigator.geolocation) { elements.locationStatus.textContent = "Seu navegador não oferece geolocalização."; return; }
  elements.locationButton.disabled = true;
  elements.locationButton.textContent = "Localizando…";
  elements.locationStatus.textContent = "Obtendo sua posição com alta precisão…";
  navigator.geolocation.getCurrentPosition(showLocation, (error) => {
    const messages = { 1: "Permissão negada. Autorize a localização nas configurações do navegador.", 2: "Não foi possível determinar sua posição.", 3: "A localização demorou demais. Tente novamente." };
    elements.locationStatus.textContent = messages[error.code] || "Não foi possível localizar você.";
    elements.locationButton.disabled = false;
    elements.locationButton.textContent = "Tentar novamente";
  }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
}

elements.formatToggle.addEventListener("click", () => {
  use24HourFormat = !use24HourFormat;
  localStorage.setItem("chronos-format-24h", String(use24HourFormat));
  updateFormatButton();
  updateClock();
});
elements.locationButton.addEventListener("click", detectLocation);
updateFormatButton();
updateClock();
setInterval(updateClock, 1000);
