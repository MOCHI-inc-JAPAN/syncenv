import { EnvType, SyncenvConfigObject } from "../config-parser";
import { BaseProcessor } from "./base-processor";
import { join, resolve } from "node:path";
import { writeFile } from "../writeFile";
import { EOL } from "node:os";

export class EnvProcessor extends BaseProcessor {
  constructor(
    private placeholderMap: Record<string, string | number | boolean>,
    private config: Extract<SyncenvConfigObject<string>, { type: EnvType }>
  ) {
    super();
  }
  async process(): Promise<void> {
    const outDir = this.config.output_dir.startsWith("/")
      ? this.config.output_dir
      : resolve(global.process.cwd(), this.config.output_dir);
    const outPath = join(outDir, this.config.filename || this.config.type);
    const contents = Object.entries(this.config.env).map(([key, value]) => {

      const finalValue = typeof value === 'string' ? this.replaceValue(value, this.placeholderMap) : value.toString();
      const text = [key, this.validValue(finalValue)].join("=");
      if (this.config.type === ".envrc") {
        return `export ${text}`;
      } else {
        return text;
      }
    });
    return writeFile(outPath, contents.join(EOL)).then(() => {
      console.log(`${outPath} created.`);
    });
  }

  private needQuatingChars = [
    "=" ,
    "#" ,
    '"' ,
    "'" ,
    "$" ,
    "`" ,
    "*",
    "&",
    "^",
    "%",
    "~",
    "`",
    "\\"
  ]

  private validValue(value: string): string {
    return this.quoteValue(this.escapeValue(value));
  }

  private needEscapeChars = [
    ["\n", "\\n"], ["\r", "\\r"], ["\t", "\\t"], ["\b", "\\b"], ["\f", "\\f"], ["\v", "\\v"], ["\0", "\\0"], ["`", "\\`"]
  ]

  private escapeValue(val: string): string {
    const value = this.needEscapeChars.reduce(
      (current, matcher) =>  current.replaceAll(matcher[0], matcher[1]),
      val
    )
    if(value.includes('"') && this.config.quate === '"') {
      return value.replace(/"/g, '\\"');
    }
    if(value.includes("'") && this.config.quate === "'") {
      return value.replace(/'/g, "\\'");
    }
    return value
  }

  private quoteValue(value: string): string {
    const needQuate = this.needQuatingChars.some(char => value.includes(char));
    return needQuate ? `${this.config.quate}${value}${this.config.quate}` : value;
  }
}
