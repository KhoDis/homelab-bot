import type { Service } from "./index.js";

const BASE_URL = process.env.NEXTCLOUD_URL!;
const USER = process.env.NEXTCLOUD_USER!;
const PASSWORD = process.env.NEXTCLOUD_PASSWORD!;

function authHeader(): string {
  return "Basic " + Buffer.from(`${USER}:${PASSWORD}`).toString("base64");
}

const headers = {
  Authorization: authHeader(),
  "OCS-APIREQUEST": "true",
  Accept: "application/json",
};

function formatBytes(bytes: number): string {
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toFixed(0)} MB`;
  return `${(bytes / 1024 ** 3).toFixed(1)} GB`;
}

export const nextcloudService: Service = {
  name: "Nextcloud",

  async getStatus(): Promise<string> {
    const statusRes = await fetch(`${BASE_URL}/status.php`);
    const status = (await statusRes.json()) as {
      maintenance: boolean;
      version: string;
    };

    const usersRes = await fetch(`${BASE_URL}/ocs/v1.php/cloud/users`, { headers });
    const usersData = (await usersRes.json()) as {
      ocs: { data: { users: string[] } };
    };

    const userIds = usersData.ocs.data.users;
    const quotas = await Promise.all(
      userIds.map(async (id) => {
        const res = await fetch(`${BASE_URL}/ocs/v1.php/cloud/users/${id}`, { headers });
        const data = (await res.json()) as {
          ocs: { data: { quota: { used: number; total: number } } };
        };
        return { id, quota: data.ocs.data.quota };
      })
    );

    const mode = status.maintenance ? "maintenance" : "online";
    const lines = quotas.map(({ id, quota }) => {
      const used = formatBytes(quota.used);
      const total = quota.total === -3 ? "unlimited" : formatBytes(quota.total);
      return `• ${id}: ${used} / ${total}`;
    });

    return `${mode} | v${status.version}\n${lines.join("\n")}`;
  },
};
