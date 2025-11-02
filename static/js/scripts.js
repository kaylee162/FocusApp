document.addEventListener("DOMContentLoaded", function() {

  /* === Target Date Field Logic === */
  const repeatSelect = document.getElementById("repeat_type");
  const targetContainer = document.getElementById("target-day-field");

  function updateTargetField() {
    if (!repeatSelect || !targetContainer) return;
    const type = repeatSelect.value;
    let html = "";

    // Hide both label + field for daily or one-time goals
    if (type === "daily" || type === "none") {
      targetContainer.innerHTML = "";
      return;
    }

    // Weekly goals → dropdown
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
    }

    // Monthly goals → calendar picker
    else if (type === "monthly") {
      html = `
        <label>Target Date</label>
        <input type="date" name="target_day" id="target_day"
               class="date-input"
               placeholder="Select day of month">`;
    }

    targetContainer.innerHTML = html;
  }

  if (repeatSelect) {
    repeatSelect.addEventListener("change", updateTargetField);
    updateTargetField(); // initialize on load
  }

  /* === Toggle Button Logic === */
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

  /* === Modal Logic (Add Goal Form Popup) === */
  const openModalBtn = document.getElementById("openGoalModal");
  const closeModalBtn = document.getElementById("closeGoalModal");
  const modal = document.getElementById("goalModal");

  if (openModalBtn && modal) {
    // Open modal
    openModalBtn.addEventListener("click", () => {
      modal.classList.remove("hidden");
    });

    // Close modal
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", () => {
        modal.classList.add("hidden");
      });
    }

    // Close modal when clicking outside content
    window.addEventListener("click", (e) => {
      if (e.target === modal) {
        modal.classList.add("hidden");
      }
    });
  }

});

/* === Focus Timer Logic (fixed) === */
let timerDuration = 25 * 60; // seconds
let remainingTime = timerDuration;
let timerInterval = null;
let isRunning = false;

const timeSlider = document.getElementById("timeSlider");
const timeValue = document.getElementById("timeValue");
const timerDisplay = document.getElementById("timerDisplay");

const startBtn = document.getElementById("startTimer");
const resetBtn = document.getElementById("resetTimer");

const focusModal = document.getElementById("focusModal");
const focusCountdown = document.getElementById("focusCountdown");
const exitFocus = document.getElementById("exitFocus");

/* --- Utility functions --- */
function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function updateDisplay() {
  const display = formatTime(Math.max(0, remainingTime)); // ✅ prevent negative
  timerDisplay.textContent = display;
  focusCountdown.textContent = display;
}

/* --- Slider Logic --- */
timeSlider.addEventListener("input", () => {
  timeValue.textContent = timeSlider.value;
  if (!isRunning) {
    timerDuration = timeSlider.value * 60;
    remainingTime = timerDuration;
    updateDisplay();
  }
});

/* --- Start Timer --- */
startBtn.addEventListener("click", () => {
  if (isRunning) return;
  isRunning = true;
  focusModal.classList.remove("hidden");

  // Immediately update once
  updateDisplay();

  timerInterval = setInterval(() => {
    if (remainingTime > 0) {
      remainingTime--;
      updateDisplay();
    }

    if (remainingTime <= 0) {
      clearInterval(timerInterval);
      remainingTime = 0; // ✅ stops at zero
      updateDisplay();
      isRunning = false;

      // Optional: cleaner than alert
      alert("⏰ Time’s up! Great job staying focused!");
      focusModal.classList.add("hidden");
    }
  }, 1000);
});

/* --- Reset Timer --- */
resetBtn.addEventListener("click", () => {
  clearInterval(timerInterval);
  isRunning = false;
  remainingTime = timerDuration;
  updateDisplay();
});

/* --- Exit Focus Mode manually --- */
exitFocus.addEventListener("click", () => {
  focusModal.classList.add("hidden");
  clearInterval(timerInterval);
  isRunning = false;

  // ✅ prevent showing -1:-1 when exiting after finish
  if (remainingTime <= 0) {
    remainingTime = timerDuration;
  }
  updateDisplay();
});

// Initialize display
document.addEventListener("DOMContentLoaded", () => {
  const taskList = document.getElementById("task-list");

  let draggingItem;
  taskList.addEventListener("dragstart", e => {
    draggingItem = e.target;
    e.target.classList.add("dragging");
  });
  taskList.addEventListener("dragend", e => {
    e.target.classList.remove("dragging");
    saveOrder();
  });
  taskList.addEventListener("dragover", e => {
    e.preventDefault();
    const after = getDragAfter(taskList, e.clientY);
    if (after == null) taskList.appendChild(draggingItem);
    else taskList.insertBefore(draggingItem, after);
  });

  function getDragAfter(container, y) {
    const items = [...container.querySelectorAll(".task-item:not(.dragging)")];
    return items.reduce(
      (closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset, element: child };
        else return closest;
      },
      { offset: Number.NEGATIVE_INFINITY }
    ).element;
  }

  async function saveOrder() {
    const order = [...taskList.children].map(li => li.dataset.id);
    await fetch("/tasks/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order })
    });
  }
});

