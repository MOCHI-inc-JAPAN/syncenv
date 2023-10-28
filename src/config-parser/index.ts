import { cosmiconfig } from "cosmiconfig";
import { resolve } from "node:path";
import {
  Output,
  array,
  boolean,
  coerce,
  literal,
  number,
  object,
  optional,
  parse,
  record,
  string,
  transform,
  union,
} from "valibot";
import { DEFAULT_CACHE_DIR, DEFAULT_CACHE_KEY_PATH } from "../cache-resolver";
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
    default_replacer: optional(string()),
  }),
  object({
    type: literal("file"),
    output_path: string(),
    placeholder: optional(string()),
    replaces: transform(optional(union([ReplacesSchema, string()])), (val) =>
      typeof val === "string" ? { "@@content": val } : val
    ),
    pipes: transform(
      optional(union([PipeSchema, string(), array(string())])),
      (val) =>
        typeof val === "string" || Array.isArray(val)
          ? { "@@content": val }
          : val
    ),
    default_replacer: optional(string()),
  }),
  object({
    type: literal("template"),
    input_path: string(),
    output_path: string(),
    replaces: optional(ReplacesSchema),
    pipes: optional(PipeSchema),
    default_replacer: optional(string()),
  }),
]);

const SyncenvConfigSchema = object({
  replaces: optional(ReplacesSchema),
  default_replacer: optional(string()),
  plugins: optional(array(string())),
  setting: union([SyncenvConfigObjectSchema, array(SyncenvConfigObjectSchema)]),
  cache: transform(
    optional(
      union(
        [boolean(), string()]
      )
    ),
    (val) => {
      if(!val) {
        return undefined
      } else {
        return val === true ? DEFAULT_CACHE_DIR : val
      }
    }
  ),
  cache_key_path: transform(
    optional(
      string()
    ),
    (val) => {
      if(!val) {
        return undefined
      } else {
        return  val || DEFAULT_CACHE_KEY_PATH
      }
    }
  )
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
  default_replacer?: Replacer;
};

type FileObject<Replacer> = {
  type: FileType;
  output_path: string;
  placeholder?: string;
  replaces?: ReplacerValue;
  pipes?: PipeOptions;
  default_replacer?: Replacer;
};

type TemplateObject<Replacer> = {
  type: TemplateType;
  input_path: string;
  output_path: string;
  replaces?: ReplacerValue;
  pipes?: PipeOptions;
  default_replacer?: Replacer;
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
  default_replacer?: DefaultPlugin;
  plugins?: string[];
  cache?: string;
  cache_key_path: string
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

function isFileType<Replacer>(
  value: SyncenvConfigObject<Replacer>
): value is FileObject<Replacer> {
  return value.type === "file";
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
      if (!v.default_replacer && validConfig.default_replacer) {
        v.default_replacer = validConfig.default_replacer;
      }
      if (isFileType(v)) {
        if (!v.placeholder && v.replaces && !v.replaces["@@content"]) {
          throw new Error(
            `The replaces property must be string without placeholder.`
          );
        }
        if (!v.placeholder && v.pipes && !v.pipes["@@content"]) {
          throw new Error(
            `The pipes property must be string or string[] without placeholder.`
          );
        }
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
