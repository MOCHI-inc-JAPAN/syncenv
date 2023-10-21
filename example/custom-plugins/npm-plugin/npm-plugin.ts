import { Plugin, SyncenvConfig } from "@tkow/syncenv";

export default class CustomNpmPlugin extends Plugin {
  static pluginId: "npm" = "npm";

  constructor() {
    super();
  }

  async fetchValues(
    replaces: Record<string, string>,
    config: SyncenvConfig
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    for (let [key, value] of Object.entries(replaces)) {
      results[key] = "npm-" + value;
    }
    return results;
  }

  loadPipes() {
    return [
      {
        pipeId: "npm-postfix",
        pipe: (value, id) => value + "-npm",
      },
    ];
  }
}
