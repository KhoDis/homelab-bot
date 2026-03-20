import Dockerode from "dockerode";
import type { Service } from "./index.js";

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
};