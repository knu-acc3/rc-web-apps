/**
 * Inline <head> script (ES5 — it must run in any browser):
 *  - browsers without cascade layers (Safari < 15.4, Chrome < 99) drop the whole design, so they get
 *    /legacy.css, the same styles flattened by scripts/postbuild.mjs;
 *  - browsers that can't run the site's JavaScript (Safari < 14, Chrome < 85, Firefox < 79) get the `old-js`
 *    class, which shows a notice above interactive tools;
 *  - browsers without the Popover API (Safari < 17) get a click handler that toggles `.is-open` instead.
 */
export const LEGACY_SCRIPT = `(function(){var d=document,h=d.documentElement;try{if(!window.CSSLayerBlockRule)d.write('<link rel="stylesheet" href="/legacy.css">');if(!(window.BigInt&&window.Promise&&Promise.any&&String.prototype.replaceAll))h.className+=' old-js';if(window.HTMLElement&&!HTMLElement.prototype.hasOwnProperty('popover'))d.addEventListener('click',function(e){var t=e.target;while(t&&t.getAttribute&&!t.getAttribute('popovertarget'))t=t.parentNode;if(!t||!t.getAttribute)return;var p=d.getElementById(t.getAttribute('popovertarget'));if(!p)return;var a=t.getAttribute('popovertargetaction'),o=/(^| )is-open( |$)/.test(p.className);p.className=a==='hide'||(o&&a!=='show')?p.className.replace(/(^| )is-open( |$)/g,' '):p.className+' is-open'})}catch(e){}})()`;
