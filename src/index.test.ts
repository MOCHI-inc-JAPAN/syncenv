import { test, expect, mock } from "bun:test";
import * as configuration from "../fixtures/syncenvrc.yaml";
import { type IConfigResolver } from "./config-resolver";
import { IConfigParser } from "./config-parser";
import { BaseReplacer } from "./replacers/base-replacer";
import GcpSecretReplacer, {
  IGcpSecretReplacerClient,
} from "./replacers/gcp-secret-replacer";
import { Syncenv } from "./index";
import { google } from "@google-cloud/secret-manager/build/protos/protos";
import { CallOptions, Callback } from "google-gax";
import DefaultReplacer from "./replacers/default-replacer";

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

class ConfigResolverMock implements IConfigResolver {
  async resolveReplacers(arg: unknown): Promise<Record<string, BaseReplacer>> {
    return {
      [DefaultReplacer.pluginId]: new DefaultReplacer(),
      [GcpSecretReplacer.pluginId]: new GcpSecretReplacer(
        new GcpSecretReplacerClientMock()
      ),
    };
  }
}

test("file test", async () => {
  const syncenv = new Syncenv(new ConfigParserMock(), new ConfigResolverMock());
  await syncenv.run();
  expect(configuration).toBeTruthy();
});
