/* ===================== PIXEL WORLD ===================== */
(function(){
"use strict";
var stage=document.getElementById("pwStage"),cv=document.getElementById("pwCanvas");
if(!stage||!cv||!cv.getContext)return;
var ctx=cv.getContext("2d",{alpha:false}),lc=document.createElement("canvas"),lx=lc.getContext("2d");
var htmlEl=document.documentElement,KEY="mb-pixelworld-v1",$=function(i){return document.getElementById(i)};
var mqCalm=window.matchMedia("(prefers-reduced-motion: reduce)");

/* ---------- utils ---------- */
function clamp(v,a,b){return v<a?a:v>b?b:v}
function lerp(a,b,t){return a+(b-a)*t}
function smooth(a,b,x){var t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t)}
function hx(h){h=(h||"").trim();var m;if(h.charAt(0)==="#"){if(h.length===4)return[parseInt(h[1]+h[1],16),parseInt(h[2]+h[2],16),parseInt(h[3]+h[3],16)];return[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]}
  m=h.match(/rgba?\(([^)]+)\)/);if(m){var p=m[1].split(",");return[+p[0],+p[1],+p[2]]}return null}
function mix(a,b,t){return[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t,a[2]+(b[2]-a[2])*t]}
function css(c,a){var r=Math.round(c[0]),g=Math.round(c[1]),b=Math.round(c[2]);return a==null?"rgb("+r+","+g+","+b+")":"rgba("+r+","+g+","+b+","+a+")"}
function hash(n){var s=Math.sin(n*127.1+311.7)*43758.5453;return s-Math.floor(s)}
function rng(seed){return function(){seed|=0;seed=seed+0x6D2B79F5|0;var t=Math.imul(seed^seed>>>15,1|seed);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function R(x,y,w,h,c){ctx.fillStyle=c;ctx.fillRect(Math.round(x),Math.round(y),w,h)}

/* ---------- tiny 3x5 pixel font ---------- */
var FD={A:"010101111101101",B:"110101110101110",C:"011100100100011",D:"110101101101110",E:"111100110100111",F:"111100110100100",G:"011100101101011",H:"101101111101101",I:"111010010010111",J:"001001001101010",K:"101101110101101",L:"100100100100111",M:"101111111101101",N:"110101101101101",O:"010101101101010",P:"110101110100100",Q:"010101101111011",R:"110101110101101",S:"011100010001110",T:"111010010010010",U:"101101101101111",V:"101101101101010",W:"101101111111101",X:"101101010101101",Y:"101101010010010",Z:"111001010100111",
"0":"111101101101111","1":"010110010010111","2":"110001010100111","3":"110001010001110","4":"101101111001001","5":"111100110001110","6":"011100111101111","7":"111001010010010","8":"111101111101111","9":"111101111001110",
"/":"001001010100100",":":"000010000010000","-":"000000111000000",".":"000000000000010","!":"010010010000010","?":"110001010000010","+":"000010111010000",">":"100010001010100","<":"001010100010001","*":"101010111010101","#":"101111111010010"," ":"000000000000000"};
function txt(s,x,y,c){s=String(s).toUpperCase();ctx.fillStyle=c;x=Math.round(x);y=Math.round(y);
  for(var i=0;i<s.length;i++){var g=FD[s.charAt(i)];if(!g)continue;for(var k=0;k<15;k++)if(g.charAt(k)==="1")ctx.fillRect(x+i*4+k%3,y+((k/3)|0),1,1)}}
function txtW(s){return String(s).length*4-1}

/* ---------- icons (7x7 bitmaps) ---------- */
var IC={sun:["...#...",".#...#.","..###..","#.###.#","..###..",".#...#.","...#..."],
moon:["..###..",".##....","##.....","##.....","##.....",".##....","..###.."],
cloud:[".......","..###..",".#####.","#######","#######",".......","......."],
book:[".##.##.","#..#..#","#..#..#","#..#..#","#..#..#",".##.##.","......."],
snd:["...#...","..##.#.","###..#.","###..#.","###..#.","..##.#.","...#..."],
mute:["...#...","..##...","###.#.#","###..#.","###.#.#","..##...","...#..."],
exp:["###.###","#.....#","#.....#",".......","#.....#","#.....#","###.###"],
col:["..#.#..","..#.#..","###.###",".......","###.###","..#.#..","..#.#.."],
gem:["..###..",".#####.","#######",".#####.","..###..","...#...","......."],
cal:["#######","#.....#","#.###.#","#.#.#.#","#.###.#","#.....#","#######"]};
function icon(n,sz){var b=IC[n],s='<svg viewBox="0 0 7 7" width="'+(sz||16)+'" height="'+(sz||16)+'" shape-rendering="crispEdges" fill="currentColor" aria-hidden="true">';
  for(var y=0;y<7;y++)for(var x=0;x<7;x++)if(b[y].charAt(x)==="#")s+='<rect x="'+x+'" y="'+y+'" width="1" height="1"/>';return s+"</svg>"}

/* ---------- persistence ---------- */
var S={items:{},disc:{},x:70,tod:.34,tm:0,wm:0,snd:0,calm:0,fire:0,books:0,secret:0,portal:0,chest:0,wxSeen:{},plays:0};
(function(){try{var j=JSON.parse(localStorage.getItem(KEY)||"null");if(j&&typeof j==="object")for(var k in j)if(k in S)S[k]=j[k]}catch(e){}
  if(!S.items||typeof S.items!=="object")S.items={};if(!S.disc||typeof S.disc!=="object")S.disc={};if(!S.wxSeen||typeof S.wxSeen!=="object")S.wxSeen={}})();
var saveDirty=false;
function save(){saveDirty=false;try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}}
function dirty(){saveDirty=true}

/* ---------- world themes ---------- */
var PROF={
midnight:{dT:"#4f9bf0",dB:"#bfe6ff",nT:"#0b1240",nB:"#2a3a8a",twi:"#ff9a6a",gr:"#58b05f",gr2:"#3f8f4c",soil:"#6a4934",soil2:"#55392a",leaf:"#3d9156",leaf2:"#62bb70",trunk:"#6b4a32",m1:"#8aa8e0",m2:"#6aa58f",m3:"#3a7f55",roof:"#b5483f",wx:[6,2,.7,0,1]},
onyx:{dT:"#7d869b",dB:"#d5d9e3",nT:"#0a0a10",nB:"#232331",twi:"#e7b48d",gr:"#7d9a80",gr2:"#647f69",soil:"#4f4943",soil2:"#3d3833",leaf:"#5f7c66",leaf2:"#86a58d",trunk:"#5a4f46",m1:"#9aa0b3",m2:"#7f8c86",m3:"#566660",roof:"#6d6d78",wx:[4,3,1,0,3]},
starlight:{dT:"#8cc3ff",dB:"#fdf4ff",nT:"#3a3f86",nB:"#8a86d8",twi:"#ffb4cf",gr:"#7fd08c",gr2:"#5fb872",soil:"#8c6a55",soil2:"#755542",leaf:"#5fbf7e",leaf2:"#9be0aa",trunk:"#8c6a55",m1:"#b8c6f5",m2:"#96d6b8",m3:"#6cb88c",roof:"#e0708f",wx:[8,2,0,0,1]},
halloween:{dT:"#c7773a",dB:"#ffd9a0",nT:"#1d0d14",nB:"#5a2a18",twi:"#ff6a2b",gr:"#b07a35",gr2:"#8c5a22",soil:"#55301f",soil2:"#40251a",leaf:"#c4601a",leaf2:"#eaa03c",trunk:"#4a2c1c",m1:"#c38a5a",m2:"#8a5a3a",m3:"#4f2f20",roof:"#5a2d4a",fall:1,pumpkin:1,bats:1,wx:[4,2,2,0,3]},
eclipse:{dT:"#7a1a1f",dB:"#e8837a",nT:"#1c0003",nB:"#650a10",twi:"#ff4a3a",gr:"#8a4a3a",gr2:"#6e3a2f",soil:"#4a2020",soil2:"#3a1818",leaf:"#7a3030",leaf2:"#b2504a",trunk:"#3a1a1a",m1:"#b25a5a",m2:"#7a3a40",m3:"#4a2028",roof:"#3a1a28",eclipse:1,wx:[4,1,2,0,3]},
frost:{dT:"#7ccdf5",dB:"#eefaff",nT:"#05202e",nB:"#1d5575",twi:"#ffc6a0",gr:"#a8cdd0",gr2:"#85b0b8",soil:"#5b6f78",soil2:"#475a63",leaf:"#2f7f8f",leaf2:"#bfe9ff",trunk:"#4d5560",m1:"#b6defa",m2:"#8fc1d8",m3:"#5b95aa",roof:"#4a7a9a",snowy:1,aur:1,wx:[3,0,0,6,2]},
forest:{dT:"#4cb98a",dB:"#d3f7e2",nT:"#04160f",nB:"#14442d",twi:"#ffc96a",gr:"#3a9a5f",gr2:"#2b7f4b",soil:"#4f3a2a",soil2:"#3d2d21",leaf:"#1f6b45",leaf2:"#3fae78",trunk:"#5a3d28",m1:"#7fcaa8",m2:"#4fa77d",m3:"#2f7a55",roof:"#7a5a3a",ff:1,wx:[3,3,1,0,4]},
moonlight:{dT:"#3a1a6a",dB:"#b48ae0",nT:"#14042a",nB:"#4c1f70",twi:"#e8a0ff",gr:"#7a68b8",gr2:"#6454a0",soil:"#3f2f5a",soil2:"#30244a",leaf:"#5a4a9a",leaf2:"#8a78d8",trunk:"#4a3a68",m1:"#7a60b8",m2:"#5a4898",m3:"#3a2e70",roof:"#8a4a9a",night:1,aur:1,wx:[6,1,0,0,2]}};
var PK=["dT","dB","nT","nB","twi","gr","gr2","soil","soil2","leaf","leaf2","trunk","m1","m2","m3","roof"];
var TH=null,themeName="midnight",ACC=[167,139,250],ACC2=[34,211,238],ACC3=[236,72,153];
function readTheme(){
  var n=htmlEl.getAttribute("data-theme")||"midnight";if(!PROF[n])n="midnight";themeName=n;var p=PROF[n];TH={n:n,wx:p.wx,fall:p.fall,pumpkin:p.pumpkin,bats:p.bats,eclipse:p.eclipse,snowy:p.snowy,aur:p.aur,ff:p.ff,night:p.night};
  for(var i=0;i<PK.length;i++)TH[PK[i]]=hx(p[PK[i]]);
  var cs=getComputedStyle(htmlEl);ACC=hx(cs.getPropertyValue("--violet"))||ACC;ACC2=hx(cs.getPropertyValue("--a3"))||ACC2;ACC3=hx(cs.getPropertyValue("--a4"))||ACC3;
}
readTheme();

/* ---------- discoveries ---------- */
var DISC=[["first","First Steps","You wandered out into the meadow.","Try moving around."],
["sign","Trail Reader","The signpost knows where everything is.","Something near the start has directions."],
["cat","Good Kitty","The meadow cat tolerates your affection.","Something furry roams near the cabin."],
["ring","Fairy Ring","A circle of mushrooms hums softly.","Mushrooms rarely grow in circles by accident."],
["cabin","Cabin Fever","A cosy cabin with a crackly hearth.","Doors are meant to be opened."],
["fire","Hearth and Home","You lit the fireplace.","It is chilly inside."],
["secret","Behind the Books","The bookshelf hides a secret room.","Three red spines look suspicious."],
["chest","Treasure!","The old chest held a rune and a gem.","Secret rooms often hold chests."],
["bed","Sweet Dreams","You slept until dawn.","The bed looks inviting."],
["desk","Boot Sequence","The workstation hums to life.","A glowing monitor under a canopy."],
["theme","Theme Hacker","You re-themed the whole site from a terminal.","Terminals do more than talk."],
["dot","Hidden Files","A dotfile hid a rune.","Some files do not show in a plain ls."],
["duck","Rubber Duck Debugging","You explained your code to a duck.","A yellow friend sits on the desk."],
["portal","Awakened","The ring burns with three runes.","Three slots, three runes."],
["void","Into the Void","You crossed the glitching void.","Step through once it wakes."],
["scope","Stargazer","You peered through the telescope.","Telescopes work best after dark."],
["const","The Blade Constellation","Five glints, one sword in the sky.","Find every glint through the lens."],
["wish","Wish Upon a Star","You made a wish on a shooting star.","Watch the night sky."],
["fish","Gone Fishin'","You cast a line from the pier.","The pond has a pier."],
["wx","Weather Watcher","You have seen three kinds of weather.","Be patient, or press G."],
["skin","Hero Statue","The statue points to the skin viewer.","Someone built a statue in the meadow."],
["retro","Retro Mode","You entered the old code. Everything is green.","Up up down down left right left right B A"]];
var DI={};DISC.forEach(function(d,i){DI[d[0]]=i});

/* ---------- terrain ---------- */
var WW=2200,G=new Float32Array(WW+2);
(function(){
  var zones=[[200,420],[520,790],[1040,1180],[1480,1960]];
  for(var i=0;i<=WW+1;i++){var x=i,mask=0;
    for(var z=0;z<zones.length;z++){var m=smooth(zones[z][0]-40,zones[z][0],x)*(1-smooth(zones[z][1],zones[z][1]+40,x));if(m>mask)mask=m}
    var y=150+(Math.sin(x*.011)*3+Math.sin(x*.027+2)*1.6+Math.sin(x*.005+1)*3)*(1-mask);
    var d=Math.abs(x-945)/70;if(d<1)y+=6*(Math.cos(d*Math.PI)+1)/2;
    y-=34*smooth(1330,1500,x)*(1-smooth(1960,2120,x));
    G[i]=y}
})();
function gyAt(x){return G[clamp(Math.round(x),0,WW)]}
var SW={world:WW,cabin:400,vd:640},scene="world";
function sw(){return scene==="world"?WW:scene==="cabin"?400:640}

/* ---------- platforms (one-way) ---------- */
var PL={world:[],cabin:[],vd:[]};
function pl(sc,x,y,w,o){var p={x:x,y:y,w:w,cx:x,dx:0};if(o)for(var k in o)p[k]=o[k];PL[sc].push(p);return p}
(function(){
  var g=gyAt(108);pl("world",96,g-22,24,{k:"stone"});pl("world",134,g-42,24,{k:"stone"});pl("world",172,g-62,24,{k:"stone"});
  pl("world",248,Math.round(gyAt(255))-14,14,{k:"crate"});pl("world",274,150-40,52,{k:"roof"});
  pl("world",600,150-16,14,{k:"crate"});pl("world",612,150-36,52,{k:"roof"});
  pl("world",868,Math.round(gyAt(868)),54,{k:"pier"});
  pl("world",1066,150-20,10,{k:"pillar"});pl("world",1146,150-30,10,{k:"pillar"});
  var og=116;pl("world",1754,og-26,52,{k:"balc"});pl("world",1806,og-46,14,{k:"ledge"});pl("world",1772,og-62,16,{k:"dome"});
  pl("world",1950,96,20,{k:"cloud"});pl("world",1985,78,20,{k:"cloud"});pl("world",2020,60,26,{k:"cloud"});
  pl("vd",0,150,70,{k:"cry"});pl("vd",96,140,30,{k:"cry"});pl("vd",152,124,30,{k:"cry"});pl("vd",208,108,26,{k:"cry"});
  pl("vd",244,100,26,{k:"cry",mv:{r:40,s:.9,ph:0},bx:262});
  pl("vd",332,100,30,{k:"cry"});pl("vd",388,116,26,{k:"cry"});pl("vd",440,132,30,{k:"cry"});pl("vd",376,80,20,{k:"cry"});pl("vd",494,140,50,{k:"cry"});
})();

/* ---------- collectibles ---------- */
var ITEMS=[];
function it(id,t,sc,x,y,v){ITEMS.push({id:id,t:t,sc:sc,x:x,y:y,v:v||0})}
(function(){
  var wc=[[130,14],[236,12],[420,12],[510,12],[590,12],[705,12],[800,12],[860,12],[1010,12],[1230,12],[1360,12],[1560,12],[1660,12],[1900,12]];
  wc.forEach(function(c,i){it("c"+i,"coin","world",c[0],gyAt(c[0])-c[1])});
  it("c_roof","coin","world",300,150-40-14);it("c_camp","coin","world",654,150-36-14);it("c_pond","coin","world",945,gyAt(945)-34);it("c_obs","coin","world",1766,116-26-14);
  it("g_cabin","gem","world",318,150-40-14);it("g_camp","gem","world",624,150-36-14);it("g_pillar","gem","world",1151,150-30-14);it("g_dome","gem","world",1780,116-62-14);it("g_sky","gem","world",2033,60-14);
  it("r_stairs","rune","world",184,gyAt(108)-62-14);
  it("c_cab1","coin","cabin",128,112);it("c_cab2","coin","cabin",70,136);
  it("c_v1","coin","vd",111,126);it("c_v2","coin","vd",167,110);it("c_v3","coin","vd",221,94);it("c_v4","coin","vd",401,102);it("c_v5","coin","vd",455,118);
  it("g_void","gem","vd",347,86);it("s_void","star","vd",386,64);
  it("r_chest","rune","cabin",0,0,1);it("g_chest","gem","cabin",0,0,1);it("r_term","rune","world",0,0,1);it("s_const","star","world",0,0,1);it("s_wish","star","world",0,0,1);
})();
function total(){return ITEMS.length}
function found(){var n=0;for(var i=0;i<ITEMS.length;i++)if(S.items[ITEMS[i].id])n++;return n}
function runes(){var n=0;for(var i=0;i<ITEMS.length;i++)if(ITEMS[i].t==="rune"&&S.items[ITEMS[i].id])n++;return n}
function kinds(t){var a=0,b=0;for(var i=0;i<ITEMS.length;i++)if(ITEMS[i].t===t){a++;if(S.items[ITEMS[i].id])b++}return[b,a]}
function discCount(){var n=0;for(var i=0;i<DISC.length;i++)if(S.disc[DISC[i][0]])n++;return n}

/* ---------- player / state ---------- */
var P={x:70,y:150,vx:0,vy:0,face:1,gr:true,coy:0,jb:0,drop:0,t:0,land:0,on:null,safe:{x:70,y:150},moved:0};
var K={l:0,r:0,d:0,run:0,jump:0,act:0},jumpHeld=false,actQ=0;
var T=0,mode="play",uiOpen="",expanded=false,paused=false,started=false,focused=false;
var cam={x:0,oy:0,tx:0,sh:0},VW=320,VH=180,SC=3;
var FADE={a:0,dir:0,cb:null};
var PT=[];
function calm(){return mqCalm.matches||!!S.calm}

/* ---------- particles ---------- */
function spawn(k,x,y,o){if(PT.length>260)PT.shift();var p={k:k,x:x,y:y,vx:0,vy:0,l:0,m:60,c:"#fff",s:1,g:0};if(o)for(var q in o)p[q]=o[q];PT.push(p)}
function burst(x,y,cols,n,sp){if(calm())n=Math.ceil(n/3);for(var i=0;i<n;i++){var a=Math.random()*6.283,v=.4+Math.random()*(sp||1.6);spawn("sp",x,y,{vx:Math.cos(a)*v,vy:Math.sin(a)*v-.6,g:.05,m:34+Math.random()*24,c:cols[i%cols.length]})}}
function ftxt(s,x,y,c){spawn("tx",x,y,{s:s,vy:-.35,m:56,c:c||"#fff"})}

/* ---------- dialog / hud ---------- */
var sayEl=$("pwSay"),sayT=0,promptEl=$("pwPrompt");
function say(h,ms){sayEl.innerHTML=h;sayEl.hidden=false;clearTimeout(sayT);sayT=setTimeout(function(){sayEl.hidden=true},ms||3600);
  sayEl.style.animation="none";void sayEl.offsetWidth;sayEl.style.animation=""}
function esc(s){return String(s).replace(/[&<>]/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;"}[c]})}
function discover(id){if(S.disc[id])return false;S.disc[id]=1;var d=DISC[DI[id]];dirty();sfx("disc");
  say("<b>&#9670; Discovery:</b> "+esc(d[1])+"<br>"+esc(d[2]),4200);var c=$("pwCount");c.classList.remove("pop");void c.offsetWidth;c.classList.add("pop");hudDirty=true;checkDone();return true}
var doneShown=false;
function checkDone(){if(found()>=total()&&discCount()>=DISC.length&&!doneShown){doneShown=true;setTimeout(function(){say("<b>&#9733; 100%!</b> Every collectible and every secret. You have seen it all. Thanks for playing!",7000);burst(P.x,P.y-10,["#ffd54a","#fff","#ff7ab8","#7af0ff"],40,2.4);sfx("win")},1500)}}
var hudDirty=true;
function collect(id,x,y){var f=null;for(var i=0;i<ITEMS.length;i++)if(ITEMS[i].id===id){f=ITEMS[i];break}
  if(!f||S.items[id])return false;S.items[id]=1;dirty();hudDirty=true;
  var nm={coin:"+1 coin",gem:"+1 GEM",rune:"RUNE "+runes()+"/3",star:"STAR!"}[f.t],cl={coin:["#ffd54a","#fff3b0"],gem:["#7af0ff","#fff","#ff7ab8"],rune:[css(ACC),"#fff"],star:["#fff7a0","#ffd54a"]}[f.t];
  x=x==null?f.x:x;y=y==null?f.y:y;burst(x,y,cl,f.t==="coin"?10:22,f.t==="coin"?1.2:2);ftxt(nm,x,y-8,f.t==="coin"?"#ffd54a":"#fff");sfx(f.t);
  var c=$("pwCount");c.classList.remove("pop");void c.offsetWidth;c.classList.add("pop");checkDone();return true}

/* ---------- time + weather ---------- */
var PAL={L:1,tw:0,top:[0,0,0],bot:[0,0,0],da:0,wa:0,s:1};
var WXN=["clear","rain","storm","snow","fog"],WX={cur:0,k:[1,0,0,0,0],cover:0,t:22,fl:0,lt:6,dim:0};
var fIST=null,istV=0,istT=0;
try{fIST=new Intl.DateTimeFormat("en-GB",{timeZone:"Asia/Kolkata",hourCycle:"h23",hour:"2-digit",minute:"2-digit",second:"2-digit"})}catch(e){}
function istTod(){var n=Date.now();if(n-istT>1000){istT=n;if(fIST){var o={};fIST.formatToParts(new Date(n)).forEach(function(x){o[x.type]=+x.value});istV=((o.hour||0)+(o.minute||0)/60+(o.second||0)/3600)/24}else{var d=new Date();istV=(d.getHours()+d.getMinutes()/60)/24}}return istV}
function updTime(dt){
  var tg=null;if(TH.night)tg=0;else if(S.tm===1)tg=istTod();else if(S.tm===2)tg=.5;else if(S.tm===3)tg=0;
  if(tg==null)S.tod=(S.tod+dt/60/(calm()?960:240))%1;
  else{var d=((tg-S.tod+1.5)%1)-.5;S.tod=(S.tod+d*Math.min(1,dt*.02)+1)%1}
}
function updWeather(dt){
  if(S.wm>0)WX.cur=S.wm-1;
  else{WX.t-=dt/60;if(WX.t<=0){var w=TH.wx,s=0,i;for(i=0;i<5;i++)s+=w[i];var r=Math.random()*s,n=0;for(i=0;i<5;i++){r-=w[i];if(r<=0){n=i;break}}WX.cur=n;WX.t=40+Math.random()*70}}
  var sp=Math.min(1,dt*.012);for(var i=0;i<5;i++){WX.k[i]+=((i===WX.cur?1:0)-WX.k[i])*sp;if(WX.k[i]>.7&&!S.wxSeen[i]){S.wxSeen[i]=1;dirty();var c=0;for(var q in S.wxSeen)c++;if(c>=3)discover("wx")}}
  WX.dim=Math.max(WX.k[1]*.55,WX.k[2]*.85,WX.k[3]*.35,WX.k[4]*.45);
  if(WX.k[3]>.4)WX.cover=Math.min(1,WX.cover+dt*.0005);else WX.cover=Math.max(TH.snowy?.5:0,WX.cover-dt*.0003);
  if(TH.snowy&&WX.cover<.5)WX.cover=.5;
  WX.fl*=Math.pow(.9,dt);
  if(WX.k[2]>.6&&!calm()){WX.lt-=dt/60;if(WX.lt<=0){WX.lt=4+Math.random()*9;WX.fl=1;setTimeout(function(){sfx("thunder")},350+Math.random()*500)}}
}
function calcPal(){
  var s=Math.sin((S.tod-.25)*6.28318),L=smooth(-.14,.34,s),tw=Math.max(0,1-Math.abs(s-.04)/.38);PAL.L=L;PAL.tw=tw;PAL.s=s;
  var top=mix(TH.nT,TH.dT,L),bot=mix(TH.nB,TH.dB,L);
  top=mix(top,mix(top,TH.twi,.5),tw);bot=mix(bot,TH.twi,tw*.8);
  var g=[96,104,120],d=WX.dim*(.3+.7*L)*.8;top=mix(top,g,d*.7);bot=mix(bot,g,d);
  PAL.top=top;PAL.bot=bot;PAL.da=(1-L)*.56+WX.k[2]*.07;PAL.wa=tw*.14;
}

/* ---------- scenes / fade ---------- */
function camSnap(){cam.ref=P.y;camUpdate(1,true)}
function goScene(name,x,y,msg,after){
  if(FADE.dir)return;FADE.dir=1;
  FADE.cb=function(){scene=name;P.x=x;P.y=y;P.vx=0;P.vy=0;P.on=null;P.gr=false;P.coy=0;P.drop=0;P.safe={x:x,y:y};PT.length=0;camSnap();if(msg)say(msg);if(after)after();sfx("door")}}
function respawn(){if(scene==="vd"){P.x=36;P.y=150;P.vx=P.vy=0;P.on=null;P.gr=false;say("The void gives you back.",2200);camSnap()}
  else if(scene==="cabin"){P.x=32;P.y=150;P.vx=P.vy=0;camSnap()}
  else{P.x=70;P.y=gyAt(70);P.vx=P.vy=0;P.on=null;camSnap();say("Back at the start.",1800)}}
function cycleTime(){S.tm=(S.tm+1)%4;dirty();say("<b>Time:</b> "+["day-night cycle","synced to site clock (IST)","locked to day","locked to night"][S.tm]+(TH.night?"<br>(Moonlight theme keeps the sky dark)":""),2400);hudDirty=true;uiBtns()}
function cycleWx(){S.wm=(S.wm+1)%6;dirty();say("<b>Weather:</b> "+["auto","clear","rain","storm","snow","fog"][S.wm],2000);hudDirty=true;uiBtns()}

/* ---------- objects (interactions) ---------- */
var OB=[],CAT={x:196,dir:1,st:"sit",t:2,f:0},wishT=0;
function ob(id,sc,x,r,lab,act,o){var q={id:id,sc:sc,x:x,r:r,lab:lab,act:act};if(o)for(var k in o)q[k]=o[k];OB.push(q);return q}
function toEl(sel){if(expanded)setExpanded(false);setTimeout(function(){var e=document.querySelector(sel);if(e)e.scrollIntoView({behavior:calm()?"auto":"smooth",block:"center"})},expanded?300:700)}
var FISH=["a shiny minnow","an old boot","a very small trout","a rubber duck (not THE duck)","a glowing koi","a soggy pixel","nothing. Peaceful, though"];
ob("sign","world",96,16,"Read signpost",function(){say("<b>SIGNPOST</b><br>&rarr; Cabin &middot; Statue &middot; Dev camp<br>&rarr;&rarr; Pond &middot; Portal ruins &middot; Observatory");discover("sign")});
ob("cat","world",CAT.x,16,"Pet the cat",function(){burst(CAT.x,gyAt(CAT.x)-14,["#ff7ab8","#ffb3d1"],8,.8);for(var i=0;i<3;i++)spawn("ht",CAT.x+(i-1)*4,gyAt(CAT.x)-14-i*3,{vy:-.3,m:50+i*8});
  say(["Purrrr.","The cat blinks slowly. That means trust.","Mrrp!"][(Math.random()*3)|0],1800);sfx("meow");discover("cat");CAT.st="sit";CAT.t=4});
ob("cabinDoor","world",300,11,"Enter cabin",function(){discover("cabin");goScene("cabin",34,150)});
ob("statue","world",440,14,"Examine statue",function(){say("<b>A statue of a blocky hero.</b><br>Its plaque points to the Fitcheck skin viewer below...",3600);discover("skin");toEl(".fitcheck")});
ob("ring","world",486,15,"Step into the ring",function(){var y=gyAt(486);burst(486,y-6,["#ff7ab8","#fff","#c9b8ff"],20,1);for(var i=0;i<8;i++)spawn("ff",486+(Math.random()-.5)*26,y-4-Math.random()*14,{m:260,vy:-.05});say("The mushrooms glow. Tiny lights drift up around you.",3200);sfx("magic");discover("ring")});
ob("desk","world",636,13,"Boot workstation",function(){discover("desk");openTerm()});
ob("duck","world",655,5,"Talk to the duck",function(){say("Quack. You explain your whole function aloud to the duck... and spot the bug.",3400);sfx("quack");discover("duck")});
ob("camp","world",706,14,"Warm up by the fire",function(){say(["You roast a marshmallow. Perfectly golden.","The fire crackles. Sparks drift into the night.","A log shifts and sends up a shower of embers."][(Math.random()*3)|0],2600);burst(706,gyAt(706)-12,["#ffb347","#ff6a2b","#fff3b0"],14,1.2);sfx("magic")});
ob("board","world",780,14,"Open project archive",function(){say("The billboard flips to <b>PROJECTS</b>. Scrolling you there...",2600);toEl(".projects")});
ob("pier","world",916,9,"Cast a line",function(){var f=FISH[(Math.random()*FISH.length)|0];say("You cast a line... and reel in "+f+".",3000);spawn("sp",918,150,{vy:-1.2,g:.05,m:30,c:"#9be7ff"});sfx("splash");discover("fish")},{y0:0,y1:156});
ob("portal","world",1110,26,function(){return S.portal?"Enter the portal":"Touch the ring ("+runes()+"/3 runes)"},function(){
  if(!S.portal){if(runes()<3){say("The ring is silent. Three rune slots glow faintly.<br><b>Runes found: "+runes()+"/3</b>",3400);sfx("deny")}
    else{S.portal=1;dirty();cam.sh=calm()?0:8;burst(1110,gyAt(1110)-30,[css(ACC),"#fff",css(ACC2)],44,2.6);sfx("portal");discover("portal");setTimeout(function(){say("The portal awakens. Step through when you are ready.",3200)},900)}}
  else goScene("vd",36,150,"The void hums. Platforms drift in the dark...",function(){discover("void")})});
ob("scope","world",1838,15,"Look through telescope",function(){if(PAL.L>.35){say("The sky is too bright to see stars.<br>Wait for dusk, or press <b>T</b> to change the time.",3400);sfx("deny")}else startScope()});
ob("obsDoor","world",1780,11,"Read the note",function(){say("<i>\"Back at dusk. Five glints make one story. The lens is outside.\"</i><br>&mdash; The Stargazer",4200)});
ob("exitCab","cabin",26,13,"Leave cabin",function(){goScene("world",300,gyAt(300))});
ob("bed","cabin",58,22,"Sleep until dawn",function(){if(FADE.dir)return;FADE.dir=1;FADE.cb=function(){S.tod=.27;if(S.tm>0)S.tm=0;dirty();PT.length=0;say("You wake up refreshed. A new day.");discover("bed");hudDirty=true}});
ob("note","cabin",128,12,"Read the note",function(){say("<i>\"Three red spines on the shelf. Pull them in order.\"</i>",3600)});
ob("hearth","cabin",208,17,function(){return S.fire?"Put out the fire":"Light the fire"},function(){S.fire=S.fire?0:1;dirty();sfx("magic");if(S.fire){burst(208,128,["#ffb347","#ff6a2b"],12,1);discover("fire")}else say("The embers fade.",1400)});
ob("shelf","cabin",240,16,function(){return S.secret?"The passage is open":"Pull a red book ("+S.books+"/3)"},function(){
  if(S.secret){say("The shelf has slid aside. A passage leads east.",2000);return}
  S.books++;dirty();sfx("click");
  if(S.books<3)say(["A dusty almanac slides out a little. Click.","Another red spine. Something deep in the wall clicks."][S.books-1],2200);
  else{S.secret=1;cam.sh=calm()?0:6;sfx("portal");burst(246,120,["#ffd54a","#fff"],20,1.4);say("The whole bookshelf rumbles aside, revealing a hidden room!",3600);discover("secret")}});
ob("chest","cabin",340,15,function(){return S.chest?"An empty chest":"Open the chest"},function(){
  if(S.chest){say("Empty. You already took the good stuff.",1800);return}
  S.chest=1;dirty();sfx("chest");collect("r_chest",340,120);setTimeout(function(){collect("g_chest",344,116)},350);discover("chest")},{ok:function(){return!!S.secret}});
ob("vdBack","vd",34,16,"Return to the meadow",function(){goScene("world",1110,gyAt(1110))});
ob("vdMono","vd",506,12,"Read the monolith",function(){var f=found(),t=total();say("<i>\"You crossed the void.\"</i><br>Collectibles: <b>"+f+"/"+t+"</b> &middot; Discoveries: <b>"+discCount()+"/"+DISC.length+"</b>",4200)});
ob("vdBack2","vd",526,12,"Return to the meadow",function(){goScene("world",1110,gyAt(1110))});

/* ---------- telescope ---------- */
var SCP={on:false,rx:0,ry:0,hit:[0,0,0,0,0],done:false,stars:[],t:0},GL=[[0,-44],[0,-22],[-20,-2],[20,-2],[0,30]];
(function(){var r=rng(77);for(var i=0;i<150;i++)SCP.stars.push([r()*2-1,r()*2-1,r()<.15?2:1,r()*6])})();
function startScope(){mode="scope";SCP.on=true;SCP.rx=0;SCP.ry=-30;SCP.hit=[0,0,0,0,0];SCP.done=!!S.items.s_const;if(SCP.done)SCP.hit=[1,1,1,1,1];discover("scope");
  say(SCP.done?"The Blade constellation shines again.":"Find the five hidden <b>glints</b>. Arrows move, <b>E</b> selects, <b>Esc</b> exits.",3600);sfx("magic");hudDirty=true}
function endScope(){mode="play";SCP.on=false;K.l=K.r=K.d=K.jump=0}
function scopeSel(){var best=-1,bd=64;for(var i=0;i<5;i++){var d=(GL[i][0]-SCP.rx)*(GL[i][0]-SCP.rx)+(GL[i][1]-SCP.ry)*(GL[i][1]-SCP.ry);if(!SCP.hit[i]&&d<bd){bd=d;best=i}}
  if(best<0){sfx("deny");return}SCP.hit[best]=1;sfx("star");var n=SCP.hit[0]+SCP.hit[1]+SCP.hit[2]+SCP.hit[3]+SCP.hit[4];
  if(n===5){SCP.done=true;setTimeout(function(){collect("s_const",P.x,P.y-16);discover("const");say("<b>The Blade constellation!</b> A star fragment falls into your hands.",4200)},500)}else say("Glint "+n+"/5",1200)}
function updScope(dt){SCP.t+=dt/60;var sp=1.5*dt,dx=(K.r?1:0)-(K.l?1:0),dy=(K.d?1:0)-(K.jump?1:0);if(K.run){sp*=1.8}
  SCP.rx=clamp(SCP.rx+dx*sp,-60,60);SCP.ry=clamp(SCP.ry+dy*sp,-60,60);if(actQ){actQ=0;scopeSel()}}

/* ---------- shooting stars ---------- */
var SS={on:false,x:0,y:0,vx:0,vy:0,l:0,t:12};
function updShoot(dt){if(SS.on){SS.x+=SS.vx*dt;SS.y+=SS.vy*dt;SS.l+=dt;if(SS.l>70)SS.on=false}
  if(wishT>0)wishT-=dt/60;
  if(PAL.L<.25&&mode==="play"&&scene==="world"&&!SS.on){SS.t-=dt/60*(TH.night?2:1);if(SS.t<=0){SS.t=18+Math.random()*30;SS.on=true;SS.l=0;SS.x=VW*(.2+Math.random()*.6);SS.y=8+Math.random()*(VH*.2);SS.vx=2.6+Math.random();SS.vy=1.1;wishT=3.2;sfx("star")}}}
function doWish(){wishT=0;if(S.items.s_wish){say("You wish for even more coins. The sky says <i>\"maybe\"</i>.",2800);discover("wish");return}
  collect("s_wish",P.x,P.y-16);discover("wish");say("<b>Wish made!</b> A star fragment drifts down to you.",3600)}

/* ---------- input ---------- */
var kon=["ArrowUp","ArrowUp","ArrowDown","ArrowDown","ArrowLeft","ArrowRight","ArrowLeft","ArrowRight","KeyB","KeyA"],ki=0,retro=false;
var CODES={ArrowLeft:"l",KeyA:"l",ArrowRight:"r",KeyD:"r",ArrowDown:"d",KeyS:"d",ShiftLeft:"run",ShiftRight:"run"},JUMPC={ArrowUp:1,KeyW:1,Space:1},ACTC={KeyE:1,Enter:1};
function setRetro(v){retro=v;cv.style.filter=v?"grayscale(1) sepia(1) hue-rotate(40deg) saturate(2.4) contrast(1.12)":"";if(v){discover("retro");sfx("magic")}}
function clearKeys(){K.l=K.r=K.d=K.run=K.jump=0;actQ=0}
function onKey(e,down){
  var tg=e.target&&e.target.tagName;if(tg==="INPUT"||tg==="TEXTAREA")return;var c=e.code;
  if(down&&!e.repeat){ki=(c===kon[ki])?ki+1:(c===kon[0]?1:0);if(ki===kon.length){ki=0;setRetro(!retro);e.stopPropagation()}}
  if(c==="Escape"){if(!down)return;if(uiOpen){closeUI();e.preventDefault()}else if(mode==="scope"){endScope();e.preventDefault()}else if(expanded){setExpanded(false);e.preventDefault()}return}
  if(uiOpen){if(down&&c==="KeyJ"&&uiOpen==="journal"){closeUI();e.preventDefault()}return}
  var h=false;
  if(CODES[c]){K[CODES[c]]=down?1:0;h=true}
  else if(JUMPC[c]){if(tg==="BUTTON"&&c==="Space")return;K.jump=down?1:0;if(down&&!e.repeat)P.jb=8;h=true}
  else if(ACTC[c]){if(tg==="BUTTON")return;if(down&&!e.repeat)actQ=1;h=true}
  else if(down&&!e.repeat){h=true;if(c==="KeyJ")toggleJournal();else if(c==="KeyM")toggleSound();else if(c==="KeyF")setExpanded(!expanded);else if(c==="KeyT")cycleTime();else if(c==="KeyG")cycleWx();else if(c==="KeyR")respawn();else h=false}
  if(h){e.preventDefault();e.stopPropagation()}
}
stage.addEventListener("keydown",function(e){onKey(e,true)});
stage.addEventListener("keyup",function(e){onKey(e,false)});
stage.addEventListener("focusin",function(){focused=true;if(!started){started=true;$("pwStart").hidden=true;S.plays++;dirty()}});
stage.addEventListener("focusout",function(e){if(!e.relatedTarget||!stage.contains(e.relatedTarget)){focused=false;clearKeys()}});
stage.addEventListener("pointerdown",function(e){var t=e.target;if(e.pointerType==="touch")touchUI(true);if(!(t.closest&&t.closest("input,button,.pw-panel")))try{stage.focus({preventScroll:true})}catch(x){stage.focus()}});
$("pwStart").addEventListener("click",function(){try{stage.focus({preventScroll:true})}catch(x){stage.focus()}started=true;$("pwStart").hidden=true;S.plays++;dirty()});
var touchEl=$("pwTouch");function touchUI(v){touchEl.classList.toggle("on",!!v)}
if(window.matchMedia&&matchMedia("(pointer: coarse)").matches)touchUI(true);
[].forEach.call(touchEl.querySelectorAll(".pw-tb"),function(b){var k=b.getAttribute("data-k");
  b.addEventListener("pointerdown",function(e){e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(x){}b.classList.add("dn");if(uiOpen)return;if(k==="act")actQ=1;else if(k==="jump"){K.jump=1;P.jb=8}else K[k]=1});
  function up(){b.classList.remove("dn");if(k==="jump")K.jump=0;else if(k!=="act")K[k]=0}
  b.addEventListener("pointerup",up);b.addEventListener("pointercancel",up);b.addEventListener("lostpointercapture",up);b.addEventListener("contextmenu",function(e){e.preventDefault()})});
/* telescope pointer */
cv.addEventListener("pointerdown",function(e){if(mode!=="scope")return;var r=cv.getBoundingClientRect();SCP.rx=clamp((e.clientX-r.left)/SC-VW/2,-60,60);SCP.ry=clamp((e.clientY-r.top)/SC-VH/2,-60,60);scopeSel()});
cv.addEventListener("pointermove",function(e){if(mode!=="scope"||e.pointerType==="touch"&&!e.buttons)return;var r=cv.getBoundingClientRect();SCP.rx=clamp((e.clientX-r.left)/SC-VW/2,-60,60);SCP.ry=clamp((e.clientY-r.top)/SC-VH/2,-60,60)});

/* ---------- physics ---------- */
function floorAt(x){return scene==="world"?gyAt(x):scene==="cabin"?150:Infinity}
function updPlats(dt){var a=PL[scene];for(var i=0;i<a.length;i++){var p=a[i];if(p.mv){var nx=p.bx+Math.sin(T*p.mv.s+p.mv.ph)*p.mv.r;p.dx=nx-p.x;p.x=nx}}}
function dust(x,y,n){if(calm())return;for(var i=0;i<(n||4);i++)spawn("du",x+(Math.random()-.5)*6,y,{vx:(Math.random()-.5)*.8,vy:-.15-Math.random()*.2,m:20,c:"#d8d2c0"})}
function landed(){if(P.vy>2.6){dust(P.x,P.y,5);sfx("land")}P.vy=0;P.gr=true;P.land=6}
function physics(dt){
  var dir=(K.r?1:0)-(K.l?1:0),wade=scene==="world"&&P.gr&&gyAt(P.x)>153,max=(K.run?1.9:1.3)*(wade?.7:1);
  if(dir){P.face=dir;P.vx+=dir*(P.gr?.2:.13)*dt}else{var fr=(P.gr?.22:.05)*dt;P.vx=Math.abs(P.vx)<=fr?0:P.vx-(P.vx>0?fr:-fr)}
  if(P.vx>max)P.vx=Math.max(max,P.vx-.12*dt);if(P.vx<-max)P.vx=Math.min(-max,P.vx+.12*dt);
  if(P.gr)P.coy=6;else P.coy-=dt;if(P.jb>0)P.jb-=dt;
  if(K.d&&P.gr&&P.on&&P.jb<=0){P.drop=14;P.gr=false;P.on=null;P.y+=2;P.coy=0}
  if(P.jb>0&&P.coy>0){P.vy=-3.9;P.gr=false;P.coy=0;P.jb=0;P.on=null;sfx("jump");dust(P.x,P.y,4)}
  if(!K.jump&&P.vy<-1.6&&!P.gr)P.vy=-1.6;
  var nx=P.x+P.vx*dt,lo=scene==="cabin"?18:8,hi=scene==="cabin"?(S.secret?378:258):sw()-8;
  if(nx<lo){nx=lo;P.vx=0}else if(nx>hi){nx=hi;P.vx=0}
  if(scene==="world"){var gn=gyAt(nx);if(P.y>gn+(P.gr?7:2)){nx=P.x;P.vx=0}}
  P.x=nx;
  if(P.gr){
    if(P.on){if(P.x<P.on.x-3||P.x>P.on.x+P.on.w+3){P.on=null;P.gr=false}else P.y=P.on.y}
    else{var a=PL[scene];for(var i=0;i<a.length;i++){var p=a[i];if(P.drop<=0&&P.x>=p.x-3&&P.x<=p.x+p.w+3&&p.y<=P.y+1&&P.y-p.y<=4){P.on=p;P.y=p.y;break}}}
    if(!P.on){var f=floorAt(P.x);if(f===Infinity||f-P.y>3)P.gr=false;else P.y=f}
  }
  if(!P.gr){
    P.vy=Math.min(6,P.vy+.22*dt);var ny=P.y+P.vy*dt,lp=null,f2=floorAt(P.x);
    if(P.vy>=0&&P.drop<=0){var b=PL[scene];for(var j=0;j<b.length;j++){var q=b[j];if(P.x>=q.x-3&&P.x<=q.x+q.w+3&&P.y<=q.y+1.5&&ny>=q.y&&(!lp||q.y<lp.y))lp=q}}
    if(lp&&lp.y<=f2){P.y=lp.y;P.on=lp;landed()}else if(ny>=f2){P.y=f2;P.on=null;landed()}else P.y=ny;
    if(P.drop>0)P.drop-=dt;
    if(scene==="vd"&&P.y>270)respawn();
  }
  if(P.land>0)P.land-=dt;
}

/* ---------- cat ---------- */
function updCat(dt){
  var night=PAL.L<.3;CAT.t-=dt/60;
  if(night){if(Math.abs(CAT.x-262)>2){CAT.st="walk";CAT.dir=CAT.x<262?1:-1}else CAT.st="sleep"}
  else if(CAT.t<=0){var r=Math.random();CAT.st=r<.45?"walk":"sit";CAT.dir=Math.random()<.5?-1:1;CAT.t=CAT.st==="walk"?1.5+Math.random()*2.5:2+Math.random()*4}
  if(CAT.st==="walk"){CAT.x+=CAT.dir*.3*dt;if(CAT.x<150){CAT.x=150;CAT.dir=1}if(CAT.x>270){CAT.x=270;CAT.dir=-1}}
  OB[1].x=CAT.x;CAT.f+=dt;
}

/* ---------- ambient creatures ---------- */
var FF=[];(function(){var r=rng(5);for(var i=0;i<42;i++)FF.push({x:r()*WW,y:r(),ph:r()*6.3,s:.4+r()*.8})})();
var RAIN=[],SNOW=[];(function(){for(var i=0;i<150;i++)RAIN.push({x:Math.random()*400,y:Math.random()*300,v:4.5+Math.random()*2.5});for(var j=0;j<110;j++)SNOW.push({x:Math.random()*400,y:Math.random()*300,v:.35+Math.random()*.55,ph:Math.random()*6.3})})();

/* ---------- camera ---------- */
function camUpdate(dt,snap){
  var w=sw(),tx=P.x-VW/2+P.face*16;tx=w<=VW?(w-VW)/2:clamp(tx,0,w-VW);
  var c=calm();cam.x=(snap||c)?tx:cam.x+(tx-cam.x)*Math.min(1,.09*dt);
  if(snap||c&&P.gr)cam.ref=P.y;else if(P.gr)cam.ref+=(P.y-cam.ref)*Math.min(1,.05*dt);
  var ty=clamp(VH*.74-cam.ref,-60,110);cam.oy=(snap||c)?ty:cam.oy+(ty-cam.oy)*Math.min(1,.08*dt);
  if(cam.sh>0)cam.sh=Math.max(0,cam.sh-.25*dt);
}
cam.ref=150;

/* ---------- master update ---------- */
var hudT=0,smokeT=0,sparkT=0,near=null,lastPrompt="",lastSave=0;
function findNear(){var best=null,bd=1e9;for(var i=0;i<OB.length;i++){var o=OB[i];if(o.sc!==scene)continue;if(o.ok&&!o.ok())continue;var d=Math.abs(P.x-o.x);
  if(d<=o.r){if(o.y1!=null&&(P.y<o.y0||P.y>o.y1))continue;if(d<bd){bd=d;best=o}}}return best}
function update(dt){
  T+=dt/60;updTime(dt);updWeather(dt);calcPal();
  if(FADE.dir){FADE.a+=FADE.dir*dt*.075;if(FADE.dir>0&&FADE.a>=1){FADE.a=1;var cb=FADE.cb;FADE.cb=null;FADE.dir=-1;if(cb)cb()}else if(FADE.dir<0&&FADE.a<=0){FADE.a=0;FADE.dir=0}}
  updPlats(dt);
  if(mode==="scope")updScope(dt);
  else if(!uiOpen&&!FADE.dir){
    if(P.on&&P.on.dx)P.x+=P.on.dx;
    var n=Math.max(1,Math.ceil(dt)),sd=dt/n;for(var i=0;i<n;i++)physics(sd);
    if(Math.abs(P.vx)>.5&&started){P.moved+=dt;if(P.moved>25)discover("first")}
    near=findNear();
    if(actQ){actQ=0;if(wishT>0&&SS.on)doWish();else if(near)near.act()}
    if(P.gr&&(T*60|0)%30===0)P.safe={x:P.x,y:P.y};
    if(scene==="world"&&P.gr&&WX.k[1]+WX.k[2]>.5&&Math.random()<.02*dt&&!calm()&&gyAt(P.x)>153)spawn("sp",P.x,150,{vy:-.6,g:.05,m:20,c:"#bfe9ff"});
    for(var q=0;q<ITEMS.length;q++){var m=ITEMS[q];if(m.v||m.sc!==scene||S.items[m.id])continue;if(Math.abs(P.x-m.x)<9&&Math.abs(P.y-7-m.y)<12)collect(m.id)}
  }else{actQ=0;near=null}
  if(mode==="play"&&scene==="world")updCat(dt);
  if(S.fire&&scene==="world"){smokeT-=dt;if(smokeT<=0){smokeT=26;spawn("sm",317,98,{vx:.08,vy:-.22,m:120,s:2})}}
  if(scene==="world"){sparkT-=dt;if(sparkT<=0&&Math.abs(P.x-706)<260){sparkT=9;spawn("sp",706+(Math.random()-.5)*5,gyAt(706)-14,{vx:(Math.random()-.5)*.3,vy:-.5-Math.random()*.4,g:-.002,m:50,c:Math.random()<.5?"#ffb347":"#ff6a2b"})}}
  updShoot(dt);
  for(var k=PT.length-1;k>=0;k--){var p=PT[k];p.l+=dt;p.x+=p.vx*dt;p.y+=p.vy*dt;p.vy+=p.g*dt;if(p.k==="sm"){p.s+=.012*dt;p.vx+=.0006*dt}if(p.l>=p.m)PT.splice(k,1)}
  camUpdate(dt,false);
  if(saveDirty&&T-lastSave>3){lastSave=T;S.x=Math.round(P.x);save()}
}

/* ---------- sprites / layers (rebuilt on theme change) ---------- */
var SP={},TR={},LAY={},soilPat=null;
function mk(w,h){var c=document.createElement("canvas");c.width=w;c.height=h;return c}
function spr(rows,pal){var h=rows.length,w=rows[0].length,c=mk(w,h),x=c.getContext("2d");for(var j=0;j<h;j++)for(var i=0;i<w;i++){var ch=rows[j].charAt(i);if(ch!=="."&&pal[ch]){x.fillStyle=pal[ch];x.fillRect(i,j,1,1)}}return c}
function pine(x,bx,by,H,col,hi,tr){var Hf=H-5,n=Math.max(3,Math.round(Hf/9)),mw=Hf*.58;x.fillStyle=tr;x.fillRect(bx-1,by-5,2,5);
  for(var r=0;r<Hf;r++){var fr=r/Hf,ti=Math.floor(fr*n),tp=fr*n-ti,w=Math.max(1,Math.round(mw*((ti+1)/n)*(.3+.7*tp))),lw=Math.ceil(w/2);var y=by-5-Hf+r;
    x.fillStyle=hi;x.fillRect(Math.round(bx-w/2),y,lw,1);x.fillStyle=col;x.fillRect(Math.round(bx-w/2)+lw,y,w-lw,1)}}
function disc(x,cx,cy,r,col){x.fillStyle=col;for(var dy=-r;dy<=r;dy++){var w=Math.round(Math.sqrt(r*r-dy*dy));x.fillRect(cx-w,cy+dy,w*2+1,1)}}
function buildSprites(){
  var lf=css(TH.leaf),l2=css(TH.leaf2),tk=css(TH.trunk),k;
  var pal={o:"#1a1230",h:css(mix(ACC,[40,34,90],.55)),s:"#f2c9a0",e:"#1a1230",c:css(mix(ACC,[255,255,255],.2)),b:css(mix(ACC,[30,26,70],.72)),p:"#3a3560",k:"#2a2140"};
  var UP=["...oooo...","..ohhhho..",".ohhhhhho.",".ohssssho.",".ohesseho.","..ohssho..","..occcco..",".obbbbbbo.","obbbbbbbbo","obbbbbbbbo",".obbbbbbo."];
  var LEG={st:["..opoopo..","..okooko..","..kk..kk.."],a:["...oppoo..","...okkoo..","..kk...kk."],b:["..ooppo...","..ookko...",".kk...kk.."],j:["..oppppo..","..okkkko..",".........."]};
  SP={};for(k in LEG)SP[k]=spr(UP.concat(LEG[k]),pal);
  TR={};
  var c=mk(26,46),x=c.getContext("2d");pine(x,13,46,46,lf,l2,tk);TR.p1=c;
  c=mk(20,34);x=c.getContext("2d");pine(x,10,34,34,lf,l2,tk);TR.p2=c;
  c=mk(30,40);x=c.getContext("2d");x.fillStyle=tk;x.fillRect(13,24,4,16);x.fillRect(11,34,8,6);disc(x,15,14,12,lf);disc(x,9,18,7,lf);disc(x,21,18,7,lf);disc(x,12,10,6,l2);disc(x,18,12,4,l2);TR.o1=c;
  c=mk(24,44);x=c.getContext("2d");x.fillStyle="#e8e6df";x.fillRect(11,18,3,26);x.fillStyle="#3a3a3a";for(k=0;k<5;k++)x.fillRect(11,22+k*5,2,1);disc(x,12,12,9,lf);disc(x,7,16,5,lf);disc(x,17,16,5,l2);disc(x,11,8,4,l2);TR.b1=c;
  c=mk(32,32);x=c.getContext("2d");x.fillStyle=css(TH.soil);x.fillRect(0,0,32,32);var r=rng(9);
  for(k=0;k<60;k++){x.fillStyle=r()<.5?css(TH.soil2):css(mix(TH.soil,[255,255,255],.12));x.fillRect((r()*32)|0,(r()*32)|0,1+(r()*2|0),1)}
  for(k=0;k<5;k++){x.fillStyle=css(mix(TH.soil2,[140,140,150],.35));var sx=(r()*28)|0,sy=(r()*28)|0;x.fillRect(sx,sy,3,2);x.fillRect(sx+1,sy-1,1,1)}
  soilPat=ctx.createPattern(c,"repeat");
  /* parallax tiles */
  var TW=1024,TP=Math.PI*2/TW,i;
  c=mk(TW,100);x=c.getContext("2d");var far=css(TH.m1),fl=css(mix(TH.m1,[255,255,255],.3));
  for(i=0;i<TW;i++){var h=Math.round(42+24*Math.sin(TP*3*i+1)+14*Math.sin(TP*7*i)+8*Math.sin(TP*13*i+2));x.fillStyle=far;x.fillRect(i,100-h,1,h);x.fillStyle=fl;x.fillRect(i,100-h,1,2);if(h>74){x.fillStyle="#f4faff";x.fillRect(i,100-h,1,3+(h-74>6?2:0))}}
  LAY.far=c;
  c=mk(TW,84);x=c.getContext("2d");var mid=css(TH.m2);
  for(i=0;i<TW;i++){var h2=Math.round(30+17*Math.sin(TP*5*i+.5)+10*Math.sin(TP*11*i+3));x.fillStyle=mid;x.fillRect(i,84-h2,1,h2)}
  var rr=rng(21);for(i=8;i<TW;i+=10+((rr()*12)|0)){var hh=Math.round(30+17*Math.sin(TP*5*i+.5)+10*Math.sin(TP*11*i+3)),ph=10+((rr()*8)|0);pine(x,i,84-hh+3,ph,css(mix(TH.m2,[0,0,0],.18)),css(mix(TH.m2,[0,0,0],.08)),css(mix(TH.m2,[0,0,0],.3)))}
  LAY.mid=c;
  c=mk(TW,74);x=c.getContext("2d");var nr=css(TH.m3);x.fillStyle=nr;x.fillRect(0,60,TW,14);rr=rng(33);
  for(i=4;i<TW;i+=9+((rr()*10)|0)){var ph2=22+((rr()*18)|0),dk=mix(TH.m3,[0,0,0],.12);if(rr()<.7){pine(x,i,66,ph2,css(dk),nr,css(dk));if(i<30)pine(x,i+TW,66,ph2,css(dk),nr,css(dk))}else{disc(x,i,66-ph2/2|0,ph2/3|0,css(dk));x.fillStyle=css(dk);x.fillRect(i-1,60,2,6)}}
  LAY.near=c;
  /* decorative tree list */
  TL=[];var ex=[[60,215],[270,334],[420,500],[560,800],[860,1030],[1040,1185],[1735,1870],[1940,2060]],tr2=rng(11);
  for(var tx=30;tx<WW-20;tx+=26+((tr2()*52)|0)){var ok=true;for(k=0;k<ex.length;k++)if(tx>ex[k][0]-14&&tx<ex[k][1]+14){ok=false;break}if(!ok)continue;
    var tp=tr2(),ty=TH.snowy||tp<.45?(tr2()<.5?"p1":"p2"):tp<.75?"o1":"b1";TL.push({x:tx,t:ty})}
}
var TL=[];

/* ---------- rendering ---------- */
var LG=[],DARK=[6,8,34],WOOD="#8a5a38",WOOD2="#6e4527",WOOD3="#a8703f";
function lamp(x,y,r,t,i){LG.push([x,y,r,t||0,i==null?1:i])}
function vis(x,m){return x>cam.x-(m||90)&&x<cam.x+VW+(m||90)}
function drawSky(){
  var t=PAL.top,b=PAL.bot,hh=Math.ceil(VH/3);
  for(var i=0;i<hh;i++){var f=clamp(i/(hh*.78),0,1);ctx.fillStyle=css(mix(t,b,f));ctx.fillRect(0,i*3,VW,3)}
  var dk=1-PAL.L,cs=calm(),i2;
  if(dk>.05){var sa=dk*dk;for(i2=0;i2<90;i2++){var sx=hash(i2*3.1)*VW,sy=hash(i2*7.7)*VH*.72,tw=cs?.8:.55+.45*Math.sin(T*2+i2*1.7);
      sx=((sx-cam.x*.02)%VW+VW)%VW;ctx.fillStyle="rgba(255,252,235,"+(sa*tw).toFixed(2)+")";ctx.fillRect(sx|0,sy|0,1,1);if(i2%11===0){ctx.fillRect((sx|0)-1,sy|0,3,1);ctx.fillRect(sx|0,(sy|0)-1,1,3)}}}
  if(TH.aur&&dk>.3){var aa=(dk-.3)*.5;for(i2=0;i2<VW;i2+=2){var h=14+10*Math.sin(i2*.05+T*(cs?0:.4))+8*Math.sin(i2*.13+1),y0=VH*.12+6*Math.sin(i2*.03+T*(cs?0:.3));
      ctx.fillStyle=css(i2%8<4?[80,255,170]:ACC,aa*.28);ctx.fillRect(i2,y0,2,h);ctx.fillStyle=css([120,255,200],aa*.12);ctx.fillRect(i2,y0+h,2,10)}}
  var s=(S.tod-.25)/.5,u2=(((S.tod+.5)%1)-.25)/.5;
  if(s>-.06&&s<1.06){var sx2=VW*(.08+.84*s),sy2=VH*.58-Math.sin(Math.PI*clamp(s,0,1))*VH*.5;
    if(TH.eclipse){disc(ctx,Math.round(sx2),Math.round(sy2),9,"rgba(255,120,90,.35)");disc(ctx,Math.round(sx2),Math.round(sy2),7,"#12000a")}
    else{disc(ctx,Math.round(sx2),Math.round(sy2),11,"rgba(255,230,150,.18)");disc(ctx,Math.round(sx2),Math.round(sy2),8,"rgba(255,235,160,.35)");disc(ctx,Math.round(sx2),Math.round(sy2),6,"#fff3b0");disc(ctx,Math.round(sx2),Math.round(sy2),4,"#fffbe0")}}
  if(u2>-.06&&u2<1.06&&dk>.04){var mx=VW*(.08+.84*u2),my=VH*.5-Math.sin(Math.PI*clamp(u2,0,1))*VH*.42,al=clamp(dk*1.4,0,1);
    if(TH.night){mx=VW*.78;my=VH*.2}
    drawMoon(Math.round(mx),Math.round(my),TH.night?10:7,al)}
  /* clouds */
  var cc=[[0,.18,2,.9],[90,.1,3,.6],[170,.3,2,1.2],[260,.14,1,.8],[330,.26,3,.5],[420,.08,2,.7],[520,.22,1,1]],cl=mix([255,255,255],[120,126,145],WX.dim*.9);
  for(i2=0;i2<cc.length;i2++){var c=cc[i2],cx=((c[0]-cam.x*.08+(cs?0:T*c[3]*2.2))%(VW+200)+VW+200)%(VW+200)-100,cy=c[1]*VH,z=c[2];
    ctx.fillStyle=css(cl,.85*(.35+.65*PAL.L+.2*dk));ctx.fillRect(cx,cy,12*z,3*z);ctx.fillRect(cx+3*z,cy-2*z,7*z,2*z);ctx.fillRect(cx-2*z,cy+2*z,16*z,2*z)}
  if(SS.on){var a2=1-SS.l/70;for(i2=0;i2<9;i2++){ctx.fillStyle="rgba(255,255,255,"+(a2*(1-i2/9)).toFixed(2)+")";ctx.fillRect((SS.x-i2*SS.vx*.9)|0,(SS.y-i2*SS.vy*.9)|0,2,1)}}
  if(TH.bats&&!calm()){for(i2=0;i2<4;i2++){var bx=((T*14+i2*95)%(VW+60))-30,by=26+i2*13+Math.sin(T*3+i2)*6,fl=((T*8+i2)|0)%2;ctx.fillStyle="#120a14";ctx.fillRect(bx|0,by|0,3,2);ctx.fillRect((bx|0)-3,(by|0)-fl,3,1);ctx.fillRect((bx|0)+3,(by|0)-fl,3,1)}}
}
function drawMoon(x,y,r,al){
  var ph=((Date.now()/86400000-10957.26)%29.530588)/29.530588,ct=Math.cos(ph*6.28318);ctx.globalAlpha=al;disc(ctx,x,y,r+3,"rgba(210,215,255,.14)");
  for(var dy=-r;dy<=r;dy++){var hw=Math.sqrt(r*r-dy*dy),tx=ct*hw,x0,x1;if(ph<.5){x0=tx;x1=hw}else{x0=-hw;x1=-tx}if(x1>x0){ctx.fillStyle="#eef0ff";ctx.fillRect(Math.round(x+x0),y+dy,Math.max(1,Math.round(x1-x0)),1)}}
  ctx.fillStyle="rgba(150,155,190,.5)";if(ph>.2&&ph<.8){ctx.fillRect(x-1,y-2,2,1);ctx.fillRect(x+1,y+1,1,1)}
  ctx.globalAlpha=1}
function drawParallax(){
  var oy=cam.oy,defs=[["far",.1,100,.5,10],["mid",.25,84,.75,6],["near",.5,74,1,8]];
  for(var i=0;i<3;i++){var L=defs[i],img=LAY[L[0]],off=-(((cam.x*L[1])%1024)+1024)%1024,by=Math.round(150+oy*L[3]+L[4]-L[2]);
    for(var k=0;k<3;k++){var xx=Math.round(off)+k*1024;if(xx>VW)break;if(xx+1024>0)ctx.drawImage(img,xx,by)}
    ctx.fillStyle=css(i===0?TH.m1:i===1?TH.m2:TH.m3);ctx.fillRect(0,by+L[2]-1,VW,Math.max(0,VH-(by+L[2])+2))}
}
function tuft(wx,gy,sw2,c){var h=2+((hash(wx)*3)|0);ctx.fillStyle=c;ctx.fillRect(wx,gy-h,1,h);ctx.fillRect(wx+1+sw2,gy-h-1,1,h);if(h>3)ctx.fillRect(wx-1,gy-h+1,1,h-1)}
function drawGround(){
  var x0=Math.round(cam.x)-1,bot=VH-cam.oy+2,gt=css(mix(TH.gr,[240,248,255],WX.cover*.9)),g2=css(mix(TH.gr2,[225,238,250],WX.cover*.8)),run=-1,ry=0,i;
  function flush(e){if(run<0)return;var w=e-run;ctx.fillStyle=gt;ctx.fillRect(x0+run,ry,w,2);ctx.fillStyle=g2;ctx.fillRect(x0+run,ry+2,w,1);ctx.fillStyle=soilPat;ctx.fillRect(x0+run,ry+3,w,bot-ry)}
  for(i=0;i<=VW+3;i++){var y=Math.round(gyAt(x0+i));if(y!==ry||run<0){flush(i);run=i;ry=y}}flush(VW+4);
  /* grass tufts + flowers */
  var s0=Math.floor(x0/7)-1,wind=calm()?0:Math.round(Math.sin(T*1.7)*1),fc=[ACC,ACC2,ACC3,[255,213,74],[255,255,255]];
  for(i=s0;i<s0+VW/7+3;i++){var wx=i*7+Math.round(hash(i)*5),g=Math.round(gyAt(wx));if(hash(i*1.7)<.62&&!(hash(i*4.1)>.82))tuft(wx,g,wind,css(mix(TH.gr2,TH.leaf2,hash(i*2.3))));
    if(hash(i*9.3)>.8&&WX.cover<.6&&wx>40&&!(wx>870&&wx<1020)){var fx=wx+3,fg=Math.round(gyAt(fx)),fcl=css(fc[(hash(i*5.5)*5)|0]),h=4+((hash(i)*4)|0),sw3=wind;ctx.fillStyle=css(TH.leaf);ctx.fillRect(fx,fg-h,1,h);ctx.fillStyle=fcl;ctx.fillRect(fx-1+sw3,fg-h-2,3,1);ctx.fillRect(fx+sw3,fg-h-3,1,3);ctx.fillStyle="#ffe58a";ctx.fillRect(fx+sw3,fg-h-2,1,1)}}
}
function drawTrees(){for(var i=0;i<TL.length;i++){var t=TL[i];if(!vis(t.x,40))continue;var c=TR[t.t],g=Math.round(gyAt(t.x));ctx.drawImage(c,t.x-(c.width>>1),g-c.height+1);
    if(WX.cover>.3&&(t.t==="p1"||t.t==="p2")){ctx.fillStyle="rgba(244,251,255,"+(WX.cover*.8).toFixed(2)+")";var h=c.height;for(var k=0;k<4;k++)ctx.fillRect(t.x-(c.width>>1)+((c.width/2-k*3-2)|0),g-h+3+k*(h/5|0),3+k*2,1)}}}
function water(){var y0=151;for(var wx=Math.max(868,Math.floor(cam.x));wx<Math.min(1022,cam.x+VW+1);wx++){var g=gyAt(wx);if(g>y0+.5){var d=Math.ceil(g-y0);ctx.fillStyle=css(mix([70,140,210],TH.dB,.15));ctx.fillRect(wx,y0,1,d);
    if(!calm()&&hash(wx*.7+Math.floor(T*1.6))>.94){ctx.fillStyle="rgba(255,255,255,.7)";ctx.fillRect(wx,y0,2,1)}else if(hash(wx*.31)>.9){ctx.fillStyle="rgba(255,255,255,.35)";ctx.fillRect(wx,y0,2,1)}}}}
function dCabin(x){var g=150,i,rf=css(TH.roof),rl=css(mix(TH.roof,[255,255,255],.22)),rd=css(mix(TH.roof,[0,0,0],.25));
  R(x-26,g-32,52,32,WOOD);for(i=0;i<4;i++)R(x-26,g-26+i*8,52,1,WOOD2);R(x-26,g-32,2,32,WOOD2);R(x+24,g-32,2,32,WOOD2);
  for(i=0;i<8;i++){R(x-34+i,g-32-i,68-2*i,1,i%2?rf:rd)}R(x-26,g-40,52,2,rl);
  for(i=0;i<24;i++)R(x-30+i*2.5,g-37+(i%3),1,1,rd);
  if(WX.cover>.25){R(x-26,g-42,52,2,"#f4fbff");R(x-30,g-38,6,1,"#f4fbff");R(x+25,g-38,6,1,"#f4fbff")}
  R(x+14,g-50,6,10,"#707080");R(x+13,g-51,8,2,"#505060");
  R(x-5,g-18,10,18,"#4a2c18");R(x-4,g-19,8,1,"#4a2c18");R(x-3,g-20,6,1,"#4a2c18");R(x+2,g-9,1,1,"#ffd54a");R(x-1,g-16,1,14,"#3a2010");
  var lit=PAL.da>.12||S.fire;R(x+10,g-27,12,10,"#3a2418");R(x+11,g-26,10,8,lit?"#ffd98a":css(mix(PAL.top,PAL.bot,.5)));R(x+15,g-26,1,8,"#3a2418");R(x+11,g-22,10,1,"#3a2418");
  if(lit)lamp(x+16,g-22,36,1,.8);R(x-12,g-1,24,2,WOOD2)}
function dCrate(p){R(p.x,p.y,14,14,"#b07a45");R(p.x,p.y,14,1,"#d09a62");R(p.x,p.y,1,14,"#7a4f28");R(p.x+13,p.y,1,14,"#7a4f28");R(p.x,p.y+13,14,1,"#7a4f28");for(var i=0;i<12;i++){R(p.x+1+i,p.y+1+i,1,1,"#8f5f32");R(p.x+12-i,p.y+1+i,1,1,"#8f5f32")}}
function dStatue(x){var g=Math.round(gyAt(x));R(x-8,g-6,16,6,"#8d8f9c");R(x-6,g-8,12,2,"#a9acb8");R(x-4,g-20,4,12,"#3b3f9c");R(x,g-20,4,12,"#3b3f9c");R(x-4,g-32,8,12,"#27a6a6");R(x-8,g-32,4,12,"#c68b62");R(x+4,g-32,4,12,"#c68b62");R(x-4,g-40,8,8,"#c68b62");R(x-4,g-40,8,3,"#4a3020");R(x-3,g-36,2,1,"#fff");R(x+1,g-36,2,1,"#fff");R(x-2,g-36,1,1,"#4a2bd0");R(x+1,g-36,1,1,"#4a2bd0");R(x-3,g-33,6,1,"#8a5a3a")}
function dRing(x){var g=Math.round(gyAt(x));for(var i=0;i<8;i++){var a=i*Math.PI/4,mx=Math.round(x+Math.cos(a)*14),my=Math.round(g+Math.sin(a)*2.5);R(mx,my-3,1,3,"#f4e8d0");R(mx-2,my-5,5,2,"#e8453c");R(mx-1,my-6,3,1,"#e8453c");R(mx,my-5,1,1,"#fff")}
  if(PAL.L<.5){lamp(x,g-6,34,2,.6)}}
function dDesk(x){var g=150,i,wd=WOOD2;R(x-26,g-34,3,34,wd);R(x+23,g-34,3,34,wd);R(x-28,g-36,56,3,css(TH.roof));R(x-28,g-33,56,1,css(mix(TH.roof,[0,0,0],.35)));
  if(WX.cover>.25)R(x-28,g-38,56,2,"#f4fbff");
  for(i=0;i<9;i++){var c=[ACC,ACC2,ACC3,[255,213,74]][i%4],on=calm()||hash(i+Math.floor(T*1.5))>.25;if(on)R(x-26+i*6.5,g-31+(i%2),2,2,css(c))}
  R(x-20,g-14,40,3,WOOD3);R(x-18,g-11,2,11,wd);R(x+16,g-11,2,11,wd);R(x-12,g-29,18,13,"#22222e");R(x-10,g-27,14,9,css(mix([8,10,24],ACC,.12)));R(x-4,g-16,4,2,"#33333f");
  for(i=0;i<4;i++)R(x-9,g-26+i*2,3+((i*7+((T*3)|0))%9),1,css(i%2?ACC:ACC2));R(x-9,g-15,12,1,"#555566");R(x+10,g-18,4,4,"#e8e8f0");R(x+14,g-17,1,2,"#e8e8f0");
  R(x+13,g-21,3,3,"#ffd54a");R(x+11,g-18,5,3,"#ffd54a");R(x+16,g-20,1,1,"#ff9a2a");R(x+14,g-21,1,1,"#222");
  R(x+34,g-26,10,26,"#2b2f3f");for(i=0;i<5;i++){R(x+36,g-23+i*5,6,2,"#1b1e2b");R(x+41,g-22+i*5,1,1,hash(((T*3)|0)+i*3)>.5?"#46f08a":"#f0b846")}
  lamp(x-3,g-22,30,0,.7);lamp(x,g-30,46,1,.4)}
function dFire(x){var g=Math.round(gyAt(x)),f=((T*8)|0)%3;R(x-8,g-3,16,3,"#5a3a22");R(x-6,g-5,12,2,"#6b4a2a");R(x-10,g-2,3,2,"#777");R(x+7,g-2,3,2,"#777");
  R(x-3,g-12+f,6,8-f,"#ff6a2b");R(x-2,g-16+f,4,8,"#ffb347");R(x-1,g-18+f,2,6,"#fff3b0");R(x+16,g-5,14,5,"#6b4a2a");R(x+16,g-5,14,1,"#8a6a42");
  lamp(x,g-10,62+Math.round(hash(Math.floor(T*10))*6),1,1)}
function dTent(x){var g=Math.round(gyAt(x));for(var i=0;i<24;i++){var h=Math.round(i*14/23);R(x-h,g-24+i,h*2,1,i%4<2?"#c4572f":"#a8441f")}R(x-3,g-9,6,9,"#3a1f12");R(x-1,g-9,1,9,"#5a2f1a");R(x,g-28,1,4,"#6b4a2a");R(x+1,g-28,4,2,css(ACC))}
function dBoard(x){var g=Math.round(gyAt(x));R(x-17,g-26,2,26,WOOD2);R(x+15,g-26,2,26,WOOD2);R(x-20,g-36,40,18,"#2a1f3a");R(x-20,g-36,40,1,css(ACC));R(x-20,g-19,40,1,css(ACC));R(x-20,g-36,1,18,css(ACC));R(x+19,g-36,1,18,css(ACC));txt("PROJECTS",x-15,g-32,css(ACC));txt("> OPEN",x-11,g-25,"#ffd54a")}
function dSign(x){var g=Math.round(gyAt(x));R(x-1,g-22,3,22,WOOD2);R(x-12,g-22,20,6,WOOD3);R(x+8,g-21,2,4,WOOD3);R(x-6,g-14,18,6,WOOD3);R(x-8,g-13,2,4,WOOD3);R(x-10,g-20,10,1,WOOD2);R(x-4,g-12,12,1,WOOD2)}
function dLamp(x){var g=Math.round(gyAt(x)),on=PAL.da>.1;R(x,g-30,2,30,"#2a2a3a");R(x-3,g-34,8,5,on?"#ffe9a8":"#c9b27a");R(x-3,g-35,8,1,"#2a2a3a");R(x-3,g-29,8,1,"#2a2a3a");if(on)lamp(x+1,g-32,48,1,1)}
function dPumpkin(x){var g=Math.round(gyAt(x)),on=PAL.da>.15;R(x-4,g-6,9,6,on?"#ff9a2a":"#f08a1c");R(x-3,g-7,7,1,"#f08a1c");R(x,g-9,2,2,"#4a7a2a");R(x-2,g-4,1,2,"#2a1000");R(x+2,g-4,1,2,"#2a1000");R(x-1,g-2,3,1,"#2a1000");if(on)lamp(x,g-4,22,1,.8)}
function dPier(){var p=PL.world[7];R(p.x,p.y,p.w,2,WOOD);for(var i=0;i<p.w;i+=4)R(p.x+i,p.y,1,2,WOOD2);R(p.x+6,p.y+2,2,9,WOOD2);R(p.x+26,p.y+2,2,9,WOOD2);R(p.x+48,p.y+2,2,9,WOOD2);
  R(p.x+p.w-2,p.y-10,1,10,WOOD2);R(p.x+p.w-2,p.y-10,8,1,"#ccc");
  var pads=[[900,150],[958,150],[990,150]];for(i=0;i<3;i++){R(pads[i][0],pads[i][1],5,1,"#4a9a55");R(pads[i][0]+1,pads[i][1]-1,1,1,i===1?"#ff7ab8":"#4a9a55")}
  for(i=0;i<3;i++){var rx=i===2?1012+i*2:876+i*2,sw3=calm()?0:Math.round(Math.sin(T*2+i));R(rx,143,1,9,"#3d8a45");R(rx+sw3,141,1,3,"#7a5a3a")}
  var ph=((T%7)/7)/.16;if(ph<1&&!calm()){var fx=930+ph*26,fy=151-Math.sin(Math.PI*ph)*15;R(fx,fy,4,2,"#cfe3f0");R(fx+(ph<.5?-1:4),fy,1,2,"#cfe3f0");if(ph<.1||ph>.9)spawn("sp",fx,151,{vy:-.6,g:.05,m:16,c:"#e8fbff"})}}
function dPortal(x){var g=150,cy=g-30,i,dy,pr=S.portal,rn=runes();
  R(x-30,g-6,60,6,"#6f7384");R(x-28,g-7,56,1,"#8b8fa3");
  R(1066,g-20,10,20,"#7b8093");R(1065,g-20,12,2,"#9aa0b4");R(1067,g-14,1,6,"#5a5e70");R(1146,g-30,10,30,"#7b8093");R(1145,g-30,12,2,"#9aa0b4");R(1149,g-22,1,8,"#5a5e70");R(1148,g-8,3,1,"#4f8a4f");R(1068,g-4,3,1,"#4f8a4f");
  if(pr){ctx.fillStyle=css(mix(ACC,[0,0,10],.72),.82);for(dy=-14;dy<=14;dy++){var w=Math.round(Math.sqrt(225-dy*dy));ctx.fillRect(x-w,cy+dy,w*2+1,1)}
    for(i=0;i<64;i++){var a=i*.46+(calm()?0:T*2.2),rr=i*.22;R(x+Math.cos(a)*rr,cy+Math.sin(a)*rr,i%9===0?2:1,1,i%3===0?"#fff":css(i%2?ACC:ACC2))}}
  else{ctx.fillStyle="rgba(120,130,170,.12)";for(dy=-14;dy<=14;dy++){var w2=Math.round(Math.sqrt(225-dy*dy));ctx.fillRect(x-w2,cy+dy,w2*2+1,1)}}
  for(dy=-24;dy<=24;dy++){var ox=Math.sqrt(576-dy*dy),ix=Math.abs(dy)<15?Math.sqrt(225-dy*dy):0,c=(dy+24)%5<2?"#8b8fa3":"#767a8e";if(dy>20)continue;
    if(ix===0)R(x-ox,cy+dy,ox*2,1,c);else{R(x-ox,cy+dy,ox-ix,1,c);R(x+ix,cy+dy,ox-ix,1,c)}}
  for(i=0;i<9;i++){R(x-22+hash(i*3)*44,cy-22+hash(i*7)*28,2,1,"#4f8a4f")}
  for(i=0;i<3;i++){var an=(-130+i*40)*Math.PI/180,sx=Math.round(x+Math.cos(an)*19.5),sy=Math.round(cy+Math.sin(an)*19.5),on=i<rn;R(sx-1,sy-1,3,3,on?css(ACC):"#2b2e3a");if(on)R(sx,sy,1,1,"#fff")}
  if(pr)lamp(x,cy,62,2,1);else if(rn>0)lamp(x,cy-18,26,2,.5)}
function dObs(x){var g=116,i,lit=PAL.da>.12;
  R(x-18,g-44,36,44,"#c9ccda");R(x+4,g-44,14,44,"#aeb2c4");for(i=0;i<5;i++)R(x-18,g-36+i*9,36,1,"#9a9eb2");
  for(var dy=0;dy<=18;dy++){var w=Math.round(Math.sqrt(324-dy*dy));R(x-w,g-62+(18-dy),Math.max(1,w),1,"#eceff8");R(x,g-62+(18-dy),w,1,"#c2c7da")}
  var open=clamp((1-PAL.L)*1.5,0,1),off=Math.round(Math.sin(T*.25)*(calm()?0:8)+6);if(open>.2){R(x+off-2,g-60,4,16,"#0b1230");R(x+off,g-58,2,8,"#aab0c8");lamp(x+off,g-52,30,0,.7*open)}
  R(x-5,g-18,10,18,"#4a3a2e");R(x-4,g-19,8,1,"#4a3a2e");R(x-3,g-20,6,1,"#4a3a2e");R(x+2,g-9,1,1,"#ffd54a");
  R(x-3,g-36,6,6,lit?"#ffd98a":"#27304f");if(lit)lamp(x,g-33,34,1,.7);R(x+9,g-26,7,5,"#2a2f45");R(x+12,g-24,1,1,"#ffd54a");
  R(1754,g-26,52,2,"#8a8fa6");for(i=0;i<=52;i+=8)R(1754+i,g-32,1,6,"#8a8fa6");R(1754,g-32,52,1,"#8a8fa6");
  R(1806,g-46,14,2,"#8a8fa6");R(1812,g-44,2,18,"#6a6f84");R(1815,g-52,1,6,"#6a6f84");R(1814,g-53,3,1,"#ff5a5a");
  if(WX.cover>.3)R(x-16,g-63,32,1,"#f4fbff")}
function dScope(x){var g=116,i;R(x-2,g-12,3,12,"#6a6f84");R(x-6,g-3,2,3,"#6a6f84");R(x+3,g-3,2,3,"#6a6f84");for(i=0;i<12;i++)R(x-4+i,g-12-((i*.85)|0),3,2,"#aab0c8");R(x+8,g-23,3,3,"#7af0ff");if(PAL.L<.35)lamp(x+9,g-22,16,0,.5)}
function dPlat(p){var k=p.k;
  if(k==="stone"){R(p.x,p.y,p.w,5,"#7f8497");R(p.x,p.y,p.w,1,"#a3a9bd");R(p.x+2,p.y+5,p.w-4,2,"#656a7e");R(p.x+5,p.y+7,p.w-10,2,"#4d5163");R(p.x+2,p.y-1,6,1,"#4f8a4f");R(p.x+p.w-8,p.y-1,5,1,"#4f8a4f");R(p.x+p.w/2-1,p.y+2,2,1,css(ACC));if(PAL.L<.6)lamp(p.x+p.w/2,p.y,14,2,.4)}
  else if(k==="cloud"){R(p.x,p.y,p.w,3,"#f4fbff");R(p.x+2,p.y+3,p.w-4,2,"#cfe6f7");R(p.x+4,p.y-2,p.w-8,2,"#f4fbff")}
  else if(k==="cry"){var c1=css(mix(ACC,[10,6,30],.55)),c2=css(mix(ACC,[255,255,255],.35));R(p.x,p.y,p.w,6,c1);R(p.x,p.y,p.w,2,c2);for(var i=0;i<p.w-2;i+=6){R(p.x+i+1,p.y+6,3,3,c1);R(p.x+i+2,p.y+9,1,3,c1)}R(p.x+3,p.y+3,2,1,css(ACC2));lamp(p.x+p.w/2,p.y,28,2,.5)}}
function dItem(m){var y=m.y+Math.round(calm()?0:Math.sin(T*3+m.x*.1)*1.5),x=m.x,i;
  if(m.t==="coin"){var w=1+Math.round(Math.abs(Math.cos(calm()?0:T*4+x*.2))*4),hw=w>>1;R(x-hw,y-3,w,6,"#ffd54a");R(x-hw,y+2,w,1,"#c9962a");if(w>=3)R(x-hw+1,y-2,1,3,"#fff3b0")}
  else if(m.t==="gem"){var c1=m.id==="g_cabin"||m.id==="g_pillar"?"#ff7ab8":m.id==="g_dome"||m.id==="g_sky"?"#a7ff7a":m.id==="g_camp"?css(ACC):"#5ef0ff",c2=css(mix(hx(c1.charAt(0)==="#"?c1:"#5ef0ff")||[90,240,255],[0,0,60],.35));
    var hc=hx(c1);if(hc)c2=css(mix(hc,[0,0,60],.35));R(x-1,y-4,3,1,c1);R(x-2,y-3,5,1,c1);R(x-3,y-2,7,1,c1);R(x-2,y-1,5,1,c2);R(x-1,y,3,1,c2);R(x,y+1,1,1,c2);if(((T*2)|0)%2===0||calm())R(x-1,y-3,1,1,"#fff");lamp(x,y,16,0,.4)}
  else if(m.t==="rune"){var pu=calm()?.5:.5+.5*Math.sin(T*3);R(x-4,y-4,9,9,"#5a5e72");R(x-3,y-3,7,7,"#33364a");var c=css(mix(ACC,[255,255,255],pu*.5));R(x,y-2,1,5,c);R(x-2,y,5,1,c);R(x-1,y-2,1,1,c);R(x+1,y+2,1,1,c);lamp(x,y,24,2,.7+pu*.3)}
  else{var pu2=calm()?.6:.6+.4*Math.sin(T*4),cs=pu2>.8?"#fff":"#ffe27a";R(x,y-4,1,9,cs);R(x-4,y,9,1,cs);R(x-1,y-1,3,3,"#ffd54a");R(x-3,y-3,1,1,cs);R(x+3,y-3,1,1,cs);R(x-3,y+3,1,1,cs);R(x+3,y+3,1,1,cs);lamp(x,y,20,0,.8)}}
function dCat(){var x=Math.round(CAT.x),g=Math.round(gyAt(x)),d=CAT.dir,c="#d98a3a",c2="#a8641f";
  if(CAT.st==="sleep"){R(x-5,g-4,10,4,c);R(x-6,g-3,2,3,c2);R(x+2,g-3,4,3,c2);R(x+4,g-5,1,1,c2);if(!calm()&&((T*1.2)|0)%2)spawn("tx",x+6,g-8,{s:"z",vy:-.15,m:40,c:"#cfd6ff"})}
  else if(CAT.st==="walk"){var f=((CAT.f/6)|0)%2;R(x-5,g-7,10,4,c);R(x+d*4-(d<0?1:0),g-10,4,4,c);R(x+d*5-(d<0?1:0),g-12,1,2,c2);R(x+d*7-(d<0?0:1),g-12,1,2,c2);R(x-d*6,g-9-f,2,5,c2);R(x-3,g-3,1,3,c2);R(x+2+f,g-3,1,3,c2);R(x-4-f,g-3,1,3,c2);R(x+d*6,g-9,1,1,"#111")}
  else{R(x-3,g-7,6,7,c);R(x-3,g-11,6,4,c);R(x-3,g-13,1,2,c2);R(x+2,g-13,1,2,c2);R(x-d*5,g-3,2,3,c2);R(x-d*6,g-2,2,1,c2);R(x-2,g-9,1,1,"#111");R(x+1,g-9,1,1,"#111");R(x-1,g-3,3,3,"#f2d2a0")}}
function dPlayer(){
  var mv=Math.abs(P.vx)>.3&&P.gr,f=!P.gr?SP.j:mv?[SP.a,SP.st,SP.b,SP.st][((T*9)|0)%4]:SP.st,px=Math.round(P.x),py=Math.round(P.y),fl=floorAt(P.x);
  if(fl!==Infinity&&fl-P.y<40)R(px-4,Math.round(fl)-1,8,1,"rgba(0,0,0,.25)");
  var wv=calm()?0:1,ac=css(mix(ACC,[255,255,255],.2));for(var i=0;i<3;i++)R(px-P.face*(5+i*2),py-9+Math.round(Math.sin(T*8-i)*(mv?1.6:.6)*wv)+(P.gr?0:-P.vy*.6|0),2,2,ac);
  ctx.save();ctx.translate(px,py-14);if(P.face<0)ctx.scale(-1,1);ctx.drawImage(f,-5,0);ctx.restore();
  if(PAL.L<.55||scene!=="world")lamp(P.x,P.y-9,scene==="world"?30:24,1,.6)}
function drawFG(){var x0=Math.round(cam.x),s0=Math.floor(x0/7)-1,wind=calm()?0:Math.round(Math.sin(T*1.7)*1);
  for(var i=s0;i<s0+VW/7+3;i++)if(hash(i*4.1)>.82){var wx=i*7+Math.round(hash(i)*5),g=Math.round(gyAt(wx)),h=4+((hash(i*3)*4)|0);ctx.fillStyle=css(mix(TH.gr2,TH.leaf2,.3));ctx.fillRect(wx,g-h+3,1,h);ctx.fillRect(wx+1+wind,g-h+2,1,h);ctx.fillRect(wx-1,g-h+4,1,h-1)}}
function drawCreatures(){
  var fa=(1-PAL.L)*(WX.k[1]+WX.k[2]>.6?.3:1);if(TH.ff)fa=Math.max(fa,.15+.85*fa);
  if(fa>.1){var n=TH.ff?42:26,st=calm();for(var i=0;i<n;i++){var f=FF[i];if(!vis(f.x,20))continue;var x=f.x+(st?0:Math.sin(T*.5*f.s+f.ph)*8),y=gyAt(f.x)-8-f.y*40+(st?0:Math.sin(T*.7*f.s+f.ph*2)*5),tw=st?.8:.5+.5*Math.sin(T*3*f.s+f.ph);
      R(x,y,1,1,css([216,255,122],clamp(fa*tw*1.4,0,1)));if(tw>.7)lamp(x,y,9,0,.3*fa)}}
  if(PAL.L>.5&&WX.k[1]+WX.k[2]<.4&&WX.cover<.3){var bs=[[120,0],[260,1],[420,2],[520,3],[1000,4],[1240,5]];for(var j=0;j<bs.length;j++){var b=bs[j];if(!vis(b[0],70))continue;var t=calm()?0:T,bx=b[0]+Math.sin(t*.7+b[1])*40,by=gyAt(b[0])-16-Math.sin(t*1.3+b[1]*2)*6,fl=calm()?0:((T*7+b[1])|0)%2,bc=css([ACC3,ACC2,ACC,[255,213,74]][b[1]%4]);
      R(bx,by,1,2,"#222");R(bx-2,by-fl,2,2,bc);R(bx+1,by-fl,2,2,bc)}}
}
function drawWeather(){
  if(calm())return;var rk=Math.max(WX.k[1],WX.k[2]),sk=WX.k[3],i;
  if(rk>.05){var n=Math.floor(150*rk*(WX.k[2]>.3?1:.7)),w=1+WX.k[2]*.8;ctx.fillStyle="rgba(190,215,255,"+(.5+WX.k[2]*.2).toFixed(2)+")";for(i=0;i<n;i++){var r=RAIN[i];r.y+=r.v*1.4;r.x-=w*.6;if(r.y>VH){r.y=-6;r.x=Math.random()*(VW+40)}if(r.x<-4)r.x=VW+4;ctx.fillRect(r.x|0,r.y|0,1,3)}}
  if(sk>.05){var n2=Math.floor(110*sk);ctx.fillStyle="#fff";for(i=0;i<n2;i++){var s=SNOW[i];s.y+=s.v;if(s.y>VH){s.y=-3;s.x=Math.random()*VW}ctx.fillRect((s.x+Math.sin(T*1.2+s.ph)*3)|0,s.y|0,i%4===0?2:1,i%4===0?2:1)}}
}
function drawFog(){var fk=WX.k[4];if(fk<.04)return;var cs=calm(),c=mix([200,208,220],PAL.bot,.4+(1-PAL.L)*.4);
  for(var b=0;b<5;b++){var y=VH*(.38+b*.1);ctx.fillStyle=css(c,fk*(.08+b*.045));ctx.fillRect(0,y,VW,VH-y)}
  for(var i=0;i<6;i++){var x=((i*80-(cs?0:T*(4+i))-cam.x*.2)%(VW+120)+VW+120)%(VW+120)-60,y2=VH*.55+((i*37)%50);ctx.fillStyle=css(c,fk*.22);ctx.fillRect(x,y2,70,5);ctx.fillRect(x+10,y2-2,40,2)}}
function drawLight(a,gs){
  var n=LG.length,i,k;if(a<.03&&gs<.03){return}
  if(a>=.03){lx.globalCompositeOperation="source-over";lx.clearRect(0,0,VW,VH);lx.fillStyle=css(scene==="cabin"?[18,10,8]:DARK,a);lx.fillRect(0,0,VW,VH);lx.globalCompositeOperation="destination-out";
    for(i=0;i<n;i++){var L=LG[i],sx=L[0]-Math.round(cam.x),sy=L[1]+Math.round(cam.oy);if(sx<-L[2]||sx>VW+L[2]||sy<-L[2]||sy>VH+L[2])continue;
      for(k=0;k<4;k++){lx.fillStyle="rgba(0,0,0,"+(.3*L[4]).toFixed(2)+")";lx.beginPath();lx.arc(sx,sy,L[2]*(1-k*.22),0,6.2832);lx.fill()}}
    ctx.drawImage(lc,0,0)}
  ctx.globalCompositeOperation="lighter";var ga=gs,cols=[[70,110,200],[255,150,60],[ACC[0]*.8,ACC[1]*.8,ACC[2]*.8]];
  for(i=0;i<n;i++){var M=LG[i],mx=M[0]-Math.round(cam.x),my=M[1]+Math.round(cam.oy);if(mx<-M[2]||mx>VW+M[2]||my<-M[2]||my>VH+M[2])continue;
    for(k=0;k<3;k++){ctx.fillStyle=css(cols[M[3]],.05*M[4]*ga);ctx.beginPath();ctx.arc(mx,my,M[2]*(.7-k*.2),0,6.2832);ctx.fill()}}
  ctx.globalCompositeOperation="source-over"}
function dCabinRoom(){
  var X0=Math.floor(cam.x)-2,Y0=-Math.ceil(cam.oy)-2,W2=VW+4,B=VH-cam.oy+2,i;
  R(X0,Y0,W2,150-Y0,"#5b3d29");for(i=Math.floor(X0/10)*10;i<X0+W2;i+=10)R(i,Y0,1,150-Y0,"#4d3322");R(X0,40,W2,4,"#3d281a");R(X0,118,W2,32,"#6b4a33");R(X0,118,W2,2,"#8a5a38");
  R(X0,150,W2,B-150,"#7a5230");for(i=0;i<B-150;i+=7)R(X0,152+i,W2,1,"#5f3f24");for(i=Math.floor(X0/24)*24;i<X0+W2;i+=24)R(i,150,1,B-150,"#5f3f24");
  R(262,Y0,300,B-Y0,"#0a0810");
  if(S.secret){R(262,Y0,140,150-Y0,"#2a2d3a");for(i=Y0;i<150;i+=8){R(262,i,140,1,"#1f212c");for(var j=262+(i/8%2)*10;j<400;j+=20)R(j,i,1,8,"#1f212c")}R(262,150,140,B-150,"#3a3d4c");for(i=0;i<B-150;i+=8)R(262,152+i,140,1,"#2c2f3c")}
  /* door */R(16,112,20,38,"#3d281a");R(18,114,16,36,"#7a4f2e");R(30,132,2,2,"#ffd54a");
  /* bed */R(22,114,4,36,WOOD2);R(24,134,56,16,WOOD2);R(26,130,52,8,"#d9d4e8");R(40,128,38,10,css(mix(ACC,[30,26,70],.4)));R(28,126,12,6,"#fff");R(78,134,4,16,WOOD2);
  /* table + lamp */R(108,126,44,3,WOOD3);R(112,129,3,21,WOOD2);R(145,129,3,21,WOOD2);R(116,124,8,2,"#f4ecd0");R(139,118,2,8,"#8a6a2a");R(135,112,10,7,"#ffd98a");
  /* window */R(158,68,32,34,"#3d281a");var sk=mix(PAL.top,PAL.bot,.55);R(160,70,28,30,css(sk));
  if(PAL.L<.5)for(i=0;i<7;i++)R(162+hash(i*3)*24,72+hash(i*9)*24,1,1,"rgba(255,255,240,"+(1-PAL.L).toFixed(2)+")");
  if(WX.k[1]+WX.k[2]>.3&&!calm())for(i=0;i<8;i++)R(162+((i*5+T*40)%24),72+((i*13+T*60)%26),1,3,"rgba(190,215,255,.7)");
  R(173,70,2,30,"#3d281a");R(160,84,28,2,"#3d281a");R(156,102,36,3,WOOD3);if(PAL.L>.3)R(160,100,28,2,"rgba(255,240,200,"+(PAL.L*.25).toFixed(2)+")");
  /* fireplace */R(188,108,36,42,"#7c7f8e");for(i=108;i<150;i+=6){R(188,i,36,1,"#666978");R(188+(i/6%2)*8,i,1,6,"#666978")}R(196,124,20,26,"#14100e");R(184,104,44,5,WOOD);R(194,Y0,24,104-Y0,"#7c7f8e");
  R(200,146,16,4,"#5a3a22");
  if(S.fire){var f=((T*8)|0)%3;R(202,134+f,12,12-f,"#ff6a2b");R(204,128+f,8,14,"#ffb347");R(206,124+f,4,10,"#fff3b0")}
  /* bookshelf */
  if(!S.secret){R(228,92,30,58,WOOD2);for(i=0;i<3;i++)R(228,108+i*16,30,2,"#4d3322");var bc=["#3b6ea5","#d9a441","#4f8a4f","#8a4f9a","#e8e0cf","#c07a3a"];
    for(var r2=0;r2<3;r2++)for(var b=0;b<9;b++){var bx=230+b*3,h=8+((hash(r2*9+b)*5)|0),red=r2===1&&(b===1||b===4||b===7),pulled=red&&S.books>(b===1?0:b===4?1:2),bd=108+r2*16;R(bx,bd-h+(pulled?2:0),2,h,red?(pulled?"#e86a5a":"#c0392b"):bc[(r2*3+b)%6])}}
  else{R(228,92,30,58,"#0d0a12");R(222,92,6,58,WOOD2)}
  /* secret room */
  if(S.secret){R(289,100,3,12,"#6b4a2a");var ff=((T*9)|0)%3;R(288,94+ff,5,6,"#ff6a2b");R(289,91+ff,3,6,"#ffb347");lamp(290,98,70,1,1);
    var ch=S.chest;R(330,138,22,12,WOOD);R(330,142,22,2,"#3d281a");R(339,142,4,4,"#ffd54a");if(!ch){R(329,132,24,7,WOOD3);R(329,136,24,1,"#3d281a");lamp(340,134,24,1,.5+(calm()?0:.3*Math.sin(T*3)))}else{R(329,124,24,6,WOOD3);R(331,131,18,3,"#ffd54a");R(334,128,3,3,"#fff3b0")}
    R(266,Y0+6,1,1,"#fff");R(268,100,1,6,"rgba(255,255,255,.3)");R(266,104,6,1,"rgba(255,255,255,.3)")}
  if(S.fire)lamp(206,132,86,1,1);lamp(140,118,52,1,.9);if(PAL.L<.5)lamp(174,86,44,0,.5)}
function dVoid(){
  var cs=calm(),i,bot=VH-cam.oy+10,top=-cam.oy-10;
  for(i=0;i<Math.ceil((bot-top)/4);i++){var f=clamp(i/((bot-top)/4),0,1);R(Math.floor(cam.x)-2,top+i*4,VW+4,4,css(mix([14,6,40],[40,12,70],f)))}
  for(i=0;i<90;i++){var sx=cam.x+(((hash(i*3.3)*VW-cam.x*(.1+hash(i)*.15))%VW)+VW)%VW,sy=-cam.oy+((hash(i*7.1)*VH+(cs?0:T*(2+hash(i)*4)))%VH);ctx.fillStyle=css(mix([255,255,255],ACC,hash(i)),.2+hash(i*2)*.6);ctx.fillRect(Math.round(sx),Math.round(sy),1,1)}
  var vx=cam.x+VW*.6,vy=-cam.oy+VH*.3;for(i=0;i<150;i++){var a=i*.22+(cs?0:T*.3),r=i*.85;ctx.fillStyle=css(i%2?ACC:ACC2,.12+.2*(1-i/150));ctx.fillRect(Math.round(vx+Math.cos(a)*r),Math.round(vy+Math.sin(a)*r*.6),2,1)}
  for(i=0;i<8;i++){var shx=((i*97+20-cam.x*.35)%(VW+60)+VW+60)%(VW+60)-30+cam.x,shy=50+hash(i*4)*90+(cs?0:Math.sin(T*.8+i)*5);R(shx,shy-4,1,8,css(ACC,.35));R(shx-1,shy-2,3,4,css(ACC,.35));R(shx-2,shy,5,1,css(ACC2,.4))}
  var a=PL.vd;for(i=0;i<a.length;i++)dPlat(a[i]);
  /* portals */
  for(var q=0;q<2;q++){var cx=q?526:34,by=q?140:150,cy=by-20;ctx.fillStyle=css(mix(ACC,[0,0,10],.7),.85);for(var dy=-20;dy<=20;dy++){var w=Math.round(12*Math.sqrt(1-dy*dy/400));ctx.fillRect(cx-w,cy+dy,w*2+1,1)}
    for(i=0;i<48;i++){var an=i*.5+(cs?0:T*2.4),rr=i*.25;R(cx+Math.cos(an)*rr*.9,cy+Math.sin(an)*rr*1.6,1,1,i%3?css(ACC2):"#fff")}
    for(dy=-22;dy<=22;dy++){var o=Math.round(14*Math.sqrt(1-dy*dy/484)),n2=Math.round(11*Math.sqrt(Math.max(0,1-dy*dy/400)));if(Math.abs(dy)>20){R(cx-o,cy+dy,o*2+1,1,css(ACC))}else{R(cx-o,cy+dy,o-n2+1,1,css(ACC));R(cx+n2,cy+dy,o-n2+1,1,css(ACC))}}
    lamp(cx,cy,60,2,1)}
  R(502,110,8,30,"#1b1730");R(503,111,6,1,css(ACC));R(505,116,2,5,css(ACC));R(504,124,4,1,css(ACC2));R(505,128,2,1,css(ACC))}
function drawScope(){
  ctx.fillStyle="#04050c";ctx.fillRect(0,0,VW,VH);var cx=VW>>1,cy=VH>>1,rr=Math.floor(Math.min(VW,VH)*.46),i,dx,dy;
  for(dy=-rr;dy<=rr;dy++){var w=Math.round(Math.sqrt(rr*rr-dy*dy));ctx.fillStyle=css(mix([6,8,30],[22,16,56],(dy+rr)/(rr*2)));ctx.fillRect(cx-w,cy+dy,w*2,1)}
  ctx.save();ctx.beginPath();ctx.arc(cx,cy,rr,0,6.2832);ctx.clip();
  for(i=0;i<SCP.stars.length;i++){var s=SCP.stars[i],x=cx+s[0]*rr*1.3-SCP.rx*.5,y=cy+s[1]*rr*1.3-SCP.ry*.5,tw=calm()?.8:.5+.5*Math.sin(T*2+s[3]);ctx.fillStyle="rgba(255,250,235,"+(.35+.6*tw).toFixed(2)+")";ctx.fillRect(x|0,y|0,s[2],s[2])}
  for(i=0;i<4;i++){ctx.fillStyle=css(i%2?ACC:ACC2,.07);ctx.beginPath();ctx.arc(cx+Math.cos(i*1.7)*rr*.5,cy+Math.sin(i*2.3)*rr*.4,rr*.35,0,6.2832);ctx.fill()}
  var LN=[[0,1],[1,4],[2,3]];for(i=0;i<3;i++){var A=LN[i][0],B=LN[i][1];if(SCP.hit[A]&&SCP.hit[B])lineP(cx+GL[A][0],cy+GL[A][1],cx+GL[B][0],cy+GL[B][1],SCP.done?"#fff3b0":"rgba(255,235,150,.7)")}
  for(i=0;i<5;i++){var gx=cx+GL[i][0],gy=cy+GL[i][1],d=Math.hypot(GL[i][0]-SCP.rx,GL[i][1]-SCP.ry),pu=calm()?.6:.5+.5*Math.sin(T*5+i);
    if(SCP.hit[i]){R(gx-1,gy-1,3,3,"#ffd54a");R(gx,gy-3,1,7,"#fff3b0");R(gx-3,gy,7,1,"#fff3b0")}
    else{var br=d<12?1:d<28?.55:.28+.2*pu;ctx.fillStyle="rgba(255,255,255,"+br.toFixed(2)+")";ctx.fillRect(gx,gy,1,1);if(d<28){ctx.fillRect(gx-1,gy,3,1);ctx.fillRect(gx,gy-1,1,3)}}}
  ctx.restore();
  for(i=0;i<220;i++){var an=i/220*6.2832;R(cx+Math.cos(an)*(rr+1),cy+Math.sin(an)*(rr+1),2,2,"#2a2c3e")}
  var rx=cx+Math.round(SCP.rx),ry=cy+Math.round(SCP.ry);for(i=0;i<16;i++){var a2=i/16*6.2832;R(rx+Math.cos(a2)*9,ry+Math.sin(a2)*9,1,1,css(ACC))}R(rx,ry,1,1,"#fff");R(rx-14,ry,4,1,css(ACC));R(rx+11,ry,4,1,css(ACC));R(rx,ry-14,1,4,css(ACC));R(rx,ry+11,1,4,css(ACC));
  var n=SCP.hit[0]+SCP.hit[1]+SCP.hit[2]+SCP.hit[3]+SCP.hit[4];txt(SCP.done?"THE BLADE":"GLINTS "+n+"/5",cx-txtW(SCP.done?"THE BLADE":"GLINTS "+n+"/5")/2,VH-12,"#cfd6ff");txt("ESC EXIT",4,VH-8,"#6a6f90")}
function lineP(x0,y0,x1,y1,c){x0|=0;y0|=0;x1|=0;y1|=0;var dx=Math.abs(x1-x0),dy=-Math.abs(y1-y0),sx=x0<x1?1:-1,sy=y0<y1?1:-1,e=dx+dy;ctx.fillStyle=c;for(var n=0;n<400;n++){ctx.fillRect(x0,y0,1,1);if(x0===x1&&y0===y1)break;var e2=2*e;if(e2>=dy){e+=dy;x0+=sx}if(e2<=dx){e+=dx;y0+=sy}}}
function drawParts(){for(var i=0;i<PT.length;i++){var p=PT[i],a=1-p.l/p.m;
  if(p.k==="tx"){txt(p.s,p.x-txtW(p.s)/2,p.y,p.c)}
  else if(p.k==="sm"){ctx.fillStyle="rgba(210,210,220,"+(a*.5).toFixed(2)+")";ctx.fillRect(Math.round(p.x),Math.round(p.y),Math.round(p.s),Math.round(p.s))}
  else if(p.k==="ht"){R(p.x,p.y,1,1,"#ff7ab8");R(p.x+2,p.y,1,1,"#ff7ab8");R(p.x,p.y+1,3,1,"#ff7ab8");R(p.x+1,p.y+2,1,1,"#ff7ab8")}
  else if(p.k==="ff"){R(p.x,p.y,1,1,"#ffd8ff")}
  else{ctx.globalAlpha=clamp(a*1.4,0,1);R(p.x,p.y,p.k==="du"?2:1,p.k==="du"?2:1,p.c);ctx.globalAlpha=1;if(p.k==="sp"&&p.c.charAt(0)!=="r")lamp(p.x,p.y,5,1,.2)}}}
function render(){
  ctx.setTransform(1,0,0,1,0,0);ctx.globalCompositeOperation="source-over";ctx.globalAlpha=1;LG.length=0;
  if(mode==="scope"){drawScope();return}
  var sh=cam.sh>0&&!calm()?Math.round((Math.random()-.5)*cam.sh*.5):0;
  if(scene==="world"){drawSky();drawParallax()}
  ctx.save();ctx.translate(-Math.round(cam.x)+sh,Math.round(cam.oy));
  if(scene==="world"){
    drawGround();drawTrees();
    if(vis(96))dSign(96);if(vis(232))dLamp(232);if(vis(540))dLamp(540);if(vis(860))dLamp(860);if(vis(1030))dLamp(1030);if(vis(1700))dLamp(1700);
    var pw=PL.world,i;for(i=0;i<pw.length;i++){var p=pw[i];if(p.k==="stone"||p.k==="cloud")dPlat(p)}
    if(vis(300))dCabin(300);if(vis(255))dCrate(pw[3]);if(vis(440))dStatue(440);if(vis(486))dRing(486);if(vis(566))dTent(566);if(vis(606))dCrate(pw[5]);if(vis(640))dDesk(640);if(vis(706))dFire(706);if(vis(780))dBoard(780);
    water();if(vis(900,130))dPier();if(vis(1110,90))dPortal(1110);if(vis(1780,110))dObs(1780);if(vis(1838))dScope(1838);
    if(TH.pumpkin){[150,380,470,830,1200,1620].forEach(function(x){if(vis(x))dPumpkin(x)})}
    drawCreatures();
  }else if(scene==="cabin"){dCabinRoom()}else{dVoid()}
  for(var j=0;j<ITEMS.length;j++){var m=ITEMS[j];if(m.v||m.sc!==scene||S.items[m.id]||!vis(m.x,30))continue;dItem(m)}
  if(scene==="world"&&vis(CAT.x,20))dCat();
  dPlayer();
  if(scene==="world"){drawFG();var wx0=Math.round(P.x)-8;ctx.globalAlpha=.4;for(var q=wx0;q<wx0+17;q++){var g=gyAt(q);if(g>151.5){R(q,151,1,Math.ceil(g-151),"#4a90d0")}}ctx.globalAlpha=1}
  drawParts();
  ctx.restore();
  if(scene==="world"){drawWeather();drawFog();drawLight(PAL.da,clamp(PAL.da/.5,0,1));if(PAL.wa>.01){ctx.fillStyle=css(TH.twi,PAL.wa);ctx.fillRect(0,0,VW,VH)}
    if(WX.fl>.02){ctx.fillStyle="rgba(235,240,255,"+(WX.fl*.32).toFixed(2)+")";ctx.fillRect(0,0,VW,VH)}}
  else if(scene==="cabin")drawLight(.5+PAL.da*.12-(S.fire?.1:0),1);else drawLight(0,1);
  if(FADE.a>0){ctx.fillStyle="rgba(0,0,0,"+FADE.a.toFixed(2)+")";ctx.fillRect(0,0,VW,VH)}
}

/* ---------- HUD / UI ---------- */
var btnsEl=$("pwBtns"),cntEl=$("pwCount"),clkEl=$("pwClock"),jEl=$("pwJournal"),tEl=$("pwTerm");
var BT=[["journal","book","Journal (J)"],["snd","snd","Sound (M)"],["time","sun","Time of day (T)"],["wx","cloud","Weather (G)"],["exp","exp","Expand (F)"]];
btnsEl.innerHTML=BT.map(function(b){return'<button type="button" class="pw-btn" data-b="'+b[0]+'" aria-label="'+b[2]+'" title="'+b[2]+'">'+icon(b[1],16)+"</button>"}).join("");
function btn(n){return btnsEl.querySelector('[data-b="'+n+'"]')}
function setIcon(n,ic){var b=btn(n);if(b.getAttribute("data-i")!==ic){b.setAttribute("data-i",ic);b.innerHTML=icon(ic,16)}}
function uiBtns(){
  setIcon("snd",AU.on?"snd":"mute");btn("snd").setAttribute("aria-pressed",AU.on?"true":"false");
  setIcon("time",PAL.L>.5?"sun":"moon");btn("time").title="Time: "+["day-night cycle","site clock (IST)","always day","always night"][S.tm]+" (T)";btn("time").setAttribute("aria-pressed",S.tm?"true":"false");
  btn("wx").title="Weather: "+["auto","clear","rain","storm","snow","fog"][S.wm]+" (G)";btn("wx").setAttribute("aria-pressed",S.wm?"true":"false");
  setIcon("exp",expanded?"col":"exp");btn("exp").title=expanded?"Exit expanded mode (F)":"Expanded mode (F)";btn("exp").setAttribute("aria-pressed",expanded?"true":"false");
  btn("journal").setAttribute("aria-pressed",uiOpen==="journal"?"true":"false")}
function hudRefresh(){
  cntEl.innerHTML=icon("gem",12)+" "+found()+"/"+total();
  var h=Math.floor(S.tod*24),m=Math.floor((S.tod*24-h)*60);clkEl.innerHTML=icon(PAL.L>.5?"sun":"moon",12)+" "+(h<10?"0":"")+h+":"+(m<10?"0":"")+m+" &middot; "+WXN[WX.cur];
  uiBtns();hudDirty=false}
function updPrompt(){
  var t="";if(uiOpen||FADE.dir||mode==="scope"){t=""}
  else if(wishT>0&&SS.on)t="Make a wish!";else if(near)t=typeof near.lab==="function"?near.lab():near.lab;
  if(t!==lastPrompt){lastPrompt=t;if(t){promptEl.innerHTML="<kbd>"+(touchEl.classList.contains("on")?"ACT":"E")+"</kbd> "+esc(t);promptEl.hidden=false}else promptEl.hidden=true}}
btnsEl.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var k=b.getAttribute("data-b");
  if(k==="journal")toggleJournal();else if(k==="snd")toggleSound();else if(k==="time")cycleTime();else if(k==="wx")cycleWx();else if(k==="exp")setExpanded(!expanded);
  if(!uiOpen)try{stage.focus({preventScroll:true})}catch(x){}});

function openUI(n,el){closeUI(true);uiOpen=n;el.hidden=false;clearKeys();actQ=0;hudDirty=true}
function closeUI(quiet){jEl.hidden=true;tEl.hidden=true;if(document.activeElement&&stage.contains(document.activeElement)&&document.activeElement!==stage)document.activeElement.blur();var was=uiOpen;uiOpen="";hudDirty=true;if(!quiet&&was)try{stage.focus({preventScroll:true})}catch(x){}}
function toggleJournal(){if(uiOpen==="journal")closeUI();else{buildJournal();openUI("journal",jEl);jEl.tabIndex=-1;try{jEl.focus({preventScroll:true})}catch(x){}}}
var resetArm=0;
function buildJournal(){
  var f=found(),t=total(),d=discCount(),n=DISC.length,pct=Math.round((f+d)/(t+n)*100),co=kinds("coin"),ge=kinds("gem"),ru=kinds("rune"),st=kinds("star"),h="";
  h+='<div class="pw-ph"><h3>&#9670; DISCOVERY JOURNAL</h3><button type="button" class="pw-pb" data-a="close">CLOSE (J)</button></div>';
  h+='<div class="pw-meter" aria-hidden="true"><i style="width:'+pct+'%"></i></div><div class="m" style="font-size:.7rem;color:var(--mute);margin:-6px 0 10px">World progress: <b style="color:var(--text)">'+pct+'%</b></div>';
  h+='<div class="pw-stats"><div><b>'+f+'/'+t+'</b><span>COLLECTIBLES</span></div><div><b>'+co[0]+'/'+co[1]+'</b><span>COINS</span></div><div><b>'+ge[0]+'/'+ge[1]+'</b><span>GEMS</span></div><div><b>'+ru[0]+'/'+ru[1]+'</b><span>RUNES</span></div><div><b>'+st[0]+'/'+st[1]+'</b><span>STARS</span></div><div><b>'+d+'/'+n+'</b><span>DISCOVERIES</span></div></div><div class="pw-dl">';
  DISC.forEach(function(x){var g=S.disc[x[0]];h+='<div class="pw-d '+(g?"got":"lock")+'"><b>'+(g?esc(x[1]):"???")+'</b><span>'+esc(g?x[2]:"Hint: "+x[3])+'</span></div>'});
  h+='</div><div class="pw-foot"><button type="button" class="pw-pb" data-a="calm" aria-pressed="'+(S.calm?"true":"false")+'">CALM MODE: '+(mqCalm.matches?"ON (SYSTEM)":S.calm?"ON":"OFF")+'</button><button type="button" class="pw-pb" data-a="reset">'+(resetArm?"CLICK AGAIN TO CONFIRM":"RESET PROGRESS")+'</button></div>';
  jEl.innerHTML=h}
jEl.addEventListener("click",function(e){var b=e.target.closest("button");if(!b)return;var a=b.getAttribute("data-a");
  if(a==="close")closeUI();
  else if(a==="calm"){S.calm=S.calm?0:1;dirty();stage.classList.toggle("pw-calm",calm());buildJournal()}
  else if(a==="reset"){if(!resetArm){resetArm=1;buildJournal();setTimeout(function(){if(resetArm){resetArm=0;if(uiOpen==="journal")buildJournal()}},4000)}
    else{resetArm=0;S.items={};S.disc={};S.fire=S.books=S.secret=S.chest=S.portal=0;S.wxSeen={};doneShown=false;PT.length=0;dirty();save();if(scene!=="world"){scene="world";P.x=70;P.y=gyAt(70)}hudDirty=true;buildJournal()}}});

/* ---------- terminal ---------- */
var outEl=$("pwOut"),inEl=$("pwIn"),hist=[],hi=0,GO={top:"body",about:".about",links:".links",games:".games",interests:".interests",clock:".clock",themes:".themes",projects:".projects",playlist:".spotify",skin:".fitcheck",fitcheck:".fitcheck",contact:".contact"};
function out(s,c){var d=document.createElement("div");if(c)d.className=c;d.textContent=s;outEl.appendChild(d);outEl.scrollTop=outEl.scrollHeight}
function openTerm(){openUI("term",tEl);if(!outEl.children.length){out("PixelOS 1.0  -  workstation online","c");out("Type 'help' for commands.","m")}setTimeout(function(){try{inEl.focus({preventScroll:true})}catch(x){inEl.focus()}},30)}
inEl.addEventListener("keydown",function(e){e.stopPropagation();
  if(e.key==="Escape"){e.preventDefault();closeUI()}
  else if(e.key==="ArrowUp"){e.preventDefault();if(hist.length){hi=Math.max(0,hi-1);inEl.value=hist[hi]||""}}
  else if(e.key==="ArrowDown"){e.preventDefault();hi=Math.min(hist.length,hi+1);inEl.value=hist[hi]||""}});
inEl.addEventListener("keyup",function(e){e.stopPropagation()});
$("pwForm").addEventListener("submit",function(e){e.preventDefault();var v=inEl.value.trim();inEl.value="";if(!v)return;out("visitor@pixel:~$ "+v,"c");hist.push(v);hi=hist.length;runCmd(v)});
var THEMES=["midnight","onyx","starlight","halloween","eclipse","frost","forest"];
function runCmd(line){
  var a=line.split(/\s+/),c=a[0].toLowerCase(),r=a.slice(1).join(" ").toLowerCase();
  switch(c){
  case"help":out("help      this list\nabout     who built this world\nls [-a]   list files\ncat <f>   read a file\nprojects  list the project archive\ngoto <x>  jump the page: "+Object.keys(GO).filter(function(k){return k!=="fitcheck"}).join(", ")+"\ntheme <n> set site theme: "+THEMES.join(", ")+"\ntime <m>  cycle | ist | day | night\nweather   auto | clear | rain | storm | snow | fog\nneofetch  system info\nclear     clear screen\nexit      close terminal");break;
  case"about":case"whoami":out("A tiny pixel world built into this profile page. Canvas, ~1 file, no libraries.\nExplore, collect, and find the secrets.");break;
  case"ls":out(r.indexOf("a")>=0&&a[1]&&a[1].charAt(0)==="-"?".  ..  .rune  readme.txt  notes.md  projects/":"readme.txt  notes.md  projects/");break;
  case"cat":
    if(r==="readme.txt")out("Welcome, traveller. Use the arrow keys, find three runes, and wake the portal.");
    else if(r==="notes.md")out("TODO: hide something in a dotfile.\nTODO: feed the cat.\nTODO: look up at night.");
    else if(r===".rune"){if(S.items.r_term)out("The rune is already in your pocket.","m");else{out("   .-.\n  (o o)   a rune hums to life\n   |=|\n  __|__","c");collect("r_term",P.x,P.y-18);discover("dot")}}
    else out("cat: "+(r||"?")+": No such file","e");break;
  case"projects":var ps=document.querySelectorAll(".proj");if(!ps.length)out("No projects found.","m");[].forEach.call(ps,function(p){var h=p.querySelector("h3"),s=p.querySelector(".st");out("* "+(h?h.textContent:"?")+"  ["+(s?s.textContent:"")+"]")});out("Use 'goto projects' to jump to the archive.","m");break;
  case"goto":var sel=GO[r||"top"];if(!sel)out("goto: choose one of: "+Object.keys(GO).join(", "),"e");else{out("Jumping to "+(r||"top")+"...","m");setTimeout(function(){closeUI();toEl(sel)},350)}break;
  case"theme":if(THEMES.indexOf(r)<0)out("theme: choose one of: "+THEMES.join(", "),"e");else{var b=document.querySelector('[data-theme-btn="'+r+'"]');if(b){b.click();out("Theme set: "+r);discover("theme")}}break;
  case"themes":out(THEMES.join("  "));break;
  case"time":var tm={cycle:0,ist:1,day:2,night:3}[r];if(tm==null)out("time: cycle | ist | day | night","e");else{S.tm=tm;dirty();out("Time mode: "+r);hudDirty=true}break;
  case"weather":var wm={auto:0,clear:1,rain:2,storm:3,snow:4,fog:5}[r];if(wm==null)out("weather: auto | clear | rain | storm | snow | fog","e");else{S.wm=wm;dirty();out("Weather: "+r);hudDirty=true}break;
  case"neofetch":out("  _____    visitor@pixel\n | o o |   theme:   "+themeName+"\n |  ^  |   time:    "+(PAL.L>.5?"day":"night")+"\n  \\___/    weather: "+WXN[WX.cur]+"\n           items:   "+found()+"/"+total()+"\n           secrets: "+discCount()+"/"+DISC.length);break;
  case"date":out(new Date().toString());break;
  case"echo":out(line.slice(5));break;
  case"clear":outEl.textContent="";break;
  case"exit":case"quit":closeUI();break;
  case"sudo":out("visitor is not in the sudoers file. This incident will be reported to the duck.","e");break;
  case"rm":out("Nice try. The world is read-only.","e");break;
  case"coffee":out("Brewing... \u2615  The mug on the desk is warm.");break;
  case"hack":out("Accessing mainframe... ##########  100%\nJust kidding. There is no mainframe, only a duck.");break;
  default:out(c+": command not found. Try 'help'.","e")}}

/* ---------- audio ---------- */
var AU={c:null,m:null,on:false,nz:null,wind:null,rain:null,dly:null,noteT:0,cricT:0,iv:0};
function audioInit(){if(AU.c)return true;var C=window.AudioContext||window.webkitAudioContext;if(!C)return false;
  try{var c=AU.c=new C(),m=AU.m=c.createGain();m.gain.value=0;var cp=c.createDynamicsCompressor();m.connect(cp);cp.connect(c.destination);
    var b=c.createBuffer(1,c.sampleRate*2,c.sampleRate),d=b.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;AU.nz=b;
    function nzs(f1,type,f2,q){var s=c.createBufferSource();s.buffer=b;s.loop=true;var f=c.createBiquadFilter();f.type=type;f.frequency.value=f1;if(q)f.Q.value=q;var g=c.createGain();g.gain.value=0;s.connect(f);var last=f;if(f2){var f3=c.createBiquadFilter();f3.type="lowpass";f3.frequency.value=f2;f.connect(f3);last=f3}last.connect(g);g.connect(m);s.start();return g}
    AU.wind=nzs(420,"bandpass",null,.6);AU.rain=nzs(1500,"highpass",9000);
    var dl=AU.dly=c.createGain(),de=c.createDelay(1);de.delayTime.value=.34;var fb=c.createGain();fb.gain.value=.42;var lp=c.createBiquadFilter();lp.type="lowpass";lp.frequency.value=1800;dl.connect(m);dl.connect(de);de.connect(lp);lp.connect(fb);fb.connect(de);lp.connect(m);
    return true}catch(e){AU.c=null;return false}}
function tone(f0,f1,d,type,v,delay,bus){if(!AU.on)return;var c=AU.c,t=c.currentTime+(delay||0),o=c.createOscillator(),g=c.createGain();o.type=type||"square";o.frequency.setValueAtTime(f0,t);if(f1!==f0)o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+d);
  g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(v,t+.01);g.gain.exponentialRampToValueAtTime(.0001,t+d);o.connect(g);g.connect(bus||AU.m);o.start(t);o.stop(t+d+.05)}
