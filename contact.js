/* Anonymous inbox form. Set CONTACT_API to your Cloudflare Worker URL (see inbox-backend/README.md). */
(function(){
  var CONTACT_API="https://profile-inbox.YOUR-SUBDOMAIN.workers.dev";
  var f=document.getElementById("ctForm");if(!f)return;
  var ta=document.getElementById("ctMsg"),hp=document.getElementById("ctHp"),cnt=document.getElementById("ctCount"),
      btn=document.getElementById("ctSend"),st=document.getElementById("ctStatus"),COOL=30000;
  function say(t,c){st.textContent=t;st.className="ct-status"+(c?" "+c:"")}
  function upd(){cnt.textContent=ta.value.length+" / 1000"}
  ta.addEventListener("input",function(){upd();if(st.className.indexOf("bad")>-1)say("")});
  f.addEventListener("submit",function(e){
    e.preventDefault();
    var msg=ta.value.trim();
    if(hp.value){say("Sent. Thank you!","ok");ta.value="";upd();return}
    if(msg.length<3){say("Please write a little more.","bad");ta.focus();return}
    var last=0;try{last=+localStorage.getItem("ct-last")||0}catch(x){}
    if(Date.now()-last<COOL){say("Give it a few seconds before sending another.","bad");return}
    if(CONTACT_API.indexOf("YOUR-")>-1){say("The inbox isn't connected yet.","bad");return}
    var topic=(f.querySelector('input[name="ctTopic"]:checked')||{}).value||"Feedback";
    btn.disabled=true;say("Sending...");
    fetch(CONTACT_API+"/api/message",{method:"POST",headers:{"Content-Type":"application/json"},
      body:JSON.stringify({message:msg,topic:topic,hp:""}),credentials:"omit",referrerPolicy:"no-referrer"})
    .then(function(r){
      if(r.ok){ta.value="";upd();try{localStorage.setItem("ct-last",String(Date.now()))}catch(x){}say("Sent! Thank you, it arrived anonymously.","ok")}
      else if(r.status===429)say("Too many messages for now. Try again later.","bad");
      else if(r.status===400)say("That message couldn't be sent. Check the length and try again.","bad");
      else say("Something went wrong. Please try again.","bad");
    })
    .catch(function(){say("Couldn't reach the inbox. Check your connection and retry.","bad")})
    .then(function(){btn.disabled=false});
  });
  upd();
})();
