import { Agent } from "undici";
import type { Service, ServiceAction } from "./index.js";

const BASE_URL = process.env.CRAFTY_URL!;
const TOKEN = process.env.CRAFTY_TOKEN!;

const agent = new Agent({ connect: { rejectUnauthorized: false } });

async function craftyFetch(path: string, method = "GET"): Promise<unknown> {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${TOKEN}` },
    signal: AbortSignal.timeout(5000),
    // @ts-ignore — undici dispatcher
    dispatcher: agent,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Crafty ${res.status}: ${text}`);
  }
  return res.json();
}

interface ServerStats {
  server_id: { server_id: string; server_name: string };
  running: boolean;
  online: number;
  max: number;
}

async function getServers(): Promise<ServerStats[]> {
  const list = (await craftyFetch("/api/v2/servers/")) as {
    data: Array<{ server_id: string; server_name: string }>;
  };

  return Promise.all(
    list.data.map(async (s) => {
      const stats = (await craftyFetch(`/api/v2/servers/${s.server_id}/stats`)) as {
        data: ServerStats;
      };
      return stats.data;
    })
  );
}

export const craftyService: Service = {
  name: "Crafty",

  async getStatus(): Promise<string> {
    const servers = await getServers();
    if (servers.length === 0) return "no servers";
    return servers
      .map((s) => {
        const name = s.server_id.server_name;
        const status = s.running
          ? `running (${s.online}/${s.max} players)`
          : "stopped";
        return `• ${name} — ${status}`;
      })
      .join("\n");
  },

  async getActions(): Promise<ServiceAction[]> {
    const servers = await getServers();
    return servers.map((s) => {
      const name = s.server_id.server_name;
      const id = s.server_id.server_id;
      const action = s.running ? "stop_server" : "start_server";
      return {
        label: `${s.running ? "Stop" : "Start"} ${name}`,
        callback: async () => {
          await craftyFetch(`/api/v2/servers/${id}/action/${action}`, "POST");
          return `${s.running ? "Stopped" : "Started"} ${name}`;
        },
      };
    });
  },
};
