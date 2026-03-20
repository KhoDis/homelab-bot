import { readFileSync, statSync } from "fs";

const AUTH_LOG = "/var/log/auth.log";
let lastSize = 0;

export interface FailedAttempt {
  ip: string;
  user: string;
  count: number;
}

export function checkSshFailures(): FailedAttempt[] {
  try {
    const stat = statSync(AUTH_LOG);
    if (stat.size <= lastSize) return [];

    const content = readFileSync(AUTH_LOG, "utf-8");
    const newContent = content.slice(lastSize);
    lastSize = stat.size;

    const failures = new Map<string, { user: string; count: number }>();

    for (const line of newContent.split("\n")) {
      const match =
        line.match(/Failed password for (?:invalid user )?(\S+) from (\S+)/) ??
        line.match(/Invalid user (\S+) from (\S+)/);

      if (match) {
        const [, user, ip] = match;
        const prev = failures.get(ip!) ?? { user: user!, count: 0 };
        failures.set(ip!, { user: user!, count: prev.count + 1 });
      }
    }

    return Array.from(failures.entries()).map(([ip, { user, count }]) => ({
      ip,
      user,
      count,
    }));
  } catch {
    return [];
  }
}
