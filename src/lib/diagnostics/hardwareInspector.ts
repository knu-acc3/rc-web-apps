export interface HardwareDiagnosticsResult {
  readonly cpuCores: number;
  readonly deviceMemoryGb?: number;
  readonly screenResolution: string;
  readonly pixelRatio: number;
  readonly colorDepth: number;
  readonly gpuRenderer?: string;
  readonly gpuVendor?: string;
  readonly touchSupport: boolean;
}

let cachedHardwareResult: HardwareDiagnosticsResult | null = null;

export function inspectClientHardware(): HardwareDiagnosticsResult {
  if (typeof window === 'undefined') {
    return {
      cpuCores: 1,
      screenResolution: '1920x1080',
      pixelRatio: 1,
      colorDepth: 24,
      touchSupport: false,
    };
  }

  if (cachedHardwareResult) {
    return cachedHardwareResult;
  }

  let gpuRenderer: string | undefined;
  let gpuVendor: string | undefined;

  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (gl) {
      const glCtx = gl as WebGLRenderingContext;
      const debugInfo = glCtx.getExtension('WEBGL_debug_renderer_info');
      if (debugInfo) {
        gpuVendor = glCtx.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        gpuRenderer = glCtx.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
      }
      const loseContext = glCtx.getExtension('WEBGL_lose_context');
      if (loseContext) {
        loseContext.loseContext();
      }
    }
  } catch (err) {
    console.warn('WebGL inspection restricted by browser:', err);
  }

  cachedHardwareResult = {
    cpuCores: navigator.hardwareConcurrency || 4,
    deviceMemoryGb: (navigator as unknown as { deviceMemory?: number }).deviceMemory,
    screenResolution: `${window.screen.width * window.devicePixelRatio}x${window.screen.height * window.devicePixelRatio}`,
    pixelRatio: window.devicePixelRatio || 1,
    colorDepth: window.screen.colorDepth || 24,
    gpuRenderer,
    gpuVendor,
    touchSupport: 'ontouchstart' in window || navigator.maxTouchPoints > 0,
  };

  return cachedHardwareResult;
}
