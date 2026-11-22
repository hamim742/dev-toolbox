import { test } from "node:test";
import assert from "node:assert/strict";
import * as t from "../src/tools.js";

const b64u = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");

test("uuid", () => {
  const ids = t.uuid(3);
  assert.equal(ids.length, 3);
  assert.match(ids[0], /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  assert.match(t.uuid(1, true)[0], /^[0-9A-F-]{36}$/);
  assert.throws(() => t.uuid(0));
});

test("base64 roundtrip incl. unicode and url-safe", () => {
  assert.equal(t.base64("encode", "Hello"), "SGVsbG8=");
  assert.equal(t.base64("decode", "SGVsbG8="), "Hello");
  const bn = "আমার বাংলা";
  assert.equal(t.base64("decode", t.base64("encode", bn)), bn);
  assert.equal(t.base64("encode", "??>>", { urlSafe: true }), "Pz8-Pg");
  assert.throws(() => t.base64("decode", "!!!"));
  assert.throws(() => t.base64("nope", "x"));
});

test("jwt decode and expiry", () => {
  const token = `${b64u({ alg: "HS256" })}.${b64u({ sub: "1", exp: 1000 })}.sig`;
  const r = t.jwtDecode(`Bearer ${token}`, 2_000_000);
  assert.equal(r.payload.sub, "1");
  assert.equal(r.expired, true);
  assert.equal(r.dates.exp, "1970-01-01T00:16:40.000Z");
  assert.equal(t.jwtDecode(token, 0).expired, false);
  assert.throws(() => t.jwtDecode("a.b"));
  assert.throws(() => t.jwtDecode("a.b.c"));
});

test("timestamp", () => {
  const now = Date.UTC(2026, 0, 1);
  assert.equal(t.timestamp("1700000000", now).iso, "2023-11-14T22:13:20.000Z");
  assert.equal(t.timestamp("1700000000000", now).seconds, 1700000000);
  assert.equal(t.timestamp("2026-01-01T00:00:00Z", now).seconds, now / 1000);
  assert.equal(t.timestamp(undefined, now).milliseconds, now);
  assert.match(t.timestamp("1700000000", now).relative, /ago$/);
  assert.throws(() => t.timestamp("not a date"));
});

test("hash", () => {
  assert.equal(t.hash("abc", "md5"), "900150983cd24fb0d6963f7d28e17f72");
  assert.equal(t.hash("abc"), "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  assert.throws(() => t.hash("x", "crc"));
});

test("password has every character class and right length", () => {
  for (let i = 0; i < 50; i++) {
    const p = t.password(12);
    assert.equal(p.length, 12);
    assert.match(p, /[a-z]/); assert.match(p, /[A-Z]/); assert.match(p, /[0-9]/); assert.match(p, /[^a-zA-Z0-9]/);
  }
  assert.match(t.password(30, false), /^[a-zA-Z0-9]+$/);
  assert.throws(() => t.password(4));
});

test("url", () => {
  assert.equal(t.url("encode", "a b&c=d/ব"), "a%20b%26c%3Dd%2F%E0%A6%AC");
  assert.equal(t.url("decode", "a%20b"), "a b");
  assert.throws(() => t.url("decode", "%E0%A4%A"));
});
