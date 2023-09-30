import { cosmiconfig } from "cosmiconfig";
import {
  record,
  object,
  union,
  string,
  literal,
  optional,
  parse,
} from "valibot";

export type ProviderType = "gcp";
export type Placeholder = `$\{${string}\}`;
export type ReplacerTemplate = `__${ProviderType}:${string}__`;

type EnvValue = {
  [key: string]: string | Placeholder;
};

type ReplacerValue = {
  [key: string]: string | ReplacerTemplate;
};

const ReplacerSchema = union([string(), record(string())]);
const SyncenvConfigObjectSchema = union([
  object({
    type: union([literal(".env"), literal(".envrc")]),
    output_dir: string(),
    file_name: optional(string()),
    env: string(),
    replacer: optional(ReplacerSchema),
  }),
  object({
    type: literal("file"),
    output_path: string(),
    placeholder: string(),
    replacer: optional(ReplacerSchema),
  }),
  object({
    type: literal("template"),
    input_path: string(),
    output_path: string(),
    replacer: optional(ReplacerSchema),
  }),
]);

const SyncenvConfigSchema = object({
  replacer: optional(ReplacerSchema),
  setting: SyncenvConfigObjectSchema,
});

export type SyncenvConfigObject =
  | {
      type: ".env" | ".envrc";
      output_dir: string;
      file_name?: string;
      env: EnvValue;
      replacer?: ProviderType | ReplacerValue;
    }
  | {
      type: "file";
      output_path: string;
      placeholder: string;
      replacer?: ProviderType | ReplacerValue;
    }
  | {
      type: "template";
      input_path: string;
      output_path: string;
      replacer?: ProviderType | ReplacerValue;
    };

type SyncenvConfigInternal<
  Setting = SyncenvConfigObject | SyncenvConfigObject[]
> = {
  replacer?: ProviderType | ReplacerValue;
  setting: Setting;
};

export type SyncenvConfig = SyncenvConfigInternal<SyncenvConfigObject[]>;

export class ConfigParser {
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

    validConfig.setting = (validConfig as SyncenvConfig).setting.map((v) => {
      if (!v.replacer && validConfig.replacer) {
        v.replacer = validConfig.replacer;
      }
      return v;
    });

    return validConfig as SyncenvConfig;
  }
}
