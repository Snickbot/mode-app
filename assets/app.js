const MODES_KEY = "modeAppModes";
const ACTIVE_KEY = "modeAppActiveId";

function getModes() {
  const raw = localStorage.getItem(MODES_KEY);
  return raw ? JSON.parse(raw) : [];
}

function saveModes(modes) {
  localStorage.setItem(MODES_KEY, JSON.stringify(modes));
}

function getActiveId() {
  return localStorage.getItem(ACTIVE_KEY);
}

function setActiveId(id) {
  localStorage.setItem(ACTIVE_KEY, String(id));
}

function getActiveMode() {
  const modes = getModes();
  const id = getActiveId();
  return modes.find(m => String(m.id) === String(id)) || modes[0] || null;
}

function updateActiveMode(updatedMode) {
  const modes = getModes();
  const idx = modes.findIndex(m => String(m.id) === String(updatedMode.id));
  if (idx > -1) modes[idx] = updatedMode;
  saveModes(modes);
}

function showScreen(id) {
  document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  window.scrollTo(0, 0);
}

function getChecked(containerId) {
  return Array.from(document.querySelectorAll("#" + containerId + " input:checked")).map(i => i.value);
}

function wordFor(value, low, mid, high) {
  if (value < 40) return low;
  if (value > 60) return high;
  return mid;
}

function generateModeProfile(sliders, focus) {
  const energyWord = wordFor(sliders.energy, "Calm", "Balanced", "Energetic");
  const assertWord = wordFor(sliders.assertive, "Composed", "Steady", "Confident");
  const name = (energyWord + " " + assertWord).toUpperCase();
  let focusText = focus.length
    ? "Your training will focus on " + focus.join(", ").toLowerCase() + "."
    : "Your training will focus on general presence and communication.";
  const desc = "Your practice centers on " + energyWord.toLowerCase() + " energy and " +
    assertWord.toLowerCase() + " delivery — relaxed posture, deliberate pauses, and clear communication. " + focusText;
  return { name, desc };
}

function dayNumber(startDate) {
  const start = new Date(startDate);
  const now = new Date();
  const diffDays = Math.floor((now - start) / (1000 * 60 * 60 * 24)) + 1;
  return Math.min(Math.max(diffDays, 1), 7);
}

function todayKey() {
  return new Date().toISOString().split("T")[0];
}

function renderDashboard() {
  const mode = getActiveMode();
  if (!mode) return;

  const day = dayNumber(mode.startDate);
  document.getElementById("dashboard-day").textContent = "DAY " + day + " OF 7";
  document.getElementById("dashboard-mode-name").textContent = mode.modeName;

  const categories = ["BODY", "VOICE", "SOCIAL", "MINDSET", "PRESENCE"];
  const container = document.getElementById("training-cards");
  container.innerHTML = "";

  categories.forEach(cat => {
    const list = EXERCISES[cat];
    const ex = list[(day - 1) % list.length];
    const completionKey = "day" + day + "_" + cat;
    const alreadyDone = mode.completions && mode.completions[completionKey];

    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `
      <h3>${cat}</h3>
      <p><strong>WHAT TO DO</strong><br>${ex.what}</p>
      <p style="margin-top:10px;"><strong>WHY IT MATTERS</strong><br>${ex.why}</p>
      <p style="margin-top:10px;"><strong>TRY IT</strong><br>${ex.try}</p>
      <p style="margin-top:10px;"><strong>COMMON MISTAKE</strong><br>${ex.mistake}</p>
      <p style="margin-top:10px;"><strong>30-SECOND CHALLENGE</strong><br>${ex.challenge}</p>
      <div style="margin-top:14px;">
        ${alreadyDone
          ? `<p style="color:var(--text-dim); font-size:13px;">Completed — felt: ${alreadyDone}</p>`
          : `<button class="btn-primary complete-btn" data-key="${completionKey}">COMPLETE</button>
             <div class="feedback-row" id="feedback-${completionKey}" style="display:none; margin-top:10px; text-align:center; font-size:22px;">
               <span data-feel="Difficult" style="cursor:pointer; margin:0 8px;">😣</span>
               <span data-feel="Okay" style="cursor:pointer; margin:0 8px;">😐</span>
               <span data-feel="Comfortable" style="cursor:pointer; margin:0 8px;">🙂</span>
               <span data-feel="Easy" style="cursor:pointer; margin:0 8px;">🔥</span>
             </div>`
        }
      </div>
    `;
    container.appendChild(card);
  });

  document.querySelectorAll(".complete-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("feedback-" + btn.dataset.key).style.display = "block";
      btn.style.display = "none";
    });
  });

  document.querySelectorAll(".feedback-row span").forEach(span => {
    span.addEventListener("click", () => {
      const row = span.parentElement;
      const key = row.id.replace("feedback-", "");
      const m = getActiveMode();
      m.completions = m.completions || {};
      m.completions[key] = span.dataset.feel;
      updateActiveMode(m);
      renderDashboard();
    });
  });
}

