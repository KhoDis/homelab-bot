import { statfs } from "fs/promises";
import type { Service } from "./index.js";

interface DiskConfig {
  name: string;
  path: string;
}

const DISKS: DiskConfig[] = (process.env.DISK_PATHS ?? "")
  .split(",")
  .filter(Boolean)
  .map((entry) => {
    const [name, path] = entry.split(":");
    return { name: name!, path: path! };
  });

function formatBytes(bytes: number): string {
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

async function getDiskInfo(disk: DiskConfig) {
  const stats = await statfs(disk.path);
  const total = stats.blocks * stats.bsize;
  const free = stats.bfree * stats.bsize;
  const used = total - free;
  const pct = Math.round((used / total) * 100);
  return { ...disk, total, used, free, pct };
}

export const diskService: Service = {
  name: "Disk",

  async getStatus(): Promise<string> {
    if (DISKS.length === 0) return "no disks configured";

    const results = await Promise.all(DISKS.map(getDiskInfo));
    return results
      .map(({ name, used, total, pct }) => {
        const bar = pct >= 90 ? "🔴" : pct >= 75 ? "🟡" : "🟢";
        return `${bar} ${name}: ${formatBytes(used)} / ${formatBytes(total)} (${pct}%)`;
      })
      .join("\n");
  },
};

export async function checkDiskAlerts(): Promise<string | null> {
  if (DISKS.length === 0) return null;
  const results = await Promise.all(DISKS.map(getDiskInfo));
  const critical = results.filter((d) => d.pct >= 85);
  if (critical.length === 0) return null;
  const lines = critical.map(
    ({ name, free, pct }) => `• ${name}: ${pct}% used (${formatBytes(free)} free)`
  );
  return `💾 *Disk space warning:*\n${lines.join("\n")}`;
}
