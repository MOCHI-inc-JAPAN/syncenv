import {SyncenvConfig} from './config-parser'
import { BaseReplacer, BaseReplacerConstructor } from './replacers/base-replacer';
import GcpSecretReplacer from './replacers/gcp-secret-replacer';
import DefaultReplacer from './replacers/default-replacer';

const BUILTIN_REPLACERS = [GcpSecretReplacer.pluginId, DefaultReplacer.pluginId] as const

type BuitinReplacers = typeof BUILTIN_REPLACERS[number]

const builtinReplacers = (str: BuitinReplacers) => {
  return {
    [GcpSecretReplacer.pluginId]: () => import('./replacers/gcp-secret-replacer'),
    [DefaultReplacer.pluginId]: () => import('./replacers/default-replacer'),
  }[str]
}

async function loadReplacer(str: string) {
  if(BUILTIN_REPLACERS.includes(str as BuitinReplacers)) {
    return await builtinReplacers(str as BuitinReplacers)()
  }
  return await import(str)
}

export async function resolveReplacers(arg: SyncenvConfig): Promise<Record<string, BaseReplacer>> {
  const replacers: Record<string, BaseReplacer> = {}
  const plugins: string[] = [...new Set([DefaultReplacer.pluginId as string].concat(arg.plugins || []))]
  for(const plugin of plugins){
    const Replacer: BaseReplacerConstructor = await loadReplacer(plugin)
    replacers[Replacer.pluginId] = new Replacer()
  }
  return replacers
}
