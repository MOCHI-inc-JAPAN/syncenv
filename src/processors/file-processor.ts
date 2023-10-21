import { resolve } from "node:path";
import { writeFile } from "../writeFile";
import { FileType, SyncenvConfigObject } from "../config-parser";
import { BaseProcessor } from "./base-processor";
import { resolveOutputPath } from "../pathResolver";

export class FileProcessor extends BaseProcessor {
  constructor(
    private placeholderMap: Record<string, string | number | boolean>,
    private config: Extract<SyncenvConfigObject<string>, { type: FileType }>
  ) {
    super();
  }
  async process(): Promise<void> {
    const outPath = resolveOutputPath(this.config);
    const contents = this.replaceValue(
      this.config.placeholder,
      this.placeholderMap
    );
    return writeFile(outPath, contents).then(() => {
      console.info(`${outPath} created.`);
    });
  }
}
