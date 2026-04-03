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
  const goalsColumn = document.querySelector(".goals-column");

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

    priorityBox.addEventListener("drop", async (e) => {
      e.preventDefault();
      priorityBox.classList.remove("dragging-over");

      const goalId = e.dataTransfer.getData("goal-id");
      const goalTitle = e.dataTransfer.getData("goal-title");
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
    });

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
          if (goalCard) {
            goalCard.classList.add("completed");
            const actions = goalCard.querySelector(".actions");
            if (actions) actions.innerHTML = '<span class="completed-text">✅ Completed</span>';
          }
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
        li.textContent = "No priorities yet. Drag a goal to add one!";
        priorityList.appendChild(li);
      } else if (hasItems && empty) {
        empty.remove();
      }
    }
  }

  loadWeeklyProgress();
});

let weeklyProgressChart = null;

async function loadWeeklyProgress() {
  const ctx = document.getElementById("progressChart");
  if (!ctx) return;

  if (weeklyProgressChart) {
    weeklyProgressChart.destroy();
    weeklyProgressChart = null;
  }

  const res = await fetch("/api/progress_data");
  const data = await res.json();

  const labels = data.map((d) => d.date);
  const counts = data.map((d) => d.count);

  weeklyProgressChart = new Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: "Goals Completed",
        data: counts,
        backgroundColor: [
          "#8bcf7b", "#9fdaf5", "#f7a7d8", "#ffe777", "#ffc7b3", "#ccb8ff", "#8bcf7b"
        ],
        borderColor: "#3c2a28",
        borderWidth: 2,
        borderRadius: 10
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      scales: {
        y: {
          beginAtZero: true,
          ticks: { precision: 0, color: "#3c2a28" },
          grid: { color: "rgba(60, 42, 40, 0.15)" },
          border: { color: "#3c2a28" }
        },
        x: {
          ticks: { color: "#3c2a28" },
          grid: { display: false },
          border: { color: "#3c2a28" }
        }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#fff6dd",
          titleColor: "#3c2a28",
          bodyColor: "#3c2a28",
          borderColor: "#3c2a28",
          borderWidth: 2
        }
      }
    }
  });
}
