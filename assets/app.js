const STORAGE_KEY = "modeAppData";

function getState() {
  const raw = localStorage.getItem(STORAGE_KEY);
  return raw ? JSON.parse(raw) : null;
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
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

function generateMode(sliders, focus) {
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

function renderDashboard() {
  const state = getState();
  if (!state) return;

  const day = dayNumber(state.startDate);
  document.getElementById("dashboard-day").textContent = "DAY " + day + " OF 7";
  document.getElementById("dashboard-mode-name").textContent = state.modeName;

  const categories = ["BODY", "VOICE", "SOCIAL", "MINDSET", "PRESENCE"];
  const container = document.getElementById("training-cards");
  container.innerHTML = "";

  categories.forEach(cat => {
    const list = EXERCISES[cat];
    const ex = list[(day - 1) % list.length];
    const completionKey = "day" + day + "_" + cat;
    const alreadyDone = state.completions && state.completions[completionKey];

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
          : `<button class="btn-primary complete-btn" data-key="${completionKey}" data-cat="${cat}">COMPLETE</button>
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
      const s = getState();
      s.completions = s.completions || {};
      s.completions[key] = span.dataset.feel;
      saveState(s);
      renderDashboard();
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const existing = getState();
  if (existing) {
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

    const mode = generateMode(sliders, focus);
    document.getElementById("result-name").textContent = mode.name;
    document.getElementById("result-desc").textContent = mode.desc;

    window._pendingState = { focus, situations, sliders, modeName: mode.name, modeDesc: mode.desc };
    showScreen("screen-result");
  });

  document.getElementById("btn-start-training").addEventListener("click", () => {
    const state = window._pendingState;
    state.startDate = new Date().toISOString();
    state.completions = {};
    saveState(state);
    renderDashboard();
    showScreen("screen-dashboard");
  });

  document.getElementById("btn-clear-data").addEventListener("click", () => {
    if (confirm("This will delete your Mode and all progress. Are you sure?")) {
      localStorage.removeItem(STORAGE_KEY);
      showScreen("screen-landing");
      document.getElementById("btn-existing").style.display = "none";
    }
  });
});
