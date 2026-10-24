/* Горизонты: Диалог наук — логика интерфейса.
   Данные статей, словари и области — в js/data.js (подключается раньше). */

/* ═════════════════ ЦВЕТА ОБЛАСТЕЙ ═════════════════ */
const st=document.createElement('style');
st.textContent=`:root{--n-digital:#00E5FF;--n-pe:#41FFB0;--n-sport:#FFB020;--n-health:#FF7A45;--n-psy:#FF6EC7;--n-olymp:#8F78FF;--n-tourism:#FFD84D}
:root[data-theme="light"]{--n-digital:#0087A3;--n-pe:#0E8F63;--n-sport:#B36A00;--n-health:#C24E1B;--n-psy:#C22E8F;--n-olymp:#5A3FD6;--n-tourism:#8B6914}`;

/* ═════════════════ ХЕЛПЕРЫ ═════════════════ */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
let LANG='ru';
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const t=k=>I18N[LANG][k]??I18N.ru[k]??k;
const L=(o)=>o[LANG]||o.ru;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
let _cv={};
const cssVar=n=>_cv[n]??(_cv[n]=getComputedStyle(document.documentElement).getPropertyValue(n).trim());
const dropCssCache=()=>{_cv={}};
function pl(n,key){
  const f=t(key).split('|');
  if(LANG==='en')return n===1?f[0]:f[1];
  const m10=n%10,m100=n%100;
  if(m10===1&&m100!==11)return f[0];
  if(m10>=2&&m10<=4&&(m100<10||m100>=20))return f[1];
  return f[2];
}
const TR={а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'};
const translit=s=>s.replace(/[А-Яа-яЁё]/g,ch=>{const lo=ch.toLowerCase(),r=TR[lo]??ch;return ch!==lo?r.charAt(0).toUpperCase()+r.slice(1):r});
function toast(msg,type='ok'){
  const d=document.createElement('div');
  d.className='toast '+type;
  d.innerHTML=`<svg><use href="#i-${type==='warn'?'x':'check'}"/></svg><span></span>`;
  d.querySelector('span').textContent=msg;
  $('#toasts').appendChild(d);
  setTimeout(()=>{d.classList.add('out');setTimeout(()=>d.remove(),320)},3400);
}
async function copyText(str){
  if(navigator.clipboard&&window.isSecureContext){
    try{await navigator.clipboard.writeText(str);return}catch(e){/* Try the legacy copy path. */}
  }
  const ta=document.createElement('textarea');ta.value=str;ta.style.cssText='position:fixed;opacity:0';
  const focus=document.activeElement;
  document.body.appendChild(ta);ta.select();
  try{if(!document.execCommand('copy'))throw new Error('Copy unavailable')}
  finally{ta.remove();if(focus&&focus.focus)focus.focus()}
}
async function copyWithFeedback(str,btn,msg){
  try{await copyText(str);ripple(btn);toast(msg)}
  catch(e){toast(t('t.copyFailed'),'warn')}
}
function ripple(btn){btn.classList.remove('rip');void btn.offsetWidth;btn.classList.add('rip')}
function countUp(el,to,dur=1300,fmt=v=>Math.round(v).toLocaleString('ru-RU')){
  if(RM){el.textContent=fmt(to);return}
  const t0=performance.now();
  (function step(now){
    const p=clamp((now-t0)/dur,0,1),e=1-Math.pow(1-p,3);
    el.textContent=fmt(to*e);
    if(p<1)requestAnimationFrame(step);
  })(t0);
}

/* ═════════════════ ХЕЛПЕРЫ СТАТЕЙ ═════════════════ */
const byId=id=>ARTICLES.find(x=>x.id===id);
const artTitle=a=>L(a).t;
const artAbs=a=>L(a).a;
const artKw=a=>L(a).k.join(', ');
const authorsOf=a=>LANG==='en'?a.authors.map(translit):a.authors;
const authorsStr=a=>authorsOf(a).join(', ');
const isoIssue=a=>ISSUES[a.issue];
const issueLabel=a=>{const i=isoIssue(a);return `${i.y} · ${t('no')} ${i.n}`};
const readMin=a=>Math.max(4,a.np*2);
const idLabel=a=>a.doi?`DOI ${a.doi}`:a.edn?`EDN ${a.edn}`:a.registration?`№ ${a.registration}`:'PDF';
const idShort=a=>a.doi?`DOI ${a.doi.slice(-4)}`:idLabel(a);
const idCopy=a=>a.doi?'https://doi.org/'+a.doi:a.edn?'EDN '+a.edn:new URL(a.pdf,location.href).href;
const pagesLabel=a=>a.pages?`${t('pp')} ${a.pages}`:`${a.np} ${t('pdf.pages')}`;
const topicCol=k=>cssVar(TOPICS[k].cv);
const JOURNAL={ru:'Горизонты: Диалог наук',en:'Horizons: Dialogue of Sciences'};
function srcLine(a){
  if(a.src)return L(a.src);
  const i=isoIssue(a);
  return LANG==='en'?`${JOURNAL.en}. ${i.y}, vol. ${i.vol}, no. ${i.n}, pp. ${a.pages}.`:`${JOURNAL.ru}. ${i.y}. Т. ${i.vol}, № ${i.n}. С. ${a.pages}.`;
}
function apaCite(a){
  const i=isoIssue(a),A=authorsStr(a),T=artTitle(a),en=LANG==='en';
  if(a.external)return `${A} (${i.y}). ${a.originalTitle}. ${srcLine(a)}${a.src.vol?', '+a.src.vol:''}${a.src.iss?', '+a.src.iss:''}${a.pages?', '+a.pages:''}. ${a.doi?'https://doi.org/'+a.doi:new URL(a.pdf,location.href).href}`;
  if(a.doi)return `${A} (${i.y}). ${T}. ${JOURNAL[LANG]}, ${i.vol}(${i.n}), ${a.pages}. https://doi.org/${a.doi}`;
  if(a.conf)return `${A} (${i.y}). ${T}. ${en?'In':'В сб.:'} ${L(a.src)} ${en?'pp.':'С.'} ${a.pages}. EDN ${a.edn}`;
  const s=a.src,j=en?s.je:s.jr;
  const vi=s.vol?`${s.vol}(${s.iss})`:(en?`(${s.iss})`:`№ ${s.iss}`);
  return `${A} (${i.y}). ${T}. ${j}, ${vi}, ${a.pages}. EDN ${a.edn}`;
}
function bibTeX(a){
  const i=isoIssue(a),au=authorsOf(a).join(' and ');
  if(a.external){
    const fields={author:au,title:a.originalTitle,year:i.y,journal:a.src.jr,volume:a.src.vol,number:a.src.iss,pages:a.pages,doi:a.doi,url:new URL(a.pdf,location.href).href};
    return `@${a.src.jr?'article':'misc'}{${a.id}${i.y},\n`+Object.entries(fields).filter(([,v])=>v!=null).map(([k,v])=>`  ${k} = {${v}}`).join(',\n')+'\n}';
  }
  if(a.doi)return `@article{${a.id}${i.y},\n  author  = {${au}},\n  title   = {${artTitle(a)}},\n  journal = {${JOURNAL[LANG]}},\n  year    = {${i.y}},\n  volume  = {${i.vol}},\n  number  = {${i.n}},\n  pages   = {${a.pages}},\n  doi     = {${a.doi}}\n}`;
  if(a.conf)return `@inproceedings{${a.id}${i.y},\n  author    = {${au}},\n  title     = {${artTitle(a)}},\n  booktitle = {${LANG==='en'?a.src.je:a.src.jr}},\n  publisher = {${LANG==='en'?a.src.pube:a.src.pub}},\n  address   = {${LANG==='en'?a.src.citye:a.src.city}},\n  year      = {${i.y}},\n  pages     = {${a.pages}},\n  note      = {EDN ${a.edn}}\n}`;
  const s=a.src;
  return `@article{${a.id}${i.y},\n  author  = {${au}},\n  title   = {${artTitle(a)}},\n  journal = {${LANG==='en'?s.je:s.jr}},\n  year    = {${i.y}},${s.vol?`\n  volume  = {${s.vol}},`:''}\n  number  = {${s.iss}},\n  pages   = {${a.pages}},\n  note    = {EDN ${a.edn}}\n}`;
}
function risRec(a){
  if(a.external){
    const [sp,ep]=(a.pages||'').split('–');
    const fields=[['TY',a.src.jr?'JOUR':'GEN'],...authorsOf(a).map(author=>['AU',author]),['TI',a.originalTitle],['JO',a.src.jr],['PY',isoIssue(a).y],['VL',a.src.vol],['IS',a.src.iss],['SP',sp],['EP',ep||sp],['DO',a.doi],['UR',new URL(a.pdf,location.href).href]];
    return fields.filter(([,v])=>v!=null&&v!=='').map(([key,value])=>`${key}  - ${value}`).join('\n')+'\nER  - ';
  }
  const i=isoIssue(a),[sp,ep]=a.pages.split('–');
  const au=authorsOf(a).map(x=>`AU  - ${x}`).join('\n');
  const jr=a.doi?JOURNAL[LANG]:(a.conf?(LANG==='en'?a.src.je:a.src.jr):(LANG==='en'?a.src.je:a.src.jr));
  return `TY  - ${a.conf?'CONF':'JOUR'}\n${au}\nTI  - ${artTitle(a)}\n${a.conf?'T2':'JO'}  - ${jr}\nPY  - ${i.y}\n${a.doi?`VL  - ${i.vol}\nIS  - ${i.n}\n`:(a.src.vol?`VL  - ${a.src.vol}\n`:'')+(a.src.iss?`IS  - ${a.src.iss}\n`:'')}SP  - ${sp}\nEP  - ${ep||sp}\n${a.doi?`DO  - ${a.doi}`:`ID  - EDN ${a.edn}`}\nER  - `;
}

/* ═════════════════ I18N СТАТИКИ ═════════════════ */
const CUR=ARTICLES.filter(a=>a.issue==='2025-01');
function applyI18n(){
  $$('[data-i18n]').forEach(el=>{const k=el.dataset.i18n;if(I18N[LANG][k]!==undefined)el.innerHTML=I18N[LANG][k].replace('{n}',CUR.length)});
  $$('[data-i18n-ph]').forEach(el=>el.placeholder=t(el.dataset.i18nPh));
  $$('[data-i18n-aria]').forEach(el=>el.setAttribute('aria-label',t(el.dataset.i18nAria)));
  document.documentElement.lang=LANG;
  document.title=t('title');
  $('#langBtn').textContent=LANG==='ru'?'EN':'RU';
  $('#issueDate').textContent=ISSUES['2025-01'].date[LANG];
}

/* ═════════════════ HERO: НЕЙРОСЕТЬ-ЧАСТИЦЫ ═════════════════ */
const hero=$('#hero'),hcv=$('#heroCanvas'),hx=hcv.getContext('2d'),stage=$('#heroStage');
let HW=0,HH=0,hDpr=1,letters=[],frees=[],targets=[],mouse={x:-9e3,y:-9e3},heroOn=true,heroScroll=0;
function heroSize(){
  hDpr=Math.min(2,devicePixelRatio||1);
  HW=hero.clientWidth;HH=hero.clientHeight;
  hcv.width=HW*hDpr;hcv.height=HH*hDpr;
  hx.setTransform(hDpr,0,0,hDpr,0,0);
}
function buildTargets(){
  heroSize();
  const word=LANG==='ru'?'ГОРИЗОНТЫ':'HORIZONS';
  const sr=stage.getBoundingClientRect(),hr=hero.getBoundingClientRect();
  const cy=sr.top-hr.top+sr.height/2,availH=Math.max(60,sr.height);
  const off=document.createElement('canvas'),oc=off.getContext('2d');
  off.width=HW;off.height=HH;
  const spacing=0.03;
  oc.font='800 100px Manrope,sans-serif';
  try{oc.letterSpacing=(100*spacing)+'px'}catch(e){}
  const w100=oc.measureText(word).width||word.length*72;
  let fs=Math.min(HW*0.9/w100*100,availH*0.8,260);
  oc.font=`800 ${fs}px Manrope,sans-serif`;
  try{oc.letterSpacing=(fs*spacing)+'px'}catch(e){}
  oc.textAlign='center';oc.textBaseline='middle';oc.fillStyle='#fff';
  oc.fillText(word,HW/2,cy);
  const img=oc.getImageData(0,0,HW,HH).data;
  const step=Math.max(4,Math.round(fs/30));
  const pts=[];
  for(let y=0;y<HH;y+=step)for(let x=0;x<HW;x+=step){
    if(img[(y*HW+x)*4+3]>128)pts.push({x,y});
  }
  const target=Math.min(pts.length,HW<720?800:1400);
  while(pts.length>target)pts.splice(Math.random()*pts.length|0,1);
  targets=pts;
  while(letters.length<pts.length)
    letters.push({x:Math.random()*HW,y:Math.random()*HH,vx:0,vy:0,ph:Math.random()*7});
  letters.length=pts.length;
  if(RM)letters.forEach((p,i)=>{p.x=targets[i].x;p.y=targets[i].y});
  frees=[];
  const nFree=HW<720?60:130;
  for(let i=0;i<nFree;i++)frees.push({x:Math.random()*HW,y:Math.random()*HH,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,ph:Math.random()*7});
  $('#heroStats').textContent=`NODES ${pts.length+nFree} / LINKS ${nFree*4}`;
}
function drawHero(time){
  hx.clearRect(0,0,HW,HH);
  const oy=heroScroll*0.22;
  const cyan=cssVar('--cyan'),violet=cssVar('--violet');
  hx.lineWidth=1;
  for(let i=0;i<frees.length;i++){
    const a=frees[i];
    if(!RM){a.x+=a.vx;a.y+=a.vy;}
    if(a.x<0||a.x>HW)a.vx*=-1;if(a.y<0||a.y>HH)a.vy*=-1;
    for(let j=i+1;j<frees.length;j++){
      const b=frees[j],dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;
      if(d2<12100){
        hx.globalAlpha=(1-Math.sqrt(d2)/110)*.28;
        hx.strokeStyle=cyan;
        hx.beginPath();hx.moveTo(a.x,a.y+oy);hx.lineTo(b.x,b.y+oy);hx.stroke();
      }
    }
    hx.globalAlpha=.85;hx.fillStyle=cyan;
    hx.beginPath();hx.arc(a.x,a.y+oy,1.6,0,7);hx.fill();
  }
  const mTop=hero.getBoundingClientRect().top;
  for(let i=0;i<letters.length;i++){
    const p=letters[i],tg=targets[i];
    if(!tg)break;
    p.vx+=(tg.x-p.x)*.014;p.vy+=(tg.y-p.y)*.014;
    const dx=p.x-mouse.x,dy=p.y-(mouse.y-mTop);
    const d2=dx*dx+dy*dy;
    if(d2<16900){const d=Math.sqrt(d2)||1,f=(1-d/130)*1.7;p.vx+=dx/d*f;p.vy+=dy/d*f}
    p.vx*=.86;p.vy*=.86;p.x+=p.vx;p.y+=p.vy;
    const pulse=.65+.35*Math.sin(time*.002+p.ph);
    hx.globalAlpha=.9*pulse;
    hx.fillStyle=i%7===0?violet:cyan;
    hx.beginPath();hx.arc(p.x,p.y+oy,1.9,0,7);hx.fill();
  }
  hx.globalAlpha=1;
}
function drawHud(){
  hx.strokeStyle=cssVar('--line2');hx.lineWidth=1;hx.globalAlpha=.4;
  const sr=stage.getBoundingClientRect(),hr=hero.getBoundingClientRect();
  const w=HW*0.8,h=Math.max(80,sr.height*0.9),x=HW*0.1,y=sr.top-hr.top+sr.height*0.05,m=16;
  [[x,y,1,1],[x+w,y,-1,1],[x,y+h,1,-1],[x+w,y+h,-1,-1]].forEach(([cx,cy,sx,sy])=>{
    hx.beginPath();hx.moveTo(cx+sx*m,cy);hx.lineTo(cx,cy);hx.lineTo(cx,cy+sy*m);hx.stroke();
  });
  hx.globalAlpha=1;
}

/* ═════════════════ ГРАФ ЗНАНИЙ ═════════════════ */
const gcv=$('#graphCanvas'),gx=gcv.getContext('2d');
let GW=0,GH=0,gDpr=1,view={x:0,y:0,s:1};
let nodes=[],edges=[],dragNode=null,panning=false,lastM={x:0,y:0},downM={x:0,y:0},hoverNode=null,activeTopic=null;
function graphSize(){
  gDpr=Math.min(2,devicePixelRatio||1);
  GW=gcv.clientWidth;GH=gcv.clientHeight;
  gcv.width=GW*gDpr;gcv.height=GH*gDpr;
  gx.setTransform(gDpr,0,0,gDpr,0,0);
}
const topicCount=k=>ARTICLES.filter(x=>x.topic===k).length;
function buildGraph(){
  const keys=Object.keys(TOPICS);
  const cx=GW/2,cy=GH/2,Rx=GW*0.34,Ry=GH*0.27;
  nodes=[{id:'core',x:cx,y:cy,r:26,fixed:true}];
  keys.forEach((k,i)=>{
    const a=-Math.PI/2+i*(Math.PI*2/keys.length);
    const x=cx+Math.cos(a)*Rx,y=cy+Math.sin(a)*Ry;
    nodes.push({id:k,x,y,hx:x,hy:y,r:13+topicCount(k)*1.8,a0:a});
  });
  edges=EDGE_SET.map(([a,b])=>({a,b}));
  view={x:0,y:0,s:1};
}
const nodeById=id=>nodes.find(n=>n.id===id);
function wrapLabel(s,max){
  const w=s.split(' '),lines=[];let cur='';
  w.forEach(x=>{if((cur+' '+x).trim().length>max&&cur){lines.push(cur);cur=x}else cur=(cur+' '+x).trim()});
  if(cur)lines.push(cur);return lines;
}
function drawGraph(time){
  gx.clearRect(0,0,GW,GH);
  gx.save();gx.translate(view.x,view.y);gx.scale(view.s,view.s);
  const dim=activeTopic?0.25:1;
  edges.forEach(e=>{
    const A=nodeById(e.a),B=nodeById(e.b);
    if(!A||!B)return;
    const rel=activeTopic&&(e.a===activeTopic||e.b===activeTopic);
    gx.globalAlpha=rel?.95:dim*.5;
    gx.strokeStyle=rel?cssVar('--amber'):cssVar('--line2');
    gx.lineWidth=rel?1.6:1;
    gx.setLineDash([3,6]);gx.lineDashOffset=-time*0.02;
    const mx=(A.x+B.x)/2,my=(A.y+B.y)/2-18;
    gx.beginPath();gx.moveTo(A.x,A.y);gx.quadraticCurveTo(mx,my,B.x,B.y);gx.stroke();
  });
  gx.setLineDash([]);
  nodes.forEach(n=>{
    if(n.id==='core')return;
    const rel=!activeTopic||activeTopic===n.id;
    gx.globalAlpha=rel?.8:dim*.3;
    gx.strokeStyle=rel?cssVar('--cyan'):cssVar('--line2');
    gx.lineWidth=rel?1.2:1;
    gx.beginPath();gx.moveTo(nodes[0].x,nodes[0].y);gx.lineTo(n.x,n.y);gx.stroke();
  });
  gx.textAlign='center';
  const small=GW<520,fsz=small?9.5:11,lh=small?12:14,maxCh=small?15:19;
  nodes.forEach(n=>{
    const isCore=n.id==='core';
    const col=isCore?cssVar('--amber'):topicCol(n.id);
    const act=activeTopic===n.id;
    const rel=dim===1||act||isCore;
    const wob=RM?0:Math.sin(time*.0012+(n.a0||0))*3;
    if(!n.fixed&&!dragNode&&!RM){n.x+=(n.hx-n.x)*.02;n.y+=(n.hy-n.y)*.02}
    gx.globalAlpha=rel?.14:.05;gx.fillStyle=col;
    gx.beginPath();gx.arc(n.x,n.y+wob,n.r*(act?1.15:1),0,7);gx.fill();
    gx.globalAlpha=rel?1:.35;gx.lineWidth=act?2:1.3;gx.strokeStyle=col;gx.stroke();
    gx.globalAlpha=rel?1:.3;gx.fillStyle=col;
    gx.beginPath();gx.arc(n.x,n.y+wob,3.4,0,7);gx.fill();
    gx.font=`600 ${fsz}px "JetBrains Mono",monospace`;
    gx.fillStyle=cssVar('--text');
    gx.globalAlpha=rel?.95:.25;
    const lbl=isCore?t('graph.core'):TOPICS[n.id][LANG];
    const lines=wrapLabel(lbl.toUpperCase(),maxCh);
    const rr=n.r*(act?1.15:1),above=!isCore&&n.y<nodes[0].y-6;
    const tot=lines.length+(isCore?0:1);
    const y0=above?n.y+wob-rr-6-(tot-1)*lh:n.y+wob+rr+lh+2;
    lines.forEach((ln,i)=>gx.fillText(ln,n.x,y0+i*lh));
    if(!isCore){
      gx.fillStyle=cssVar('--muted');gx.globalAlpha=rel?.85:.2;
      gx.fillText(String(topicCount(n.id)),n.x,y0+lines.length*lh);
    }
    if(act){
      gx.globalAlpha=.5+.3*Math.sin(time*.005);
      gx.strokeStyle=col;gx.beginPath();gx.arc(n.x,n.y+wob,n.r+8,0,7);gx.stroke();
    }
  });
  gx.restore();gx.globalAlpha=1;
}
function gHit(px,py){
  const wx=(px-view.x)/view.s,wy=(py-view.y)/view.s;
  for(let i=nodes.length-1;i>0;i--){
    const n=nodes[i];
    if((wx-n.x)**2+(wy-n.y)**2<(n.r+10)**2)return n;
  }
  return null;
}
gcv.addEventListener('pointerdown',e=>{
  const r=gcv.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;
  downM={x:px,y:py};lastM={x:px,y:py};
  dragNode=gHit(px,py);
  if(!dragNode)panning=true;
  try{gcv.setPointerCapture(e.pointerId)}catch(_){}
});
gcv.addEventListener('pointermove',e=>{
  const r=gcv.getBoundingClientRect(),px=e.clientX-r.left,py=e.clientY-r.top;
  if(dragNode){
    dragNode.x=(px-view.x)/view.s;dragNode.y=(py-view.y)/view.s;
    dragNode.hx=dragNode.x;dragNode.hy=dragNode.y;
  }else if(panning){
    view.x+=px-lastM.x;view.y+=py-lastM.y;
  }else{
    hoverNode=gHit(px,py);
    gcv.style.cursor=hoverNode?'pointer':'';
  }
  lastM={x:px,y:py};
});
gcv.addEventListener('pointerup',()=>{
  const moved=Math.hypot(lastM.x-downM.x,lastM.y-downM.y);
  if(moved<5){
    if(dragNode){setActiveTopic(activeTopic===dragNode.id?null:dragNode.id)}
    else if(!gHit(downM.x,downM.y))setActiveTopic(null);
  }
  dragNode=null;panning=false;
});
gcv.addEventListener('pointercancel',()=>{dragNode=null;panning=false});
$('#zoomIn').onclick=()=>view.s=clamp(view.s*1.22,.6,2.4);
$('#zoomOut').onclick=()=>view.s=clamp(view.s/1.22,.6,2.4);
$('#zoomReset').onclick=()=>{view={x:0,y:0,s:1}};
$('#sideReset').onclick=()=>setActiveTopic(null);
function setActiveTopic(id){activeTopic=id;renderSide()}
function thumb(a,cls=''){return `<img class="pthumb ${cls}" loading="lazy" src="${a.img}" alt="">`}
function renderSide(){
  const list=activeTopic?ARTICLES.filter(a=>a.topic===activeTopic):ARTICLES;
  const tt=activeTopic?TOPICS[activeTopic][LANG]:t('areas.all');
  $('#topicTitle').textContent=tt;
  $('#topicDot').style.background=activeTopic?topicCol(activeTopic):cssVar('--cyan');
  $('#graphCount').textContent=`${t('areas.found')}: ${list.length}${activeTopic?t('areas.note'):''}`;
  $('#sideList').innerHTML=list.map(a=>`
    <button class="side-item" data-art="${a.id}" data-cursor="read">
      ${thumb(a)}
      <span class="si-txt"><h5>${artTitle(a)}</h5>
      <p>${authorsStr(a)} · ${issueLabel(a)}</p></span>
    </button>`).join('')||`<div class="side-empty">—</div>`;
  $$('#sideList [data-art]').forEach(b=>b.onclick=()=>openPdf(byId(b.dataset.art)));
}

/* ═════════════════ ТИКЕР ═════════════════ */
function renderTicker(){
  const items=[...CUR].sort((a,b)=>b.cites-a.cites).slice(0,6)
    .map(a=>`<span class="tk"><span class="doi">${a.doi}</span><span>${artTitle(a)}</span><span class="up">▲ ${a.cites}</span></span>`).join('');
  $('#tickerTrack').innerHTML=items+items;
}

/* ═════════════════ СОДЕРЖАНИЕ ВЫПУСКА ═════════════════ */
function renderToC(){
  $('#tocList').innerHTML=CUR.map((a,i)=>`
   <div class="toc-row" id="row-${a.id}">
    <button class="toc-btn" data-row="${a.id}" data-cursor="read" aria-expanded="false">
      <span class="toc-idx">${String(i+1).padStart(2,'0')}</span>
      <span class="toc-main">
        <span class="toc-t">${artTitle(a)}</span>
        <span class="toc-authors">${authorsStr(a)}</span>
        <span class="toc-tags">
          <span class="ttag" style="color:${topicCol(a.topic)};border-color:${topicCol(a.topic)}66">${TOPICS[a.topic][LANG]}</span>
          ${i===0?`<span class="ttag oa">OPEN ACCESS</span>`:''}
        </span>
      </span>
      <span class="toc-right"><b>${pagesLabel(a)}</b>${a.cites!=null?`<span class="cites">▲ ${a.cites}</span>`:''}<span>${readMin(a)} ${t('feat.read')}</span></span>
    </button>
    <div class="toc-body"><div>
      <div class="toc-inner">
        <button class="toc-thumb" data-pdf="${a.id}" data-cursor="pdf" aria-label="PDF">${thumb(a)}</button>
        <div class="toc-info">
          <div class="toc-abs"><b>${t('issue.abs')}.</b> ${artAbs(a)}</div>
          <div class="toc-kw"><b>${t('issue.kw')}:</b> ${artKw(a)}</div>
          <div class="toc-actions">
            <button class="chip" data-cite="bibtex" data-a="${a.id}" data-cursor="cite"><svg><use href="#i-quote"/></svg>BibTeX</button>
            <button class="chip" data-cite="ris" data-a="${a.id}" data-cursor="cite"><svg><use href="#i-quote"/></svg>RIS</button>
            <button class="chip" data-cite="apa" data-a="${a.id}" data-cursor="cite"><svg><use href="#i-quote"/></svg>APA</button>
            <button class="chip doi" data-doi="${a.id}" data-cursor="copy"><svg><use href="#i-copy"/></svg>${a.doi}</button>
            <button class="chip" data-pdf="${a.id}" data-cursor="pdf"><svg><use href="#i-file"/></svg>PDF</button>
          </div>
        </div>
      </div>
    </div></div>
   </div>`).join('');
  $$('#tocList .toc-btn').forEach(b=>b.onclick=()=>{const o=b.parentElement.classList.toggle('open');b.setAttribute('aria-expanded',o)});
  $$('#tocList [data-cite]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const a=byId(b.dataset.a),f=b.dataset.cite;
    const txt=f==='bibtex'?bibTeX(a):f==='ris'?risRec(a):apaCite(a);
    copyWithFeedback(txt,b,`${f.toUpperCase()} → ${t('t.copied')}`);
  });
  $$('#tocList [data-doi]').forEach(b=>b.onclick=e=>{
    e.stopPropagation();copyWithFeedback(idCopy(byId(b.dataset.doi)),b,t('t.doi'));
  });
  $$('#tocList [data-pdf]').forEach(b=>b.onclick=e=>{e.stopPropagation();openPdf(byId(b.dataset.pdf))});
}

