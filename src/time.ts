let clock: () => Date = () => new Date();

/** One injectable clock seam for timestamps and future scheduled reports. */
export function now(): Date {
  return clock();
}

export function setClockForTests(next?: () => Date): void {
  clock = next ?? (() => new Date());
}
