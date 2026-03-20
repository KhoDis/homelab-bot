import { getContainerLogs } from "./docker-logs.js";

export interface NcFailedAttempt {
  ip: string;
  user: string;
  count: number;
}

let lastCheck = Math.floor(Date.now() / 1000);

export async function checkNextcloudFailures(): Promise<NcFailedAttempt[]> {
  const since = lastCheck;
  lastCheck = Math.floor(Date.now() / 1000);

  const logs = await getContainerLogs("nextcloud-aio-nextcloud", since);
  const failures = new Map<string, { user: string; count: number }>();

  for (const line of logs.split("\n")) {
    // Log format: {"message":"Login failed: 'user' (Remote IP: '1.2.3.4')"}
    const match = line.match(/Login failed: '([^']+)' \(Remote IP: '([^']+)'\)/);
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
}
