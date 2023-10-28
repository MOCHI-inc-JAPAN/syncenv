import { EOL } from "node:os";
import { CacheResolver } from "../cache-resolver";
import { EnvType, SyncenvConfigObject } from "../config-parser";
import { resolveOutputPath } from "../pathResolver";
import { writeFile } from "../writeFile";
import { BaseProcessor } from "./base-processor";

export class EnvProcessor extends BaseProcessor {

  constructor(
   protected  placeholderMap: Record<string, string | number | boolean | Buffer>,
   protected  config: Extract<SyncenvConfigObject<string>, { type: EnvType }>,
   protected  cacheResolver: CacheResolver
  ) {
    super(placeholderMap, cacheResolver);
  }

  async process(): Promise<void> {
    const outPath = resolveOutputPath(this.config);
    const contents = Object.entries(this.config.env).map(([key, value]) => {
      const finalValue =
        typeof value === "string"
          ? this.replaceValue(value, this.placeholderMap)
          : value.toString();
      const text = [key, this.validValue(finalValue)].join("=");
      if (this.config.type === ".envrc") {
        return `export ${text}`;
      } else {
        return text;
      }
    });
    return this.writeFile(this.cacheResolver.config.cacheDir,outPath, contents.join(EOL)).then(() => {
      console.info(`${outPath} created.`);
    });
  }

  private needQuatingChars = [
    "=",
    "#",
    '"',
    "'",
    "$",
    "`",
    "*",
    "&",
    "^",
    "%",
    "~",
    "`",
    "\\",
  ];

  private validValue(value: string): string {
    return this.quoteValue(this.escapeValue(value));
  }

  private needEscapeChars = [
    ["\n", "\\n"],
    ["\r", "\\r"],
    ["\t", "\\t"],
    ["\b", "\\b"],
    ["\f", "\\f"],
    ["\v", "\\v"],
    ["\0", "\\0"],
    ["`", "\\`"],
  ];

  private escapeValue(val: string): string {
    const value = this.needEscapeChars.reduce(
      (current, matcher) => current.replaceAll(matcher[0], matcher[1]),
      val
    );
    if (value.includes('"') && this.config.quate === '"') {
      return value.replace(/"/g, '\\"');
    }
    if (value.includes("'") && this.config.quate === "'") {
      return value.replace(/'/g, "\\'");
    }
    return value;
  }

  private quoteValue(value: string): string {
    const needQuate = this.needQuatingChars.some((char) =>
      value.includes(char)
    );
    return needQuate
      ? `${this.config.quate}${value}${this.config.quate}`
      : value;
  }
}
