import Dockerode from "dockerode";
import type { Service, ServiceAction } from "./index.js";

const docker = new Dockerode({ socketPath: "/var/run/docker.sock" });

export const dockerService: Service = {
  name: "Docker",

  async getStatus(): Promise<string> {
    const containers = await docker.listContainers();
    if (containers.length === 0) return "no running containers";
    const lines = containers.map(
      (c) => `• ${(c.Names[0] ?? c.Id).replace(/^\//, "")} — ${c.Status}`
    );
    return lines.join("\n");
  },

  async getActions(): Promise<ServiceAction[]> {
    const containers = await docker.listContainers();
    const unhealthy = containers.filter(
      (c) => c.Status.startsWith("Restarting") || c.Status.includes("unhealthy")
    );
    return unhealthy.map((c) => {
      const name = (c.Names[0] ?? c.Id).replace(/^\//, "");
      return {
        label: `Restart ${name}`,
        callback: async () => {
          await docker.getContainer(c.Id).restart();
          return `Restarted ${name}`;
        },
      };
    });
  },
};
