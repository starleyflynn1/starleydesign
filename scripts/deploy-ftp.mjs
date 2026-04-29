import { access } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { Client } from "basic-ftp";

const isPromptMode = process.argv.includes("--prompt");

const toBool = (value, fallback = false) => {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const normalized = String(value).trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes" || normalized === "y";
};

const ask = async (rl, label, fallback = "") => {
  const suffix = fallback ? ` [${fallback}]` : "";
  const value = await rl.question(`${label}${suffix}: `);
  return value.trim() || fallback;
};

let host = process.env.FTP_HOST ?? "";
let user = process.env.FTP_USER ?? "";
let password = process.env.FTP_PASSWORD ?? "";
let port = Number(process.env.FTP_PORT ?? 21);
let secure = toBool(process.env.FTP_SECURE, port === 990);
let remoteDir = process.env.FTP_REMOTE_DIR ?? "public_html";
let clearRemote = toBool(process.env.FTP_CLEAR_REMOTE, false);

if (isPromptMode) {
  const rl = createInterface({ input, output });
  try {
    host = await ask(rl, "FTP host", host || "ftpupload.net");
    user = await ask(rl, "FTP username", user);
    password = await ask(rl, "FTP password", password);
    const portInput = await ask(rl, "FTP port", String(port || 21));
    port = Number(portInput);
    secure = toBool(await ask(rl, "Use secure FTPS? (true/false)", secure ? "true" : "false"));
    remoteDir = await ask(rl, "Remote directory", remoteDir || "public_html");
    clearRemote = toBool(await ask(rl, "Clear remote directory before upload? (true/false)", clearRemote ? "true" : "false"));
  } finally {
    rl.close();
  }
}

if (!host || !user || !password) {
  const missing = [];
  if (!host) missing.push("FTP_HOST");
  if (!user) missing.push("FTP_USER");
  if (!password) missing.push("FTP_PASSWORD");
  console.error(`Missing required environment variables: ${missing.join(", ")}`);
  console.error("Or run: npm run deploy:ftp:prompt");
  process.exit(1);
}

if (!Number.isFinite(port) || port <= 0) {
  console.error("Invalid FTP_PORT. Use a positive number, e.g. 21 or 990.");
  process.exit(1);
}

if (remoteDir.includes(".")) {
  console.warn(
    `Warning: FTP_REMOTE_DIR="${remoteDir}" looks like a domain name, not a typical web root folder.`
  );
  console.warn("Common web roots are: htdocs, public_html, or /.");
}

const localDistDir = path.resolve("dist");

try {
  await access(localDistDir);
} catch {
  console.error("dist/ not found. Run `npm run build` first.");
  process.exit(1);
}

const client = new Client();
client.ftp.verbose = false;

try {
  await client.access({
    host,
    user,
    password,
    port,
    secure,
    secureOptions: secure ? { rejectUnauthorized: false } : undefined,
  });

  await client.ensureDir(remoteDir);

  if (clearRemote) {
    await client.clearWorkingDir();
  }

  await client.uploadFromDir(localDistDir);
  console.log(`Deploy complete: uploaded dist/ to ${host}:${remoteDir}`);
} catch (error) {
  console.error("FTP deploy failed.");
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
} finally {
  client.close();
}
