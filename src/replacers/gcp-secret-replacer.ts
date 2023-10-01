import { SecretManagerServiceClient, type SecretManagerServiceClient as ISecretManagerServiceClient } from "@google-cloud/secret-manager";
import { BaseReplacer } from "./base-replacer";
import { SyncenvConfig } from "../config-parser";

export type IGcpSecretReplacerClient = Pick<ISecretManagerServiceClient, 'accessSecretVersion'>

export default class GcpSecretReplacer extends BaseReplacer {
  static pluginId: "gcp" = "gcp";

  constructor(private client: IGcpSecretReplacerClient = new SecretManagerServiceClient()) {
    super()
  }

  async fetchValues(replaces: Record<string, string>, config: SyncenvConfig): Promise<Record<string, string>> {
    const results: Record<string, string> = {}
    for(let [key, requestId] of Object.entries(replaces)) {
      const [data] = await this.client.accessSecretVersion({
        name: requestId
      })
      const replacedValue = data.payload?.data?.toString()
      if(!replacedValue) {
        console.warn(`Cannot access gcp secret ${requestId}`)
      }
      results[key] = replacedValue || ''
    }
    return results
  }
}
