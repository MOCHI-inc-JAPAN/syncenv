import { type BaseProcessorConstructor } from "./base-processor";
import { EnvProcessor } from "./env-processor";
import { FileProcessor } from "./file-processor";
import { TemplateProcessor } from "./template-processor";
import { ConfigObjectType } from "../config-parser";

export default {
  ".env": EnvProcessor,
  ".envrc": EnvProcessor,
  file: FileProcessor,
  template: TemplateProcessor,
} as Record<ConfigObjectType, BaseProcessorConstructor>;
