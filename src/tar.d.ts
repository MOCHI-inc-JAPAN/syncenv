import { ReadEntry, Pack as BasePack, HeaderProperties } from 'tar'

declare module 'tar' {
  export * from 'tar'

  // TODO: fix type
  export interface Header {}
  export class Header implements Header {
    constructor (data, off, ex, gex): this
  }

  export class ReadEntry implements ReadEntry {
    constructor(header: any, ex: any, gx: any): this
  }

  export interface Pack {
    add(path: ReadEntry): BasePack
  }
}
