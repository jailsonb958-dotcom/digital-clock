const elements = {
  hours: document.querySelector("#hours"),
  minutes: document.querySelector("#minutes"),
  seconds: document.querySelector("#seconds"),
  date: document.querySelector("#date"),
  period: document.querySelector("#period"),
  timezone: document.querySelector("#timezone"),
  formatToggle: document.querySelector("#format-toggle"),
};

let use24HourFormat = false;

const pad = (value) => String(value).padStart(2, "0");

function updateClock() {
  const now = new Date();
  const currentHour = now.getHours();
  const displayHour = use24HourFormat ? currentHour : (currentHour % 12 || 12);

  elements.hours.textContent = pad(displayHour);
  elements.minutes.textContent = pad(now.getMinutes());
  elements.seconds.textContent = pad(now.getSeconds());
  elements.period.textContent = use24HourFormat ? "Formato 24 horas" : (currentHour >= 12 ? "PM" : "AM");
  elements.date.textContent = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
  elements.timezone.textContent = `Horário local · ${Intl.DateTimeFormat().resolvedOptions().timeZone}`;
}

elements.formatToggle.addEventListener("click", () => {
  use24HourFormat = !use24HourFormat;
  elements.formatToggle.textContent = use24HourFormat ? "Usar formato 12h" : "Usar formato 24h";
  elements.formatToggle.setAttribute("aria-pressed", String(use24HourFormat));
  updateClock();
});

updateClock();
setInterval(updateClock, 1000);
