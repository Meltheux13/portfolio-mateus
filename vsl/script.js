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
  "nav.reviews": "Reviews",
  "nav.contact": "Contact",
  "nav.cta": "Get started",
  "nav.prev": "Previous works",
  "nav.next": "Next works",
  "hero.badge": "Available for new projects",
  "hero.title": "VSLs and ads<br>that sell",
  "hero.subtitle": "VSL and creative editing for people who live on paid traffic",
  "hero.cta1": "See my work",
  "hero.cta2": "Get in touch",
  "tools.eyebrow": "TOOLS I WORK WITH",
  "portfolio.eyebrow": "PORTFOLIO",
  "portfolio.title": "VSLs and creatives",
  "portfolio.subtitle": "Work made for one thing only: turning views into sales.",
  "format.short": "ADS",
  "format.long": "VSL",
  "cat.all": "All",
  "cat.direct-response": "Direct Response",
  "cat.personal-brand": "Personal Brand",
  "cat.marketing": "Marketing",
  "cat.ia": "AI",
  "reviews.eyebrow": "REVIEWS",
  "reviews.title": "What clients say",
  "review.pendente": "Gabriel's testimonial text is still missing.",
  "review.vazio.texto": "Paste the client testimonial here.",
  "review.vazio.nome": "Client name",
  "review.vazio.papel": "Company or niche",
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
  grid.classList.remove("is-static");
  if (!items.length) return;

  const last = items[items.length - 1];
  const setWidth = last.offsetLeft + last.offsetWidth - items[0].offsetLeft;
  // se a lista já cabe na tela não há o que rolar, e clonar só duplicaria
  // conteúdo à toa. Nesse caso os cards ficam centralizados: encostados à
  // esquerda com muito vazio ao lado, parecia recorte de página.
  if (setWidth <= grid.clientWidth) {
    grid.classList.add("is-static");
    return;
  }

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

// --- Controles próprios do player ---
const playerUi = document.getElementById("player-ui");
const playerHit = playerUi.querySelector(".player-hit");
const playerToggle = playerUi.querySelector(".player-toggle");
const playerIcon = playerToggle.querySelector("span");
const playerTrack = playerUi.querySelector(".player-track");
const playerFill = playerUi.querySelector(".player-fill");
const playerTime = playerUi.querySelector(".player-time");
let progressoTimer = null;

