document.addEventListener("DOMContentLoaded", function () {
  const repeatSelect = document.getElementById("repeat_type");
  const targetContainer = document.getElementById("target-day-field");

  function updateTargetField() {
    if (!repeatSelect || !targetContainer) return;
    const type = repeatSelect.value;
    let html = "";

    if (type === "daily" || type === "none") {
      targetContainer.innerHTML = "";
      return;
    }

    if (type === "weekly") {
      html = `
        <label>Target Day</label>
        <select name="target_day" id="target_day" class="weekday-select">
          <option value="">Select a day</option>
          <option value="Monday">Monday</option>
          <option value="Tuesday">Tuesday</option>
          <option value="Wednesday">Wednesday</option>
          <option value="Thursday">Thursday</option>
          <option value="Friday">Friday</option>
          <option value="Saturday">Saturday</option>
          <option value="Sunday">Sunday</option>
        </select>`;
    } else if (type === "monthly") {
      html = `
        <label>Target Date</label>
        <input type="date" name="target_day" id="target_day" class="date-input" placeholder="Select day of month">`;
    }

    targetContainer.innerHTML = html;
  }

  if (repeatSelect) {
    repeatSelect.addEventListener("change", updateTargetField);
    updateTargetField();
  }

  const toggleBtn = document.getElementById("toggleGoals");
  const todaySection = document.getElementById("todaySection");
  const allSection = document.getElementById("allSection");

  if (toggleBtn && todaySection && allSection) {
    let showingAll = false;
    allSection.classList.add("hidden");
    todaySection.classList.remove("hidden");
    toggleBtn.textContent = "Show All Goals";

    toggleBtn.addEventListener("click", () => {
      showingAll = !showingAll;
      if (showingAll) {
        allSection.classList.remove("hidden");
        todaySection.classList.add("hidden");
        toggleBtn.textContent = "Show Today's Goals";
      } else {
        todaySection.classList.remove("hidden");
        allSection.classList.add("hidden");
        toggleBtn.textContent = "Show All Goals";
      }
    });
  }

  const openModalBtn = document.getElementById("openGoalModal");
  const closeModalBtn = document.getElementById("closeGoalModal");
  const modal = document.getElementById("goalModal");

  if (openModalBtn && modal) {
    openModalBtn.addEventListener("click", () => modal.classList.remove("hidden"));

    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => modal.classList.add("hidden"));
    }

    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  }

  const timeSlider = document.getElementById("timeSlider");
  const timeValue = document.getElementById("timeValue");
  const timerDisplay = document.getElementById("timerDisplay");
  const startBtn = document.getElementById("startTimer");
  const resetBtn = document.getElementById("resetTimer");
  const focusModal = document.getElementById("focusModal");
  const focusCountdown = document.getElementById("focusCountdown");
  const exitFocus = document.getElementById("exitFocus");

  let timerDuration = 25 * 60;
  let remainingTime = timerDuration;
  let timerInterval = null;
  let isRunning = false;

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }

  function updateDisplay() {
    const display = formatTime(Math.max(0, remainingTime));
    if (timerDisplay) timerDisplay.textContent = display;
    if (focusCountdown) focusCountdown.textContent = display;
  }

  if (timeSlider && timeValue && timerDisplay && startBtn && resetBtn && focusModal && focusCountdown && exitFocus) {
    timeSlider.addEventListener("input", () => {
      timeValue.textContent = timeSlider.value;
      if (!isRunning) {
        timerDuration = Number(timeSlider.value) * 60;
        remainingTime = timerDuration;
        updateDisplay();
      }
    });

    startBtn.addEventListener("click", () => {
      if (isRunning) return;
      isRunning = true;
      focusModal.classList.remove("hidden");
      updateDisplay();

      timerInterval = setInterval(() => {
        if (remainingTime > 0) {
          remainingTime--;
          updateDisplay();
        }

        if (remainingTime <= 0) {
          clearInterval(timerInterval);
          remainingTime = 0;
          updateDisplay();
          isRunning = false;
          awardSidekickProgress(18, 12, "Focus session complete! Your sidekick found 12 shards.");
          alert("⏰ Time’s up! Great job staying focused!");
          focusModal.classList.add("hidden");
        }
      }, 1000);
    });

    resetBtn.addEventListener("click", () => {
      clearInterval(timerInterval);
      isRunning = false;
      remainingTime = timerDuration;
      updateDisplay();
    });

    exitFocus.addEventListener("click", () => {
      focusModal.classList.add("hidden");
      clearInterval(timerInterval);
      isRunning = false;
      if (remainingTime <= 0) remainingTime = timerDuration;
      updateDisplay();
    });

    updateDisplay();
  }

  const priorityBox = document.getElementById("priorityBox");
  const priorityList = document.getElementById("priority-list");
  const goalsColumn = document.querySelector(".habits-column");

  if (priorityBox && priorityList) {
    document.querySelectorAll(".goal-card").forEach((card) => {
      card.setAttribute("draggable", "true");

      card.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("goal-id", card.dataset.goalId);
        e.dataTransfer.setData("goal-title", card.querySelector("h4").innerText);
        priorityBox.classList.add("dragging-over");
      });

      card.addEventListener("dragend", () => {
        priorityBox.classList.remove("dragging-over");
      });
    });

    priorityBox.addEventListener("dragover", (e) => e.preventDefault());

    priorityBox.addEventListener("drop", (e) => {
      e.preventDefault();
      priorityBox.classList.remove("dragging-over");
      addToPriorities(e.dataTransfer.getData("goal-id"), e.dataTransfer.getData("goal-title"));
    });

    // Touch devices can't drag-and-drop, so goal cards show a tap button instead
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".btn-prioritize");
      if (!btn) return;
      const card = btn.closest(".goal-card");
      addToPriorities(card.dataset.goalId, card.querySelector("h4").innerText);
      btn.classList.add("added");
      priorityBox.scrollIntoView({ behavior: "smooth", block: "center" });
    });

    async function addToPriorities(goalId, goalTitle) {
      if (!goalId) return;

      if (priorityList.querySelector(`[data-goal-id="${goalId}"]`)) return;

      const li = document.createElement("li");
      li.className = "task-item";
      li.setAttribute("data-goal-id", goalId);
      li.setAttribute("draggable", "true");
      li.innerHTML = `
        <span class="task-title">${goalTitle}</span>
        <div class="actions">
          <button class="check-btn" data-action="complete" title="Mark Complete">✓</button>
          <button class="remove-btn" data-action="remove" title="Remove from Priorities">×</button>
        </div>`;
      priorityList.appendChild(li);
      wirePriorityItemDrag(li);
      showEmptyMessageIfNeeded();

      await fetch("/priority/add", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ goal_id: goalId })
      });
    }

    if (goalsColumn) {
      goalsColumn.addEventListener("dragover", (e) => {
        if (document.querySelector("#priority-list .task-item.dragging")) e.preventDefault();
      });

      goalsColumn.addEventListener("drop", async () => {
        const draggingLi = document.querySelector("#priority-list .task-item.dragging");
        if (!draggingLi) return;

        const goalId = draggingLi.getAttribute("data-goal-id");
        draggingLi.remove();
        showEmptyMessageIfNeeded();

        await fetch("/priority/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal_id: goalId })
        });
      });
    }

    function wirePriorityItemDrag(li) {
      li.addEventListener("dragstart", () => li.classList.add("dragging"));
      li.addEventListener("dragend", () => li.classList.remove("dragging"));
    }

    priorityList.querySelectorAll(".task-item").forEach(wirePriorityItemDrag);

    priorityList.addEventListener("click", async (e) => {
      const btn = e.target.closest("button");
      if (!btn) return;
      const li = e.target.closest(".task-item");
      if (!li) return;
      const goalId = li.getAttribute("data-goal-id");

      if (btn.dataset.action === "complete") {
        li.remove();
        showEmptyMessageIfNeeded();

        const res = await fetch("/priority/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal_id: goalId })
        });

        const data = await res.json();
        if (data.success) {
          const goalCard = document.querySelector(`.goal-card[data-goal-id="${data.goal_id}"]`);
          const goalTitle = data.title || (goalCard ? goalCard.querySelector("h4")?.textContent : "Completed habit");

          if (goalCard) {
            goalCard.remove();
          }

          addCompletedTodayItem(data.goal_id, goalTitle);
          loadWeeklyProgress();
        }
        return;
      }

      if (btn.dataset.action === "remove") {
        li.remove();
        showEmptyMessageIfNeeded();

        await fetch("/priority/remove", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ goal_id: goalId })
        });
      }
    });

    function showEmptyMessageIfNeeded() {
      const empty = priorityList.querySelector(".empty");
      const hasItems = priorityList.querySelector(".task-item");
      if (!hasItems && !empty) {
        const li = document.createElement("li");
        li.className = "empty";
        li.textContent = "No priorities yet. Drag or star a habit to add one!";
        priorityList.appendChild(li);
      } else if (hasItems && empty) {
        empty.remove();
      }
    }
  }

  initOnboarding();
  initSidekick();
  initWeeklyProgressControls();
});

