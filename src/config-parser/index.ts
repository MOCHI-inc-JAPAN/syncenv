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

export type ProviderType = "gcp";
export type Placeholder = `$\{${string}\}`;
export type ReplacerTemplate = `@${ProviderType}:${string}`;

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
    file_name: optional(string()),
    env: string(),
    replaces: optional(ReplacesSchema),
  }),
  object({
    type: literal("file"),
    output_path: string(),
    placeholder: string(),
    replaces: optional(ReplacesSchema),
  }),
  object({
    type: literal("template"),
    input_path: string(),
    output_path: string(),
    replaces: optional(ReplacesSchema),
  }),
]);

const SyncenvConfigSchema = object({
  replaces: optional(ReplacesSchema),
  defaultReplacer: optional(string()),
  plugins: optional(array(string())),
  setting: SyncenvConfigObjectSchema,
});

export type EnvType = ".env" | ".envrc"
export type FileType = "file"
export type TemplateType = "template"

export type ConfigObjectType = EnvType | FileType | TemplateType

export type SyncenvConfigObject<Replacer> =
  | {
      type: EnvType;
      output_dir: string;
      file_name?: string;
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
  plugins?: string[]
  setting: Setting;
};

export type SyncenvConfig<Replacer = string> = SyncenvConfigInternal<
  SyncenvConfigObject<Replacer>[],
  Replacer
>;

export class ConfigParser {
  constructor() {}
  async config(): Promise<SyncenvConfig> {
    const explorer = cosmiconfig("syncenv");
    const configResult = await explorer.search();

    if (!configResult?.isEmpty) {
      throw Error("configFilePath does not exist.");
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
          ...v.replaces
        };
      }
      return v;
    });

    return validConfig as SyncenvConfig;
  }
}
