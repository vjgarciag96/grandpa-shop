const RUN_AND_NUMBER = /^(.+-[A-Za-z]*)\d+$/;

/**
 * The print run of a printing: its set code up to the number, such as LOB-EN for LOB-EN001 or LOB- for LOB-001.
 * A code with no hyphen or no trailing number is its own run.
 */
export function printRunOf(setCode: string): string {
  return RUN_AND_NUMBER.exec(setCode)?.[1] ?? setCode;
}