function noise(d,f,v,type,delay){if(!AU.on)return;var c=AU.c,t=c.currentTime+(delay||0),s=c.createBufferSource();s.buffer=AU.nz;var fl=c.createBiquadFilter();fl.type=type||"lowpass";fl.frequency.value=f;var g=c.createGain();g.gain.setValueAtTime(v,t);g.gain.exponentialRampToValueAtTime(.0001,t+d);s.connect(fl);fl.connect(g);g.connect(AU.m);s.start(t);s.stop(t+d+.05)}
function sfx(n){if(!AU.on)return;
  switch(n){case"jump":tone(300,560,.12,"square",.04);break;case"land":tone(110,60,.07,"sine",.07);break;
  case"coin":tone(988,988,.07,"square",.04);tone(1319,1319,.16,"square",.04,.07);break;
  case"gem":tone(880,880,.08,"triangle",.07);tone(1175,1175,.08,"triangle",.07,.08);tone(1568,1568,.2,"triangle",.07,.16);break;
  case"rune":case"star":tone(440,880,.3,"triangle",.07);tone(660,1320,.4,"sine",.05,.12);tone(1320,1760,.5,"sine",.04,.25);break;
  case"disc":tone(523,523,.1,"triangle",.06);tone(659,659,.1,"triangle",.06,.1);tone(784,784,.1,"triangle",.06,.2);tone(1046,1046,.3,"triangle",.06,.3);break;
  case"door":noise(.25,500,.08,"lowpass");tone(180,110,.2,"triangle",.05);break;case"click":tone(520,480,.04,"square",.04);break;
  case"deny":tone(170,120,.2,"sawtooth",.04);break;case"magic":tone(500,1200,.35,"sine",.05);tone(750,1800,.35,"sine",.03,.08);break;
  case"portal":tone(90,700,1.1,"sawtooth",.04);tone(180,1400,1.1,"sine",.04,.1);noise(1,900,.05,"bandpass");break;
  case"thunder":noise(2.2,260,.3,"lowpass");break;case"splash":noise(.3,2400,.1,"highpass");break;
  case"meow":tone(620,900,.14,"triangle",.05);tone(900,600,.18,"triangle",.05,.14);break;case"quack":tone(420,300,.09,"square",.05);tone(380,260,.1,"square",.04,.12);break;
  case"chest":tone(330,330,.1,"triangle",.06);tone(494,494,.1,"triangle",.06,.1);tone(659,659,.1,"triangle",.06,.2);tone(988,988,.4,"triangle",.07,.3);break;
  case"win":for(var i=0;i<6;i++)tone(523*Math.pow(1.26,i),523*Math.pow(1.26,i),.25,"triangle",.06,i*.12);break}}
