import { SyncenvConfig } from "./config-parser";
import {
  PipeInterface,
  PluginInterface,
  PluginInterfaceConstructor,
} from "./plugins/plugin-interface";
import GcpSecretPlugin from "./plugins/gcp-secret-plugin";
import DefaultPlugin from "./plugins/default-plugin";
import { resolve } from "node:path";

const BUILTIN_REPLACERS = [
  GcpSecretPlugin.pluginId,
  DefaultPlugin.pluginId,
] as const;

type BuitinReplacers = (typeof BUILTIN_REPLACERS)[number];

export interface IConfigResolver {
  resolvePlugins(arg: SyncenvConfig): Promise<Record<string, PluginInterface>>;
  loadPipes(arg: SyncenvConfig): Promise<Record<string, PipeInterface["pipe"]>>;
}

export class ConfigResolver {
  private plugins: Record<string, PluginInterface> | undefined;

  private builtinPlugins(str: BuitinReplacers) {
    return {
      [GcpSecretPlugin.pluginId]: () => import("./plugins/gcp-secret-plugin"),
      [DefaultPlugin.pluginId]: () => import("./plugins/default-plugin"),
    }[str];
  }

  private async loadPlugin(str: string, work_dir: string) {
    if (BUILTIN_REPLACERS.includes(str as BuitinReplacers)) {
      return await this.builtinPlugins(str as BuitinReplacers)();
    }
    const importPath = str.startsWith(".") ? resolve(work_dir, str) : str;
    return await import(importPath);
  }

  async resolvePlugins(
    arg: SyncenvConfig
  ): Promise<Record<string, PluginInterface>> {
    if (this.plugins) return this.plugins;
    this.plugins = {};
    const plugins: string[] = [
      ...new Set([DefaultPlugin.pluginId as string].concat(arg.plugins || [])),
    ];
    for (const plugin of plugins) {
      const LoadedPlugin: PluginInterfaceConstructor = (
        await this.loadPlugin(plugin, arg.work_dir)
      ).default;
      this.plugins[LoadedPlugin.pluginId] = new LoadedPlugin();
    }
    return this.plugins;
  }

  async loadPipes(
    arg: SyncenvConfig
  ): Promise<Record<string, PipeInterface["pipe"]>> {
    this.plugins = await this.resolvePlugins(arg);
    return Object.values(this.plugins).reduce((current, plugin) => {
      plugin.loadPipes().map((pipe) => {
        current[pipe.pipeId] = pipe.pipe;
      });
      return current;
    }, {} as Record<string, PipeInterface["pipe"]>);
  }
}
