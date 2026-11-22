#!/usr/bin/env node
import { readFileSync } from "node:fs";
import { parseArgs } from "node:util";
import * as tools from "../src/tools.js";

const pkg = JSON.parse(readFileSync(new URL("../package.json", import.meta.url), "utf8"));
const tty = process.stdout.isTTY && !process.env.NO_COLOR;
const c = (code) => (s) => (tty ? `\x1b[${code}m${s}\x1b[0m` : s);
const green = c(32), red = c(31), yellow = c(33), dim = c(2), bold = c(1), cyan = c(36);

const HELP = `
${bold("dtb")} - everyday developer utilities

${bold("Usage")}
  npx dev-toolbox <command> [input] [options]
  (global install: ${bold("dtb")} <command>)

${bold("Commands")}
  uuid [-n 5] [--upper]            Generate UUID v4
  base64 encode|decode <text>      Base64 (use --url for URL-safe)
  jwt <token>                      Decode a JWT (does NOT verify the signature)
  ts [value]                       Now, or convert unix seconds/ms <-> date
  hash <text> [--algo sha256]      md5, sha1, sha256, sha512
  pass [-l 20] [--no-symbols]      Generate a strong random password
  url encode|decode <text>         URL-encode / decode

Input can also be piped:  echo "hello" | dtb base64 encode

${bold("Examples")}
  dtb uuid -n 3
  dtb base64 encode "Hello"
  dtb jwt eyJhbGciOi...
  dtb ts 1700000000
  dtb ts "2026-01-31 10:00"
  dtb hash "my text" --algo md5
`;

const fail = (msg) => {
  console.error(red(`✖ ${msg}`));
  process.exit(1);
};

async function readStdin() {
  if (process.stdin.isTTY) return "";
  let data = "";
  for await (const chunk of process.stdin) data += chunk;
  return data.replace(/\r?\n$/, "");
}

let parsed;
try {
  parsed = parseArgs({
    allowPositionals: true,
    options: {
      n: { type: "string", short: "n", default: "1" },
      upper: { type: "boolean", default: false },
      url: { type: "boolean", default: false },
      algo: { type: "string", short: "a", default: "sha256" },
      length: { type: "string", short: "l", default: "20" },
      "no-symbols": { type: "boolean", default: false },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });
} catch (e) {
  fail(e.message.split(". ")[0]);
}

const { values: v, positionals } = parsed;
const [command, ...rest] = positionals;

if (v.version) { console.log(pkg.version); process.exit(0); }
if (v.help || !command) { console.log(HELP); process.exit(command || v.help ? 0 : 1); }

const textArg = async (parts) => (parts.length ? parts.join(" ") : await readStdin());

function printJwt(r) {
  console.log(cyan("Header"));
  console.log(JSON.stringify(r.header, null, 2));
  console.log(cyan("\nPayload"));
  console.log(JSON.stringify(r.payload, null, 2));
  if (Object.keys(r.dates).length) {
    console.log(cyan("\nDates"));
    for (const [k, val] of Object.entries(r.dates)) console.log(`  ${k}: ${val}`);
  }
  if (r.expired === true) console.log(red("\n✖ Token is EXPIRED"));
  else if (r.expired === false) console.log(green("\n✔ Token is not expired"));
  console.log(dim(r.hasSignature ? "Signature present (not verified)" : "No signature (unsigned token)"));
}

try {
  switch (command) {
    case "uuid":
      console.log(tools.uuid(v.n, v.upper).join("\n"));
      break;
    case "base64":
    case "b64": {
      const [mode, ...parts] = rest;
      const text = await textArg(parts);
      if (!mode || !text) fail("Usage: dtb base64 encode|decode <text>");
      console.log(tools.base64(mode, text, { urlSafe: v.url }));
      break;
    }
    case "jwt": {
      const token = await textArg(rest);
      if (!token) fail("Usage: dtb jwt <token>");
      printJwt(tools.jwtDecode(token));
      break;
    }
    case "ts":
    case "time": {
      const r = tools.timestamp(rest.join(" ") || undefined);
      console.log(`${bold("seconds")}      ${r.seconds}`);
      console.log(`${bold("milliseconds")} ${r.milliseconds}`);
      console.log(`${bold("ISO (UTC)")}    ${r.iso}`);
      console.log(`${bold("local")}        ${r.local}`);
      console.log(`${bold("relative")}     ${yellow(r.relative)}`);
      break;
    }
    case "hash": {
      const text = await textArg(rest);
      if (!text) fail("Usage: dtb hash <text> [--algo sha256]");
      console.log(tools.hash(text, v.algo));
      break;
    }
    case "pass":
    case "password":
      console.log(tools.password(v.length, !v["no-symbols"]));
      break;
    case "url": {
      const [mode, ...parts] = rest;
      const text = await textArg(parts);
      if (!mode || !text) fail("Usage: dtb url encode|decode <text>");
      console.log(tools.url(mode, text));
      break;
    }
    default:
      console.error(red(`✖ Unknown command "${command}"`));
      console.log(HELP);
      process.exit(1);
  }
} catch (e) {
  fail(e.message);
}
