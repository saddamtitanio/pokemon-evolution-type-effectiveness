import { performance } from "perf_hooks";

export async function runBenchmark(
  name: string,
  fn: () => Promise<any>,
  options?: {
    iterations?: number;
    warmup?: number;
  }
) {
  // number of benchmark runs
  // default = 30 iterations if not provided
  const iterations = options?.iterations ?? 30;

  // warmup runs help stabilise performance
  const warmup = options?.warmup ?? 5;

  // run warmup executions first
  for (let i = 0; i < warmup; i++) {
    await fn();
  }

  // stores execution times for each iteration
  const times: number[] = [];

  // actual benchmark loop
  for (let i = 0; i < iterations; i++) {
    // start timer
    const start = performance.now();

    // execute function being benchmarked
    await fn();

    // end timer
    const end = performance.now();

    // save runtime duration
    times.push(end - start);
  }

  // sort runtimes from smallest to largest
  // needed for median and p95 calculations
  times.sort((a, b) => a - b);

  // return benchmark statistics
  return {
    name,

    // median runtime (middle value)
    median: times[Math.floor(times.length / 2)],

    // p95 runtime (95% of executions are faster than this value)
    p95: times[Math.floor(times.length * 0.95)],

    // average runtime across all iterations
    mean: times.reduce((a, b) => a + b, 0) / times.length,
  };
}