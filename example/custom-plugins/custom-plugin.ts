import { Plugin, SyncenvConfig } from "@tkow/syncenv";

export default class CustomPlugin extends Plugin {
  static pluginId: "custom" = "custom";

  constructor() {
    super();
  }

  async fetchValues(
    replaces: Record<string, string>,
    config: SyncenvConfig
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    for (let [key, value] of Object.entries(replaces)) {
      results[key] = "pre-" + value;
    }
    return results;
  }

  loadPipes() {
    return [
      {
        pipeId: "postfix",
        pipe: (value, id) => value + "-" + id,
      },
    ];
  }
}
