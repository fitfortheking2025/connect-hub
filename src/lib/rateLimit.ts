import { headers } from "next/headers";
import dbConnect from "@/lib/mongodb";
import { LoginAttempt } from "@/models/LoginAttempt";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function checkRateLimit(username: string): Promise<{
  allowed: boolean;
  error?: string;
}> {
  await dbConnect();

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown_ip";

  const identifier = `${ip}:${username.toLowerCase().trim()}`;
  const now = new Date();

  const record = await LoginAttempt.findOne({ identifier });

  if (record?.blockedUntil && record.blockedUntil > now) {
    const minutesLeft = Math.ceil(
      (record.blockedUntil.getTime() - now.getTime()) / 60000
    );
    return {
      allowed: false,
      error: `Too many failed attempts. Account locked for ${minutesLeft} minute(s).`,
    };
  }

  return { allowed: true };
}

export async function recordFailedAttempt(username: string) {
  await dbConnect();

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown_ip";

  const identifier = `${ip}:${username.toLowerCase().trim()}`;
  const now = new Date();

  const record = await LoginAttempt.findOne({ identifier });

  if (!record) {
    await LoginAttempt.create({
      identifier,
      count: 1,
      lastAttempt: now,
    });
    return;
  }

  // Reset counter if previous attempt was more than 15 minutes ago and not locked
  const isStale = now.getTime() - record.lastAttempt.getTime() > LOCKOUT_MINUTES * 60 * 1000;
  const newCount = isStale ? 1 : record.count + 1;

  let blockedUntil: Date | null = null;
  if (newCount >= MAX_ATTEMPTS) {
    blockedUntil = new Date(now.getTime() + LOCKOUT_MINUTES * 60 * 1000);
  }

  record.count = newCount;
  record.lastAttempt = now;
  record.blockedUntil = blockedUntil;
  await record.save();
}

export async function clearLoginAttempts(username: string) {
  await dbConnect();

  const headerList = await headers();
  const ip =
    headerList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headerList.get("x-real-ip") ||
    "unknown_ip";

  const identifier = `${ip}:${username.toLowerCase().trim()}`;
  await LoginAttempt.deleteOne({ identifier });
}