function formatarTempo(segundos) {
  const s = Math.max(0, Math.floor(segundos));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

function marcarTocando(tocando) {
  playerIcon.className = tocando ? "icon-pause" : "icon-play";
  const rotulo = tocando ? "Pausar vídeo" : "Reproduzir vídeo";
  playerToggle.setAttribute("aria-label", rotulo);
  playerHit.setAttribute("aria-label", rotulo);
}

function atualizarProgresso() {
  if (!player || !player.getDuration) return;

  const duracao = player.getDuration();
  if (!duracao) return;

  const atual = player.getCurrentTime();
  const pct = Math.min(100, (atual / duracao) * 100);
  playerFill.style.width = `${pct}%`;
  playerTime.textContent = formatarTempo(atual);
  playerTrack.setAttribute("aria-valuenow", String(Math.round(pct)));
}

// intervalo, não requestAnimationFrame: a barra não precisa de 60 quadros
// por segundo, e assim não disputa com o loop do brilho
function iniciarProgresso() {
  if (progressoTimer) return;
  progressoTimer = setInterval(atualizarProgresso, 250);
}

function pararProgresso() {
  clearInterval(progressoTimer);
  progressoTimer = null;
}

function zerarProgresso() {
  playerFill.style.width = "0%";
  playerTime.textContent = "0:00";
  playerTrack.setAttribute("aria-valuenow", "0");
}

function alternarReproducao() {
  if (!player || !player.getPlayerState) return;
  const tocando = player.getPlayerState() === 1;
  if (tocando) player.pauseVideo();
  else player.playVideo();
}

playerHit.addEventListener("click", alternarReproducao);
playerToggle.addEventListener("click", (event) => {
  event.stopPropagation();
  alternarReproducao();
});

function buscarPorPosicao(clientX) {
  if (!player || !player.getDuration) return;
  const caixa = playerTrack.getBoundingClientRect();
  const razao = Math.min(1, Math.max(0, (clientX - caixa.left) / caixa.width));
  player.seekTo(player.getDuration() * razao, true);
  atualizarProgresso();
}

playerTrack.addEventListener("click", (event) => {
  event.stopPropagation();
  buscarPorPosicao(event.clientX);
});

playerTrack.addEventListener("keydown", (event) => {
  if (!player || !player.getCurrentTime) return;
  const passo = event.key === "ArrowRight" ? 5 : event.key === "ArrowLeft" ? -5 : 0;
  if (!passo) return;
  event.preventDefault();
  player.seekTo(player.getCurrentTime() + passo, true);
  atualizarProgresso();
});

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
    // controls: 0 tira a barra do YouTube — quem controla é a nossa, que
    // só aparece com o ponteiro sobre o vídeo
    playerVars: { autoplay: 0, rel: 0, enablejsapi: 1, playsinline: 1, controls: 0 },
    events: {
      onReady: (event) => {
        event.target.setVolume(volume);
        event.target.getIframe().title = `Vídeo: ${title}`;
        event.target.playVideo();
      },
      onStateChange: (event) => {
        const tocando = event.data === YT.PlayerState.PLAYING;
        marcarTocando(tocando);

        if (tocando) {
          // o YouTube reseta o volume no play e ao tirar o mudo
          event.target.setVolume(volume);
          startGlow();
          iniciarProgresso();
        } else {
          stopGlow();
          pararProgresso();
        }
      },
    },
  });
}

