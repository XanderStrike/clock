// Utility — returns date string HH:MM:SS given a Date object
function fmt(date) {
  return date.toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

// Gets Date object for specific tz w/out changing local tz
const forTZ = (tz) => new Date(new Date().toLocaleString("en-US", { timeZone: tz }));

const clocks = [
  { el: document.querySelector("#toronto .time"), zone: "America/Toronto" },
  { el: document.querySelector("#los-angeles .time"), zone: "America/Los_Angeles" },
  { el: document.querySelector("#utc .time"), zone: "UTC" },
];

function tick() {
  clocks.forEach((c) => {
    c.el.textContent = fmt(forTZ(c.zone));
  });
}

tick();
setInterval(tick, 1000);

// ------------------- converter logic ----------------------
const toggleBtn = document.getElementById("toggle");
const form = document.getElementById("conv-form");
const baseInput = document.getElementById("base-time");
const zoneSelect = document.getElementById("base-zone");
const resultsBox = document.getElementById("conv-results");

toggleBtn.addEventListener("click", () => {
  form.style.display = form.style.display === "none" ? "block" : "none";
  resultsBox.textContent = "";
});

// helper to find UTC timestamp that corresponds to a given HH:MM in a zone (today)
function getInstantForLocalTime(hhmm, zone) {
  const [h, m] = hhmm.split(":").map(Number);
  const today = new Date();
  let candidate = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate(), 0, 0, 0));
  for (let i = 0; i < 1440; i++) {
    const match = candidate.toLocaleTimeString("en-CA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: zone,
    });
    if (match === `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`) {
      return candidate; // found correct instant
    }
    candidate = new Date(candidate.getTime() + 60000); // +1 minute
  }
  return null;
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const timeVal = baseInput.value;
  if (!timeVal) return;
  const baseZone = zoneSelect.value;
  const instant = getInstantForLocalTime(timeVal, baseZone);
  if (!instant) {
    resultsBox.textContent = "Could not calculate time.";
    return;
  }
  let out = "";
  [
    { name: "Toronto", zone: "America/Toronto" },
    { name: "Los Angeles", zone: "America/Los_Angeles" },
    { name: "UTC", zone: "UTC" },
  ].forEach((c) => {
    const t = instant.toLocaleTimeString("en-CA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: c.zone,
    });
    out += `${c.name}: ${t}\n`;
  });
  resultsBox.textContent = out.trim();
});