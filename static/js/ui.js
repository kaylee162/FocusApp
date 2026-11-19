// Presentation-only layer: motion, decoration, and small delights.
// Nothing here talks to the server or changes app state.
(function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  document.addEventListener("DOMContentLoaded", () => {
    fillDates();
    initReveals();
    initStickerDrag();
    initScrollFill();
    initHeroBuddy();
    initBrandMark();
    initModalKeys();
  });

  function fillDates() {
    const now = new Date();
    const pad = (n) => String(n).padStart(2, "0");

    document.querySelectorAll("[data-today-short]").forEach((el) => {
      el.textContent = now.toLocaleDateString(undefined, { month: "short", day: "numeric" }).toLowerCase();
    });
    document.querySelectorAll("[data-year]").forEach((el) => {
      el.textContent = now.getFullYear();
    });
    document.querySelectorAll("[data-today-stack]").forEach((el) => {
      const parts = [pad(now.getDate()), pad(now.getMonth() + 1), pad(now.getFullYear() % 100)];
      el.querySelectorAll("span").forEach((span, i) => { span.textContent = parts[i]; });
      el.setAttribute("aria-label", now.toLocaleDateString(undefined, { dateStyle: "long" }));
    });
  }

  function initReveals() {
    const targets = document.querySelectorAll("[data-reveal]");
    if (reduceMotion || !("IntersectionObserver" in window)) {
      targets.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.15 });
    targets.forEach((el) => io.observe(el));
  }

  // Stickers on the landing collage can be peeled and moved around.
  function initStickerDrag() {
    if (!finePointer) return;
    document.querySelectorAll("[data-drag]").forEach((sticker) => {
      let startX = 0, startY = 0, baseX = 0, baseY = 0;

      sticker.addEventListener("pointerdown", (e) => {
        sticker.setPointerCapture(e.pointerId);
        sticker.classList.add("is-dragging");
        startX = e.clientX;
        startY = e.clientY;
        baseX = parseFloat(sticker.style.getPropertyValue("--dx")) || 0;
        baseY = parseFloat(sticker.style.getPropertyValue("--dy")) || 0;
      });

      sticker.addEventListener("pointermove", (e) => {
        if (!sticker.classList.contains("is-dragging")) return;
        sticker.style.setProperty("--dx", `${baseX + e.clientX - startX}px`);
        sticker.style.setProperty("--dy", `${baseY + e.clientY - startY}px`);
      });

      const drop = () => sticker.classList.remove("is-dragging");
      sticker.addEventListener("pointerup", drop);
      sticker.addEventListener("pointercancel", drop);
    });
  }

  // The stage track fills as it scrolls through the viewport.
  function initScrollFill() {
    const tracks = document.querySelectorAll("[data-scroll-fill]");
    if (!tracks.length) return;
    if (reduceMotion) {
      tracks.forEach((t) => t.style.setProperty("--fill", "1"));
      return;
    }
    let ticking = false;
    const update = () => {
      const vh = window.innerHeight;
      tracks.forEach((track) => {
        const rect = track.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, (vh - rect.top) / (vh * 0.75)));
        track.style.setProperty("--fill", progress.toFixed(3));
        track.querySelectorAll(".stage-stops li").forEach((li, i, all) => {
          li.classList.toggle("is-reached", progress >= i / (all.length - 1) - 0.02);
        });
      });
      ticking = false;
    };
    window.addEventListener("scroll", () => {
      if (!ticking) { ticking = true; requestAnimationFrame(update); }
    }, { passive: true });
    update();
  }

  // Easter egg: poke the hero buddy to meet the whole crew.
  function initHeroBuddy() {
    const buddy = document.getElementById("heroBuddy");
    if (!buddy) return;
    const names = buddy.dataset.buddies.split(" ");
    const met = new Set([names[0]]);
    let index = 0;

    names.forEach((n) => { new Image().src = `${buddy.dataset.base}${n}.png`; });

    buddy.addEventListener("click", () => {
      index = (index + 1) % names.length;
      met.add(names[index]);
      buddy.classList.remove("is-poked");
      void buddy.offsetWidth;
      buddy.classList.add("is-poked");
      buddy.src = `${buddy.dataset.base}${names[index]}.png`;

      const corner = document.querySelector(".hero-corner-br");
      if (corner) {
        corner.textContent = met.size === names.length
          ? "you met the whole crew"
          : `no. 00${index + 1} / 00${names.length}`;
      }
    });

    if (reduceMotion) return;
    let ticking = false;
    window.addEventListener("scroll", () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        buddy.style.setProperty("--lift", `${Math.min(window.scrollY, 600) * -0.12}px`);
        ticking = false;
      });
    }, { passive: true });
  }

  // Easter egg: five quick clicks on the asterisk and the glue comes loose.
  function initBrandMark() {
    const mark = document.getElementById("brandMark");
    if (!mark) return;
    let clicks = 0;
    let timer = null;

    mark.addEventListener("click", () => {
      clicks += 1;
      clearTimeout(timer);
      timer = setTimeout(() => { clicks = 0; }, 900);
      if (clicks < 5) return;
      clicks = 0;
      document.body.classList.add("glue-loose");
      setTimeout(() => document.body.classList.remove("glue-loose"), 2400);
    });
  }

  // Escape closes any open sheet, and focus moves into a sheet when it opens.
  function initModalKeys() {
    const modals = document.querySelectorAll(".modal");
    if (!modals.length) return;

    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      modals.forEach((m) => m.classList.add("hidden"));
    });

    const observer = new MutationObserver((mutations) => {
      mutations.forEach(({ target }) => {
        if (target.classList.contains("hidden")) return;
        const field = target.querySelector("input:not([type=hidden]), select, textarea, button");
        if (field && !target.contains(document.activeElement)) field.focus();
      });
    });
    modals.forEach((m) => observer.observe(m, { attributes: true, attributeFilter: ["class"] }));
  }
})();
