#!/usr/bin/env node

import { spawn } from "node:child_process";
import { readFile } from "node:fs/promises";
import { createServer } from "node:net";
import { dirname, resolve } from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(SCRIPT_DIR, "../..");
const NEXT_BIN = resolve(PROJECT_ROOT, "node_modules/next/dist/bin/next");
const AUDIT_SCRIPT = resolve(SCRIPT_DIR, "audit-production-routes.mjs");
const BUILD_ID_PATH = resolve(PROJECT_ROOT, ".next/BUILD_ID");
const HOST = "127.0.0.1";
const START_TIMEOUT_MS = 30_000;
const PROBE_TIMEOUT_MS = 1_500;

function delay(ms) {
  return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
}

function isChildRunning(child) {
  return child.exitCode === null && child.signalCode === null;
}

function productionEnvironment() {
  for (const name of ["NODE_ENV", "VERCEL_ENV", "CONTEXT"]) {
    const value = process.env[name];
    if (value && value !== "production") {
      throw new Error(
        `${name}=${value} cannot produce a production release audit. Rebuild with ${name}=production (or unset it locally).`,
      );
    }
  }
  return {
    ...process.env,
    NODE_ENV: "production",
    VERCEL_ENV: "production",
    CONTEXT: "production",
  };
}

function parseRequestedPort(rawPort) {
  if (rawPort === undefined || rawPort === "") return undefined;
  if (!/^\d+$/.test(rawPort)) {
    throw new Error(`RELEASE_AUDIT_PORT must be an integer, got ${rawPort}`);
  }
  const port = Number(rawPort);
  if (!Number.isSafeInteger(port) || port < 1 || port > 65_535) {
    throw new Error(
      `RELEASE_AUDIT_PORT must be between 1 and 65535, got ${rawPort}`,
    );
  }
  return port;
}

async function selectAvailablePort(requestedPort) {
  const probe = createServer();
  try {
    await new Promise((resolveListen, rejectListen) => {
      probe.once("error", rejectListen);
      probe.listen(
        { host: HOST, port: requestedPort ?? 0, exclusive: true },
        resolveListen,
      );
    });
    const address = probe.address();
    if (!address || typeof address === "string") {
      throw new Error("Could not determine the release audit port");
    }
    return address.port;
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    throw new Error(
      requestedPort
        ? `RELEASE_AUDIT_PORT ${requestedPort} is unavailable: ${detail}`
        : `Could not reserve a free release audit port: ${detail}`,
    );
  } finally {
    if (probe.listening) {
      await new Promise((resolveClose, rejectClose) => {
        probe.close((error) => (error ? rejectClose(error) : resolveClose()));
      });
    }
  }
}

