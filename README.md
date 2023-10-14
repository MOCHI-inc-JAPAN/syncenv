## Syncenv

A simple env files generator.

### Install

```shell
npm i -g @tkow/syncenv
```

### Config
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
      REPLACED_DIRECTLY_PROVIDER: __default:to_be_replaced__
      REPLACED_PROVIDER: $TO_BE_REPLACE_PROVIDER
    replaces:
      TO_BE_REPLACE: replaceId
      TO_BE_REPLACE_PROVIDER: __gcp:replaceId__
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

### Usage

Locate config file in you project's root.

Then, run

`npx synenv`

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

#### Change Replacers by each placeholder value

The defaultReplacer is used useally. However, You can change replacers by each placeholder values with special syntax `__(.*):(.*)__` is available. The first mached value is plugin name and the second is request parameter for replacer provided by the plugin. The syntax matched changes replacer to be used.

### Plugins

You can extend and add custom replacer to this command run process. See how to implements a GCP replacer.