async function toggleComplete(id) {
  const li = document.querySelector(`[data-id="${id}"]`);
  li.classList.toggle("completed");
  await fetch(`/tasks/update/${id}`, { method: "POST" });
}

// === Drag goals into / out of priority box ===
document.addEventListener("DOMContentLoaded", () => {
  const priorityBox = document.getElementById("priorityBox");
  const priorityList = document.getElementById("priority-list");
  const goalsColumn = document.querySelector(".goals-column");

  // --- Make all goal cards draggable ---
  document.querySelectorAll(".goal-card").forEach(card => {
    card.setAttribute("draggable", "true");

    card.addEventListener("dragstart", e => {
      e.dataTransfer.setData("goal-id", card.dataset.goalId);
      e.dataTransfer.setData("goal-title", card.querySelector("h4").innerText);
      priorityBox.classList.add("dragging-over");
    });

    card.addEventListener("dragend", () => {
      priorityBox.classList.remove("dragging-over");
    });
  });

  // --- Allow dropping into priority box ---
  priorityBox.addEventListener("dragover", e => e.preventDefault());

  priorityBox.addEventListener("drop", async e => {
    e.preventDefault();
    priorityBox.classList.remove("dragging-over");

    const goalId = e.dataTransfer.getData("goal-id");
    const goalTitle = e.dataTransfer.getData("goal-title");

    // Skip if already exists
    if (priorityList.querySelector(`[data-goal-id="${goalId}"]`)) return;

    // Create new priority item visually
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

    // Save to DB
    await fetch("/priority/add", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ goal_id: goalId })
    });
  });

  // --- Drag OUT (remove from priorities) ---
  if (goalsColumn) {
    goalsColumn.addEventListener("dragover", e => {
      if (document.querySelector("#priority-list .task-item.dragging")) e.preventDefault();
    });

    goalsColumn.addEventListener("drop", async e => {
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

  // --- Make priority items draggable ---
  function wirePriorityItemDrag(li) {
    li.addEventListener("dragstart", () => li.classList.add("dragging"));
    li.addEventListener("dragend", () => li.classList.remove("dragging"));
  }
  priorityList.querySelectorAll(".task-item").forEach(wirePriorityItemDrag);

  // --- Button actions (Complete ✓ / Remove ×) ---
  priorityList.addEventListener("click", async e => {
    const btn = e.target.closest("button");
    if (!btn) return;
    const li = e.target.closest(".task-item");
    if (!li) return;
    const goalId = li.getAttribute("data-goal-id");

    // COMPLETE — mark goal complete + remove from priorities + sync with goals list
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
        // Find the corresponding goal card in the goals list
        const goalCard = document.querySelector(`.goal-card[data-goal-id="${data.goal_id}"]`);
        if (goalCard) {
          goalCard.classList.add("completed");
          const actions = goalCard.querySelector(".actions");
          if (actions) {
            actions.innerHTML = '<span class="completed-text">✅ Completed</span>';
          }
        }
      }

      return;
    }

    // REMOVE — only remove from priorities
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

  // --- Helper: update empty message ---
  function showEmptyMessageIfNeeded() {
    const empty = priorityList.querySelector(".empty");
    const hasItems = priorityList.querySelector(".task-item");
    if (!hasItems && !empty) {
      const li = document.createElement("li");
      li.className = "empty";
      li.textContent = "No priorities yet. Drag a goal to add one!";
      priorityList.appendChild(li);
    } else if (hasItems && empty) {
      empty.remove();
    }
  }
});
/* === Weekly Progress Chart === */
async function loadWeeklyProgress() {
  const ctx = document.getElementById("progressChart");
  if (!ctx) return;

  const res = await fetch("/api/progress_data");
  const data = await res.json();

  const labels = data.map(d => d.date);
  const counts = data.map(d => d.count);

  new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Goals Completed",
        data: counts,
        backgroundColor: "#3b82f6",
        borderRadius: 8
      }]
    },
    options: {
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0 }
        }
      },
      plugins: {
        legend: { display: false },
        title: { display: false }
      }
    }
  });
}

document.addEventListener("DOMContentLoaded", loadWeeklyProgress);
