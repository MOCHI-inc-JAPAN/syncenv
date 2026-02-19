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
import { isFile, resolveAbsolutePath, resolveOutputPath } from "./pathResolver";
import { CacheResolver } from "./cache-resolver";
import { writeFile } from "./writeFile";
import { readFileSync } from "node:fs";
import { EOL } from "node:os";
import path from "node:path";

type ParseOptionResult = {
  exit?: boolean;
  configPath?: string;
  force?: boolean;
  info?: 'target-only' | 'all';
};

export class Syncenv {
  private config: Promise<SyncenvConfig>;
  private configResolver: IConfigResolver;
  private cacheResolver: CacheResolver;
  private force: boolean = false;

  constructor(
    params?: {
      configPath?: string;
      config?: SyncenvConfig;
      force?: boolean;
    },
    interfaces?: {
      configParser?: IConfigParser;
      configResolver?: IConfigResolver;
      cacheResolver?: CacheResolver;
    }
  ) {
    const {
      configParser = new ConfigParser(),
      configResolver = new ConfigResolver(),
      cacheResolver = new CacheResolver(),
    } = interfaces || {};
    this.config = Promise.resolve(
      params?.config || configParser.config(params?.configPath)
    );
    this.configResolver = configResolver;
    this.cacheResolver = cacheResolver;
    this.force = params?.force || false;
  }

  private replacerInputs(
    replaces: Record<string, string | number | boolean> | undefined,
    default_replacerKey: string = DefaultPlugin.pluginId
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
        const replacerKey = default_replacerKey;
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
        console.info(
          "syncenv: command line tools management environment values in files."
        );
        console.info(
          "  --config, -c <path>: arbitrary config path is not configured by cosmiconfig."
        );
        console.info(
          "  --info, -i: show previously applied internal configuration."
        );
        console.info(
          "  --target-only, -t: last applied target."
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

      if (["-i", "--info"].includes(options[index])) {
        finalConfig["info"] = 'all';
        if (!finalConfig["configPath"]) {
          finalConfig["configPath"] = Syncenv.getCurrentEnvConfigPath();
        }
      }

      if (["-t", "--target-only"].includes(options[index])) {
        finalConfig["info"] = 'target-only';
        if (!finalConfig["configPath"]) {
          finalConfig["configPath"] = Syncenv.getCurrentEnvConfigPath();
        }
      }
    }

    return finalConfig;
  }

  static getCurrentEnvConfigPath(workDir?: string): string {
    const fileContent = readFileSync(path.join(workDir || process.cwd(),'.syncenv','.config'))
    const configFile = fileContent.toString().split(EOL).find((v) => v.startsWith('config_file='))
    if(!configFile) {
       throw new Error('No config file found in the current environment.')
    }
    return path.resolve(workDir || process.cwd(), configFile.split('=')[1])
  }

  private async createApplyCache(config: SyncenvConfig) {
    if(config.work_dir) {
      const internalConfigPath = `${config.work_dir}/.syncenv/.config`
      await writeFile(
        resolveAbsolutePath(
          internalConfigPath,
          config.work_dir
        ),
        [
          `target=${config.target || config.work_file}`,
          `config_file=${config.work_file}`,
          config.cache && `cache_dir=${config.cache}`,
        ].filter(Boolean).join(EOL)
      )
    }
  }

  async infoApplyCache(fmtOption: 'all' | 'target-only' = 'all') {
    const config = await this.config;
    if(config.work_dir) {
      const internalConfigPath = `${config.work_dir}/.syncenv/.config`
      if(await isFile(internalConfigPath)) {
        const infoFile = readFileSync(
          resolveAbsolutePath(
            internalConfigPath,
            config.work_dir
          )
        )

        if(fmtOption === 'all') {
          console.log(infoFile.toString())
        }

        if(fmtOption === 'target-only') {
          const target = infoFile.toString().split(EOL).find((v) => v.startsWith('target='))
          console.log(target?.split('=')[1])
        }
      }
    }
  }

  async run() {
    const config = await this.config;
    const replacers = await this.configResolver.resolvePlugins(config);
    const setting = config.setting;
    const queues: Promise<any>[] = [];
    if (config.cache) {
      this.cacheResolver.setCacheConfig({
        cacheDir: config.cache,
        cacheId: config.cache_id,
        baseDir: config.work_dir
      });
    }
    for (const params of setting) {
      if (config.cache && !this.force) {
        const cacheResults = await Promise.all(
          resolveOutputPath(params, config.work_dir).map((outPath) =>
            this.cacheResolver.restoreCache(outPath, config)
          )
        );
        if (cacheResults.every(([outPath, contents]) => outPath && contents)) {
          cacheResults.forEach(([outPath, contents]) => {
            writeFile(outPath!, contents!);
            console.info(`${outPath} has used cache.`);
          });
          continue;
        }
      }
      const replacerInputs = this.replacerInputs(
        params.replaces,
        params.default_replacer
      );
      const placeholderMapping = await this.createPlaceholderMap(
        replacers,
        replacerInputs,
        params.pipes
      );
      const processorClass = processors[params.type];
      const processor = new processorClass(
        placeholderMapping,
        params,
        this.cacheResolver
      );
      queues.push(processor.process());
    }
    await Promise.all(queues);
    if (config.cache) {
      await this.cacheResolver.archiveCacheFile(config);
    }

    await this.createApplyCache(config)
  }
}

function run(...options: string[]) {
  const { configPath, exit, force, info } = Syncenv.parseOptions(...options);
  if (exit) return;
  const syncenv = new Syncenv({ configPath, force })
  if(info) {
    return syncenv.infoApplyCache(info);
  }
  return syncenv.run();
}

export {
  Plugin,
  SyncenvConfig,
  IConfigResolver,
  IConfigParser,
  BaseProcessor,
  run,
};
