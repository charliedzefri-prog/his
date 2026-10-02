// Тренажер дат — вкладка 3. Данные: DATES_DB из dates-db.js
const UNIQUE_DATES = (function(){
  const c = {};
  DATES_DB.forEach(function(r){ c[r.d] = (c[r.d]||0)+1; });
  const s = {};
  Object.keys(c).forEach(function(k){ if(c[k]===1) s[k]=1; });
  return s;
})();

function shuffledCopy(a){
  const r = a.slice();
  for(let i=r.length-1;i>0;i--){
    const j = Math.floor(Math.random()*(i+1));
    const t = r[i]; r[i]=r[j]; r[j]=t;
  }
  return r;
}

function buildDatesQuiz(scroll){
  const box = document.getElementById("datesBox");
  const count = Math.min(parseInt(document.getElementById("datesCount").value,10)||20, DATES_DB.length);
  const mode = document.getElementById("datesMode").value;
  box.innerHTML = "";
  const pool = shuffledCopy(DATES_DB).slice(0, count);
  pool.forEach(function(qa, i){
    let qmode = mode;
    if(qmode==="mix") qmode = Math.random()<0.5 ? "e2d" : "d2e";
    let head, sub, correct, key;
    if(qmode==="e2d" || !UNIQUE_DATES[qa.d]){ head = qa.e; sub = "Укажите дату"; correct = qa.d; key = "d"; }
    else { head = qa.d; sub = "Укажите событие"; correct = qa.e; key = "e"; }
    const seen = {};
    seen[correct]=1;
    const opts=[correct];
    const order = shuffledCopy(DATES_DB);
    for(let k=0;k<order.length && opts.length<4;k++){
      const v = order[k][key];
      if(!seen[v]){ seen[v]=1; opts.push(v); }
    }
    const sh = shuffledCopy(opts);
    const ci = sh.indexOf(correct);
    const card = document.createElement("div");
    card.className="q"; card.dataset.type="choice"; card.dataset.n=String(i+1); card.dataset.orig="Дата";
    card.dataset.correct=String(ci); card.dataset.correctText=correct;
    const h=document.createElement("h3"); h.textContent=(i+1)+". "+head; card.appendChild(h);
    const meta=document.createElement("div"); meta.className="meta";
    const sp=document.createElement("span"); sp.textContent="Дата"; meta.appendChild(sp);
    meta.appendChild(document.createTextNode(" \u00B7 "+sub)); card.appendChild(meta);
    sh.forEach(function(op, oi){
      const lab=document.createElement("label"); lab.className="opt";
      const inp=document.createElement("input"); inp.type="radio"; inp.name="dd"+i; inp.value=String(oi);
      lab.appendChild(inp);
      lab.appendChild(document.createTextNode(" "+(oi+1)+") "+op));
      card.appendChild(lab);
    });
    const vd=document.createElement("div"); vd.className="verdict"; card.appendChild(vd);
    box.appendChild(card);
  });
  checked[3]=false; lastData[3]=[];
  document.getElementById("results3").classList.remove("show");
  document.getElementById("report3").style.display="none";
  updateProgress();
  if(scroll) box.scrollIntoView({behavior:"smooth"});
}
buildDatesQuiz(false);