let weeklyProgressChart = null;
let visibleWeekStart = getStartOfWeek(new Date());

function getStartOfWeek(date) {
  const copy = new Date(date);
  const day = copy.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  copy.setDate(copy.getDate() + diff);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function formatDateForApi(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function initWeeklyProgressControls() {
  const prev = document.getElementById("prevWeek");
  const next = document.getElementById("nextWeek");

  if (prev) {
    prev.addEventListener("click", () => {
      visibleWeekStart.setDate(visibleWeekStart.getDate() - 7);
      loadWeeklyProgress();
    });
  }

  if (next) {
    next.addEventListener("click", () => {
      visibleWeekStart.setDate(visibleWeekStart.getDate() + 7);
      loadWeeklyProgress();
    });
  }

  loadWeeklyProgress();
}

async function loadWeeklyProgress() {
  const ctx = document.getElementById("progressChart");
  if (!ctx || typeof Chart === "undefined") return;

  const weekRange = document.getElementById("weekRange");
  const next = document.getElementById("nextWeek");
  const currentWeekStart = getStartOfWeek(new Date());

  if (next) {
    next.disabled = visibleWeekStart >= currentWeekStart;
  }

  const res = await fetch(`/api/progress_data?week_start=${formatDateForApi(visibleWeekStart)}`);
  const payload = await res.json();
  const data = payload.data || [];

  if (weekRange) weekRange.textContent = payload.label || "This week";

  const labels = data.map((d) => d.date);
  const counts = data.map((d) => d.count);

  if (weeklyProgressChart) {
    weeklyProgressChart.data.labels = labels;
    weeklyProgressChart.data.datasets[0].data = counts;
    weeklyProgressChart.update();
    return;
  }

  weeklyProgressChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Habits Completed",
        data: counts,
        backgroundColor: [
          "#b9a8f5", "#7dd3a8", "#ffb9a0", "#ffc857", "#8cc7f0", "#f58bb0", "#6b55d6"
        ],
        borderWidth: 0,
        borderRadius: 12,
        borderSkipped: false,
        maxBarThickness: 48
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: "#5e5977", font: { family: "Nunito Sans", weight: "600" } },
          grid: { color: "rgba(45, 41, 70, 0.07)" },
          border: { display: false }
        },
        x: {
          ticks: { color: "#2d2946", font: { family: "Nunito Sans", weight: "700" } },
          grid: { display: false },
          border: { display: false }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#2d2946",
          titleColor: "#ffffff",
          bodyColor: "#ffffff",
          padding: 10,
          cornerRadius: 12,
          displayColors: false
        }
      }
    }
  });
}