/* ═════════════════ МЕТРИКИ ═════════════════ */
const M={subs:47,acc:31.4,rev:38,h:17,alt:412,if:1.87};
const SPARKS={subs:[33,35,34,38,36,40,42,41,44,43,45,47],acc:[29,30,30.5,31,30.8,31.6,31.2,31.9,31.5,31.8,31.3,31.4],rev:[44,43,42,42,41,40,40,39,39,38,38,38],h:[13,13.5,14,14.5,15,15.5,16,16,16.5,16.7,17,17],alt:[280,300,310,330,340,350,365,370,380,390,395,412],if:[1.3,1.34,1.38,1.42,1.45,1.5,1.54,1.6,1.65,1.7,1.78,1.87]};
function drawSpark(cv,data,color){
  const d=Math.min(2,devicePixelRatio||1);
  const w=cv.clientWidth||200,h=34;
  cv.width=w*d;cv.height=h*d;
  const c=cv.getContext('2d');c.setTransform(d,0,0,d,0,0);
  const mn=Math.min(...data),mx=Math.max(...data),r=mx-mn||1;
  const px=i=>i/(data.length-1)*(w-4)+2, py=v=>h-6-((v-mn)/r)*(h-12);
  const g=c.createLinearGradient(0,0,w,0);
  g.addColorStop(0,cssVar('--cyan'));g.addColorStop(1,cssVar('--violet'));
  c.beginPath();data.forEach((v,i)=>i?c.lineTo(px(i),py(v)):c.moveTo(px(i),py(v)));
  c.strokeStyle=g;c.lineWidth=1.5;c.stroke();
  c.lineTo(px(data.length-1),h);c.lineTo(px(0),h);c.closePath();
  c.globalAlpha=.09;c.fillStyle=g;c.fill();c.globalAlpha=1;
  c.fillStyle=cssVar('--amber');
  c.beginPath();c.arc(px(data.length-1),py(data[data.length-1]),2.4,0,7);c.fill();
}
const redrawSparks=()=>$$('.spark').forEach(cv=>drawSpark(cv,SPARKS[cv.dataset.key]));
function initMetrics(){
  countUp($('#mSubs'),M.subs);countUp($('#mAcc'),M.acc,1400,v=>v.toFixed(1));
  countUp($('#mRev'),M.rev);countUp($('#mH'),M.h);countUp($('#mAlt'),M.alt);countUp($('#mIF'),M.if,1400,v=>v.toFixed(2));
}
let metStarted=false;
function startMetrics(){
  if(metStarted)return;metStarted=true;
  initMetrics();
  redrawSparks();
  setInterval(()=>{
    const el=$('#mSubs');
    if(Math.random()<.5){M.subs=Math.min(M.subs+1,120);el.textContent=M.subs;el.parentElement.classList.remove('tick');void el.offsetWidth;el.parentElement.classList.add('tick');
      SPARKS.subs.push(M.subs);SPARKS.subs.shift();const cv=$('.spark[data-key="subs"]');if(cv)drawSpark(cv,SPARKS.subs);}
    if(M.alt<460&&Math.random()<.4)M.alt++;
    $('#mAlt').textContent=M.alt;
    $('#mAltD').innerHTML=`▲ +${18+(M.alt-412)} ${t('met.week')}`;
    M.acc=clamp(M.acc+(Math.random()-.5)*.2,28,34);
    $('#mAcc').textContent=M.acc.toFixed(1);
  },2500);
}
const mcv=$('#mapCanvas'),mx2=mcv.getContext('2d');
let MW=0,MH=0,pulses=[];
function mapSize(){
  const d=Math.min(2,devicePixelRatio||1);
  MW=mcv.parentElement.clientWidth;MH=mcv.parentElement.clientHeight;
  mcv.width=MW*d;mcv.height=MH*d;mx2.setTransform(d,0,0,d,0,0);
}
function drawMap(time){
  mx2.clearRect(0,0,MW,MH);
  const cyan=cssVar('--cyan');
  const stepX=MW/46,stepY=MH/24;
  for(let gx0=stepX/2;gx0<MW;gx0+=stepX)for(let gy=stepY/2;gy<MH;gy+=stepY){
    let v=0;
    CITIES.forEach(c=>{const dx=(gx0-c.x*MW)/60,dy=(gy-c.y*MH)/38;v+=c.c*Math.exp(-dx*dx-dy*dy)});
    v+=Math.sin(gx0*.05+gy*.03)*3;
    if(v<2)continue;
    mx2.globalAlpha=clamp(v/120,.05,.5);
    mx2.fillStyle=cyan;
    mx2.beginPath();mx2.arc(gx0,gy,1.1,0,7);mx2.fill();
  }
  const small=MW<420;
  CITIES.forEach((c,i)=>{
    const x=c.x*MW,y=c.y*MH;
    const r=3+Math.sqrt(c.c)*.35;
    mx2.globalAlpha=.9;mx2.fillStyle=i===0?cssVar('--amber'):cyan;
    mx2.beginPath();mx2.arc(x,y,r,0,7);mx2.fill();
    mx2.globalAlpha=.35;mx2.strokeStyle=cyan;mx2.lineWidth=1;
    mx2.beginPath();mx2.arc(x,y,r+3+(RM?0:Math.sin(time*.002+i)*1.5),0,7);mx2.stroke();
  });
  /* подписи: крупные города первыми, пересекающиеся — пропускаем */
  const placed=[];
  mx2.font=`500 ${small?8:9}px "JetBrains Mono",monospace`;
  [...CITIES].sort((a,b)=>b.c-a.c).forEach(c=>{
    if(small&&c.c<40)return;
    const x=c.x*MW,y=c.y*MH,r=3+Math.sqrt(c.c)*.35;
    const lab=c.n[LANG==='ru'?0:1].toUpperCase(),wl=mx2.measureText(lab).width;
    const left=x+r+6+wl>MW-4;
    const bx=left?x-r-6-wl:x+r+6,box=[bx-3,y-8,bx+wl+3,y+8];
    if(placed.some(q=>box[0]<q[2]&&box[2]>q[0]&&box[1]<q[3]&&box[3]>q[1]))return;
    placed.push(box);
    mx2.globalAlpha=.85;mx2.fillStyle=cssVar('--muted');
    mx2.textAlign=left?'right':'left';
    mx2.fillText(lab,left?x-r-6:x+r+6,y+3);
  });
  pulses=pulses.filter(p=>time-p.t0<1600);
  pulses.forEach(p=>{
    const pr=(time-p.t0)/1600;
    mx2.globalAlpha=(1-pr)*.6;mx2.strokeStyle=cssVar('--amber');mx2.lineWidth=1.2;
    mx2.beginPath();mx2.arc(p.x,p.y,6+pr*44,0,7);mx2.stroke();
  });
  mx2.globalAlpha=1;
}
setInterval(()=>{
  if(!MW)return;
  const c=CITIES[Math.random()*CITIES.length|0];
  pulses.push({x:c.x*MW,y:c.y*MH,t0:performance.now()});
  const oc=$('#onlineCount');
  oc.textContent=clamp(+oc.textContent+(Math.random()<.5?1:-1)*(1+(Math.random()*2|0)),96,164);
  const f=$('#mapFeed');
  const d=document.createElement('div');d.className='feed-in';
  d.innerHTML=`<b>+</b><span>${c.n[LANG==='ru'?0:1]} · ${t('met.newAuthor')}</span>`;
  f.prepend(d);while(f.children.length>5)f.lastChild.remove();
},2200);

