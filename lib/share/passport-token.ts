import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import type { Locale } from "@/i18n/config";

export type SharedPassport = {
  version: 1;
  locale: Locale;
  name: string;
  nationality: string;
  territory: string;
  headOfState: string;
  passportNumber: string;
  issueDate: string;
  portraitUrl: string | null;
};

function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is required to create passport share links");
  return secret;
}

function cleanText(value: string, maximumLength: number) {
  return value.replace(/[\u0000-\u001f\u007f]/g, "").trim().slice(0, maximumLength);
}

function cleanPortraitUrl(value: string | null) {
  if (!value) return null;

  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === "i.scdn.co" ? url.toString() : null;
  } catch {
    return null;
  }
}

function normalizePassport(passport: SharedPassport): SharedPassport {
  return {
    version: 1,
    locale: passport.locale,
    name: cleanText(passport.name, 80),
    nationality: cleanText(passport.nationality, 60),
    territory: cleanText(passport.territory, 80),
    headOfState: cleanText(passport.headOfState, 80),
    passportNumber: cleanText(passport.passportNumber, 32),
    issueDate: cleanText(passport.issueDate, 32),
    portraitUrl: cleanPortraitUrl(passport.portraitUrl),
  };
}

export function createPassportShareToken(passport: SharedPassport) {
  const payload = Buffer.from(JSON.stringify(normalizePassport(passport))).toString("base64url");
  const signature = createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${signature}`;
}

export function readPassportShareToken(token: string): SharedPassport | null {
  const [payload, signature, extra] = token.split(".");
  if (!payload || !signature || extra || token.length > 2_500) return null;

  const expectedSignature = createHmac("sha256", getSecret()).update(payload).digest();
  let receivedSignature: Buffer;
  try {
    receivedSignature = Buffer.from(signature, "base64url");
  } catch {
    return null;
  }
  if (receivedSignature.length !== expectedSignature.length || !timingSafeEqual(receivedSignature, expectedSignature)) return null;

  try {
    const passport = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as SharedPassport;
    if (
      passport.version !== 1 ||
      !["en", "pt-BR", "es"].includes(passport.locale) ||
      typeof passport.name !== "string" ||
      typeof passport.nationality !== "string" ||
      typeof passport.territory !== "string" ||
      typeof passport.headOfState !== "string" ||
      typeof passport.passportNumber !== "string" ||
      typeof passport.issueDate !== "string" ||
      (passport.portraitUrl !== null && typeof passport.portraitUrl !== "string")
    ) return null;

    return normalizePassport(passport);
  } catch {
    return null;
  }
}
