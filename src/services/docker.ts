import { execFile } from "child_process";
import { promisify } from "util";
import type { Service } from "./index.js";

const execFileAsync = promisify(execFile);

export const dockerService: Service = {
  name: "Docker",

  async getStatus(): Promise<string> {
    const { stdout } = await execFileAsync("docker", [
      "ps",
      "--format",
      "{{.Names}}\t{{.Status}}",
    ]);

    if (!stdout.trim()) return "Docker: no running containers";

    const lines = stdout
      .trim()
      .split("\n")
      .map((line: string) => {
        const [name, ...statusParts] = line.split("\t");
        return `• ${name} — ${statusParts.join(" ")}`;
      });

    return `Docker:\n${lines.join("\n")}`;
  },
};