/* ═════════════════ FEATURED ═════════════════ */
function constellationSVG(a){
  const rel=ARTICLES.filter(x=>x.id!==a.id&&x.topic===a.topic).slice(0,3);
  const pts=[[62,12],[10,40],[38,64],[70,58]];
  const names=[artTitle(a),...rel.map(artTitle)];
  let s=`<svg class="constellation" viewBox="0 0 80 76" aria-hidden="true">`;
  pts.slice(1).forEach(p=>s+=`<line x1="${pts[0][0]}" y1="${pts[0][1]}" x2="${p[0]}" y2="${p[1]}" stroke="currentColor" stroke-width="0.8"/>`);
  pts.forEach((p,i)=>s+=`<circle cx="${p[0]}" cy="${p[1]}" r="${i===0?3.4:2.4}" fill="currentColor"><title>${names[i]||names[0]}</title></circle>`);
  return s+'</svg>';
}
let featIO=null;
function renderFeatured(){
  const list=CUR.filter(a=>a.feat);
  $('#featGrid').innerHTML=list.map(a=>{
    const col=topicCol(a.topic);
    return `<article class="fcard ${a.feat}" data-tilt>
      <button class="fimg" data-fpdf="${a.id}" data-cursor="pdf" aria-label="PDF"><img loading="lazy" src="${a.img}" alt="${t('pdf.p1')}: ${artTitle(a).replace(/"/g,'&quot;')}"></button>
      <div class="fbody">
        ${constellationSVG(a)}
        <div class="fmeta"><span class="topic" style="color:${col}">${TOPICS[a.topic][LANG]}</span><span>${issueLabel(a)}</span><span>${idShort(a)}</span></div>
        <h3>${artTitle(a)}</h3>
        <p class="fabs">${artAbs(a)}</p>
        <div class="ffoot">
          <span>${a.authors.length} ${pl(a.authors.length,'pl.author')}</span>
          <span class="dotsep">●</span><span>${readMin(a)} ${t('feat.read')}</span>
          ${a.cites!=null?`<span class="dotsep">●</span><span class="fcites" data-n="${a.cites}">${a.cites} ${pl(a.cites,'pl.cite')}</span>`:''}
          <span class="spacer"></span>
          <button class="fbtn" data-fcite="${a.id}" data-cursor="cite"><svg><use href="#i-quote"/></svg>${t('feat.cite')}</button>
          <button class="fbtn" data-fpdf="${a.id}" data-cursor="pdf"><svg><use href="#i-file"/></svg>${t('feat.pdf')}</button>
        </div>
      </div>
    </article>`;
  }).join('');
  $$('#featGrid .fcard').forEach(bindTilt);
  if(featIO)featIO.disconnect();
  featIO=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){const n=+e.target.dataset.n;countUp(e.target,n,1500,v=>Math.round(v)+' '+pl(n,'pl.cite'));featIO.unobserve(e.target)}
  }),{threshold:.6});
  $$('.fcites').forEach(el=>{el.textContent=`0 ${pl(0,'pl.cite')}`;featIO.observe(el)});
  $$('#featGrid [data-fcite]').forEach(b=>b.onclick=()=>{
    copyWithFeedback(apaCite(byId(b.dataset.fcite)),b,t('t.cite'));
  });
  $$('#featGrid [data-fpdf]').forEach(b=>b.onclick=()=>openPdf(byId(b.dataset.fpdf)));
}
function bindTilt(el,str=6){
  if(el._tilt)return;el._tilt=1;
  el.addEventListener('mousemove',e=>{
    if(matchMedia('(pointer:coarse)').matches||RM)return;
    const r=el.getBoundingClientRect();
    const px=(e.clientX-r.left)/r.width-.5,py=(e.clientY-r.top)/r.height-.5;
    el.style.transform=`perspective(1000px) rotateY(${px*str}deg) rotateX(${-py*str}deg) translateY(-3px)`;
  });
  el.addEventListener('mouseleave',()=>el.style.transform='');
}
bindTilt($('#cover'),9);