function closeLightbox() {
  lightbox.hidden = true;
  stopGlow();
  pararProgresso();
  zerarProgresso();

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

// --- Fundo animado em WebGL ---
// Shader adaptado do site do SalesHookAI, com autorização. Lá ele roda em
// three.js; aqui foi portado para WebGL puro, porque a biblioteca inteira
// pesa centenas de KB e o efeito precisa só de um quad em tela cheia.
// As cores saem do tema, no lugar do roxo do original.
(function () {
  const canvas = document.getElementById("bg-canvas");
  if (!canvas) return;

  const pageBg = document.querySelector(".page-bg");
  const semMovimento = window.matchMedia("(prefers-reduced-motion: reduce)");
  const gl = canvas.getContext("webgl", {
    alpha: true,
    antialias: false,
    powerPreference: "low-power",
  });
  if (!gl) return;

  const vertexSrc = `
    attribute vec2 a_pos;
    varying vec2 vUv;
    void main() {
      vUv = a_pos * 0.5 + 0.5;
      gl_Position = vec4(a_pos, 0.0, 1.0);
    }
  `;

  const fragmentSrc = `
    precision highp float;
    varying vec2 vUv;
    uniform float uTime, uAspect;
    uniform vec3 uA, uB, uC;

    vec2 h2(vec2 p) {
      p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
      return -1.0 + 2.0 * fract(sin(p) * 43758.5453123);
    }

    // ruído de gradiente: mais orgânico que o de valor, que tende a
    // deixar um xadrez visível nas frequências baixas
    float noise(vec2 p) {
      vec2 i = floor(p), f = fract(p);
      vec2 u = f * f * (3.0 - 2.0 * f);
      return mix(mix(dot(h2(i + vec2(0, 0)), f - vec2(0, 0)),
                     dot(h2(i + vec2(1, 0)), f - vec2(1, 0)), u.x),
                 mix(dot(h2(i + vec2(0, 1)), f - vec2(0, 1)),
                     dot(h2(i + vec2(1, 1)), f - vec2(1, 1)), u.x), u.y);
    }

    float fbm(vec2 p) {
      float v = 0.0, a = 0.5;
      for (int i = 0; i < 5; i++) { v += a * noise(p); p *= 2.02; a *= 0.5; }
      return v;
    }

    void main() {
      vec2 uv = vUv;
      vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
      float t = uTime * 0.075;

      vec2 warp = vec2(fbm(p * 0.8 + vec2(t, -t * 0.5)),
                       fbm(p * 0.8 + vec2(-t * 0.6, t * 0.75)));
      float f = fbm(p * 0.85 + warp * 1.15);
      float g = fbm(p * 0.62 - warp * 0.75 + vec2(t * 0.4, t * 0.22));

      // amostras espelhadas, para nascer luz dos dois lados
      vec2 q = vec2(-p.x, p.y);
      vec2 warpQ = vec2(-warp.x, warp.y);
      float f2 = fbm(q * 0.85 + warpQ * 1.15 + vec2(4.3, -2.7));
      float g2 = fbm(q * 0.62 - warpQ * 0.75 + vec2(-5.1 + t * 0.34, 3.6 + t * 0.2));

      // smoothstep curto: campos de cor com borda definida, não degradê mole
      float m1 = max(smoothstep(-0.08, 0.24, f), smoothstep(-0.08, 0.24, f2));
      float m2 = max(smoothstep(-0.04, 0.28, g), smoothstep(-0.04, 0.28, g2));
      // o branco entra só nas cristas do ruído mais fino. Antes ele era
      // misturado em toda a área de m2 e lavava a fumaça de cinza; no site
      // de origem o roxo domina e o branco aparece em pontos soltos.
      float cristas = smoothstep(0.26, 0.44, max(g, g2));

      vec3 col = mix(uB, uA, m1);
      col = mix(col, uC, cristas * 0.4);
      col *= max(m1, m2 * 0.8);

      // grão, mais forte nos meios-tons
      float n = fract(sin(dot(floor(uv * vec2(1600.0, 900.0)), vec2(12.9898, 78.233))) * 43758.5453);
      float lum = dot(col, vec3(0.299, 0.587, 0.114));
      col += (n - 0.5) * (0.2 * (1.0 - abs(lum * 2.0 - 1.0)));

      // forte em cima, apagando para baixo. O segundo termo é o que mata a
      // fumaça na borda de baixo: sem ele o alfa ainda chegava perto de 0.4
      // ali e o fim do canvas aparecia como um risco reto.
      float body = smoothstep(-0.25, 0.35, uv.y) * smoothstep(0.0, 0.26, uv.y);
      float a = clamp(max(m1, m2) * body + (n - 0.5) * 0.06 * body, 0.0, 1.0);

      gl_FragColor = vec4(max(col, vec3(0.0)), a);
    }
  `;

  function compilar(tipo, src) {
    const s = gl.createShader(tipo);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    return gl.getShaderParameter(s, gl.COMPILE_STATUS) ? s : null;
  }

  const vs = compilar(gl.VERTEX_SHADER, vertexSrc);
  const fs = compilar(gl.FRAGMENT_SHADER, fragmentSrc);
  if (!vs || !fs) return;

  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return;
  gl.useProgram(prog);

  // um triângulo só, grande o bastante para cobrir a tela
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, "a_pos");
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(prog, "uTime");
  const uAspect = gl.getUniformLocation(prog, "uAspect");

  // as três cores vêm do tema: mexer em --color-accent muda a fumaça
  function rgb(varName, padrao) {
    const hex = getComputedStyle(document.documentElement)
      .getPropertyValue(varName).trim().replace("#", "");
    const fonte = hex.length === 6 ? hex : padrao;
    return [
      parseInt(fonte.slice(0, 2), 16) / 255,
      parseInt(fonte.slice(2, 4), 16) / 255,
      parseInt(fonte.slice(4, 6), 16) / 255,
    ];
  }

  gl.uniform3fv(gl.getUniformLocation(prog, "uA"), rgb("--color-accent", "2f7bff"));
  gl.uniform3fv(gl.getUniformLocation(prog, "uB"), rgb("--color-bg", "070a12"));
  gl.uniform3fv(gl.getUniformLocation(prog, "uC"), [0.81, 0.88, 1.0]);

  gl.enable(gl.BLEND);
  gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

  function redimensionar() {
    // teto de 1.25x: em tela retina, a resolução cheia dobra o custo sem
    // diferença visível num efeito borrado
    const dpr = Math.min(window.devicePixelRatio || 1, 1.25);
    const w = Math.floor(canvas.clientWidth * dpr);
    const h = Math.floor(canvas.clientHeight * dpr);
    if (canvas.width === w && canvas.height === h) return;
    canvas.width = w;
    canvas.height = h;
    gl.viewport(0, 0, w, h);
    gl.uniform1f(uAspect, w / h);
  }

  let quadro = null;
  let inicio = null;

  function desenhar(agora) {
    if (inicio === null) inicio = agora;
    redimensionar();
    gl.uniform1f(uTime, (agora - inicio) / 1000);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    quadro = requestAnimationFrame(desenhar);
  }

  function ligar() {
    if (quadro || semMovimento.matches || document.hidden) return;
    quadro = requestAnimationFrame(desenhar);
  }

  function desligar() {
    cancelAnimationFrame(quadro);
    quadro = null;
  }

  document.addEventListener("visibilitychange", () => (document.hidden ? desligar() : ligar()));
  semMovimento.addEventListener("change", () => (semMovimento.matches ? desligar() : ligar()));

  redimensionar();
  // um quadro parado já serve para quem pediu menos movimento
  gl.uniform1f(uTime, 0);
  gl.drawArrays(gl.TRIANGLES, 0, 3);

  if (pageBg) pageBg.classList.add("has-shader");
  canvas.classList.add("is-on");
  ligar();
})();

