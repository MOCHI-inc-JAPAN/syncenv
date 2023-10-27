import concat from "concat-stream";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, stat, writeFile, readFile} from "node:fs/promises";
import { resolve as resolvePath } from "node:path";
import { Pack, t as tart } from "tar";
import { resolveAbsolutePath, resolveOutputPath } from "./pathResolver";
import {randomBytes, createCipheriv, createDecipheriv} from "crypto";

const CACHE_KEY_FILE_NAME = "cache-key.json";
const CACHE_FILE_NAME = "synenv-cache.data";

type SecrectKey = {
  algorithm: string
  key: Buffer
  iv: Buffer
}

export class CacheResolver {
  cacheFiles: Promise<Record<string, Buffer>> | undefined;
  private cacheGzipPack: Pack;
  private secretKey: SecrectKey | undefined;

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
    const stats = await stat(cacheDir);
    if (!stats.isDirectory()) {
      return [undefined, undefined];
    }

    if (!this.cacheFiles) {
      const secretKey = await this.genOrReadSecretKey(cacheDir, options)
      const decipher = createDecipheriv(secretKey.algorithm, secretKey.key, secretKey.iv);
      this.cacheFiles = new Promise((resolve, reject) => {
        const pipePromises: Promise<[string, Buffer]>[] = [];
        createReadStream(resolvePath(cacheDir, CACHE_FILE_NAME))
          .pipe(tart())
          .pipe(decipher)
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

    return this.resolveCacheKeyPath(outputPath);
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

    // this.cacheGzipPack.add(
    //   this.fileKey(outputPath)
    // ).pipe(


    // )

    // entry(
    //   { name: this.fileKey(outputPath) },
    //   contents
    // );
    // resolveOutputPath(arg);
    // return this.plugins;
  }

  async archiveCacheFile(
    cacheDir: string,
    options?: { cacheKeyPath?: string }
  ): Promise<void> {
    const cacheDirExists = (await stat(cacheDir)).isDirectory();
    if (!cacheDirExists) {
      await mkdir(cacheDir, { recursive: true });
    }
    const archivePath = createWriteStream(
      resolvePath(cacheDir, CACHE_FILE_NAME)
    );

    const secretKey = await this.genOrReadSecretKey(cacheDir, options)
    const cipher = createCipheriv(secretKey.algorithm, secretKey.key, secretKey.iv);
    return new Promise((resolve, _)=> {
      this.cacheGzipPack.pipe(archivePath).pipe(cipher).on("finish", () => {
        resolve()
      })
    })
  }

  private async genOrReadSecretKey(cacheDir: string, options?: {cacheKeyPath?: string}): Promise<SecrectKey> {
    if(this.secretKey) return this.secretKey
    const cacheKeyPath: string = this.cacheKeyFilePath(cacheDir, options)
    const stats = await stat(cacheKeyPath)
    if(!stats.isFile()) {
      const algorithm = "aes-256-cbc";
      const key = randomBytes(32)
      const iv = randomBytes(16)
      this.secretKey = { algorithm, key, iv }
      await writeFile(cacheKeyPath, JSON.stringify({
        algorithm: this.secretKey.algorithm,
        key: this.secretKey.key.toString("hex"),
        iv: this.secretKey.iv.toString("hex"),
      }, null, 2))
      return this.secretKey
    }
    this.secretKey = await readFile(cacheKeyPath)
      .then((data) => JSON.parse(data.toString()))
      .then((data) => {
        return {
          algorithm: data.algorithm,
          key: Buffer.from(data.key, "hex"),
          iv: Buffer.from(data.iv, "hex"),
        }
      })
    return this.secretKey!
  }

  private fileKey(outputPath: string) {
    return outputPath.replaceAll("/", "-").replaceAll(".", "-dot-");
  }

  private cacheKeyFilePath(cacheDir: string, options?: {cacheKeyPath?: string}) {
    return options?.cacheKeyPath ? resolveAbsolutePath(options.cacheKeyPath) : resolvePath(cacheDir, CACHE_KEY_FILE_NAME)
  }

  private async resolveCacheKeyPath(
    outputPath: string
  ): Promise<[outPath: string | undefined, contents: Buffer | undefined]> {
    const cacheFiles = await this.cacheFiles;
    const cacheKey = this.fileKey(outputPath)
    if (cacheFiles && cacheKey) {
      return [outputPath, cacheFiles[cacheKey]];
    }
    return [undefined, undefined];
  }
}