/* ═════════════════ РЕДКОЛЛЕГИЯ ═════════════════ */
function initials(name){
  const p=name.replace(/[.,]/g,'').split(/\s+/).filter(Boolean);
  return ((p[0]||'')[0]+(p[1]||'')[0]).toUpperCase();
}
function renderBoard(){
  $('#boardGrid').innerHTML=BOARD.map((m,i)=>{
    const n=LANG==='ru'?m.ru:m.en;
    const ini=initials(n[0]);
    return `<div class="mcard" data-cursor="prof" tabindex="0">
      <div class="mimg" style="--h:${(i*47+200)%360}"><span class="mono-ini">${ini}</span><span class="mimg-no">ED.0${i+1}</span></div>
      <div class="mbody">
        <h4>${n[0]}</h4><div class="mrole">${n[1]}</div><div class="maff">${n[2]}</div>
        <button class="morcid" data-orcid="${m.orcid}" data-cursor="copy"><svg><use href="#i-orcid"/></svg>${m.orcid}</button>
        <div class="mtags">${m.tags.map(k=>`<span class="ttag" style="color:${topicCol(k)};border-color:${topicCol(k)}66">${TOPICS[k][LANG]}</span>`).join('')}</div>
      </div>
      <div class="mbio">
        <h4>${n[0]}</h4><div class="mrole">${n[1]}</div>
        <p>${L(m.bio)}</p>
        <div class="nums">
          <div><b>${m.pub}</b><span>${t('board.pub')}</span></div>
          <div><b>${m.h}</b><span>h-index</span></div>
        </div>
        <button class="chip" data-prof="${m.orcid}" data-cursor="open"><svg><use href="#i-ext"/></svg>${t('board.prof')}</button>
      </div>
    </div>`;
  }).join('');
  $$('.morcid').forEach(b=>b.onclick=()=>copyWithFeedback('https://orcid.org/'+b.dataset.orcid,b,'ORCID → '+t('t.copied')));
  $$('.mcard [data-prof]').forEach(b=>b.onclick=()=>toast(t('t.profile')));
  $$('.mcard').forEach(c=>{
    const tg=()=>c.classList.toggle('open');
    c.addEventListener('click',e=>{if(e.target.closest('button'))return;if(matchMedia('(hover:none)').matches)tg()});
    c.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.target.closest('button'))tg()});
  });
}

