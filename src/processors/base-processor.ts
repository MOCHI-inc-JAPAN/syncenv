import { SyncenvConfig } from "../config-parser";

export interface BaseProcessors {
  new (
    values: Record<
      string,
      string
    >,
    config: SyncenvConfig
  ): BaseProcessors;
}

export abstract class BaseProcessors {
  abstract process(): Promise<void>;
}