var PENT=[261.6,293.7,329.6,392,440,523.3,587.3,659.3],PENM=[220,261.6,293.7,329.6,392,440,523.3,587.3];
function tickAudio(){var c=AU.c;if(!c||!AU.on||c.state!=="running")return;var t=c.currentTime,rk=Math.max(WX.k[1],WX.k[2]),w=scene==="world";
  AU.rain.gain.setTargetAtTime(w?rk*.15:rk*.04,t,.5);AU.wind.gain.setTargetAtTime(w?.025+WX.k[2]*.08+WX.k[4]*.02:.008,t,.8);
  if(t>=AU.noteT){var night=PAL.L<.45,sc=scene==="vd"?PENM:night?PENM:PENT,f=sc[(Math.random()*sc.length)|0]*(scene==="vd"?.5:1),o=c.createOscillator(),g=c.createGain();o.type=scene==="vd"?"sine":"triangle";o.frequency.value=f;
    g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.05,t+.03);g.gain.exponentialRampToValueAtTime(.0001,t+2.4);o.connect(g);g.connect(AU.dly);g.connect(AU.m);o.start(t);o.stop(t+2.5);AU.noteT=t+(night?2.4:1.4)+Math.random()*1.8}
  if(w&&PAL.L<.3&&rk<.3&&t>=AU.cricT){for(var i=0;i<3;i++)tone(4300,4300,.04,"sine",.008,i*.07);AU.cricT=t+.5+Math.random()*.9}}
