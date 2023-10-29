import { resolve, join, dirname } from "node:path";
import { stat } from "node:fs/promises";
import { existsSync as fsExists} from "node:fs";
import { SyncenvConfigObject } from "./config-parser";


type ConfigObject = SyncenvConfigObject<any>;
type OutputConfig = Extract<ConfigObject, { output_path: any }>;
type DirFileConfig = Exclude<ConfigObject, { output_path: any }>;

export const resolveOutputPath = (config: ConfigObject) => {
  const outputPath =
    (config as OutputConfig).output_path ||
    join(
      (config as DirFileConfig).output_dir!,
      (config as DirFileConfig).filename || (config as DirFileConfig).type!
    );

  return resolveAbsolutePath(outputPath)
};

export const resolveAbsolutePath = (outputPath: string) => {
  return outputPath.startsWith("/")
    ? outputPath
    : resolve(global.process.cwd(), outputPath);
};


export async function isDirectory(path: string) {
  const dirExists = await fsExists(path)
  if(!dirExists) {
    return false
  }
  const stats = await stat(path);
  return stats.isDirectory()
}

export async function isFile(path: string) {
  const fileExists = await fsExists(path)
  if(!fileExists) {
    return false
  }
  const stats = await stat(path);
  return stats.isFile()
}