// --- Esteira de ferramentas ---
// A lista existe uma vez só no HTML; repeti-la aqui é o que permite a faixa
// correr em laço. Três contas importam:
//
// 1. o passo. A esteira desliza exatamente a largura de uma repetição —
//    os seis itens mais o espaço que vem depois do último. Usar -50%, como
//    é comum, deixa meio espaço de erro na emenda, porque o vão só existe
//    entre itens e não depois do último.
// 2. quantas cópias. A esteira precisa cobrir a janela inteira mesmo no fim
//    do passo, senão sobra um vazio na direita antes de ela reiniciar.
// 3. a duração. Se fosse fixa, a faixa correria mais devagar numa tela
//    larga, com mais px para percorrer no mesmo tempo. Fixando px/s ela
//    anda igual em qualquer lugar.
(function () {
  const track = document.querySelector(".tools-track");
  if (!track) return;

  const marquee = track.parentElement;
  const original = Array.from(track.children);
  const VELOCIDADE = 66; // px/s, o mesmo passo da faixa que serviu de modelo

  function montar() {
    // volta ao estado do HTML antes de medir, senão as cópias da vez
    // anterior entrariam na conta
    track.classList.remove("is-looping");
    Array.from(track.children).forEach((item, i) => {
      if (i >= original.length) item.remove();
    });

    const vao = parseFloat(getComputedStyle(track).columnGap) || 0;
    const passo = track.scrollWidth + vao;
    if (passo <= vao) return;

    const copias = Math.max(2, Math.ceil(marquee.clientWidth / passo) + 1);
    for (let c = 1; c < copias; c++) {
      original.forEach((item) => {
        const copia = item.cloneNode(true);
        // a cópia é decorativa: o leitor de tela já leu a original
        copia.setAttribute("aria-hidden", "true");
        track.appendChild(copia);
      });
    }

    track.style.setProperty("--tools-passo", passo + "px");
    track.style.animationDuration = passo / VELOCIDADE + "s";
    track.classList.add("is-looping");
  }

  montar();

  // só refaz quando a largura muda de verdade: no celular a barra do
  // navegador some ao rolar e dispara resize sem nada ter mudado
  let largura = window.innerWidth;
  let espera;
  window.addEventListener("resize", () => {
    if (window.innerWidth === largura) return;
    largura = window.innerWidth;
    clearTimeout(espera);
    espera = setTimeout(montar, 200);
  });
})();