function renderModeSwitch() {
  const modes = getModes();
  const activeId = getActiveId();
  const list = document.getElementById("modeswitch-list");
  list.innerHTML = "";

  if (modes.length === 0) {
    list.innerHTML = `<p style="color:var(--text-dim); font-size:14px;">No modes yet.</p>`;
    return;
  }

  modes.forEach(m => {
    const day = dayNumber(m.startDate);
    const card = document.createElement("div");
    card.className = "card";
    card.style.cursor = "pointer";
    card.innerHTML = `
      <div style="display:flex; justify-content:space-between; align-items:center;">
        <div>
          <h3 style="margin-bottom:4px;">${m.modeName}</h3>
          <p style="font-size:12px; color:var(--text-dim);">Day ${day} of 7</p>
        </div>
        ${String(m.id) === String(activeId) ? '<span style="font-size:12px; color:var(--text-dim);">ACTIVE</span>' : ''}
      </div>
    `;
    card.addEventListener("click", () => {
      setActiveId(m.id);
      renderDashboard();
      showScreen("screen-dashboard");
    });
    list.appendChild(card);
  });
}

const PROGRESS_SKILLS = ["Voice", "Posture", "Conversation", "Confidence", "Social Comfort", "Presentation", "Discipline"];

function renderProgressSliders() {
  const mode = getActiveMode();
  const container = document.getElementById("progress-sliders");
  container.innerHTML = "";
  const todayData = (mode.progress && mode.progress[todayKey()]) || {};

  PROGRESS_SKILLS.forEach(skill => {
    const key = skill.toLowerCase().replace(/ /g, "_");
    const val = todayData[key] || 5;
    const row = document.createElement("div");
    row.className = "slider-row";
    row.innerHTML = `
      <div class="slider-labels"><span>${skill.toUpperCase()}</span><span id="val-${key}">${val}/10</span></div>
      <input type="range" min="1" max="10" value="${val}" id="progress-${key}">
    `;
    container.appendChild(row);
  });

  PROGRESS_SKILLS.forEach(skill => {
    const key = skill.toLowerCase().replace(/ /g, "_");
    const slider = document.getElementById("progress-" + key);
    slider.addEventListener("input", () => {
      document.getElementById("val-" + key).textContent = slider.value + "/10";
    });
  });
}

function renderProgressHistory() {
  const mode = getActiveMode();
  const historyEl = document.getElementById("progress-history");
  historyEl.innerHTML = "";
  const progress = mode.progress || {};
  const dates = Object.keys(progress).sort().reverse();

  if (dates.length === 0) {
    historyEl.innerHTML = `<p style="color:var(--text-dim); font-size:14px;">No entries yet. Self-reported scores only.</p>`;
    return;
  }

  dates.forEach(date => {
    const scores = progress[date];
    const line = PROGRESS_SKILLS.map(s => {
      const key = s.toLowerCase().replace(/ /g, "_");
      return s + ": " + (scores[key] || "-") + "/10";
    }).join(" · ");
    const card = document.createElement("div");
    card.className = "card";
    card.innerHTML = `<p style="font-size:12px; color:var(--text-dim);">${date}</p><p style="font-size:13px; margin-top:6px;">${line}</p>`;
    historyEl.appendChild(card);
  });
}

function saveTodayProgress() {
  const mode = getActiveMode();
  mode.progress = mode.progress || {};
  const entry = {};
  PROGRESS_SKILLS.forEach(skill => {
    const key = skill.toLowerCase().replace(/ /g, "_");
    entry[key] = +document.getElementById("progress-" + key).value;
  });
  mode.progress[todayKey()] = entry;
  updateActiveMode(mode);
  renderProgressHistory();
  alert("Saved today's self-reported progress.");
}

