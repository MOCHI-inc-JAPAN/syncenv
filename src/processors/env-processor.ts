import { EnvType, SyncenvConfigObject } from "../config-parser";
import { BaseProcessor } from "./base-processor";
import { join, resolve } from "node:path";
import { writeFile } from "../writeFile";
import { EOL } from "node:os";

export class EnvProcessor extends BaseProcessor {
  constructor(
    private placeholderMap: Record<string, string>,
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
      const finalValue = this.replaceValue(value, this.placeholderMap)
      const text = [key, finalValue].join("=");
      if (this.config.type === ".envrc") {
        return `export ${text}`;
      } else {
        return text;
      }
    });
    return writeFile(outPath, contents.join(EOL)).then(()=> {
      console.log(`${outPath} created.`)
    });
  }
}
