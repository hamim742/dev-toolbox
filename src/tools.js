import { createHash, randomInt, randomUUID } from "node:crypto";

export function uuid(count = 1, upper = false) {
  const n = Number(count);
  if (!Number.isInteger(n) || n < 1 || n > 1000) throw new Error("count must be 1-1000");
  return Array.from({ length: n }, () => (upper ? randomUUID().toUpperCase() : randomUUID()));
}

export function base64(mode, text, { urlSafe = false } = {}) {
  if (mode === "encode") {
    const out = Buffer.from(text, "utf8").toString("base64");
    return urlSafe ? out.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "") : out;
  }
  if (mode === "decode") {
    if (!/^[A-Za-z0-9+/_-]*={0,2}$/.test(text.trim())) throw new Error("Not valid Base64");
    return Buffer.from(text.trim(), "base64").toString("utf8");
  }
  throw new Error("Use: base64 encode <text> | base64 decode <text>");
}

const b64urlJson = (part, label) => {
  try {
    return JSON.parse(Buffer.from(part, "base64url").toString("utf8"));
  } catch {
    throw new Error(`Invalid JWT: ${label} is not valid Base64URL JSON`);
  }
};

/** Decode (NOT verify) a JWT. */
export function jwtDecode(token, now = Date.now()) {
  const parts = token.trim().replace(/^Bearer\s+/i, "").split(".");
  if (parts.length !== 3) throw new Error("Invalid JWT: expected 3 parts separated by dots");
  const header = b64urlJson(parts[0], "header");
  const payload = b64urlJson(parts[1], "payload");
  const dates = {};
  for (const k of ["iat", "nbf", "exp"]) {
    if (typeof payload[k] === "number") dates[k] = new Date(payload[k] * 1000).toISOString();
  }
  const expired = typeof payload.exp === "number" ? payload.exp * 1000 < now : null;
  return { header, payload, dates, expired, hasSignature: parts[2].length > 0 };
}

export function relative(ms, now = Date.now()) {
  const diff = Math.round((ms - now) / 1000);
  const abs = Math.abs(diff);
  const units = [["day", 86400], ["hour", 3600], ["minute", 60], ["second", 1]];
  for (const [name, size] of units) {
    if (abs >= size || name === "second") {
      const v = Math.floor(abs / size);
      const label = `${v} ${name}${v === 1 ? "" : "s"}`;
      return diff >= 0 ? `in ${label}` : `${label} ago`;
    }
  }
}

/** No input = now. Number = unix seconds (<=11 digits) or milliseconds. Otherwise a date string. */
export function timestamp(input, now = Date.now()) {
  let ms;
  if (input === undefined || input === "") ms = now;
  else if (/^-?\d+$/.test(input)) ms = input.replace("-", "").length <= 11 ? Number(input) * 1000 : Number(input);
  else ms = Date.parse(input);
  if (!Number.isFinite(ms) || Number.isNaN(new Date(ms).getTime())) {
    throw new Error(`Cannot understand "${input}". Try a unix timestamp or a date like 2026-01-31T10:00:00Z`);
  }
  const d = new Date(ms);
  return {
    seconds: Math.floor(ms / 1000),
    milliseconds: ms,
    iso: d.toISOString(),
    local: d.toString(),
    relative: relative(ms, now),
  };
}

export const HASH_ALGOS = ["md5", "sha1", "sha256", "sha512"];
export function hash(text, algo = "sha256") {
  if (!HASH_ALGOS.includes(algo)) throw new Error(`--algo must be one of: ${HASH_ALGOS.join(", ")}`);
  return createHash(algo).update(text).digest("hex");
}

export function password(length = 20, symbols = true) {
  const n = Number(length);
  if (!Number.isInteger(n) || n < 8 || n > 128) throw new Error("length must be 8-128");
  const sets = ["abcdefghijkmnopqrstuvwxyz", "ABCDEFGHJKLMNPQRSTUVWXYZ", "23456789"];
  if (symbols) sets.push("!@#$%^&*-_=+?");
  const all = sets.join("");
  const pick = (s) => s[randomInt(s.length)];
  const chars = sets.map(pick); // guarantee one of each set
  while (chars.length < n) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export function url(mode, text) {
  if (mode === "encode") return encodeURIComponent(text);
  if (mode === "decode") {
    try {
      return decodeURIComponent(text);
    } catch {
      throw new Error("Not a valid URL-encoded string");
    }
  }
  throw new Error("Use: url encode <text> | url decode <text>");
}
