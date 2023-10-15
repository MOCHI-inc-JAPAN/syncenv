import { PipeInterface } from "../plugin-interface";

export const replacePipe: PipeInterface = {
  pipeId: "replace",
  pipe: (value, match: string, replaced: string) => {
    if(!match || !replaced) throw new Error('replace pipe requires match and replaced')
    const current = value.toString()
    let matcher: string | RegExp = match
    if(match.startsWith('/') && match.endsWith('/')) {
       matcher = new RegExp(match)
    }
    return current.replace(matcher, replaced)
  }
}
