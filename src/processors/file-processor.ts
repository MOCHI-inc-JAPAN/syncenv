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
    const outPaths = resolveOutputPath(this.config, this.config.work_dir);
    const contents = this.config.placeholder
      ? this.replaceValue(
          this.config.placeholder,
          this.placeholderMap as Record<string, string | number | boolean>
        )
      : (this.placeholderMap["@@content"] as Buffer);
    await Promise.all(
      outPaths.map((outPath) =>
        this.writeFile(outPath, contents).then(() => {
          console.info(`${outPath} created.`);
        })
      )
    );
  }
}
