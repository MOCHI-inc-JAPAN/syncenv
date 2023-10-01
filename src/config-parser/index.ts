import { cosmiconfig } from "cosmiconfig";
import {
  record,
  object,
  union,
  string,
  literal,
  optional,
  parse,
  array,
} from "valibot";
import { resolve } from "node:path";

export type ProviderType = "gcp";
export type Placeholder = `$\{${string}\}` | `$${string}`;
export type ReplacerTemplate = `__${ProviderType}:${string}__`;

type EnvValue = {
  [key: string]: string | Placeholder;
};

type ReplacerValue = {
  [key: string]: string | ReplacerTemplate;
};

const ReplacesSchema = record(string());
const SyncenvConfigObjectSchema = union([
  object({
    type: union([literal(".env"), literal(".envrc")]),
    output_dir: string(),
    filename: optional(string()),
    env: record(string()),
    replaces: optional(ReplacesSchema),
    defaultReducer: optional(string()),
  }),
  object({
    type: literal("file"),
    output_path: string(),
    placeholder: string(),
    replaces: optional(ReplacesSchema),
    defaultReducer: optional(string()),
  }),
  object({
    type: literal("template"),
    input_path: string(),
    output_path: string(),
    replaces: optional(ReplacesSchema),
    defaultReducer: optional(string()),
  }),
]);

const SyncenvConfigSchema = object({
  replaces: optional(ReplacesSchema),
  defaultReplacer: optional(string()),
  plugins: optional(array(string())),
  setting: union([SyncenvConfigObjectSchema, array(SyncenvConfigObjectSchema)]),
});

export type EnvType = ".env" | ".envrc";
export type FileType = "file";
export type TemplateType = "template";

export type ConfigObjectType = EnvType | FileType | TemplateType;

export type SyncenvConfigObject<Replacer> =
  | {
      type: EnvType;
      output_dir: string;
      filename?: string;
      env: EnvValue;
      replaces?: ReplacerValue;
      defaultReplacer?: Replacer;
    }
  | {
      type: FileType;
      output_path: string;
      placeholder: string;
      replaces?: ReplacerValue;
      defaultReplacer?: Replacer;
    }
  | {
      type: TemplateType;
      input_path: string;
      output_path: string;
      replaces?: ReplacerValue;
      defaultReplacer?: Replacer;
    };

type SyncenvConfigInternal<
  Setting = SyncenvConfigObject<string> | SyncenvConfigObject<string>[],
  DefaultReplacer = string
> = {
  replaces?: ReplacerValue;
  defaultReplacer?: DefaultReplacer;
  plugins?: string[];
  setting: Setting;
};

export type SyncenvConfig<Replacer = string> = SyncenvConfigInternal<
  SyncenvConfigObject<Replacer>[],
  Replacer
>;

export interface IConfigParser {
  config(configPath?: string): Promise<SyncenvConfig>;
}

export class ConfigParser {
  constructor() {}
  async config(configPath?: string): Promise<SyncenvConfig> {
    const explorer = cosmiconfig("syncenv");
    let parsedConfigPath = configPath;
    if (parsedConfigPath && !parsedConfigPath.startsWith("/")) {
      parsedConfigPath = resolve(process.cwd(), parsedConfigPath);
    }
    const configResult = parsedConfigPath
      ? await explorer.load(parsedConfigPath)
      : await explorer.search();

    if (!configResult || configResult.isEmpty) {
      throw Error("configFile does not exist.");
    }

    const validConfig = parse(
      SyncenvConfigSchema,
      configResult.config
    ) as SyncenvConfigInternal;

    if (!Array.isArray(validConfig.setting)) {
      validConfig.setting = [validConfig.setting];
    }

    validConfig.setting = validConfig.setting.map((v) => {
      if (!v.defaultReplacer && validConfig.defaultReplacer) {
        v.defaultReplacer = validConfig.defaultReplacer;
      }
      if (validConfig.replaces) {
        v.replaces = {
          ...validConfig.replaces,
          ...v.replaces,
        };
      }
      return v;
    });

    return validConfig as SyncenvConfig;
  }
}
