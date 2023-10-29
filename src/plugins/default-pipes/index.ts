import { PipeInterface } from "../plugin-interface";

export const replacePipe: PipeInterface = {
  pipeId: "replace",
  pipe: (value, match: string, replaced: string) => {
    if (!match || !replaced)
      throw new Error("replace pipe requires match and replaced");
    const current = value.toString();
    let matcher: string | RegExp = match;
    const matchedRegExp = match.match(/\/(.*)\/([gimuys]{0,6})$/);
    if (matchedRegExp) {
      matcher = new RegExp(matchedRegExp[1], matchedRegExp[2]);
    }
    const finalValue = current.replace(matcher, replaced);
    if (finalValue === current) {
      console.warn(`No effect ${match} in replace filter.`);
    }
    return finalValue;
  },
};

export const trimPipe: PipeInterface = {
  pipeId: "trim",
  pipe: (value) => {
    return value.toString().trim();
  },
};

export const defaultPipes = [replacePipe, trimPipe];
