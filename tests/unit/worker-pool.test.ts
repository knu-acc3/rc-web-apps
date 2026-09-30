import { describe, it, expect } from 'vitest';
import { WorkerPool } from '@/src/lib/workers/workerPool';

describe('Менеджер пула Web Workers (WorkerPool)', () => {
  it('должен инициализироваться с корректным числом воркеров', () => {
    const pool = new WorkerPool('/mock-worker.js', 4);
    expect(pool).toBeDefined();
    expect(pool.getConcurrency()).toBe(4);
    expect(pool.getQueueLength()).toBe(0);
    pool.terminate();
  });
});
