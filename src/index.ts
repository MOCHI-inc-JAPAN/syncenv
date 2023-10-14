import {
  ConfigParser,
  type IConfigParser,
  type SyncenvConfig,
} from "./config-parser";
import { ConfigResolver, type IConfigResolver } from "./config-resolver";
import { BaseReplacer } from "./replacers/base-replacer";
import { BaseProcessor } from "./processors/base-processor";
import DefaultReplacer from "./replacers/default-replacer";
import processors from "./processors";
import { parseMatch } from "./parseSetting";

export class Syncenv {
  constructor(
    private configParser: IConfigParser = new ConfigParser(),
    private configResolver: IConfigResolver = new ConfigResolver()
  ) {}

  private replacerInputs(
    replaces: Record<string, string | number | boolean> | undefined,
    defaultReplacerKey: string = DefaultReplacer.pluginId
  ): Record<string, Record<string, string | number | boolean>> {
    const replacersMap: Record<string, Record<string, string | number | boolean>> = {};
    if (!replaces) {
      return replacersMap;
    }
    Object.entries(replaces).forEach(([key, value]) => {
      const parseMatchResult = typeof value === 'string' && parseMatch(value);
      if(parseMatchResult) {
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
    replacers: Record<string, BaseReplacer>,
    replacerInputs: Record<string, Record<string, string | number | boolean>>
  ): Promise<Record<string, string | number | boolean>> {
    let placeholderMap: Record<string, string | number | boolean> = {};
    for (const [replacerKey, replaceStringMap] of Object.entries(
      replacerInputs
    )) {
      const replacer = replacers[replacerKey];
      const addition = await replacer.fetchValues(replaceStringMap);
      placeholderMap = {
        ...placeholderMap,
        ...addition,
      };
    }
    return placeholderMap;
  }

  private parseOptions(...options: string[]): {
    exit?: boolean;
    configPath?: string;
  } {
    const range = Array.from(new Array(options.length)).map((_, i) => i);
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
          return {
            configPath: parsedConfigFlag.pop(),
          };
        }

        if (options[index + 1]) {
          return {
            configPath: options[index + 1],
          };
        }
        throw Error("-c, --config option is spcified with invalid parameters");
      }
    }

    return {};
  }

  async run(...options: string[]) {
    const { configPath, exit } = this.parseOptions(...options);
    if (exit) return;
    const config = await this.configParser.config(configPath);
    const replacers = await this.configResolver.resolveReplacers(config);
    const setting = config.setting;
    const queues: Promise<any>[] = [];
    for (const params of setting) {
      const replacerInputs = this.replacerInputs(
        params.replaces,
        params.defaultReplacer
      );
      const placeholderMapping = await this.createPlaceholderMap(
        replacers,
        replacerInputs
      );
      const processorClass = processors[params.type];
      const processor = new processorClass(placeholderMapping, params);
      queues.push(processor.process());
    }
    await Promise.all(queues);
  }
}

export {
  BaseReplacer,
  SyncenvConfig,
  IConfigResolver,
  IConfigParser,
  BaseProcessor,
};

