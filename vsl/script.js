// ---------------------------------------------------------------------
// Volume dos vídeos do portfólio, de 0 a 100.
//
// Vale para todos. Para acertar um vídeo específico que ainda destoe, use
// data-volume no card dele, no index.html — ele sobrescreve este padrão:
//   <a class="card ..." data-video="ID" data-volume="45" ...>
// ---------------------------------------------------------------------
const DEFAULT_VOLUME = 60;

// ---------------------------------------------------------------------
// Traduções. A chave vem do atributo data-i18n no index.html.
// O português é o que já está escrito no HTML; aqui mora só a versão em
// inglês, e voltar ao português é restaurar o texto original.
// ---------------------------------------------------------------------
const EN = {
  "nav.home": "Home",
  "nav.portfolio": "Portfolio",
  "nav.services": "Services",
  "nav.contact": "Contact",
  "nav.cta": "Get started",
  "nav.prev": "Previous works",
  "nav.next": "Next works",
  "hero.badge": "Available for new projects",
  "hero.title": "VSLs and ads<br>that sell",
  "hero.subtitle": "VSL and creative editing for people who live on paid traffic",
  "hero.cta1": "See my work",
  "hero.cta2": "Get in touch",
  "portfolio.eyebrow": "PORTFOLIO",
  "portfolio.title": "VSLs and creatives",
  "portfolio.subtitle": "Work made for one thing only: turning views into sales.",
  "format.short": "Ads",
  "format.long": "VSL",
  "cat.all": "All",
  "cat.direct-response": "Direct Response",
  "cat.personal-brand": "Personal Brand",
  "cat.gameplay": "Gameplay",
  "cat.marketing": "Marketing",
  "cat.ia": "AI",
  "cat.business": "Business",
  "cat.tech": "Tech",
  "services.eyebrow": "SERVICES",
  "services.title": "How it works",
  "step1.title": "Briefing",
  "step1.desc": "Send me the raw footage, the script and the offer. No script? We figure it out together.",
  "step2.title": "Editing",
  "step2.desc": "Hook, pacing, captions, proof and call to action — built to hold attention until the offer.",
  "step3.title": "Review",
  "step3.desc": "Fast delivery and whatever the tests ask you to change.",
  "step4.title": "You scale",
  "step4.desc": "Launch the campaign and watch the number that matters.",
  "contact.eyebrow": "CONTACT",
  "contact.title": "Ready to scale?",
  "contact.subtitle": "Pick your preferred platform to start the conversation.",
  "contact.note": "I usually reply within 24h.",
  "contact.copied": "Copied!",
  "footer.role": "| Video Editor",
  "footer.rights": "&copy; 2026. All rights reserved.",
  "lightbox.close": "Close video",
};

const langSwitch = document.querySelector(".lang-switch");
const i18nNodes = document.querySelectorAll("[data-i18n], [data-i18n-html], [data-i18n-aria]");

// guarda o português original, para dispensar um segundo dicionário
i18nNodes.forEach((node) => {
  if (node.dataset.i18n) node.dataset.pt = node.textContent;
  if (node.dataset.i18nHtml) node.dataset.ptHtml = node.innerHTML;
  if (node.dataset.i18nAria) node.dataset.ptAria = node.getAttribute("aria-label");
});

function applyLanguage(lang) {
  const en = lang === "en";

  i18nNodes.forEach((node) => {
    if (node.dataset.i18n) {
      node.textContent = en ? EN[node.dataset.i18n] ?? node.dataset.pt : node.dataset.pt;
    }
    if (node.dataset.i18nHtml) {
      node.innerHTML = en ? EN[node.dataset.i18nHtml] ?? node.dataset.ptHtml : node.dataset.ptHtml;
    }
    if (node.dataset.i18nAria) {
      const valor = en ? EN[node.dataset.i18nAria] ?? node.dataset.ptAria : node.dataset.ptAria;
      node.setAttribute("aria-label", valor);
    }
  });

  document.documentElement.lang = en ? "en" : "pt-BR";
  langSwitch.setAttribute("aria-checked", String(en));
  langSwitch.setAttribute("aria-label", en ? "Switch language to Portuguese" : "Mudar idioma para inglês");
  langSwitch.classList.toggle("is-en", en);
  langSwitch.querySelectorAll(".lang-label").forEach((el) => {
    el.classList.toggle("is-on", (el.dataset.lang === "en") === en);
  });

  localStorage.setItem("lang", lang);
}