function toggleSound(){
  if(AU.on){AU.on=false;if(AU.m)AU.m.gain.setTargetAtTime(0,AU.c.currentTime,.1);clearInterval(AU.iv);S.snd=0;dirty();say("Sound off.",1400)}
  else{if(!audioInit()){say("Audio isn't available in this browser.",2200);return}AU.c.resume();AU.on=true;S.snd=1;dirty();AU.m.gain.setTargetAtTime(.55,AU.c.currentTime,.2);AU.noteT=0;clearInterval(AU.iv);AU.iv=setInterval(tickAudio,200);say("Ambience on. Press <b>M</b> to mute.",2000)}
  hudDirty=true}
function wantAudio(){if(S.snd&&!AU.on&&!AU.c){if(audioInit()){AU.c.resume();AU.on=true;AU.m.gain.setTargetAtTime(.55,AU.c.currentTime,.2);AU.iv=setInterval(tickAudio,200);hudDirty=true}}}
stage.addEventListener("pointerdown",wantAudio);stage.addEventListener("keydown",wantAudio);

/* ---------- layout / expanded ---------- */
var holder=document.createElement("div");holder.className="pw-holder";
function layout(){
  var cw=stage.clientWidth,ch=stage.clientHeight;if(!cw||!ch)return;var best=1,bd=1e9,s;
  for(s=1;s<=12;s++){var w=Math.floor(cw/s);if(w<260&&s>1)break;var d=Math.abs(w-360)+(w>480?1000:0);if(d<bd){bd=d;best=s}}
  SC=best;VW=Math.floor(cw/SC);VH=clamp(Math.floor(ch/SC),120,320);cv.width=VW;cv.height=VH;lc.width=VW;lc.height=VH;
  cv.style.width=VW*SC+"px";cv.style.height=VH*SC+"px";cv.style.left=Math.floor((cw-VW*SC)/2)+"px";cv.style.top=Math.floor((ch-VH*SC)/2)+"px";
  ctx.imageSmoothingEnabled=false;if(soilPat===null)buildSprites();camSnap();render()}
