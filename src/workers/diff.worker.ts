/**
 * Web Worker for heavy Myers diff computations.
 */

import { generateDiffOutput, type DiffComputeOptions, type DiffOutput } from '@/src/lib/diff/myersDiff';

export interface DiffWorkerPayload {
  taskId: string;
  oldText: string;
  newText: string;
  options?: DiffComputeOptions;
}

self.onmessage = (event: MessageEvent<DiffWorkerPayload>) => {
  const { taskId, oldText, newText, options } = event.data;

  try {
    const result: DiffOutput = generateDiffOutput(oldText, newText, options);
    self.postMessage({ taskId, success: true, result });
  } catch (err) {
    const error = err instanceof Error ? err.message : 'Diff calculation failed';
    self.postMessage({ taskId, success: false, error });
  }
};
