import { describe, it, expect } from 'vitest';
import { encryptPdf } from '@/src/lib/pdf/pdfEncryptor';

describe('PDF Encryptor (Standard Security Handler)', () => {
  const minimalPdf = `%PDF-1.4
1 0 obj
<< /Type /Catalog /Pages 2 0 R >>
endobj
2 0 obj
<< /Type /Pages /Kids [3 0 R] /Count 1 >>
endobj
3 0 obj
<< /Type /Page /Parent 2 0 R >>
endobj
xref
0 4
0000000000 65535 f 
0000000009 00000 n 
0000000058 00000 n 
0000000115 00000 n 
trailer
<<
  /Size 4
  /Root 1 0 R
>>
startxref
163
%%EOF`;

  it('injects standard security encryption dictionary and trailer pointer', async () => {
    const rawBytes = new TextEncoder().encode(minimalPdf);
    const encrypted = await encryptPdf(rawBytes, {
      userPassword: 'secretPassword123',
      allowPrinting: false,
      allowCopying: false,
    });

    const resultStr = new TextDecoder('latin1').decode(encrypted);
    expect(resultStr).toContain('/Filter /Standard');
    expect(resultStr).toContain('/V 2');
    expect(resultStr).toContain('/R 3');
    expect(resultStr).toContain('/Length 128');
    expect(resultStr).toContain('/Encrypt 4 0 R');
    expect(resultStr).toContain('/ID [');
    expect(resultStr).toContain('/O <');
    expect(resultStr).toContain('/U <');
  });

  it('handles empty options without error', async () => {
    const rawBytes = new TextEncoder().encode(minimalPdf);
    const encrypted = await encryptPdf(rawBytes, {});
    expect(encrypted.length).toBeGreaterThan(rawBytes.length);
  });
});
