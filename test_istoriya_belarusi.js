let activeTab = 1;
function setTheme(t){
  document.body.dataset.theme = t;
  try{ localStorage.setItem("hb-theme", t); }catch(e){}
}

let checked = {1:false, 2:false, 3:false};
let lastData = {1:[], 2:[], 3:[]};
const tabTitles = {1:"Вкладка 1 · Тест 45 вопросов", 2:"Вкладка 2 · Новые 32 вопроса", 3:"Вкладка 3 · Даты (случайный вариант)"};
const tabFiles = {1:"vkladka1-45", 2:"vkladka2-32", 3:"vkladka3-daty"};

function pane(t){ return document.getElementById("pane"+t); }

function switchTab(t, scroll){
  activeTab = t;
  [1,2,3].forEach(function(k){
    document.getElementById("pane"+k).hidden = (k!==t);
    document.getElementById("tabbtn"+k).classList.toggle("on", k===t);
  });
  try{ history.replaceState(null, "", "#tab"+t); }catch(e){}
  updateProgress();
  if(scroll!==false) document.querySelector(".tabbar").scrollIntoView({behavior:"smooth"});
}

function norm(s){return (s||"").toLowerCase().replace(/ё/g,"е").replace(/[^а-яa-z0-9]/g,"");}

function getQText(q){
  const h = q.querySelector("h3");
  return h ? h.innerText : ("Вопрос "+q.dataset.n);
}

function getUserAnswer(q){
  const type = q.dataset.type;
  if(type==="choice"){
    const sel = q.querySelector('input[type=radio]:checked');
    if(!sel) return {text:"— не отвечено —", empty:true, value:null};
    const label = sel.closest("label").innerText.trim();
    return {text:label, empty:false, value:sel.value};
  }
  if(type==="open" || type==="order"){
    const inp = q.querySelector("input[type=text]");
    const v = (inp.value||"").trim();
    if(!v) return {text:"— не отвечено —", empty:true, value:""};
    return {text:v, empty:false, value:v};
  }
  if(type==="match"){
    const A=q.querySelector('select[data-mk="A"]').value;
    const B=q.querySelector('select[data-mk="B"]').value;
    const V=q.querySelector('select[data-mk="V"]').value;
    const G=q.querySelector('select[data-mk="G"]').value;
    const fmt = "А"+(A||"–")+" Б"+(B||"–")+" В"+(V||"–")+" Г"+(G||"–");
    const empty = (!A && !B && !V && !G);
    return {text:fmt, empty:empty, value:{A:A,B:B,V:V,G:G}};
  }
  return {text:"—", empty:true};
}

function isCorrect(q, ua){
  const type=q.dataset.type;
  if(ua.empty) return false;
  if(type==="choice"){ return String(ua.value)===String(q.dataset.correct); }
  if(type==="open"){
    const need = norm(q.dataset.need||"");
    const user = norm(ua.value||"");
    if(!user) return false;
    return user.indexOf(need)!==-1;
  }
  if(type==="order"){
    return norm(ua.value||"")===norm(q.dataset.exact||"");
  }
  if(type==="match"){
    return ua.value.A===q.dataset.ca && ua.value.B===q.dataset.cb && ua.value.V===q.dataset.cv && ua.value.G===q.dataset.cg;
  }
  return false;
}

function updateProgress(){
  const qs=pane(activeTab).querySelectorAll(".q");
  let c=0;
  qs.forEach(function(q){ if(!getUserAnswer(q).empty) c++; });
  document.getElementById("progress").textContent="Вкладка "+activeTab+" — отвечено: "+c+" / "+qs.length;
}

document.addEventListener("change",updateProgress);
document.addEventListener("input",updateProgress);

