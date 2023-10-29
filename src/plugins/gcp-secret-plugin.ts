import {
  SecretManagerServiceClient,
  type SecretManagerServiceClient as ISecretManagerServiceClient,
} from "@google-cloud/secret-manager";
import { PluginInterface } from "./plugin-interface";
import { SyncenvConfig } from "../config-parser";

export type IGcpSecretReplacerClient = Pick<
  ISecretManagerServiceClient,
  "accessSecretVersion"
>;

export default class GcpSecretPlugin extends PluginInterface {
  static pluginId: "gcp" = "gcp";
  private resultCache: Record<string, Record<string, string>> = {};

  constructor(
    private client: IGcpSecretReplacerClient = new SecretManagerServiceClient()
  ) {
    super();
  }

  async fetchValues(
    replaces: Record<string, string>,
    config: SyncenvConfig
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    for (let [key, requestId] of Object.entries(replaces)) {
      const cacheValue = this.getCacheValue(key, requestId);
      if (cacheValue) {
        results[key] = cacheValue;
      } else {
        try {
          const [data] = await this.client.accessSecretVersion({
            name: requestId,
          });
          const replacedValue = data.payload?.data?.toString();
          if (!replacedValue) {
            console.warn(`Cannot access gcp secret ${requestId}`);
          }
          results[key] = replacedValue || "";
          this.setCacheValue(key, requestId, results[key]);
        } catch (e) {
          console.warn(e);
        }
      }
    }
    return results;
  }

  private getCacheValue(key: string, requestId: string): string | undefined {
    if (this.resultCache[key]?.[requestId]) {
      return this.resultCache[key][requestId];
    }
  }

  private setCacheValue(key: string, requestId: string, value: string): void {
    if (!this.resultCache[key]) {
      this.resultCache[key] = {};
    }
    this.resultCache[key] = {
      ...this.resultCache[key],
      [requestId]: value,
    };
  }
}
