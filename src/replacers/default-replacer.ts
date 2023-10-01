import { BaseReplacer } from "./base-replacer";
import { SyncenvConfig } from "../config-parser";

export default class DefaultReplacer extends BaseReplacer {
  static pluginId: "default" = "default";

  async fetchValues(
    replaces: Record<string, string>,
    config: SyncenvConfig
  ): Promise<Record<string, string>> {
    return replaces;
  }
}
