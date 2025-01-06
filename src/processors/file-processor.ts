import { FileType, SyncenvConfigObject } from "../config-parser";
import { BaseProcessor } from "./base-processor";
import { resolveOutputPath } from "../pathResolver";
import { CacheResolver } from "../cache-resolver";

export class FileProcessor extends BaseProcessor {
  constructor(
    protected placeholderMap: Record<
      string,
      string | number | boolean | Buffer
    >,
    protected config: Extract<SyncenvConfigObject<string>, { type: FileType }>,
    protected cacheResolver: CacheResolver
  ) {
    super(placeholderMap, cacheResolver);
  }

  async process(): Promise<void> {
    const outPath = resolveOutputPath(this.config, this.config.work_dir);
    if (this.config.placeholder) {
      const contents = this.replaceValue(
        this.config.placeholder,
        this.placeholderMap as Record<string, string | number | boolean>
      );
      return this.writeFile(outPath, contents).then(() => {
        console.info(`${outPath} created.`);
      });
    } else {
      const contents = this.placeholderMap["@@content"] as Buffer;
      return this.writeFile(outPath, contents).then(() => {
        console.info(`${outPath} created.`);
      });
    }
  }
}
