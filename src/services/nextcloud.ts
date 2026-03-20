import type { Service } from "./index.js";

const BASE_URL = process.env.NEXTCLOUD_URL!;
const USER = process.env.NEXTCLOUD_USER!;
const PASSWORD = process.env.NEXTCLOUD_PASSWORD!;

function authHeader(): string {
  return "Basic " + Buffer.from(`${USER}:${PASSWORD}`).toString("base64");
}

interface NcStatus {
  installed: boolean;
  maintenance: boolean;
  version: string;
}

interface NcUserData {
  ocs: {
    data: {
      quota: {
        used: number;
        total: number;
      };
    };
  };
}

export const nextcloudService: Service = {
  name: "Nextcloud",

  async getStatus(): Promise<string> {
    const [statusRes, userRes] = await Promise.all([
      fetch(`${BASE_URL}/status.php`),
      fetch(`${BASE_URL}/ocs/v1.php/cloud/users/${USER}`, {
        headers: {
          Authorization: authHeader(),
          "OCS-APIREQUEST": "true",
          Accept: "application/json",
        },
      }),
    ]);

    const status = (await statusRes.json()) as NcStatus;
    const userData = (await userRes.json()) as NcUserData;
    const quota = userData.ocs.data.quota;

    const used = (quota.used / 1e9).toFixed(1);
    const total =
      quota.total === -3
        ? "unlimited"
        : `${(quota.total / 1e9).toFixed(1)} GB`;

    const mode = status.maintenance ? "maintenance" : "online";
    return `${mode} | v${status.version}\nStorage: ${used} GB / ${total}`;
  },
};
