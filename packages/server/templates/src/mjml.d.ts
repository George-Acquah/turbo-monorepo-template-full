declare module 'mjml' {
  interface MjmlOptions {
    filePath?: string;
    minify?: boolean;
    validationLevel?: 'strict' | 'soft' | 'skip';
  }

  interface MjmlResult {
    html: string;
    json: unknown;
    errors: Array<{ line: number; message: string; tagName: string; formattedMessage: string }>;
  }

  function mjml(input: string, options?: MjmlOptions): MjmlResult;
  export default mjml;
}
