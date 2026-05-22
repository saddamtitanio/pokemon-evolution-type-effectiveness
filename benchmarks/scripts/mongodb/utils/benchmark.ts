import { performance } from "perf_hooks";

export async function runBenchmark(
  name: string,
  fn: () => Promise<any>,
  options?: {
    iterations?: number;
    warmup?: number;
  }
) {
  const iterations = options?.iterations ?? 30;
  const warmup = options?.warmup ?? 5;

  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  const times: number[] = [];

  for (let i = 0; i < iterations; i++) {
    const start = performance.now();
    await fn();
    const end = performance.now();
    times.push(end - start);
  }

  times.sort((a, b) => a - b);

  return {
    name,
    median: times[Math.floor(times.length / 2)],
    p95: times[Math.floor(times.length * 0.95)],
    mean: times.reduce((a, b) => a + b, 0) / times.length,
  };
}
