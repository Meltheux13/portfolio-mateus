const grid = document.querySelector(".portfolio-grid");
const formatButtons = document.querySelectorAll(".format-btn");
const catGroups = document.querySelectorAll(".cat-filters");
const portfolioItems = document.querySelectorAll(".portfolio-item");

let activeFormat = "short";
const activeCat = { short: "all", long: "all" };

const prevBtn = document.querySelector(".rail-nav.prev");
const nextBtn = document.querySelector(".rail-nav.next");

function updateNav() {
  // 1px de folga: navegadores arredondam scrollLeft e o fim nunca bate exato
  const max = grid.scrollWidth - grid.clientWidth - 1;
  prevBtn.disabled = grid.scrollLeft <= 0;
  nextBtn.disabled = grid.scrollLeft >= max;
}

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

  // volta ao início sem animar, senão a lista nova entra deslizando de lado
  grid.style.scrollBehavior = "auto";
  grid.scrollLeft = 0;
  grid.style.scrollBehavior = "";
  updateNav();
}

function scrollByPage(direction) {
  grid.scrollBy({ left: direction * grid.clientWidth * 0.85, behavior: "smooth" });
}

prevBtn.addEventListener("click", () => scrollByPage(-1));
nextBtn.addEventListener("click", () => scrollByPage(1));
grid.addEventListener("scroll", updateNav, { passive: true });
window.addEventListener("resize", updateNav);

// --- Contato: copiar usuário (Discord não tem link de perfil público) ---
const copyStatus = document.getElementById("copy-status");

document.querySelectorAll(".contact-card[data-copy]").forEach((card) => {
  let timer;

  card.addEventListener("click", async () => {
    const value = card.dataset.copy;

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      // clipboard API exige contexto seguro (https); em http o catch evita
      // que o clique simplesmente não faça nada
      const helper = document.createElement("textarea");
      helper.value = value;
      helper.setAttribute("readonly", "");
      helper.style.position = "fixed";
      helper.style.opacity = "0";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }

    card.classList.add("is-copied");
    copyStatus.textContent = `${value} copiado para a área de transferência.`;

    clearTimeout(timer);
    timer = setTimeout(() => {
      card.classList.remove("is-copied");
      copyStatus.textContent = "";
    }, 1800);
  });
});

// --- Lightbox: abre o vídeo na própria página ---
const lightbox = document.getElementById("lightbox");
const lightboxFrame = document.getElementById("lightbox-iframe");
const lightboxTitle = lightbox.querySelector(".lightbox-title");
const lightboxLink = lightbox.querySelector(".lightbox-link");
const lightboxClose = lightbox.querySelector(".lightbox-close");
let lastFocused = null;

function openLightbox(card) {
  const id = card.dataset.video;
  const title = card.querySelector(".card-title").textContent;

  lastFocused = document.activeElement;
  lightboxTitle.textContent = title;
  lightboxLink.href = card.href;
  lightbox.classList.toggle("is-vertical", card.classList.contains("is-vertical"));
  lightboxFrame.title = `Vídeo: ${title}`;
  // nocookie evita rastreamento antes de o visitante decidir assistir
  lightboxFrame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;

  lightbox.hidden = false;
  document.body.classList.add("no-scroll");
  lightboxClose.focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  // interrompe a reprodução: só esconder deixaria o áudio tocando.
  // about:blank em vez de "", que faria o iframe recarregar a própria página.
  lightboxFrame.src = "about:blank";
  document.body.classList.remove("no-scroll");
  if (lastFocused) lastFocused.focus();
}

document.querySelectorAll(".card[data-video]").forEach((card) => {
  card.addEventListener("click", (event) => {
    // ctrl/cmd//meio mantêm o comportamento de abrir no YouTube em nova aba
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
    event.preventDefault();
    openLightbox(card);
  });
});

lightbox.querySelectorAll("[data-close]").forEach((el) => {
  el.addEventListener("click", closeLightbox);
});

document.addEventListener("keydown", (event) => {
  if (lightbox.hidden) return;

  if (event.key === "Escape") {
    closeLightbox();
    return;
  }

  // prende o Tab dentro do modal enquanto ele está aberto
  if (event.key === "Tab") {
    const focusables = [lightboxClose, lightboxLink];
    const first = focusables[0];
    const last = focusables[focusables.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }
});

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

// --- Avanço automático do carrossel ---
const AUTOPLAY_MS = 3500;
const carousel = document.querySelector(".carousel");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let autoplayTimer = null;
let pointerOver = false;
let focusInside = false;
let inViewport = true;

function cardStep() {
  const card = grid.querySelector(".portfolio-item:not([hidden])");
  if (!card) return grid.clientWidth;
  const gap = parseFloat(getComputedStyle(grid).columnGap) || 0;
  return card.getBoundingClientRect().width + gap;
}

function canAutoplay() {
  return (
    !reduceMotion.matches &&
    !pointerOver &&
    !focusInside &&
    inViewport &&
    !document.hidden &&
    lightbox.hidden &&
    grid.scrollWidth > grid.clientWidth
  );
}

function autoplayTick() {
  if (!canAutoplay()) return;

  const max = grid.scrollWidth - grid.clientWidth - 1;
  if (grid.scrollLeft >= max) {
    grid.scrollTo({ left: 0, behavior: "smooth" });
  } else {
    grid.scrollBy({ left: cardStep(), behavior: "smooth" });
  }
}

function startAutoplay() {
  if (autoplayTimer) return;
  autoplayTimer = setInterval(autoplayTick, AUTOPLAY_MS);
}

function stopAutoplay() {
  clearInterval(autoplayTimer);
  autoplayTimer = null;
}

// Pausa enquanto o visitante está mexendo, para não brigar com ele
carousel.addEventListener("pointerenter", () => { pointerOver = true; });
carousel.addEventListener("pointerleave", () => { pointerOver = false; });
carousel.addEventListener("focusin", () => { focusInside = true; });
carousel.addEventListener("focusout", () => { focusInside = false; });

// Fora da tela ou aba em segundo plano não precisa rodar
new IntersectionObserver(
  ([entry]) => {
    inViewport = entry.isIntersecting;
  },
  { threshold: 0.2 }
).observe(carousel);

if (!reduceMotion.matches) startAutoplay();
reduceMotion.addEventListener("change", () => {
  if (reduceMotion.matches) stopAutoplay();
  else startAutoplay();
});

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