async function readBuildId() {
  let buildId;
  try {
    buildId = (await readFile(BUILD_ID_PATH, "utf8")).trim();
  } catch (error) {
    throw new Error(
      `Missing production build at ${BUILD_ID_PATH}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (!/^[A-Za-z0-9_-]+$/.test(buildId)) {
    throw new Error(`Invalid .next BUILD_ID: ${JSON.stringify(buildId)}`);
  }
  return buildId;
}

async function fetchProbe(url) {
  return fetch(url, {
    redirect: "manual",
    signal: AbortSignal.timeout(PROBE_TIMEOUT_MS),
    headers: { "user-agent": "Ultimate-Tools-Release-Readiness/1.0" },
  });
}

async function assertServerIdentity(baseUrl, buildId) {
  const buildManifestUrl = `${baseUrl}/_next/static/${encodeURIComponent(buildId)}/_buildManifest.js`;
  const buildManifest = await fetchProbe(buildManifestUrl);
  const buildManifestBody = await buildManifest.text();
  if (
    buildManifest.status !== 200 ||
    !buildManifestBody.includes("self.__BUILD_MANIFEST")
  ) {
    throw new Error(
      `build ${buildId} is not being served (${buildManifest.status})`,
    );
  }

  const manifestResponse = await fetchProbe(`${baseUrl}/manifest.json`);
  if (manifestResponse.status !== 200) {
    throw new Error(`manifest returned ${manifestResponse.status}`);
  }
  let manifest;
  try {
    manifest = await manifestResponse.json();
  } catch (error) {
    throw new Error(
      `manifest is not JSON: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
  if (
    !manifest?.short_name ||
    manifest?.start_url !== "/ru" ||
    typeof manifest?.name !== "string" ||
    (!manifest.name.startsWith("RC Web App") && !manifest.name.startsWith("Ultimate Tools"))
  ) {
    throw new Error("manifest fingerprint does not match RC Web App");
  }

  const robotsResponse = await fetchProbe(`${baseUrl}/robots.txt`);
  const robots = await robotsResponse.text();
  if (
    robotsResponse.status !== 200 ||
    !/^Sitemap:\s*https:\/\/(?:rcwebapp\.com|ulti-tools\.com)\/sitemap\.xml\s*$/im.test(robots) ||
    /^Disallow:\s*\/\s*$/im.test(robots)
  ) {
    throw new Error("robots.txt does not have production crawl semantics");
  }
}

async function waitForServer(server, baseUrl, buildId, getSpawnError) {
  const deadline = Date.now() + START_TIMEOUT_MS;
  let lastProbeError = "server did not accept a connection";
  while (Date.now() < deadline) {
    const spawnError = getSpawnError();
    if (spawnError) throw spawnError;
    if (!isChildRunning(server)) {
      throw new Error(
        `Built server exited before readiness (${server.signalCode || server.exitCode}).`,
      );
    }
    try {
      await assertServerIdentity(baseUrl, buildId);
      if (!isChildRunning(server)) {
        throw new Error("Built server exited during readiness probes");
      }
      return;
    } catch (error) {
      lastProbeError = error instanceof Error ? error.message : String(error);
    }
    await delay(250);
  }
  throw new Error(
    `Built server did not become ready within ${START_TIMEOUT_MS}ms: ${lastProbeError}`,
  );
}

function runAudit(baseUrl, env) {
  return new Promise((resolveAudit, rejectAudit) => {
    const child = spawn(process.execPath, [AUDIT_SCRIPT, baseUrl], {
      cwd: PROJECT_ROOT,
      env,
      stdio: "inherit",
    });
    child.once("error", rejectAudit);
    child.once("exit", (code, signal) => {
      if (code === 0) resolveAudit();
      else rejectAudit(new Error(`Route audit failed (${signal || code}).`));
    });
  });
}

async function stopServer(server, exitPromise) {
  if (!isChildRunning(server)) return;
  server.kill("SIGTERM");
  await Promise.race([exitPromise, delay(5_000)]);
  if (isChildRunning(server)) {
    server.kill("SIGKILL");
    await Promise.race([exitPromise, delay(5_000)]);
  }
}

async function main() {
  const env = productionEnvironment();
  const [buildId, port] = await Promise.all([
    readBuildId(),
    selectAvailablePort(parseRequestedPort(process.env.RELEASE_AUDIT_PORT)),
  ]);
  const baseUrl = `http://${HOST}:${port}`;
  console.error(`[qa] Starting production build ${buildId} at ${baseUrl}`);

  let spawnError;
  const server = spawn(
    process.execPath,
    [NEXT_BIN, "start", "-H", HOST, "-p", String(port)],
    {
      cwd: PROJECT_ROOT,
      env,
      stdio: ["ignore", "inherit", "inherit"],
    },
  );
  server.once("error", (error) => {
    spawnError = error;
  });
  const exitPromise = new Promise((resolveExit) => {
    server.once("exit", (code, signal) => resolveExit({ code, signal }));
  });

  try {
    await waitForServer(server, baseUrl, buildId, () => spawnError);
    await runAudit(baseUrl, env);
  } finally {
    await stopServer(server, exitPromise);
  }
}

try {
  await main();
} catch (error) {
  console.error(
    `[qa] ${error instanceof Error ? `${error.name}: ${error.message}` : String(error)}`,
  );
  process.exitCode = 1;
}
