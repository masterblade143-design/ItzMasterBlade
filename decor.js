(function(){
  var main=document.querySelector("main"),els=[].slice.call(document.querySelectorAll(".gdeco"));
  function place(){
    els.forEach(function(el){
      var t=document.querySelector(el.getAttribute("data-near"));
      if(t)el.style.top=Math.round(t.offsetTop+(t.offsetHeight-el.offsetHeight)/2)+"px";
    });
  }
  place();addEventListener("load",place);addEventListener("resize",place);
  if(window.ResizeObserver)new ResizeObserver(window.mbRO(place)).observe(main);
  els.forEach(function(el){el.addEventListener("load",place)});
})();

(function(){
  var box=document.querySelector(".lights"),P=[[0.8466,0.1992],[0.4624,0.2923],[0.8867,0.355],[0.7771,0.4343],[0.2847,0.4537],[0.8118,0.5205],[0.0493,0.5335],[0.4116,0.5754],[0.2279,0.5916],[0.1021,0.6135],[0.7342,0.6317],[0.5902,0.671],[0.1734,0.7059],[0.9502,0.7274],[0.5505,0.8615],[0.6829,0.9186],[0.3302,0.9611]];
  function build(){
    var h=box.clientHeight||120,n=Math.ceil(innerWidth/(h*577/263))+1;
    if(box.childElementCount===n)return;
    box.textContent="";
    for(var k=0;k<n;k++){
      var t=document.createElement("div");t.className="lt"+(k%2?" f":"");
      var im=new Image();im.src="assets/img/lights.png";im.alt="";im.draggable=false;t.appendChild(im);
      P.forEach(function(p,j){var d=document.createElement("i");d.style.cssText="left:"+p[0]*100+"%;top:"+p[1]*100+"%;--t:"+(2.4+(j*.37+k*.21)%2.2).toFixed(2)+"s;--dl:-"+((j*.53+k*.7)%3).toFixed(2)+"s";t.appendChild(d)});
      box.appendChild(t);
    }
  }
  build();var rt;addEventListener("resize",function(){clearTimeout(rt);rt=setTimeout(build,150)});
})();
