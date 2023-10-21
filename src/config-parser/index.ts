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
  boolean,
  number,
  coerce,
  Output,
} from "valibot";
import { resolve } from "node:path";
import { parseMatch } from "../parseSetting";

export type ProviderType = "gcp";
export type Placeholder = `$\{${string}\}` | `$${string}`;
export type ReplacerTemplate = `__${ProviderType}:${string}__`;

type EnvValue = {
  [key: string]: boolean | number | string | Placeholder | ReplacerTemplate;
};

type ReplacerValue = {
  [key: string]: boolean | number | string | ReplacerTemplate;
};

const AvailableEnvValueSchema = record(union([string(), boolean(), number()]));

const ReplacesSchema = record(union([string(), boolean(), number()]));

const PipeSchema = record(union([string(), array(string())]));

const SyncenvConfigObjectSchema = union([
  object({
    type: union([literal(".env"), literal(".envrc")]),
    output_dir: string(),
    filename: optional(string()),
    env: AvailableEnvValueSchema,
    replaces: optional(ReplacesSchema),
    pipes: optional(PipeSchema),
    quate: coerce(string(), (val) => (val as string) ?? '"'),
    defaultReducer: optional(string()),
  }),
  object({
    type: literal("file"),
    output_path: string(),
    placeholder: string(),
    replaces: optional(ReplacesSchema),
    pipes: optional(PipeSchema),
    defaultReducer: optional(string()),
  }),
  object({
    type: literal("template"),
    input_path: string(),
    output_path: string(),
    replaces: optional(ReplacesSchema),
    pipes: optional(PipeSchema),
    defaultReducer: optional(string()),
  }),
]);

const SyncenvConfigSchema = object({
  replaces: optional(ReplacesSchema),
  defaultReplacer: optional(string()),
  plugins: optional(array(string())),
  setting: union([SyncenvConfigObjectSchema, array(SyncenvConfigObjectSchema)]),
  cache: coerce(boolean(), (val) => (typeof val === "boolean" ? val : true)),
});

export type EnvType = ".env" | ".envrc";
export type FileType = "file";
export type TemplateType = "template";

export type ConfigObjectType = EnvType | FileType | TemplateType;

export type PipeOptions = Output<typeof PipeSchema>;

type EnvObject<Replacer> = {
  type: EnvType;
  output_dir: string;
  filename?: string;
  env: EnvValue;
  quate: string;
  replaces?: ReplacerValue;
  pipes?: PipeOptions;
  defaultReplacer?: Replacer;
};

type FileObject<Replacer> = {
  type: FileType;
  output_path: string;
  placeholder: string;
  replaces?: ReplacerValue;
  pipes?: PipeOptions;
  defaultReplacer?: Replacer;
};

type TemplateObject<Replacer> = {
  type: TemplateType;
  input_path: string;
  output_path: string;
  replaces?: ReplacerValue;
  pipes?: PipeOptions;
  defaultReplacer?: Replacer;
};

export type SyncenvConfigObject<Replacer> =
  | EnvObject<Replacer>
  | FileObject<Replacer>
  | TemplateObject<Replacer>;

type SyncenvConfigInternal<
  Setting = SyncenvConfigObject<string> | SyncenvConfigObject<string>[],
  DefaultPlugin = string
> = {
  replaces?: ReplacerValue;
  defaultReplacer?: DefaultPlugin;
  plugins?: string[];
  cache?: boolean;
  setting: Setting;
};

export type SyncenvConfig<Replacer = string> = SyncenvConfigInternal<
  SyncenvConfigObject<Replacer>[],
  Replacer
>;

export interface IConfigParser {
  config(configPath?: string): Promise<SyncenvConfig>;
}

function isEnvType<Replacer>(
  value: SyncenvConfigObject<Replacer>
): value is EnvObject<Replacer> {
  return value.type === ".env" || value.type === ".envrc";
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

    return this.parseConfig(configResult.config);
  }

  parseConfig(configFile: object): SyncenvConfig {
    const validConfig = parse(
      SyncenvConfigSchema,
      configFile
    ) as SyncenvConfigInternal;
    if (!Array.isArray(validConfig.setting)) {
      validConfig.setting = [validConfig.setting];
    }

    validConfig.setting = validConfig.setting.map((v) => {
      if (!v.defaultReplacer && validConfig.defaultReplacer) {
        v.defaultReplacer = validConfig.defaultReplacer;
      }
      if (isEnvType(v)) {
        for (const [key, value] of Object.entries(v.env)) {
          if (typeof value === "string") {
            if (parseMatch(value)) {
              v.env = {
                ...v.env,
                [key]: `$${key}`,
              };
              v.replaces = {
                ...v.replaces,
                [key]: value,
              };
            }
          }
        }
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
