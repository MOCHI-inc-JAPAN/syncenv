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
  private results: Record<string, string> = {};

  constructor(
    private client: IGcpSecretReplacerClient = new SecretManagerServiceClient()
  ) {
    super();
  }

  async fetchValues(
    replaces: Record<string, string>,
    config: SyncenvConfig
  ): Promise<Record<string, string>> {
    for (let [key, requestId] of Object.entries(replaces)) {
      if (!this.results[key]) {
        try {
          const [data] = await this.client.accessSecretVersion({
            name: requestId,
          });
          const replacedValue = data.payload?.data?.toString();
          if (!replacedValue) {
            console.warn(`Cannot access gcp secret ${requestId}`);
          }
          this.results[key] = replacedValue || "";
        } catch (e) {
          console.warn(e);
        }
      }
    }
    return this.results;
  }
}
