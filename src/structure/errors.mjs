// Errors the restructure engine reports (D-157). `code` is for programs
// (the app, the CLI, a plugin host); `message` is plain language an author
// can read as-is — never a stack trace or a raw system error.
export class StructureError extends Error {
  constructor(code, message, detail) {
    super(message);
    this.name = 'StructureError';
    this.code = code;
    // Technical detail for logs only, never shown to authors.
    this.detail = detail;
  }
}