langSwitch.addEventListener("click", () => {
  applyLanguage(document.documentElement.lang === "en" ? "pt" : "en");
});

// escolha anterior; na primeira visita, segue o idioma do navegador
const idiomaSalvo = localStorage.getItem("lang");
applyLanguage(idiomaSalvo || (navigator.language.startsWith("pt") ? "pt" : "en"));

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
  position = 0;
  buildLoop();
  updateNav();
  resumeAutoplay();
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
const lightboxFrameEl = lightbox.querySelector(".lightbox-frame");
const lightboxGlow = lightbox.querySelector(".lightbox-glow");
const lightboxTitle = lightbox.querySelector(".lightbox-title");
const lightboxClose = lightbox.querySelector(".lightbox-close");
const lightboxMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
let lastFocused = null;
let player = null;

// Carrega a IFrame API uma vez só e reaproveita a promessa nas aberturas
// seguintes.
let youtubeApi = null;

function loadYouTubeApi() {
  if (youtubeApi) return youtubeApi;

  youtubeApi = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve(window.YT);
      return;
    }
    window.onYouTubeIframeAPIReady = () => resolve(window.YT);
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(tag);
  });

  return youtubeApi;
}

// --- Envelope de áudio pré-calculado (ver scripts/audio-envelope.js) ---
// Não dá para ler o áudio do iframe: o YouTube é outra origem e a Web Audio
// API não alcança. Por isso o volume da fala vem de um JSON gerado antes.
//
// Só busca quando o card declara data-envelope. Sondar a rede para descobrir
// se o arquivo existe deixaria um 404 no console a cada vídeo sem envelope,
// e o fetch não tem como esconder isso.
const envelopeCache = new Map();

function loadEnvelope(card) {
  if (!card.hasAttribute("data-envelope")) return Promise.resolve(null);

  const videoId = card.dataset.video;
  if (envelopeCache.has(videoId)) return envelopeCache.get(videoId);

  // caminho relativo: o site também funciona servido de um subdiretório
  const request = fetch(`public/envelopes/${videoId}.json`)
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);

  envelopeCache.set(videoId, request);
  return request;
}

let envelope = null;
let glowFrame = null;
let glowValue = 0;

function setGlow(value) {
  lightboxGlow.style.setProperty("--glow-intensity", value.toFixed(3));
}

function startGlow() {
  if (glowFrame || !envelope || !player || lightboxMotion.matches) return;

  const step = () => {
    const index = Math.floor(player.getCurrentTime() * envelope.fps);
    const target = envelope.values[index] ?? 0;
    // suavização exponencial: sem ela o brilho fica tremido entre quadros
    glowValue += (target - glowValue) * 0.25;
    setGlow(glowValue);
    glowFrame = requestAnimationFrame(step);
  };

  glowFrame = requestAnimationFrame(step);
}

function stopGlow() {
  cancelAnimationFrame(glowFrame);
  glowFrame = null;
}

async function openLightbox(card) {
  const id = card.dataset.video;
  const title = card.querySelector(".card-title").textContent;
  // data-volume no card sobrescreve o padrão, para acertar quem destoa
  const volume = Number(card.dataset.volume ?? DEFAULT_VOLUME);

  lastFocused = document.activeElement;
  lightboxTitle.textContent = title;
  // A proporção do card é a da miniatura, não a do vídeo: alguns shorts
  // foram gravados em 16:9 e ficariam com tarja no player vertical.
  const vertical = card.dataset.ratio ? card.dataset.ratio === "9:16" : card.classList.contains("is-vertical");
  lightbox.classList.toggle("is-vertical", vertical);

  glowValue = 0;
  setGlow(0);
  lightbox.hidden = false;
  document.body.classList.add("no-scroll");
  lightboxClose.focus();

  const [YT, loaded] = await Promise.all([loadYouTubeApi(), loadEnvelope(card)]);
  // o visitante pode ter fechado enquanto a API carregava
  if (lightbox.hidden) return;

  envelope = loaded;

  // ponto de montagem novo a cada abertura: destroy() remove o elemento
  const mount = document.createElement("div");
  lightboxFrameEl.replaceChildren(mount);

  player = new YT.Player(mount, {
    videoId: id,
    host: "https://www.youtube-nocookie.com",
    // autoplay desligado de propósito: com ele o player começa sozinho e o
    // primeiro instante de áudio sai no volume do YouTube, antes de o
    // onReady conseguir baixar. O play é dado abaixo, já com o volume certo.
    playerVars: { autoplay: 0, rel: 0, enablejsapi: 1, playsinline: 1 },
    events: {
      onReady: (event) => {
        event.target.setVolume(volume);
        event.target.getIframe().title = `Vídeo: ${title}`;
        event.target.playVideo();
      },
      onStateChange: (event) => {
        if (event.data === YT.PlayerState.PLAYING) {
          // o YouTube reseta o volume no play e ao tirar o mudo
          event.target.setVolume(volume);
          startGlow();
        } else {
          stopGlow();
        }
      },
    },
  });
}

