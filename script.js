const grid = document.querySelector(".portfolio-grid");
const formatButtons = document.querySelectorAll(".format-btn");
const catGroups = document.querySelectorAll(".cat-filters");
const portfolioItems = document.querySelectorAll(".portfolio-item");

let activeFormat = "short";
const activeCat = { short: "all", long: "all" };

const prevBtn = document.querySelector(".rail-nav.prev");
const nextBtn = document.querySelector(".rail-nav.next");

// Largura de uma volta completa: quando o scroll passa disso, subtraímos
// esse valor e o visitante não percebe, porque a lista se repete.
let loopWidth = 0;

function originals() {
  return [...grid.querySelectorAll(".portfolio-item:not([hidden]):not([data-clone])")];
}

// Duplica os cards visíveis para o avanço contínuo não ter fim aparente.
// Sem isso o carrossel chegaria na última miniatura e voltaria com um salto.
function buildLoop() {
  grid.querySelectorAll("[data-clone]").forEach((node) => node.remove());
  loopWidth = 0;

  const items = originals();
  if (!items.length) return;

  const last = items[items.length - 1];
  const setWidth = last.offsetLeft + last.offsetWidth - items[0].offsetLeft;
  // se a lista já cabe na tela não há o que rolar, e clonar só duplicaria
  // conteúdo à toa
  if (setWidth <= grid.clientWidth) return;

  items.forEach((item) => {
    const clone = item.cloneNode(true);
    clone.dataset.clone = "true";
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("a, button").forEach((el) => el.setAttribute("tabindex", "-1"));
    grid.appendChild(clone);
  });

  const firstClone = grid.querySelector("[data-clone]");
  loopWidth = firstClone.offsetLeft - items[0].offsetLeft;
}

function updateNav() {
  const rolavel = grid.scrollWidth > grid.clientWidth;
  // com o loop ativo as setas nunca travam: sempre há conteúdo dos dois lados
  prevBtn.disabled = !rolavel;
  nextBtn.disabled = !rolavel;
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

  grid.scrollLeft = 0;
  buildLoop();
  updateNav();
}

function scrollByPage(direction) {
  // indo para trás a partir do começo, salta uma volta antes de animar,
  // senão a seta esbarra no zero e não anda
  if (direction < 0 && loopWidth && grid.scrollLeft < 10) {
    grid.scrollLeft += loopWidth;
  }
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
  // A proporção do card é a da miniatura, não a do vídeo: alguns shorts
  // foram gravados em 16:9 e ficariam com tarja no player vertical.
  const vertical = card.dataset.ratio ? card.dataset.ratio === "9:16" : card.classList.contains("is-vertical");
  lightbox.classList.toggle("is-vertical", vertical);
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

// delegação: os clones do carrossel são criados depois, então não dá para
// prender o clique em cada card na carga
document.addEventListener("click", (event) => {
  const card = event.target.closest(".card[data-video]");
  if (!card) return;
  // ctrl/cmd//meio mantêm o comportamento de abrir no YouTube em nova aba
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.button !== 0) return;
  event.preventDefault();
  openLightbox(card);
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

// --- Avanço contínuo do carrossel ---
const SPEED_PX_PER_SECOND = 34;
const carousel = document.querySelector(".carousel");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

let pointerOver = false;
let focusInside = false;
let inViewport = true;
let lastFrame = 0;
// Posição acumulada em ponto flutuante: scrollLeft arredonda o valor, então
// somar 0,2px por quadro direto nele nunca sairia do lugar.
let position = 0;

function canAutoplay() {
  return (
    loopWidth > 0 &&
    !reduceMotion.matches &&
    !pointerOver &&
    !focusInside &&
    inViewport &&
    !document.hidden &&
    lightbox.hidden
  );
}

function frame(now) {
  const delta = lastFrame ? (now - lastFrame) / 1000 : 0;
  lastFrame = now;

  // se o visitante rolou por conta própria, adota a posição dele
  if (Math.abs(grid.scrollLeft - position) > 2) position = grid.scrollLeft;

  if (canAutoplay()) {
    // delta limitado: se a aba ficou parada, voltaria com um salto gigante
    position += SPEED_PX_PER_SECOND * Math.min(delta, 0.05);

    if (position >= loopWidth) position -= loopWidth;
    else if (position < 0) position += loopWidth;

    grid.scrollLeft = position;
  }

  requestAnimationFrame(frame);
}

// Pausa enquanto o visitante está com o mouse em cima ou navegando pelo teclado
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

window.addEventListener("resize", buildLoop);
requestAnimationFrame(frame);

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
