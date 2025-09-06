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

// Configuration management
class TimeZoneConfig {
  constructor() {
    this.defaultTimeZones = [
      { zone: "America/Toronto", name: "Toronto" },
      { zone: "America/Los_Angeles", name: "Los Angeles" },
      { zone: "UTC", name: "UTC" }
    ];
    this.timeZones = this.loadConfig();
    this.clocks = [];
    this.init();
  }

  loadConfig() {
    const saved = localStorage.getItem('timeZoneConfig');
    return saved ? JSON.parse(saved) : this.defaultTimeZones;
  }

  saveConfig() {
    localStorage.setItem('timeZoneConfig', JSON.stringify(this.timeZones));
  }

  init() {
    this.renderClocks();
    this.startClock();
  }

  renderClocks() {
    const container = document.querySelector('.container');
    container.innerHTML = '';
    
    this.timeZones.forEach((tz, index) => {
      const cityDiv = document.createElement('div');
      cityDiv.className = 'city';
      cityDiv.id = `timezone-${index}`;
      
      const nameDiv = document.createElement('div');
      nameDiv.className = 'city-name';
      // Strip everything before the last slash
      const displayName = tz.name.includes('/') ? tz.name.split('/').pop() : tz.name;
      nameDiv.textContent = displayName.replace(/_/g, ' ');
      
      const timeDiv = document.createElement('div');
      timeDiv.className = 'time';
      timeDiv.textContent = '--:--:--';
      
      cityDiv.appendChild(nameDiv);
      cityDiv.appendChild(timeDiv);
      container.appendChild(cityDiv);
      
      this.clocks.push({
        el: timeDiv,
        zone: tz.zone,
        name: tz.name
      });
    });
  }

  startClock() {
    this.tick();
    setInterval(() => this.tick(), 1000);
  }

  tick() {
    this.clocks.forEach((c) => {
      c.el.textContent = fmt(forTZ(c.zone));
    });
  }

  updateTimeZones(newTimeZones) {
    this.timeZones = newTimeZones;
    this.saveConfig();
    this.renderClocks();
  }
}

// Initialize the configuration
const config = new TimeZoneConfig();

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
  config.timeZones.forEach((c) => {
    const t = instant.toLocaleTimeString("en-CA", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: c.zone,
    });
    // Strip everything before the last slash for display
    const displayName = c.name.includes('/') ? c.name.split('/').pop() : c.name;
    out += `${displayName.replace(/_/g, ' ')}: ${t}\n`;
  });
  resultsBox.textContent = out.trim();
});

// ------------------- settings modal logic ----------------------
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModal = document.getElementById('close-modal');
const addTimezoneBtn = document.getElementById('add-timezone');
const saveSettingsBtn = document.getElementById('save-settings');
const cancelSettingsBtn = document.getElementById('cancel-settings');
const timezoneList = document.getElementById('timezone-list');

function openModal() {
  settingsModal.classList.add('show');
  renderTimezoneList();
}

function closeModalHandler() {
  settingsModal.classList.remove('show');
}

function renderTimezoneList() {
  timezoneList.innerHTML = '';
  
  config.timeZones.forEach((tz, index) => {
    const item = createTimezoneItem(tz.zone, tz.name);
    timezoneList.appendChild(item);
  });
}

function createTimezoneItem(zone, name) {
  const item = document.createElement('div');
  item.className = 'timezone-item';
  
  const select = document.createElement('select');
  select.className = 'timezone-select';
  
  // Add UTC at the top
  const utcOption = document.createElement('option');
  utcOption.value = 'UTC';
  utcOption.textContent = 'UTC';
  select.appendChild(utcOption);
  
  // Get all available time zones and add them (excluding UTC since we already added it)
  const timeZones = Intl.supportedValuesOf('timeZone').filter(tz => tz !== 'UTC');
  
  // Add all time zones to the dropdown
  timeZones.forEach(tz => {
    const option = document.createElement('option');
    option.value = tz;
    option.textContent = tz.replace(/_/g, ' ');
    select.appendChild(option);
  });
  
  select.value = zone;
  
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-timezone';
  removeBtn.textContent = '×';
  removeBtn.onclick = () => {
    if (timezoneList.children.length > 1) {
      item.remove();
    }
  };
  
  item.appendChild(select);
  item.appendChild(removeBtn);
  
  return item;
}

function addTimezone() {
  const item = createTimezoneItem('UTC', 'UTC');
  timezoneList.appendChild(item);
}

function saveSettings() {
  const newTimeZones = [];
  const selects = timezoneList.querySelectorAll('.timezone-select');
  
  selects.forEach(select => {
    const zone = select.value;
    const name = select.options[select.selectedIndex].text;
    newTimeZones.push({ zone, name });
  });
  
  config.updateTimeZones(newTimeZones);
  closeModalHandler();
}

function updateConverterOptions() {
  const baseZone = document.getElementById('base-zone');
  baseZone.innerHTML = '';
  
  config.timeZones.forEach(tz => {
    const option = document.createElement('option');
    option.value = tz.zone;
    // Strip everything before the last slash for display
    const displayName = tz.name.includes('/') ? tz.name.split('/').pop() : tz.name;
    option.textContent = displayName.replace(/_/g, ' ');
    baseZone.appendChild(option);
  });
}

// Event listeners
settingsBtn.addEventListener('click', openModal);
closeModal.addEventListener('click', closeModalHandler);
addTimezoneBtn.addEventListener('click', addTimezone);
saveSettingsBtn.addEventListener('click', saveSettings);
cancelSettingsBtn.addEventListener('click', closeModalHandler);

// Close modal when clicking outside
settingsModal.addEventListener('click', (e) => {
  if (e.target === settingsModal) {
    closeModalHandler();
  }
});

// Initialize converter options
updateConverterOptions();

// Update converter options when settings change
const originalUpdateTimeZones = config.updateTimeZones;
config.updateTimeZones = function(newTimeZones) {
  originalUpdateTimeZones.call(this, newTimeZones);
  updateConverterOptions();
};