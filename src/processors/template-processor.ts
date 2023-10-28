import { readFile } from "node:fs/promises";
import { writeFile } from "../writeFile";
import { resolve } from "node:path";
import { SyncenvConfigObject, TemplateType } from "../config-parser";
import { BaseProcessor } from "./base-processor";
import { resolveOutputPath } from "../pathResolver";
import { CacheResolver } from "../cache-resolver";

export class TemplateProcessor extends BaseProcessor {
  constructor(
    protected placeholderMap: Record<string, string | number | boolean | Buffer>,
    protected config: Extract<SyncenvConfigObject<string>, { type: TemplateType }>,
    protected cacheResolver: CacheResolver
   ) {
     super(placeholderMap, cacheResolver);
   }

  async process(): Promise<void> {
    const inputPath = this.config.input_path.startsWith("/")
      ? this.config.input_path
      : resolve(global.process.cwd(), this.config.input_path);
    const outPath = resolveOutputPath(this.config);
    const file = await readFile(inputPath);
    console.info(`${inputPath} read.`);
    const contents = this.replaceValue(file.toString(), this.placeholderMap);
    return writeFile(outPath, contents).then(() => {
      console.info(`${outPath} created.`);
    });
  }
}