function checkTest(t){
  const qs=pane(t).querySelectorAll(".q");
  let score=0; lastData[t]=[];
  qs.forEach(function(q){
    const n=q.dataset.n, orig=(q.dataset.orig||"");
    const qtext=getQText(q);
    const ua=getUserAnswer(q);
    const ok=isCorrect(q,ua);
    if(ok) score++;
    q.classList.remove("correct","incorrect");
    q.classList.add(ok?"correct":"incorrect");
    const ct=q.dataset.correctText||"";
    const v=q.querySelector(".verdict");
    if(ok){ v.innerHTML="✅ <b>Верно!</b> "+escapeHtml(ua.text); }
    else{ v.innerHTML="❌ <b>Неверно.</b> Ваш ответ: <i>"+escapeHtml(ua.text)+"</i><br>✔️ <b>Правильный ответ: "+escapeHtml(ct)+"</b>"; }
    lastData[t].push({n:n,orig:orig,qtext:qtext,user:ua.text,ok:ok,correct:ct});
  });
  checked[t]=true;
  const total=qs.length;
  const pct=Math.round(score/total*100);
  let mark = pct>=90?"Отлично! 🌟":pct>=70?"Хорошо! 👍":pct>=50?"Неплохо, но есть над чем поработать 🙂":"Стоит повторить тему 📚";
  document.getElementById("scoreLine"+t).textContent="Ваш результат: "+score+" из "+total+" ("+pct+"%). "+mark;
  let html='<table class="mini"><tr><th>№</th><th>Вопрос</th><th>Ваш ответ</th><th>Итог</th><th>Правильный ответ</th></tr>';
  lastData[t].forEach(function(r){
    html+="<tr><td>"+r.n+(r.orig?" ("+escapeHtml(r.orig)+")":"")+"</td><td>"+escapeHtml(r.qtext)+"</td><td>"+escapeHtml(r.user)+"</td><td>"+(r.ok?"✅ верно":"❌ неверно")+"</td><td>"+(r.ok?"—":escapeHtml(r.correct))+"</td></tr>";
  });
  html+="</table>";
  document.getElementById("scoreTableWrap"+t).innerHTML=html;
  document.getElementById("results"+t).classList.add("show");
  let txt="ТЕСТ ПО ИСТОРИИ БЕЛАРУСИ — "+tabTitles[t].toUpperCase()+"\nРезультат: "+score+" из "+total+" ("+pct+"%)\nДата: "+new Date().toLocaleString("ru-RU")+"\n"+"=".repeat(60)+"\n";
  lastData[t].forEach(function(r){
    txt+="\nВопрос "+r.n+(r.orig?" ("+r.orig+")":"")+": "+r.qtext+"\nВаш ответ: "+r.user+"\nИтог: "+(r.ok?"✅ ВЕРНО":"❌ НЕВЕРНО")+"\n";
    if(!r.ok) txt+="Правильный ответ: "+r.correct+"\n";
    txt+="-".repeat(60)+"\n";
  });
  const rep=document.getElementById("report"+t);
  rep.style.display="block"; rep.textContent=txt;
  updateProgress();
  document.getElementById("results"+t).scrollIntoView({behavior:"smooth"});
}

function resetTest(t){
  const p=pane(t);
  p.querySelectorAll('input[type=radio]').forEach(function(r){r.checked=false;});
  p.querySelectorAll('input[type=text]').forEach(function(i){i.value="";});
  p.querySelectorAll("select").forEach(function(s){s.selectedIndex=0;});
  p.querySelectorAll(".q").forEach(function(q){q.classList.remove("correct","incorrect");});
  document.getElementById("results"+t).classList.remove("show");
  document.getElementById("report"+t).style.display="none";
  checked[t]=false; lastData[t]=[];
  updateProgress();
}

function escapeHtml(s){return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}

function collectCurrent(t){
  if(checked[t] && lastData[t].length) return lastData[t];
  const arr=[];
  pane(t).querySelectorAll(".q").forEach(function(q){
    arr.push({n:q.dataset.n,orig:(q.dataset.orig||""),qtext:getQText(q),user:getUserAnswer(q).text,ok:null,correct:q.dataset.correctText||""});
  });
  return arr;
}

function buildResultsHTML(t, fontCss){
  const data=collectCurrent(t);
  let score=null,total=data.length;
  if(checked[t]){ score=data.filter(function(r){return r.ok;}).length; }
  let rows="";
  data.forEach(function(r){
    const verdict = r.ok===null ? "— не проверено —" : (r.ok?"✅ верно":"❌ неверно");
    const bg = r.ok===null ? "#fff" : (r.ok?"#e9f9ef":"#fdecec");
    const corr = (r.ok===null||r.ok) ? (r.ok?"—":"") : escapeHtml(r.correct);
    rows+="<tr style='background:"+bg+"'><td>"+r.n+(r.orig?" ("+escapeHtml(r.orig)+")":"")+"</td><td>"+escapeHtml(r.qtext)+"</td><td>"+escapeHtml(r.user)+"</td><td><b>"+verdict+"</b></td><td>"+corr+"</td></tr>";
  });
  return "<!DOCTYPE html><html lang='ru'><head><meta charset='UTF-8'><title>Результаты — "+tabTitles[t]+"</title>"
  +"<style>"+(fontCss||"")+"body{font-family:'HBSite',Arial,sans-serif;margin:20px;color:#222}h1{font-size:20px}table{border-collapse:collapse;width:100%;font-size:13px}th,td{border:1px solid #999;padding:7px;vertical-align:top}th{background:#eef2f9}</style></head><body>"
  +"<h1>📜 История Беларуси — "+tabTitles[t]+" (лист ответов)</h1>"
  +"<p><b>Дата:</b> "+new Date().toLocaleString("ru-RU")+"<br>"
  +(score!==null?"<b>Результат: "+score+" из "+total+" ("+Math.round(score/total*100)+"%)</b><br>":"<i>Тест ещё не проверен — показаны только выбранные ответы.</i><br>")
  +"✅ = верно, ❌ = неверно. Если неверно — правильный ответ в последнем столбце.</p>"
  +"<table><tr><th>№</th><th>Вопрос</th><th>Мой ответ</th><th>Верно / неверно</th><th>Правильный ответ (если ошибся)</th></tr>"+rows+"</table></body></html>";
}

