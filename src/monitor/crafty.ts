import { getContainerLogs } from "./docker-logs.js";

export interface CraftyFailedAttempt {
  ip: string;
  count: number;
}

let lastCheck = Math.floor(Date.now() / 1000);

export async function checkCraftyFailures(): Promise<CraftyFailedAttempt[]> {
  const since = lastCheck;
  lastCheck = Math.floor(Date.now() / 1000);

  const logs = await getContainerLogs("crafty_container", since);
  const failures = new Map<string, number>();

  for (const line of logs.split("\n")) {
    // Crafty logs: "Login failed for user ... from 1.2.3.4"
    const match = line.match(/[Ll]ogin failed.+?(\d{1,3}(?:\.\d{1,3}){3})/);
    if (match) {
      const ip = match[1]!;
      failures.set(ip, (failures.get(ip) ?? 0) + 1);
    }
  }

  return Array.from(failures.entries()).map(([ip, count]) => ({ ip, count }));
}
