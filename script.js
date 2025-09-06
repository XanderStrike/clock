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

// Links configuration management
class LinksConfig {
  constructor() {
    this.defaultLinks = [
      { name: "Alex", url: "https://astandke.com" },
      { name: "GitHub", url: "https://github.com/xanderstrike/clock" },
      { name: "GMail", url: "https://mail.google.com/mail/u/0/" },
    ];
    this.links = this.loadConfig();
    this.init();
  }

  loadConfig() {
    const saved = localStorage.getItem('linksConfig');
    return saved ? JSON.parse(saved) : this.defaultLinks;
  }

  saveConfig() {
    localStorage.setItem('linksConfig', JSON.stringify(this.links));
  }

  init() {
    this.renderLinks();
  }

  renderLinks() {
    const container = document.getElementById('links-container');
    container.innerHTML = '';
    
    this.links.forEach(link => {
      const linkElement = document.createElement('a');
      linkElement.href = link.url;
      linkElement.textContent = link.name;
      // linkElement.target = '_blank';
      linkElement.className = 'sidebar-link';
      container.appendChild(linkElement);
    });
  }

  updateLinks(newLinks) {
    this.links = newLinks;
    this.saveConfig();
    this.renderLinks();
  }
}

// Configuration management
class TimeZoneConfig {
  constructor() {
    this.defaultTimeZones = [
      { zone: "America/Los_Angeles", name: "Los Angeles" },
      { zone: "America/Toronto", name: "Toronto" },
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
const linksConfig = new LinksConfig();

// ------------------- sidebar hover logic ----------------------
const sidebar = document.getElementById('sidebar');
const body = document.body;
let sidebarTimeout;
let isHoveringSidebar = false;

function expandSidebar() {
  sidebar.classList.add('expanded');
  body.classList.add('sidebar-expanded');
  isHoveringSidebar = true;
}

function collapseSidebar() {
  sidebar.classList.remove('expanded');
  body.classList.remove('sidebar-expanded');
  isHoveringSidebar = false;
}

// Mouse position tracking for sidebar expansion
document.addEventListener('mousemove', (e) => {
  const mouseX = e.clientX;
  const threshold = 200; // pixels from left edge
  
  if (mouseX <= threshold && !isHoveringSidebar) {
    clearTimeout(sidebarTimeout);
    sidebarTimeout = setTimeout(expandSidebar, 100);
  } else if (mouseX > 200 && isHoveringSidebar && !sidebar.contains(e.target)) {
    clearTimeout(sidebarTimeout);
    sidebarTimeout = setTimeout(collapseSidebar, 300);
  }
});

// Keep sidebar open when hovering over it
sidebar.addEventListener('mouseenter', () => {
  clearTimeout(sidebarTimeout);
  if (!isHoveringSidebar) {
    expandSidebar();
  }
});

sidebar.addEventListener('mouseleave', () => {
  clearTimeout(sidebarTimeout);
  sidebarTimeout = setTimeout(collapseSidebar, 300);
});

// ------------------- converter logic ----------------------
const toggleBtn = document.getElementById("toggle");
const form = document.getElementById("conv-form");
const baseInput = document.getElementById("base-time");
const zoneSelect = document.getElementById("base-zone");
const resultsBox = document.getElementById("conv-results");
const timeError = document.getElementById("time-error");

toggleBtn.addEventListener("click", () => {
  form.style.display = form.style.display === "none" ? "block" : "none";
  if (form.style.display === "none") {
    resetConverter();
  }
});

// Real-time input validation
baseInput.addEventListener("input", (e) => {
  const value = e.target.value;
  const timePattern = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
  
  if (value && !timePattern.test(value)) {
    timeError.classList.add("show");
    baseInput.setCustomValidity("Invalid time format");
  } else {
    timeError.classList.remove("show");
    baseInput.setCustomValidity("");
  }
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

function formatTimeForDisplay(time, timeZone) {
  return time.toLocaleTimeString("en-CA", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: timeZone,
  });
}

function formatResults(instant) {
  let resultsHTML = '';
  
  config.timeZones.forEach((c) => {
    const time = formatTimeForDisplay(instant, c.zone);
    const displayName = c.name.includes('/') ? c.name.split('/').pop() : c.name;
    const displayCity = displayName.replace(/_/g, ' ');
    
    resultsHTML += `
      <div class="result-item">
        <span class="result-city">${displayCity}</span>
        <span class="result-time">${time}</span>
      </div>
    `;
  });
  
  return resultsHTML;
}

function showError(message) {
  resultsBox.innerHTML = `<div class="error-message">${message}</div>`;
  resultsBox.classList.remove('empty');
}

function resetConverter() {
  form.reset();
  resultsBox.innerHTML = "Results will appear here";
  resultsBox.classList.add('empty');
  timeError.classList.remove("show");
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  
  const timeVal = baseInput.value.trim();
  const baseZone = zoneSelect.value;
  
  // Validate inputs
  if (!timeVal) {
    showError("Please enter a time to convert");
    return;
  }
  
  if (!baseZone) {
    showError("Please select a time zone");
    return;
  }
  
  const instant = getInstantForLocalTime(timeVal, baseZone);
  if (!instant) {
    showError("Could not calculate time conversion");
    return;
  }
  
  const resultsHTML = formatResults(instant);
  resultsBox.innerHTML = resultsHTML;
  resultsBox.classList.remove('empty');
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
  baseZone.innerHTML = '<option value="">Select time zone</option>';
  
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

// ------------------- links management logic ----------------------
const manageLinksBtn = document.getElementById('manage-links-btn');
const linksModal = document.getElementById('links-modal');
const closeLinksModal = document.getElementById('close-links-modal');
const addLinkBtn = document.getElementById('add-link');
const saveLinksBtn = document.getElementById('save-links');
const cancelLinksBtn = document.getElementById('cancel-links');
const linksList = document.getElementById('links-list');

function openLinksModal() {
  linksModal.classList.add('show');
  renderLinksList();
}

function closeLinksModalHandler() {
  linksModal.classList.remove('show');
}

function renderLinksList() {
  linksList.innerHTML = '';
  
  linksConfig.links.forEach((link, index) => {
    const item = createLinkItem(link.name, link.url);
    linksList.appendChild(item);
  });
}

function createLinkItem(name, url) {
  const item = document.createElement('div');
  item.className = 'link-item';
  
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = 'Link name';
  nameInput.value = name;
  nameInput.className = 'link-name-input';
  
  const urlInput = document.createElement('input');
  urlInput.type = 'url';
  urlInput.placeholder = 'https://example.com';
  urlInput.value = url;
  urlInput.className = 'link-url-input';
  
  const removeBtn = document.createElement('button');
  removeBtn.className = 'remove-link';
  removeBtn.textContent = '×';
  removeBtn.onclick = () => {
    if (linksList.children.length > 1) {
      item.remove();
    }
  };
  
  item.appendChild(nameInput);
  item.appendChild(urlInput);
  item.appendChild(removeBtn);
  
  return item;
}

function addLink() {
  const item = createLinkItem('', '');
  linksList.appendChild(item);
}

function saveLinks() {
  const newLinks = [];
  const items = linksList.querySelectorAll('.link-item');
  
  items.forEach(item => {
    const nameInput = item.querySelector('.link-name-input');
    const urlInput = item.querySelector('.link-url-input');
    
    if (nameInput.value.trim() && urlInput.value.trim()) {
      newLinks.push({
        name: nameInput.value.trim(),
        url: urlInput.value.trim()
      });
    }
  });
  
  if (newLinks.length > 0) {
    linksConfig.updateLinks(newLinks);
    closeLinksModalHandler();
  }
}

// Links modal event listeners
manageLinksBtn.addEventListener('click', openLinksModal);
closeLinksModal.addEventListener('click', closeLinksModalHandler);
addLinkBtn.addEventListener('click', addLink);
saveLinksBtn.addEventListener('click', saveLinks);
cancelLinksBtn.addEventListener('click', closeLinksModalHandler);

// Close links modal when clicking outside
linksModal.addEventListener('click', (e) => {
  if (e.target === linksModal) {
    closeLinksModalHandler();
  }
});

// Update converter options when settings change
const originalUpdateTimeZones = config.updateTimeZones;
config.updateTimeZones = function(newTimeZones) {
  originalUpdateTimeZones.call(this, newTimeZones);
  updateConverterOptions();
};