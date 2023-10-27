import { resolve } from "node:path";
import { writeFile } from "../writeFile";
import { FileType, SyncenvConfigObject } from "../config-parser";
import { BaseProcessor } from "./base-processor";
import { resolveOutputPath } from "../pathResolver";

export class FileProcessor extends BaseProcessor {
  constructor(
    private placeholderMap: Record<
      string,
      ArrayBufferLike | string | number | boolean
    >,
    private config: Extract<SyncenvConfigObject<string>, { type: FileType }>
  ) {
    super();
  }
  async process(): Promise<void> {
    const outPath = resolveOutputPath(this.config);
    if (this.config.placeholder) {
      const contents = this.replaceValue(
        this.config.placeholder,
        this.placeholderMap as Record<string, string | number | boolean>
      );
      return writeFile(outPath, contents).then(() => {
        console.info(`${outPath} created.`);
      });
    } else {
      const contents = this.placeholderMap["@@content"] as ArrayBufferLike;
      return writeFile(outPath, contents).then(() => {
        console.info(`${outPath} created.`);
      });
    }
  }
}
