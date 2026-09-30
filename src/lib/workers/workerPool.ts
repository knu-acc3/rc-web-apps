export type WorkerTaskType = 'IMAGE_CONVERT' | 'IMAGE_RESIZE' | 'CALCULATE_HASH' | 'PDF_EXTRACT';

export interface WorkerTaskPayload<T = unknown> {
  readonly taskId: string;
  readonly type: WorkerTaskType;
  readonly data: T;
  readonly transferList?: Transferable[];
}

export interface WorkerTaskResponse<R = unknown> {
  readonly taskId: string;
  readonly success: boolean;
  readonly result?: R;
  readonly error?: string;
  readonly progress?: number;
}

export interface WorkerPoolOptions {
  readonly maxConcurrency?: number;
  readonly idleTimeoutMs?: number;
}

interface QueuedTask<T = unknown, R = unknown> {
  payload: WorkerTaskPayload<T>;
  resolve: (value: R) => void;
  reject: (reason?: unknown) => void;
}

export class WorkerPool {
  private scriptUrl: string;
  private maxConcurrency: number;
  private workers: Worker[] = [];
  private busyWorkers: Set<Worker> = new Set();
  private queue: QueuedTask[] = [];
  private pendingResolvers: Map<string, { resolve: (val: unknown) => void; reject: (err: unknown) => void }> = new Map();

  constructor(scriptUrl: string, maxConcurrency: number = 4) {
    this.scriptUrl = scriptUrl;
    this.maxConcurrency = Math.max(1, maxConcurrency);
  }

  public getConcurrency(): number {
    return this.maxConcurrency;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  private createWorker(): Worker | null {
    if (typeof window === 'undefined' || typeof Worker === 'undefined') {
      return null;
    }
    try {
      const worker = new Worker(this.scriptUrl);
      worker.onmessage = (event: MessageEvent<WorkerTaskResponse>) => {
        const response = event.data;
        const entry = this.pendingResolvers.get(response.taskId);
        if (entry) {
          this.pendingResolvers.delete(response.taskId);
          this.busyWorkers.delete(worker);
          if (response.success) {
            entry.resolve(response.result);
          } else {
            entry.reject(new Error(response.error || 'Worker execution error'));
          }
          this.processNext();
        }
      };
      worker.onerror = () => {
        this.busyWorkers.delete(worker);
        this.processNext();
      };
      this.workers.push(worker);
      return worker;
    } catch {
      return null;
    }
  }

  private processNext() {
    if (this.queue.length === 0) return;
    let availableWorker = this.workers.find(w => !this.busyWorkers.has(w));
    if (!availableWorker && this.workers.length < this.maxConcurrency) {
      availableWorker = this.createWorker() || undefined;
    }
    if (!availableWorker) return;

    const task = this.queue.shift();
    if (!task) return;

    this.busyWorkers.add(availableWorker);
    this.pendingResolvers.set(task.payload.taskId, {
      resolve: task.resolve,
      reject: task.reject,
    });

    if (task.payload.transferList && task.payload.transferList.length > 0) {
      availableWorker.postMessage(task.payload, task.payload.transferList);
    } else {
      availableWorker.postMessage(task.payload);
    }
  }

  public execute<T = unknown, R = unknown>(type: WorkerTaskType, data: T, transferList?: Transferable[]): Promise<R> {
    return new Promise<R>((resolve, reject) => {
      const taskId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      const payload: WorkerTaskPayload<T> = { taskId, type, data, transferList };
      this.queue.push({ payload: payload as WorkerTaskPayload<unknown>, resolve: resolve as (value: unknown) => void, reject });
      this.processNext();
    });
  }

  public terminate() {
    for (const worker of this.workers) {
      worker.terminate();
    }
    this.workers = [];
    this.busyWorkers.clear();
    this.queue = [];
    this.pendingResolvers.clear();
  }
}
