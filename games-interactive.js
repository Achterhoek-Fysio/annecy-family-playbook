/* Annecy Family Playbook — herspeelbare spellen, beste-telt scoremodel,
   live familie-voortgang, en een gesynchroniseerde live quizshow. */
(() => {
  "use strict";
  const LS={ get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v);}catch(e){return d;}}, set(k,v){try{localStorage.setItem(k,JSON.stringify(v));}catch(e){}} };

  const css=`
  .phRoot{margin:14px 0;display:flex;flex-direction:column;gap:14px}
  .phMenu{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
  .phTile{cursor:pointer;border:1px solid var(--line);background:var(--card);border-radius:16px;padding:14px;text-align:left;box-shadow:var(--shadow);transition:transform .12s}
  .phTile:hover{transform:translateY(-2px)}
  .phTile .ic{font-size:26px}.phTile h4{margin:6px 0 2px;color:var(--ink);font-size:16px}.phTile p{margin:0;color:var(--muted);font-size:12.5px}
  .phTile.wide{grid-column:1/-1;background:linear-gradient(120deg,var(--lake),var(--ink));border:none}
  .phTile.wide h4,.phTile.wide p{color:#fff}.phTile.wide .ic{filter:drop-shadow(0 1px 2px rgba(0,0,0,.3))}
  .phPanel{border:1px solid var(--line);background:var(--card);border-radius:18px;padding:16px;box-shadow:var(--shadow)}
  .phBar{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:10px}.phBar h3{margin:0;color:var(--ink);font-size:18px}
  .phBtn{cursor:pointer;border:none;border-radius:12px;padding:10px 14px;font-weight:700;font-size:14px;background:var(--lake);color:#fff}
  .phBtn.alt{background:#eef4f4;color:var(--ink)}.phBtn.coral{background:var(--coral)}.phBtn:disabled{opacity:.45;cursor:not-allowed}
  .phBtnRow{display:flex;flex-wrap:wrap;gap:8px}
  .phBack{cursor:pointer;background:none;border:none;color:var(--lake);font-weight:700;font-size:14px;padding:4px}
  .phQ{font-size:17px;color:var(--ink);font-weight:700;margin:6px 0 12px}
  .phOpt{display:block;width:100%;text-align:left;margin:7px 0;padding:12px 14px;border-radius:12px;border:1px solid var(--line);background:#fff;color:var(--ink);font-size:15px;cursor:pointer}
  .phOpt:hover{border-color:var(--lake)}.phOpt.good{background:#e6f6ee;border-color:#37b26b;color:#186c3d}.phOpt.bad{background:#fdeaea;border-color:#e05a52;color:#a02b25}
  .phNote{color:var(--muted);font-size:13px;margin:8px 0 0}
  .phBingo{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:6px}
  .phCell{aspect-ratio:1/1;border-radius:12px;border:1px solid var(--line);background:#fff;color:var(--ink);font-size:12px;line-height:1.15;padding:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;text-align:center}
  .phCell.on{background:var(--lake);color:#fff;border-color:var(--lake)}
  .phDice{display:flex;gap:8px;justify-content:center;margin:12px 0;flex-wrap:wrap}
  .phDie{width:54px;height:54px;border-radius:12px;border:2px solid var(--line);background:#fff;font-size:34px;line-height:50px;text-align:center;cursor:pointer;user-select:none}
  .phDie.hold{border-color:var(--coral);background:#fff2f1}
  .phSheet{width:100%;border-collapse:collapse;font-size:14px}.phSheet td{border-bottom:1px solid var(--line);padding:7px 6px;color:var(--ink)}
  .phSheet td.v{text-align:right;color:var(--muted);width:64px}.phSheet tr.pick td{cursor:pointer}.phSheet tr.pick:hover td{background:#eef4f4}.phSheet tr.done td.v{color:var(--ink);font-weight:700}
  .phToast{position:fixed;left:50%;bottom:88px;transform:translateX(-50%);background:var(--ink);color:#fff;padding:10px 16px;border-radius:999px;font-weight:700;font-size:14px;box-shadow:var(--shadow);z-index:9999;opacity:0;transition:opacity .2s}
  .phToast.show{opacity:1}
  .phBig{font-size:22px;font-weight:800;color:var(--ink)}.phCenter{text-align:center}
  .phProgRow{display:flex;flex-direction:column;gap:5px;padding:9px 0;border-bottom:1px solid var(--line)}.phProgRow:last-child{border-bottom:none}
  .phProgGame{font-weight:700;color:var(--ink);font-size:14px}.phChips{display:flex;flex-wrap:wrap;gap:6px}
  .phChip{font-size:12px;padding:4px 9px;border-radius:999px;background:#eef4f4;color:var(--ink)}
  .phChip.done{background:#e6f6ee;color:#186c3d;font-weight:700}.phChip.muted{color:var(--muted);background:#f3f6f6}
  .phBest{color:var(--lake);font-weight:700}
  .phTimer{font-size:26px;font-weight:800;color:var(--coral)}
  .phLead{display:flex;justify-content:space-between;padding:8px 10px;border-radius:10px;background:#eef4f4;margin:4px 0;color:var(--ink);font-weight:700}
  .phLead.me{background:#e6f6ee}
  .phWho{font-size:12.5px;color:var(--muted);margin-top:8px}
  .phField{display:flex;gap:8px;align-items:center;margin:10px 0;color:var(--ink)}
  .phField input{width:72px;padding:8px;border-radius:10px;border:1px solid var(--line);font-size:15px}
  `;

  const A=()=>window.AnnecyLive||null;
  function isJoined(){ const a=A(); if(a&&typeof a.isJoined==='function')return a.isJoined(); const p=document.getElementById('liveIdentityPanel'); return !!(p&&!p.classList.contains('liveHidden')); }
  const lc=()=>{ const a=A(); return a&&a.client||null; };
  const myId=()=>{ const a=A(); return a&&a.player&&a.player.id; };
  const myGroup=()=>{ const a=A(); return a&&a.group&&a.group.id; };
  let toastT;
  function toast(msg){ let t=document.getElementById('phToast'); if(!t){t=document.createElement('div');t.id='phToast';t.className='phToast';document.body.appendChild(t);} t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2400); }
  const el=(html)=>{ const d=document.createElement('div'); d.innerHTML=html.trim(); return d.firstElementChild; };
  const shuffle=(a)=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(p=>p[1]);

  async function recordGame(key,points,stateObj,msg){
    if(!isJoined()){ toast('Doe eerst mee met de familiecode hierboven ⤴'); return null; }
    let total=null;
    try{ const a=A(); if(a&&a.recordResult) total=await a.recordResult(key,points,stateObj||{}); }catch(e){}
    refreshProgressPanel(); if(msg) toast(msg); return total;
  }

  /* ---------- content ---------- */
  const QUIZ=[
    {q:"In welk gebergte ligt Annecy?",o:["De Pyreneeën","De Alpen","De Vogezen","De Ardennen"],a:1},
    {q:"Hoe wordt Annecy vaak liefkozend genoemd?",o:["Het Parijs van het zuiden","Venetië van de Alpen","De tuin van Frankrijk","Het kleine Rome"],a:1},
    {q:"Welk riviertje stroomt door de oude stad van Annecy?",o:["De Thiou","De Seine","De Rhône","De Loire"],a:0},
    {q:"Lac d'Annecy staat bekend als een van de … meren van Europa.",o:["diepste","schoonste","zoutste","grootste"],a:1},
    {q:"Welke beroemde kaas komt uit deze streek (Haute-Savoie)?",o:["Camembert","Roquefort","Reblochon","Brie"],a:2},
    {q:"Welk gerecht met aardappels, spek en Reblochon is een streekklassieker?",o:["Ratatouille","Tartiflette","Bouillabaisse","Quiche"],a:1},
    {q:"Het iconische oude gebouwtje midden in de Thiou heet…",o:["Palais de l'Île","Mont Saint-Michel","Pont du Gard","Sacré-Cœur"],a:0},
    {q:"Welke grote stad ligt het dichtst bij Annecy (±40 km)?",o:["Lyon","Genève","Marseille","Nice"],a:1},
    {q:"Vanaf de Col de la Forclaz doen mensen boven het meer vooral aan…",o:["duiken","paragliden","skispringen","raften"],a:1},
    {q:"Wat is de hoogste berg van de Alpen, niet ver van Annecy?",o:["Matterhorn","Mont Blanc","Mont Ventoux","Grossglockner"],a:1},
    {q:"In welk land ligt Annecy?",o:["Zwitserland","Italië","Frankrijk","Oostenrijk"],a:2},
    {q:"Met welk vervoermiddel rijd je het mooist het rondje om het meer?",o:["Metro","Fiets","Tram","Kabelbaan"],a:1},
    {q:"Wat is de hoofdstad van Frankrijk?",o:["Lyon","Marseille","Parijs","Bordeaux"],a:2},
    {q:"Hoe zeg je “hallo” in het Frans?",o:["Ciao","Bonjour","Hola","Hallo"],a:1},
    {q:"Wat betekent het Franse woord “merci”?",o:["Alsjeblieft","Dank je wel","Tot ziens","Goedemorgen"],a:1},
    {q:"Welke kleur zit NIET in de Franse vlag?",o:["Rood","Wit","Blauw","Groen"],a:3},
    {q:"Wat is het Franse woord voor kaas?",o:["Pain","Fromage","Lait","Beurre"],a:1},
    {q:"Welk gebergte vormt de grens tussen Frankrijk en Spanje?",o:["De Alpen","De Pyreneeën","De Jura","De Vogezen"],a:1},
    {q:"Welke sport doe je staand op een board met een peddel?",o:["Suppen (SUP)","Skiën","Curling","Boksen"],a:0},
    {q:"Wat eet je typisch bij een Frans ontbijt?",o:["Pizza","Croissant","Sushi","Pannenkoek"],a:1},
    {q:"Welke munt betaal je mee in Frankrijk?",o:["Pond","Frank","Euro","Dollar"],a:2},
    {q:"Hoeveel zijden heeft een gewone dobbelsteen?",o:["4","6","8","12"],a:1},
    {q:"Welke kleur krijg je als je blauw en geel mengt?",o:["Groen","Paars","Oranje","Bruin"],a:0},
    {q:"Wat is “au revoir” in het Nederlands?",o:["Goedemorgen","Tot ziens","Eet smakelijk","Welkom"],a:1}
  ];
  const BINGO_POOL=["Een stokbrood gespot","Een boot op het meer","Franse vlag gezien","Een koe met bel","IJsje gegeten","Iemand zei 'bonjour'","Bergtop met sneeuw","Een fietser voorbij","Croissant ontbijt","Zwemmen in het meer","Een kasteel gezien","Markt bezocht","Paraglider in de lucht","Franse plaat '74'","Picknick gedaan","Zonsondergang gezien","Een geit of ezel","Zwaan op het meer","Kabelbaan of gondel","Franse bakkerij binnen","Kerktoren gespot","Een tunnel doorgereden","Iemand at slakken/kikker","Bergbeekje of waterval","Fontein gezien","Iemand sprak Frans terug","Wijngaard of druiven","Zeilboot met vlag"];
  const MUSIC=["Nederlandstalig","Jaren 80","Uit een film","Vrouwelijke zang","Meezingrefrein","Uit de jaren 2000","Rock","Franstalig","Duet","Dansplaat","Ballad","Nummer 1-hit geweest","Jaren 90","Instrumentaal deel","Zomerhit","Engelstalig","Rap of hiphop","Ouder dan jij"];
  const LINES=[[0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15],[0,4,8,12],[1,5,9,13],[2,6,10,14],[3,7,11,15],[0,5,10,15],[3,6,9,12]];
  const PROG_GAMES=[["quiz","🧠","Familiequiz"],["bingo","🗺️","Vakantiebingo"],["yahtzee","🎲","Yahtzee"],["music","🎵","Muziekbingo"]];

  /* ================= module ================= */
  let root, view, progSub=null;

  async function renderProgress(bodyEl){
    if(!bodyEl) return;
    if(!isJoined()){ bodyEl.innerHTML='<span class="phNote">Doe mee met de familiecode om te zien wie welke spellen speelt en afrondt.</span>'; return; }
    let rows=[]; try{ const a=A(); if(a&&a.loadGroupProgress) rows=await a.loadGroupProgress(); }catch(e){}
    let html='';
    PROG_GAMES.forEach(([k,ic,label])=>{
      const rs=rows.filter(r=>r.game_key===k); let chips='';
      if(rs.length===0) chips='<span class="phChip muted">nog niemand</span>';
      else{ rs.sort((a,b)=>((b.state&&b.state.best||0)-(a.state&&a.state.best||0))); rs.forEach(r=>{ const s=r.state||{}; chips+=`<span class="phChip ${s.done?'done':''}">${s.done?'✓ ':'⏳ '}${s.name||'speler'} · ${s.best!=null?s.best:0}</span>`; }); }
      html+=`<div class="phProgRow"><span class="phProgGame">${ic} ${label}</span><span class="phChips">${chips}</span></div>`;
    });
    bodyEl.innerHTML=html;
  }
  function refreshProgressPanel(){ const b=document.getElementById('phProgBody'); if(b) renderProgress(b); }
  function ensureProgSub(){ if(progSub) return; const a=A(); if(a&&a.isJoined&&a.isJoined()&&a.onGroupProgress) progSub=a.onGroupProgress(()=>refreshProgressPanel()); }

  function menu(){
    view.innerHTML='';
    const m=el(`<div class="phMenu">
      <button class="phTile" data-g="quiz"><div class="ic">🧠</div><h4>Familiequiz</h4><p>Herspeelbaar · beste ronde telt.</p></button>
      <button class="phTile" data-g="bingo"><div class="ic">🗺️</div><h4>Vakantiebingo</h4><p>Tik af wat je onderweg ziet.</p></button>
      <button class="phTile" data-g="yahtzee"><div class="ic">🎲</div><h4>Yahtzee</h4><p>Herspeelbaar · hoogste totaal telt.</p></button>
      <button class="phTile" data-g="music"><div class="ic">🎵</div><h4>Muziekbingo</h4><p>Hitster-stijl: herken de nummers.</p></button>
      <button class="phTile wide" data-g="live"><div class="ic">🎬</div><h4>Samen live — quizshow</h4><p>Iedereen tegelijk dezelfde vraag, met afteltimer. Eén host.</p></button>
    </div>`);
    m.querySelectorAll('.phTile').forEach(b=> b.onclick=()=>open(b.dataset.g));
    view.appendChild(m);
    view.appendChild(el(`<p class="phNote phCenter">${isJoined()?'Speel zo vaak je wilt — per spel telt je <b>beste</b> resultaat mee. Samen tegelijk of ieder voor zich; de stand loopt live.':'Tip: vul hierboven één keer je naam + familiecode in, dan tellen je punten mee.'}</p>`));
    const prog=el(`<div class="phPanel"><div class="phBar"><h3>👀 Familie-voortgang</h3><span class="phNote">live · beste per spel</span></div><div id="phProgBody"><span class="phNote">Laden…</span></div></div>`);
    view.appendChild(prog); renderProgress(prog.querySelector('#phProgBody')); ensureProgSub();
  }
  function open(g){ ({quiz,bingo,yahtzee,music,live:liveQuiz}[g]||menu)(); }
  function panel(title,bodyNode){ view.innerHTML=''; const p=el(`<div class="phPanel"><div class="phBar"><button class="phBack">‹ Terug</button><h3>${title}</h3><span></span></div></div>`); p.querySelector('.phBack').onclick=menu; p.appendChild(bodyNode); view.appendChild(p); return p; }

  /* ---------- SOLO QUIZ (herspeelbaar, 10 willekeurige vragen) ---------- */
  function quiz(){
    const body=el('<div></div>'); let order,i,correct;
    function newRound(){ order=shuffle(QUIZ.map((_,i)=>i)).slice(0,10); i=0; correct=0; }
    newRound();
    function render(){
      if(i>=order.length){
        const pts=correct*10;
        recordGame('quiz',pts,{done:true,goed:correct},`Ronde klaar: ${correct}/${order.length} goed`);
        body.innerHTML=`<div class="phCenter"><p class="phBig">${correct}/${order.length} goed 🎉</p><p class="phNote">Deze ronde = <span class="phBest">${pts} punten</span>. Alleen je beste ronde telt mee.</p></div>`;
        const row=el('<div class="phBtnRow phCenter" style="justify-content:center;margin-top:12px"></div>');
        const again=el('<button class="phBtn coral">Speel opnieuw 🔁</button>'); again.onclick=()=>{ newRound(); render(); };
        const back=el('<button class="phBtn alt">Terug</button>'); back.onclick=menu;
        row.appendChild(again); row.appendChild(back); body.appendChild(row); return;
      }
      const item=QUIZ[order[i]];
      body.innerHTML=`<p class="phNote">Vraag ${i+1} / ${order.length} · ${correct} goed</p><p class="phQ">${item.q}</p>`;
      const opts=el('<div></div>');
      item.o.forEach((txt,idx)=>{ const b=el(`<button class="phOpt">${txt}</button>`);
        b.onclick=()=>{ opts.querySelectorAll('.phOpt').forEach(x=>x.disabled=true); const ok=idx===item.a; b.classList.add(ok?'good':'bad'); if(!ok)opts.children[item.a].classList.add('good'); if(ok)correct++; next.disabled=false; };
        opts.appendChild(b); });
      body.appendChild(opts);
      const next=el('<button class="phBtn" style="margin-top:12px" disabled>Volgende ›</button>'); next.onclick=()=>{ i++; render(); }; body.appendChild(next);
    }
    render(); panel('Familiequiz',body);
  }

  /* ---------- BINGO (16 uit grotere pool) ---------- */
  function bingo(){
    let s=LS.get('ph_bingo',null);
    if(!s||!Array.isArray(s.tiles)||s.tiles.length!==16){ s={tiles:shuffle(BINGO_POOL).slice(0,16),cells:[],lines:[]}; LS.set('ph_bingo',s); }
    if(!Array.isArray(s.cells))s.cells=[]; if(!Array.isArray(s.lines))s.lines=[];
    const body=el('<div></div>'),grid=el('<div class="phBingo"></div>'),info=el('<p class="phNote"></p>');
    const points=()=>s.cells.length*5+s.lines.length*15;
    function persist(msg){ LS.set('ph_bingo',s); recordGame('bingo',points(),{afgevinkt:s.cells.length,lijnen:s.lines.length,done:s.cells.length>=16},msg); }
    function refresh(){ grid.innerHTML='';
      s.tiles.forEach((t,idx)=>{ const on=s.cells.includes(idx); const c=el(`<button class="phCell ${on?'on':''}">${t}</button>`);
        c.onclick=()=>{ let msg=null; if(s.cells.includes(idx))s.cells=s.cells.filter(n=>n!==idx); else s.cells.push(idx);
          for(let li=0;li<LINES.length;li++){ const full=LINES[li].every(n=>s.cells.includes(n)); if(full&&!s.lines.includes(li)){s.lines.push(li);msg='BINGO! Volle lijn 🎉';} else if(!full&&s.lines.includes(li)){s.lines=s.lines.filter(n=>n!==li);} }
          persist(msg); refresh(); };
        grid.appendChild(c); });
      info.innerHTML=`${s.cells.length} / 16 afgevinkt · ${s.lines.length} lijn(en) · <span class="phBest">${points()} punten</span>`;
    }
    refresh();
    body.appendChild(el('<p class="phNote">Elk vakje = 5, elke volle lijn = 15. Je hoogste stand telt mee.</p>'));
    body.appendChild(grid); body.appendChild(info);
    const row=el('<div class="phBtnRow" style="margin-top:12px"></div>');
    const clr=el('<button class="phBtn alt">Kaart leegmaken</button>'); clr.onclick=()=>{ s.cells=[];s.lines=[]; LS.set('ph_bingo',s); refresh(); toast('Leeg — je beste blijft staan.'); };
    const nw=el('<button class="phBtn">Nieuwe kaart 🔁</button>'); nw.onclick=()=>{ LS.set('ph_bingo',null); bingo(); };
    row.appendChild(clr); row.appendChild(nw); body.appendChild(row);
    panel('Vakantiebingo',body);
  }

  /* ---------- YAHTZEE ---------- */
  const FACES=['','⚀','⚁','⚂','⚃','⚄','⚅'];
  function yahtzee(){
    let dice=[1,1,1,1,1],hold=[false,false,false,false,false],rolls=0,started=false;
    const cats=[{k:'ones',n:'Enen'},{k:'twos',n:'Tweeën'},{k:'threes',n:'Drieën'},{k:'fours',n:'Vieren'},{k:'fives',n:'Vijven'},{k:'sixes',n:'Zessen'},{k:'tok',n:'Three of a kind'},{k:'fok',n:'Four of a kind'},{k:'fh',n:'Full house (25)'},{k:'ss',n:'Kleine straat (30)'},{k:'ls',n:'Grote straat (40)'},{k:'yah',n:'Yahtzee (50)'},{k:'chance',n:'Chance'}];
    const score={};
    const counts=()=>{const c=[0,0,0,0,0,0,0];dice.forEach(d=>c[d]++);return c;};
    function scoreFor(k){const c=counts(),sum=dice.reduce((a,b)=>a+b,0);switch(k){case 'ones':return c[1];case 'twos':return c[2]*2;case 'threes':return c[3]*3;case 'fours':return c[4]*4;case 'fives':return c[5]*5;case 'sixes':return c[6]*6;case 'tok':return c.some(x=>x>=3)?sum:0;case 'fok':return c.some(x=>x>=4)?sum:0;case 'fh':{const t=c.some(x=>x===3),p=c.some(x=>x===2),f=c.some(x=>x===5);return (t&&p)||f?25:0;}case 'ss':{const st=new Set(dice),h=a=>a.every(n=>st.has(n));return h([1,2,3,4])||h([2,3,4,5])||h([3,4,5,6])?30:0;}case 'ls':{const st=new Set(dice),h=a=>a.every(n=>st.has(n));return h([1,2,3,4,5])||h([2,3,4,5,6])?40:0;}case 'yah':return c.some(x=>x===5)?50:0;case 'chance':return sum;}return 0;}
    const upper=()=>['ones','twos','threes','fours','fives','sixes'].reduce((a,k)=>a+(score[k]||0),0);
    const total=()=>{let t=Object.values(score).reduce((a,b)=>a+(b||0),0);if(upper()>=63)t+=35;return t;};
    const allDone=()=>cats.every(c=>score[c.k]!==undefined);
    const body=el('<div></div>'),dieRow=el('<div class="phDice"></div>'),rollBtn=el('<button class="phBtn coral">Gooien</button>');
    const rollInfo=el('<p class="phNote phCenter">Druk op “Gooien” om te starten. 3× per beurt; tik dobbelstenen aan om vast te houden.</p>');
    const table=el('<table class="phSheet"></table>'),totalRow=el('<p class="phBig phCenter" style="margin-top:10px">Totaal: 0</p>');
    const updateTotal=()=>{totalRow.textContent=`Totaal: ${total()} ${upper()>=63?'(incl. +35 bonus)':''}`;};
    function drawDice(){dieRow.innerHTML='';dice.forEach((d,i)=>{const b=el(`<div class="phDie ${hold[i]?'hold':''}">${FACES[d]}</div>`);b.onclick=()=>{if(!started)return;hold[i]=!hold[i];drawDice();};dieRow.appendChild(b);});}
    function drawTable(){table.innerHTML='';cats.forEach(c=>{const filled=score[c.k]!==undefined;const prev=(started&&!filled)?scoreFor(c.k):(filled?score[c.k]:'');const tr=el(`<tr class="${filled?'done':(started?'pick':'')}"><td>${c.n}</td><td class="v">${prev===''?'—':prev}</td></tr>`);
      if(started&&!filled){tr.onclick=async()=>{score[c.k]=scoreFor(c.k);rolls=0;hold=[false,false,false,false,false];started=false;rollBtn.disabled=false;rollBtn.textContent='Gooien';drawDice();drawTable();updateTotal();
        if(allDone()){const t=total();updateTotal();await recordGame('yahtzee',t,{done:true,score:t},`Klaar! Totaal ${t}`);rollInfo.innerHTML=`<span class="phBig">Klaar! Totaal: ${t}</span><br>Je hoogste totaal telt mee.`;rollBtn.disabled=true;const again=el('<div class="phBtnRow phCenter" style="justify-content:center;margin-top:10px"><button class="phBtn coral">Nog een potje 🔁</button></div>');again.firstElementChild.onclick=()=>yahtzee();body.appendChild(again);}
      };}
      table.appendChild(tr);});}
    rollBtn.onclick=()=>{if(allDone())return;if(rolls>=3){toast('Kies eerst een vak');return;}started=true;dice=dice.map((d,i)=>hold[i]?d:(1+Math.floor(Math.random()*6)));rolls++;rollInfo.textContent=`Worp ${rolls} van 3 — vasthouden of scoren.`;if(rolls>=3)rollBtn.disabled=true;drawDice();drawTable();};
    drawDice();drawTable();updateTotal();
    body.appendChild(rollInfo);body.appendChild(dieRow);const br=el('<div class="phBtnRow phCenter" style="justify-content:center"></div>');br.appendChild(rollBtn);body.appendChild(br);body.appendChild(table);body.appendChild(totalRow);
    panel('Yahtzee',body);
  }

  /* ---------- MUZIEKBINGO ---------- */
  function music(){
    let card=LS.get('ph_music_card',null);
    if(!card||!Array.isArray(card.tiles)||card.tiles.length!==16){ card={tiles:shuffle(MUSIC).slice(0,16),on:[],lines:[]}; LS.set('ph_music_card',card); }
    if(!Array.isArray(card.lines))card.lines=[];
    const body=el('<div></div>');
    body.appendChild(el('<p class="phNote">Eén persoon speelt nummers (bijv. via Spotify), de rest tikt aan als het klopt. Vakje = 5, volle lijn = 15.</p>'));
    const sp=el('<div class="phBtnRow" style="margin-bottom:10px"><a class="phBtn alt" target="_blank" rel="noopener" href="https://open.spotify.com/search">Open Spotify</a><button class="phBtn">Nieuwe kaart 🔁</button></div>');
    sp.querySelector('button').onclick=()=>{ LS.set('ph_music_card',null); music(); };
    body.appendChild(sp);
    const grid=el('<div class="phBingo"></div>'),info=el('<p class="phNote"></p>');
    const points=()=>card.on.length*5+card.lines.length*15;
    function persist(msg){ LS.set('ph_music_card',card); recordGame('music',points(),{afgevinkt:card.on.length,lijnen:card.lines.length,done:card.on.length>=16},msg); }
    function refresh(){ grid.innerHTML='';
      card.tiles.forEach((t,idx)=>{ const on=card.on.includes(idx); const c=el(`<button class="phCell ${on?'on':''}">${t}</button>`);
        c.onclick=()=>{ let msg=null; if(card.on.includes(idx))card.on=card.on.filter(n=>n!==idx); else card.on.push(idx);
          for(let li=0;li<LINES.length;li++){ const full=LINES[li].every(n=>card.on.includes(n)); if(full&&!card.lines.includes(li)){card.lines.push(li);msg='BINGO! 🎶';} else if(!full&&card.lines.includes(li)){card.lines=card.lines.filter(n=>n!==li);} }
          persist(msg); refresh(); };
        grid.appendChild(c); });
      info.innerHTML=`${card.on.length} / 16 aangetikt · ${card.lines.length} lijn(en) · <span class="phBest">${points()} punten</span>`;
    }
    refresh(); body.appendChild(grid); body.appendChild(info); panel('Muziekbingo',body);
  }

  /* ---------- SAMEN LIVE — quizshow ---------- */
  function liveQuiz(){
    const body=el('<div></div>');
    const p=panel('Samen live 🎬',body);
    const client=lc(), gid=myGroup();
    if(!isJoined()||!client||!gid){ body.innerHTML='<p class="phNote">Doe eerst mee met de familiecode hierboven ⤴ om samen live te spelen.</p>'; return; }
    let sess=null, tick=null, chan1=null, chan2=null, lastKey='', myPick={q:-1,c:-1}, claimed=false, answers=[];
    const isHost=()=> !!(sess&&sess.host_id===myId());
    const remaining=()=> (sess&&sess.deadline)? Math.max(0,Math.round((new Date(sess.deadline).getTime()-Date.now())/1000)) : 0;
    function cleanup(){ if(tick){clearInterval(tick);tick=null;} [chan1,chan2].forEach(c=>{ if(c){try{client.removeChannel(c);}catch(e){}} }); chan1=chan2=null; }
    p.querySelector('.phBack').onclick=()=>{ cleanup(); menu(); };

    async function fetchAnswers(){ if(!sess||sess.q_index<0){answers=[];return;} try{ const {data}=await client.from('quiz_live_answers').select('name,choice,correct,player_id').eq('group_id',gid).eq('q_index',sess.q_index); answers=data||[]; }catch(e){answers=[];} }
    async function reload(){ try{ const {data}=await client.from('quiz_live').select('*').eq('group_id',gid).maybeSingle(); sess=data; }catch(e){sess=null;} await fetchAnswers(); render(true); }

    function render(force){
      const key=sess?sess.phase+':'+sess.q_index:'none';
      if(!force && key===lastKey && sess && sess.phase==='question'){ updateTimer(); return; }
      lastKey=key;
      if(!sess) return renderStart('');
      if(sess.phase==='ended') return renderEnd();
      if(sess.phase==='lobby') return renderLobby();
      if(sess.phase==='question') return renderQuestion();
      if(sess.phase==='reveal') return renderReveal();
    }
    function updateTimer(){ const t=document.getElementById('qlTimer'); if(t)t.textContent=remaining()+'s'; if(isHost()&&sess&&sess.phase==='question'&&remaining()<=0){ client.rpc('quiz_live_reveal'); } }

    function renderStart(msg){ lastKey='start';
      body.innerHTML=`${msg?`<p class="phNote">${msg}</p>`:''}<p class="phQ">Live quizshow 🎬</p><p class="phNote">Iedereen die deze pagina open heeft krijgt dezelfde vragen tegelijk, met afteltimer. Eén persoon start als host.</p>`;
      const f=el('<div class="phField"><span>Aantal vragen:</span><input id="qlN" type="number" min="3" max="20" value="8"></div>');
      const start=el('<button class="phBtn coral">Start quizshow als host</button>');
      start.onclick=async()=>{ start.disabled=true; const n=Math.max(3,Math.min(20,parseInt((document.getElementById('qlN')||{}).value)||8)); try{ await client.rpc('quiz_live_start',{p_total:n}); }catch(e){ toast('Starten lukte niet'); start.disabled=false; return; } await reload(); };
      body.appendChild(f); body.appendChild(start);
    }
    function renderLobby(){
      body.innerHTML=`<p class="phQ">Lobby</p><p class="phNote">Host: <b>${sess.host_name||'?'}</b> · ${sess.q_total} vragen. Iedereen die meedoet, opent dit scherm.</p>`;
      if(isHost()){ const b=el('<button class="phBtn coral">Begin de quiz ›</button>'); b.onclick=()=>client.rpc('quiz_live_next',{p_seconds:20}); body.appendChild(b); }
      else body.appendChild(el('<p class="phNote">⏳ Wachten tot de host begint…</p>'));
    }
    function renderQuestion(){
      const answered=myPick.q===sess.q_index;
      body.innerHTML=`<div class="phBar"><span class="phNote">Vraag ${sess.q_index+1} / ${sess.q_total}</span><span class="phTimer" id="qlTimer">${remaining()}s</span></div><p class="phQ">${sess.question}</p>`;
      const opts=el('<div></div>');
      (sess.options||[]).forEach((txt,idx)=>{ const b=el(`<button class="phOpt">${txt}</button>`);
        if(answered){ b.disabled=true; if(idx===myPick.c)b.classList.add('good'); }
        b.onclick=async()=>{ myPick={q:sess.q_index,c:idx}; opts.querySelectorAll('.phOpt').forEach(x=>x.disabled=true); b.classList.add('good'); try{ await client.rpc('quiz_live_answer',{p_choice:idx}); }catch(e){} await fetchAnswers(); showCount(); };
        opts.appendChild(b); });
      body.appendChild(opts);
      body.appendChild(el(`<p class="phWho" id="qlCount">${answers.length} hebben geantwoord</p>`));
      if(isHost()){ const r=el('<button class="phBtn alt" style="margin-top:8px">Toon antwoord nu ›</button>'); r.onclick=()=>client.rpc('quiz_live_reveal'); body.appendChild(r); }
    }
    function showCount(){ const c=document.getElementById('qlCount'); if(c)c.textContent=`${answers.length} hebben geantwoord`; }
    function renderReveal(){
      const ci=sess.revealed_answer;
      body.innerHTML=`<p class="phNote">Vraag ${sess.q_index+1} / ${sess.q_total} · antwoord</p><p class="phQ">${sess.question}</p>`;
      const opts=el('<div></div>');
      (sess.options||[]).forEach((txt,idx)=>{ const b=el(`<button class="phOpt" disabled>${txt}</button>`); if(idx===ci)b.classList.add('good'); if(myPick.q===sess.q_index&&myPick.c===idx&&idx!==ci)b.classList.add('bad'); opts.appendChild(b); });
      body.appendChild(opts);
      const good=answers.filter(a=>a.correct).map(a=>a.name||'speler');
      body.appendChild(el(`<p class="phWho">Goed beantwoord door: ${good.length?good.join(', '):'niemand'}</p>`));
      if(isHost()){ const last=(sess.q_index+1)>=sess.q_total; const b=el(`<button class="phBtn coral" style="margin-top:8px">${last?'Toon einduitslag 🏁':'Volgende vraag ›'}</button>`); b.onclick=()=> last? client.rpc('quiz_live_finish') : client.rpc('quiz_live_next',{p_seconds:20}); body.appendChild(b); }
      else body.appendChild(el('<p class="phNote">⏳ Wachten op de host…</p>'));
    }
    async function renderEnd(){
      let rows=[]; try{ const {data}=await client.from('quiz_live_answers').select('name,correct,player_id').eq('group_id',gid); rows=data||[]; }catch(e){}
      const tally={}; rows.forEach(r=>{ if(!tally[r.player_id])tally[r.player_id]={name:r.name,correct:0}; if(r.correct)tally[r.player_id].correct++; });
      const list=Object.entries(tally).map(([pid,v])=>({pid,name:v.name,correct:v.correct})).sort((a,b)=>b.correct-a.correct);
      if(!claimed){ claimed=true; try{ await client.rpc('quiz_live_claim'); refreshProgressPanel(); }catch(e){} }
      body.innerHTML = list.length? `<p class="phBig phCenter">🏁 Einduitslag</p><div>${list.map(x=>`<div class="phLead ${x.pid===myId()?'me':''}"><span>${x.name||'speler'}</span><span>${x.correct} goed · ${x.correct*10} ptn</span></div>`).join('')}</div><p class="phNote phCenter">Je beste quizronde telt mee voor de familiescore.</p>` : '<p class="phNote">Nog geen quizshow gespeeld. Start er een!</p>';
      const again=el('<button class="phBtn coral" style="margin-top:12px">Nieuwe quizshow 🎬</button>'); again.onclick=()=>{ claimed=false; renderStart('Start een nieuwe ronde.'); };
      body.appendChild(again);
    }

    chan1=client.channel('ql-'+gid).on('postgres_changes',{event:'*',schema:'public',table:'quiz_live',filter:`group_id=eq.${gid}`}, async(pl)=>{ sess=pl.new; myPick={q:-1,c:-1}; await fetchAnswers(); render(true); }).subscribe();
    chan2=client.channel('qla-'+gid).on('postgres_changes',{event:'*',schema:'public',table:'quiz_live_answers',filter:`group_id=eq.${gid}`}, async()=>{ await fetchAnswers(); if(sess&&sess.phase==='question')showCount(); else render(true); }).subscribe();
    tick=setInterval(()=>{ if(sess&&sess.phase==='question')updateTimer(); },1000);
    body.innerHTML='<p class="phNote">Laden…</p>'; reload();
  }

  /* ---------- mount ---------- */
  function mount(){
    const games=document.getElementById('games'); if(!games||document.getElementById('phRoot'))return;
    const grid=document.getElementById('gameGrid'); if(grid)grid.style.display='none';
    games.querySelectorAll(':scope > .card').forEach(c=>{ if(!c.classList.contains('scoreCard'))c.style.display='none'; });
    const st=document.createElement('style'); st.textContent=css; document.head.appendChild(st);
    root=document.createElement('div'); root.id='phRoot'; root.className='phRoot'; view=document.createElement('div');
    root.appendChild(el('<div class="phBar"><h3>🎮 Speel nu</h3><span class="phNote">herspeelbaar · beste telt · live</span></div>'));
    root.appendChild(view);
    const hub=document.getElementById('liveHub'); if(hub&&hub.parentNode)hub.insertAdjacentElement('afterend',root); else games.appendChild(root);
    menu();
    let tries=0; const iv=setInterval(()=>{ tries++; if(isJoined()){ ensureProgSub(); refreshProgressPanel(); } if(tries>40)clearInterval(iv); },1500);
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',()=>setTimeout(mount,300)); else setTimeout(mount,300);
})();