function setExpanded(on){
  if(on===expanded)return;expanded=on;
  if(on){holder.style.height=stage.offsetHeight+"px";stage.parentNode.insertBefore(holder,stage);document.body.appendChild(stage);stage.classList.add("pw-full");htmlEl.classList.add("pw-lock");
    try{if(stage.requestFullscreen){var pr=stage.requestFullscreen({navigationUI:"hide"});if(pr&&pr.catch)pr.catch(function(){})}else if(stage.webkitRequestFullscreen)stage.webkitRequestFullscreen()}catch(x){}}
  else{try{if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen();else if(document.webkitFullscreenElement&&document.webkitExitFullscreen)document.webkitExitFullscreen()}catch(x){}
    if(holder.parentNode){holder.parentNode.insertBefore(stage,holder);holder.parentNode.removeChild(holder)}stage.classList.remove("pw-full");htmlEl.classList.remove("pw-lock")}
  hudDirty=true;layout();try{stage.focus({preventScroll:true})}catch(x){}
  if(on)say("Expanded mode. Press <b>Esc</b> or <b>F</b> to exit.",2200);setTimeout(layout,120)}
document.addEventListener("fullscreenchange",function(){if(!document.fullscreenElement&&expanded)setExpanded(false)});
if(window.ResizeObserver)new ResizeObserver(window.mbRO(function(){layout()})).observe(stage);else addEventListener("resize",layout);

