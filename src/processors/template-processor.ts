import { SyncenvConfig } from "../config-parser";
import { BaseProcessors } from "./base-processor";

export class TemplateProcessors extends BaseProcessors {
  constructor(private values: Record<string, string>, config: SyncenvConfig) {
    super();
  }
  process(): Promise<void> {
    throw new Error("Method not implemented.");
  }
}
