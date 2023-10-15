import { readFile } from "node:fs/promises";
import { writeFile } from "../writeFile";
import { resolve } from "node:path";
import { SyncenvConfigObject, TemplateType } from "../config-parser";
import { BaseProcessor } from "./base-processor";

export class TemplateProcessor extends BaseProcessor {
  constructor(
    private placeholderMap: Record<string, string | number | boolean>,
    private config: Extract<SyncenvConfigObject<string>, { type: TemplateType }>
  ) {
    super();
  }

  async process(): Promise<void> {
    const inputPath = this.config.input_path.startsWith("/")
      ? this.config.input_path
      : resolve(global.process.cwd(), this.config.input_path);
    const outPath = this.config.input_path.startsWith("/")
      ? this.config.output_path
      : resolve(global.process.cwd(), this.config.output_path);
    const file = await readFile(inputPath);
    console.info(`${inputPath} read.`);
    const contents = this.replaceValue(file.toString(), this.placeholderMap);
    return writeFile(outPath, contents).then(() => {
      console.info(`${outPath} created.`);
    });
  }
}