/* ═════════════════ ПРОЦЕСС ═════════════════ */
let activeStep=0;
function renderSteps(){
  $('#stepsFlow').innerHTML=STEPS.map((s,i)=>`
    <button class="step ${i===activeStep?'on':''}" data-step="${i}" data-cursor="open">
      <span class="step-ico"><svg><use href="#${s.ico}"/></svg></span>
      <h4>${s[LANG][0]}</h4><span class="sla">SLA ${L(s.sla)}</span>
    </button>`).join('');
  $$('#stepsFlow .step').forEach(b=>b.onclick=()=>{activeStep=+b.dataset.step;renderSteps()});
  renderStepDetail();
}
function renderStepDetail(){
  const s=STEPS[activeStep];
  $('#stepDetail').innerHTML=`
    <div><h4><span class="mono" style="color:var(--amber)">0${activeStep+1}</span> · ${s[LANG][0]}</h4><p>${s[LANG][1]}</p></div>
    <div class="sd-nums">
      <div><b>${s.q}</b><span>${t('proc.queue')}</span></div>
      <div><b>${L(s.sla)}</b><span>${t('proc.sla')}</span></div>
      <div><b>${L(s.avg)}</b><span>${t('proc.avg')}</span></div>
    </div>`;
}
new IntersectionObserver((es,o)=>es.forEach(e=>{
  if(e.isIntersecting){$('#stepsFill').style.width='100%';o.disconnect()}
}),{threshold:.4}).observe($('#stepsFlow'));

