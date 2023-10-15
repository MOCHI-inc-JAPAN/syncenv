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
plugins: ['gcp']
setting:
  - type: '.envrc'
    output_dir: ./artifacts
    env:
      NOT_REPLACED: NOT_REPLACED
      REPLACED: ${TO_BE_REPLACE}
    replaces:
      TO_BE_REPLACE: replaceId
  - type: '.env'
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
      PIPE_TEST: 'replace(FAILED, SUCCESS)'
      PIPE_REGEXP_TEST: 'replace(FAILED, *UCCE**) | replace(/\*/g, S)'
      PIPE_MULTIPLE_TEST: ['replace(FAILED, "SUCCESS ")', trim]
    defaultReplacer: default
  - type: file
    output_path: ./artifacts/file-output.txt
    placeholder: $TO_BE_REPLACE $TO_BE_REPLACE_PROVIDER
    replaces:
      TO_BE_REPLACE: replaceId
      TO_BE_REPLACE_PROVIDER: __gcp:replaceId__
    defaultReplacer?: default
  - type: template
    input_path: ./fixtures/.env.template
    output_path: ./artifacts/template-output.env
    replaces:
      TO_BE_REPLACE: replaceId
      TO_BE_REPLACE_PROVIDER: __gcp:replaceId__
    defaultReplacer?: default
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

`npx synenv`

If you want to apply another config file, you can specify another config name with (-c, --config) option.

`npx synenv -c .anotherconfig.yml`

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
Given if, the variable syntax are ${NAME} or $NAME in the content. If the key is NAME and the modified value is PASSWORD, the variable syntaxes, ${NAME} or $NAME in content are replaced to PASSWORD.

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
    PIPE_TEST: 'replace(FAILED, SUCCESS)'
    PIPE_REGEXP_TEST: 'replace(FAILED, *UCCE**) | replace(/\*/g, S)'
    PIPE_MULTIPLE_TEST: ['replace(FAILED, "SUCCESS ")', trim]
```

#### Change Replacers by each placeholder value

The defaultReplacer is used useally. However, You can change replacers by each placeholder values with special syntax `__(.*):(.*)__` is available. The first mached value is plugin name and the second is request parameter for replacer provided by the plugin. The syntax matched changes replacer to be used.

### Plugins

You can extend and add custom replacer and pipes to this command run process.
Syncenv process can be extended in root's plugins property config.
Specify install node_module's name or custom plugin class path there.
The plugin class must be exported from `default` property, and has ether or both  `fetchValues` and `loadPipes` methods as commonjs module.

Example:

Given if cosum-plugin.ts is followed by the code.

```ts
import {Plugin, SyncenvConfig} from '@tkow/syncenv'

export default class CustomPlugin extends Plugin {
  static pluginId: "custom" = "custom";

  constructor() {
    super()
  }

  async fetchValues(replaces: Record<string, string>, config: SyncenvConfig): Promise<Record<string, string>> {
    const results: Record<string, string> = {}
    for(let [key, value] of Object.entries(replaces)) {
      results[key] = 'pre-' + value
    }
    return results
  }

  loadPipes() {
    return [
      {
        pipeId: 'postfix',
        pipe: (value, id) => value + '-' + id
      }
    ]
  }
}
```

Transplie it to commonjs and locate the code custom-plugin.js. Then create the config.

```yaml
plugins: ['./custom-plugin']
setting:
  - type: '.env'
    output_dir: ./artifacts
    env:
      REPLACED: ${REPLACED}
    replaces:
      REPLACED: student
    pipes:
      REPLACED: 'postfix(1)'
    defaultReplacer: custom
```

Syncenv imports plugins' paths and node_modules all and register the replacer named by pluginId and the pipes are available in all the config file. Specify defaultReplacer with your pluginId if you want to process replaces' values by your plugin `fetchValues` method. Then once you run `npx envsync`, you can see generated ./artifacts/.env file will be:

```env
REPLACED=pre-student-1
```

You can see the detail in our example project.
