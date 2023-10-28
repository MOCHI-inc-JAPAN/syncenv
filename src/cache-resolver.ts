import concat from "concat-stream";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, writeFile, readFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";
import { Pack, t as tart } from "tar";
import { isDirectory, isFile, resolveAbsolutePath } from "./pathResolver";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { homedir } from "os";

const CACHE_KEY_FILE_NAME = "cache-key.json";
const CACHE_FILE_NAME = "synenv-cache.data";

export const DEFAULT_CACHE_DIR = resolvePath(homedir(), '.syncenv')
export const DEFAULT_CACHE_KEY_PATH = resolvePath(DEFAULT_CACHE_DIR, CACHE_KEY_FILE_NAME)

type SecrectKey = {
  algorithm: string;
  key: Buffer;
  iv: Buffer;
};

export class CacheResolver {
  cacheFiles: Promise<Record<string, Buffer>> | undefined;
  private cacheGzipPack: Pack;
  private secretKey: SecrectKey | undefined;
  config: { cacheDir: string } = { cacheDir: "" };

  constructor() {
    this.cacheGzipPack = new Pack({
      gzip: true,
    });
  }

  setCacheDir(cacheDir: string) {
    this.config.cacheDir = cacheDir
  }

  async restoreCache(
    outputPath: string,
    options?: { cache_key_path?: string }
  ): Promise<[outPath: string | undefined, contents: Buffer | undefined]> {
    const cacheDir = this.config.cacheDir
    const isDir = isDirectory(cacheDir)
    if (!isDir) {
      console.log('test')
      return [undefined, undefined];
    }

    if (!this.cacheFiles) {
      const secretKey = await this.genOrReadSecretKey(cacheDir, options);
      const decipher = createDecipheriv(
        secretKey.algorithm,
        secretKey.key,
        secretKey.iv
      );
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
    outputPath: string,
    contents: string | ArrayBufferLike | Buffer
  ): Promise<void> {
    const cacheDir = this.config.cacheDir
    const isDir = isDirectory(cacheDir)
    if (!isDir) {
      await mkdir(cacheDir, { recursive: true });
    }

    const pack = this.cacheGzipPack.add(this.fileKey(outputPath));

    pack.write(contents);
  }

  async archiveCacheFile(
    options?: { cache_key_path?: string }
  ): Promise<void> {
    const cacheDir = this.config.cacheDir
    const cacheDirExists = await isDirectory(cacheDir);
    if (!cacheDirExists) {
      await mkdir(cacheDir, { recursive: true });
    }
    const archivePath = createWriteStream(
      resolvePath(cacheDir, CACHE_FILE_NAME)
    );

    const secretKey = await this.genOrReadSecretKey(cacheDir, options);
    const cipher = createCipheriv(
      secretKey.algorithm,
      secretKey.key,
      secretKey.iv
    );
    return new Promise((resolve, _) => {
      this.cacheGzipPack
        .pipe(archivePath)
        .pipe(cipher)
        .on("finish", () => {
          resolve();
        });
    });
  }

  private async genOrReadSecretKey(
    cacheDir: string,
    options?: { cache_key_path?: string }
  ): Promise<SecrectKey> {
    if (this.secretKey) return this.secretKey;
    const cache_key_path: string = this.cacheKeyFilePath(cacheDir, options);
    const isfile = await isFile(cache_key_path);
    if (!isfile) {
      const algorithm = "aes-256-cbc";
      const key = randomBytes(32);
      const iv = randomBytes(16);
      this.secretKey = { algorithm, key, iv };
      await writeFile(
        cache_key_path,
        JSON.stringify(
          {
            algorithm: this.secretKey.algorithm,
            key: this.secretKey.key.toString("hex"),
            iv: this.secretKey.iv.toString("hex"),
          },
          null,
          2
        )
      );
      return this.secretKey;
    }
    this.secretKey = await readFile(cache_key_path)
      .then((data) => JSON.parse(data.toString()))
      .then((data) => {
        return {
          algorithm: data.algorithm,
          key: Buffer.from(data.key, "hex"),
          iv: Buffer.from(data.iv, "hex"),
        };
      });
    return this.secretKey!;
  }

  private fileKey(outputPath: string) {
    return outputPath.replaceAll("/", "-").replaceAll(".", "-dot-");
  }

  private cacheKeyFilePath(
    cacheDir: string,
    options?: { cache_key_path?: string }
  ) {
    return options?.cache_key_path
      ? resolveAbsolutePath(options.cache_key_path)
      : resolvePath(cacheDir, CACHE_KEY_FILE_NAME);
  }

  private async resolveCacheKeyPath(
    outputPath: string
  ): Promise<[outPath: string | undefined, contents: Buffer | undefined]> {
    const cacheFiles = await this.cacheFiles;
    const cacheKey = this.fileKey(outputPath);
    if (cacheFiles && cacheKey) {
      return [outputPath, cacheFiles[cacheKey]];
    }
    return [undefined, undefined];
  }
}
