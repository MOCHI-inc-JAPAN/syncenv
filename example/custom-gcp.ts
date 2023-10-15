import {Plugin, SyncenvConfig} from '@tkow/syncenv'

class GcpSecretReplacerClientMock {
  private current: number = 0
  genRandomStr() {
    this.current++
    return 'gcpcall' + this.current
  }
  accessSecretVersion(request?: unknown, options?: unknown, callback?: unknown): Promise<[any, any | undefined, {} | undefined]> {
    return Promise.resolve([
      {
        payload: {
          data: this.genRandomStr()
        }
      },
      {
        name: 'dummy'
      },
      {}
    ] as [any, any | undefined, {} | undefined])
  }
}

export default class GcpSecretPlugin extends Plugin {
  static pluginId: "gcp" = "gcp";

  constructor(private client: GcpSecretReplacerClientMock = new GcpSecretReplacerClientMock()) {
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

