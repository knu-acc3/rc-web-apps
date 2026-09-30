import { describe, it, expect } from 'vitest';
import { resolveToolContract, findCompatibleTools, ToolPipeBroker } from '@/src/lib/pipe/ToolPipeBroker';
import type { Tool } from '@/src/data/tools';

describe('ToolPipeBroker', () => {
  it('resolves explicit contracts or fallback by groupId', () => {
    const diffTool = { slug: 'diff-checker', groupId: 'developers' } as Tool;
    const contract = resolveToolContract(diffTool);
    expect(contract.accepts).toContain('text');
    expect(contract.produces).toContain('text');

    const pdfTool = { slug: 'compress-pdf', groupId: 'pdf' } as Tool;
    const pdfContract = resolveToolContract(pdfTool);
    expect(pdfContract.accepts).toContain('pdf');
    expect(pdfContract.produces).toContain('pdf');
  });

  it('finds compatible tools for a given output type', () => {
    const textCompatible = findCompatibleTools(['text'], 'diff-checker');
    expect(textCompatible.length).toBeGreaterThan(0);
    // Should not include currentSlug
    expect(textCompatible.some((t) => t.slug === 'diff-checker')).toBe(false);

    const pdfCompatible = findCompatibleTools(['pdf']);
    expect(pdfCompatible.length).toBeGreaterThan(0);
    expect(pdfCompatible.every((t) => {
      const c = resolveToolContract(t);
      return c.accepts.includes('pdf');
    })).toBe(true);
  });

  it('formats pipe url for small text via hash payload', async () => {
    // In Node/Vitest, window is undefined or mock
    const target = 'diff-checker';
    const smallText = 'Hello world pipeline';
    const url = await ToolPipeBroker.sendDataToTool(target, {
      type: 'text',
      payload: smallText,
    }, 'en');

    expect(url).toContain('/en/tools/diff-checker');
  });
});
