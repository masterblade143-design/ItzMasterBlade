(function(){
  var root=document.documentElement,calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(q){return document.querySelector(q)}
  // ids for dock targets
  [[".about","about"],[".projects","projects"],[".spotify","music"]].forEach(function(a){var e=$(a[0]);if(e&&!e.id)e.id=a[1]});

  // custom cursor (mouse only)
  if(matchMedia("(hover:hover) and (pointer:fine)").matches&&!calm){
    var dot=$(".cur-dot"),ring=$(".cur-ring"),x=-99,y=-99,rx=-99,ry=-99,on=false;
    var LINK='a,button,[role="button"],[role="radio"],label,.chip,.game,.proj,.avatar,.pw-tb,.seg,summary';
    root.classList.add("cur-ok");
    addEventListener("pointermove",function(e){
      if(e.pointerType==="touch")return;
      x=e.clientX;y=e.clientY;if(!on){on=true;rx=x;ry=y;root.classList.add("cur-on")}
      dot.style.transform="translate3d("+x+"px,"+y+"px,0)";
      var t=e.target.closest?e.target:null;
      root.classList.toggle("cur-hide",!!(t&&t.closest("iframe,input,textarea,select")));
      root.classList.toggle("cur-link",!!(t&&t.closest(LINK)));
    },{passive:true});
    document.addEventListener("pointerleave",function(){root.classList.remove("cur-on");on=false});
    addEventListener("pointerdown",function(e){
      root.classList.add("cur-down");
      var p=document.createElement("div");p.className="cur-pulse";p.style.setProperty("--px",e.clientX+"px");p.style.setProperty("--py",e.clientY+"px");
      p.style.transform="translate("+e.clientX+"px,"+e.clientY+"px)";document.body.appendChild(p);setTimeout(function(){p.remove()},700);
    });
    addEventListener("pointerup",function(){root.classList.remove("cur-down")});
    (function loop(){rx+=(x-rx)*.18;ry+=(y-ry)*.18;ring.style.transform="translate3d("+rx+"px,"+ry+"px,0)";requestAnimationFrame(loop)})();
  }

  // scroll progress + dock scrollspy
  var sp=$("#sp"),tick=false;
  function prog(){tick=false;var h=root.scrollHeight-innerHeight;sp.style.transform="scaleX("+(h>0?Math.min(1,scrollY/h):0)+")"}
  addEventListener("scroll",function(){if(!tick){tick=true;requestAnimationFrame(prog)}},{passive:true});prog();
  var links=[].slice.call(document.querySelectorAll(".dk-nav a")),nav=$(".dk-nav");
  function mark(id){links.forEach(function(a){var o=a.getAttribute("href")==="#"+id;a.classList.toggle("on",o);if(o&&nav.scrollWidth>nav.clientWidth)nav.scrollTo({left:a.offsetLeft-30,behavior:calm?"auto":"smooth"})})}
  links.forEach(function(a){
    a.addEventListener("click",function(e){var t=$(a.getAttribute("href"));if(t){e.preventDefault();t.scrollIntoView({behavior:calm?"auto":"smooth",block:"start"})}});
    var t=$(a.getAttribute("href"));
    if(t&&"IntersectionObserver" in window)new IntersectionObserver(function(es){es.forEach(function(en){if(en.isIntersecting)mark(t.id)})},{rootMargin:"-35% 0px -55% 0px"}).observe(t);
  });
  addEventListener("scroll",function(){if(scrollY<200)links.forEach(function(a){a.classList.remove("on")})},{passive:true});
  $("#dkTop").addEventListener("click",function(){scrollTo({top:0,behavior:calm?"auto":"smooth"})});

  // dynamic layouts with FLIP animation
  var lb=[].slice.call(document.querySelectorAll("[data-lay]"));
  function paint(l){
    if(l==="bento")root.removeAttribute("data-layout");else root.setAttribute("data-layout",l);
    lb.forEach(function(b){b.setAttribute("aria-pressed",b.getAttribute("data-lay")===l)});
  }
  function setLayout(l){
    var cs=[].slice.call(document.querySelectorAll("main>.card,main>.gcorner")),f=cs.map(function(c){return c.getBoundingClientRect()});
    paint(l);try{localStorage.setItem("mb-layout",l)}catch(e){}
    if(!calm)cs.forEach(function(c,i){
      var a=f[i],b=c.getBoundingClientRect(),vh=innerHeight;
      if((a.bottom<-150&&b.bottom<-150)||(a.top>vh+150&&b.top>vh+150)||!b.width||!b.height)return;
      var dx=a.left-b.left,dy=a.top-b.top,sx=a.width/b.width,sy=c.classList.contains("gcorner")?1:a.height/b.height;
      if(Math.abs(dx)+Math.abs(dy)<2&&Math.abs(1-sx)<.01&&Math.abs(1-sy)<.01)return;
      c.animate([{transformOrigin:"0 0",transform:"translate("+dx+"px,"+dy+"px) scale("+sx+","+sy+")"},{transformOrigin:"0 0",transform:"none"}],{duration:720,delay:Math.min(i,12)*24,fill:"backwards",easing:"cubic-bezier(.2,.8,.2,1)"});
    });
    setTimeout(function(){dispatchEvent(new Event("resize"))},650);
  }
  lb.forEach(function(b){b.addEventListener("click",function(){var l=b.getAttribute("data-lay");if(b.getAttribute("aria-pressed")!=="true")setLayout(l)})});
  paint(root.getAttribute("data-layout")||"bento");
})();

