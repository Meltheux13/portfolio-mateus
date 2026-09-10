#!/usr/bin/env node
/**
 * Gera o envelope de áudio usado pelo LED do lightbox.
 *
 * Uso:
 *   node scripts/audio-envelope.js video.mp4
 *   node scripts/audio-envelope.js pasta/*.mp4
 *   node scripts/audio-envelope.js entrevista.mov --id n1ITJvI4Zac
 *
 * Sem --id, o nome do arquivo (sem extensão) vira o videoId. Ou seja,
 * n1ITJvI4Zac.mp4 gera public/envelopes/n1ITJvI4Zac.json.
 *
 * O videoId é o mesmo do atributo data-video no index.html.
 */

const { spawn } = require("child_process");
const fs = require("fs");
const path = require("path");

const SAMPLE_RATE = 8000; // PCM mono 8kHz: sobra para medir energia de fala
const FPS = 20; // uma janela a cada 50ms
const WINDOW = SAMPLE_RATE / FPS; // 400 amostras por janela
const OUT_DIR = path.join(__dirname, "..", "public", "envelopes");

function decodeToPcm(file) {
  return new Promise((resolve, reject) => {
    const ffmpeg = spawn("ffmpeg", [
      "-i", file,
      "-vn",              // descarta o vídeo
      "-ac", "1",         // mono
      "-ar", String(SAMPLE_RATE),
      "-f", "s16le",      // PCM 16 bits little-endian
      "-loglevel", "error",
      "pipe:1",
    ]);

    const chunks = [];
    let stderr = "";

    ffmpeg.stdout.on("data", (chunk) => chunks.push(chunk));
    ffmpeg.stderr.on("data", (chunk) => { stderr += chunk; });

    ffmpeg.on("error", (err) => {
      if (err.code === "ENOENT") {
        reject(new Error("ffmpeg não encontrado no PATH. Instale com: winget install Gyan.FFmpeg"));
        return;
      }
      reject(err);
    });

    ffmpeg.on("close", (code) => {
      if (code !== 0) {
        reject(new Error(`ffmpeg saiu com código ${code}${stderr ? `:\n${stderr.trim()}` : ""}`));
        return;
      }
      resolve(Buffer.concat(chunks));
    });
  });
}

function buildEnvelope(pcm) {
  const total = Math.floor(pcm.length / 2); // 2 bytes por amostra
  const windows = Math.floor(total / WINDOW);
  const values = [];

  for (let w = 0; w < windows; w++) {
    let sum = 0;
    for (let i = 0; i < WINDOW; i++) {
      const sample = pcm.readInt16LE((w * WINDOW + i) * 2) / 32768;
      sum += sample * sample;
    }
    values.push(Math.sqrt(sum / WINDOW)); // RMS da janela
  }

  // normaliza pelo pico: o brilho representa o volume relativo dentro do
  // próprio vídeo, não o absoluto
  const peak = Math.max(...values, 1e-6);
  return values.map((v) => Number((v / peak).toFixed(4)));
}

function parseArgs(argv) {
  const files = [];
  let id = null;

  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--id") {
      id = argv[++i];
    } else if (argv[i].startsWith("--id=")) {
      id = argv[i].slice(5);
    } else {
      files.push(argv[i]);
    }
  }

  return { files, id };
}

async function main() {
  const { files, id } = parseArgs(process.argv.slice(2));

  if (!files.length) {
    console.error("Uso: node scripts/audio-envelope.js <arquivo...> [--id videoId]");
    process.exit(1);
  }

  if (id && files.length > 1) {
    console.error("--id só vale para um arquivo por vez.");
    process.exit(1);
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });

  let ok = 0;
  let falhou = 0;
  const gerados = [];

  for (const [index, file] of files.entries()) {
    const videoId = id || path.basename(file, path.extname(file));
    const prefixo = `[${index + 1}/${files.length}] ${path.basename(file)}`;

    if (!fs.existsSync(file)) {
      console.error(`${prefixo} — arquivo não encontrado`);
      falhou++;
      continue;
    }

    process.stdout.write(`${prefixo} — decodificando...`);

    try {
      const pcm = await decodeToPcm(file);
      const values = buildEnvelope(pcm);

      if (!values.length) {
        console.log("\r" + `${prefixo} — sem faixa de áudio, ignorado`.padEnd(70));
        falhou++;
        continue;
      }

      const destino = path.join(OUT_DIR, `${videoId}.json`);
      fs.writeFileSync(destino, JSON.stringify({ fps: FPS, values }));

      const duracao = (values.length / FPS).toFixed(1);
      const kb = (fs.statSync(destino).size / 1024).toFixed(1);
      console.log("\r" + `${prefixo} — ${videoId}.json  (${duracao}s, ${kb} KB)`.padEnd(70));
      gerados.push(videoId);
      ok++;
    } catch (err) {
      console.log("\r" + `${prefixo} — falhou`.padEnd(70));
      console.error(`  ${err.message}`);
      falhou++;
      // ffmpeg ausente derruba todos os arquivos seguintes do mesmo jeito
      if (err.message.includes("ffmpeg não encontrado")) break;
    }
  }

  console.log(`\n${ok} gerado(s), ${falhou} com problema. Saída: ${path.relative(process.cwd(), OUT_DIR)}`);

  if (gerados.length) {
    console.log("\nAdicione data-envelope no card de cada vídeo, em index.html:");
    for (const videoId of gerados) {
      console.log(`  <a class="card ..." data-video="${videoId}" data-envelope ...>`);
    }
    console.log("\nSem esse atributo o brilho fica estático (o site não sonda a rede à toa).");
  }

  if (falhou) process.exitCode = 1;
}

main();
