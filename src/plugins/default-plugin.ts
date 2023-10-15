import { PipeInterface, PluginInterface } from "./plugin-interface";

export default class DefaultPlugin extends PluginInterface {
  static pluginId: "default" = "default";

  loadPipes(): PipeInterface[] {
    return [];
  }
}