/* ═════════════════ ЧЕК-ЛИСТ ═════════════════ */
let checked=new Set();
function renderChecklist(){
  $('#checklist').innerHTML=Object.keys(I18N.ru).filter(k=>k.startsWith('ck.')).map((k,i)=>`
    <button class="citem ${checked.has(i)?'done':''}" data-ck="${i}"><span class="cbox"><svg><use href="#i-check"/></svg></span><span>${t('ck.'+(i+1))}</span></button>`).join('');
  $$('.citem').forEach(b=>b.onclick=()=>{
    const i=+b.dataset.ck;
    b.classList.toggle('done');checked[b.classList.contains('done')?'add':'delete'](i);
    updateCheck();
  });
  updateCheck(true);
}
function updateCheck(silent){
  const n=checked.size,tot=10;
  $('#checkFill').style.width=n*10+'%';
  $('#checkPct').textContent=n*10+'% · '+n+'/'+tot;
  $('#toSubmitBtn').disabled=n<tot;
  if(n===tot&&!silent)toast(t('t.check'));
}
$('#toSubmitBtn').onclick=()=>document.getElementById('submit').scrollIntoView({behavior:'smooth'});

/* ═════════════════ АРХИВ ═════════════════ */
let archKey='2025-01',archTopic='all',archSort='year';
function issueRecs(){
  return Object.entries(ISSUES).map(([key,v])=>{
    const arts=ARTICLES.filter(a=>a.issue===key);
    const cnt={};arts.forEach(a=>cnt[a.topic]=(cnt[a.topic]||0)+1);
    const main=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a])[0];
    return {key,...v,arts,main,c:arts.length};
  });
}
function renderArchive(){
  const recs=issueRecs();
  const years=[...new Set(recs.map(r=>r.y))].sort((a,b)=>b-a);
  const curRec=recs.find(r=>r.key===archKey);
  $('#yearsList').innerHTML=years.map(y=>`<button class="year ${y===curRec.y?'on':''}" data-y="${y}">${y}</button>`).join('');
  $$('#yearsList .year').forEach(b=>b.onclick=()=>{archKey=recs.find(r=>r.y===+b.dataset.y).key;renderArchive()});
  $('#archTopics').innerHTML=`<button class="chan ${archTopic==='all'?'on':''}" data-t="all">${t('arch.all')}</button>`+
    Object.keys(TOPICS).map(k=>`<button class="chan ${archTopic===k?'on':''}" data-t="${k}">${TOPICS[k][LANG]}</button>`).join('');
  $$('#archTopics .chan').forEach(b=>b.onclick=()=>{archTopic=b.dataset.t;renderArchive()});
  $('#sortBtn').querySelector('span').textContent=t(archSort==='year'?'arch.byYear':'arch.byCnt');
  const sorted=[...recs].sort((a,b)=>archSort==='year'?b.y-a.y||b.n-a.n:b.c-a.c||b.y-a.y);
  $('#shelf').innerHTML=sorted.map(is=>{
    const has=archTopic==='all'||is.arts.some(a=>a.topic===archTopic);
    return `<button class="spine ${has?'':'dim'} ${is.key===archKey?'sel':''}" data-i="${is.key}" aria-label="${is.y} ${t('no')} ${is.n}" style="--c:${topicCol(is.main)};width:${64+is.c*2}px">
      <span class="sn">${t('no')}${is.n}</span><span class="sy">${is.y} · ${is.c}</span>
    </button>`;
  }).join('');
  $$('#shelf .spine').forEach(b=>b.onclick=()=>{archKey=b.dataset.i;renderArchive()});
  renderIssuePanel(curRec);
}
function renderIssuePanel(is){
  const rows=is.arts.map((a,i)=>{
    const dim=archTopic!=='all'&&a.topic!==archTopic?'dim':'';
    return `<button class="ip-row ${dim}" data-art="${a.id}" data-cursor="pdf">
      <span class="n">${String(i+1).padStart(2,'0')}</span>
      ${thumb(a,'mini')}
      <span class="ip-t"><span class="ip-title">${artTitle(a)}</span><span class="ip-meta">${authorsStr(a)} · ${pagesLabel(a)}${a.edn?` · EDN ${a.edn}`:''}</span></span>
      <span class="ip-dot" style="background:${topicCol(a.topic)}" title="${TOPICS[a.topic][LANG]}"></span>
      ${a.cites!=null?`<p>▲ ${a.cites}</p>`:''}
    </button>`;
  }).join('');
  $('#issuePanel').innerHTML=`
    <div class="ip-head"><h4>${is.y} · ${t('no')} ${is.n}${is.collection?'':` <span style="color:var(--muted);font-weight:500">(${t('vol')} ${is.vol})</span>`}</h4>
      <span class="mono">${is.c} ${pl(is.c,is.collection?'pl.document':'pl.article')}${is.date?` · ${t('issue.pub')} ${is.date[LANG]}`:''}</span></div>
    ${is.collection?`<p class="collection-note">${t('arch.collectionNote')}</p>`:''}
    <div class="ip-list">${rows}</div>`;
  $$('#issuePanel .ip-row').forEach(b=>b.onclick=()=>openPdf(byId(b.dataset.art)));
}
$('#sortBtn').onclick=()=>{archSort=archSort==='year'?'count':'year';renderArchive()};

/* ═════════════════ ПОДПИСКА / ПОДАЧА ═════════════════ */
$('#newsForm').addEventListener('submit',e=>{
  e.preventDefault();
  const v=$('#newsEmail').value.trim();
  if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v)){toast(t('t.email'),'warn');return}
  toast(t('t.subscriptionUnavailable'),'warn');
});
$$('#chanRow .chan').forEach(b=>b.onclick=()=>{
  if(b.dataset.ch!=='email'){toast(t('t.channelUnavailable'),'warn');return}
});
const drop=$('#drop'),fileInput=$('#fileInput');
drop.onclick=()=>fileInput.click();
drop.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();fileInput.click()}});
['dragover','dragenter'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.add('over')}));
['dragleave','drop'].forEach(ev=>drop.addEventListener(ev,e=>{e.preventDefault();drop.classList.remove('over')}));
drop.addEventListener('drop',e=>{const f=e.dataTransfer.files[0];if(f)handleFile(f)});
fileInput.onchange=()=>{if(fileInput.files[0])handleFile(fileInput.files[0]);fileInput.value=''};
function handleFile(f){
  if(!/\.(pdf|docx?|tex)$/i.test(f.name)){toast(t('sub.badFile'),'warn');return}
  if(f.size>10*1048576){toast(t('sub.bigFile'),'warn');return}
  $('#upName').textContent=f.name+' · '+(f.size/1048576).toFixed(2)+' MB';
  $('#upl').classList.add('show');$('#upId').textContent='';
  $('#upFill').style.width='0%';
  $('#upStat').textContent=t('sub.localOnly');
  toast(t('sub.localOnly'),'warn');
}
$('#goForm').onclick=()=>toast(t('t.sent'));
function download(href,name,msgKey){
  const a=document.createElement('a');a.href=href;a.download=name;document.body.appendChild(a);a.click();a.remove();toast(t(msgKey));
}
$('#dlDoc').onclick=()=>download('files/template.docx','gdn-template.docx','t.doc');
$('#dlTex').onclick=()=>download('files/template.tex','gdn-template.tex','t.tex');
$('#dlEthics').onclick=()=>toast(t('t.ethics'));
$('#retractLink').onclick=e=>{e.preventDefault();toast(t('t.retract'))};