function renderShareCard() {
  const mode = getActiveMode();
  const day = dayNumber(mode.startDate);
  const exList = EXERCISES.PRESENCE;
  const challenge = exList[(day - 1) % exList.length].challenge;

  const canvas = document.getElementById("share-canvas");
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;

  ctx.fillStyle = "#0b0b0d";
  ctx.fillRect(0, 0, w, h);

  ctx.textAlign = "center";
  ctx.fillStyle = "#9a9aa2";
  ctx.font = "24px sans-serif";
  ctx.fillText("MY MODE", w / 2, 140);

  ctx.fillStyle = "#f5f5f7";
  ctx.font = "bold 42px sans-serif";
  wrapText(ctx, mode.modeName, w / 2, 200, w - 100, 50);

  ctx.fillStyle = "#9a9aa2";
  ctx.font = "20px sans-serif";
  ctx.fillText("DAY " + day + " / 7", w / 2, 340);

  ctx.fillStyle = "#f5f5f7";
  ctx.font = "22px sans-serif";
  ctx.fillText("Current challenge:", w / 2, 460);

  ctx.font = "20px sans-serif";
  ctx.fillStyle = "#e8e8ed";
  wrapText(ctx, challenge, w / 2, 500, w - 100, 30);

  ctx.fillStyle = "#5a5a62";
  ctx.font = "16px sans-serif";
  ctx.fillText("Practice, not a guaranteed transformation.", w / 2, h - 40);

  const dataUrl = canvas.toDataURL("image/png");
  document.getElementById("download-card").href = dataUrl;
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let curY = y;
  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    if (ctx.measureText(testLine).width > maxWidth && i > 0) {
      ctx.fillText(line, x, curY);
      line = words[i] + " ";
      curY += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, x, curY);
}

document.addEventListener("DOMContentLoaded", () => {
  const modes = getModes();
  if (modes.length > 0 && getActiveMode()) {
    document.getElementById("btn-existing").style.display = "inline-block";
  }

  document.getElementById("btn-start").addEventListener("click", () => showScreen("screen-focus"));
  document.getElementById("btn-existing").addEventListener("click", () => {
    renderDashboard();
    showScreen("screen-dashboard");
  });

  document.querySelectorAll("[data-back]").forEach(btn => {
    btn.addEventListener("click", () => showScreen("screen-landing"));
  });

  document.getElementById("btn-focus-next").addEventListener("click", () => showScreen("screen-situations"));
  document.getElementById("btn-situations-next").addEventListener("click", () => showScreen("screen-sliders"));

  document.getElementById("btn-sliders-next").addEventListener("click", () => {
    const focus = getChecked("focus-list");
    const situations = getChecked("situations-list");
    const sliders = {
      energy: +document.getElementById("slider-energy").value,
      expressive: +document.getElementById("slider-expressive").value,
      formal: +document.getElementById("slider-formal").value,
      social: +document.getElementById("slider-social").value,
      assertive: +document.getElementById("slider-assertive").value
    };
    const profile = generateModeProfile(sliders, focus);
    document.getElementById("result-name").textContent = profile.name;
    document.getElementById("result-desc").textContent = profile.desc;
    window._pendingState = { focus, situations, sliders, modeName: profile.name, modeDesc: profile.desc };
    showScreen("screen-result");
  });

  document.getElementById("btn-start-training").addEventListener("click", () => {
    const pending = window._pendingState;
    const newMode = {
      id: Date.now(),
      modeName: pending.modeName,
      modeDesc: pending.modeDesc,
      focus: pending.focus,
      situations: pending.situations,
      sliders: pending.sliders,
      startDate: new Date().toISOString(),
      completions: {},
      progress: {}
    };
    const modes = getModes();
    modes.push(newMode);
    saveModes(modes);
    setActiveId(newMode.id);
    document.getElementById("btn-existing").style.display = "inline-block";
    renderDashboard();
    showScreen("screen-dashboard");
  });

  document.getElementById("btn-clear-data").addEventListener("click", () => {
    if (confirm("This will delete ALL your Modes and progress. Are you sure?")) {
      localStorage.removeItem(MODES_KEY);
      localStorage.removeItem(ACTIVE_KEY);
      document.getElementById("btn-existing").style.display = "none";
      showScreen("screen-landing");
    }
  });

  document.getElementById("btn-open-modeswitch").addEventListener("click", () => {
    renderModeSwitch();
    showScreen("screen-modeswitch");
  });
  document.getElementById("btn-back-modeswitch").addEventListener("click", () => showScreen("screen-dashboard"));
  document.getElementById("btn-new-mode").addEventListener("click", () => showScreen("screen-focus"));

  document.getElementById("btn-open-progress").addEventListener("click", () => {
    renderProgressSliders();
    renderProgressHistory();
    showScreen("screen-progress");
  });
  document.getElementById("btn-back-progress").addEventListener("click", () => showScreen("screen-dashboard"));
  document.getElementById("btn-save-progress").addEventListener("click", saveTodayProgress);

  document.getElementById("btn-open-share").addEventListener("click", () => {
    renderShareCard();
    showScreen("screen-share");
  });
  document.getElementById("btn-back-share").addEventListener("click", () => showScreen("screen-dashboard"));
});
