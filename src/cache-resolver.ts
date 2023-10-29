import concat from "concat-stream";
import { Readable, Writable } from "node:stream";
import { createReadStream, createWriteStream } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { resolve as resolvePath } from "node:path";
import { Pack, t as tart, ReadEntry, Header, Parse } from "tar";
import { pack, Pack as StreamPack } from "tar-stream";
import { isDirectory, isFile, resolveAbsolutePath } from "./pathResolver";
import { randomBytes, createCipheriv, createDecipheriv } from "crypto";
import { writeFile } from "./writeFile";
import { homedir } from "os";

const CACHE_KEY_FILE_NAME = "cache-key.json";
const CACHE_FILE_NAME = "synenv-cache.data";

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
    this.config.cacheDir = cacheDir;
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
      const decipher = createDecipheriv(
        secretKey.algorithm,
        secretKey.key,
        secretKey.iv
      );
      this.cacheFiles = new Promise(async (resolve, reject) => {
        const pipePromises: Promise<[string, Buffer]>[] = [];
        const cacheFilePath = resolvePath(cacheDir, CACHE_FILE_NAME);
        const isfile = await isFile(cacheFilePath);
        if (!isfile) {
          resolve(Object.fromEntries(await Promise.all(pipePromises)));
          return;
        }
        const tarPipe = createReadStream(cacheFilePath)
          .pipe(decipher)
          .on("error", (err) => {
            reject(err);
          })
          .pipe(tart());

        tarPipe
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
    const cacheDir = this.config.cacheDir;
    if(!cacheDir) {
      return
    }
    const isDir = isDirectory(cacheDir);
    if (!isDir) {
      await mkdir(cacheDir, { recursive: true });
    }


    await new Promise((resolve, reject) => {
      const streamPack = pack() // pack is a stream

      const entry = streamPack.entry({ name: 'my-stream-test.txt', size: 11 }, function(err) {
        // the stream was added
        // no more entries
        streamPack.finalize()
      })

      entry.write(contents)
      entry.end()

      const parser = new Parse();
      // parserオブジェクトの'entry'イベントをリッスン
      parser.on("entry", (entry) => {
        console.log("entry");
        this.cacheGzipPack = this.cacheGzipPack
          .add(entry)
          .on("error", (e) => {
            console.log("error");
            console.log(e);
          })
          .end(() => {
            console.log("end");
            resolve(true);
          });
        console.log(entry.path); // 各エントリのパスを出力
        entry.resume(); // 次のエントリに進むために現在のエントリのデータを破棄
      }).on("end", () => {
        console.log("end");
      })

      streamPack.on('error', reject).pipe(parser);
    });
  }

  async archiveCacheFile(options?: { cache_key_path?: string }): Promise<void> {
    const cacheDir = this.config.cacheDir;
    const cacheDirExists = await isDirectory(cacheDir);
    if (!cacheDirExists) {
      await mkdir(cacheDir, { recursive: true });
    }

    const archiveFileWriteStream = createWriteStream(
      resolvePath(cacheDir, CACHE_FILE_NAME)
    );

    const secretKey = await this.genOrReadSecretKey(cacheDir, options);
    const cipher = createCipheriv(
      secretKey.algorithm,
      secretKey.key,
      secretKey.iv
    );
    return new Promise((resolve, reject) => {
      this.cacheGzipPack
        .pipe(cipher)
        .pipe(archiveFileWriteStream)
        .on("error", (e) => {
          reject(e)
        })
        .on("finish", () => {
          console.log("finish");
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
