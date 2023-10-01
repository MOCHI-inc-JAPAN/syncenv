import { ConfigParser, SyncenvConfig } from "./config-parser";
import { resolveReplacers } from "./config-resolver";
import { BaseReplacer } from "./replacers/base-replacer";
import DefaultReplacer from "./replacers/default-replacer";
import processors from "./processors";

export class Syncenv {

  config!: Promise<SyncenvConfig>

  constructor() {
    const configParser = new ConfigParser();
    this.config = configParser.config();
  }

  private replacerInputs(
    replaces: Record<string, string> | undefined, defaultReplacerKey: string = DefaultReplacer.pluginId
  ): Record<string, Record<string, string>> {
    const replacersMap: Record<string, Record<string, string>> = {}
    if(!replaces) {
      return replacersMap
    }
    Object.entries(replaces).forEach(([key,value]) => {
      const parsedMacher = value.match(/^@(.*):(.*)$/)
      if(parsedMacher?.[0] && parsedMacher?.[1]) {
        const [replacerKey, requestId] = parsedMacher
        const replacersMapValue  = replacersMap[replacerKey] || {}
        replacersMapValue[key] = requestId
        replacersMap[replacerKey] = replacersMapValue
      } else {
        const replacerKey = defaultReplacerKey
        const replacersMapValue  = replacersMap[replacerKey] || {}
        replacersMapValue[key] = value
        replacersMap[replacerKey] = replacersMapValue
      }
    })
    return replacersMap
  }

  private async createPlaceholderMap (replacers: Record<string, BaseReplacer>,replacerInputs: Record<string, Record<string, string>>): Promise<Record<string, string>> {
    let placeholderMap: Record<string, string> = {}
    for(const [replacerKey, replaceStringMap] of Object.entries(replacerInputs)) {
      placeholderMap = {
        ...placeholderMap,
        ...await replacers[replacerKey].fetchValues(replaceStringMap)
      }
    }
    return placeholderMap
  }

  async run() {
    const config = await this.config
    const replacers = await resolveReplacers(config)
    const setting = config.setting
    const queues: Promise<any>[] = []
    for(const params of setting) {
      const replacerInputs = this.replacerInputs(params.replaces, params.defaultReplacer)
      const placeholderMapping = await this.createPlaceholderMap(replacers, replacerInputs)
      const processor = new processors[params.type](placeholderMapping, params)
      queues.push(processor.process())
    };
    await Promise.all(queues)
  }
}
