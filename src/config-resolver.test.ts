import { test, expect, mock } from "bun:test";
import * as configuration from "../fixtures/syncenvrc.yaml";
import { ConfigResolver, type IConfigResolver } from "./config-resolver";
import { IConfigParser, SyncenvConfig } from "./config-parser";
import { PluginInterface } from "./plugins/plugin-interface";
import GcpSecretPlugin, {
  IGcpSecretReplacerClient,
} from "./plugins/gcp-secret-plugin";
import { google } from "@google-cloud/secret-manager/build/protos/protos";
import { CallOptions, Callback } from "google-gax";
import DefaultPlugin from "./plugins/default-plugin";

class ConfigParserMock implements IConfigParser {
  async config() {
    return configuration;
  }
}

class GcpSecretReplacerClientMock implements IGcpSecretReplacerClient {
  private current: number = 0;
  genRandomStr() {
    this.current++;
    return "gcpcall" + this.current;
  }
  accessSecretVersion(
    request?:
      | google.cloud.secretmanager.v1.IAccessSecretVersionRequest
      | undefined,
    options?: CallOptions | undefined
  ): Promise<
    [
      google.cloud.secretmanager.v1.IAccessSecretVersionResponse,
      google.cloud.secretmanager.v1.IAccessSecretVersionRequest | undefined,
      {} | undefined
    ]
  >;
  accessSecretVersion(
    request: google.cloud.secretmanager.v1.IAccessSecretVersionRequest,
    options: CallOptions,
    callback: Callback<
      google.cloud.secretmanager.v1.IAccessSecretVersionResponse,
      | google.cloud.secretmanager.v1.IAccessSecretVersionRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): void;
  accessSecretVersion(
    request: google.cloud.secretmanager.v1.IAccessSecretVersionRequest,
    callback: Callback<
      google.cloud.secretmanager.v1.IAccessSecretVersionResponse,
      | google.cloud.secretmanager.v1.IAccessSecretVersionRequest
      | null
      | undefined,
      {} | null | undefined
    >
  ): void;
  accessSecretVersion(
    request?: unknown,
    options?: unknown,
    callback?: unknown
  ): void | Promise<
    [
      google.cloud.secretmanager.v1.IAccessSecretVersionResponse,
      google.cloud.secretmanager.v1.IAccessSecretVersionRequest | undefined,
      {} | undefined
    ]
  > {
    return Promise.resolve([
      {
        payload: {
          data: this.genRandomStr(),
        },
      },
      {
        name: "dummy",
      },
      {},
    ] as [google.cloud.secretmanager.v1.IAccessSecretVersionResponse, google.cloud.secretmanager.v1.IAccessSecretVersionRequest | undefined, {} | undefined]);
  }
}

class ConfigResolverMock extends ConfigResolver {
  async resolvePlugins(arg: unknown): Promise<Record<string, PluginInterface>> {
    return {
      [DefaultPlugin.pluginId]: new DefaultPlugin(),
      [GcpSecretPlugin.pluginId]: new GcpSecretPlugin(
        new GcpSecretReplacerClientMock()
      ),
    };
  }
}

test("file test", async () => {
  const configParser = new ConfigParserMock();
  const configResolver = new ConfigResolver();
  const replacers = await configResolver.resolvePlugins(
    await configParser.config()
  );
  expect(configuration).toBeTruthy();
});
