(function(){
  var KEY="todo-items", tasks=[], filter="all", editId=null, q="";
  var list=document.getElementById("list"), input=document.getElementById("input");
  var due=document.getElementById("due"), prio=document.getElementById("prio");
  var ORDER={high:0,medium:1,low:2};
  var I={
    edit:'<svg viewBox="0 0 24 24"><path d="M12 20h9M16.5 3.5a2.1 2.1 0 013 3L7 19l-4 1 1-4z"/></svg>',
    trash:'<svg viewBox="0 0 24 24"><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14"/></svg>',
    cal:'<svg viewBox="0 0 24 24"><path d="M3 5h18v16H3zM3 10h18M8 3v4M16 3v4"/></svg>',
    moon:'<svg viewBox="0 0 24 24"><path d="M21 13A9 9 0 1111 3a7 7 0 0010 10z"/></svg>',
    sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    box:'<svg viewBox="0 0 24 24"><path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/></svg>'
  };

  try{ tasks=JSON.parse(localStorage.getItem(KEY))||[]; }catch(e){ tasks=[]; }
  if(!Array.isArray(tasks)) tasks=[];

  function pad(n){ return (n<10?"0":"")+n; }
  function todayStr(){ var d=new Date(); return d.getFullYear()+"-"+pad(d.getMonth()+1)+"-"+pad(d.getDate()); }
  function fmt(s){ return new Date(s+"T00:00:00").toLocaleDateString(undefined,{month:"short",day:"numeric"}); }
  function save(){ try{ localStorage.setItem(KEY,JSON.stringify(tasks)); }catch(e){} }
  function cap(s){ return s.charAt(0).toUpperCase()+s.slice(1); }

  document.getElementById("today").textContent =
    new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});

  function render(){
    list.innerHTML="";
    var shown=tasks.filter(function(t){
      var okF = filter==="all" || (filter==="done"?t.done:!t.done);
      var okQ = !q || t.text.toLowerCase().indexOf(q)!==-1;
      return okF && okQ;
    }).sort(function(a,b){
      if(a.done!==b.done) return a.done?1:-1;
      var pa=ORDER[a.p||"medium"], pb=ORDER[b.p||"medium"];
      if(pa!==pb) return pa-pb;
      if(a.due && b.due) return a.due<b.due?-1:a.due>b.due?1:0;
      if(a.due) return -1; if(b.due) return 1;
      return 0;
    });
    if(!shown.length){
      var e=document.createElement("li"); e.className="empty";
      e.innerHTML=I.box+"<div></div>";
      e.lastChild.textContent = tasks.length ? "No tasks in this view." : "Nothing here yet. Add your first task above.";
      list.appendChild(e);
    }
    shown.forEach(function(t){
      var p=t.p||"medium";
      var li=document.createElement("li"); li.className="task"+(t.done?" done":"");
      var lab=document.createElement("label"); lab.className="check";
      var cb=document.createElement("input"); cb.type="checkbox"; cb.checked=t.done;
      cb.setAttribute("aria-label","Mark complete");
      cb.onchange=function(){ t.done=cb.checked; save(); render(); };
      lab.appendChild(cb);
      var body=document.createElement("div"); body.className="body";

      if(editId===t.id){
        var ed=document.createElement("input"); ed.type="text"; ed.className="editbox"; ed.value=t.text; ed.maxLength=200;
        ed.setAttribute("aria-label","Edit task");
        var finished=false;
        var commit=function(ok){
          if(finished) return; finished=true;
          var v=ed.value.trim();
          if(ok && v) t.text=v;
          editId=null; save(); render();
        };
        ed.onkeydown=function(ev){ if(ev.key==="Enter") commit(true); else if(ev.key==="Escape") commit(false); };
        ed.onblur=function(){ commit(true); };
        body.appendChild(ed);
        li.append(lab,body);
        list.appendChild(li);
        ed.focus(); ed.setSelectionRange(ed.value.length,ed.value.length);
        return;
      }

      var title=document.createElement("div"); title.className="title"; title.textContent=t.text;
      var chips=document.createElement("div"); chips.className="chips";
      var pc=document.createElement("span"); pc.className="chip pr-"+p;
      pc.innerHTML='<span class="dot"></span>'; pc.appendChild(document.createTextNode(cap(p)));
      chips.appendChild(pc);
      if(t.due){
        var dc=document.createElement("span"); dc.className="chip";
        var late=!t.done && t.due<todayStr();
        if(late) dc.className+=" late";
        dc.innerHTML=I.cal; dc.appendChild(document.createTextNode((late?"Overdue \u00b7 ":"")+fmt(t.due)));
        chips.appendChild(dc);
      }
      body.append(title,chips);

      var acts=document.createElement("div"); acts.className="actions";
      var eb=document.createElement("button"); eb.className="act"; eb.type="button"; eb.innerHTML=I.edit; eb.setAttribute("aria-label","Edit task");
      eb.onclick=function(){ editId=t.id; render(); };
      var db=document.createElement("button"); db.className="act del"; db.type="button"; db.innerHTML=I.trash; db.setAttribute("aria-label","Delete task");
      db.onclick=function(){ tasks=tasks.filter(function(x){return x.id!==t.id}); save(); render(); };
      acts.append(eb,db);
      li.append(lab,body,acts); list.appendChild(li);
    });
    var left=tasks.filter(function(t){return !t.done}).length;
    document.getElementById("count").textContent = left+(left===1?" task remaining":" tasks remaining");
    document.getElementById("st-total").textContent = tasks.length;
    document.getElementById("st-active").textContent = left;
    document.getElementById("st-done").textContent = tasks.length-left;
  }

  document.getElementById("form").addEventListener("submit",function(ev){
    ev.preventDefault();
    var v=input.value.trim(); if(!v) return;
    tasks.push({id:Date.now()+Math.random(),text:v,done:false,p:prio.value,due:due.value||""});
    input.value=""; due.value=""; prio.value="medium"; save(); render();
  });

  document.getElementById("filters").addEventListener("click",function(ev){
    var b=ev.target.closest("button"); if(!b) return;
    filter=b.dataset.f;
    this.querySelectorAll("button").forEach(function(x){ x.setAttribute("aria-pressed", x===b?"true":"false"); });
    render();
  });

  document.getElementById("search").addEventListener("input",function(){
    q=this.value.trim().toLowerCase(); render();
  });

  document.getElementById("clear").onclick=function(){
    tasks=tasks.filter(function(t){return !t.done}); save(); render();
  };

  var root=document.documentElement, themeBtn=document.getElementById("theme");
  function isDark(){
    var t=root.getAttribute("data-theme");
    if(t) return t==="dark";
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  }
  function themeIcon(){ themeBtn.innerHTML = isDark() ? I.sun : I.moon; }
  try{ var saved=localStorage.getItem("todo-theme"); if(saved) root.setAttribute("data-theme",saved); }catch(e){}
  themeBtn.onclick=function(){
    var next=isDark()?"light":"dark";
    root.setAttribute("data-theme",next);
    try{ localStorage.setItem("todo-theme",next); }catch(e){}
    themeIcon();
  };
  themeIcon();
  render();
})();