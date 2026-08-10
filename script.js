const grid = document.querySelector(".portfolio-grid");
const formatButtons = document.querySelectorAll(".format-btn");
const catGroups = document.querySelectorAll(".cat-filters");
const portfolioItems = document.querySelectorAll(".portfolio-item");

let activeFormat = "short";
const activeCat = { short: "all", long: "all" };

function applyFilters() {
  grid.classList.toggle("mode-short", activeFormat === "short");
  grid.classList.toggle("mode-long", activeFormat === "long");

  portfolioItems.forEach((item) => {
    const matchesFormat = item.dataset.format === activeFormat;
    const cat = activeCat[activeFormat];
    const matchesCat = cat === "all" || item.dataset.cat === cat;
    item.hidden = !(matchesFormat && matchesCat);
  });

  catGroups.forEach((group) => {
    group.hidden = group.dataset.for !== activeFormat;
  });
}

formatButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFormat = button.dataset.format;

    formatButtons.forEach((btn) => {
      const on = btn === button;
      btn.classList.toggle("is-active", on);
      btn.setAttribute("aria-selected", String(on));
    });

    applyFilters();
  });
});

catGroups.forEach((group) => {
  group.querySelectorAll(".filter-btn").forEach((button) => {
    button.addEventListener("click", () => {
      activeCat[group.dataset.for] = button.dataset.cat;

      group.querySelectorAll(".filter-btn").forEach((btn) => {
        btn.classList.toggle("is-active", btn === button);
      });

      applyFilters();
    });
  });
});

applyFilters();

// Revela os elementos conforme entram na viewport
const revealItems = document.querySelectorAll(".reveal");

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry, index) => {
        if (!entry.isIntersecting) return;
        entry.target.style.transitionDelay = `${Math.min(index * 60, 300)}ms`;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -60px 0px" }
  );

  // Elementos já visíveis (ou acima da dobra) ao carregar nunca disparam o
  // observer — revela direto para não ficarem invisíveis permanentemente.
  revealItems.forEach((item) => {
    if (item.getBoundingClientRect().top < window.innerHeight) {
      item.classList.add("is-visible");
      return;
    }
    observer.observe(item);
  });
} else {
  revealItems.forEach((item) => item.classList.add("is-visible"));
}
