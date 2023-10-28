import { writeFile as fsWriteFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";

export async function writeFile(
  outPath: string,
  contents: string | ArrayBufferLike | Buffer
) {
  await mkdir(dirname(outPath), { recursive: true });
  return fsWriteFile(outPath, contents);
}