/* ═════════════════ PDF-ПРЕВЬЮ ═════════════════ */
let pdfArt=null,lastFocus=null;
function canEmbedPdf(){
  return matchMedia('(min-width:900px) and (hover:hover)').matches&&navigator.pdfViewerEnabled!==false;
}
function openPdf(a,refresh=false){
  pdfArt=a;if(!refresh)lastFocus=document.activeElement;
  const i=isoIssue(a);
  $('#pdfBody').innerHTML=`
    <div class="p-kick">${i.collection?`${t('no')} ${i.n}`:`${JOURNAL[LANG].toUpperCase()} · ${t('vol').toUpperCase()} ${i.vol} · ${t('no')} ${i.n}`} · ${i.y} · ${pagesLabel(a).toUpperCase()}</div>
    <h3>${artTitle(a)}</h3>
    <div class="pdf-authors">${authorsStr(a)}</div>
    <div class="pdf-meta"><span class="tag" style="--c:${topicCol(a.topic)}">${TOPICS[a.topic][LANG]}</span><span>${t('pdf.src')}: ${srcLine(a)}</span></div>
    <div class="pdf-abs">${artAbs(a)}</div>
    <div class="pdf-kw"><b>${t('issue.kw')}:</b> ${artKw(a)}</div>
    ${canEmbedPdf()
      ?`<embed class="pdf-embed" src="${a.pdf}#view=FitH" type="application/pdf">`
      :`<a class="pdf-first" href="${a.pdf}" target="_blank" rel="noopener"><img src="${a.img}" alt="${t('pdf.p1')}"><span class="chip">${t('pdf.open')}</span></a>`}
  `;
  $('#pdfDoi').textContent=idLabel(a);
  $('#pdfCopyDoi').innerHTML=`<svg><use href="#i-copy"/></svg>${a.doi?'DOI':a.edn?'EDN':'PDF'}`;
  $('#pdfOpen').href=a.pdf;
  $('#pdfDl').href=a.pdf;$('#pdfDl').setAttribute('download','');
  $('#pdfPanel').scrollTop=0;$('#pdfBody').scrollTop=0;
  $('#pdfOverlay').classList.add('show');
  document.body.style.overflow='hidden';
  if(!refresh)$('#pdfClose').focus();
}
$('#pdfClose').onclick=closePdf;
$('#pdfOverlay').addEventListener('click',e=>{if(e.target.id==='pdfOverlay')closePdf()});
function closePdf(){
  if(!$('#pdfOverlay').classList.contains('show'))return;
  $('#pdfOverlay').classList.remove('show');$('#pdfBody').innerHTML='';
  if(!$('#searchOverlay').classList.contains('show'))document.body.style.overflow='';
  if(lastFocus&&lastFocus.focus)try{lastFocus.focus()}catch(_){}
}
$('#pdfCite').onclick=e=>copyWithFeedback(apaCite(pdfArt),e.currentTarget,t('t.cite'));
$('#pdfCopyDoi').onclick=e=>copyWithFeedback(idCopy(pdfArt),e.currentTarget,t('t.doi'));

/* ═════════════════ ПОИСК ═════════════════ */
let searchFocus=null,searchFocusTimer=null;
function openSearch(){
  if(!$('#searchOverlay').classList.contains('show'))searchFocus=document.activeElement;
  $('#searchOverlay').classList.add('show');document.body.style.overflow='hidden';
  const inp=$('#searchInput');inp.value='';renderSearch('');
  clearTimeout(searchFocusTimer);searchFocusTimer=setTimeout(()=>inp.focus(),80);
}
function closeSearch(){
  if(!$('#searchOverlay').classList.contains('show'))return;
  clearTimeout(searchFocusTimer);
  $('#searchOverlay').classList.remove('show');
  if(!$('#pdfOverlay').classList.contains('show'))document.body.style.overflow='';
  if(searchFocus&&searchFocus.focus)searchFocus.focus();
}
$('#searchBtn').onclick=openSearch;
$('#searchClose').onclick=closeSearch;
$('#searchOverlay').addEventListener('click',e=>{if(e.target.id==='searchOverlay')closeSearch()});
$('#searchInput').addEventListener('input',e=>renderSearch(e.target.value.trim().toLowerCase()));
function renderSearch(q){
  if(!q){$('#searchResults').innerHTML=`<div class="sr-empty">${t('srch.hint')}</div>`;return}
  const hay=a=>[a.ru.t,a.en.t,a.authors.join(' '),a.authors.map(translit).join(' '),a.ru.k.join(' '),a.en.k.join(' '),a.pdf,a.file||'',String(isoIssue(a).y),a.doi?'doi '+a.doi:'',a.edn?'edn '+a.edn:'',TOPICS[a.topic].ru,TOPICS[a.topic].en].join(' ').toLowerCase();
  const res=ARTICLES.filter(a=>hay(a).includes(q)).slice(0,8);
  $('#searchResults').innerHTML=res.length?res.map(a=>`
    <button class="sr-item" data-art="${a.id}" data-cursor="read">
      ${thumb(a)}
      <span class="sr-txt"><span class="meta"><span>${TOPICS[a.topic][LANG]}</span><span>${issueLabel(a)}</span>${a.cites!=null?`<span>▲ ${a.cites}</span>`:''}</span>
      <h5>${artTitle(a)}</h5><p>${authorsStr(a)} · ${idLabel(a)}</p></span>
    </button>`).join(''):`<div class="sr-empty">${t('srch.none')}</div>`;
  $$('#searchResults [data-art]').forEach(b=>b.onclick=()=>{
    closeSearch();
    const a=byId(b.dataset.art);
    if(a.issue==='2025-01'){
      document.getElementById('issue').scrollIntoView({behavior:'smooth'});
      setTimeout(()=>{
        const row=$('#row-'+a.id);
        if(row){row.classList.add('open','flash');row.querySelector('.toc-btn').setAttribute('aria-expanded','true');setTimeout(()=>row.classList.remove('flash'),1700);row.scrollIntoView({behavior:'smooth',block:'center'})}
      },650);
    }else openPdf(a);
  });
}

/* ═════════════════ ПОМОЩЬ / МЕНЮ ═════════════════ */
$('#footHelp').onclick=e=>{e.preventDefault();$('#helpOverlay').classList.add('show')};
$('#helpClose').onclick=()=>$('#helpOverlay').classList.remove('show');
$('#helpOverlay').addEventListener('click',e=>{if(e.target.id==='helpOverlay')e.target.classList.remove('show')});
const menuBtn=$('#menuBtn'),mnav=$('#mobileNav');
function setMenu(on){mnav.classList.toggle('show',on);menuBtn.setAttribute('aria-expanded',on);menuBtn.classList.toggle('on',on)}
menuBtn.onclick=()=>setMenu(!mnav.classList.contains('show'));
mnav.addEventListener('click',e=>{if(e.target.closest('a'))setMenu(false)});

/* ═════════════════ ДЕКОД-ЭФФЕКТ ═════════════════ */
function decodeText(el){
  const final=el.textContent;
  if(RM)return;
  const glyphs='ГДНВПРЖДЛФQM10#▮/×+';
  let frame=0;const total=final.length+12;
  el.style.minHeight=el.offsetHeight+'px';
  const iv=setInterval(()=>{
    frame++;
    const solved=Math.floor(frame*final.length/total);
    let out='';
    for(let i=0;i<final.length;i++)
      out+=i<solved?final[i]:final[i]===' '?' ':glyphs[Math.random()*glyphs.length|0];
    el.textContent=out;
    if(frame>=total){clearInterval(iv);el.textContent=el.dataset.i18n?t(el.dataset.i18n):final}
  },30);
}
const decIO=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){decodeText(e.target);decIO.unobserve(e.target)}
}),{threshold:.8});
function bindDecode(){$$('[data-decode]').forEach(el=>decIO.observe(el))}
const revIO=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add('in');revIO.unobserve(e.target)}
}),{threshold:.08});

