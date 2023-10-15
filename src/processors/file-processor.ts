import { resolve } from "node:path";
import { writeFile } from "../writeFile";
import { FileType, SyncenvConfigObject } from "../config-parser";
import { BaseProcessor } from "./base-processor";

export class FileProcessor extends BaseProcessor {
  constructor(
    private placeholderMap: Record<string, string | number | boolean>,
    private config: Extract<SyncenvConfigObject<string>, { type: FileType }>
  ) {
    super();
  }
  async process(): Promise<void> {
    const outPath = this.config.output_path.startsWith("/")
      ? this.config.output_path
      : resolve(global.process.cwd(), this.config.output_path);
    const contents = this.replaceValue(
      this.config.placeholder,
      this.placeholderMap
    );
    return writeFile(outPath, contents).then(() => {
      console.info(`${outPath} created.`);
    });
  }
}
