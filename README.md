## Syncenv

A simple env or secret files generator from contents fetching remote server files or local template file and relocate them.

### Install

```shell
npm i -g @tkow/syncenv
```

### Config Example

You can write config in

[
'package.json',
`.syncenvrc`,
`.syncenvrc.json`,
`.syncenvrc.yaml`,
`.syncenvrc.yml`,
`.syncenvrc.js`,
`syncenv.config.js`,
]

All entirely config in the file is followed by an example.

```yaml
plugins: ["gcp"]
setting:
  - type: ".envrc"
    output_dir: ./artifacts
    env:
      NOT_REPLACED: NOT_REPLACED
      REPLACED: ${TO_BE_REPLACE}
    replaces:
      TO_BE_REPLACE: replaceId
  - type: ".env"
    output_dir: ./artifacts
    filename: .env.dev
    env:
      NOT_REPLACED: NOT_REPLACED
      REPLACED: ${TO_BE_REPLACE}
      REPLACED_PROVIDER: $TO_BE_REPLACE_PROVIDER
      PIPE_TEST: $PIPE_TEST
      PIPE_REGEXP_TEST: $PIPE_REGEXP_TEST
      PIPE_MULTIPLE_TEST: $PIPE_MULTIPLE_TEST
    replaces:
      TO_BE_REPLACE: replaceId
      TO_BE_REPLACE_PROVIDER: __gcp:replaceId__
      PIPE_TEST: "PIPE_FAILED"
      PIPE_REGEXP_TEST: "PIPE_FAILED"
      PIPE_MULTIPLE_TEST: PIPE_FAILED
    pipes:
      PIPE_TEST: "replace(FAILED, SUCCESS)"
      PIPE_REGEXP_TEST: 'replace(FAILED, *UCCE**) | replace(/\*/g, S)'
      PIPE_MULTIPLE_TEST: ['replace(FAILED, "SUCCESS ")', trim]
    default_replacer: default
  - type: file
    output_path: ./artifacts/file-output.txt
    placeholder: $TO_BE_REPLACE $TO_BE_REPLACE_PROVIDER
    replaces:
      TO_BE_REPLACE: replaceId
      TO_BE_REPLACE_PROVIDER: __gcp:replaceId__
    default_replacer: default
  - type: template
    input_path: ./fixtures/.env.template
    output_path: ./artifacts/template-output.env
    replaces:
      TO_BE_REPLACE: replaceId
      TO_BE_REPLACE_PROVIDER: __gcp:replaceId__
    default_replacer: default
```

will generate files the contents followed by in artifacts/ directory.

- .env.dev

```env
  NOT_REPLACED=NOT_REPLACED
  REPLACED=replaceId
  REPLACED_PROVIDER=gcpcall1
  PIPE_TEST=PIPE_SUCCESS
  PIPE_REGEXP_TEST=PIPE_SUCCESS
  PIPE_MULTIPLE_TEST=PIPE_SUCCESS
```

- .envrc

```envrc
  export NOT_REPLACED=NOT_REPLACED
  export REPLACED=replaceId
```

- file-output.txt

```txt
replaceId gcpcall1
```

- template-output.env

```txt
NOT_REPLACED: NOT_REPLACED
REPLACED: replaceId
REPLACED_PROVIDER: gcpcall1
```

### Usage

Locate config file in you project's root.

Then, run

`npx syncenv`

If you want to apply another config file, you can specify another config name with (-c, --config) option.

`npx syncenv -c .anotherconfig.yml`

### ConfigValue

#### plugins [ Array ] < optional >

They are specified with array contains built-in plugin name or path to import node_modules or file if you want to extend generator commands.

#### type [ .env | .envrc | file | template ]

Specify to generate file. The .env, .envrc type will generate file from replacer fetchedValues and env object.
The file type will generate file use placeholder value replaced by replaces object.
The template type will generate file use read file content specified by input_path and the special syntax stings replaced by replaces object.

#### env (type .env, .envrc only)

Values to be written in the output file, You can specify directly `__provider:(requestId)__` for replacements.

#### replaces [ Object ] < optional >

The key string replace same name variable syntax in content to the modifed value by replacer.fetchValues. The original value is used for replacer.fetchValues parameters,
Given if, the variable syntax are `${NAME}` or `$NAME` in the content. If the key is NAME and the modified value is PASSWORD, the variable syntaxes, `${NAME}` or `$NAME` in content are replaced to PASSWORD.

The content is various format by setting element value's type value.

If type is file, the content is placeholder.
If type is template, the content is read file content by input_path.
If type is .env or .envrc, the content is their env object values.

The content can include multiple replace key and be replaced all matched variable syntaxes. If variable syntaxes in content match no replace's keys, they are left in it.

#### pipes

You can transform replaces' results using pipes. Pipes can be extended by plugin implements loadPipes methods.
Default plugin includes two type pipes, [trim, replace]. Pipes can be specified three forms, string, string[], `pipe1 | pipe2 | pipes...` as string. Pipes can be also specified with args if the pipe accepts them. Pipes' args can omit quate `'|"` if you don't want to tell them they're explicit string arguments.

