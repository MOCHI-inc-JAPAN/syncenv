import { SyncenvConfig } from "./config-parser";
import {
  PipeInterface,
  PluginInterface,
  PluginInterfaceConstructor,
} from "./plugins/plugin-interface";
import GcpSecretPlugin from "./plugins/gcp-secret-plugin";
import DefaultPlugin from "./plugins/default-plugin";
import { resolve as resolvePath } from "node:path";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat } from "node:fs/promises";
import { resolveOutputPath } from "./pathResolver";
import { t as tart, Pack } from "tar";
import concat from "concat-stream";

const CACHE_KEY_FILE_NAME = "cache-key.json";
const CACHE_FILE_NAME = "synenv-cache.tar.gz";

export class CacheResolver {
  cacheKeyPaths: Record<string, string> | undefined;
  cacheFiles: Promise<Record<string, Buffer>> | undefined;
  private cacheGzipPack: Pack;

  constructor() {
    this.cacheGzipPack = new Pack({
      gzip: true,
    })
  }

  async restoreCache(
    cacheDir: string,
    outputPath: string,
    options?: { cacheKeyPath?: string }
  ): Promise<[outPath: string | undefined, contents: Buffer | undefined]> {
    const cacheDirExists = (await stat(cacheDir)).isDirectory();
    if (!cacheDirExists) {
      return [undefined, undefined];
    }

    if (!this.cacheFiles) {
      this.cacheFiles = new Promise((resolve, reject) => {
        const pipePromises: Promise<[string, Buffer]>[] = [];
        createReadStream(resolvePath(cacheDir, CACHE_FILE_NAME))
          .pipe(tart())
          .on("entry", (entry) => {
            const task = new Promise<[string, Buffer]>((resolve, reject) => {
              if (entry.type === "File") {
                entry.pipe(
                  concat((data) => {
                    resolve([entry.path, data]);
                  })
                );
              }
            });
            pipePromises.push(task);
          })
          .on("end", async () => {
            resolve(Object.fromEntries(await Promise.all(pipePromises)));
          });
      });
    }

    return this.resolveCacheKeyPath(cacheDir, outputPath);
  }

  async storeCache(
    cacheDir: string,
    outputPath: string,
    contents: string | ArrayBufferLike | Buffer
  ): Promise<[outPath: string, contents: string | ArrayBufferLike]> {
    const cacheDirExists = (await stat(cacheDir)).isDirectory();
    if (!cacheDirExists) {
      await mkdir(cacheDir, { recursive: true });
    }

    this.cacheGzipPack.add(
      this.restoreFileKey(outputPath)
    ).pipe(


    )

    entry(
      { name: this.restoreFileKey(outputPath) },
      contents
    );
    resolveOutputPath(arg);
    return this.plugins;
  }

  async archiveCacheFile(
    cacheDir: string,
    outputPath: string,
    contents: string | ArrayBufferLike,
    options?: { cacheKeyPath?: string }
  ): Promise<[outPath: string, contents: string | ArrayBufferLike]> {
    const cacheDirExists = (await stat(cacheDir)).isDirectory();
    if (!cacheDirExists) {
      await mkdir(cacheDir, { recursive: true });
    }
    const archivePath = createWriteStream(
      resolvePath(cacheDir, CACHE_FILE_NAME)
    );
    this.cacheGzipPack.pipe(gstream).pipe;
    resolveOutputPath(arg);
    return this.plugins;
  }

  private restoreFileKey(outputPath: string) {
    return outputPath.replaceAll("/", "-").replaceAll(".", "-dot-");
  }

  private async resolveCacheKeyPath(
    cacheDir: string,
    outputPath: string
  ): Promise<[outPath: string | undefined, contents: Buffer | undefined]> {
    if (!this.cacheKeyPaths) {
      this.cacheKeyPaths = await import(
        resolvePath(cacheDir, CACHE_KEY_FILE_NAME)
      );
    }
    const cacheFiles = await this.cacheFiles;
    if (cacheFiles) {
      return [outputPath, cacheFiles[this.cacheKeyPaths![outputPath]]];
    }
    return [undefined, undefined];
  }
}