function buildBlankHTML(t, fontCss){
  let items="";
  pane(t).querySelectorAll(".q").forEach(function(q){
    const n=q.dataset.n, orig=(q.dataset.orig||"");
    let body="";
    if(q.dataset.type==="choice"){
      q.querySelectorAll("label.opt").forEach(function(l){ body+="<div>☐ "+escapeHtml(l.innerText.trim())+"</div>"; });
    } else if(q.dataset.type==="open"){
      body="<div>Ответ: ___________________________</div>";
    } else if(q.dataset.type==="order"){
      q.querySelectorAll(".ord").forEach(function(d){ body+="<div>"+escapeHtml(d.innerText)+"</div>"; });
      body+="<div>Ответ (буквы подряд): ________</div>";
    } else if(q.dataset.type==="match"){
      q.querySelectorAll(".matchrow .left").forEach(function(d){ body+="<div>"+escapeHtml(d.innerText)+" → ____</div>"; });
      body+="<div style='color:#555'>Варианты: "+escapeHtml(q.querySelector(".meta").innerText)+"</div>";
    }
    items+="<div style='border:1px solid #999;border-radius:8px;padding:10px;margin:10px 0'><b>Вопрос "+n+(orig?" ("+escapeHtml(orig)+")":"")+"</b><br>"+escapeHtml(getQText(q))+"<div style='margin-top:6px'>"+body+"</div></div>";
  });
  return "<!DOCTYPE html><html lang='ru'><head><meta charset='UTF-8'><title>Бланк — "+tabTitles[t]+"</title><style>"+(fontCss||"")+"body{font-family:'HBSite',Arial,sans-serif;}</style></head><body style='margin:20px'>"
  +"<h1>Бланк вопросов — "+tabTitles[t]+"</h1>"+items+"</body></html>";
}

let fontCssCache = null;
async function getFontCss(){
  if(fontCssCache !== null) return fontCssCache;
  try{
    const files = ["roboto-cyrillic-400-normal.woff2","roboto-latin-400-normal.woff2","roboto-cyrillic-700-normal.woff2","roboto-latin-700-normal.woff2"];
    const weights = [400,400,700,700];
    let css = "";
    for(let i=0;i<files.length;i++){
      const resp = await fetch("fonts/"+files[i]);
      if(!resp.ok) throw new Error("font");
      const buf = await resp.arrayBuffer();
      const bytes = new Uint8Array(buf);
      let bin = "";
      for(let k=0;k<bytes.length;k++) bin += String.fromCharCode(bytes[k]);
      css += '@font-face{font-family:"HBSite";font-style:normal;font-weight:'+weights[i]+';src:url(data:font/woff2;base64,'+btoa(bin)+') format("woff2");}';
    }
    fontCssCache = css;
  }catch(e){ fontCssCache = ""; }
  return fontCssCache;
}

function saveFile(name,content,mime){
  const blob=new Blob([content],{type:mime});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a");
  a.href=url;a.download=name;document.body.appendChild(a);a.click();
  setTimeout(function(){URL.revokeObjectURL(url);a.remove();},800);
}

async function downloadResults(t){
  if(!checked[t]){
    if(!confirm("Вкладка "+t+" ещё не проверена. Скачать лист с текущими ответами без пометок верно/неверно? (Для пометок сначала нажмите «Проверить».)")) return;
  }
  const cssR = await getFontCss();
  saveFile("rezultaty-"+tabFiles[t]+".html",buildResultsHTML(t, cssR),"text/html;charset=utf-8");
}

async function downloadBlank(t){
  const cssB = await getFontCss();
  saveFile("blank-"+tabFiles[t]+".html",buildBlankHTML(t, cssB),"text/html;charset=utf-8");
}

function copyReport(t){
  const el=document.getElementById("report"+t);
  const txt=(el.textContent||"Сначала нажмите «Проверить».");
  if(navigator.clipboard&&navigator.clipboard.writeText){
    navigator.clipboard.writeText(txt).then(function(){alert("Отчёт скопирован ✅");}).catch(function(){alert("Не удалось скопировать. Выделите текст отчёта вручную.");});
  } else {
    const ta=document.createElement("textarea");ta.value=txt;document.body.appendChild(ta);ta.select();
    try{document.execCommand("copy");alert("Отчёт скопирован ✅");}catch(e){alert("Выделите текст вручную");}
    ta.remove();
  }
}
(function(){
  const m = (location.hash||"").match(/^#tab([123])$/);
  switchTab(m ? parseInt(m[1],10) : 1, false);
  const ts = document.getElementById("themeSel");
  if(ts) ts.value = document.body.dataset.theme || "light";
})();