/* ═════════════════ КУРСОР ═════════════════ */
const cd=$('#cur-dot'),cr=$('#cur-ring'),cl=$('#cur-label');
let mx=0,my=0,rx=0,ry=0;
addEventListener('mousemove',e=>{
  mx=e.clientX;my=e.clientY;
  mouse.x=e.clientX;mouse.y=e.clientY;
  cd.style.transform=`translate(${mx}px,${my}px) translate(-50%,-50%)`;
});
document.addEventListener('mouseover',e=>{
  const lab=e.target.closest('[data-cursor]');
  const inter=e.target.closest('a,button,input,label,.spine,.step');
  const txt=lab&&I18N[LANG]['cur.'+lab.dataset.cursor];
  if(txt){cl.textContent=txt;cl.classList.add('show')}
  else cl.classList.remove('show');
  cr.classList.toggle('active',!!(lab||inter));
});
document.addEventListener('mouseleave',()=>cl.classList.remove('show'));

/* ═════════════════ МАГНИТНЫЕ КНОПКИ ═════════════════ */
function magnet(el){
  el.addEventListener('mousemove',e=>{
    if(RM)return;
    const r=el.getBoundingClientRect();
    el.style.transform=`translate(${(e.clientX-r.left-r.width/2)*.16}px,${(e.clientY-r.top-r.height/2)*.22}px)`;
  });
  el.addEventListener('mouseleave',()=>el.style.transform='');
}
$$('.magnet').forEach(magnet);

/* ═════════════════ ТЕМА / ЯЗЫК / ЗВУК ═════════════════ */
$('#themeBtn').onclick=()=>{
  const r=document.documentElement;
  r.dataset.theme=r.dataset.theme==='dark'?'light':'dark';
  $('#themeBtn').innerHTML=`<svg><use href="#${r.dataset.theme==='dark'?'i-sun':'i-moon'}"/></svg>`;
  dropCssCache();
  const mc=document.querySelector('meta[name="theme-color"]');if(mc)mc.content=r.dataset.theme==='dark'?'#0A1128':'#EDF0F7';
  renderSide();renderToC();renderFeatured();renderBoard();renderArchive();
  setTimeout(redrawSparks,350);
  toast(t('t.theme'));
};
function renderAll(){
  applyI18n();
  renderTicker();renderToC();renderSide();renderFeatured();renderBoard();renderSteps();renderChecklist();renderArchive();
}
function setLang(l){
  LANG=l;
  renderAll();
  if($('#pdfOverlay').classList.contains('show'))openPdf(pdfArt,true);
  if($('#searchOverlay').classList.contains('show'))renderSearch($('#searchInput').value.trim().toLowerCase());
  if($('#upl').classList.contains('show'))$('#upStat').textContent=t('sub.localOnly');
  document.fonts.ready.then(buildTargets);
  toast(t('t.lang'));
}
$('#langBtn').onclick=()=>setLang(LANG==='ru'?'en':'ru');
/* ambient-пад */
let AC=null,padGain=null,soundOn=false;
$('#soundBtn').onclick=()=>{
  soundOn=!soundOn;
  $('#soundBtn').classList.toggle('on',soundOn);
  $('#sndIco').innerHTML=`<use href="#${soundOn?'i-snd':'i-snd-off'}"/>`;
  if(soundOn){
    if(!AC){
      AC=new (window.AudioContext||window.webkitAudioContext)();
      padGain=AC.createGain();padGain.gain.value=0;
      const filt=AC.createBiquadFilter();filt.type='lowpass';filt.frequency.value=420;
      padGain.connect(filt);filt.connect(AC.destination);
      [110,164.8,220.5,329.6].forEach((f,i)=>{
        const o=AC.createOscillator();o.type='sine';o.frequency.value=f*(1+(i%2?-0.0012:0.0012));
        const g=AC.createGain();g.gain.value=.22/(i+1);
        const lfo=AC.createOscillator();lfo.frequency.value=.06+i*.03;
        const lg=AC.createGain();lg.gain.value=.08;
        lfo.connect(lg);lg.connect(g.gain);lfo.start();
        o.connect(g);g.connect(padGain);o.start();
      });
    }
    AC.resume();
    padGain.gain.cancelScheduledValues(AC.currentTime);
    padGain.gain.linearRampToValueAtTime(.05,AC.currentTime+2.2);
    toast(t('t.soundOn'));
  }else if(AC){
    padGain.gain.linearRampToValueAtTime(0,AC.currentTime+1);
    toast(t('t.soundOff'));
  }
};

/* ═════════════════ КЛАВИАТУРА (по физическим клавишам: работает и в RU-раскладке) ═════════════════ */
let gPending=false,gTimer=null;
addEventListener('keydown',e=>{
  const inField=/input|textarea|select/i.test(e.target.tagName);
  if(e.key==='Escape'){closeSearch();closePdf();setMenu(false);$$('.overlay.show').forEach(o=>o.classList.remove('show'));return}
  if(inField||e.ctrlKey||e.metaKey||e.altKey)return;
  const c=e.code;
  if(c==='Slash'&&!e.shiftKey){e.preventDefault();openSearch();return}
  if(c==='Slash'&&e.shiftKey||e.key==='?'){$('#helpOverlay').classList.toggle('show');return}
  if(c==='KeyT'){$('#themeBtn').click();return}
  if(c==='KeyL'){$('#langBtn').click();return}
  if(gPending){
    const map={KeyI:'#issue',KeyS:'#submit',KeyM:'#metrics',KeyA:'#areas'};
    if(map[c]){document.querySelector(map[c]).scrollIntoView({behavior:'smooth'});gPending=false;clearTimeout(gTimer)}
    return;
  }
  if(c==='KeyG'){gPending=true;clearTimeout(gTimer);gTimer=setTimeout(()=>gPending=false,900)}
});

/* ═════════════════ ЧАСЫ / СКРОЛЛ / ЦИКЛ ═════════════════ */
setInterval(()=>{
  $('#heroClock').textContent='MSK '+new Date().toLocaleTimeString('ru-RU',{timeZone:'Europe/Moscow'});
},1000);
addEventListener('scroll',()=>{
  const sc=scrollY;
  heroScroll=sc;
  const h=document.documentElement;
  $('#progress').style.width=(sc/Math.max(1,h.scrollHeight-innerHeight)*100)+'%';
},{passive:true});
let rzT=null;
function onResize(){
  clearTimeout(rzT);
  rzT=setTimeout(()=>{buildTargets();graphSize();buildGraph();mapSize();redrawSparks()},120);
}
addEventListener('resize',onResize);
new IntersectionObserver(es=>es.forEach(e=>heroOn=e.isIntersecting)).observe(hero);
let graphVisible=false,mapVisible=false;
new IntersectionObserver(es=>es.forEach(e=>graphVisible=e.isIntersecting)).observe(gcv);
new IntersectionObserver(es=>es.forEach(e=>mapVisible=e.isIntersecting)).observe(mcv);
new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting)startMetrics()}),{threshold:.2}).observe($('#metricsGrid'));
/* подсветка текущего раздела в меню */
const navMap={};$$('.nav-links a, #mobileNav a').forEach(a=>{(navMap[a.getAttribute('href')]??=[]).push(a)});
const secIO=new IntersectionObserver(es=>es.forEach(e=>{
  if(e.isIntersecting){
    $$('.nav-links a, #mobileNav a').forEach(a=>a.classList.remove('cur'));
    (navMap['#'+e.target.id]||[]).forEach(a=>a.classList.add('cur'));
  }
}),{rootMargin:'-45% 0px -50% 0px'});
$$('main section').forEach(s=>secIO.observe(s));
function loop(time){
  if(heroOn){drawHero(time);drawHud()}
  if(graphVisible)drawGraph(time);
  if(mapVisible)drawMap(time);
  rx+=(mx-rx)*.16;ry+=(my-ry)*.16;
  cr.style.transform=`translate(${rx}px,${ry}px) translate(-50%,-50%)`;
  cl.style.transform=`translate(${rx}px,${ry}px)`;
  requestAnimationFrame(loop);
}

/* ═════════════════ ИНИЦИАЛИЗАЦИЯ ═════════════════ */
heroSize();graphSize();mapSize();buildGraph();
renderAll();
Promise.all([document.fonts.load('800 100px Manrope'),document.fonts.ready]).catch(()=>{}).then(()=>{buildTargets();graphSize();buildGraph()});
bindDecode();
$$('.reveal').forEach(el=>revIO.observe(el));
requestAnimationFrame(loop);
setInterval(()=>{
  const oc=$('#onlineCount'),ho=$('#heroOnline');
  if(oc&&ho)ho.textContent=oc.textContent;
},2400);
