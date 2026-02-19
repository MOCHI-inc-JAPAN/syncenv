import { resolve, join } from "node:path";
import { stat } from "node:fs/promises";
import { existsSync as fsExists, statSync } from "node:fs";
import { SyncenvConfigObject } from "./config-parser";

type ConfigObject = SyncenvConfigObject<any>;
type OutputConfig = Extract<ConfigObject, { output_path: any }>;
type DirFileConfig = Exclude<ConfigObject, { output_path: any }>;

export const resolveOutputPath = (config: ConfigObject, baseDir: string): string[] => {
  const outputPaths = (config as OutputConfig).output_path;
  if (outputPaths) {
    return outputPaths.map((p) => resolveAbsolutePath(p, baseDir));
  }
  const dirConfig = config as DirFileConfig;
  const filename = dirConfig.filename || dirConfig.type!;
  return dirConfig.output_dir.map((dir) =>
    resolveAbsolutePath(join(dir, filename), baseDir)
  );
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