function closeLightbox() {
  lightbox.hidden = true;
  stopGlow();

  if (player) {
    // destroy também interrompe o áudio; só esconder deixaria tocando
    player.destroy();
    player = null;
  }
  lightboxFrameEl.replaceChildren();
  envelope = null;

  document.body.classList.remove("no-scroll");
  if (lastFocused) lastFocused.focus();
  resumeAutoplay();
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

  // prende o Tab dentro do modal: fora o player, o botão de fechar é o
  // único elemento focável que sobrou
  if (event.key === "Tab") {
    event.preventDefault();
    lightboxClose.focus();
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

let autoplayFrame = null;

function frame(now) {
  // Sai do loop em vez de rodar em vazio: seguir chamando rAF só para ler
  // scrollLeft forçaria o navegador a recalcular layout 60x por segundo,
  // de graça, inclusive com a seção fora da tela.
  if (!canAutoplay()) {
    autoplayFrame = null;
    return;
  }

  const delta = lastFrame ? (now - lastFrame) / 1000 : 0;
  lastFrame = now;

  // se o visitante rolou por conta própria, adota a posição dele
  if (Math.abs(grid.scrollLeft - position) > 2) position = grid.scrollLeft;

  // delta limitado: se a aba ficou parada, voltaria com um salto gigante
  position += SPEED_PX_PER_SECOND * Math.min(delta, 0.05);
  position = wrapPosition(position);
  grid.scrollLeft = position;

  autoplayFrame = requestAnimationFrame(frame);
}

function wrapPosition(value) {
  if (loopWidth <= 0) return value;
  if (value >= loopWidth) return value - loopWidth;
  if (value < 0) return value + loopWidth;
  return value;
}

function resumeAutoplay() {
  if (autoplayFrame || !canAutoplay()) return;
  lastFrame = 0; // sem isso o primeiro quadro usaria o delta da última pausa
  autoplayFrame = requestAnimationFrame(frame);
}

// Pausa enquanto o visitante está com o mouse em cima ou navegando pelo teclado
carousel.addEventListener("pointerenter", () => { pointerOver = true; });
carousel.addEventListener("pointerleave", () => { pointerOver = false; resumeAutoplay(); });
carousel.addEventListener("focusin", () => { focusInside = true; });
carousel.addEventListener("focusout", () => { focusInside = false; resumeAutoplay(); });

// Fora da tela ou aba em segundo plano não precisa rodar
new IntersectionObserver(
  ([entry]) => {
    inViewport = entry.isIntersecting;
    resumeAutoplay();
  },
  { threshold: 0.2 }
).observe(carousel);

document.addEventListener("visibilitychange", resumeAutoplay);

window.addEventListener("resize", () => {
  buildLoop();
  resumeAutoplay();
});

// Com o loop parado ninguém mais normaliza a rolagem manual.
// A condição é canAutoplay() e não autoplayFrame: entre pausar e o loop
// perceber passa um quadro, e nessa brecha o wrap se perdia.
grid.addEventListener("scroll", () => {
  if (canAutoplay()) return;
  const wrapped = wrapPosition(grid.scrollLeft);
  if (wrapped !== grid.scrollLeft) grid.scrollLeft = wrapped;
  position = wrapped;
}, { passive: true });

resumeAutoplay();

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
