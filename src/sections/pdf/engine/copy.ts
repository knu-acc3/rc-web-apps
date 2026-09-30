import { PDFArray, PDFDict, PDFName, PDFNull, PDFPage, PDFPageLeaf, PDFRef, PDFStream, type PDFDocument, type PDFObject } from "@cantoo/pdf-lib";

/**
 * Copy pages from `src` into `dest` (not yet inserted into the page tree).
 *
 * Unlike pdf-lib's `copyPages` this:
 *  - never drags excluded pages along: references to pages that are not being
 *    copied (link destinations, annotation /P, form widgets of other pages)
 *    become null instead of silently copying those pages with all their
 *    content into the output;
 *  - handles the same index more than once (duplicates share content streams
 *    and resources; their annotations are cloned, form widgets are dropped);
 *  - shares resources (fonts, images) between all pages of one call.
 */
export async function copyPagesInto(dest: PDFDocument, src: PDFDocument, indices: readonly number[]): Promise<PDFPage[]> {
  await src.flush();
  const srcPages = src.getPages();
  const pageRefs = new Set<PDFRef>(srcPages.map((p) => p.ref));
  const traversed = new Map<PDFObject, PDFObject>();

  const firstRef = new Map<number, PDFRef>();
  for (const i of indices) {
    if (i < 0 || i >= srcPages.length) throw new Error(`Page index ${i} out of range`);
    if (!firstRef.has(i)) {
      const ref = dest.context.nextRef();
      firstRef.set(i, ref);
      traversed.set(srcPages[i].ref, ref);
    }
  }

  const copy = (obj: PDFObject): PDFObject => {
    if (obj instanceof PDFRef) {
      const hit = traversed.get(obj);
      if (hit) return hit;
      if (pageRefs.has(obj)) return PDFNull; // link to a page that is not copied
      const ref = dest.context.nextRef();
      traversed.set(obj, ref);
      const value = src.context.lookup(obj);
      dest.context.assign(ref, value === undefined ? PDFNull : copy(value));
      return ref;
    }
    if (obj instanceof PDFDict) {
      const hit = traversed.get(obj);
      if (hit) return hit;
      const out = obj.clone(dest.context);
      traversed.set(obj, out);
      for (const [k, v] of obj.entries()) {
        // Never climb up a page tree from a nested page-like dict.
        if (obj instanceof PDFPageLeaf && k === PDFName.of("Parent")) out.delete(k);
        else out.set(k, copy(v));
      }
      return out;
    }
    if (obj instanceof PDFArray) {
      const hit = traversed.get(obj);
      if (hit) return hit;
      const out = obj.clone(dest.context);
      traversed.set(obj, out);
      for (let i = 0; i < obj.size(); i++) out.set(i, copy(obj.get(i)));
      return out;
    }
    if (obj instanceof PDFStream) {
      const hit = traversed.get(obj);
      if (hit) return hit;
      const out = obj.clone(dest.context);
      traversed.set(obj, out);
      for (const [k, v] of obj.dict.entries()) out.dict.set(k, copy(v));
      return out;
    }
    return obj.clone();
  };

  const copied = new Map<number, PDFPage>();
  const result: PDFPage[] = [];
  for (const i of indices) {
    const prev = copied.get(i);
    if (!prev) {
      const leaf = srcPages[i].node;
      const out = leaf.clone(dest.context);
      for (const key of PDFPageLeaf.InheritableEntries) {
        const name = PDFName.of(key);
        if (!out.get(name)) {
          const v = leaf.getInheritableAttribute(name);
          if (v) out.set(name, v);
        }
      }
      out.delete(PDFName.of("Parent"));
      for (const [k, v] of out.entries()) out.set(k, copy(v));
      const ref = firstRef.get(i)!;
      dest.context.assign(ref, out);
      const page = PDFPage.of(out, ref, dest);
      copied.set(i, page);
      result.push(page);
    } else {
      result.push(duplicatePage(dest, prev));
    }
  }
  return result;
}

/** Duplicate a page that already lives in `doc`: content/resources are shared, annotations cloned. */
export function duplicatePage(doc: PDFDocument, page: PDFPage): PDFPage {
  const ref = doc.context.nextRef();
  const leaf = page.node.clone(doc.context);
  leaf.delete(PDFName.of("Parent"));
  const annots = page.node.lookupMaybe(PDFName.of("Annots"), PDFArray);
  if (annots) {
    const next = doc.context.obj([]);
    for (let i = 0; i < annots.size(); i++) {
      const a = annots.lookupMaybe(i, PDFDict);
      if (!a || a.lookup(PDFName.of("Subtype")) === PDFName.of("Widget")) continue;
      const c = a.clone(doc.context);
      c.set(PDFName.of("P"), ref);
      c.delete(PDFName.of("Popup"));
      c.delete(PDFName.of("IRT"));
      next.push(doc.context.register(c));
    }
    leaf.set(PDFName.of("Annots"), next);
  }
  doc.context.assign(ref, leaf);
  return PDFPage.of(leaf, ref, doc);
}
