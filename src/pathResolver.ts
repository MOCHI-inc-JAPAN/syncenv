import { resolve, join } from "node:path";
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

  return outputPath.startsWith("/")
    ? outputPath
    : resolve(global.process.cwd(), outputPath);
};
