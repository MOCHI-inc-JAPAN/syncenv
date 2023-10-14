import { SyncenvConfig, SyncenvConfigObject } from "../config-parser";

export interface BaseProcessorConstructor {
  new (
    placeholderMap: Record<string, string | number | boolean>,
    config: SyncenvConfigObject<string>
  ): BaseProcessor;
}

export abstract class BaseProcessor {
  abstract process(): Promise<void>;

  protected replaceValue(
    target: string,
    placeholderMap: Record<string, string | number | boolean>
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
}