function addCompletedTodayItem(goalId, title) {
  const list = document.getElementById("completedTodayList");
  if (!list || !goalId || !title) return;

  if (list.querySelector(`[data-goal-id="${goalId}"]`)) return;

  const empty = document.getElementById("completedTodayEmpty");
  if (empty) empty.remove();

  const item = document.createElement("li");
  item.setAttribute("data-goal-id", goalId);
  item.innerHTML = `<span class="completed-check">✓</span><span>${title}</span>`;
  list.appendChild(item);
}


const SIDEKICK_KEY_BASE = "focus-sidekick-v1";
const MINI_HABIT_KEY_BASE = "focus-mini-habits-v1";

function getCurrentUserId() {
  const hub = document.querySelector(".sidekick-hub");
  return hub?.dataset.userId || "guest";
}

function getSidekickStorageKey() {
  return `${SIDEKICK_KEY_BASE}-user-${getCurrentUserId()}`;
}

function getMiniHabitStorageKey() {
  return `${MINI_HABIT_KEY_BASE}-user-${getCurrentUserId()}`;
}

const sidekickCharacters = {
  dino: {
    label: "Dino",
    image: "/static/img/sidekicks/dino.png",
    messages: ["Tiny stomps still move mountains.", "Rawr means nice work!", "I saved a leaf snack for later."]
  },
  fox: {
    label: "Fox",
    image: "/static/img/sidekicks/fox.png",
    messages: ["Sneaky progress is still progress.", "One clever habit at a time.", "I found a cozy path for us."]
  },
  panda: {
    label: "Panda",
    image: "/static/img/sidekicks/panda.png",
    messages: ["Soft start, strong finish.", "Snack break after one more habit?", "You're doing bamboo-zlingly well."]
  },
  cow: {
    label: "Cow",
    image: "/static/img/sidekicks/cow.png",
    messages: ["Moo-ving through the day together.", "Small habits, big pasture energy.", "You’re doing udderly great."]
  }
};

