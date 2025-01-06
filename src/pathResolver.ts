import { resolve, join } from "node:path";
import { stat } from "node:fs/promises";
import { existsSync as fsExists, statSync } from "node:fs";
import { SyncenvConfigObject } from "./config-parser";

type ConfigObject = SyncenvConfigObject<any>;
type OutputConfig = Extract<ConfigObject, { output_path: any }>;
type DirFileConfig = Exclude<ConfigObject, { output_path: any }>;

export const resolveOutputPath = (config: ConfigObject, baseDir: string) => {
  const outputPath =
    (config as OutputConfig).output_path ||
    join(
      (config as DirFileConfig).output_dir!,
      (config as DirFileConfig).filename || (config as DirFileConfig).type!
    );

  return resolveAbsolutePath(outputPath, baseDir);
};

export const resolveAbsolutePath = (outputPath: string, baseDir: string) => {
  return outputPath.startsWith("/")
    ? outputPath
    : resolve(baseDir, outputPath);
};

export async function isDirectory(path: string) {
  const dirExists = fsExists(path);
  if (!dirExists) {
    return false;
  }
  const stats = await stat(path);
  return stats.isDirectory();
}

export async function isFile(path: string) {
  const fileExists = fsExists(path);
  if (!fileExists) {
    return false;
  }
  const stats = await stat(path);
  return stats.isFile();
}

export function isFileSync(path: string) {
  const fileExists = fsExists(path);
  if (!fileExists) {
    return false;
  }
  const stats = statSync(path);
  return stats.isFile();
}
