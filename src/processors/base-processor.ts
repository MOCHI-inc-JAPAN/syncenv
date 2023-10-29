import { CacheResolver } from "../cache-resolver";
import { SyncenvConfigObject } from "../config-parser";
import { writeFile } from "../writeFile";

export interface BaseProcessorConstructor {
  new (
    placeholderMap: Record<
      string,
      string | number | boolean | Buffer | ArrayBufferLike
    >,
    config: SyncenvConfigObject<string>,
    cacheResolver: CacheResolver
  ): BaseProcessor;
}

export abstract class BaseProcessor {
  abstract process(): Promise<void>;

  constructor(
    protected placeholderMap: Record<
      string,
      string | number | boolean | Buffer | ArrayBufferLike
    >,
    protected cacheResolver: CacheResolver
  ) {}

  protected replaceValue(
    target: string,
    placeholderMap: Record<
      string,
      string | number | boolean | Buffer | ArrayBufferLike
    >
  ): string {
    let newContent = target;
    Object.entries(placeholderMap).forEach(([key, value]) => {
      newContent = newContent.replace(
        new RegExp(`\\$\{${key}\}|\\$${key}(?![^\\s])`, "g"),
        value.toString()
      );
    });
    return newContent;
  }

  protected async writeFile(outputPath: string, contents: Buffer | string) {
    await this.cacheResolver.storeCache(outputPath, contents);
    return writeFile(outputPath, contents);
  }
}
