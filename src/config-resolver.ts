import { SyncenvConfig } from "./config-parser";
import {
  BaseReplacer,
  BaseReplacerConstructor,
} from "./replacers/base-replacer";
import GcpSecretReplacer from "./replacers/gcp-secret-replacer";
import DefaultReplacer from "./replacers/default-replacer";
import {resolve} from "node:path";

const BUILTIN_REPLACERS = [
  GcpSecretReplacer.pluginId,
  DefaultReplacer.pluginId,
] as const;

type BuitinReplacers = (typeof BUILTIN_REPLACERS)[number];

export interface IConfigResolver {
  resolveReplacers(arg: SyncenvConfig): Promise<Record<string, BaseReplacer>>;
}

export class ConfigResolver {
  private builtinReplacers(str: BuitinReplacers) {
    return {
      [GcpSecretReplacer.pluginId]: () =>
        import("./replacers/gcp-secret-replacer"),
      [DefaultReplacer.pluginId]: () => import("./replacers/default-replacer"),
    }[str];
  }

  private async loadReplacer(str: string) {
    if (BUILTIN_REPLACERS.includes(str as BuitinReplacers)) {
      return await this.builtinReplacers(str as BuitinReplacers)();
    }
    const importPath = str.startsWith('.') ? resolve(process.cwd(), str) : str
    return await import(importPath);
  }

  async resolveReplacers(
    arg: SyncenvConfig
  ): Promise<Record<string, BaseReplacer>> {
    const replacers: Record<string, BaseReplacer> = {};
    const plugins: string[] = [
      ...new Set(
        [DefaultReplacer.pluginId as string].concat(arg.plugins || [])
      ),
    ];
    for (const plugin of plugins) {
      const Replacer: BaseReplacerConstructor = (await this.loadReplacer(plugin)).default;
      replacers[Replacer.pluginId] = new Replacer();
    }
    return replacers;
  }
}
