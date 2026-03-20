import Dockerode from "dockerode";

const docker = new Dockerode({ socketPath: "/var/run/docker.sock" });

// Dockerode log buffers have an 8-byte header per entry
function parseLogs(buffer: Buffer): string {
  const lines: string[] = [];
  let offset = 0;
  while (offset + 8 <= buffer.length) {
    const size = buffer.readUInt32BE(offset + 4);
    offset += 8;
    if (offset + size > buffer.length) break;
    lines.push(buffer.subarray(offset, offset + size).toString("utf-8"));
    offset += size;
  }
  return lines.join("");
}

export async function getContainerLogs(
  containerName: string,
  since: number
): Promise<string> {
  try {
    const container = docker.getContainer(containerName);
    const buffer = (await container.logs({
      stdout: true,
      stderr: true,
      since,
      tail: 500,
    })) as unknown as Buffer;
    return parseLogs(buffer);
  } catch {
    return "";
  }
}
