import {
  ConfigParser,
  PipeOptions,
  type IConfigParser,
  type SyncenvConfig,
} from "./config-parser";
import { ConfigResolver, type IConfigResolver } from "./config-resolver";
import { PluginInterface as Plugin } from "./plugins/plugin-interface";
import { BaseProcessor } from "./processors/base-processor";
import DefaultPlugin from "./plugins/default-plugin";
import processors from "./processors";
import { parseMatch } from "./parseSetting";
import { resolveOutputPath } from "./pathResolver";
import { existsSync } from "node:fs";

type ParseOptionResult = {
  exit?: boolean;
  configPath?: string;
  force?: boolean;
};

export class Syncenv {
  private config: Promise<SyncenvConfig>;
  private configResolver: IConfigResolver;
  private force: boolean = false;

  constructor(
    params?: {
      configPath?: string;
      config?: SyncenvConfig;
      force?: boolean;
    },
    interfaces?: {
      configParser: IConfigParser;
      configResolver: IConfigResolver;
    }
  ) {
    const {
      configParser = new ConfigParser(),
      configResolver = new ConfigResolver(),
    } = interfaces || {};
    this.config = Promise.resolve(
      params?.config || configParser.config(params?.configPath)
    );
    this.configResolver = configResolver;
    this.force = params?.force || false;
  }

  private replacerInputs(
    replaces: Record<string, string | number | boolean> | undefined,
    defaultReplacerKey: string = DefaultPlugin.pluginId
  ): Record<string, Record<string, string | number | boolean>> {
    const replacersMap: Record<
      string,
      Record<string, string | number | boolean>
    > = {};
    if (!replaces) {
      return replacersMap;
    }
    Object.entries(replaces).forEach(([key, value]) => {
      const parseMatchResult = typeof value === "string" && parseMatch(value);
      if (parseMatchResult) {
        const [_, replacerKey, requestId] = parseMatchResult;
        const replacersMapValue = replacersMap[replacerKey] || {};
        replacersMapValue[key] = requestId;
        replacersMap[replacerKey] = replacersMapValue;
      } else {
        const replacerKey = defaultReplacerKey;
        const replacersMapValue = replacersMap[replacerKey] || {};
        replacersMapValue[key] = value;
        replacersMap[replacerKey] = replacersMapValue;
      }
    });
    return replacersMap;
  }

  private async createPlaceholderMap(
    replacers: Record<string, Plugin>,
    replacerInputs: Record<string, Record<string, string | number | boolean>>,
    pipeOptions?: PipeOptions
  ): Promise<Record<string, string | number | boolean>> {
    let placeholderMap: Record<string, string | number | boolean> = {};
    for (const [replacerKey, replaceStringMap] of Object.entries(
      replacerInputs
    )) {
      const replacer = replacers[replacerKey];
      const addition = await replacer.fetchValues(
        replaceStringMap,
        await this.config
      );
      placeholderMap = {
        ...placeholderMap,
        ...addition,
      };
    }
    if (pipeOptions) {
      placeholderMap = await this.resolvePipes(placeholderMap, pipeOptions);
    }
    return placeholderMap;
  }

  private async resolvePipes(
    placeholderMap: Record<string, string | number | boolean>,
    pipeOptions: PipeOptions
  ): Promise<Record<string, string | number | boolean>> {
    const pipes = await this.configResolver.loadPipes(await this.config);
    for (let [placeholder, pipeOptionValue] of Object.entries(pipeOptions)) {
      const pipeOptionValues =
        typeof pipeOptionValue === "string"
          ? this.parseStringPipeOptionValue(pipeOptionValue)
          : pipeOptionValue.map((v) => v.trim());
      if (placeholderMap[placeholder]) {
        for (const pipeOptionValue of pipeOptionValues) {
          const [pipeId, pipeArgs] = this.parsePipeOptionValue(pipeOptionValue);
          const pipeFunction = pipes[pipeId];
          if (pipeFunction) {
            placeholderMap[placeholder] = pipeFunction(
              placeholderMap[placeholder],
              ...pipeArgs
            );
          } else {
            console.warn(`Pipe ${pipeId} is not found. Skip.`);
          }
        }
      }
    }
    return placeholderMap;
  }

  private parsePipeOptionValue(value: string): [string, string[]] {
    const [_, key, args] = value.match(/(\w+)\((.*)\)/) || [];
    if (key && args) {
      return [
        key,
        args.split(",").map((v) => {
          return v.trim().replace(/^(['"])(.*)(['"])$/, "$2");
        }),
      ];
    }
    return [value, []];
  }

  private parseStringPipeOptionValue(value: string) {
    return value.split("|").map((v) => v.trim());
  }

  static parseOptions(...options: string[]): ParseOptionResult {
    const range = Array.from(new Array(options.length)).map((_, i) => i);
    const finalConfig: ParseOptionResult = {};
    for (const index of range) {
      if (["-h", "--help"].includes(options[index])) {
        console.log(
          "syncenv: command line tools management environment values in files."
        );
        console.log(
          "  --config, -c <path>: arbitrary config path is not configured by cosmiconfig."
        );
        return {
          exit: true,
        };
      }
      if (["-c", "--config"].some((flag) => options[index].startsWith(flag))) {
        const parsedConfigFlag = options[index].split("=");
        if (parsedConfigFlag.length > 1) {
          finalConfig["configPath"] = parsedConfigFlag.pop();
        } else if (options[index + 1] && !options[index + 1].startsWith("-")) {
          finalConfig["configPath"] = options[index + 1];
        } else {
          throw Error(
            "-c, --config option is spcified with invalid parameters"
          );
        }
      }
      if (["-f", "--force"].includes(options[index])) {
        finalConfig["force"] = true;
      }
    }

    return finalConfig;
  }

  async run() {
    const config = await this.config;
    const replacers = await this.configResolver.resolvePlugins(config);
    const setting = config.setting;
    const queues: Promise<any>[] = [];
    for (const params of setting) {
      if (config.cache && !this.force) {
        const outPath = resolveOutputPath(params);
        if (existsSync(outPath)) {
          console.info(`${outPath} already exists. skip.`);
          continue;
        }
      }
      const replacerInputs = this.replacerInputs(
        params.replaces,
        params.defaultReplacer
      );
      const placeholderMapping = await this.createPlaceholderMap(
        replacers,
        replacerInputs,
        params.pipes
      );
      const processorClass = processors[params.type];
      const processor = new processorClass(placeholderMapping, params);
      queues.push(processor.process());
    }
    await Promise.all(queues);
  }
}

function run(...options: string[]) {
  const { configPath, exit, force } = Syncenv.parseOptions(...options);
  if (exit) return;
  return new Syncenv({ configPath, force }).run();
}

export {
  Plugin,
  SyncenvConfig,
  IConfigResolver,
  IConfigParser,
  BaseProcessor,
  run,
};
