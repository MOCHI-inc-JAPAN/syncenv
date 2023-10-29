import { PipeInterface, PluginInterface } from "./plugin-interface";
import { defaultPipes } from "./default-pipes";

export default class DefaultPlugin extends PluginInterface {
  static pluginId: "default" = "default";

  loadPipes(): PipeInterface[] {
    return defaultPipes;
  }
}
