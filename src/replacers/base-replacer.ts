import { SyncenvConfig } from "../config-parser";

export abstract class BaseReplacer {
  abstract fetchValues(config: SyncenvConfig): Promise<Record<string, string>>
}


