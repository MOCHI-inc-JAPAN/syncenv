import { ConfigParser } from "./config-parser";

export async function run() {
  const configParser =  new ConfigParser()
  const config =  await configParser.config()

  config.setting.forEach((params) => {
    if(params)
    if(params.type === '.env' || params.type === '.envrc') {

    }
  })


}
