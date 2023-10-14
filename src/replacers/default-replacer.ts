import { BaseReplacer } from "./base-replacer";
import { SyncenvConfig } from "../config-parser";

export default class DefaultReplacer extends BaseReplacer {
  static pluginId: "default" = "default";

  async fetchValues(
    replaces: Record<string, string | number | boolean>,
    config: SyncenvConfig
  ): Promise<Record<string, string | number | boolean>> {
    return replaces;
  }
}