function getTodayKey() {
  return new Date().toISOString().slice(0, 10);
}

function cleanSidekickName(name) {
  const trimmed = String(name || "").trim();
  return trimmed || "Mochi";
}

function getServerSidekickDefaults() {
  const hub = document.querySelector(".sidekick-hub");
  return {
    name: cleanSidekickName(hub ? hub.dataset.sidekickName : "Mochi"),
    character: hub && sidekickCharacters[hub.dataset.sidekickCharacter] ? hub.dataset.sidekickCharacter : "dino"
  };
}

function loadSidekickState() {
  const serverDefaults = getServerSidekickDefaults();
  const fallback = {
    name: serverDefaults.name,
    character: serverDefaults.character,
    xp: 0,
    coins: 25,
    lastCompletedToday: 0,
    lastSeenDate: getTodayKey()
  };

  try {
    const saved = JSON.parse(localStorage.getItem(getSidekickStorageKey())) || {};    const legacyCharacter = saved.character || saved.form || fallback.character;
    return {
      ...fallback,
      ...saved,
      character: serverDefaults.character,
      name: serverDefaults.name,
      xp: Number(saved.xp ?? fallback.xp),
      coins: Number(saved.coins ?? fallback.coins),
      lastCompletedToday: Number(saved.lastCompletedToday ?? fallback.lastCompletedToday),
      lastSeenDate: saved.lastSeenDate || fallback.lastSeenDate
    };
  } catch {
    return fallback;
  }
}

function saveSidekickState(state) {
  localStorage.setItem(getSidekickStorageKey(), JSON.stringify(state));
}

function calculateSidekickLevel(xp) {
  return Math.floor(xp / 100) + 1;
}

function getSidekickStage(level) {
  if (level >= 8) return "Legend";
  if (level >= 5) return "Explorer";
  if (level >= 3) return "Buddy";
  return "Sprout";
}

function setSidekickSpeech(text) {
  const speech = document.getElementById("sidekickSpeech");
  if (speech) speech.textContent = text;
}

