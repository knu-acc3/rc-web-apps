export interface WebRtcDetectionResult {
  readonly candidateIps: readonly string[];
  readonly hasLocalLeak: boolean;
}

export async function detectWebRtcIps(timeoutMs = 3000): Promise<WebRtcDetectionResult> {
  if (typeof window === 'undefined' || !(window as unknown as { RTCPeerConnection?: typeof RTCPeerConnection }).RTCPeerConnection) {
    return { candidateIps: [], hasLocalLeak: false };
  }

  return new Promise((resolve) => {
    const ips = new Set<string>();
    let pc: RTCPeerConnection | null = null;

    const timer = setTimeout(() => {
      if (pc) pc.close();
      const candidateList = Array.from(ips);
      resolve({
        candidateIps: candidateList,
        hasLocalLeak: candidateList.some(
          (ip) =>
            ip.startsWith('192.168.') ||
            ip.startsWith('10.') ||
            ip.startsWith('172.')
        ),
      });
    }, timeoutMs);

    try {
      pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      });

      pc.createDataChannel('');
      pc.createOffer().then((offer) => pc?.setLocalDescription(offer));

      pc.onicecandidate = (event) => {
        if (!event || !event.candidate || !event.candidate.candidate) return;
        const candidate = event.candidate.candidate;
        const ipRegex = /([0-9]{1,3}(\.[0-9]{1,3}){3}|[a-f0-9]{1,4}(:[a-f0-9]{1,4}){7})/;
        const match = candidate.match(ipRegex);
        if (match) {
          ips.add(match[1]);
        }
      };
    } catch {
      clearTimeout(timer);
      resolve({ candidateIps: [], hasLocalLeak: false });
    }
  });
}