(function(){
  var root=document.documentElement,calm=matchMedia("(prefers-reduced-motion: reduce)").matches;
  function $(q){return document.querySelector(q)}
  // theme reveal origin = last pointer position
  addEventListener("pointerdown",function(e){root.style.setProperty("--vx",e.clientX+"px");root.style.setProperty("--vy",e.clientY+"px")},true);

  // dock sliding indicator
  var nav=$(".dk-nav");
  if(nav){
    var th=document.createElement("span");th.className="dk-thumb";nav.insertBefore(th,nav.firstChild);
    function place(){var a=nav.querySelector("a.on");if(!a){th.style.opacity=0;return}th.style.opacity=1;th.style.width=a.offsetWidth+"px";th.style.transform="translateX("+a.offsetLeft+"px)"}
    new MutationObserver(place).observe(nav,{subtree:true,attributes:true,attributeFilter:["class"]});
    addEventListener("resize",place);
  }

  // ambient: grain + floating light particles + parallax
  var g=document.createElement("div");g.id="grain";g.setAttribute("aria-hidden","true");document.body.insertBefore(g,document.body.firstChild);
  var au=$(".aurora"),mx=.5,my=.5;
  addEventListener("pointermove",function(e){if(e.pointerType==="touch")return;mx=e.clientX/innerWidth;my=e.clientY/innerHeight;
    if(au){au.style.setProperty("--ax",((mx-.5)*-34).toFixed(1)+"px");au.style.setProperty("--ay",((my-.5)*-24).toFixed(1)+"px")}},{passive:true});
  if(calm)return;
  var cv=document.createElement("canvas");cv.id="amb";cv.setAttribute("aria-hidden","true");
  if(au)au.after(cv);else document.body.insertBefore(cv,document.body.firstChild);
  var ctx=cv.getContext("2d"),W=0,H=0,dpr=Math.min(devicePixelRatio||1,1.5),ps=[],c1="#a78bfa",c2="#22d3ee",f=0;
  function colors(){var cs=getComputedStyle(root);c1=cs.getPropertyValue("--violet").trim()||c1;c2=cs.getPropertyValue("--a3").trim()||c2}
  function mk(init){return{x:Math.random()*W,y:init?Math.random()*H:H+20,r:Math.random()<.18?14+Math.random()*34:.8+Math.random()*2.2,z:.3+Math.random()*.9,v:.12+Math.random()*.35,w:Math.random()*6.28,s:.4+Math.random()*1.2,c:Math.random()<.65?0:1}}
  function size(){W=innerWidth;H=innerHeight;cv.width=W*dpr;cv.height=H*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    var n=Math.min(52,Math.round(W/26));ps=[];for(var i=0;i<n;i++)ps.push(mk(true))}
  size();colors();addEventListener("resize",size);
  new MutationObserver(function(){setTimeout(colors,900)}).observe(root,{attributes:true,attributeFilter:["data-theme"]});
  function draw(){
    requestAnimationFrame(draw);if(document.hidden)return;
    if(++f%90===0)colors();
    ctx.clearRect(0,0,W,H);
    for(var i=0;i<ps.length;i++){
      var p=ps[i];p.y-=p.v*p.z;p.w+=.01*p.s;p.x+=Math.sin(p.w)*.25*p.z;
      if(p.y<-60){ps[i]=mk(false);continue}
      var x=p.x+(mx-.5)*-40*p.z,y=p.y+(my-.5)*-28*p.z,tw=.55+.45*Math.sin(p.w*2.4);
      ctx.globalAlpha=(p.r>8?.07:.5*tw)*Math.min(1,(H-p.y)/160+.2);
      ctx.fillStyle=p.c?c2:c1;
      if(p.r>8){var gr=ctx.createRadialGradient(x,y,0,x,y,p.r);gr.addColorStop(0,p.c?c2:c1);gr.addColorStop(1,"transparent");ctx.fillStyle=gr}
      ctx.beginPath();ctx.arc(x,y,p.r,0,6.283);ctx.fill();
    }
    ctx.globalAlpha=1;
  }
  draw();
})();
