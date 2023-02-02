import { PerformanceObserver } from "perf_hooks";
export const createObserver = () => {
    const observer = new PerformanceObserver((list) =>
      list.getEntries().forEach((entry) => console.info(entry))
    );
    return observer;
  };
  