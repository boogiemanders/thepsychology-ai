#!/usr/bin/env node

import { spawn } from "node:child_process";
import { promisify } from "node:util";
import { execFile } from "node:child_process";
import { copyFile, mkdir, rm } from "node:fs/promises";
import { setTimeout as sleep } from "node:timers/promises";
import path from "node:path";
import process from "node:process";
import { chromium } from "playwright";

const execFileAsync = promisify(execFile);

const BASE_URL =
  process.env.ANIMATION_EXPORT_BASE_URL ??
  `http://127.0.0.1:${Number(process.env.ANIMATION_EXPORT_PORT ?? 3000)}`;
const SHOULD_LAUNCH_DEV_SERVER =
  process.env.ANIMATION_EXPORT_USE_EXISTING_SERVER !== "1";
const TARGET_FILTER = process.env.ANIMATION_EXPORT_TARGET?.trim().toLowerCase();
const OUTPUT_DIR = path.resolve(process.cwd(), "public/downloads/animations");
const TEMP_VIDEO_DIR = path.resolve(process.cwd(), ".tmp/animation-videos");
const DEFAULT_CAPTURE_SIZE = { width: 1280, height: 720 };

const TARGETS = [
  {
    path: "/exports/animations-with-text/first-bento",
    outputFileName: "first-bento-with-text.mp4",
    durationMs: 9000,
    warmupMs: 1500,
    size: { width: 1080, height: 1080 },
    postFilter:
      "drawbox=x=0:y=ih-78:w=78:h=78:color=0xedf0f2@1:t=fill",
  },
  {
    path: "/exports/animations-with-text/second-bento",
    outputFileName: "second-bento-with-text.mp4",
    durationMs: 9000,
    warmupMs: 1500,
    size: { width: 1080, height: 1080 },
    postFilter:
      "drawbox=x=0:y=ih-78:w=78:h=78:color=0xedf0f2@1:t=fill",
  },
  {
    path: "/exports/animations-with-text/third-bento",
    outputFileName: "third-bento-with-text.mp4",
    durationMs: 9000,
    warmupMs: 1500,
    size: { width: 1080, height: 1080 },
    postFilter:
      "drawbox=x=0:y=ih-78:w=78:h=78:color=0xedf0f2@1:t=fill",
  },
  {
    path: "/exports/animations-with-text/fourth-bento",
    outputFileName: "fourth-bento-with-text.mp4",
    durationMs: 9000,
    warmupMs: 1500,
    size: { width: 1080, height: 1080 },
    postFilter:
      "drawbox=x=0:y=ih-78:w=78:h=78:color=0xedf0f2@1:t=fill",
  },
  {
    path: "/exports/spline-video",
    outputFileName: "spline-animation.mp4",
    durationMs: 12000,
    warmupMs: 6000,
    size: { width: 1280, height: 720 },
    waitForSelector: "canvas",
    postFilter:
      "drawbox=x=0:y=ih-82:w=iw:h=82:color=0xedf0f2@1:t=fill",
  },
  {
    path: "/exports/animations/first-bento",
    outputFileName: "first-bento-animation.mp4",
    durationMs: 8000,
    warmupMs: 500,
  },
  {
    path: "/exports/animations/second-bento",
    outputFileName: "second-bento-animation.mp4",
    durationMs: 7000,
    warmupMs: 500,
  },
  {
    path: "/exports/animations/third-bento",
    outputFileName: "third-bento-animation.mp4",
    durationMs: 8000,
    warmupMs: 500,
  },
  {
    path: "/exports/animations/fourth-bento",
    outputFileName: "fourth-bento-animation.mp4",
    durationMs: 8000,
    warmupMs: 500,
  },
];

async function waitForServer(timeoutMs = 120000) {
  const start = Date.now();
  const probeUrl = `${BASE_URL}/exports/animations/first-bento`;

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(probeUrl, { redirect: "manual" });
      if (response.ok) {
        return;
      }
    } catch {
      // Keep polling until server is ready.
    }

    await sleep(1000);
  }

  throw new Error(`Timed out waiting for Next.js dev server at ${probeUrl}`);
}

async function convertWebmToMp4(inputPath, outputPath, filter = null) {
  const args = [
    "-y",
    "-i",
    inputPath,
  ];

  if (filter) {
    args.push("-vf", filter);
  }

  args.push(
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "medium",
    "-crf",
    "20",
    "-movflags",
    "+faststart",
    outputPath,
  );

  await execFileAsync("ffmpeg", args);
}

async function main() {
  await rm(TEMP_VIDEO_DIR, { recursive: true, force: true });
  await mkdir(TEMP_VIDEO_DIR, { recursive: true });
  await mkdir(OUTPUT_DIR, { recursive: true });

  const targetsToRender = TARGET_FILTER
    ? TARGETS.filter(
        (target) =>
          target.outputFileName.toLowerCase().includes(TARGET_FILTER) ||
          target.path.toLowerCase().includes(TARGET_FILTER)
      )
    : TARGETS;

  if (targetsToRender.length === 0) {
    throw new Error(
      `No export targets match ANIMATION_EXPORT_TARGET="${TARGET_FILTER}"`
    );
  }

  let devServer = null;
  if (SHOULD_LAUNCH_DEV_SERVER) {
    const port = new URL(BASE_URL).port || "3000";
    devServer = spawn("npm", ["run", "dev", "--", "-p", port], {
      cwd: process.cwd(),
      stdio: "pipe",
    });

    devServer.stdout?.on("data", (chunk) => {
      const message = String(chunk);
      if (message.includes("Ready") || message.includes("ready")) {
        process.stdout.write(message);
      }
    });

    devServer.stderr?.on("data", (chunk) => {
      process.stderr.write(String(chunk));
    });
  }

  let browser;

  try {
    await waitForServer();

    browser = await chromium.launch();

    for (const target of targetsToRender) {
      const size = target.size ?? DEFAULT_CAPTURE_SIZE;
      const context = await browser.newContext({
        viewport: size,
        recordVideo: {
          dir: TEMP_VIDEO_DIR,
          size,
        },
      });

      const page = await context.newPage();
      const video = page.video();

      await page.goto(`${BASE_URL}${target.path}`, {
        waitUntil: "networkidle",
      });
      await page.locator("[data-export-canvas]").waitFor({ state: "visible" });
      if (target.waitForSelector) {
        await page.waitForSelector(target.waitForSelector, { timeout: 20000 });
      }
      await page.waitForTimeout(target.warmupMs ?? 500);
      await page.waitForTimeout(target.durationMs);

      await context.close();

      if (!video) {
        throw new Error(
          `No video recording found for ${target.outputFileName}`
        );
      }

      const webmPath = await video.path();
      const mp4Path = path.join(OUTPUT_DIR, target.outputFileName);
      await convertWebmToMp4(webmPath, mp4Path, target.postFilter ?? null);

      process.stdout.write(`Created ${mp4Path}\n`);
    }

    const renderedSecondBento = targetsToRender.some(
      (target) => target.outputFileName === "second-bento-animation.mp4"
    );
    if (renderedSecondBento) {
      const moleculeOutputPath = path.join(
        OUTPUT_DIR,
        "molecule-animation.mp4"
      );
      await copyFile(
        path.join(OUTPUT_DIR, "second-bento-animation.mp4"),
        moleculeOutputPath
      );
      process.stdout.write(`Created ${moleculeOutputPath}\n`);
    }
  } finally {
    if (browser) {
      await browser.close();
    }

    if (devServer) {
      devServer.kill("SIGTERM");
      await sleep(1000);
      if (!devServer.killed) {
        devServer.kill("SIGKILL");
      }
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
