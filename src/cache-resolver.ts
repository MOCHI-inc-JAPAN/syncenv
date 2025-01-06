import concat from "concat-stream";
import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";
import { createGzip } from "node:zlib";
import { homedir } from "os";
import { t as tart } from "tar";
import { Pack, pack } from "tar-stream";
import {
  isDirectory,
  isFile,
  isFileSync,
  resolveAbsolutePath,
} from "./pathResolver";
import { writeFile } from "./writeFile";

const CACHE_KEY_FILE_NAME = "cache-key.json";

export const DEFAULT_CACHE_DIR = resolvePath(homedir(), ".syncenv");
export const DEFAULT_CACHE_KEY_PATH = resolvePath(
  DEFAULT_CACHE_DIR,
  CACHE_KEY_FILE_NAME
);

type SecrectKey = {
  algorithm: string;
  key: Buffer;
  iv: Buffer;
};

type CacheConfig = { cacheDir: string; cacheId: string, baseDir: string };

export class CacheResolver {
  private cacheGzipPack: Pack;
  private secretKey: SecrectKey | undefined;
  cacheFiles: Record<string, Buffer> | undefined;
  config: CacheConfig = { cacheDir: "", cacheId: "", baseDir: "" };

  constructor() {
    this.cacheGzipPack = pack();
  }

  setCacheConfig(cacheConfig: Partial<CacheConfig>) {
    this.config = {
      ...this.config,
      ...cacheConfig,
      baseDir: cacheConfig.baseDir || this.config.baseDir,
    };
  }

  async restoreCache(
    outputPath: string,
    options?: { cache_key_path?: string }
  ): Promise<[outPath: string | undefined, contents: Buffer | undefined]> {
    const cacheDir = this.config.cacheDir;
    const isDir = isDirectory(cacheDir);
    if (!isDir) {
      return [undefined, undefined];
    }

    if (!this.cacheFiles) {
      const secretKey = await this.genOrReadSecretKey(cacheDir, options);
      const cacheFilePath = resolvePath(cacheDir, this.cacheFileName());
      const isfile = isFileSync(cacheFilePath);

      if (isfile) {
        const promises = new Promise<[string, Buffer][]>((resolve, reject) => {
          const pipePromises: [string, Buffer][] = [];

          const decipher = createDecipheriv(
            secretKey.algorithm,
            secretKey.key,
            secretKey.iv
          );

          const tarPipe = createReadStream(cacheFilePath)
            .pipe(decipher)
            .on("error", (err) => {
              reject(err);
            })
            .pipe(tart());

          tarPipe
            .on("entry", (entry) => {
              if (entry.type === "File") {
                entry.pipe(
                  concat((data) => {
                    pipePromises.push([entry.path, data]);
                    this.cacheGzipPack.entry(
                      { name: entry.path },
                      data as Buffer
                    );
                  })
                );
              }
            })
            .on("end", () => {
              resolve(pipePromises);
            });
        });

        const cacheFiles = await promises;

        this.cacheFiles = Object.fromEntries(cacheFiles);
      }
    }

    return this.resolveCacheKeyPath(outputPath);
  }

  async storeCache(
    outputPath: string,
    contents: string | ArrayBufferLike | Buffer
  ): Promise<void> {
    const cacheDir = this.config.cacheDir;
    if (!cacheDir) {
      return;
    }

    const isDir = isDirectory(cacheDir);
    if (!isDir) {
      await mkdir(cacheDir, { recursive: true });
    }

    this.cacheGzipPack.entry(
      { name: this.fileKey(outputPath) },
      contents as Buffer
    );
  }

  async archiveCacheFile(options?: { cache_key_path?: string }): Promise<void> {
    const cacheDir = this.config.cacheDir;
    const cacheDirExists = await isDirectory(cacheDir);
    if (!cacheDirExists) {
      await mkdir(cacheDir, { recursive: true });
    }

    const secretKey = await this.genOrReadSecretKey(cacheDir, options);
    const cipher = createCipheriv(
      secretKey.algorithm,
      secretKey.key,
      secretKey.iv
    );
    await new Promise((resolve, reject) => {
      const archiveFileWriteStream = createWriteStream(
        resolvePath(cacheDir, this.cacheFileName())
      );

      const end = this.cacheGzipPack
        .pipe(createGzip())
        .pipe(cipher)
        .pipe(archiveFileWriteStream);

      end
        .on("finish", () => {
          resolve(undefined);
        })
        .on("error", reject);

      this.cacheGzipPack.finalize();
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
    return outputPath
      .replace(new RegExp(this.config.baseDir + "/?"), "")
      .replaceAll("/", "-")
      .replaceAll(".", "-dot-");
  }

  private cacheKeyFilePath(
    cacheDir: string,
    options?: { cache_key_path?: string }
  ) {
    return options?.cache_key_path
      ? resolveAbsolutePath(options.cache_key_path, this.config.baseDir)
      : resolvePath(cacheDir, CACHE_KEY_FILE_NAME);
  }

  private cacheFileName() {
    return `${this.config.cacheId}-cache.data`;
  }

  private async resolveCacheKeyPath(
    outputPath: string
  ): Promise<[outPath: string | undefined, contents: Buffer | undefined]> {
    const cacheFiles = this.cacheFiles;
    const cacheKey = this.fileKey(outputPath);
    if (cacheFiles && cacheKey) {
      return [outputPath, cacheFiles[cacheKey]];
    }
    return [undefined, undefined];
  }
}
