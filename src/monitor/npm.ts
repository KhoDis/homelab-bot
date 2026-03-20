import { getContainerLogs } from "./docker-logs.js";

export interface NpmFailedAttempt {
  ip: string;
  path: string;
  status: number;
  count: number;
}

let lastCheck = Math.floor(Date.now() / 1000);

export async function checkNpmFailures(): Promise<NpmFailedAttempt[]> {
  const since = lastCheck;
  lastCheck = Math.floor(Date.now() / 1000);

  const logs = await getContainerLogs("npm-app-1", since);
  const failures = new Map<string, NpmFailedAttempt>();

  for (const line of logs.split("\n")) {
    // Nginx access log: 1.2.3.4 - - [date] "METHOD /path HTTP/1.1" 401 ...
    const match = line.match(
      /^(\S+) .+ "(?:GET|POST|PUT|DELETE) (\S+) HTTP\/[\d.]+" (40[13])/
    );
    if (match) {
      const [, ip, path, statusStr] = match;
      const key = `${ip}:${path}`;
      const prev = failures.get(key) ?? { ip: ip!, path: path!, status: Number(statusStr), count: 0 };
      failures.set(key, { ...prev, count: prev.count + 1 });
    }
  }

  return Array.from(failures.values());
}
