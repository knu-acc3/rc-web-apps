export const DOCX_ARCHIVE_LIMITS = {
  maxEntries: 1_000,
  maxUncompressedBytes: 100 * 1024 * 1024,
  maxCompressionRatio: 100,
  maxDocumentXmlBytes: 10 * 1024 * 1024,
} as const;

type ZipEntryLike = {
  dir?: boolean;
  _data?: {
    uncompressedSize?: number;
  };
};

export function assertSafeDocxArchive(
  entries: Record<string, ZipEntryLike>,
  compressedBytes: number,
): void {
  const files = Object.values(entries).filter((entry) => !entry.dir);
  if (files.length > DOCX_ARCHIVE_LIMITS.maxEntries) {
    throw new Error('DOCX contains too many archive entries.');
  }

  let totalUncompressed = 0;
  for (const entry of files) {
    const size = entry._data?.uncompressedSize;
    if (!Number.isSafeInteger(size) || (size ?? -1) < 0) {
      throw new Error('DOCX archive contains an entry with an unknown size.');
    }
    totalUncompressed += size ?? 0;
    if (totalUncompressed > DOCX_ARCHIVE_LIMITS.maxUncompressedBytes) {
      throw new Error('DOCX expands beyond the safe archive limit.');
    }
  }

  const denominator = Math.max(1, compressedBytes);
  if (
    totalUncompressed / denominator >
    DOCX_ARCHIVE_LIMITS.maxCompressionRatio
  ) {
    throw new Error('DOCX compression ratio exceeds the safe limit.');
  }
}
