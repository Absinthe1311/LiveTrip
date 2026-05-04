/**
 * AI辅助生成
 * 时间：2026-05-04
 * 环节：代码重构
 */
declare module 'marked' {
  interface MarkedOptions {
    breaks?: boolean;
    gfm?: boolean;
    sanitize?: boolean;
    smartLists?: boolean;
    smartypants?: boolean;
    [key: string]: any;
  }

  function marked(src: string, options?: MarkedOptions): string;
  function marked(src: string, callback: (err: Error | null, result: string) => void): void;
  function marked(
    src: string,
    options: MarkedOptions,
    callback: (err: Error | null, result: string) => void
  ): void;

  namespace marked {
    function setOptions(options: MarkedOptions): typeof marked;
    function parse(src: string, options?: MarkedOptions): string;
    function lexer(src: string, options?: MarkedOptions): any[];
    function parser(tokens: any[], options?: MarkedOptions): string;
  }

  export = marked;
}
