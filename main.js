(function(){
  // ticker: edit these lines to change your updates
  var updates=[
    "Working on a new Minecraft build",
    "Grinding Asphalt Legends events",
    "Tank lineup getting upgraded in War Thunder",
    "Exploring new Roblox experiences",
    "Open to squad invites"
  ];
  var s=document.getElementById("slide");
  s.innerHTML=updates.concat(updates).map(function(t){return "<span>"+t+"</span>"}).join("");

  // toast
  var toast=document.getElementById("toast"),tt;
  function say(m){toast.textContent=m;toast.classList.add("on");clearTimeout(tt);tt=setTimeout(function(){toast.classList.remove("on")},2600)}

  var calm=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var cards=[].slice.call(document.querySelectorAll(".card"));

  // ---- PROJECTS: edit this list. status = Building | Live | Planned. link/linkText are optional.
  var projects=[
    {title:"Nexora",desc:"Nexora is a modern, privacy-focused messaging app designed for seamless conversations, group communities called Hubs, and a safer, more personalized chatting experience. Connect. Create. Experience.",status:"Live",tech:["HTML","CSS","JavaScript"],link:"https://shivangdebnath5-wq.github.io/Nexora-Chat/",linkText:"Visit"},
    {title:"Moon Cycle Web🌙",desc:"An interactive 3D lunar simulator where you can explore the Moon, rotate it freely, and observe its phases, lighting, and eclipses in real time.",status:"Building",tech:["HTML","CSS","JavaScript"],link:"https://shivangdebnath5-wq.github.io/Moon-Cycle-Web/",linkText:"Visit"},
    {title:"Kaam Setu 🔧",desc:"Kaam Setu connects people with nearby skilled workers for everyday services, making it easier to find reliable help, save favourites, and manage service requests in one place.",status:"Planned",tech:["JavaScript","HTML","CSS","Charts"],link:"https://shivangdebnath5-wq.github.io/Kaam-Setu/",linkText:"Visit"},
    {title:"Vyapix💵",desc:"Vyapix is a smart business management dashboard for small shops, helping owners track sales, expenses, inventory, pending payments, and sales forecasts in one place.",status:"Planned",tech:["JavaScript","Charts","HTML","CSS"],link:"https://shivangdebnath5-wq.github.io/Vyapix/",linkText:"Visit"},
    {title:"Raasta",desc:"Raasta is a community-driven road reporting platform that helps people report potholes, broken streetlights, waterlogging, and other road issues while tracking their progress toward resolution.",status:"Planned",tech:["HTML","CSS","JavaScript"],link:"https://itzmasterblade.github.io/",linkText:"Visit"},
    {title:"CareFlow",desc:"CareFlow is a smart healthcare platform that simplifies hospital visits with specialist appointments, digital queue numbers, and bookings for blood tests, X-rays, and MRI scans—all in one convenient place",status:"Planned",tech:["HTML","CSS","JavaScript"],link:"https://itzmasterblade.github.io/",linkText:"Visit"}
  ];

  function mk(t,c,x){var e=document.createElement(t);if(c)e.className=c;if(x!=null)e.textContent=x;return e}
  var pgrid=document.getElementById("pgrid");
  function renderProjects(f){
    pgrid.textContent="";var n=0;
    projects.forEach(function(p){
      p.status=p.status||"Live";
      if(f!=="All"&&p.status!==f)return;
      var c=mk("article","proj"),pf=mk("div","pf"),tc=mk("div","tech");
      c.style.setProperty("--i",n++);
      c.appendChild(mk("span","st st-"+p.status.toLowerCase(),p.status));
      c.appendChild(mk("h3",null,p.title));c.appendChild(mk("p",null,p.desc));
      (p.tech||[]).forEach(function(t){tc.appendChild(mk("span",null,t))});
      pf.appendChild(tc);
      if(p.link){var a=mk("a","plink",(p.linkText||"Open")+" ↗");a.href=p.link;a.target="_blank";a.rel="noopener";pf.appendChild(a)}
      c.appendChild(pf);pgrid.appendChild(c);
    });
    if(!n)pgrid.appendChild(mk("p","pempty","Nothing here yet. Check back soon."));
  }
  renderProjects("All");

  // ---- segmented controls (sliding thumb)
  function thumb(seg){
    var a=seg.querySelector('[aria-checked="true"],[aria-pressed="true"]'),t=seg.querySelector(".thumb");
    if(!a){t.style.opacity=0;return}
    t.style.opacity=1;t.style.top="0px";t.style.height=a.offsetHeight+"px";t.style.width=a.offsetWidth+"px";t.style.transform="translate("+a.offsetLeft+"px,"+a.offsetTop+"px)";
  }
  var segs=[].slice.call(document.querySelectorAll(".seg"));
  segs.forEach(function(g){thumb(g)});
  requestAnimationFrame(function(){requestAnimationFrame(function(){segs.forEach(function(g){g.classList.remove("init")})})});
  addEventListener("resize",function(){segs.forEach(thumb)});
  if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){segs.forEach(thumb)});
  var pf=document.getElementById("pfilter");
  [].slice.call(pf.querySelectorAll("button")).forEach(function(b){
    b.addEventListener("click",function(){
      [].slice.call(pf.querySelectorAll("button")).forEach(function(x){x.setAttribute("aria-pressed",x===b)});
      thumb(pf);renderProjects(b.getAttribute("data-f"));
    });
  });

  // ---- THEMES: saved in localStorage ("mb-theme")
  var names={midnight:"Midnight Nova",onyx:"Onyx",starlight:"Starlight",halloween:"Halloween",eclipse:"Royal Eclipse",frost:"Arctic Frost",forest:"Forest Pulse",moonlight:"Moonlight Sparkle"},root=document.documentElement,tseg=document.getElementById("themeSeg");
  var cur=root.getAttribute("data-theme")||"midnight";
  function paint(t){
    if(t==="midnight")root.removeAttribute("data-theme");else root.setAttribute("data-theme",t);
    [].slice.call(tseg.querySelectorAll("button")).forEach(function(b){b.setAttribute("aria-checked",b.getAttribute("data-theme-btn")===t)});
    thumb(tseg);
    var mb=document.getElementById("moonBtn");if(mb)mb.setAttribute("aria-pressed",t==="moonlight");
  }
  function swap(t,save){
    if(t===cur)return;cur=t;
    if(t!=="moonlight"){try{localStorage.removeItem("mb-moon")}catch(e){}}
    if(save){try{localStorage.setItem("mb-theme",t)}catch(e){}}
    if(document.startViewTransition&&!calm){document.startViewTransition(function(){paint(t)})}
    else{root.classList.add("theming");paint(t);setTimeout(function(){root.classList.remove("theming")},700)}
    say("Theme: "+names[t]);
  }
  paint(cur);
  [].slice.call(tseg.querySelectorAll("button")).forEach(function(b){
    b.addEventListener("click",function(){swap(b.getAttribute("data-theme-btn"),true)});
  });

  // ---- LIVE CLOCK (IST)
  var days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"],wk=document.getElementById("ck-week").children;
  var el={h:document.getElementById("ck-h"),m:document.getElementById("ck-m"),s:document.getElementById("ck-s"),d:document.getElementById("ck-day"),dt:document.getElementById("ck-date"),p:document.getElementById("ck-prog"),t:document.getElementById("ck-time")};
  var fmt;try{fmt=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hourCycle:"h23",hour:"2-digit",minute:"2-digit",second:"2-digit",weekday:"long",day:"2-digit",month:"short",year:"numeric"})}catch(e){}
  function put(n,v){if(n.textContent!==v)n.textContent=v}
  function tick(){
    if(!fmt)return;var o={};fmt.formatToParts(new Date()).forEach(function(x){o[x.type]=x.value});
    put(el.h,o.hour);put(el.m,o.minute);put(el.s,o.second);put(el.d,o.weekday);put(el.dt,o.day+" "+o.month+" "+o.year);
    var sec=+o.second;el.p.style.transition=sec===0?"none":"";el.p.style.transform="scaleX("+(sec+1)/60+")";
    var di=days.indexOf(o.weekday);for(var i=0;i<7;i++)wk[i].classList.toggle("on",i===di);
    el.t.setAttribute("datetime",o.hour+":"+o.minute+":"+o.second);
  }
  (function loop(){tick();setTimeout(loop,1000-Date.now()%1000+4)})();

  // staggered reveal on load / scroll
  cards.forEach(function(c,i){c.classList.add("reveal");c.style.setProperty("--d",(i%3)*0.08+"s")});
  if("IntersectionObserver" in window){
    var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target)}})},{threshold:.12});
    cards.forEach(function(c){io.observe(c)});
  }else cards.forEach(function(c){c.classList.add("in")});

  // glass spotlight follows the pointer inside each card + soft page halo
  var halo=document.getElementById("halo");
  cards.forEach(function(c){
    c.addEventListener("pointermove",function(e){
      var r=c.getBoundingClientRect();
      c.style.setProperty("--mx",(e.clientX-r.left)+"px");c.style.setProperty("--my",(e.clientY-r.top)+"px");
    });
  });
  if(!calm){
    addEventListener("pointermove",function(e){
      if(e.pointerType==="touch")return;
      halo.style.opacity=1;halo.style.transform="translate("+e.clientX+"px,"+e.clientY+"px)";
    });
    document.addEventListener("pointerleave",function(){halo.style.opacity=0});
  }

  // click ripple on links, games and chips
  [].slice.call(document.querySelectorAll(".linklist a,.game,.chip")).forEach(function(el){
    if(getComputedStyle(el).position==="static")el.style.position="relative";
    el.style.overflow="hidden";
    el.addEventListener("pointerdown",function(e){
      var r=el.getBoundingClientRect(),d=Math.max(r.width,r.height)*2,x=document.createElement("span");
      x.className="rip";x.style.width=x.style.height=d+"px";
      x.style.left=(e.clientX-r.left-d/2)+"px";x.style.top=(e.clientY-r.top-d/2)+"px";
      el.appendChild(x);setTimeout(function(){x.remove()},650);
    });
  });

  // 3D tilt
  var av=document.getElementById("avatar");
  if(!calm){
    av.addEventListener("pointermove",function(e){
      if(e.pointerType==="touch")return;
      var r=av.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;
      av.style.transform="rotateY("+((x-.5)*18)+"deg) rotateX("+((.5-y)*18)+"deg) scale(1.04)";
      av.style.setProperty("--gx",x*100+"%");av.style.setProperty("--gy",y*100+"%");
    });
    av.addEventListener("pointerleave",function(){av.style.transform=""});
  }

  // Easter eggs
  function sparks(cx,cy,cols){
    var c=cols||["#a78bfa","#5b5fc7","#c4b5fd","#6ee7b7"];
    for(var i=0;i<24;i++){
      var d=document.createElement("div");d.className="spark";
      d.style.left=cx+"px";d.style.top=cy+"px";d.style.background=c[i%4];
      document.body.appendChild(d);
      var a=Math.random()*6.28,v=60+Math.random()*120;
      d.animate([{transform:"translate(0,0) rotate(0)",opacity:1},{transform:"translate("+Math.cos(a)*v+"px,"+(Math.sin(a)*v+80)+"px) rotate(360deg)",opacity:0}],{duration:900,easing:"ease-out"}).onfinish=(function(n){return function(){n.remove()}})(d);
    }
  }
  function fly(emoji,top){
    var f=document.createElement("div");f.className="fly";f.textContent=emoji;f.style.top=top+"px";
    document.body.appendChild(f);setTimeout(function(){f.remove()},3300);
  }
  // 1) click avatar 5 times
  var clicks=0,ct;
  av.addEventListener("click",function(e){
    clicks++;clearTimeout(ct);ct=setTimeout(function(){clicks=0},1200);
    if(clicks===5){clicks=0;sparks(e.clientX,e.clientY);say("⚔ Blade unsheathed. Nice reflexes.")}
  });
  // 2) Konami code → Nova shift
  var kon=[38,38,40,40,37,39,37,39,66,65],ki=0,hue=false;
  // 3) type words
  var buf="";
  addEventListener("keydown",function(e){
    var tg=e.target;if(tg&&(tg.tagName==="TEXTAREA"||tg.tagName==="INPUT"||tg.isContentEditable))return;
    ki=(e.keyCode===kon[ki])?ki+1:(e.keyCode===kon[0]?1:0);
    if(ki===kon.length){ki=0;hue=!hue;document.documentElement.style.filter=hue?"hue-rotate(140deg) saturate(1.2)":"";say(hue?"✨ Nova Shift activated":"Back to Midnight Nova")}
    if(e.key.length===1){
      buf=(buf+e.key.toLowerCase()).slice(-8);
      if(buf.slice(-4)==="tank"){fly("🛡",120);say("Attack the D point!")}
      if(buf.slice(-5)==="nitro"){fly("🏎💨",260);say("Asphalt: nitro engaged!")}
      if(buf.slice(-5)==="creep"){say("ssssSSSS… 💥 just kidding")}
    }
  });
  // 4) tap the version 3 times
  var vt=0;
  document.getElementById("ver").addEventListener("click",function(){
    if(++vt===3){vt=0;say("Dev mode: the real treasure was the friends we made")}
  });
  // 6) tap the clock's colon 3 times: secret Moonlight Sparkle theme (tap 3 more to leave)
  var sk=document.getElementById("sparkle"),skBuilt=false,prevTheme="midnight",cc=0,cct;
  function buildSparkle(){
    if(skBuilt)return;skBuilt=true;
    for(var i=0;i<44;i++){
      var d=document.createElement("i"),z=1+Math.random()*2.6;
      if(i%7===0){d.className="s4";z=9+Math.random()*9}
      d.style.cssText="left:"+Math.random()*100+"%;top:"+Math.random()*100+"%;--z:"+z+"px;--t:"+(2.5+Math.random()*4)+"s;--dl:-"+Math.random()*6+"s";
      sk.appendChild(d);
    }
  }
  // ---- MOONLIGHT SPARKLE: only 8 PM to 5 AM IST. A crescent moon appears; click it to switch the theme on/off.
  var moon=document.getElementById("moonBtn"),moonT;
  function istNow(){var q=Date.now()+19800000;return{q:q,m:Math.floor(q/60000)%1440}}   // IST = UTC+5:30, no DST
  function inNight(){var m=istNow().m;return m>=1200||m<300}
  function nightId(){var n=istNow();return new Date(n.q-(n.m<300?864e5:0)).toISOString().slice(0,10)}
  function saveNight(){try{localStorage.setItem("mb-moon",nightId())}catch(e){}}
  try{var st=localStorage.getItem("mb-theme");if(st&&st!=="moonlight"&&names[st])prevTheme=st}catch(e){}
  if(cur==="moonlight")buildSparkle();
  function moonOn(x,y){
    if(cur==="moonlight")return;
    prevTheme=cur;buildSparkle();swap("moonlight",false);saveNight();
    sparks(x,y,["#c9b8ff","#7B337E","#6667AB","#ffffff"]);
    say("\uD83C\uDF19 Moonlight Sparkle on, until 5 AM IST \u2728");
  }
  function moonOff(){if(cur==="moonlight")swap(prevTheme,false)}
  function toggleMoon(x,y){if(cur==="moonlight")moonOff();else moonOn(x,y)}
  function syncMoon(){
    if(inNight()){
      if(moon.hidden){moon.hidden=false;root.classList.add("moon-on");void moon.offsetWidth;moon.classList.add("show")}
    }else{
      if(cur==="moonlight"){swap(prevTheme,false);say("\uD83C\uDF05 Moonlight faded with the night")}
      if(!moon.hidden){moon.classList.remove("show");root.classList.remove("moon-on");setTimeout(function(){if(!inNight())moon.hidden=true},calm?0:700)}
    }
    moon.setAttribute("aria-pressed",cur==="moonlight");
  }
  function nextEdge(){var n=istNow(),t=(n.m>=1200||n.m<300)?300:1200,d=(t-n.m+1440)%1440||1440;return d*60000-n.q%60000+500}
  function plan(){clearTimeout(moonT);syncMoon();moonT=setTimeout(plan,Math.min(nextEdge(),2147483000))}
  moon.addEventListener("click",function(e){var r=moon.getBoundingClientRect();toggleMoon(e.clientX||r.left+r.width/2,e.clientY||r.top+r.height/2)});
  document.addEventListener("visibilitychange",function(){if(!document.hidden)plan()});
  addEventListener("pageshow",plan);
  plan();
  // the secret still works: tap the clock's colon 3 times, but only while the moon is out
  document.getElementById("ck-time").addEventListener("click",function(e){
    if(!e.target.classList.contains("colon"))return;
    cc++;clearTimeout(cct);cct=setTimeout(function(){cc=0},1500);
    if(cc<3)return;cc=0;
    if(!inNight()){say("\uD83C\uDF19 Moonlight only shines from 8 PM to 5 AM IST");return}
    toggleMoon(e.clientX,e.clientY);
  });
  // 5) console
  console.log("%cItzMasterBlade","font:700 20px monospace;color:#a78bfa","\nPsst… try the Konami code, or type: tank, nitro");
})();
