import { PipeInterface, PluginInterface } from "./plugin-interface";
import { defaulPipes } from "./default-pipes";

export default class DefaultPlugin extends PluginInterface {
  static pluginId: "default" = "default";

  loadPipes(): PipeInterface[] {
    return defaulPipes
  }
}
