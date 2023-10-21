import { SyncenvConfig } from "../config-parser";

export interface PluginInterfaceConstructor {
  pluginId: string;
  new (...args: any[]): PluginInterface;
}

export interface PipeInterface {
  pipeId: string;
  pipe(
    value: string | number | boolean,
    ...args: any[]
  ): string | number | boolean;
}

export abstract class PluginInterface {
  static pluginId: string;
  async fetchValues(
    replaces: Record<string, string | number | boolean>,
    config: SyncenvConfig
  ): Promise<Record<string, string | number | boolean>> {
    return replaces;
  }
  loadPipes(): PipeInterface[] {
    return [];
  }
  get pluginId() {
    return (this.constructor as typeof PluginInterface).pluginId;
  }
}
