import { writeFile as fsWriteFile, mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { isDirectory } from "./pathResolver";

export async function writeFile(
  outPath: string,
  contents: string | ArrayBufferLike | Buffer
) {
  const dirPath = dirname(outPath);
  if (!(await isDirectory(dirPath))) {
    await mkdir(dirPath, { recursive: true });
  }
  return fsWriteFile(outPath, contents);
}