/* ---------- loop ---------- */
var last=0,raf=0,running=false,vis2=true;
function frame(ts){if(!running)return;raf=requestAnimationFrame(frame);var dt=Math.min(4,Math.max(0,(ts-last)/16.667));last=ts;if(!dt)return;
  update(dt);render();updPrompt();hudT+=dt;if(hudDirty||hudT>30){hudT=0;hudRefresh()}}
function startLoop(){if(running)return;running=true;last=performance.now();raf=requestAnimationFrame(frame)}
function stopLoop(){running=false;cancelAnimationFrame(raf)}
function sync(){var on=(vis2||expanded)&&!document.hidden;if(on)startLoop();else{stopLoop();clearKeys()}
  if(AU.c){if(on&&AU.on)AU.c.resume();else AU.c.suspend()}}
if("IntersectionObserver" in window)new IntersectionObserver(function(es){vis2=es[0].isIntersecting;sync()},{threshold:0}).observe(stage);
document.addEventListener("visibilitychange",function(){if(document.hidden){S.x=Math.round(P.x);save()}sync()});
addEventListener("pagehide",function(){S.x=Math.round(P.x);save()});

/* ---------- theme + motion hooks ---------- */
new MutationObserver(function(){readTheme();buildSprites();hudDirty=true;if(!running)render()}).observe(htmlEl,{attributes:true,attributeFilter:["data-theme"]});
function motion(){stage.classList.toggle("pw-calm",calm());if(!running)render()}
if(mqCalm.addEventListener)mqCalm.addEventListener("change",motion);else if(mqCalm.addListener)mqCalm.addListener(motion);

