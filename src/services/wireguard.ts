import type { Service } from "./index.js";

const BASE_URL = process.env.WG_EASY_URL!;
const PASSWORD = process.env.WG_EASY_PASSWORD!;

interface WgClient {
  name: string;
  enabled: boolean;
  latestHandshakeAt: string | null;
  transferRx: number;
  transferTx: number;
}

async function getSession(): Promise<string> {
  const res = await fetch(`${BASE_URL}/api/session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ password: PASSWORD }),
  });
  const cookie = res.headers.get("set-cookie");
  if (!cookie) throw new Error("Failed to authenticate with wg-easy");
  return cookie.split(";")[0]!;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 ** 2) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(1)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export const wireguardService: Service = {
  name: "WireGuard",

  async getStatus(): Promise<string> {
    const cookie = await getSession();
    const res = await fetch(`${BASE_URL}/api/wireguard/client`, {
      headers: { Cookie: cookie },
    });
    const clients = (await res.json()) as WgClient[];

    if (clients.length === 0) return "no clients";

    return clients
      .map((c) => {
        const connected =
          c.latestHandshakeAt &&
          Date.now() - new Date(c.latestHandshakeAt).getTime() < 3 * 60 * 1000
            ? "connected"
            : "idle";
        const rx = formatBytes(c.transferRx);
        const tx = formatBytes(c.transferTx);
        return `• ${c.name} — ${connected} ↓${rx} ↑${tx}`;
      })
      .join("\n");
  },
};
