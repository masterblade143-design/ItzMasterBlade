/* boot.js - runs first in <head>: applies saved theme/layout before paint (no flash)
   and prevents the harmless "ResizeObserver loop" error from surfacing. */
try{var t=localStorage.getItem("mb-theme");if(t==="midnight"||t==="onyx"||t==="starlight"||t==="halloween"||t==="eclipse"||t==="frost"||t==="forest")document.documentElement.setAttribute("data-theme",t);var q=Date.now()+19800000,m=Math.floor(q/60000)%1440;if((m>=1200||m<300)&&localStorage.getItem("mb-moon")===new Date(q-(m<300?864e5:0)).toISOString().slice(0,10))document.documentElement.setAttribute("data-theme","moonlight")}catch(e){}
try{var l=localStorage.getItem("mb-layout");if(l==="stack"||l==="dense"||l==="wide")document.documentElement.setAttribute("data-layout",l)}catch(e){}
// Debounce helper: ResizeObserver callbacks run on the next frame, which avoids
// "ResizeObserver loop completed with undelivered notifications".
window.mbRO=function(fn){var q=0;return function(){cancelAnimationFrame(q);q=requestAnimationFrame(fn)}};
addEventListener("error",function(e){if(e.message&&e.message.indexOf("ResizeObserver loop")===0){e.stopImmediatePropagation();e.preventDefault()}},true);