/* ---------- init ---------- */
(function(){
  buildSprites();
  var sx=clamp(+S.x||70,20,WW-20);P.x=sx;P.y=gyAt(sx);P.safe={x:P.x,y:P.y};cam.ref=P.y;
  if(S.items.s_const)SCP.done=true;
  var c=0;for(var q in S.wxSeen)c++;
  stage.classList.toggle("pw-calm",calm());
  layout();hudRefresh();camSnap();render();sync();
  if(htmlEl.getAttribute("data-theme")==="moonlight"||true)readTheme();
  try{if(localStorage.getItem("mb-pw-debug"))window.__pw={S:S,P:P,K:K,WX:WX,PAL:PAL,PT:PT,cam:cam,get scene(){return scene},get mode(){return mode},get ui(){return uiOpen},get exp(){return expanded},
    tp:function(x,y){P.x=x;P.y=y==null?gyAt(x):y;P.vx=P.vy=0;P.on=null;camSnap()},go:function(n,x,y){scene=n;P.x=x;P.y=y;P.vx=P.vy=0;P.on=null;camSnap()},tick:function(n){for(var i=0;i<n;i++)update(1)},render:render,found:found,total:total,runes:runes,OB:OB,ITEMS:ITEMS,PL:PL,say:say,act:function(){actQ=1},near:function(){return near},SCP:SCP,SS:SS,wish:function(){wishT=3;SS.on=true},get fade(){return FADE.dir}}}catch(e){}
})();
})();