function renderSidekick(state) {
  const hub = document.querySelector(".sidekick-hub");
  if (!hub) return;

  const level = calculateSidekickLevel(state.xp);
  const stage = getSidekickStage(level);
  const xpIntoLevel = state.xp % 100;
  const character = sidekickCharacters[state.character] || sidekickCharacters.dino;

  hub.dataset.character = state.character;
  document.getElementById("sidekickName").textContent = state.name;
  document.getElementById("sidekickStage").textContent = `${character.label} ${stage}`;
  document.getElementById("sidekickLevel").textContent = level;
  document.getElementById("sidekickXP").textContent = state.xp;
  document.getElementById("sidekickCoins").textContent = state.coins;
  document.getElementById("growthMeter").style.width = `${xpIntoLevel}%`;

  const image = document.getElementById("sidekickImage");
  if (image) {
    image.src = character.image;
    image.alt = `${state.name}, your ${character.label.toLowerCase()} sidekick`;
  }

  const accessory = document.getElementById("sidekickAccessory");
  if (accessory) accessory.textContent = level >= 5 ? "🎒" : level >= 3 ? "🌼" : "";
}

function sparkleBurst() {
  const field = document.getElementById("sparkleField");
  if (!field) return;
  field.innerHTML = "";
  for (let i = 0; i < 12; i += 1) {
    const sparkle = document.createElement("span");
    sparkle.style.left = `${20 + Math.random() * 60}%`;
    sparkle.style.top = `${20 + Math.random() * 55}%`;
    sparkle.style.animationDelay = `${Math.random() * 0.25}s`;
    sparkle.textContent = "✦";
    field.appendChild(sparkle);
  }
  setTimeout(() => { field.innerHTML = ""; }, 1200);
}

function awardSidekickProgress(xp = 0, coins = 0, message = "Nice work! Your sidekick feels stronger.") {
  const hub = document.querySelector(".sidekick-hub");
  if (!hub) return;

  const state = loadSidekickState();
  state.xp += xp;
  state.coins += coins;
  saveSidekickState(state);
  renderSidekick(state);
  setSidekickSpeech(message);
  sparkleBurst();
}

function initOnboarding() {
  const picker = document.getElementById("onboardingCharacterPicker");
  const characterField = document.getElementById("sidekickCharacterField");
  if (!picker || !characterField) return;

  picker.addEventListener("click", (event) => {
    const button = event.target.closest(".character-option");
    if (!button) return;

    const selectedCharacter = button.dataset.character || "dino";
    characterField.value = selectedCharacter;

    picker.querySelectorAll(".character-option").forEach((option) => {
      const isSelected = option === button;
      option.classList.toggle("selected", isSelected);
      option.setAttribute("aria-pressed", String(isSelected));
    });
  });
}

