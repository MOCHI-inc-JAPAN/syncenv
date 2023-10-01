import { SyncenvConfig } from "../config-parser";


export interface BaseReplacerConstructor {
  pluginId: string
  new (...args: any[]): BaseReplacer
}

export abstract class BaseReplacer {
  static pluginId: string
  abstract fetchValues(replaces: Record<string, string>, config?: SyncenvConfig): Promise<Record<string, string>>;
  get pluginId() {
    return (this.constructor as typeof BaseReplacer).pluginId
  }
}
