/* GitStory 샘플 앱 화면 로직. mockups/gitstory-prototype.html의 스크립트를 옮기고,
   세계관 상태를 브라우저(localStorage)에 저장하도록 했다. */
import DATA_ARCANE from "@/data/arcane.json";
import DATA_HP from "@/data/harry-potter.json";
import DATA_JG from "@/data/janggu.json";

let started = false;

export function start() {
if (started) return;
started = true;
/* 예시 데이터: design/arcane-example.json 그대로 */



let DATA, POS, SAMPLE, W;

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const clone = o => o === undefined ? undefined : JSON.parse(JSON.stringify(o));
const icon = id => `<svg class="oct"><use href="#i-${id}"/></svg>`;
const clamp = (v,a,b) => Math.max(a, Math.min(b, v));
const f2 = v => v.toFixed(2);
const sf2 = v => (v > 0 ? '+' : v < 0 ? '−' : '') + Math.abs(v).toFixed(2);

const KIND = {nation:'국가', organization:'조직', faction:'세력', solo:'1인 집단'};
const REL = {
  hostile:{l:'대립', c:'var(--danger)'}, rival:{l:'경쟁', c:'var(--severe)'},
  coexist:{l:'공존', c:'var(--accent)', dash:'7 5'}, alliance:{l:'동맹', c:'var(--accent)'},
  dominate:{l:'지배', c:'var(--done)'}, family:{l:'가족', c:'var(--sponsor)'}, personal:{l:'개인 관계', c:'var(--fg-muted)'}
};
const SRC = {direct:['직접','Label--danger'], propagated:['전파','Label--done'], manual:['수동','Label--accent']};
const COMMIT_KIND = {init:'초기 설정', event:'사건', manual:'수동 수정'};
const TAGS = ['위협','분노','상실','권력공백','보복위협','탄압','기회','이익','동원','정체성'];

/* 성격이 영향(tags)에 얼마나 반응하는지(relevance). 실제 앱에서는 AI가 판단하는 값. */
const RELEVANCE = {"expansionism": {"기회": 0.6, "권력공백": 0.5}, "militarism": {"위협": 0.3, "동원": 0.4}, "covet_hextech": {"기회": 0.5}, "vendetta": {"분노": 0.6, "위협": 0.4}, "protect_family": {"위협": 0.6, "상실": 0.6}, "pragmatism": {"기회": 0.4, "분노": -0.3}, "diplomacy": {"분노": -0.4, "탄압": 0.3}, "peace": {"위협": 0.5, "탄압": 0.5}, "secrecy": {"위협": -0.4}, "manipulation": {"권력공백": 0.5, "기회": 0.5}, "justice": {"위협": 0.6, "분노": 0.6, "탄압": 0.3, "동원": 0.3}, "principled": {"위협": 0.3, "분노": 0.3, "동원": 0.3}, "responsibility": {"위협": 0.5, "상실": 0.5}, "idealism": {"탄압": 0.4, "상실": 0.2}, "progress": {"기회": 0.3, "위협": -0.2}, "protective": {"보복위협": 0.7, "탄압": 0.7, "위협": 0.5, "상실": 0.4}, "impulsive": {"보복위협": 0.3, "탄압": 0.3, "분노": 0.4}, "distrust_pilt": {"탄압": 0.5, "동원": -0.6}, "community": {"보복위협": 0.6, "탄압": 0.6, "위협": 0.4}, "science_obsession": {"보복위협": -0.4, "위협": -0.4, "탄압": -0.3, "기회": 0.2}, "utilitarian": {"보복위협": 0.2, "탄압": 0.2}, "instability": {"상실": 0.6, "권력공백": 0.4, "위협": 0.3}, "need_approval": {"상실": 0.5}, "survival": {"위협": 0.5, "탄압": 0.5, "보복위협": 0.5}, "individualism": {"위협": -0.2}, "resentment": {"탄압": 0.6}, "order": {"동원": 0.3, "탄압": -0.3}, "hardline": {"동원": 0.4}, "totalitarian": {"권력공백": 0.6}, "independence": {"탄압": 0.5}, "profit": {"기회": 0.5, "이익": 0.6}, "opportunism": {"기회": 0.6, "권력공백": 0.4}, "obsession": {"위협": -0.5, "탄압": -0.5, "보복위협": -0.5, "상실": -0.5}, "amorality": {"위협": -0.2, "탄압": -0.2}, "conservatism": {"위협": 0.3}, "consensus": {"위협": 0.2}, "classism": {"분노": 0.3}, "contempt": {"분노": 0.4}, "courage": {"위협": 0.5, "상실": 0.3, "탄압": 0.5}, "recklessness": {"분노": 0.4, "위협": 0.3}, "ambition": {"기회": 0.6, "권력공백": 0.4, "위협": -0.2}, "pureblood": {"탄압": -0.6, "기회": 0.4}, "cunning": {"위협": -0.3, "기회": 0.4}, "bureaucracy": {"위협": -0.2, "권력공백": 0.3}, "image": {"위협": 0.4, "분노": 0.3}, "denial": {"위협": -0.5}, "duty": {"위협": 0.5, "탄압": 0.4, "동원": 0.4}, "solidarity": {"상실": 0.7, "위협": 0.4}, "anti_dark": {"위협": 0.5, "탄압": 0.5, "상실": 0.3}, "protection": {"위협": 0.6, "상실": 0.4}, "tradition": {"상실": 0.3}, "fear_rule": {"기회": 0.3, "위협": 0.3}, "self_preservation": {"위협": 0.6, "상실": 0.4, "기회": 0.3}, "status_seeking": {"기회": 0.5, "상실": 0.4}, "loyalty_friends": {"상실": 0.6, "위협": 0.5}, "insecurity": {"위협": 0.4, "상실": 0.3}, "intellect": {"위협": -0.2}, "humor": {"상실": -0.2}, "wisdom": {"위협": -0.3}, "strategy": {"위협": -0.2}, "double_agent": {"상실": 0.3, "정체성": 0.6}, "love_lily": {"위협": 0.3}, "fanatic": {"기회": 0.7}, "fear_of_death": {"위협": 0.5}, "cruelty": {"탄압": -0.5}, "pride": {"상실": 0.3, "위협": 0.3}, "fear": {"위협": 0.8, "상실": 0.5}, "family_first": {"위협": 0.7, "상실": 0.6}, "toughness": {"위협": 0.3, "동원": 0.4}, "authoritarian": {"탄압": -0.5, "기회": 0.5, "권력공백": -0.8}, "anti_halfbreed": {"탄압": -0.6}, "hate_voldemort": {"위협": 0.4, "분노": 0.5, "상실": 0.3}, "mischief": {"위협": -0.5, "상실": -0.4, "분노": -0.3}, "shameless": {"분노": -0.5, "상실": -0.3}, "love_pretty": {"기회": 0.3}, "family_love": {"상실": 0.6, "위협": 0.6}, "salaryman_fatigue": {"상실": 0.4, "위협": 0.3}, "pushover": {"분노": -0.2, "위협": 0.3}, "strictness": {"분노": 0.4, "상실": 0.2}, "thrift": {"상실": 0.7, "기회": 0.3}, "temper": {"분노": 0.7, "상실": 0.3}, "greed_shiny": {"기회": 0.4, "상실": -0.3}, "loyalty": {"상실": 0.3, "위협": 0.3}, "patience": {"위협": -0.3, "분노": -0.4}, "elitism": {"상실": 0.6, "분노": 0.4, "기회": 0.3}, "diligence": {"상실": 0.3, "기회": 0.2}, "bossiness": {"분노": 0.5, "상실": 0.3}, "timidity": {"위협": 0.8, "분노": 0.3}, "kindness": {"상실": 0.4, "위협": 0.3}, "calm": {"위협": -0.6, "분노": -0.6, "상실": -0.5}, "dedication": {"상실": 0.4, "분노": 0.2}, "rivalry_rose": {"분노": 0.7, "상실": 0.6, "기회": 0.4}, "rivalry_sunflower": {"분노": 0.7, "상실": 0.6, "기회": 0.4}, "marriage_anxiety": {"상실": 0.3}, "misunderstood": {"위협": 0.2}, "chaos": {"위협": -0.2}, "imagination": {"위협": -0.2, "기회": 0.3}, "leadership_dispute": {"분노": 0.3}, "overwork": {"위협": 0.3}, "house_play": {"상실": 0.2}};

/* ---------- 상태 ---------- */
let state, commits;
let pending = [];      // 커밋 전 수동 수정 patches
let analysis = null;   // 사건 분석 중인 내용
const ui = {sel:'chr_vi', graphVer:'work', relFilter:'all', showMembers:true, overlay:true, cmpA:null, cmpB:null, confirm:null, open:{}};

const head = () => commits.at(-1);
function all(s){ return [...s.groups, ...s.characters, ...s.background]; }
function ent(s,id){ return all(s).find(x=>x.id===id); }
function nm(s,id){ const e=ent(s,id)||ent(state,id); return e ? (e.name||e.title) : id; }
function coll(id){ return id.startsWith('grp_')?'groups':id.startsWith('chr_')?'characters':id.startsWith('rel_')?'relations':'background'; }
function rootNation(s,gid){ let g=s.groups.find(x=>x.id===gid); let n=0; while(g && g.parent && n++<10) g=s.groups.find(x=>x.id===g.parent); return g?g.id:null; }
function nationOf(s,e){
  if(!e) return null;
  if(e.id.startsWith('grp_')) return rootNation(s,e.id);
  let best=null, b=-1;
  (e.memberships||[]).forEach(m=>{ const n=rootNation(s,m.group); if(n && m.bond>b){ b=m.bond; best=n; } });
  return best;
}
function nationColor(n){ const z=W.zones.find(z=>z.id===n); return z?`var(${z.c})`:'var(--fg-muted)'; }
function statusCls(st){ return st==='사망'?'Label--danger':/위기|마비|비상|충격|불안정|공백|도주|진압|교전|부상|축소|저항|쇠약|수감|수배|장악|숙청|상실|폐교|동요/.test(st||'')?'Label--attention':''; }
function fmtDate(s){ if(!s) return '방금 전'; const d=new Date(s); return `${d.getMonth()+1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function newSha(){ return Array.from({length:7},()=>'0123456789abcdef'[Math.random()*16|0]).join(''); }
function toast(t){ const el=$('#toast'); el.textContent=t; el.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>el.hidden=true,2600); }

/* ---------- patch (id로 가리키는 경로) ---------- */
function walk(s,path){
  const segs=path.split('/').slice(1); let cur=s;
  for(let i=0;i<segs.length;i++){
    const seg=segs[i], last=i===segs.length-1;
    if(Array.isArray(cur)){
      if(seg==='-') return {arr:cur, append:true};
      const idx=cur.findIndex(x=>x && (x.id===seg || x.key===seg || x.group===seg));
      if(last) return {arr:cur, idx};
      if(idx<0) return null; cur=cur[idx];
    } else {
      if(last) return {obj:cur, key:seg};
      if(cur[seg]==null) return null; cur=cur[seg];
    }
  }
  return null;
}
function getv(s,path){ const r=walk(s,path); if(!r) return undefined; if(r.obj) return r.obj[r.key]; if(r.arr && r.idx>-1) return r.arr[r.idx]; }
function applyPatch(s,p,back){
  const r=walk(s,p.path); if(!r) return;
  if(p.op==='replace'){ if(r.obj) r.obj[r.key]=clone(back?p.before:p.after); return; }
  const insert = (p.op==='add') !== !!back;
  if(insert){ r.arr.push(clone(p.op==='add'?p.after:p.before)); }
  else if(r.append) r.arr.pop(); else if(r.idx>-1) r.arr.splice(r.idx,1);
}
function stateAt(idx, withPending=false){
  const s=clone(state);
  if(!withPending) pending.slice().reverse().forEach(p=>applyPatch(s,p,true));
  for(let k=commits.length-1;k>idx;k--) commits[k].patches.slice().reverse().forEach(p=>applyPatch(s,p,true));
  const keep=new Set(commits.slice(0,idx+1).map(c=>c.id));
  [...s.groups,...s.characters].forEach(e=>{ if(e.situation) e.situation.history=e.situation.history.filter(h=>keep.has(h.commit)); });
  s.background=s.background.filter(b=>!b.introduced_in||keep.has(b.introduced_in));
  return s;
}
function describePath(s,path){
  const seg=path.split('/').slice(1); const [c,id]=seg; const rest=seg.slice(2).join('/');
  if(c==='relations'){ const r=ent2rel(s,id); const who=r?`${nm(s,r.from)} ↔ ${nm(s,r.to)} ${REL[r.type]?.l||''}`:id; return rest?`관계 ${who} · ${rest==='intensity'?'강도':rest==='note'?'메모':rest==='type'?'유형':rest}`:`관계 ${who}`; }
  const n=nm(s,id);
  if(c==='background') return `배경 '${n}'${rest==='content'?' 내용':''}`;
  if(rest==='situation/status') return `${n} · 상황 태그`;
  if(rest==='situation/current') return `${n} · 현재 상황`;
  if(rest==='situation/history/-') return `${n} · 상황 이력`;
  if(rest==='parent_bond') return `${n} · 상위 단체 결속도`;
  let m=rest.match(/^traits\/([^/]+)\/value$/); if(m){ const e=ent(s,id)||ent(state,id); const t=e?.traits?.find(t=>t.key===m[1]); return `${n} · 성격 '${t?.label||m[1]}'`; }
  m=rest.match(/^memberships\/([^/]+)\/bond$/); if(m) return `${n} · '${nm(s,m[1])}' 결속도`;
  m=rest.match(/^memberships\/([^/]+)\/active$/); if(m) return `${n} · '${nm(s,m[1])}' 소속 활성`;
  return `${n} · ${rest}`;
}
function ent2rel(s,id){ return s.relations.find(r=>r.id===id) || state.relations.find(r=>r.id===id); }
function showVal(v){ if(v==null) return '(없음)'; if(typeof v==='number') return f2(v); if(typeof v==='boolean') return v?'예':'아니오'; if(typeof v==='object') return v.type&&REL[v.type] ? `${REL[v.type].l} ${f2(v.intensity)}${v.note?' · '+v.note:''}` : (v.summary || v.title || '항목'); return v; }
function patchLines(s,p){
  const label=(p.op!=='replace' && p.path.startsWith('/relations/') && (p.after||p.before)?.from) ? `관계 ${nm(s,(p.after||p.before).from)} ↔ ${nm(s,(p.after||p.before).to)}` : describePath(s,p.path);
  if(p.op==='replace') return [['chg',`~ ${label}: ${showVal(p.before)} → ${showVal(p.after)}`]];
  if(p.op==='add') return [['add',`+ ${label}: ${showVal(p.after)}`]];
  return [['del',`- ${label}: ${showVal(p.before)}`]];
}

/* 수동 수정 → pending */
function setManual(path, value){
  const cur=getv(state,path); if(cur===value) return;
  let p=pending.find(x=>x.path===path && x.op==='replace');
  if(!p){ p={op:'replace', path, before:clone(cur), after:value}; pending.push(p); } else p.after=value;
  const r=walk(state,path); r.obj[r.key]=value;
  if(JSON.stringify(p.before)===JSON.stringify(p.after)) pending=pending.filter(x=>x!==p);
}

/* ---------- 영향 전파 (앱 코드가 계산) ---------- */
function sensitivity(e, tags){
  const parts=[];
  (e.traits||[]).forEach(t=>{
    const tbl=RELEVANCE[t.key]; if(!tbl) return;
    let rel=0; tags.forEach(g=>{ const v=tbl[g]; if(v!==undefined && Math.abs(v)>Math.abs(rel)) rel=v; });
    if(rel) parts.push({label:t.label, value:t.value, rel});
  });
  const S=clamp(1+parts.reduce((a,p)=>a+p.value*p.rel,0), -1, 2);
  return {S, parts};
}
function depth(s,g){ let d=0, x=g; while(x?.parent && d<10){ x=s.groups.find(y=>y.id===x.parent); d++; } return d; }
function propagate(s, direct){
  const dmap={}; direct.forEach(d=>dmap[d.target]=d);
  const gM={}; const rows=[];
  s.groups.slice().sort((a,b)=>depth(s,a)-depth(s,b)).forEach(g=>{
    const par=g.parent && gM[g.parent];
    if(par){
      const {S,parts}=sensitivity(g, par.tags); const bond=g.parent_bond ?? 0.6;
      const w=clamp(par.M*bond*S,-1,1);
      rows.push({target:g.id, via:g.parent, M:par.M, bond, S, parts, w, tags:par.tags});
      if(!dmap[g.id] && Math.abs(w)>=0.25) gM[g.id]={M:w, tags:par.tags};
    }
    if(dmap[g.id]) gM[g.id]={M:dmap[g.id].M, tags:dmap[g.id].tags};
  });
  s.characters.forEach(c=>{
    (c.memberships||[]).forEach(m=>{
      if(m.active===false) return; const src=gM[m.group]; if(!src) return;
      const {S,parts}=sensitivity(c, src.tags);
      rows.push({target:c.id, via:m.group, M:src.M, bond:m.bond, S, parts, w:clamp(src.M*m.bond*S,-1,1), tags:src.tags});
    });
  });
  const best={};
  rows.forEach(r=>{ if(!best[r.target] || Math.abs(r.w)>Math.abs(best[r.target].w)) best[r.target]=r; });
  rows.forEach(r=>{ r.rep = best[r.target]===r && !(dmap[r.target] && r.target.startsWith('grp_')); });
  return rows;
}
function level(w){ const a=Math.abs(w); return a<0.25?['변화 없음','']:a<0.6?['경미','Label--attention']:['큰 변화','Label--danger']; }
function wbar(w){ const pct=Math.abs(w)*50; return `<div class="wbar" title="${sf2(w)}"><i style="${w<0?`right:50%;width:${pct}%;background:var(--danger)`:`left:50%;width:${pct}%;background:var(--success)`}"></i></div>`; }

/* ---------- 탭 ---------- */
$$('[role=tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
function showTab(t){
  $$('[role=tab]').forEach(b=>b.setAttribute('aria-selected', b.dataset.tab===t));
  ['world','event','graph','history'].forEach(x=>$('#tab-'+x).hidden = x!==t);
  render(t); window.scrollTo({top:0});
}
function cur(){ return $('[role=tab][aria-selected=true]').dataset.tab; }
function render(t=cur()){
  $('#world-title').textContent=DATA.meta.title; $('#world-slug').textContent=W.slug; $('#world-desc').textContent=DATA.meta.description;
  $('#cnt-world').textContent=state.groups.length+state.characters.length+state.background.length;
  $('#cnt-rel').textContent=state.relations.length; $('#cnt-commit').textContent=commits.length;
  ({world:renderWorld,event:renderEvent,graph:renderGraph,history:renderHistory})[t]();
  saveWorld();
}

function pendingBanner(){
  if(!pending.length) return '';
  return `<div class="flash flash-warn" style="margin-bottom:16px">${icon('alert')}
    <div style="flex:1;min-width:0"><b>커밋하지 않은 수동 수정 ${pending.length}개</b>
      <div style="display:flex;flex-direction:column;gap:2px;margin:6px 0">${pending.flatMap(p=>patchLines(state,p)).map(([c,l])=>`<span class="diffline ${c}">${esc(l)}</span>`).join('')}</div>
      <div style="display:flex;gap:8px;flex-wrap:wrap">
        <input class="form-control" id="pend-msg" style="flex:1 1 220px;width:auto" value="수동 수정: 세계관 값 조정" aria-label="커밋 메시지">
        <button class="btn btn-primary" id="pend-commit">${icon('commit')}수동 수정 커밋</button>
        <button class="btn" id="pend-discard">버리기</button>
      </div></div></div>`;
}
function wirePending(){
  const c=$('#pend-commit'); if(!c) return;
  c.onclick=()=>{
    const id=newSha();
    pending.forEach(p=>{ const m=p.path.match(/^\/(groups|characters)\/([^/]+)\//); if(m){ const hp={op:'add', path:`/${m[1]}/${m[2]}/situation/history/-`, after:{commit:id, summary:describePath(state,p.path).split(' · ')[1]+' 수정', source:'manual'}}; applyPatch(state,hp); p.__h=hp; } });
    const patches=pending.flatMap(p=>p.__h?[{op:p.op,path:p.path,before:p.before,after:p.after}, p.__h]:[{op:p.op,path:p.path,before:p.before,after:p.after}]);
    commits.push({id, parent:head().id, kind:'manual', message:$('#pend-msg').value.trim()||'수동 수정', created_at:new Date().toISOString(), impacts:[], patches});
    pending=[]; toast(`커밋 ${id} 생성`); render();
  };
  $('#pend-discard').onclick=()=>{ pending.slice().reverse().forEach(p=>applyPatch(state,p,true)); pending=[]; toast('수동 수정을 버렸습니다'); render(); };
}

/* ---------- 세계관 ---------- */
function treeGroups(s){
  const out=[]; const walkG=(pid,d)=>s.groups.filter(g=>(g.parent||null)===pid).forEach(g=>{ out.push([g,d]); walkG(g.id,d+1); });
  walkG(null,0); return out;
}
function renderWorld(){
  const s=state; const e=ent(s,ui.sel) || s.characters[0]; ui.sel=e.id;
  const cats=[...new Set(s.background.map(b=>b.category))];
  const btn=(id,label,mark,meta,pad=0)=>`<li><button data-id="${id}" aria-current="${id===ui.sel}" style="padding-left:${8+pad*16}px">${mark}${esc(label)}${meta?`<span class="meta">${esc(meta)}</span>`:''}</button></li>`;
  const nav = `<nav class="Box" aria-label="세계관 항목"><ul class="tree">
    <li class="group"><span>인물</span><span>${s.characters.length}</span></li>
    ${s.characters.map(c=>btn(c.id,c.name,`<span class="dot" style="background:${nationColor(nationOf(s,c))}${c.situation?.status==='사망'?';opacity:.4':''}"></span>`, c.situation?.status)).join('')}
    <li class="group"><span>단체</span><span>${s.groups.length}</span></li>
    ${treeGroups(s).map(([g,d])=>btn(g.id,g.name,`<span class="sq" style="background:${nationColor(nationOf(s,g))}"></span>`, KIND[g.kind], d)).join('')}
    <li class="group"><span>배경</span><span>${s.background.length}</span></li>
    ${cats.map(c=>s.background.filter(b=>b.category===c).map(b=>btn(b.id,b.title,`<span class="sq" style="background:var(--border-strong)"></span>`, c)).join('')).join('')}
  </ul></nav>`;
  let body;
  if(e.id.startsWith('bg_')) body=bgDetail(e); else body=entityDetail(e);
  $('#tab-world').innerHTML = pendingBanner() + `<div class="split">${nav}<div class="stack">${body}</div></div>`;
  $$('.tree button').forEach(b=>b.onclick=()=>{ ui.sel=b.dataset.id; renderWorld(); });
  $$('[data-go]').forEach(b=>b.onclick=()=>{ ui.sel=b.dataset.go; renderWorld(); });
  $$('input[data-path]').forEach(r=>{
    r.oninput=()=>{ r.closest('.trait').querySelector('.v').textContent=f2(+r.value); };
    r.onchange=()=>{ setManual(r.dataset.path, Math.round(+r.value*100)/100); renderWorld(); };
  });
  const sv=$('#sit-save'); if(sv) sv.onclick=()=>{
    const base=`/${coll(e.id)}/${e.id}/situation`;
    setManual(base+'/status', $('#sit-status').value.trim()); setManual(base+'/current', $('#sit-current').value.trim());
    toast(pending.length?'수동 수정에 담았습니다':'바뀐 내용이 없습니다'); renderWorld();
  };
  const bs=$('#bg-save'); if(bs) bs.onclick=()=>{ setManual(`/background/${e.id}/content`, $('#bg-content').value.trim()); renderWorld(); };
  const sg=$('#see-graph'); if(sg) sg.onclick=()=>{ ui.graphVer='work'; showTab('graph'); };
  wirePending();
}
function bgDetail(b){
  return `<div class="Subhead"><h2>${esc(b.title)}</h2><span class="Label">배경</span><span class="Label">${esc(b.category)}</span>
    ${b.introduced_in?`<span class="Label Label--done">${icon('commit')}${b.introduced_in}에서 추가</span>`:''}</div>
    <div class="Box"><div class="Box-body stack">
      <div class="form-group"><label for="bg-content">내용</label><textarea class="form-control" id="bg-content" rows="5">${esc(b.content)}</textarea>
      <span class="caption">배경은 소속·성격·상황이 없는 기초 정보입니다. 사건으로 새 배경이 생기면 그 커밋이 기록됩니다.</span></div>
      <div><button class="btn btn-primary" id="bg-save">수정 담기</button></div>
    </div></div>`;
}
function traitRows(e){
  const c=coll(e.id);
  return (e.traits||[]).map(t=>`<div class="trait Box-row" style="display:grid">
    <div class="lab">${esc(t.label)} ${t.target?`<span class="Label">${icon('graph')}${esc(nm(state,t.target))}</span>`:''}<small class="num">${esc(t.key)}</small></div>
    <input type="range" min="0" max="1" step="0.05" value="${t.value}" data-path="/${c}/${e.id}/traits/${t.key}/value" aria-label="${esc(t.label)} 강도">
    <span class="num v" style="text-align:right">${f2(t.value)}</span></div>`).join('');
}
function bondRow(label, sub, path, v, goId, extra=''){
  return `<div class="trait Box-row" style="display:grid">
    <div class="lab"><button class="btn-link" data-go="${goId}">${esc(label)}</button> ${extra}${sub?`<small>${esc(sub)}</small>`:''}</div>
    <input type="range" min="0" max="1" step="0.05" value="${v}" data-path="${path}" aria-label="${esc(label)} 결속도">
    <span class="num v" style="text-align:right">${f2(v)}</span></div>`;
}
function entityDetail(e){
  const s=state, isG=e.id.startsWith('grp_'), c=coll(e.id), sit=e.situation||{history:[]};
  const nat=nationOf(s,e);
  const rels=s.relations.filter(r=>r.from===e.id||r.to===e.id);
  let belong='';
  if(isG){
    const subs=s.groups.filter(g=>g.parent===e.id);
    const members=s.characters.flatMap(ch=>(ch.memberships||[]).filter(m=>m.group===e.id).map(m=>({ch,m})));
    belong = `<div class="Box"><div class="Box-header"><h3>소속</h3><span class="caption right">결속도 = 영향이 전달되는 배율</span></div>
      ${e.parent?bondRow(nm(s,e.parent),'상위 단체',`/groups/${e.id}/parent_bond`,e.parent_bond??0.6,e.parent):'<div class="Box-row caption">최상위 단체입니다.</div>'}</div>
      <div class="Box"><div class="Box-header"><h3>하위 단체 · 구성원</h3><span class="Counter">${subs.length+members.length}</span></div>
      ${subs.map(g=>`<div class="Box-row"><span class="sq" style="background:${nationColor(nat)}"></span><button class="btn-link" data-go="${g.id}">${esc(g.name)}</button><span class="Label">${KIND[g.kind]}</span><span class="num right" style="margin-left:auto">${f2(g.parent_bond??0.6)}</span></div>`).join('')}
      ${members.map(({ch,m})=>`<div class="Box-row"><span class="dot" style="background:${nationColor(nationOf(s,ch))}"></span><button class="btn-link" data-go="${ch.id}">${esc(ch.name)}</button>${m.role?`<span class="caption">${esc(m.role)}</span>`:''}${m.active===false?'<span class="Label">비활성</span>':''}<span class="num" style="margin-left:auto">${f2(m.bond)}</span></div>`).join('') || ''}
      ${!subs.length&&!members.length?'<div class="Box-row caption">아직 없습니다.</div>':''}</div>`;
  } else {
    belong = `<div class="Box"><div class="Box-header"><h3>소속</h3><span class="Counter">${e.memberships.length}</span><span class="caption right">결속도 = 영향이 전달되는 배율</span></div>
      ${e.memberships.map(m=>bondRow(nm(s,m.group), m.role, `/characters/${e.id}/memberships/${m.group}/bond`, m.bond, m.group, m.active===false?'<span class="Label">비활성</span>':'')).join('')}</div>`;
  }
  return `<div class="Subhead"><h2>${esc(e.name)}</h2>
      ${isG?`<span class="Label">${KIND[e.kind]}</span>`:'<span class="Label">인물</span>'}
      ${nat?`<span class="Label" style="color:${nationColor(nat)};border-color:${nationColor(nat)}">${esc(nm(s,nat))}</span>`:''}
      ${e.aliases?.length?`<span class="caption">다른 이름: ${esc(e.aliases.join(', '))}</span>`:''}
      <div class="actions"><button class="btn btn-sm" id="see-graph">${icon('graph')}관계도에서 보기</button></div></div>
    <div class="cols2">
      <div class="stack">
        <div class="Box"><div class="Box-header"><h3>상황</h3>${sit.status?`<span class="Label ${statusCls(sit.status)}">${esc(sit.status)}</span>`:''}</div>
          <div class="Box-body stack">
            <div class="form-group"><label for="sit-current">현재</label><textarea class="form-control" id="sit-current" rows="3">${esc(sit.current)}</textarea></div>
            <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap"><div class="form-group" style="flex:1 1 140px"><label for="sit-status">상황 태그</label><input class="form-control" id="sit-status" value="${esc(sit.status)}"></div>
              <button class="btn" id="sit-save">수정 담기</button></div>
            <div><div style="font-weight:600;margin-bottom:8px">이력 <span class="Counter">${sit.history.length}</span></div>
            ${sit.history.length?`<ul class="log">${sit.history.slice().reverse().map(h=>`<li class="${h.source||''}">
              <div>${esc(h.summary)}</div>
              <div class="meta"><span class="sha">${esc(h.commit)}</span>${h.source?`<span class="Label ${SRC[h.source][1]}">${SRC[h.source][0]}</span>`:''}
              ${h.via?`<span>${esc(nm(s,h.via))} 경유</span>`:''}${h.weight!=null?`<span class="num ${h.weight<0?'neg':'pos'}">w ${sf2(h.weight)}</span>`:''}</div></li>`).join('')}</ul>`:'<span class="caption">아직 이력이 없습니다.</span>'}</div>
          </div></div>
        <div class="Box"><div class="Box-header"><h3>관계</h3><span class="Counter">${rels.length}</span></div>
          ${rels.map(r=>{const o=r.from===e.id?r.to:r.from; const R=REL[r.type]; return `<div class="Box-row"><i style="display:inline-block;width:18px;border-top:2px ${R.dash?'dashed':'solid'} ${R.c}"></i>
            <div style="flex:1;min-width:0"><button class="btn-link" data-go="${o}">${esc(nm(s,o))}</button>${r.note?`<div class="caption">${esc(r.note)}</div>`:''}</div>
            <span class="Label" style="color:${R.c};border-color:${R.c}">${R.l}${r.directed?(r.from===e.id?' →':' ←'):''}</span><span class="num">${f2(r.intensity)}</span></div>`}).join('') || '<div class="Box-row caption">관계가 없습니다.</div>'}
        </div>
      </div>
      <div class="stack">
        <div class="Box"><div class="Box-header"><h3>성격</h3><span class="Counter">${(e.traits||[]).length}</span><span class="caption right">항목 + 강도(0~1)</span></div>${traitRows(e)}</div>
        ${belong}
      </div>
    </div>`;
}

/* ---------- 사건 입력 ---------- */
const SAMPLE_ARCANE = {
  title:'화공남작의 시머 공급망 장악', story_time:'시즌2 초반',
  description:'실코가 죽자 화공남작들이 실코 세력의 시머 공급망을 나눠 갖기 시작한다. 필트오버는 이를 빌미로 집행관을 자운에 투입해 대대적인 진압에 나선다.',
  direct:[
    {target:'grp_zaun', M:-0.75, tags:['탄압','위협'], summary:'집행관의 대대적 진압으로 거리가 봉쇄됨'},
    {target:'grp_silco_faction', M:-0.6, tags:['상실','권력공백'], summary:'시머 공급망을 빼앗기며 세력 축소'},
    {target:'grp_chembarons', M:0.7, tags:['기회','이익'], summary:'실코 세력의 공급망을 나눠 가짐'},
    {target:'grp_enforcers', M:0.4, tags:['동원'], summary:'자운 진압 작전에 투입'}
  ],
  rewrite:{
    chr_vi:['저항','자운을 짓밟는 집행관을 막으려 다시 주먹을 든다. 케이틀린과의 관계가 시험대에 오름.'],
    chr_ekko:['저항','파이어라이트를 이끌고 진압에 맞서 자운 주민들을 숨기고 있다.'],
    chr_jinx:['도주중','실코의 유산이 남의 손에 넘어가는 것을 지켜보며 더 불안정해짐.'],
    grp_firelights:['교전','집행관 진압에 맞서 무장 저항으로 전환.'],
    grp_zaun:['진압중','집행관의 대대적 진압으로 거리가 봉쇄됨.'],
    grp_silco_faction:['축소','시머 공급망을 화공남작에게 빼앗기며 세력이 쪼그라듦.'],
    grp_chembarons:['확장','실코 세력의 공급망을 나눠 가지며 자운의 새 실력자로 부상.']
  },
  relations:[
    {on:true, op:'replace', path:'/relations/rel_silco_chem/intensity', after:0.1, why:'공급망을 빼앗겨 지배력이 거의 사라짐'},
    {on:true, op:'add', path:'/relations/rel_enf_fire', after:{id:'rel_enf_fire', from:'grp_enforcers', to:'grp_firelights', type:'hostile', intensity:0.7, note:'진압과 저항'}, why:'진압 현장에서 직접 충돌'}
  ]
};
function guessAnalysis(title, text){
  const s=state; const found=[...s.groups, ...s.characters].filter(e=>text.includes(e.name) || (e.aliases||[]).some(a=>text.includes(a)));
  const tags=[]; [['공격','위협'],['습격','위협'],['죽','상실'],['잃','상실'],['진압','탄압'],['체포','탄압'],['장악','기회'],['기회','기회'],['분노','분노'],['보복','보복위협']].forEach(([k,t])=>{ if(text.includes(k)&&!tags.includes(t)) tags.push(t); });
  if(!tags.length) tags.push('위협');
  const pos=tags.every(t=>t==='기회'||t==='이익');
  return {title, description:text, story_time:'', direct:found.slice(0,5).map(e=>({target:e.id, M:pos?0.5:-0.5, tags:[...tags], summary:`${title}의 영향을 받음`})), rewrite:{}, relations:[]};
}
function finals(a){
  const rows=propagate(state, a.direct);
  const items=[];
  a.direct.forEach(d=>items.push({target:d.target, w:d.M, source:'direct', tags:d.tags, summary:d.summary}));
  rows.filter(r=>r.rep).forEach(r=>items.push({target:r.target, w:r.w, source:'propagated', via:r.via, tags:r.tags, summary:''}));
  return {rows, items};
}
function buildPatches(a, cid, s=state){
  const {items}=finals(a); const patches=[]; const maxW={};
  items.forEach(it=>{
    if(Math.abs(it.w)<0.25) return;
    const sum = it.summary || (a.rewrite[it.target]?.[1]) || `${nm(s,it.via)}에서 전해진 '${a.title}'의 영향을 받음.`;
    const h={commit:cid, summary:sum, source:it.source}; if(it.via){ h.via=it.via; h.weight=Math.round(it.w*100)/100; }
    patches.push({op:'add', path:`/${coll(it.target)}/${it.target}/situation/history/-`, after:h});
    if(!maxW[it.target] || Math.abs(it.w)>Math.abs(maxW[it.target])) maxW[it.target]=it.w;
  });
  Object.entries(maxW).forEach(([id,w])=>{
    if(Math.abs(w)<0.6) return; const e=ent(s,id); if(!e?.situation) return;
    const [st,txt]=a.rewrite[id] || [e.situation.status, `'${a.title}' 이후 ${w<0?'큰 타격을 받아 대응을 모색 중':'세력을 키울 기회를 잡음'}. (AI가 다시 쓸 문장)`];
    if(txt!==e.situation.current) patches.push({op:'replace', path:`/${coll(id)}/${id}/situation/current`, before:e.situation.current, after:txt});
    if(st && st!==e.situation.status) patches.push({op:'replace', path:`/${coll(id)}/${id}/situation/status`, before:e.situation.status, after:st});
  });
  a.relations.filter(r=>r.on).forEach(r=>{
    if(r.op==='replace') patches.push({op:'replace', path:r.path, before:getv(s,r.path), after:r.after});
    else patches.push({op:'add', path:r.path, after:clone(r.after)});
  });
  return patches;
}
function renderEvent(){
  const blocked=pending.length>0;
  $('#tab-event').innerHTML = pendingBanner() + `
  <div class="Subhead"><h2>새 사건</h2><span class="muted">HEAD <span class="sha">${head().id}</span> 위에 커밋됩니다</span></div>
  <div class="split-r">
    <div class="stack">
      <div class="Box"><div class="Box-body stack">
        <div class="form-group"><label for="ev-title">사건 제목</label><input class="form-control" id="ev-title" value="${esc(analysis?.title ?? SAMPLE.title)}"></div>
        <div class="form-group"><label for="ev-text">무슨 일이 일어나나요?</label><textarea class="form-control" id="ev-text" rows="3">${esc(analysis?.description ?? SAMPLE.description)}</textarea></div>
        <div class="form-group" style="max-width:260px"><label for="ev-time">작중 시점</label><input class="form-control" id="ev-time" value="${esc(analysis?.story_time ?? SAMPLE.story_time)}"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" id="ev-run">${icon('spark')}AI 영향 분석</button><button class="btn" id="ev-sample">예시 사건 넣기</button></div>
      </div></div>
      <div id="ev-result" class="stack"></div>
    </div>
    <aside class="stack">
      <div class="Box"><div class="Box-header"><h3>영향 전파 규칙</h3></div>
        <div class="Box-body stack" style="gap:10px">
          <div style="font-family:var(--mono);font-size:13px;padding:8px 12px;background:var(--bg-subtle);border-radius:6px">w = M × 결속도 × S<br><span class="muted">S = 1 + Σ(성격 강도 × 반응도)</span></div>
          <dl class="kv"><dt>M</dt><dd>단체가 받은 영향 (−1 피해 ~ +1 이득)</dd><dt>결속도</dt><dd>인물의 소속 bond, 하위 단체의 parent_bond</dd><dt>반응도</dt><dd>이 성격이 영향 태그에 얼마나 반응하는지 (AI 판단, −1~1)</dd></dl>
          <div class="caption">S는 −1~2, w는 −1~1로 자릅니다. S가 음수면 영향이 뒤집힙니다. 여러 경로로 받으면 |w|가 가장 큰 경로가 대표값입니다.</div>
          <div class="summary-tiles"><span><b>&lt;0.25</b>변화 없음</span><span><b>0.25~0.6</b>이력 한 줄</span><span><b>≥0.6</b>상황 다시 쓰기</span></div>
        </div></div>
      <div class="flash">${icon('info')}<div class="caption" style="color:var(--fg)">반응도 판단과 상황 문장은 AI가, 숫자 계산은 앱이 합니다. 그래서 M이나 성격 강도를 고치면 결과가 바로 다시 계산됩니다.</div></div>
    </aside>
  </div>`;
  $('#ev-sample').onclick=()=>{ $('#ev-title').value=SAMPLE.title; $('#ev-text').value=SAMPLE.description; $('#ev-time').value=SAMPLE.story_time; };
  $('#ev-run').onclick=()=>{
    const title=$('#ev-title').value.trim()||'새 사건', text=$('#ev-text').value.trim();
    if(!text){ $('#ev-result').innerHTML=`<div class="flash flash-warn">${icon('alert')}<div>사건 내용을 입력하세요.</div></div>`; return; }
    $('#ev-result').innerHTML=`<div class="Box"><div class="Box-body" style="display:flex;gap:8px;align-items:center"><div class="spinner"></div><span class="muted">사건이 단체·인물에 주는 직접 영향을 판단하고 있습니다</span></div></div>`;
    setTimeout(()=>{
      analysis = (title===SAMPLE.title) ? {...clone(SAMPLE), description:text} : guessAnalysis(title, text);
      analysis.story_time=$('#ev-time').value.trim();
      drawAnalysis();
    }, 650);
  };
  if(analysis) drawAnalysis();
  wirePending();
}
function drawAnalysis(){
  const a=analysis, box=$('#ev-result'); if(!box) return;
  const cand=[...state.groups, ...state.characters].filter(e=>!a.direct.some(d=>d.target===e.id));
  box.innerHTML = `
  <div class="Box">
    <div class="Box-header"><span class="step-badge">1</span><h3>직접 영향</h3><span class="ai-badge">${icon('spark')}AI 판단</span><span class="caption right">M과 태그는 고칠 수 있습니다</span></div>
    ${a.direct.length?'':'<div class="Box-body caption">사건에서 세계관 항목을 찾지 못했습니다. 아래에서 대상을 추가하세요.</div>'}
    ${a.direct.map((d,i)=>`<div class="direct-row">
      <div><b>${esc(nm(state,d.target))}</b><div class="caption">${d.target.startsWith('grp_')?KIND[ent(state,d.target).kind]:'인물'}</div></div>
      <div class="mrow"><input type="range" min="-1" max="1" step="0.05" value="${d.M}" data-m="${i}" aria-label="${esc(nm(state,d.target))} 영향 크기"><span class="num" id="mv${i}" style="width:44px;text-align:right">${sf2(d.M)}</span></div>
      <button class="btn btn-sm btn-danger" data-del="${i}" aria-label="삭제" style="padding:2px 6px">×</button>
      <div class="chips full">${TAGS.map(t=>`<button class="chip" data-tag="${i}|${t}" aria-pressed="${d.tags.includes(t)}">${t}</button>`).join('')}</div>
      <input class="form-control full" data-sum="${i}" value="${esc(d.summary)}" aria-label="요약">
    </div>`).join('')}
    <div class="Box-row" style="background:var(--bg-subtle);flex-wrap:wrap"><select class="form-control" id="add-target" style="width:auto;flex:1 1 200px" aria-label="대상 추가">
      ${cand.map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join('')}</select><button class="btn btn-sm" id="add-direct">+ 직접 영향 추가</button></div>
  </div>
  <div class="Box" id="prop-box"></div>
  ${a.relations.length?`<div class="Box"><div class="Box-header"><span class="step-badge">3</span><h3>관계 변화 제안</h3><span class="ai-badge">${icon('spark')}AI 판단</span></div>
    ${a.relations.map((r,i)=>`<label class="Box-row" style="cursor:pointer;align-items:flex-start"><input type="checkbox" data-rel="${i}" ${r.on?'checked':''} style="margin-top:4px">
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">${patchLines(state,{...r, before:getv(state,r.path)}).map(([c,l])=>`<span class="diffline ${c}">${esc(l)}</span>`).join('')}<span class="caption">${esc(r.why)}</span></div></label>`).join('')}</div>`:''}
  <div class="Box" id="commit-box"></div>`;
  $$('[data-m]').forEach(r=>r.oninput=()=>{ a.direct[r.dataset.m].M=+r.value; $('#mv'+r.dataset.m).textContent=sf2(+r.value); drawProp(); });
  $$('[data-tag]').forEach(b=>b.onclick=()=>{ const [i,t]=b.dataset.tag.split('|'); const tg=a.direct[i].tags; const k=tg.indexOf(t); k>-1?tg.splice(k,1):tg.push(t); b.setAttribute('aria-pressed', k<0); drawProp(); });
  $$('[data-sum]').forEach(inp=>inp.oninput=()=>{ a.direct[inp.dataset.sum].summary=inp.value; });
  $$('[data-del]').forEach(b=>b.onclick=()=>{ a.direct.splice(+b.dataset.del,1); drawAnalysis(); });
  $$('[data-rel]').forEach(c=>c.onchange=()=>{ a.relations[c.dataset.rel].on=c.checked; drawProp(); });
  const ad=$('#add-direct'); if(ad) ad.onclick=()=>{ const id=$('#add-target').value; if(!id) return; a.direct.push({target:id, M:-0.5, tags:['위협'], summary:'사건의 직접 영향'}); drawAnalysis(); };
  drawProp();
}
function drawProp(){
  const a=analysis; const {rows, items}=finals(a);
  const ordered=rows.slice().sort((x,y)=>(y.rep-x.rep)||Math.abs(y.w)-Math.abs(x.w));
  $('#prop-box').innerHTML = `<div class="Box-header"><span class="step-badge">2</span><h3>소속을 따라 전파</h3><span class="code-badge">${icon('calc')}앱 계산</span><span class="caption right">${rows.length}개 경로</span></div>
    ${rows.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>대상</th><th>경로</th><th class="r">M</th><th class="r">결속도</th><th>성격 반응</th><th class="r">S</th><th class="r">w</th><th></th><th>판정</th></tr></thead><tbody>
    ${ordered.map(r=>{ const [lv,cls]=level(r.w); return `<tr class="${r.rep?'':'dimmed'}">
      <td><b>${esc(nm(state,r.target))}</b></td><td class="muted">${esc(nm(state,r.via))} 경유</td>
      <td class="r num">${sf2(r.M)}</td><td class="r num">${f2(r.bond)}</td>
      <td style="min-width:180px">${r.parts.length?r.parts.map(p=>`<span style="white-space:nowrap">${esc(p.label)} <span class="num">${f2(p.value)}×${p.rel>0?'':'('}${p.rel.toFixed(1)}${p.rel>0?'':')'}</span></span>`).join('<span class="muted"> + </span>'):'<span class="muted">반응 없음</span>'}</td>
      <td class="r num">${f2(r.S)}</td><td class="r num ${r.w<0?'neg':'pos'}"><b>${sf2(r.w)}</b></td><td style="width:90px">${wbar(r.w)}</td>
      <td>${r.rep?`<span class="Label ${cls}">${lv}</span>`:'<span class="caption">대표값 아님</span>'}</td></tr>`; }).join('')}
    </tbody></table></div>`:'<div class="Box-body caption">직접 영향을 받은 단체에서 이어지는 하위 단체·구성원이 없습니다.</div>'}`;
  const cnt={big:0,minor:0,none:0}; const maxW={};
  items.forEach(it=>{ if(!maxW[it.target]||Math.abs(it.w)>Math.abs(maxW[it.target])) maxW[it.target]=it.w; });
  Object.values(maxW).forEach(w=>{ const x=Math.abs(w); x>=0.6?cnt.big++:x>=0.25?cnt.minor++:cnt.none++; });
  const patches=buildPatches(a,'(새 커밋)');
  $('#commit-box').innerHTML = `<div class="Box-header"><h3>커밋될 변경</h3><div class="summary-tiles right"><span><b class="neg">${cnt.big}</b>큰 변화</span><span><b>${cnt.minor}</b>경미</span><span><b class="muted">${cnt.none}</b>변화 없음</span></div></div>
    <div class="Box-body stack" style="gap:4px">${patches.length?patches.flatMap(p=>patchLines(state,p)).map(([c,l])=>`<span class="diffline ${c}">${esc(l)}</span>`).join(''):'<span class="caption">반영될 변경이 없습니다.</span>'}</div>
    <div class="Box-row" style="background:var(--bg-subtle);flex-wrap:wrap">
      <input class="form-control" id="ev-msg" style="flex:1 1 240px;width:auto" value="사건: ${esc(a.title)}" aria-label="커밋 메시지">
      <button class="btn" id="ev-preview">${icon('graph')}관계도에서 미리보기</button>
      <button class="btn btn-primary" id="ev-commit" ${pending.length||!patches.length?'disabled':''}>${icon('commit')}사건 커밋</button>
    </div>${pending.length?'<div class="Box-row caption">수동 수정을 먼저 커밋하거나 버려야 사건을 커밋할 수 있습니다.</div>':''}`;
  $('#ev-preview').onclick=()=>{ ui.graphVer='preview'; showTab('graph'); };
  $('#ev-commit').onclick=()=>{
    const id=newSha(); const ps=buildPatches(a,id); const {items:its}=finals(a);
    ps.forEach(p=>applyPatch(state,p));
    commits.push({id, parent:head().id, kind:'event', message:$('#ev-msg').value.trim()||'사건: '+a.title, created_at:new Date().toISOString(),
      event:{title:a.title, description:a.description, story_time:a.story_time, involved:a.direct.map(d=>d.target)},
      impacts:its.map(it=>({target:it.target, source:it.source, via:it.via, tags:it.tags, magnitude:Math.round(it.w*100)/100, summary:it.summary||''})), patches:ps});
    analysis=null; ui.graphVer='work'; ui.open={[id]:true}; toast(`커밋 ${id} 생성 · 변경 ${ps.length}건`); showTab('history');
  };
}

/* ---------- 관계도 ---------- */
const POS_ARCANE = {
  grp_zaun:[150,58], grp_piltover:[715,58],
  grp_silco_faction:[120,190], chr_silco:[255,140], chr_jinx:[290,265], grp_chembarons:[90,315], grp_singed:[215,385],
  grp_firelights:[105,470], chr_ekko:[285,470], chr_viktor:[440,175], chr_vi:[440,380],
  grp_council:[650,175], chr_jayce:[560,265], grp_enforcers:[705,375], chr_caitlyn:[595,465], chr_mel:[755,260],
  grp_noxus:[960,58], grp_medarda:[905,195], chr_ambessa:[1030,275], grp_black_rose:[925,400], chr_leblanc:[1035,445]
};
function graphState(){
  if(ui.graphVer==='preview' && analysis){ const s=clone(state); buildPatches(analysis,'preview',state).forEach(p=>applyPatch(s,p)); return s; }
  if(ui.graphVer==='work' || ui.graphVer==='preview'){ ui.graphVer='work'; return state; }
  return stateAt(commits.findIndex(c=>c.id===ui.graphVer));
}
function overlayMap(){
  const m={};
  let list=[];
  if(ui.graphVer==='preview' && analysis) list=finals(analysis).items.map(i=>({target:i.target, magnitude:i.w}));
  else { const c=ui.graphVer==='work'?head():commits.find(c=>c.id===ui.graphVer); list=c?.impacts||[]; }
  list.forEach(i=>{ if(!m[i.target]||Math.abs(i.magnitude)>Math.abs(m[i.target])) m[i.target]=i.magnitude; });
  return m;
}
function renderGraph(){
  const s=graphState(); const ov=ui.overlay?overlayMap():{};
  const sel=ent(s,ui.sel) && !ui.sel.startsWith('bg_') ? ui.sel : 'chr_vi'; ui.sel=sel;
  const filt={all:null, conflict:['hostile','rival'], coop:['coexist','alliance'], dominate:['dominate'], personal:['family','personal']}[ui.relFilter];
  const rels=s.relations.filter(r=>!filt||filt.includes(r.type));
  const pairs={}; rels.forEach(r=>{ const k=[r.from,r.to].sort().join('|'); (pairs[k]=pairs[k]||[]).push(r); });
  const pos=id=>POS[id]||[430,300];
  const linked=new Set([sel]); s.relations.forEach(r=>{ if(r.from===sel) linked.add(r.to); if(r.to===sel) linked.add(r.from); });
  const isNode=id=>id.startsWith('grp_')||id.startsWith('chr_');
  const edge=(r)=>{
    const k=[r.from,r.to].sort().join('|'); const grp=pairs[k]; const i=grp.indexOf(r), n=grp.length;
    let [x1,y1]=pos(r.from), [x2,y2]=pos(r.to);
    const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy)||1; const off=(i-(n-1)/2)*34;
    const sgn = r.from<r.to?1:-1;
    const cx=(x1+x2)/2 - dy/L*off*sgn, cy=(y1+y2)/2 + dx/L*off*sgn;
    if(r.directed){ const ex=x2-cx, ey=y2-cy, el=Math.hypot(ex,ey)||1; x2-=ex/el*30; y2-=ey/el*30; }
    const R=REL[r.type]; const dim = !(r.from===sel||r.to===sel);
    const w=1+r.intensity*3.5;
    const lx=(x1+2*cx+x2)/4, ly=(y1+2*cy+y2)/4;
    return `<g opacity="${dim?.35:1}"><path d="M${x1},${y1} Q${cx},${cy} ${x2},${y2}" style="fill:none;stroke:${R.c};stroke-width:${w};${R.dash?`stroke-dasharray:${R.dash}`:''}" stroke-linecap="round" ${r.directed?'marker-end="url(#arrow)"':''}><title>${esc(nm(s,r.from))} ${r.directed?'→':'↔'} ${esc(nm(s,r.to))} · ${R.l} ${f2(r.intensity)}${r.note?' · '+esc(r.note):''}</title></path>
      ${!dim?`<text x="${lx}" y="${ly-5}" text-anchor="middle" font-size="11" style="fill:${R.c};paint-order:stroke;stroke:var(--bg);stroke-width:4px">${R.l} ${f2(r.intensity)}</text>`:''}</g>`;
  };
  const memberLines = ui.showMembers ? [
    ...s.groups.filter(g=>g.parent).map(g=>({a:g.id,b:g.parent,bond:g.parent_bond??0.6,active:true})),
    ...s.characters.flatMap(c=>(c.memberships||[]).map(m=>({a:c.id,b:m.group,bond:m.bond,active:m.active!==false})))
  ].map(m=>{ const [x1,y1]=pos(m.a),[x2,y2]=pos(m.b); const dim=!(m.a===sel||m.b===sel);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:var(--border-strong);stroke-width:${0.6+m.bond*1.6};stroke-dasharray:2 4" opacity="${m.active?(dim?.35:.9):.2}"><title>${esc(nm(s,m.a))} → ${esc(nm(s,m.b))} 소속 · 결속도 ${f2(m.bond)}</title></line>`; }).join('') : '';
  const node=e=>{
    const [x,y]=pos(e.id); const col=nationColor(nationOf(s,e)); const isSel=e.id===sel; const dead=e.situation?.status==='사망';
    const dim = !linked.has(e.id) && !(ui.showMembers && memberOf(s,e.id,sel));
    const w=ov[e.id]; let halo='';
    if(w!==undefined && Math.abs(w)>=0.25){ const hc=w<0?'var(--danger)':'var(--success)';
      halo = e.id.startsWith('chr_') ? `<circle cx="${x}" cy="${y}" r="${27+Math.abs(w)*8}" style="fill:${hc};opacity:.16"/><circle cx="${x}" cy="${y}" r="${27+Math.abs(w)*8}" style="fill:none;stroke:${hc};stroke-width:1.5"/>`
        : '';
    }
    const badge = (w!==undefined && Math.abs(w)>=0.25) ? `<g><rect x="${x+16}" y="${y-36}" width="44" height="18" rx="9" style="fill:${w<0?'var(--danger)':'var(--success)'}"/><text x="${x+38}" y="${y-23}" text-anchor="middle" font-size="11" font-weight="600" style="fill:#fff" class="num">${sf2(w)}</text></g>` : '';
    let shape;
    if(e.id.startsWith('grp_')){
      const nat=e.kind==='nation'; const wd=e.name.length*(nat?15:13)+(nat?36:26), h=nat?38:32;
      const hb = (w!==undefined && Math.abs(w)>=0.25) ? `<rect x="${x-wd/2-6}" y="${y-h/2-6}" width="${wd+12}" height="${h+12}" rx="10" style="fill:${w<0?'var(--danger)':'var(--success)'};opacity:.16;stroke:${w<0?'var(--danger)':'var(--success)'};stroke-width:1.5"/>` : '';
      shape = `${hb}<rect class="nshape" x="${x-wd/2}" y="${y-h/2}" width="${wd}" height="${h}" rx="6" style="fill:${nat?'var(--bg-muted)':'var(--bg-subtle)'};stroke:${col};stroke-width:${isSel?3:nat?2:1.5};${e.kind==='solo'?'stroke-dasharray:4 3':''}"/>
        <text x="${x}" y="${y+5}" text-anchor="middle" font-size="${nat?15:13}" font-weight="${nat?700:600}" style="fill:var(--fg)">${esc(e.name)}</text>`;
    } else {
      shape = `${halo}<circle class="nshape" cx="${x}" cy="${y}" r="22" style="fill:var(--bg);stroke:${col};stroke-width:${isSel?3.5:2}"/>
        <text x="${x}" y="${y+5}" text-anchor="middle" font-size="14" font-weight="700" style="fill:${col}">${esc(initial(e.name))}</text>
        <text x="${x}" y="${y+40}" text-anchor="middle" font-size="12" style="fill:var(--fg);paint-order:stroke;stroke:var(--bg);stroke-width:4px">${esc(e.name)}${dead?' (사망)':''}</text>`;
    }
    return `<g class="node" data-id="${e.id}" tabindex="0" role="button" aria-label="${esc(e.name)}" opacity="${dead?.5:dim?.45:1}">${shape}${badge}</g>`;
  };
  const e=ent(s,sel); const myRels=s.relations.filter(r=>r.from===sel||r.to===sel);
  const verLabel = ui.graphVer==='preview'?'AI 제안 미리보기':ui.graphVer==='work'?`HEAD ${head().id}`:ui.graphVer;
  const ovSrc = ui.graphVer==='preview'?'미리보기 사건':(ui.graphVer==='work'?head():commits.find(c=>c.id===ui.graphVer))?.message;
  $('#tab-graph').innerHTML = pendingBanner() + `
  <div class="Subhead"><h2>관계도</h2><span class="sha">${esc(verLabel)}</span>${ui.graphVer==='preview'?'<span class="Label Label--done">아직 커밋 안 됨</span>':''}
    <div class="actions">
      <select class="form-control" id="g-ver" style="width:auto;padding:3px 8px;font-size:12px" aria-label="버전">
        <option value="work" ${ui.graphVer==='work'?'selected':''}>현재 (HEAD${pending.length?' + 수동 수정':''})</option>
        ${analysis?`<option value="preview" ${ui.graphVer==='preview'?'selected':''}>AI 제안 미리보기</option>`:''}
        ${commits.slice().reverse().map(c=>`<option value="${c.id}" ${ui.graphVer===c.id?'selected':''}>${c.id} · ${esc(c.message)}</option>`).join('')}
      </select>
    </div></div>
  <div class="split-r">
    <div class="Box">
      <div class="Box-header" style="gap:12px">
        <div class="seg" role="group" aria-label="관계 필터">${[['all','전체'],['conflict','대립·경쟁'],['coop','공존·동맹'],['dominate','지배'],['personal','가족·개인']].map(([k,l])=>`<button aria-pressed="${ui.relFilter===k}" data-f="${k}">${l}</button>`).join('')}</div>
        <label class="check"><input type="checkbox" id="g-mem" ${ui.showMembers?'checked':''}>소속 선</label>
        <label class="check"><input type="checkbox" id="g-ov" ${ui.overlay?'checked':''}>사건 영향 표시</label>
      </div>
      <div class="graph-wrap"><svg viewBox="0 0 1100 540" role="img" aria-label="단체·인물 관계도">
        <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--done)"/></marker></defs>
        ${W.zones.map((z,i)=>`<rect x="${z.x}" y="0" width="${z.w}" height="540" style="fill:var(${z.fill})"/>${i?`<line x1="${z.x}" y1="0" x2="${z.x}" y2="540" style="stroke:var(--border);stroke-dasharray:2 6"/>`:''}<text x="${z.x+14}" y="528" font-size="11" font-weight="600" letter-spacing="1" style="fill:var(${z.c})">${esc(z.label)}</text>`).join('')}
        ${memberLines}${rels.map(edge).join('')}
        ${[...s.groups,...s.characters].filter(x=>isNode(x.id)).map(node).join('')}
      </svg></div>
      <div class="Box-row" style="flex-wrap:wrap"><div class="legend">
        ${Object.values(REL).map(R=>`<span><i style="border-top:2px ${R.dash?'dashed':'solid'} ${R.c}"></i>${R.l}</span>`).join('')}
        <span><i style="border-top:2px dotted var(--border-strong)"></i>소속</span>
        <span>선 굵기 = 강도</span>
        ${W.zones.map(z=>`<span><span class="sq" style="background:var(${z.c})"></span>${esc(nm(state,z.id))}</span>`).join('')}
        <span><span class="dot" style="background:var(--danger);opacity:.6"></span>피해 w</span><span><span class="dot" style="background:var(--success);opacity:.6"></span>이득 w</span>
      </div></div>
    </div>
    <aside class="stack">
      <div class="Box">
        <div class="Box-header">${e.id.startsWith('chr_')?`<span class="dot" style="background:${nationColor(nationOf(s,e))}"></span>`:`<span class="sq" style="background:${nationColor(nationOf(s,e))}"></span>`}<h3>${esc(e.name)}</h3>
          <span class="Label">${e.id.startsWith('grp_')?KIND[e.kind]:'인물'}</span>${e.situation?.status?`<span class="Label ${statusCls(e.situation.status)}">${esc(e.situation.status)}</span>`:''}</div>
        <div class="Box-body stack" style="gap:12px">
          <p style="margin:0">${esc(e.situation?.current)}</p>
          ${ov[e.id]!==undefined?`<div style="display:flex;gap:8px;align-items:center"><span class="caption" style="flex:none">이 사건의 영향</span>${wbar(ov[e.id])}<span class="num ${ov[e.id]<0?'neg':'pos'}">${sf2(ov[e.id])}</span></div><div class="caption">${esc(ovSrc||'')}</div>`:''}
          <div>${(e.traits||[]).map(t=>`<div style="display:grid;grid-template-columns:minmax(0,1fr) 80px 32px;gap:8px;align-items:center;font-size:12px;padding:2px 0"><span>${esc(t.label)}</span><div class="meter"><i style="width:${t.value*100}%"></i></div><span class="num" style="text-align:right">${f2(t.value)}</span></div>`).join('')}</div>
        </div>
        ${myRels.map(r=>{const o=r.from===sel?r.to:r.from; const R=REL[r.type]; return `<div class="Box-row"><div style="flex:1;min-width:0"><button class="btn-link" data-pick="${o}">${esc(nm(s,o))}</button>${r.note?`<div class="caption">${esc(r.note)}</div>`:''}</div><span class="Label" style="color:${R.c};border-color:${R.c}">${R.l}${r.directed?(r.from===sel?' →':' ←'):''}</span><span class="num">${f2(r.intensity)}</span></div>`}).join('')}
        <div class="Box-row"><button class="btn btn-sm" id="g-edit">세계관에서 편집</button></div>
      </div>
    </aside>
  </div>`;
  $$('[data-f]').forEach(b=>b.onclick=()=>{ ui.relFilter=b.dataset.f; renderGraph(); });
  $('#g-ver').onchange=ev=>{ ui.graphVer=ev.target.value; renderGraph(); };
  $('#g-mem').onchange=ev=>{ ui.showMembers=ev.target.checked; renderGraph(); };
  $('#g-ov').onchange=ev=>{ ui.overlay=ev.target.checked; renderGraph(); };
  $$('.node').forEach(n=>{ const go=()=>{ ui.sel=n.dataset.id; renderGraph(); }; n.onclick=go; n.onkeydown=ev=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); go(); } }; });
  $$('[data-pick]').forEach(b=>b.onclick=()=>{ ui.sel=b.dataset.pick; renderGraph(); });
  $('#g-edit').onclick=()=>showTab('world');
  wirePending();
}
const SURNAMES='김이박최정강조윤장임한오서신권황안송류홍전고문양손배백허유남심노하곽성차주우구민진나지엄채원천방공현함변염여추도소석선설마길연위표명기반왕금옥육인맹제모봉';
function initial(n){ return /^[가-힣]{3}$/.test(n) && SURNAMES.includes(n[0]) ? n[1] : n[0]; }
function memberOf(s,a,b){
  const ea=ent(s,a), eb=ent(s,b);
  return (ea?.memberships||[]).some(m=>m.group===b) || (eb?.memberships||[]).some(m=>m.group===a) || ea?.parent===b || eb?.parent===a;
}

/* ---------- 버전 기록 ---------- */
function coalesce(from, to){
  const map=new Map(); const out=[];
  commits.slice(from+1, to+1).forEach(c=>c.patches.forEach(p=>{
    if(p.op==='replace'){ const m=map.get(p.path); if(m) m.after=p.after; else { const x={...p}; map.set(p.path,x); out.push(x); } }
    else out.push(p);
  }));
  return out.filter(p=>p.op!=='replace' || JSON.stringify(p.before)!==JSON.stringify(p.after));
}
function impactTable(c){
  if(!c.impacts?.length) return '';
  const imp=c.impacts.slice().sort((a,b)=>(a.source===b.source?0:a.source==='direct'?-1:1)||Math.abs(b.magnitude)-Math.abs(a.magnitude));
  return `<div class="tbl-wrap" style="margin-top:12px;border:1px solid var(--border);border-radius:6px"><table class="tbl"><thead><tr><th>대상</th><th>경로</th><th>태그</th><th class="r">크기</th><th></th><th>요약</th></tr></thead><tbody>
    ${imp.map(i=>`<tr><td><b>${esc(nm(state,i.target))}</b></td><td><span class="Label ${SRC[i.source][1]}">${SRC[i.source][0]}</span>${i.via?` <span class="caption">${esc(nm(state,i.via))} 경유</span>`:''}</td>
      <td class="caption">${esc((i.tags||[]).join(', '))}</td><td class="r num ${i.magnitude<0?'neg':'pos'}">${sf2(i.magnitude)}</td><td style="width:90px">${wbar(i.magnitude)}</td><td class="caption" style="min-width:160px">${esc(i.summary)}</td></tr>`).join('')}
  </tbody></table></div>`;
}
function renderHistory(){
  const n=commits.length;
  if(!commits.some(c=>c.id===ui.cmpA)) ui.cmpA=commits[Math.max(0,n-2)].id;
  if(!commits.some(c=>c.id===ui.cmpB)) ui.cmpB=commits[n-1].id;
  let ia=commits.findIndex(c=>c.id===ui.cmpA), ib=commits.findIndex(c=>c.id===ui.cmpB); if(ia>ib) [ia,ib]=[ib,ia];
  const diff=coalesce(ia,ib); const lines=diff.flatMap(p=>patchLines(stateAt(ib),p));
  const cnt={add:0,chg:0,del:0}; lines.forEach(([c])=>cnt[c]++);
  $('#tab-history').innerHTML = pendingBanner() + `
  <div class="Subhead"><h2>버전 기록</h2><span class="muted">main · 커밋 ${n}개</span></div>
  <div class="split-r">
    <div class="timeline">
      ${commits.map((c,i)=>({c,i})).reverse().map(({c,i})=>{ const open=ui.open[c.id] ?? (i===n-1);
        return `<div class="tl-head">${icon('commit')}${fmtDate(c.created_at)}</div>
      <div class="Box" style="margin-bottom:8px"><div class="Box-body">
        <div class="commit">
          <div class="msg">${esc(c.message)}${i===n-1?'<span class="head-tag">HEAD</span>':''}
            <small><span class="Label" style="margin-right:4px">${COMMIT_KIND[c.kind]||c.kind}</span>rladuwn 커밋${c.parent?` · 부모 ${c.parent}`:''}${c.impacts?.length?` · 영향 ${c.impacts.length}건`:''} · 변경 ${c.patches.length}건</small></div>
          <span class="sha">${c.id}</span>
          <div class="pick" role="group" aria-label="비교 대상">
            <label><input type="radio" name="cmpA" value="${c.id}" ${ui.cmpA===c.id?'checked':''}>A</label>
            <label><input type="radio" name="cmpB" value="${c.id}" ${ui.cmpB===c.id?'checked':''}>B</label>
          </div>
          ${i<n-1?`<button class="btn btn-sm btn-danger" data-rb="${c.id}">이 시점으로 되돌리기</button>`:''}
        </div>
        ${c.event?`<div style="margin-top:8px;padding:8px 12px;background:var(--bg-subtle);border-radius:6px"><div>${esc(c.event.description)}</div>
          <div class="caption" style="margin-top:4px">${c.event.story_time?`작중 시점: ${esc(c.event.story_time)} · `:''}관련: ${(c.event.involved||[]).map(id=>esc(nm(state,id))).join(', ')}</div></div>`:''}
        ${(c.impacts?.length||c.patches.length)?`<button class="btn-link" data-open="${c.id}" style="margin-top:8px;font-size:12px">${open?'접기':'영향과 변경 보기'}</button>`:''}
        ${open?`${impactTable(c)}${c.patches.length?`<div class="stack" style="gap:3px;margin-top:12px">${c.patches.flatMap(p=>patchLines(stateAt(i),p)).map(([k,l])=>`<span class="diffline ${k}">${esc(l)}</span>`).join('')}</div>`:''}`:''}
        ${ui.confirm===c.id?`<div class="confirm">${icon('alert')}<span style="flex:1 1 200px">이후 커밋 ${n-1-i}개의 변경을 역순으로 되돌립니다. 기록은 지워지지 않고 되돌리기 커밋이 새로 쌓입니다.</span>
          <button class="btn btn-sm" data-cancel>취소</button><button class="btn btn-sm btn-primary" data-ok="${c.id}">되돌리기 커밋</button></div>`:''}
      </div></div>`; }).join('')}
    </div>
    <aside class="Box" style="position:sticky;top:76px">
      <div class="Box-header"><h3>비교</h3><span class="sha">${commits[ia].id}</span><span class="muted">→</span><span class="sha">${commits[ib].id}</span></div>
      <div class="Box-body stack" style="gap:4px;max-height:60vh;overflow:auto">
        ${ia===ib?'<span class="caption">A와 B에 서로 다른 커밋을 고르세요.</span>':lines.length?lines.map(([c,l])=>`<span class="diffline ${c}">${esc(l)}</span>`).join(''):'<span class="caption">차이가 없습니다.</span>'}
      </div>
      <div class="Box-row" style="flex-wrap:wrap"><span class="caption" style="flex:1">${cnt.add}개 추가 · ${cnt.chg}개 변경 · ${cnt.del}개 삭제</span>
        <button class="btn btn-sm" id="h-graph">${icon('graph')}B 시점 관계도</button></div>
    </aside>
  </div>`;
  $$('input[name=cmpA]').forEach(r=>r.onchange=()=>{ ui.cmpA=r.value; renderHistory(); });
  $$('input[name=cmpB]').forEach(r=>r.onchange=()=>{ ui.cmpB=r.value; renderHistory(); });
  $$('[data-open]').forEach(b=>b.onclick=()=>{ const id=b.dataset.open; const i=commits.findIndex(c=>c.id===id); ui.open[id]=!(ui.open[id] ?? (i===n-1)); renderHistory(); });
  $$('[data-rb]').forEach(b=>b.onclick=()=>{ ui.confirm=b.dataset.rb; renderHistory(); });
  $$('[data-cancel]').forEach(b=>b.onclick=()=>{ ui.confirm=null; renderHistory(); });
  $$('[data-ok]').forEach(b=>b.onclick=()=>{
    pending.slice().reverse().forEach(p=>applyPatch(state,p,true)); pending=[];
    const ti=commits.findIndex(c=>c.id===b.dataset.ok); const inv=[];
    for(let k=commits.length-1;k>ti;k--) commits[k].patches.slice().reverse().forEach(p=>{
      let q;
      if(p.op==='replace') q={op:'replace', path:p.path, before:p.after, after:p.before};
      else if(p.op==='add') q={op:'remove', path:p.path, before:clone(p.path.endsWith('/-')?getv(state,p.path.replace(/\/-$/,'')).at(-1):getv(state,p.path))};
      else q={op:'add', path:p.path, after:p.before};
      applyPatch(state,q); inv.push(q);
    });
    const id=newSha(); commits.push({id, parent:head().id, kind:'manual', message:`되돌리기: ${b.dataset.ok} 시점으로 복원`, created_at:new Date().toISOString(), impacts:[], patches:inv});
    ui.confirm=null; ui.cmpA=b.dataset.ok; ui.cmpB=id; ui.open={[id]:true}; analysis=null; toast(`${b.dataset.ok} 시점으로 되돌렸습니다`); render();
  });
  $('#h-graph').onclick=()=>{ ui.graphVer=commits[ib].id===head().id?'work':commits[ib].id; showTab('graph'); };
  wirePending();
}

/* ---------- 예시 세계관 ---------- */
const WORLDS = {
  arcane: {
    slug:'arcane', data:DATA_ARCANE, pos:POS_ARCANE, sample:SAMPLE_ARCANE, sel:'chr_vi',
    zones:[
      {id:'grp_zaun', x:0, w:440, label:'아래 도시 · 자운', c:'--success', fill:'--zaun'},
      {id:'grp_piltover', x:440, w:380, label:'위 도시 · 필트오버', c:'--attention', fill:'--piltover'},
      {id:'grp_noxus', x:820, w:280, label:'바다 건너 · 녹서스', c:'--noxus', fill:'--noxus-zone'}
    ]
  },
  hp: {
    slug:'harry-potter', data:DATA_HP, sel:'chr_harry',
    zones:[
      {id:'grp_order', x:0, w:270, label:'불사조 기사단', c:'--attention', fill:'--piltover'},
      {id:'grp_hogwarts', x:270, w:340, label:'호그와트', c:'--z4', fill:'--z4-zone'},
      {id:'grp_ministry', x:610, w:210, label:'마법부', c:'--noxus', fill:'--noxus-zone'},
      {id:'grp_death_eaters', x:820, w:280, label:'죽음을 먹는 자들', c:'--success', fill:'--zaun'}
    ],
    pos:{
      grp_order:[135,58], chr_dumbledore:[150,185], chr_kingsley:[160,345],
      grp_hogwarts:[440,58], grp_gryffindor:[355,170], grp_slytherin:[545,170],
      chr_harry:[350,295], chr_ron:[310,440], chr_hermione:[435,445], chr_draco:[575,300], chr_snape:[555,455],
      grp_ministry:[715,58], grp_aurors:[690,190], chr_scrimgeour:[765,300], chr_umbridge:[700,435],
      grp_death_eaters:[960,58], chr_bellatrix:[895,185], chr_voldemort:[1035,185], grp_malfoy:[920,330], chr_lucius:[1040,345]
    },
    sample:{
      title:'마법부 함락', story_time:'7권 『죽음의 성물』 초반',
      description:'죽음을 먹는 자들이 마법부를 장악한다. 스크림저는 해리의 행방을 말하지 않고 살해되고, 꼭두각시 장관 아래 머글 태생 등록 위원회가 만들어진다.',
      direct:[
        {target:'grp_ministry', M:-0.9, tags:['권력공백','위협'], summary:'죽음을 먹는 자들에게 장악됨'},
        {target:'grp_death_eaters', M:0.85, tags:['기회','권력공백'], summary:'마법부를 손에 넣음'},
        {target:'grp_order', M:-0.6, tags:['위협','탄압'], summary:'은신과 지하 활동으로 전환'},
        {target:'chr_scrimgeour', M:-1.0, tags:['위협'], summary:'해리의 행방을 말하지 않고 살해됨'},
        {target:'chr_umbridge', M:0.7, tags:['기회'], summary:'머글 태생 등록 위원회 위원장이 됨'},
        {target:'chr_hermione', M:-0.6, tags:['탄압'], summary:'머글 태생이라 수배 대상이 됨'}
      ],
      rewrite:{
        grp_ministry:['장악됨','꼭두각시 장관 아래 머글 태생 등록 위원회가 생김. 겉모습은 그대로지만 실권은 볼드모트에게 넘어감.'],
        grp_death_eaters:['정권 장악','마법부를 통해 머글 태생을 공식적으로 박해하기 시작함.'],
        grp_order:['지하 활동','은신처를 옮기고 비밀 라디오 방송으로 소식을 전함.'],
        grp_aurors:['숙청','기사단과 가까운 오러들이 쫓겨나고 남은 이들은 새 정권의 명령을 따름.'],
        chr_scrimgeour:['사망','해리의 행방을 끝내 말하지 않고 살해됨.'],
        chr_umbridge:['위원장','머글 태생 등록 위원회 위원장으로 머글 태생을 심문함.'],
        chr_hermione:['수배','머글 태생이라는 이유로 수배되어 해리와 함께 숨어 다님.'],
        chr_kingsley:['도주중','오러 자리를 잃고 기사단 활동에 전념함.'],
        chr_voldemort:['실권자','마법부를 손에 넣고 해리를 공공의 적 1호로 지명함.'],
        chr_bellatrix:['활동중','마법부의 권력을 등에 업고 더 잔혹해짐.'],
        chr_lucius:['석방','마법부 장악 후 풀려났지만 볼드모트의 신임은 잃은 상태.'],
        chr_harry:['수배','공공의 적 1호로 지명되어 호크룩스를 찾아 숨어 다님.'],
        chr_ron:['수배','해리와 함께 숨어 다니며 가족을 걱정함.'],
        chr_snape:['교장','새 정권에 의해 호그와트 교장으로 임명됨. 겉으로는 볼드모트의 최측근.'],
        chr_draco:['불안','말포이 저택이 죽음을 먹는 자들의 본거지가 되어 집에서도 마음을 놓지 못함.'],
        grp_malfoy:['위태로움','가문의 저택을 볼드모트에게 내주고 눈치를 봄.']
      },
      relations:[
        {on:true, op:'replace', path:'/relations/rel_min_de/intensity', after:0.1, why:'마법부가 더 이상 죽음을 먹는 자들에 맞서지 않음'},
        {on:true, op:'add', path:'/relations/rel_de_min', after:{id:'rel_de_min', from:'grp_death_eaters', to:'grp_ministry', type:'dominate', intensity:0.9, directed:true, note:'꼭두각시 정권'}, why:'꼭두각시 장관을 앞세워 마법부를 지배'},
        {on:true, op:'add', path:'/relations/rel_umbridge_hermione', after:{id:'rel_umbridge_hermione', from:'chr_umbridge', to:'chr_hermione', type:'hostile', intensity:0.8, note:'머글 태생 박해'}, why:'위원회가 머글 태생을 쫓음'}
      ]
    }
  }
};
WORLDS.jg = {
  slug:'janggu', data:DATA_JG, sel:'chr_janggu',
  zones:[
    {id:'grp_family', x:0, w:290, label:'짱구네 집', c:'--attention', fill:'--piltover'},
    {id:'grp_defense', x:290, w:270, label:'떡잎마을 방범대', c:'--success', fill:'--zaun'},
    {id:'grp_kindergarten', x:560, w:340, label:'떡잎유치원', c:'--z4', fill:'--z4-zone'},
    {id:'grp_company', x:900, w:200, label:'쌍떡잎상사', c:'--noxus', fill:'--noxus-zone'}
  ],
  pos:{
    grp_family:[140,58], chr_hyungman:[75,190], chr_miseon:[200,175], chr_jangga:[80,345], chr_whitey:[175,455], chr_janggu:[240,320],
    grp_defense:[425,58], chr_cheolsu:[360,195], chr_yuri:[495,195], chr_hooni:[365,410], chr_maenggu:[495,410],
    grp_kindergarten:[730,58], grp_sunflower:[640,190], grp_rose:[815,190], chr_director:[730,300], chr_chae:[635,430], chr_nam:[820,430],
    grp_company:[1000,58]
  },
  sample:{
    title:'떡잎유치원 운동회', story_time:'가을 운동회 날',
    description:'떡잎유치원 운동회에서 장미반이 해바라기반을 꺾고 우승한다. 나미리 선생님은 트로피를 들고 채성아 선생님 앞을 일부러 지나간다.',
    direct:[
      {target:'grp_sunflower', M:-0.6, tags:['상실','분노'], summary:'운동회에서 장미반에 패배'},
      {target:'grp_rose', M:0.7, tags:['기회'], summary:'운동회 우승'},
      {target:'chr_chae', M:-0.5, tags:['분노'], summary:'나미리 선생님에게 또 짐'},
      {target:'chr_nam', M:0.6, tags:['기회'], summary:'우승 트로피를 자랑'}
    ],
    rewrite:{
      grp_sunflower:['설욕 다짐','장미반에 져서 반 전체가 다음 운동회 설욕을 다짐.'],
      grp_rose:['우승','운동회 우승 트로피를 교실 한가운데 전시.'],
      chr_chae:['분노','나미리 선생님의 자랑에 이를 갈며 특훈을 계획.'],
      chr_nam:['의기양양','우승 트로피를 들고 채성아 선생님 앞을 일부러 지나감.'],
      chr_cheolsu:['분함','체면이 구겨져 줄넘기 특훈 계획표를 짬.'],
      chr_yuri:['분노','토끼 인형을 때리며 분을 삭임.'],
      chr_hooni:['울음','계주에서 넘어져 울음을 터뜨림.'],
      chr_maenggu:['평소대로','진 것보다 운동장에서 주운 돌이 더 마음에 듦.'],
      chr_janggu:['평소대로','지고도 엉덩이 춤으로 장미반을 약올림.']
    },
    relations:[
      {on:true, op:'replace', path:'/relations/rel_chae_nam/intensity', after:0.95, why:'패배 후 두 선생님의 신경전이 극에 달함'},
      {on:true, op:'replace', path:'/relations/rel_sun_rose/intensity', after:0.95, why:'다음 행사에서 설욕하겠다는 분위기'}
    ]
  }
};
let worldKey;
const saveKey = k => `gitstory-save-${k}`;
function saveWorld(){
  try{ localStorage.setItem(saveKey(worldKey), JSON.stringify({state, commits, pending})); }catch(e){}
}
function loadWorld(k, fresh=false){
  W=WORLDS[k]; DATA=W.data; POS=W.pos; SAMPLE=W.sample; worldKey=k;
  state=clone(DATA.state); commits=clone(DATA.commits); pending=[]; analysis=null;
  if(!fresh){
    try{
      const saved=JSON.parse(localStorage.getItem(saveKey(k)));
      if(saved?.state && saved?.commits){ state=saved.state; commits=saved.commits; pending=saved.pending||[]; }
    }catch(e){}
  }
  Object.assign(ui, {sel:W.sel, graphVer:'work', relFilter:'all', cmpA:null, cmpB:null, confirm:null, open:{}});
  try{ localStorage.setItem('gitstory-world', k); }catch(e){}
}
$('#world-pick').onchange=ev=>{ loadWorld(ev.target.value); render(); toast(`${DATA.meta.title} 세계관을 불러왔습니다`); };
$('#world-reset').onclick=()=>{
  if(!confirm(`${DATA.meta.title}의 모든 변경을 지우고 처음 예시 상태로 되돌릴까요?`)) return;
  loadWorld(worldKey, true); render(); toast('처음 예시 상태로 되돌렸습니다');
};
let startWorld='arcane';
try{ const v=localStorage.getItem('gitstory-world'); if(WORLDS[v]) startWorld=v; }catch(e){}
if(location.hash==='#hp' || location.hash==='#harry-potter') startWorld='hp';
if(location.hash==='#arcane') startWorld='arcane';
$('#world-pick').value=startWorld;
loadWorld(startWorld);
render('world');
}
