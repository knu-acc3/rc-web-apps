/**
 * Inline <head> script (ES5): the Material ripple. One delegated pointerdown listener for every button, chip,
 * segment and [data-ripple] element — server-rendered links included, nothing to hydrate. The ripple lives in a
 * clipped host span (`.ripple-host` in globals.css), so the button itself keeps `overflow: visible`.
 * Skipped when the user asked for less motion.
 */
export const RIPPLE_SCRIPT = `(function(){var d=document;if(!d.addEventListener||!window.matchMedia)return;var rm=matchMedia('(prefers-reduced-motion: reduce)');d.addEventListener('pointerdown',function(e){if(rm.matches||e.button>0)return;var t=e.target,el=t&&t.closest?t.closest('.btn,.chip,.seg,[data-ripple]'):null;if(!el||el.disabled||el.getAttribute('aria-disabled')==='true')return;var r=el.getBoundingClientRect();if(!r.width)return;var cs=getComputedStyle(el);if(cs.position==='static')return;var h=d.createElement('span');h.className='ripple-host';h.setAttribute('aria-hidden','true');var s=d.createElement('span'),z=Math.max(r.width,r.height)*2.2;s.style.width=s.style.height=z+'px';s.style.left=(e.clientX-r.left-z/2)+'px';s.style.top=(e.clientY-r.top-z/2)+'px';h.appendChild(s);el.appendChild(h);setTimeout(function(){if(h.parentNode)h.parentNode.removeChild(h)},600)},{passive:true})})()`;