function initMiniHabits() {
  const grid = document.getElementById("miniHabitGrid");
  const openEditor = document.getElementById("openMiniHabitEditor");
  const modal = document.getElementById("miniHabitEditorModal");
  const editorList = document.getElementById("miniHabitEditorList");
  const addRowButton = document.getElementById("addMiniHabitRow");
  const saveEditButton = document.getElementById("saveMiniHabitsEdit");
  const cancelEditButton = document.getElementById("cancelMiniHabitsEdit");
  const iconChoices = ["💧", "🌿", "🧺", "✨", "🍎", "📚", "🧘", "🎨", "📝", "🌞", "⭐", "💪"];
  
  if (!grid) return;

  const today = getTodayKey();
  const storageKey = getMiniHabitStorageKey();

  const defaultTasks = [
    { id: "water", emoji: "💧", title: "Drink water", xp: 8 },
    { id: "stretch", emoji: "🌿", title: "Stretch", xp: 8 },
    { id: "tidy", emoji: "🧺", title: "Tidy desk", xp: 8 },
    { id: "reflect", emoji: "✨", title: "Reflect", xp: 8 }
  ];

  let miniHabits = {};

  try {
    miniHabits = JSON.parse(localStorage.getItem(storageKey)) || {};
  } catch {
    miniHabits = {};
  }

  if (!miniHabits.tasks) miniHabits.tasks = defaultTasks;
  if (miniHabits.date !== today) {
    miniHabits.date = today;
    miniHabits.completed = [];
  }

  function saveMiniHabits() {
    localStorage.setItem(storageKey, JSON.stringify(miniHabits));
  }

  function clampXP(value) {
    return Math.min(10, Math.max(1, Number(value) || 1));
  }

  function renderMiniHabits() {
    grid.innerHTML = "";

    miniHabits.tasks.forEach((task) => {
      const button = document.createElement("button");
      button.className = "mini-habit";
      button.type = "button";
      button.dataset.habit = task.id;
      button.dataset.xp = task.xp;

      if (miniHabits.completed.includes(task.id)) {
        button.classList.add("done");
      }

      button.innerHTML = `
        <span>${task.emoji || "⭐"}</span>
        <strong>${task.title}</strong>
        <small>+${task.xp} XP</small>
      `;

      grid.appendChild(button);
    });
  }

  function renderEditorRows() {
    if (!editorList) return;

    editorList.innerHTML = "";

    miniHabits.tasks.forEach((task) => {
      const row = document.createElement("div");
      row.className = "mini-habit-editor-row";
      row.dataset.id = task.id;
      row.dataset.icon = task.emoji || "⭐";

      row.innerHTML = `
        <div class="icon-picker" aria-label="Pick a task icon">
          ${iconChoices.map((icon) => `
            <button 
              class="icon-choice ${icon === task.emoji ? "selected" : ""}" 
              type="button" 
              data-icon="${icon}">
              ${icon}
            </button>
          `).join("")}
        </div>

        <input class="mini-task-title" type="text" maxlength="40" value="${task.title}" aria-label="Task title">
        <input class="mini-task-xp" type="number" min="1" max="10" value="${task.xp}" aria-label="Task XP">
        <button class="remove-mini-task" type="button">Remove</button>
      `;

      editorList.appendChild(row);
    });
  }

  grid.addEventListener("click", (event) => {
    const button = event.target.closest(".mini-habit");
    if (!button || miniHabits.completed.includes(button.dataset.habit)) return;

    const xp = clampXP(button.dataset.xp);

    miniHabits.completed.push(button.dataset.habit);
    saveMiniHabits();
    renderMiniHabits();

    awardSidekickProgress(
      xp,
      4,
      `${button.querySelector("strong").textContent} complete! +${xp} XP`
    );
  });

  if (openEditor && modal) {
    openEditor.addEventListener("click", () => {
      renderEditorRows();
      modal.classList.remove("hidden");
    });
  }

  if (addRowButton) {
    addRowButton.addEventListener("click", () => {
      miniHabits.tasks.push({
        id: `custom-${Date.now()}`,
        emoji: "⭐",
        title: "New task",
        xp: 5
      });

      renderEditorRows();
    });
  }

  if (editorList) {
    const iconButton = event.target.closest(".icon-choice");
    if (iconButton) {
      const row = iconButton.closest(".mini-habit-editor-row");
      row.dataset.icon = iconButton.dataset.icon;

      row.querySelectorAll(".icon-choice").forEach((button) => {
        button.classList.remove("selected");
      });

      iconButton.classList.add("selected");
      return;
    }
    
    editorList.addEventListener("click", (event) => {
      const removeButton = event.target.closest(".remove-mini-task");
      if (!removeButton) return;

      const row = removeButton.closest(".mini-habit-editor-row");
      const taskId = row.dataset.id;

      miniHabits.tasks = miniHabits.tasks.filter((task) => task.id !== taskId);
      miniHabits.completed = miniHabits.completed.filter((id) => id !== taskId);

      renderEditorRows();
    });
  }

  if (saveEditButton) {
    saveEditButton.addEventListener("click", () => {
      const rows = editorList.querySelectorAll(".mini-habit-editor-row");

      miniHabits.tasks = [...rows].map((row) => ({
        id: row.dataset.id,
        emoji: row.dataset.icon || "⭐",        title: row.querySelector(".mini-task-title").value.trim() || "Untitled task",
        xp: clampXP(row.querySelector(".mini-task-xp").value)
      }));

      saveMiniHabits();
      renderMiniHabits();
      modal.classList.add("hidden");
      setSidekickSpeech("Daily tasks updated!");
    });
  }

  if (cancelEditButton) {
    cancelEditButton.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }

  if (modal) {
    modal.addEventListener("click", (event) => {
      if (event.target === modal) modal.classList.add("hidden");
    });
  }

  saveMiniHabits();
  renderMiniHabits();
}