Usage:

```yaml
# ...partial setting
env:
  PIPE_TEST: $PIPE_TEST
  PIPE_REGEXP_TEST: $PIPE_REGEXP_TEST
  PIPE_MULTIPLE_TEST: $PIPE_MULTIPLE_TEST
replaces:
  PIPE_TEST: "PIPE_FAILED"
  PIPE_REGEXP_TEST: "PIPE_FAILED"
  PIPE_MULTIPLE_TEST: PIPE_FAILED
pipes:
  PIPE_TEST: "replace(FAILED, SUCCESS)"
  PIPE_REGEXP_TEST: 'replace(FAILED, *UCCE**) | replace(/\*/g, S)'
  PIPE_MULTIPLE_TEST: ['replace(FAILED, "SUCCESS ")', trim]
```

#### Change Replacers by each placeholder value

The default_replacer is used usually. However, You can change replacers by each placeholder values with special syntax `__(.*):(.*)__` is available. The first mached value is plugin name and the second is request parameter for replacer provided by the plugin. The syntax matched changes replacer to be used.

### Plugins

You can extend and add custom replacer and pipes to this command run process.
Syncenv process can be extended in root's plugins property config.
Specify install node_module's name or custom plugin class path there.
The plugin class must be exported from `default` property, and has ether or both `fetchValues` and `loadPipes` methods as commonjs module.

Example:

Given if costum-plugin.ts is followed by the code.

```ts
import { Plugin, SyncenvConfig } from "@tkow/syncenv";

export default class CustomPlugin extends Plugin {
  static pluginId: "custom" = "custom";

  constructor() {
    super();
  }

  async fetchValues(
    replaces: Record<string, string>,
    config: SyncenvConfig
  ): Promise<Record<string, string>> {
    const results: Record<string, string> = {};
    for (let [key, value] of Object.entries(replaces)) {
      results[key] = "pre-" + value;
    }
    return results;
  }

  loadPipes() {
    return [
      {
        pipeId: "postfix",
        pipe: (value, id) => value + "-" + id,
      },
    ];
  }
}
```

Transplie it to commonjs and locate the code custom-plugin.js. Then create the config.

```yaml
plugins: ["./custom-plugin"]
setting:
  - type: ".env"
    output_dir: ./artifacts
    env:
      REPLACED: ${REPLACED}
    replaces:
      REPLACED: student
    pipes:
      REPLACED: "postfix(1)"
    default_replacer: custom
```

Syncenv imports plugins' paths and node_modules all and register the replacer named by pluginId and the pipes are available in all the config file. Specify default_replacer with your pluginId if you want to process replaces' values by your plugin `fetchValues` method. Then once you run `npx syncenv`, you can see generated ./artifacts/.env file will be:

```env
REPLACED=pre-student-1
```

You can see the detail in our example project.

## Builtin Replacer

## gcp

The gcp plugin can fetch and embet value from google secret manager specify secret varsion.

```yaml
plugins: ['gcp'] # you need specify gcp if you this feature.
  env:
    VALUE: $VALUE
  replaces:
    VALUE: projects/{your projectId}/secrets/{your secret name}/versions/${your secre version number}
```

Before runnin comand, you must login by 'gcloud auth application-default login' or set a credencial path to GOOGLE_APPLICATION_CREDENTIALS and satisfy your account have privilege of the secret manager access.
See the detail in https://cloud.google.com/docs/authentication/getting-started.

## Cache Mode

As default, syncenv always fetch and generate files when output files exist. Sometimes, this may annoy you when using pricing sttorage. If you want to change this behavior, set `cache: true` option and syncenv will use cache files to genrate them when it is available and doesn't run provider actions. Even if you set `cache: true`, you can ignore cache files with flag `-f or --force`.

```yaml
cache: false
...(other configs)
```

Cache files will be stored in your $Home/.syncenv directory with created if it doesn't exist. If you want to change the path you can configure it with cache property like `cache: /path/to/yours`.

Cache directory has two type files. They are cache-key.json and syncenv cache.data. The `${cacheId}-cache.data` is encrypted your env data and cache-key.json is your encryption key. Thus, Cache directory shouldn't be shared publically, especially cache-key.json must be secret from malicious users, so you should set .gitignore your cache path if you include it in your project and should not commit them to your vcs.

You can change secret key file path, `cache_key_path: /path/to/yours` to share same key, it's not needed in most case.

## Security Warning

If you use syncenv with others, be careful not to let malicious users modify syncenv config files or steal your secret keys. Especially, if you commit oss project and run syncenv in CI environment have permission to access your secret env storage, it may be possible to send your secrets to their servers revising syncenv config files or add malicious plugins to it. In addition, if you locate syncenv cache directory in your project with vcs, don't forget ignore it or locate your secret key file out of your version control.
