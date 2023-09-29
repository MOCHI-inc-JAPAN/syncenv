
import {SecretManagerServiceClient} from '@google-cloud/secret-manager'
import {BaseReplacer} from './replacer-interface'
import { SyncenvConfig } from './config-parser';

export class GcpSecretReplacer extends BaseReplacer {
  private client = new SecretManagerServiceClient();

  async fetchValues(config: SyncenvConfig): Promise<Record<string, string>> {
    const
    const [secret] = await this.client.getSecret({
      name: name,
    });

    const policy = secret.replication.replication;

    throw new Error('Method not implemented.');
  }
}