function initSidekick() {
  const hub = document.querySelector(".sidekick-hub");
  if (!hub) return;

  const today = getTodayKey();
  const completedToday = Number(hub.dataset.completedToday || 0);
  let state = loadSidekickState();

  if (state.lastSeenDate !== today) {
    state.lastSeenDate = today;
    state.lastCompletedToday = 0;
  }

  if (completedToday > state.lastCompletedToday) {
    const newlyCompleted = completedToday - state.lastCompletedToday;
    state.xp += newlyCompleted * 15;
    state.coins += newlyCompleted * 10;
    state.lastCompletedToday = completedToday;
    saveSidekickState(state);
    setSidekickSpeech(`You completed ${newlyCompleted} habit${newlyCompleted === 1 ? "" : "s"}! +${newlyCompleted * 15} XP`);
    sparkleBurst();
  } else {
    const character = sidekickCharacters[state.character] || sidekickCharacters.dino;
    setSidekickSpeech(character.messages[Math.floor(Math.random() * character.messages.length)]);
  }

  saveSidekickState(state);
  renderSidekick(state);
  initMiniHabits();

  const avatar = document.getElementById("sidekickAvatar");
  if (avatar) {
    avatar.addEventListener("click", () => {
      sparkleBurst();
      setSidekickSpeech("Hehe! That tickles. Let’s get one tiny thing done.");
    });
  }

  const feedButton = document.getElementById("feedSidekick");
  if (feedButton) {
    feedButton.addEventListener("click", () => {
      state = loadSidekickState();
      if (state.coins < 10) {
        setSidekickSpeech("Need 10 shards for a treat. Complete a habit first!");
        return;
      }
      state.coins -= 10;
      state.xp += 10;
      saveSidekickState(state);
      renderSidekick(state);
      sparkleBurst();
      setSidekickSpeech("Yum! Treat powered. +10 XP");
    });
  }

  const editButton = document.getElementById("editSidekickName");
  const nameModal = document.getElementById("sidekickNameModal");
  const nameInput = document.getElementById("sidekickNameInput");
  const saveName = document.getElementById("saveSidekickName");
  const cancelName = document.getElementById("cancelSidekickName");

  function closeNameModal() {
    if (nameModal) nameModal.classList.add("hidden");
  }

  if (editButton && nameModal && nameInput && saveName) {
    editButton.addEventListener("click", () => {
      state = loadSidekickState();
      nameInput.value = state.name;
      nameModal.classList.remove("hidden");
      nameInput.focus();
    });

    const nameForm = document.getElementById("sidekickNameForm");

    if (nameForm) {
      nameForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        state = loadSidekickState();
        state.name = cleanSidekickName(nameInput.value);

        try {
          const response = await fetch(nameForm.action, {
            method: "POST",
            headers: { "X-Requested-With": "XMLHttpRequest" },
            body: new FormData(nameForm)
          });
          const data = await response.json();
          state.name = cleanSidekickName(data.name || state.name);
        } catch {
          // If the network request fails locally, keep the UI responsive.
          // Refreshing the page will show whatever is saved in the database.
        }

        const hub = document.querySelector(".sidekick-hub");
        if (hub) hub.dataset.sidekickName = state.name;
        saveSidekickState(state);
        renderSidekick(state);
        setSidekickSpeech(`New name saved. Hi, ${state.name}!`);
        closeNameModal();
      });
    }

    nameInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") saveName.click();
      if (event.key === "Escape") closeNameModal();
    });

    if (cancelName) cancelName.addEventListener("click", closeNameModal);

    nameModal.addEventListener("click", (event) => {
      if (event.target === nameModal) closeNameModal();
    });
  }
}
