/* GitStory 샘플 앱 화면 로직. mockups/gitstory-prototype.html의 스크립트를 옮기고,
   세계관 상태를 브라우저(localStorage)에 저장하도록 했다. */
import DATA_ARCANE from "@/data/arcane.json";
import DATA_HP from "@/data/harry-potter.json";
import DATA_JG from "@/data/janggu.json";
import { loadCloud, saveCloud, signOutUser, fetchUsage, analyzeEvent, extractManuscript, listProjects } from "@/legacy/cloud";

let started = false;
let USER;

/** user: { uid, name, photo } */
export function start(user) {
if (started) return;
started = true;
USER = user;
/* 예시 데이터: design/arcane-example.json 그대로 */



let DATA, POS, SAMPLE, W;
let LAYOUT = {};       // 사용자가 관계도에서 끌어 옮긴 위치 {id:[x,y]} (버전과 무관하게 저장)

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
const SRC = {direct:['직접','Label--danger'], propagated:['전파','Label--done'], manual:['내가 고침','Label--accent']};
const COMMIT_KIND = {init:'처음 설정', event:'사건', manual:'직접 수정'};
const TAGS = ['위협','분노','상실','권력공백','보복위협','탄압','기회','이익','동원','정체성'];

/* 성격이 영향(tags)에 얼마나 반응하는지(relevance). 실제 앱에서는 AI가 판단하는 값. */
const RELEVANCE = {"expansionism": {"기회": 0.6, "권력공백": 0.5}, "militarism": {"위협": 0.3, "동원": 0.4}, "covet_hextech": {"기회": 0.5}, "vendetta": {"분노": 0.6, "위협": 0.4}, "protect_family": {"위협": 0.6, "상실": 0.6}, "pragmatism": {"기회": 0.4, "분노": -0.3}, "diplomacy": {"분노": -0.4, "탄압": 0.3}, "peace": {"위협": 0.5, "탄압": 0.5}, "secrecy": {"위협": -0.4}, "manipulation": {"권력공백": 0.5, "기회": 0.5}, "justice": {"위협": 0.6, "분노": 0.6, "탄압": 0.3, "동원": 0.3}, "principled": {"위협": 0.3, "분노": 0.3, "동원": 0.3}, "responsibility": {"위협": 0.5, "상실": 0.5}, "idealism": {"탄압": 0.4, "상실": 0.2}, "progress": {"기회": 0.3, "위협": -0.2}, "protective": {"보복위협": 0.7, "탄압": 0.7, "위협": 0.5, "상실": 0.4}, "impulsive": {"보복위협": 0.3, "탄압": 0.3, "분노": 0.4}, "distrust_pilt": {"탄압": 0.5, "동원": -0.6}, "community": {"보복위협": 0.6, "탄압": 0.6, "위협": 0.4}, "science_obsession": {"보복위협": -0.4, "위협": -0.4, "탄압": -0.3, "기회": 0.2}, "utilitarian": {"보복위협": 0.2, "탄압": 0.2}, "instability": {"상실": 0.6, "권력공백": 0.4, "위협": 0.3}, "need_approval": {"상실": 0.5}, "survival": {"위협": 0.5, "탄압": 0.5, "보복위협": 0.5}, "individualism": {"위협": -0.2}, "resentment": {"탄압": 0.6}, "order": {"동원": 0.3, "탄압": -0.3}, "hardline": {"동원": 0.4}, "totalitarian": {"권력공백": 0.6}, "independence": {"탄압": 0.5}, "profit": {"기회": 0.5, "이익": 0.6}, "opportunism": {"기회": 0.6, "권력공백": 0.4}, "obsession": {"위협": -0.5, "탄압": -0.5, "보복위협": -0.5, "상실": -0.5}, "amorality": {"위협": -0.2, "탄압": -0.2}, "conservatism": {"위협": 0.3}, "consensus": {"위협": 0.2}, "classism": {"분노": 0.3}, "contempt": {"분노": 0.4}, "courage": {"위협": 0.5, "상실": 0.3, "탄압": 0.5}, "recklessness": {"분노": 0.4, "위협": 0.3}, "ambition": {"기회": 0.6, "권력공백": 0.4, "위협": -0.2}, "pureblood": {"탄압": -0.6, "기회": 0.4}, "cunning": {"위협": -0.3, "기회": 0.4}, "bureaucracy": {"위협": -0.2, "권력공백": 0.3}, "image": {"위협": 0.4, "분노": 0.3}, "denial": {"위협": -0.5}, "duty": {"위협": 0.5, "탄압": 0.4, "동원": 0.4}, "solidarity": {"상실": 0.7, "위협": 0.4}, "anti_dark": {"위협": 0.5, "탄압": 0.5, "상실": 0.3}, "protection": {"위협": 0.6, "상실": 0.4}, "tradition": {"상실": 0.3}, "fear_rule": {"기회": 0.3, "위협": 0.3}, "self_preservation": {"위협": 0.6, "상실": 0.4, "기회": 0.3}, "status_seeking": {"기회": 0.5, "상실": 0.4}, "loyalty_friends": {"상실": 0.6, "위협": 0.5}, "insecurity": {"위협": 0.4, "상실": 0.3}, "intellect": {"위협": -0.2}, "humor": {"상실": -0.2}, "wisdom": {"위협": -0.3}, "strategy": {"위협": -0.2}, "double_agent": {"상실": 0.3, "정체성": 0.6}, "love_lily": {"위협": 0.3}, "fanatic": {"기회": 0.7}, "fear_of_death": {"위협": 0.5}, "cruelty": {"탄압": -0.5}, "pride": {"상실": 0.3, "위협": 0.3}, "fear": {"위협": 0.8, "상실": 0.5}, "family_first": {"위협": 0.7, "상실": 0.6}, "toughness": {"위협": 0.3, "동원": 0.4}, "authoritarian": {"탄압": -0.5, "기회": 0.5, "권력공백": -0.8}, "anti_halfbreed": {"탄압": -0.6}, "hate_voldemort": {"위협": 0.4, "분노": 0.5, "상실": 0.3}, "mischief": {"위협": -0.5, "상실": -0.4, "분노": -0.3}, "shameless": {"분노": -0.5, "상실": -0.3}, "love_pretty": {"기회": 0.3}, "family_love": {"상실": 0.6, "위협": 0.6}, "salaryman_fatigue": {"상실": 0.4, "위협": 0.3}, "pushover": {"분노": -0.2, "위협": 0.3}, "strictness": {"분노": 0.4, "상실": 0.2}, "thrift": {"상실": 0.7, "기회": 0.3}, "temper": {"분노": 0.7, "상실": 0.3}, "greed_shiny": {"기회": 0.4, "상실": -0.3}, "loyalty": {"상실": 0.3, "위협": 0.3}, "patience": {"위협": -0.3, "분노": -0.4}, "elitism": {"상실": 0.6, "분노": 0.4, "기회": 0.3}, "diligence": {"상실": 0.3, "기회": 0.2}, "bossiness": {"분노": 0.5, "상실": 0.3}, "timidity": {"위협": 0.8, "분노": 0.3}, "kindness": {"상실": 0.4, "위협": 0.3}, "calm": {"위협": -0.6, "분노": -0.6, "상실": -0.5}, "dedication": {"상실": 0.4, "분노": 0.2}, "rivalry_rose": {"분노": 0.7, "상실": 0.6, "기회": 0.4}, "rivalry_sunflower": {"분노": 0.7, "상실": 0.6, "기회": 0.4}, "marriage_anxiety": {"상실": 0.3}, "misunderstood": {"위협": 0.2}, "chaos": {"위협": -0.2}, "imagination": {"위협": -0.2, "기회": 0.3}, "leadership_dispute": {"분노": 0.3}, "overwork": {"위협": 0.3}, "house_play": {"상실": 0.2}};

/* ---------- 상태 ---------- */
let state, commits;
let pending = [];      // 아직 기록에 넣지 않은 직접 수정 patches (render 때 flushPending이 바로 기록)
let analysis = null;   // 사건 분석 중인 내용
const ui = {sel:null, graphVer:'work', relFilter:'all', showMembers:true, overlay:false, cmpA:null, cmpB:null, confirm:null, open:{}};

const head = () => commits.at(-1);

/* ---------- 갈래(branch) ----------
   allCommits: 모든 갈래의 커밋(만든 순서). branches: [{id, name, head}], branchId: 지금 갈래.
   commits는 지금 갈래의 줄기(첫 커밋 → head)라서 기존 화면 코드가 그대로 쓴다. 합치기(merge)는 아직 없다. */
let allCommits=[], branches=[], branchId='main';
const byId = id => allCommits.find(c=>c.id===id);
function lineOf(id){ const out=[]; let c=byId(id), n=0; while(c && n++<5000){ out.push(c); c=c.parent?byId(c.parent):null; } return out.reverse(); }
function curBranch(){ return branches.find(b=>b.id===branchId); }
function addCommit(c){ commits.push(c); allCommits.push(c); curBranch().head=c.id; }
function setTree(cs, brs, bid){
  allCommits=cs; branches=brs?.length ? brs : [{id:'main', name:'본편', head:cs.at(-1).id}];
  branches.forEach(b=>{ if(b.id==='main' && b.name==='main') b.name='본편'; });
  branchId=branches.some(b=>b.id===bid) ? bid : branches[0].id;
  commits=lineOf(curBranch().head);
}
const snapshot = () => ({state, commits:allCommits, pending, branches, branch:branchId, layout:LAYOUT});
function all(s){ return [...s.groups, ...s.characters, ...s.background]; }
function ent(s,id){ return all(s).find(x=>x.id===id); }
function nm(s,id){ const e=ent(s,id)||ent(state,id); return e ? (e.name||e.title) : ghostName(id); }
/* 지워진 항목의 이름: 기록에 남은 추가·지우기 patch에서 찾는다 */
function ghostName(id){
  const tail='/'+id;
  for(const p of [...pending, ...allCommits.flatMap(c=>c.patches||[])].reverse()){
    const v=p.before||p.after; if(p.op!=='replace' && p.path.endsWith(tail) && v && (v.name||v.title)) return v.name||v.title;
  }
  return '지워진 항목';
}
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
const cname = id => { const c=byId(id); return c ? c.message.replace(/^사건:\s*/,'') : '지워진 시점'; };
const cnum = id => { const i=commits.findIndex(c=>c.id===id); return i<0?'':`${i+1}. `; };
function fmtDate(s){ if(!s) return '방금 전'; const d=new Date(s); return `${d.getMonth()+1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
function newId(p){ return `${p}_${Date.now().toString(36).slice(-5)}${Math.random().toString(36).slice(2,5)}`; }
function newSha(){ return Array.from({length:7},()=>'0123456789abcdef'[Math.random()*16|0]).join(''); }
function toast(t){ const el=$('#toast'); el.textContent=t; el.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>el.hidden=true,2600); }
/* 알림에 되돌리기 버튼을 붙인다 (지우기 직후 실수를 바로 무를 수 있게) */
function toastUndo(t, undo){
  const el=$('#toast'); el.innerHTML=`${esc(t)} <button type="button" class="toast-undo" id="toast-undo">되돌리기</button>`; el.hidden=false;
  clearTimeout(toast.t); toast.t=setTimeout(()=>el.hidden=true,7000);
  $('#toast-undo').onclick=()=>{ el.hidden=true; undo(); };
}
/* 받침에 맞는 조사. 받침 없을 때, 있을 때 순서: jo('르블랑','와','과') → '르블랑과' */
function jo(word, a, b){
  const w=String(word??''), c=w.charCodeAt(w.length-1);
  if(c>=0xAC00 && c<=0xD7A3){ const jong=(c-0xAC00)%28; if(b==='으로' && jong===8) return w+a; return w+(jong?b:a); }
  return `${w}${a}(${b})`;
}
/* 따옴표로 감싼 이름 + 조사: jq('용기','를','을') → "'용기'를" */
function jq(word, a, b){ const w=String(word??''); return `'${w}'${jo(w,a,b).slice(w.length)}`; }
const NAME_MAX=60;
/* 같은 이름(다른 이름 포함)을 가진 인물·단체·배경 */
function sameName(name, except){
  const k=name.trim().toLowerCase();
  return all(state).find(x=>x.id!==except && [x.name||x.title, ...(x.aliases||[])].some(n=>String(n||'').trim().toLowerCase()===k));
}
/* 서버·네트워크 오류를 작가가 읽을 수 있는 말로 */
function friendlyErr(err){
  const st=err?.status, msg=err?.body?.error;
  const korean=typeof msg==='string' && /[가-힣]/.test(msg) && msg.length<120;
  if(!st) return '인터넷 연결이 끊겼거나 서버에 닿지 못했어요. 연결을 확인하고 다시 눌러 주세요';
  if(st===401||st===403) return '로그인이 풀렸어요. 새로고침한 뒤 다시 로그인해 주세요';
  if(st===413) return '세계관이나 원고가 너무 커서 한 번에 보낼 수 없어요';
  if(st===504) return 'AI 응답이 너무 오래 걸렸어요. 조금 뒤 다시 눌러 주세요';
  if(st===503) return korean ? msg : 'AI 서버가 붐벼요. 조금 뒤 다시 눌러 주세요';
  if(korean) return msg;
  if(st>=500) return 'AI 서버에 잠시 문제가 있어요. 조금 뒤 다시 눌러 주세요';
  return '알 수 없는 문제가 생겼어요. 조금 뒤 다시 눌러 주세요';
}

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
  // 객체 속성에 붙는 add/remove (예: 소속의 active)
  if(r.obj){ if(insert) r.obj[r.key]=clone(p.op==='add'?p.after:p.before); else delete r.obj[r.key]; return; }
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
/* 아무 커밋(다른 갈래 포함) 시점의 상태: 공통 조상까지 되감고 그 커밋의 줄기를 다시 적용 */
function stateOf(id){
  const i=commits.findIndex(c=>c.id===id); if(i>-1) return stateAt(i);
  const s=stateAt(commits.length-1), tgt=lineOf(id);
  let k=0; while(k<commits.length && k<tgt.length && commits[k].id===tgt[k].id) k++;
  for(let j=commits.length-1;j>=k;j--) commits[j].patches.slice().reverse().forEach(p=>applyPatch(s,p,true));
  for(let j=k;j<tgt.length;j++) tgt[j].patches.forEach(p=>applyPatch(s,p));
  return s;
}
function switchBranch(id){
  const b=branches.find(x=>x.id===id); if(!b || id===branchId) return false;
  flushPending();
  state=stateOf(b.head); branchId=id; commits=lineOf(b.head); analysis=null;
  Object.assign(ui, {graphVer:'work', cmpA:null, cmpB:null, confirm:null, open:{}});
  return true;
}
function createBranch(fromId, name){
  flushPending();
  const id='b_'+Date.now().toString(36);
  branches.push({id, name, head:fromId, created_at:new Date().toISOString()});
  switchBranch(id); ui.treeSel=fromId;
  toast(`'${name}' 전개를 만들었어요. 이제 사건을 기록하면 이 전개에 쌓여요`);
}
function deleteBranch(id){
  branches=branches.filter(b=>b.id!==id);
  const keep=new Set(branches.flatMap(b=>lineOf(b.head).map(c=>c.id)));
  allCommits=allCommits.filter(c=>keep.has(c.id));
}
function describePath(s,path){
  const seg=path.split('/').slice(1); const [c,id]=seg; const rest=seg.slice(2).join('/');
  if(c==='relations'){ const r=ent2rel(s,id); const who=r?`${nm(s,r.from)} ↔ ${nm(s,r.to)} ${REL[r.type]?.l||''}`:id; return rest?`관계 ${who} · ${rest==='intensity'?'세기':rest==='note'?'메모':rest==='type'?'유형':rest}`:`관계 ${who}`; }
  const n=nm(s,id);
  if(c==='background') return `배경 '${n}'${rest==='content'?' 내용':rest==='title'?' 제목':rest==='category'?' 분류':''}`;
  if(!rest) return `${c==='characters'?'인물':'단체'} '${n}'`;
  if(rest==='name') return `${n} · 이름`;
  if(rest==='aliases') return `${n} · 다른 이름`;
  if(rest==='notes') return `${n} · 메모`;
  if(rest==='photo') return `${n} · 사진`;
  if(rest==='kind') return `${n} · 단체 종류`;
  if(rest==='parent') return `${n} · 상위 단체`;
  if(rest==='traits') return `${n} · 성격 목록`;
  if(rest==='situation/status') return `${n} · 상황 태그`;
  if(rest==='situation/current') return `${n} · 현재 상황`;
  if(rest==='situation/history/-') return `${n} · 상황 이력`;
  if(rest==='parent_bond') return `${n} · 상위 단체 소속감`;
  let m=rest.match(/^traits\/([^/]+)(\/value)?$/); if(m) return `${n} · 성격 '${traitLabel(s,c,id,m[1])}'`;
  m=rest.match(/^memberships\/([^/]+)$/); if(m) return `${n} · '${nm(s,m[1])}' 소속`;
  m=rest.match(/^memberships\/([^/]+)\/bond$/); if(m) return `${n} · '${nm(s,m[1])}' 소속감`;
  m=rest.match(/^memberships\/([^/]+)\/active$/); if(m) return `${n} · '${nm(s,m[1])}' 소속 활성`;
  return `${n} · ${rest}`;
}
function traitLabel(s,c,id,key){
  const e=ent(s,id)||ent(state,id); const t=e?.traits?.find(t=>t.key===key); if(t) return t.label;
  const path=`/${c}/${id}/traits/${key}`;
  const p=[...pending, ...allCommits.flatMap(x=>x.patches||[])].find(p=>p.path===path && (p.before||p.after)?.label);
  return p ? (p.before||p.after).label : '지워진 성격';
}
function ent2rel(s,id){ return s.relations.find(r=>r.id===id) || state.relations.find(r=>r.id===id); }
function showVal(v){ if(v==null) return '(없음)'; if(typeof v==='string' && v.startsWith('data:image')) return '(사진)'; if(Array.isArray(v)) return v.length?v.join(', '):'(없음)'; if(typeof v==='object' && v.group && v.bond!=null) return `소속감 ${lvOf(v.bond)}${v.role?' · '+v.role:''}`; if(typeof v==='object' && v.key && v.value!=null) return lvOf(v.value); if(typeof v==='number') return v>=0&&v<=1?lvOf(v):f2(v); if(typeof v==='boolean') return v?'예':'아니오'; if(typeof v==='object') return v.type&&REL[v.type] ? `${REL[v.type].l} · ${lvOf(v.intensity)}${v.note?' · '+v.note:''}` : (v.summary || v.title || v.name || v.label || '항목'); return v; }
function patchLines(s,p){
  const label=(p.op!=='replace' && p.path.startsWith('/relations/') && (p.after||p.before)?.from) ? `관계 ${nm(s,(p.after||p.before).from)} ↔ ${nm(s,(p.after||p.before).to)}` : describePath(s,p.path);
  if(p.op==='replace') return [['chg',`~ ${label}: ${showVal(p.before)} → ${showVal(p.after)}`]];
  if(p.op==='add' && p.path.split('/').length===3 && !p.path.startsWith('/relations/')) return [['add',`+ ${label} 추가`]];
  if(p.op==='remove' && p.path.split('/').length===3 && !p.path.startsWith('/relations/')) return [['del',`- ${{characters:'인물',groups:'단체',background:'배경'}[p.path.split('/')[1]]} '${p.before.name||p.before.title}' 지움`]];
  if(p.op==='remove') return [['del',`- ${label} 지움`]];
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

/* 직접 고친 내용은 바로 기록한다. 방금(30분 안) 만든 '세계관 직접 수정' 기록이 맨 끝이고 그 뒤로 갈라진 전개가 없으면 거기에 이어 붙인다. */
function flushPending(){
  if(!pending.length) return;
  const h=head(), now=new Date().toISOString();
  const merge = h.kind==='manual' && h.auto && Date.now()-new Date(h.updated_at||h.created_at) < 30*60e3
    && !allCommits.some(c=>c.parent===h.id) && !branches.some(b=>b.id!==branchId && b.head===h.id);
  const id = merge ? h.id : newSha();
  pending.forEach(p=>{ const m=p.path.match(/^\/(groups|characters)\/([^/]+)\//); if(!m) return;
    const e=ent(state,m[2]); if(!e?.situation?.history) return;
    const summary=describePath(state,p.path).split(' · ')[1]+(p.op==='remove'?' 지움':' 수정'); const last=e.situation.history.at(-1);
    if(last && last.commit===id && last.summary===summary) return;
    const hp={op:'add', path:`/${m[1]}/${m[2]}/situation/history/-`, after:{commit:id, summary, source:'manual'}}; applyPatch(state,hp); p.__h=hp; });
  const patches=pending.flatMap(p=>p.__h?[{op:p.op,path:p.path,before:p.before,after:p.after}, p.__h]:[{op:p.op,path:p.path,before:p.before,after:p.after}]);
  if(merge){ h.patches.push(...patches); h.updated_at=now; }
  else addCommit({id, parent:h.id, kind:'manual', auto:true, message:'세계관 직접 수정', created_at:now, updated_at:now, impacts:[], patches});
  pending=[];
}
/* 새 항목 추가 → pending (id로 가리키는 경로라 되돌리기도 그 항목만 뺀다) */
function addManual(path, obj){ const p={op:'add', path, after:clone(obj)}; pending.push(p); applyPatch(state,p); }
/* 지우기 → pending. 되살리기에 쓰도록 만든 patch를 돌려준다 */
function removeManual(path){ const before=getv(state,path); if(before===undefined) return null; const p={op:'remove', path, before:clone(before)}; pending.push(p); applyPatch(state,p); return p; }
/* 인물·단체·배경 지우기: 이어진 관계, 그 단체에 속한 인물의 소속, 하위 단체의 상위 연결도 함께 정리한다 */
function removeEntity(id){
  const c=coll(id), done=[], push=p=>{ if(p) done.push(p); };
  state.relations.filter(r=>r.from===id||r.to===id).map(r=>r.id).forEach(rid=>push(removeManual(`/relations/${rid}`)));
  if(c==='groups'){
    state.characters.filter(ch=>(ch.memberships||[]).some(m=>m.group===id)).forEach(ch=>push(removeManual(`/characters/${ch.id}/memberships/${id}`)));
    state.groups.filter(g=>g.parent===id).forEach(g=>{ done.push({op:'replace', path:`/groups/${g.id}/parent`, before:id}); setManual(`/groups/${g.id}/parent`, null); });
  }
  push(removeManual(`/${c}/${id}`));
  delete LAYOUT[id];
  return done;
}
/* 지운 것을 되살린다 (지운 순서의 반대로) */
function restore(done){ done.slice().reverse().forEach(p=>{ if(p.op==='remove') addManual(p.path, p.before); else setManual(p.path, p.before); }); }
/* gid가 anc의 하위 단체인지 (상위 단체 지정 시 순환 방지) */
function isUnder(s,gid,anc){ let g=s.groups.find(x=>x.id===gid), n=0; while(g && n++<20){ if(g.id===anc) return true; g=s.groups.find(x=>x.id===g.parent); } return false; }

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
  if(t==='graph') t='world';
  $$('[role=tab]').forEach(b=>b.setAttribute('aria-selected', b.dataset.tab===t));
  ['world','event','manuscript','history'].forEach(x=>$('#tab-'+x).hidden = x!==t);
  render(t); window.scrollTo({top:0});
}
function cur(){ return $('[role=tab][aria-selected=true]').dataset.tab; }
function render(t=cur()){
  flushPending();
  $('#world-title').textContent=DATA.meta.title; $('#world-slug').textContent=W.slug; $('#world-desc').textContent=DATA.meta.description||'';
  $('#cnt-world').textContent=state.groups.length+state.characters.length+state.background.length;
  $('#cnt-commit').textContent=commits.length;
  renderSide();
  ({world:renderWorld,event:renderEvent,manuscript:renderManuscript,history:renderHistory})[t]();
  saveWorld();
}

function pendingBanner(){ return ''; }
function wirePending(){}

/* ---------- 세계관 ---------- */
function treeGroups(s){
  const out=[]; const walkG=(pid,d)=>s.groups.filter(g=>(g.parent||null)===pid).forEach(g=>{ out.push([g,d]); walkG(g.id,d+1); });
  walkG(null,0); return out;
}
/* 왼쪽 도구창: 인물·단체·배경 목록과 추가 */
function renderSide(){
  const s=state, q=(ui.q||'').trim().toLowerCase();
  const hit=x=>!q || [x.name||x.title, ...(x.aliases||[]), x.category||''].join(' ').toLowerCase().includes(q);
  const item=(x,mark,meta,pad=0)=>`<li><button data-side="${x.id}" aria-current="${x.id===ui.sel}" style="padding-left:${8+pad*14}px">${mark}<span class="nm">${esc(x.name||x.title)}</span>${meta?`<span class="meta">${esc(meta)}</span>`:''}</button></li>`;
  const PH={chr:'새 인물 이름',grp:'새 단체 이름',bg:'새 배경 제목'};
  const addRow=key=>ui.adding===key?`<li class="side-add"><form data-addform="${key}"><input class="form-control" id="side-add-name" maxlength="${NAME_MAX}" placeholder="${PH[key]}" aria-label="${PH[key]}" autocomplete="off"><button class="btn btn-sm btn-primary" type="submit">추가</button><button class="btn btn-sm" type="button" data-addcancel>취소</button></form></li>`:'';
  const sec=(key,label,n,body)=>`<section class="side-sec"><div class="side-sec-h"><span>${label}</span><span class="Counter">${n}</span><button class="btn btn-sm" data-new="${key}" aria-expanded="${ui.adding===key}">+ ${label} 추가</button></div>
    <ul class="tree">${addRow(key)}${body||(ui.adding===key?'':`<li class="caption side-empty">${q?'찾는 항목이 없어요':'아직 없어요'}</li>`)}</ul></section>`;
  const chars=s.characters.filter(hit), grps=q?s.groups.filter(hit).map(g=>[g,0]):treeGroups(s), bgs=s.background.filter(hit);
  $('#side-list').innerHTML =
    sec('chr','인물',chars.length, chars.map(c=>item(c, c.photo?`<img class="side-photo" src="${esc(c.photo)}" alt="" style="border-color:${nationColor(nationOf(s,c))}">`:`<span class="dot" style="background:${nationColor(nationOf(s,c))}${c.situation?.status==='사망'?';opacity:.4':''}"></span>`, c.situation?.status)).join('')) +
    sec('grp','단체',grps.length, grps.map(([g,d])=>item(g,`<span class="sq" style="background:${nationColor(nationOf(s,g))}"></span>`, KIND[g.kind], d)).join('')) +
    sec('bg','배경',bgs.length, bgs.map(b=>item(b,`<span class="sq" style="background:var(--border-strong)"></span>`, b.category)).join(''));
  $$('[data-side]').forEach(b=>b.onclick=()=>pick(b.dataset.side));
  // + 추가는 목록 맨 위에 이름 칸을 연다 (브라우저 입력창 대신)
  $$('[data-new]').forEach(b=>b.onclick=()=>{ ui.adding = ui.adding===b.dataset.new ? null : b.dataset.new; renderSide(); $('#side-add-name')?.focus(); });
  $$('[data-addcancel]').forEach(b=>b.onclick=()=>{ ui.adding=null; renderSide(); });
  $$('[data-addform]').forEach(f=>{
    f.onkeydown=ev=>{ if(ev.key==='Escape'){ ev.stopPropagation(); ui.adding=null; renderSide(); } };
    f.onsubmit=ev=>{ ev.preventDefault();
      const t=f.dataset.addform, name=$('#side-add-name').value.trim().slice(0,NAME_MAX); if(!name){ toast('이름을 입력하세요'); return; }
      const dup=sameName(name); if(dup && !confirm(`${jq(dup.name||dup.title,'가','이')} 이미 있어요. 같은 이름으로 하나 더 만들까요?`)) return;
      const sit={current:'', status:'', history:[]};
      if(t==='chr'){ const id=newId('chr'); addManual(`/characters/${id}`, {id, name, aliases:[], memberships:[], traits:[], situation:sit}); ui.sel=id; }
      else if(t==='grp'){ const id=newId('grp'); addManual(`/groups/${id}`, {id, name, kind:'organization', parent:null, traits:[], situation:sit}); ui.sel=id; }
      else { const id=newId('bg'); addManual(`/background/${id}`, {id, category:'기타', title:name, content:'', introduced_in:null}); ui.sel=id; }
      ui.adding=null; ui.editing=null; ui.graphVer='work'; toast(`${jq(name,'를','을')} 추가했어요`); sideOpen(false); showTab('world'); focusDetail(); };
  });
}
/* 인물·단체·배경을 골라 오른쪽 상세 패널로 연다 */
function pick(id){
  ui.sel=id; ui.editing=null; sideOpen(false);
  if(cur()!=='world') showTab('world'); else render('world');
  focusDetail();
}
function focusDetail(){ if(window.innerWidth<1200) $('#detail')?.scrollIntoView({behavior:'smooth', block:'start'}); }
function sideOpen(open){
  $('#side').classList.toggle('open', open); $('#side-backdrop').hidden=!open;
  $('#side-toggle').setAttribute('aria-expanded', open);
}
function bgDetail(b){
  return `<div class="Subhead"><h2>${esc(b.title)}</h2><span class="Label">배경</span><span class="Label">${esc(b.category)}</span>
    ${b.introduced_in?`<span class="Label Label--done">${icon('commit')}${esc(cname(b.introduced_in))}에서 추가</span>`:''}
    <div class="actions"><button class="btn btn-sm btn-danger" id="ent-del">지우기</button></div></div>
    <div class="Box"><div class="Box-body stack">
      <div style="display:flex;gap:8px;flex-wrap:wrap"><div class="form-group" style="flex:2 1 200px"><label for="bg-title">제목</label><input class="form-control" id="bg-title" maxlength="${NAME_MAX}" value="${esc(b.title)}"></div>
        <div class="form-group" style="flex:1 1 120px"><label for="bg-cat">분류</label><input class="form-control" id="bg-cat" value="${esc(b.category)}"></div></div>
      <div class="form-group"><label for="bg-content">내용</label><textarea class="form-control" id="bg-content" rows="5">${esc(b.content)}</textarea>
      <span class="caption">배경은 지리, 역사, 기술처럼 이야기의 바탕이 되는 정보예요.</span></div>
      <div><button class="btn btn-primary" id="bg-save">저장</button></div>
    </div></div>`;
}
/* 세기는 숫자 대신 네 단계 말로 고른다 (안에서는 0.25~1 값으로 계산) */
const LEVELS=[['약함',0.25],['보통',0.5],['강함',0.75],['아주 강함',1]];
const lvOf=v=>LEVELS.reduce((a,b)=>Math.abs(b[1]-(v??0))<Math.abs(a[1]-(v??0))?b:a)[0];
function levelPick(path, v, label){
  return `<div class="lv" role="group" aria-label="${esc(label)}">${LEVELS.map(([l,x])=>`<button type="button" data-lv="${path}" data-v="${x}" aria-pressed="${lvOf(v)===l}">${l}</button>`).join('')}</div>`;
}
const levelSelect=(id, v, label)=>`<select class="form-control" id="${id}" style="width:auto" aria-label="${esc(label)}">${LEVELS.map(([l,x])=>`<option value="${x}" ${lvOf(v)===l?'selected':''}>${l}</option>`).join('')}</select>`;
const lvTag=v=>`<span class="lv-tag">${lvOf(v)}</span>`;
function traitRows(e){
  const c=coll(e.id);
  return (e.traits||[]).map(t=>`<div class="trait Box-row" style="display:grid">
    <div class="lab">${esc(t.label)} ${t.target?`<span class="Label">${icon('graph')}${esc(nm(state,t.target))}</span>`:''}${t.key.startsWith('t_')?'':`<small class="num">${esc(t.key)}</small>`}</div>
    <div class="row-end">${levelPick(`/${c}/${e.id}/traits/${t.key}/value`, t.value, t.label+' 세기')}<button type="button" class="rm" data-rmt="${esc(t.key)}" aria-label="${esc(t.label)} 성격 지우기" title="지우기">×</button></div></div>`).join('');
}
function bondRow(label, sub, path, v, goId, extra='', rm=''){
  return `<div class="trait Box-row" style="display:grid">
    <div class="lab"><button class="btn-link" data-go="${goId}">${esc(label)}</button> ${extra}${sub?`<small>${esc(sub)}</small>`:''}</div>
    <div class="row-end">${levelPick(path, v, label+' 소속감')}${rm}</div></div>`;
}
function editBox(e){
  const s=state, isG=e.id.startsWith('grp_');
  return `<div class="Box" style="margin-bottom:16px"><div class="Box-header"><h3>기본 정보 수정</h3><span class="caption right">고치면 바로 저장돼요</span></div><div class="Box-body stack">
    <div class="form-group"><label for="ed-name">이름</label><input class="form-control" id="ed-name" maxlength="${NAME_MAX}" value="${esc(e.name)}"></div>
    ${isG?`<div style="display:flex;gap:8px;flex-wrap:wrap">
      <div class="form-group" style="flex:1 1 140px"><label for="ed-kind">종류</label><select class="form-control" id="ed-kind">${Object.entries(KIND).map(([k,l])=>`<option value="${k}" ${e.kind===k?'selected':''}>${l}</option>`).join('')}</select></div>
      <div class="form-group" style="flex:1 1 180px"><label for="ed-parent">상위 단체</label><select class="form-control" id="ed-parent"><option value="">없음 (최상위)</option>${s.groups.filter(g=>!isUnder(s,g.id,e.id)).map(g=>`<option value="${g.id}" ${e.parent===g.id?'selected':''}>${esc(g.name)}</option>`).join('')}</select></div></div>`
    :`<div class="form-group"><label for="ed-alias">다른 이름 (쉼표로 구분)</label><input class="form-control" id="ed-alias" value="${esc((e.aliases||[]).join(', '))}"></div>`}
    <div style="display:flex;gap:8px"><button class="btn btn-primary" id="ed-save">저장</button><button class="btn" id="ed-cancel">취소</button></div>
  </div></div>`;
}
function addRelRow(e){
  const others=[...state.groups,...state.characters].filter(x=>x.id!==e.id);
  if(!others.length) return '';
  return `<div class="Box-row" style="flex-wrap:wrap;gap:8px;background:var(--bg-subtle)">
    <select class="form-control" id="rel-to" style="flex:1 1 130px;width:auto" aria-label="관계 대상">${others.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join('')}</select>
    <select class="form-control" id="rel-type" style="width:auto" aria-label="관계 유형">${Object.entries(REL).map(([k,R])=>`<option value="${k}">${R.l}</option>`).join('')}</select>
    ${levelSelect('rel-int',0.5,'관계 세기')}
    <input class="form-control" id="rel-note" placeholder="메모 (선택)" style="flex:1 1 120px;width:auto" aria-label="메모">
    <button class="btn btn-sm" id="rel-add">+ 관계 추가</button></div>`;
}
function wireEntityEdit(e){
  const c=coll(e.id), base=`/${c}/${e.id}`;
  const done=msg=>{ toast(msg); render('world'); };
  $('#ent-edit').onclick=()=>{ ui.editing = ui.editing===e.id?null:e.id; render('world'); if(ui.editing) $('#ed-name')?.focus(); };
  const cc=$('#ed-cancel'); if(cc) cc.onclick=()=>{ ui.editing=null; render('world'); };
  const sv=$('#ed-save'); if(sv) sv.onclick=()=>{
    const name=$('#ed-name').value.trim().slice(0,NAME_MAX); if(!name){ toast('이름을 입력하세요'); return; }
    const dup=name!==e.name && sameName(name, e.id); if(dup && !confirm(`${jq(dup.name||dup.title,'가','이')} 이미 있어요. 그래도 이 이름으로 바꿀까요?`)) return;
    const before=pending.length;
    setManual(base+'/name', name);
    const al=$('#ed-alias'); if(al){ const v=al.value.split(',').map(x=>x.trim()).filter(Boolean); if(v.length || e.aliases?.length) setManual(base+'/aliases', v); }
    const kd=$('#ed-kind'); if(kd) setManual(base+'/kind', kd.value);
    const pr=$('#ed-parent'); if(pr) setManual(base+'/parent', pr.value||null);
    ui.editing=null; done(pending.length!==before||pending.length?'저장했어요':'바뀐 내용이 없어요');
  };
  const ta=$('#tr-add'); if(ta) ta.onclick=()=>{
    const label=$('#tr-label').value.trim(); if(!label){ toast('성격 이름을 입력하세요'); return; }
    if(!e.traits) setManual(base+'/traits', []);
    const key='t_'+Date.now().toString(36);
    addManual(`${base}/traits/${key}`, {key, label, value:Math.round(clamp(+$('#tr-val').value||0,0,1)*100)/100});
    done(`성격 ${jq(label,'를','을')} 담았어요`);
  };
  const ma=$('#mem-add'); if(ma) ma.onclick=()=>{
    const g=$('#mem-group').value, role=$('#mem-role').value.trim();
    const m={group:g, bond:Math.round(clamp(+$('#mem-bond').value||0,0,1)*100)/100}; if(role) m.role=role;
    addManual(`${base}/memberships/${g}`, m); done(`'${nm(state,g)}' 소속을 담았어요`);
  };
  const ra=$('#rel-add'); if(ra) ra.onclick=()=>{
    const id=newId('rel'), to=$('#rel-to').value, note=$('#rel-note').value.trim();
    const r={id, from:e.id, to, type:$('#rel-type').value, intensity:Math.round(clamp(+$('#rel-int').value||0,0,1)*100)/100}; if(note) r.note=note;
    addManual(`/relations/${id}`, r); done(`${jo(nm(state,to),'와','과')}의 관계를 담았어요`);
  };
}
function entityDetail(e){
  const s=state, isG=e.id.startsWith('grp_'), c=coll(e.id), sit=e.situation||{history:[]};
  const nat=nationOf(s,e);
  const rels=s.relations.filter(r=>r.from===e.id||r.to===e.id);
  let belong='';
  if(isG){
    const subs=s.groups.filter(g=>g.parent===e.id);
    const members=s.characters.flatMap(ch=>(ch.memberships||[]).filter(m=>m.group===e.id).map(m=>({ch,m})));
    belong = `<div class="Box"><div class="Box-header"><h3>소속</h3><span class="caption right">소속감이 클수록 단체가 받은 영향이 크게 전해져요</span></div>
      ${e.parent?bondRow(nm(s,e.parent),'상위 단체',`/groups/${e.id}/parent_bond`,e.parent_bond??0.6,e.parent):'<div class="Box-row caption">최상위 단체입니다.</div>'}</div>
      <div class="Box"><div class="Box-header"><h3>하위 단체 · 구성원</h3><span class="Counter">${subs.length+members.length}</span></div>
      ${subs.map(g=>`<div class="Box-row"><span class="sq" style="background:${nationColor(nat)}"></span><button class="btn-link" data-go="${g.id}">${esc(g.name)}</button><span class="Label">${KIND[g.kind]}</span><span style="margin-left:auto">${lvTag(g.parent_bond??0.6)}</span></div>`).join('')}
      ${members.map(({ch,m})=>`<div class="Box-row"><span class="dot" style="background:${nationColor(nationOf(s,ch))}"></span><button class="btn-link" data-go="${ch.id}">${esc(ch.name)}</button>${m.role?`<span class="caption">${esc(m.role)}</span>`:''}${m.active===false?'<span class="Label">비활성</span>':''}<span style="margin-left:auto">${lvTag(m.bond)}</span></div>`).join('') || ''}
      ${!subs.length&&!members.length?'<div class="Box-row caption">아직 없습니다.</div>':''}</div>`;
  } else {
    belong = `<div class="Box"><div class="Box-header"><h3>소속</h3><span class="Counter">${e.memberships.length}</span><span class="caption right">소속감이 클수록 단체가 받은 영향이 크게 전해져요</span></div>
      ${e.memberships.map(m=>bondRow(nm(s,m.group), m.role, `/characters/${e.id}/memberships/${m.group}/bond`, m.bond, m.group, m.active===false?'<span class="Label">비활성</span>':'', `<button type="button" class="rm" data-rmm="${m.group}" aria-label="${esc(nm(s,m.group))} 소속 지우기" title="지우기">×</button>`)).join('')}
      ${(()=>{ const cand=s.groups.filter(g=>!e.memberships.some(m=>m.group===g.id)); return cand.length?`<div class="Box-row" style="flex-wrap:wrap;gap:8px;background:var(--bg-subtle)"><select class="form-control" id="mem-group" style="flex:1 1 140px;width:auto" aria-label="소속 단체">${cand.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select><input class="form-control" id="mem-role" placeholder="역할 (선택)" style="flex:1 1 110px;width:auto" aria-label="역할">${levelSelect('mem-bond',0.75,'소속감')}<button class="btn btn-sm" id="mem-add">+ 소속 추가</button></div>`:`<div class="Box-row caption">${s.groups.length?'추가할 수 있는 단체가 더 없어요.':'소속을 추가하려면 먼저 단체를 만드세요.'}</div>`; })()}</div>`;
  }
  return `<div class="Subhead">${e.photo?`<img class="ent-photo" src="${esc(e.photo)}" alt="${esc(e.name)} 사진">`:''}<h2>${esc(e.name)}</h2>
      ${isG?`<span class="Label">${KIND[e.kind]}</span>`:'<span class="Label">인물</span>'}
      ${nat&&nat!==e.id?`<span class="Label" style="color:${nationColor(nat)};border-color:${nationColor(nat)}">${esc(nm(s,nat))}</span>`:''}
      ${e.aliases?.length?`<span class="caption">다른 이름: ${esc(e.aliases.join(', '))}</span>`:''}
      <div class="actions"><button class="btn btn-sm" id="ent-edit" aria-pressed="${ui.editing===e.id}">이름·기본 정보 수정</button>
        <label class="btn btn-sm">${e.photo?'사진 바꾸기':'사진 넣기'}<input type="file" accept="image/*" id="ent-photo" hidden></label>${e.photo?'<button class="btn btn-sm" id="ent-photo-del">사진 빼기</button>':''}<button class="btn btn-sm btn-danger" id="ent-del">지우기</button></div></div>
    ${ui.editing===e.id?editBox(e):''}
    <div class="cols2">
      <div class="stack">
        <div class="Box"><div class="Box-header"><h3>메모</h3><span class="caption right">다른 곳을 누르면 저장돼요</span></div>
          <div class="Box-body"><textarea class="form-control" id="ent-notes" rows="4" placeholder="${isG?'목표, 세력 규모, 근거지, 숨은 사정 등 자유롭게 적어요':'외모, 나이, 말투, 목표, 비밀 등 자유롭게 적어요'}">${esc(e.notes||'')}</textarea></div></div>
        <div class="Box"><div class="Box-header"><h3>상황</h3>${sit.status?`<span class="Label ${statusCls(sit.status)}">${esc(sit.status)}</span>`:''}</div>
          <div class="Box-body stack">
            <div class="form-group"><label for="sit-current">현재</label><textarea class="form-control" id="sit-current" rows="3">${esc(sit.current)}</textarea></div>
            <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap"><div class="form-group" style="flex:1 1 140px"><label for="sit-status">상황 태그</label><input class="form-control" id="sit-status" value="${esc(sit.status)}"></div>
              <button class="btn" id="sit-save">저장</button></div>
            <div><div style="font-weight:600;margin-bottom:8px">이력 <span class="Counter">${sit.history.length}</span></div>
            ${sit.history.length?`<ul class="log">${sit.history.slice().reverse().map(h=>`<li class="${h.source||''}">
              <div>${esc(h.summary)}</div>
              <div class="meta"><span>${esc(cname(h.commit))}</span>${h.source?`<span class="Label ${SRC[h.source][1]}">${SRC[h.source][0]}</span>`:''}
              ${h.via?`<span>${esc(nm(s,h.via))} 경유</span>`:''}${h.weight!=null?`<span class="num ${h.weight<0?'neg':'pos'}">${h.weight<0?'피해':'이득'} ${lvOf(Math.abs(h.weight))}</span>`:''}</div></li>`).join('')}</ul>`:'<span class="caption">아직 이력이 없습니다.</span>'}</div>
          </div></div>
        <div class="Box"><div class="Box-header"><h3>관계</h3><span class="Counter">${rels.length}</span></div>
          ${rels.map(r=>{const o=r.from===e.id?r.to:r.from; const R=REL[r.type]||REL.personal; return `<div class="Box-row"><i style="display:inline-block;width:18px;border-top:2px ${R.dash?'dashed':'solid'} ${R.c}"></i>
            <div style="flex:1;min-width:0"><button class="btn-link" data-go="${o}">${esc(nm(s,o))}</button>${r.note?`<div class="caption">${esc(r.note)}</div>`:''}</div>
            <span class="Label" style="color:${R.c};border-color:${R.c}">${R.l}${r.directed?(r.from===e.id?' →':' ←'):''}</span>
            <div class="rel-lv row-end">${levelPick(`/relations/${r.id}/intensity`, r.intensity, nm(s,o)+' 관계 세기')}<button type="button" class="rm" data-rmr="${r.id}" aria-label="${esc(nm(s,o))} 관계 지우기" title="지우기">×</button></div></div>`}).join('') || '<div class="Box-row caption">관계가 없습니다.</div>'}
          ${addRelRow(e)}
        </div>
      </div>
      <div class="stack">
        <div class="Box"><div class="Box-header"><h3>성격</h3><span class="Counter">${(e.traits||[]).length}</span><span class="caption right">성격마다 세기를 골라요</span></div>${traitRows(e)}
          <div class="Box-row" style="flex-wrap:wrap;gap:8px;background:var(--bg-subtle)"><input class="form-control" id="tr-label" placeholder="새 성격 (예: 복수심)" style="flex:1 1 150px;width:auto" aria-label="새 성격 이름">${levelSelect('tr-val',0.75,'성격 세기')}<button class="btn btn-sm" id="tr-add">+ 성격 추가</button></div></div>
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
/* AI에 보낼 세계관 요약 (이력은 빼고 현재 상태만) */
/* AI에 보낼 세계관 요약. 사건에 이름이 나온 단체·인물과 그 주변(소속·구성원·상하위 단체)만 보낸다.
   이름이 하나도 안 나오면 전체를 보낸다. 이력은 빼고 현재 상태만. 전파 계산은 브라우저가 전체 상태로 한다. */
function worldForAi(text='', s=state){
  const tr=e=>(e.traits||[]).map(t=>({key:t.key,label:t.label,value:t.value}));
  const sit=e=>({current:e.situation?.current, status:e.situation?.status});
  const hit=e=>text.includes(e.name) || (e.aliases||[]).some(a=>a && text.includes(a));
  let gs=s.groups, cs=s.characters;
  const seeds=[...s.groups,...s.characters].filter(hit).map(e=>e.id);
  if(seeds.length){
    const ids=new Set(seeds);
    s.characters.filter(c=>ids.has(c.id)).forEach(c=>(c.memberships||[]).forEach(m=>ids.add(m.group)));
    s.groups.filter(g=>ids.has(g.id)).forEach(g=>{ if(g.parent) ids.add(g.parent); });
    const grp=new Set([...ids].filter(id=>id.startsWith('grp_')));
    s.groups.forEach(g=>{ if(g.parent && grp.has(g.parent)) ids.add(g.id); });
    s.characters.forEach(c=>{ if((c.memberships||[]).some(m=>grp.has(m.group))) ids.add(c.id); });
    gs=s.groups.filter(g=>ids.has(g.id)); cs=s.characters.filter(c=>ids.has(c.id));
  }
  const ids=new Set([...gs,...cs].map(e=>e.id));
  const keys=new Set(); [...gs,...cs].forEach(e=>(e.traits||[]).forEach(t=>{ if(!RELEVANCE[t.key]) keys.add(t.key); }));
  return {
    title:DATA.meta.title,
    background:(s.background||[]).map(b=>({title:b.title, content:b.content})),
    groups:gs.map(g=>({id:g.id, name:g.name, parent:g.parent, traits:tr(g), situation:sit(g)})),
    characters:cs.map(c=>({id:c.id, name:c.name, aliases:c.aliases, memberships:(c.memberships||[]).map(m=>({group:m.group, role:m.role, bond:m.bond})), traits:tr(c), situation:sit(c)})),
    relations:s.relations.filter(r=>ids.has(r.from)&&ids.has(r.to)).map(r=>({id:r.id, from:r.from, to:r.to, type:r.type, intensity:r.intensity, note:r.note})),
    unscored_traits:[...keys]
  };
}
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
function evPosition(){
  const recent=commits.slice(-3), skip=commits.length-recent.length;
  return `<div class="Box"><div class="Box-header"><h3>이 사건이 들어갈 자리</h3>${branches.length>1?`<span class="Label">${esc(curBranch().name)}</span>`:''}</div>
    <ol class="ev-pos">${skip?`<li class="more">앞선 사건 ${skip}개</li>`:''}
      ${recent.map(c=>`<li><span class="n">${cnum(c.id).replace('. ','')}</span><div><div>${esc(cname(c.id))}</div>${c.event?.story_time?`<div class="caption">${esc(c.event.story_time)}</div>`:''}</div></li>`).join('')}
      <li class="here"><span class="n">${commits.length+1}</span><div><div id="ev-pos-title">${esc(analysis?.title || ui.evDraft?.title || '새 사건')}</div><div class="caption">새 사건이 여기에 들어가요</div></div></li></ol>
    <div class="Box-row caption">더 앞 시점에 넣고 싶으면 버전 기록에서 그 사건을 고르고 '만약에' 전개를 만들어 주세요.</div></div>`;
}
function renderEvent(){
  const blocked=pending.length>0;
  $('#tab-event').innerHTML = pendingBanner() + `
  <div class="Subhead"><h2>새 사건</h2><span class="muted">${branches.length>1?`'${esc(curBranch().name)}' 전개 · `:''}'${esc(cname(head().id))}' 다음에 이어집니다</span></div>
  <div class="split-r">
    <div class="stack">
      ${evPosition()}
      <div class="Box"><div class="Box-body stack">
        <div class="form-group"><label for="ev-title">사건 제목</label><input class="form-control" id="ev-title" value="${esc(analysis?.title ?? ui.evDraft?.title ?? '')}" placeholder="예: ${esc(SAMPLE.title||'왕국에 전쟁이 선포된다')}"></div>
        <div class="form-group"><label for="ev-text">무슨 일이 일어나나요?</label><textarea class="form-control" id="ev-text" rows="3" placeholder="누가 무엇을 했고, 어떤 단체와 인물이 엮이는지 적어 주세요">${esc(analysis?.description ?? ui.evDraft?.description ?? '')}</textarea></div>
        <div class="form-group" style="max-width:260px"><label for="ev-time">작중 시점</label><input class="form-control" id="ev-time" value="${esc(analysis?.story_time ?? ui.evDraft?.story_time ?? '')}" placeholder="예: ${esc(SAMPLE.story_time||'2부 초반')}"></div>
        <div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn btn-primary" id="ev-run">${icon('spark')}AI 영향 분석</button>${W.sample?'<button class="btn" id="ev-sample">예시 사건 넣기</button>':''}</div>
      </div></div>
      <div id="ev-result" class="stack"></div>
    </div>
    <aside class="stack">
      <div class="Box"><div class="Box-header"><h3>영향은 이렇게 퍼져요</h3></div>
        <div class="Box-body stack" style="gap:10px">
          <p style="margin:0">사건은 먼저 단체에 영향을 주고, 소속을 따라 하위 단체와 구성원에게 퍼져요. 소속감이 클수록, 그 영향에 민감한 성격일수록 더 크게 받아요.</p>
          <details class="calc"><summary>계산 방식 자세히</summary>
          <div style="font-family:var(--mono);font-size:13px;padding:8px 12px;background:var(--bg-subtle);border-radius:6px;margin-top:8px">최종 영향 = 단체가 받은 영향 × 소속감 × 성격 배율<br><span class="muted">성격 배율 = 1 + Σ(성격 세기 × 반응)</span></div>
          <dl class="kv"><dt>단체가 받은 영향</dt><dd>−1 피해 ~ +1 이득</dd><dt>소속감</dt><dd>인물이 단체에, 하위 단체가 상위 단체에 얼마나 묶여 있는지</dd><dt>반응</dt><dd>이 성격이 위협, 기회 같은 영향에 얼마나 반응하는지 (AI 판단, −1~1)</dd></dl>
          <div class="caption">성격 배율은 −1~2, 최종 영향은 −1~1 안으로 맞춰요. 배율이 음수면 영향이 뒤집혀요. 여러 경로로 받으면 가장 큰 쪽을 써요.</div>
          <div class="caption">어떤 성격이 얼마나 반응하는지와 상황 문장은 AI가 정하고, 숫자 계산은 앱이 해요.</div></details>
          <div class="summary-tiles"><span><b>약함</b>변화 없음</span><span><b>보통</b>이력 한 줄</span><span><b>강함</b>상황 다시 쓰기</span></div>
        </div></div>
    </aside>
  </div>`;
  const evs=$('#ev-sample'); if(evs) evs.onclick=()=>{ $('#ev-title').value=SAMPLE.title; $('#ev-text').value=SAMPLE.description; $('#ev-time').value=SAMPLE.story_time; $('#ev-pos-title').textContent=SAMPLE.title; };
  $('#ev-title').oninput=e=>{ $('#ev-pos-title').textContent=e.target.value.trim()||'새 사건'; };
  $('#ev-run').onclick=async ()=>{
    const text=$('#ev-text').value.trim(), time=$('#ev-time').value.trim();
    // 제목을 비우면 내용 앞부분을 이름으로 쓴다 (타임라인에 '새 사건'만 줄줄이 생기지 않게)
    const title=$('#ev-title').value.trim() || (text.length>18 ? text.slice(0,18).trim()+'…' : text) || '새 사건';
    if(!text){ $('#ev-result').innerHTML=`<div class="flash flash-warn">${icon('alert')}<div>사건 내용을 입력하세요.</div></div>`; return; }
    const btn=$('#ev-run'); btn.disabled=true;
    $('#ev-result').innerHTML=`<div class="Box"><div class="Box-body" style="display:flex;gap:8px;align-items:center"><div class="spinner"></div><span class="muted">AI가 사건이 단체·인물에 주는 직접 영향을 판단하고 있습니다 <span id="ev-wait"></span></span></div></div>`;
    const t0=Date.now(), tick=setInterval(()=>{ const w=$('#ev-wait'), s=Math.round((Date.now()-t0)/1000); if(w) w.textContent=`· ${s}초`+(s>=25?' (AI 서버가 붐벼 다른 모델로 다시 시도하는 중이에요)':''); },1000);
    let a, note='';
    try{
      const r=await analyzeEvent({title, description:text, story_time:time}, worldForAi(title+' '+text));
      a=r.analysis; Object.entries(a.relevance||{}).forEach(([k,v])=>{ RELEVANCE[k]={...(RELEVANCE[k]||{}), ...v}; });
      showUsage(r.usage); toast(`AI 분석 완료 (${r.provider==='claude'?'Claude':'Gemini'}) · 토큰 ${r.tokens.toLocaleString()} 사용`);
      if(!a.direct.length) note='AI가 직접 영향을 받는 대상을 찾지 못했습니다. 사건에 단체나 인물 이름을 넣어 보세요.';
    }catch(err){
      console.warn('AI 분석 실패', err);
      if(err.status===429){ if(err.body?.usage) showUsage(err.body.usage); note='오늘 쓸 수 있는 토큰을 다 썼어요. 한국 시간 자정에 다시 채워집니다. (충전 기능은 준비 중)'; }
      else note=`AI 분석을 쓸 수 없어 간단 추정으로 대신했어요. ${friendlyErr(err)}.`;
      a = (title===SAMPLE.title) ? {...clone(SAMPLE), description:text} : guessAnalysis(title, text);
    }
    clearInterval(tick); btn.disabled=false;
    analysis=a; analysis.story_time=time; drawAnalysis();
    if(note) $('#ev-result').insertAdjacentHTML('afterbegin', `<div class="flash flash-warn">${icon('alert')}<div>${esc(note)}</div></div>`);
  };
  if(analysis) drawAnalysis();
  wirePending();
}
function drawAnalysis(){
  const a=analysis, box=$('#ev-result'); if(!box) return;
  const cand=[...state.groups, ...state.characters].filter(e=>!a.direct.some(d=>d.target===e.id));
  box.innerHTML = `
  <div class="Box">
    <div class="Box-header"><span class="step-badge">1</span><h3>직접 영향</h3><span class="ai-badge">${icon('spark')}AI 판단</span><span class="caption right">영향 크기와 태그는 고칠 수 있어요</span></div>
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
    ${rows.length?`<div class="tbl-wrap"><table class="tbl"><thead><tr><th>대상</th><th>경로</th><th class="r">단체 영향</th><th class="r">소속감</th><th>성격 반응</th><th class="r">배율</th><th class="r">최종 영향</th><th></th><th>판정</th></tr></thead><tbody>
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
  $('#commit-box').innerHTML = `<div class="Box-header"><h3>기록될 변경</h3><div class="summary-tiles right"><span><b class="neg">${cnt.big}</b>큰 변화</span><span><b>${cnt.minor}</b>경미</span><span><b class="muted">${cnt.none}</b>변화 없음</span></div></div>
    <div class="Box-body stack" style="gap:4px">${patches.length?patches.flatMap(p=>patchLines(state,p)).map(([c,l])=>`<span class="diffline ${c}">${esc(l)}</span>`).join(''):'<span class="caption">반영될 변경이 없습니다.</span>'}</div>
    <div class="Box-row" style="background:var(--bg-subtle);flex-wrap:wrap">
      <input class="form-control" id="ev-msg" style="flex:1 1 240px;width:auto" value="사건: ${esc(a.title)}" aria-label="기록 이름">
      <button class="btn" id="ev-preview">${icon('graph')}관계도에서 미리보기</button>
      <button class="btn btn-primary" id="ev-commit" ${pending.length||!patches.length?'disabled':''}>${icon('commit')}사건 기록하기</button>
    </div>`;
  $('#ev-preview').onclick=()=>{ ui.graphVer='preview'; showTab('graph'); };
  $('#ev-commit').onclick=()=>{
    const id=newSha(); const ps=buildPatches(a,id); const {items:its}=finals(a);
    ps.forEach(p=>applyPatch(state,p));
    addCommit({id, parent:head().id, kind:'event', message:$('#ev-msg').value.trim()||'사건: '+a.title, created_at:new Date().toISOString(),
      event:{title:a.title, description:a.description, story_time:a.story_time, involved:a.direct.map(d=>d.target)},
      impacts:its.map(it=>({target:it.target, source:it.source, via:it.via, tags:it.tags, magnitude:Math.round(it.w*100)/100, summary:it.summary||''})), patches:ps});
    analysis=null; ui.evDraft=null; ui.graphVer='work'; ui.open={[id]:true}; toast(`'${cname(id)}' 사건을 기록했어요 · 변경 ${ps.length}건`); showTab('history');
  };
}

/* ---------- 원고 붙여넣기 ----------
   원고 한 화를 AI가 읽고 새 인물·단체, 상황 변화, 새 관계, 사건 후보를 뽑는다. 체크한 것만 수동 수정으로 담고,
   사건 후보는 사건 입력 탭으로 보내 하나씩 분석한다. 원고 원문은 저장하지 않는다(이 화면에만 둔다). */
const MS_MAX=12000;
let msText='', msResult=null;
function renderManuscript(){
  $('#tab-manuscript').innerHTML = pendingBanner() + `<div class="Subhead"><h2>원고 붙여넣기</h2><span class="muted">한 화씩 붙여넣으면 AI가 설정에 반영할 후보를 골라줘요</span></div>
  <div class="split-r"><div class="stack">
    <div class="Box"><div class="Box-body stack">
      <div class="form-group"><label for="ms-text">원고 한 화 (최대 ${MS_MAX.toLocaleString()}자)</label>
        <textarea class="form-control" id="ms-text" rows="10" maxlength="${MS_MAX}" placeholder="여기에 원고를 붙여넣으세요">${esc(msText)}</textarea><span class="caption" id="ms-count"></span></div>
      <div><button class="btn btn-primary" id="ms-run">${icon('spark')}AI로 읽기</button></div>
    </div></div>
    <div id="ms-result" class="stack"></div>
  </div>
  <aside class="stack"><div class="Box"><div class="Box-header"><h3>이렇게 반영돼요</h3></div><div class="Box-body stack" style="gap:8px">
    <div>1. AI가 새 인물·단체, 상황이 바뀐 인물, 새 관계, 큰 사건을 후보로 골라요.</div>
    <div>2. 체크한 후보만 세계관에 반영되고 바로 저장돼요.</div>
    <div>3. 사건 후보는 사건 입력 탭으로 보내 영향 분석을 따로 해요.</div>
    <div class="caption">이미 있는 이름이나 다른 이름과 겹치는 인물은 새로 만들지 않아요. 원고 원문은 저장하지 않아요.</div>
  </div></div></aside></div>`;
  const ta=$('#ms-text'), cnt=()=>{ $('#ms-count').textContent=`${ta.value.length.toLocaleString()} / ${MS_MAX.toLocaleString()}자`; };
  ta.oninput=()=>{ msText=ta.value; cnt(); }; cnt();
  $('#ms-run').onclick=async ()=>{
    const text=ta.value.trim(); if(!text){ toast('원고를 붙여넣으세요'); return; }
    const btn=$('#ms-run'); btn.disabled=true; let note='';
    $('#ms-result').innerHTML=`<div class="Box"><div class="Box-body" style="display:flex;gap:8px;align-items:center"><div class="spinner"></div><span class="muted">AI가 원고를 읽고 있어요 <span id="ms-wait"></span></span></div></div>`;
    const t0=Date.now(), tick=setInterval(()=>{ const w=$('#ms-wait'), sec=Math.round((Date.now()-t0)/1000); if(w) w.textContent=`· ${sec}초`; },1000);
    try{
      // 겹치는 인물을 걸러야 하니 세계관 전체를 보낸다
      const r=await extractManuscript(text, worldForAi(''));
      // 이미 있는 이름은 기본으로 체크를 끄고 '이미 있어요'로 표시한다
      const on=a=>a.map(x=>({...x, on:true})), known=a=>a.map(x=>sameName(x.name)?{...x, on:false, dup:true}:{...x, on:true});
      msResult={characters:known(r.result.characters), groups:known(r.result.groups), updates:on(r.result.updates), relations:on(r.result.relations), events:r.result.events};
      showUsage(r.usage); toast(`원고 읽기 완료 (${r.provider==='claude'?'Claude':'Gemini'}) · 토큰 ${r.tokens.toLocaleString()} 사용`);
    }catch(err){
      console.warn('원고 읽기 실패', err); msResult=null;
      if(err.status===429){ if(err.body?.usage) showUsage(err.body.usage); note='오늘 쓸 수 있는 토큰을 다 썼어요. 한국 시간 자정에 다시 채워집니다.'; }
      else note=`원고를 읽지 못했어요. ${friendlyErr(err)}.`;
    }
    clearInterval(tick); btn.disabled=false; drawMs();
    if(note) $('#ms-result').innerHTML=`<div class="flash flash-warn">${icon('alert')}<div>${esc(note)}</div></div>`;
  };
  if(msResult) drawMs();
  wirePending();
}
function drawMs(){
  const r=msResult, box=$('#ms-result'); if(!box||!r) return;
  const who=x=>ent(state,x)?nm(state,x):x;
  const row=(k,i,x,body)=>`<label class="Box-row" style="cursor:pointer;align-items:flex-start"><input type="checkbox" data-ms="${k}|${i}" ${x.on?'checked':''} style="margin-top:4px"><div style="flex:1;min-width:0">${body}</div></label>`;
  const sec=(k,title,items,fn)=>items.length?`<div class="Box"><div class="Box-header"><h3>${title}</h3><span class="Counter">${items.length}</span></div>${items.map((x,i)=>row(k,i,x,fn(x))).join('')}</div>`:'';
  const total=['characters','groups','updates','relations'].reduce((a,k)=>a+r[k].length,0);
  const picked=['characters','groups','updates','relations'].reduce((a,k)=>a+r[k].filter(x=>x.on).length,0);
  box.innerHTML = (total||r.events.length ? '' : '<div class="Box"><div class="Box-body caption">반영할 만한 새 내용을 찾지 못했어요.</div></div>')
    + sec('characters','새 인물',r.characters,c=>`<b>${esc(c.name)}</b>${c.dup?' <span class="Label Label--attention">이미 있어요</span>':''}${c.aliases.length?` <span class="caption">(${esc(c.aliases.join(', '))})</span>`:''}${c.group?` <span class="Label">${esc(who(c.group))}${c.role?' · '+esc(c.role):''}</span>`:''}<div class="caption">${esc(c.summary)}</div>`)
    + sec('groups','새 단체',r.groups,g=>`<b>${esc(g.name)}</b>${g.dup?' <span class="Label Label--attention">이미 있어요</span>':''} <span class="Label">${KIND[g.kind]||'조직'}</span>${g.parent?` <span class="caption">${esc(ent(state,g.parent)?nm(state,g.parent):g.parent)} 소속</span>`:''}<div class="caption">${esc(g.summary)}</div>`)
    + sec('updates','상황 변화',r.updates,u=>{ const e=ent(state,u.id); return `<b>${esc(nm(state,u.id))}</b> <span class="Label Label--attention">${esc(u.status)}</span><div class="diffline del" style="margin-top:4px">- ${esc(e?.situation?.current||'(없음)')}</div><div class="diffline add">+ ${esc(u.text)}</div>`; })
    + sec('relations','새 관계',r.relations,x=>{ const R=REL[x.type]||REL.personal; return `<b>${esc(who(x.from))}</b> ↔ <b>${esc(who(x.to))}</b> <span class="Label" style="color:${R.c};border-color:${R.c}">${R.l} · ${lvOf(x.intensity)}</span>${x.note?`<div class="caption">${esc(x.note)}</div>`:''}`; })
    + (total?`<div class="Box"><div class="Box-row" style="background:var(--bg-subtle);flex-wrap:wrap"><span class="caption" style="flex:1">${picked}개 선택됨. 새 인물이 들어간 관계는 그 인물도 체크해야 담겨요.</span><button class="btn btn-primary" id="ms-apply" ${picked?'':'disabled'}>선택한 후보 반영</button></div></div>`:'')
    + (r.events.length?`<div class="Box"><div class="Box-header"><h3>사건 후보</h3><span class="Counter">${r.events.length}</span><span class="caption right">하나씩 영향 분석해요</span></div>
      ${r.events.map((e,i)=>`<div class="Box-row" style="align-items:flex-start;flex-wrap:wrap"><div style="flex:1 1 220px;min-width:0"><b>${esc(e.title)}</b>${e.story_time?` <span class="caption">${esc(e.story_time)}</span>`:''}<div class="caption">${esc(e.description)}</div></div>
        <button class="btn btn-sm" data-msev="${i}">${icon('bolt')}사건 입력으로 보내기</button></div>`).join('')}</div>`:'');
  $$('[data-ms]').forEach(c=>c.onchange=()=>{ const [k,i]=c.dataset.ms.split('|'); r[k][i].on=c.checked; drawMs(); });
  $$('[data-msev]').forEach(b=>b.onclick=()=>{
    ui.evDraft=r.events[+b.dataset.msev]; analysis=null; showTab('event'); });
  const ap=$('#ms-apply'); if(ap) ap.onclick=applyMs;
}
function applyMs(){
  const r=msResult, made={}; let n=0;
  // AI는 id 또는 이름으로 가리킨다: 있는 id, 이번에 만든 이름, 이미 있는 이름 순으로 찾는다
  const idOf=x=>!x?null:ent(state,x)?x:made[x]||sameName(x)?.id||null;
  const gs=r.groups.filter(g=>g.on); gs.forEach(g=>{ made[g.name]=newId('grp'); });
  gs.forEach(g=>{ const id=made[g.name]; n++; const par=idOf(g.parent);
    addManual(`/groups/${id}`, {id, name:g.name, kind:KIND[g.kind]?g.kind:'organization', parent:par&&par.startsWith('grp_')&&par!==id?par:null, traits:[], situation:{current:g.summary||'', status:'', history:[]}}); });
  r.characters.filter(c=>c.on).forEach(c=>{ const id=newId('chr'); made[c.name]=id; n++;
    const gid=c.group?idOf(c.group):null; const m=gid?[{group:gid, bond:0.6, ...(c.role?{role:c.role}:{})}]:[];
    addManual(`/characters/${id}`, {id, name:c.name, aliases:c.aliases, memberships:m, traits:[], situation:{current:c.summary||'', status:'', history:[]}}); });
  r.updates.filter(u=>u.on).forEach(u=>{ const e=ent(state,u.id); if(!e?.situation) return; n++;
    const base=`/${coll(u.id)}/${u.id}/situation`; setManual(base+'/status', u.status); setManual(base+'/current', u.text); });
  r.relations.filter(x=>x.on).forEach(x=>{ const from=idOf(x.from), to=idOf(x.to); if(!from||!to) return; n++;
    const id=newId('rel'), rel={id, from, to, type:x.type, intensity:x.intensity}; if(x.note) rel.note=x.note; addManual(`/relations/${id}`, rel); });
  ['characters','groups','updates','relations'].forEach(k=>{ r[k]=r[k].filter(x=>!x.on); });
  toast(`${n}개를 반영했어요`); render();
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
  if(!byId(ui.graphVer)){ ui.graphVer='work'; return state; }
  return stateOf(ui.graphVer);
}
function overlayMap(){
  const m={};
  let list=[];
  if(ui.graphVer==='preview' && analysis) list=finals(analysis).items.map(i=>({target:i.target, magnitude:i.w}));
  else { const c=ui.graphVer==='work'?head():byId(ui.graphVer); list=c?.impacts||[]; }
  list.forEach(i=>{ if(!m[i.target]||Math.abs(i.magnitude)>Math.abs(m[i.target])) m[i.target]=i.magnitude; });
  return m;
}
function renderWorld(){
  const s=graphState(); const ov=ui.overlay?overlayMap():{};
  const first=(s.characters[0]||s.groups[0])?.id;
  const editable=ui.graphVer==='work';
  if(ui.sel && !ent(editable?state:s, ui.sel)) ui.sel=null;
  const pe=ui.sel ? ent(editable?state:s, ui.sel) : null;
  const sel=pe && !pe.id.startsWith('bg_') ? pe.id : null;
  const filt={all:null, conflict:['hostile','rival'], coop:['coexist','alliance'], dominate:['dominate'], personal:['family','personal']}[ui.relFilter];
  const rels=s.relations.filter(r=>!filt||filt.includes(r.type));
  const pairs={}; rels.forEach(r=>{ const k=[r.from,r.to].sort().join('|'); (pairs[k]=pairs[k]||[]).push(r); });
  // 위치가 정해지지 않은 항목(새로 추가한 것)은 자동 배치: 빈 세계관이면 화면 전체 격자, 아니면 아래쪽 줄
  const auto={}; const missing=[...s.groups,...s.characters].filter(x=>!POS[x.id] && !LAYOUT[x.id]);
  if(missing.length){
    const empty=!Object.keys(POS).length; const cols=empty?Math.ceil(Math.sqrt(missing.length*2)):Math.min(missing.length,8); const rows=Math.ceil(missing.length/cols);
    missing.forEach((x,i)=>{ const c=i%cols, r=Math.floor(i/cols); auto[x.id]= empty ? [Math.round((c+0.5)*1100/cols), Math.round(70+(r+0.5)*400/rows)] : [Math.round((c+0.5)*1100/cols), 470-r*60]; });
  }
  const pos=id=>LAYOUT[id]||POS[id]||auto[id]||[430,300];
  const V=ui.view||(ui.view=fitView(innerWidth<600));
  const linked=new Set(sel?[sel]:[]); s.relations.forEach(r=>{ if(r.from===sel) linked.add(r.to); if(r.to===sel) linked.add(r.from); });
  const isNode=id=>id.startsWith('grp_')||id.startsWith('chr_');
  const edge=(r)=>{
    const k=[r.from,r.to].sort().join('|'); const grp=pairs[k]; const i=grp.indexOf(r), n=grp.length;
    let [x1,y1]=pos(r.from), [x2,y2]=pos(r.to);
    const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy)||1; const off=(i-(n-1)/2)*34;
    const sgn = r.from<r.to?1:-1;
    const cx=(x1+x2)/2 - dy/L*off*sgn, cy=(y1+y2)/2 + dx/L*off*sgn;
    if(r.directed){ const ex=x2-cx, ey=y2-cy, el=Math.hypot(ex,ey)||1; x2-=ex/el*30; y2-=ey/el*30; }
    const R=REL[r.type]||REL.personal; const dim = sel && !(r.from===sel||r.to===sel);
    const w=1+r.intensity*3.5;
    const lx=(x1+2*cx+x2)/4, ly=(y1+2*cy+y2)/4;
    return `<g opacity="${dim?.35:1}"><path d="M${x1},${y1} Q${cx},${cy} ${x2},${y2}" style="fill:none;stroke:${R.c};stroke-width:${w};${R.dash?`stroke-dasharray:${R.dash}`:''}" stroke-linecap="round" ${r.directed?'marker-end="url(#arrow)"':''}><title>${esc(nm(s,r.from))} ${r.directed?'→':'↔'} ${esc(nm(s,r.to))} · ${R.l} · ${lvOf(r.intensity)}${r.note?' · '+esc(r.note):''}</title></path>
      ${sel && !dim?`<text x="${lx}" y="${ly-5}" text-anchor="middle" font-size="11" style="fill:${R.c};paint-order:stroke;stroke:var(--bg);stroke-width:4px">${R.l} · ${lvOf(r.intensity)}</text>`:''}</g>`;
  };
  const memberLines = () => ui.showMembers ? [
    ...s.groups.filter(g=>g.parent).map(g=>({a:g.id,b:g.parent,bond:g.parent_bond??0.6,active:true})),
    ...s.characters.flatMap(c=>(c.memberships||[]).map(m=>({a:c.id,b:m.group,bond:m.bond,active:m.active!==false})))
  ].map(m=>{ const [x1,y1]=pos(m.a),[x2,y2]=pos(m.b); const dim=sel && !(m.a===sel||m.b===sel);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" style="stroke:var(--border-strong);stroke-width:${0.6+m.bond*1.6};stroke-dasharray:2 4" opacity="${m.active?(dim?.35:.9):.2}"><title>${esc(nm(s,m.a))} → ${esc(nm(s,m.b))} 소속 · 소속감 ${lvOf(m.bond)}</title></line>`; }).join('') : '';
  const node=e=>{
    const [x,y]=pos(e.id); const col=nationColor(nationOf(s,e)); const isSel=e.id===sel; const dead=e.situation?.status==='사망';
    const dim = sel && !linked.has(e.id) && !(ui.showMembers && memberOf(s,e.id,sel));
    const w=ov[e.id]; let halo='';
    if(w!==undefined && Math.abs(w)>=0.25){ const hc=w<0?'var(--danger)':'var(--success)';
      halo = e.id.startsWith('chr_') ? `<circle cx="${x}" cy="${y}" r="${27+Math.abs(w)*8}" style="fill:${hc};opacity:.16"/><circle cx="${x}" cy="${y}" r="${27+Math.abs(w)*8}" style="fill:none;stroke:${hc};stroke-width:1.5"/>`
        : '';
    }
    const badge = (w!==undefined && Math.abs(w)>=0.25) ? `<g><rect x="${x+16}" y="${y-36}" width="44" height="18" rx="9" style="fill:${w<0?'var(--danger)':'var(--success)'}"/><text x="${x+38}" y="${y-23}" text-anchor="middle" font-size="11" font-weight="600" style="fill:var(--bg)" class="num">${sf2(w)}</text></g>` : '';
    let shape, under;
    if(e.id.startsWith('grp_')){
      const nat=e.kind==='nation'; const wd=e.name.length*(nat?15:13)+(nat?36:26), h=nat?38:32;
      const hb = (w!==undefined && Math.abs(w)>=0.25) ? `<rect x="${x-wd/2-6}" y="${y-h/2-6}" width="${wd+12}" height="${h+12}" rx="10" style="fill:${w<0?'var(--danger)':'var(--success)'};opacity:.16;stroke:${w<0?'var(--danger)':'var(--success)'};stroke-width:1.5"/>` : '';
      under = `<rect x="${x-wd/2}" y="${y-h/2}" width="${wd}" height="${h}" rx="6" style="fill:var(--bg)"/>`;
      shape = `${hb}<rect class="nshape" x="${x-wd/2}" y="${y-h/2}" width="${wd}" height="${h}" rx="6" style="fill:${nat?'var(--bg-muted)':'var(--bg-subtle)'};stroke:${col};stroke-width:${isSel?3:nat?2:1.5};${e.kind==='solo'?'stroke-dasharray:4 3':''}"/>
        <text x="${x}" y="${y+5}" text-anchor="middle" font-size="${nat?15:13}" font-weight="${nat?700:600}" style="fill:var(--fg)">${esc(e.name)}</text>`;
    } else {
      under = `<circle cx="${x}" cy="${y}" r="22" style="fill:var(--bg)"/>`;
      const face = e.photo ? `<clipPath id="cp-${e.id}"><circle cx="${x}" cy="${y}" r="21"/></clipPath><image href="${esc(e.photo)}" x="${x-21}" y="${y-21}" width="42" height="42" preserveAspectRatio="xMidYMid slice" clip-path="url(#cp-${e.id})"/>`
        : `<text x="${x}" y="${y+5}" text-anchor="middle" font-size="14" font-weight="700" style="fill:${col}">${esc(initial(e.name))}</text>`;
      shape = `${halo}<circle class="nshape" cx="${x}" cy="${y}" r="22" style="fill:var(--bg);stroke:${col};stroke-width:${isSel?3.5:2}"/>
        ${face}<circle cx="${x}" cy="${y}" r="22" style="fill:none;stroke:${col};stroke-width:${isSel?3.5:2}"/>
        <text x="${x}" y="${y+40}" text-anchor="middle" font-size="12" style="fill:var(--fg);paint-order:stroke;stroke:var(--bg);stroke-width:4px">${esc(e.name)}${dead?' (사망)':''}</text>`;
    }
    return `<g class="node" data-id="${e.id}" tabindex="0" role="button" aria-label="${esc(e.name)}">${under}<g opacity="${dead?.5:dim?.4:1}">${shape}${badge}</g></g>`;
  };
  const body=()=>`${memberLines()}${rels.map(edge).join('')}${[...s.groups,...s.characters].filter(x=>isNode(x.id)).map(node).join('')}`;
  const verLabel = ui.graphVer==='preview'?'AI 제안 미리보기':ui.graphVer==='work'?`지금 · ${cname(head().id)}`:cnum(ui.graphVer)+cname(ui.graphVer);
  const ovSrc = ui.graphVer==='preview'?'미리보기 사건':(ui.graphVer==='work'?head():byId(ui.graphVer))?.message;
  const other = !['work','preview'].includes(ui.graphVer) && !commits.some(c=>c.id===ui.graphVer) ? byId(ui.graphVer) : null;
  const panel = pe ? `<aside class="detail" id="detail" aria-label="${esc(pe.name||pe.title)} 자세히">
      <div class="detail-bar"><span class="caption">${editable?'여기서 바로 고칠 수 있어요':'지난 시점이라 보기만 할 수 있어요'}</span><button class="btn btn-sm" id="detail-close">닫기</button></div>
      ${editable ? (pe.id.startsWith('bg_')?bgDetail(pe):entityDetail(pe)) : pastDetail(s,pe,ov,ovSrc)}</aside>` : overview(s);
  const graph = first ? graphBox() : `<div class="Box"><div class="Box-body caption" style="text-align:center;padding:48px 16px">아직 인물이나 단체가 없어요.<br>왼쪽 도구창의 <b>+ 인물 추가</b>, <b>+ 단체 추가</b>로 시작하면 여기에 관계도가 그려져요.</div></div>`;
  function graphBox(){ return `<div class="Box">
      <div class="Box-header" style="gap:12px">
        <div class="seg" role="group" aria-label="관계 필터">${[['all','전체'],['conflict','대립·경쟁'],['coop','공존·동맹'],['dominate','지배'],['personal','가족·개인']].map(([k,l])=>`<button aria-pressed="${ui.relFilter===k}" data-f="${k}">${l}</button>`).join('')}</div>
        <label class="check"><input type="checkbox" id="g-mem" ${ui.showMembers?'checked':''}>소속 선</label>
        <label class="check"><input type="checkbox" id="g-ov" ${ui.overlay?'checked':''}>사건 영향 표시</label>
        <div class="zoom" role="group" aria-label="확대와 축소"><button type="button" data-zoom="in" aria-label="확대">+</button><button type="button" data-zoom="out" aria-label="축소">−</button><button type="button" data-zoom="fit">전체</button></div>
      </div>
      <div class="graph-wrap"><svg id="g-svg" viewBox="${V.x} ${V.y} ${V.w} ${V.h}" role="img" aria-label="단체·인물 관계도">
        <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--done)"/></marker></defs>
        ${W.zones.map((z,i)=>`<rect x="${z.x}" y="0" width="${z.w}" height="540" style="fill:var(${z.fill})"/>${i?`<line x1="${z.x}" y1="0" x2="${z.x}" y2="540" style="stroke:var(--border);stroke-dasharray:2 6"/>`:''}<text x="${z.x+14}" y="528" font-size="11" font-weight="600" letter-spacing="1" style="fill:var(${z.c})">${esc(z.label)}</text>`).join('')}
        <g id="g-body">${body()}</g>
      </svg></div>
      <div class="Box-row caption graph-tip">인물이나 단체를 끌어서 자리를 옮길 수 있어요. 빈 곳을 끌면 화면이 움직이고, + − 로 확대해요.</div>
      <div class="Box-row" style="flex-wrap:wrap"><div class="legend">
        ${Object.values(REL).map(R=>`<span><i style="border-top:2px ${R.dash?'dashed':'solid'} ${R.c}"></i>${R.l}</span>`).join('')}
        <span><i style="border-top:2px dotted var(--border-strong)"></i>소속</span>
        <span>선 굵기 = 강도</span>
        ${W.zones.map(z=>`<span><span class="sq" style="background:var(${z.c})"></span>${esc(nm(state,z.id))}</span>`).join('')}
        <span><span class="dot" style="background:var(--danger);opacity:.6"></span>피해</span><span><span class="dot" style="background:var(--success);opacity:.6"></span>이득</span>
      </div></div>
    </div>
`; }
  $('#tab-world').innerHTML = pendingBanner() + `<div class="Subhead"><h2>세계관</h2><span class="muted">${esc(verLabel)}</span>${ui.graphVer==='preview'?'<span class="Label Label--done">아직 기록 안 됨</span>':''}
    <div class="actions">
      <select class="form-control" id="g-ver" style="width:auto;padding:3px 8px;font-size:12px" aria-label="버전">
        <option value="work" ${ui.graphVer==='work'?'selected':''}>지금 (${esc(cname(head().id))})</option>
        ${analysis?`<option value="preview" ${ui.graphVer==='preview'?'selected':''}>AI 제안 미리보기</option>`:''}
        ${other?`<option value="${other.id}" selected>${esc(cname(other.id))} (다른 전개)</option>`:''}
        ${commits.slice().reverse().map(c=>`<option value="${c.id}" ${ui.graphVer===c.id?'selected':''}>${cnum(c.id)}${esc(cname(c.id))}</option>`).join('')}
      </select>
    </div></div>
  <div class="ws has-detail"><div class="ws-graph">${graph}</div>${panel}</div>`;
  $$('[data-f]').forEach(b=>b.onclick=()=>{ ui.relFilter=b.dataset.f; renderWorld(); });
  $('#g-ver').onchange=ev=>{ ui.graphVer=ev.target.value; ui.editing=null; renderWorld(); };
  const gm=$('#g-mem'); if(gm) gm.onchange=ev=>{ ui.showMembers=ev.target.checked; renderWorld(); };
  const go_=$('#g-ov'); if(go_) go_.onchange=ev=>{ ui.overlay=ev.target.checked; renderWorld(); };
  const svg=$('#g-svg');
  if(svg) wireGraph(svg, body);
  $$('[data-pick],[data-go]').forEach(b=>b.onclick=()=>pick(b.dataset.pick||b.dataset.go));
  const dc=$('#detail-close'); if(dc) dc.onclick=()=>{ ui.sel=null; ui.editing=null; render('world'); };
  const oe=$('#ov-event'); if(oe) oe.onclick=()=>showTab('event');
  const oh=$('#ov-hist'); if(oh) oh.onclick=()=>showTab('history');
  const gn=$('#g-now'); if(gn) gn.onclick=()=>{ ui.graphVer='work'; render('world'); };
  if(pe && editable) wireDetail(pe);
  wirePending();
}
/* 휴대폰에서는 관계도를 세로로 길게 보여 준다 (왼쪽 절반쯤 확대해서 시작) */
const fitView=tall=>tall?{x:0,y:-10,w:600,h:560}:{x:0,y:0,w:1100,h:540};
/* 관계도 조작: 노드 끌어 옮기기(위치 저장), 빈 곳 끌어 이동, 확대·축소. 4px 안 움직이면 클릭으로 본다. */
function wireGraph(svg, body){
  const V=ui.view, setVB=()=>svg.setAttribute('viewBox', `${V.x} ${V.y} ${V.w} ${V.h}`);
  const pt=ev=>{ const p=new DOMPoint(ev.clientX, ev.clientY).matrixTransform(svg.getScreenCTM().inverse()); return [p.x, p.y]; };
  const wire=()=>svg.querySelectorAll('.node').forEach(n=>n.onkeydown=ev=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); pick(n.dataset.id); } });
  const zoom=(k,c=[V.x+V.w/2, V.y+V.h/2])=>{ const w=clamp(V.w*k, 280, 2200), f=w/V.w; V.x=c[0]-(c[0]-V.x)*f; V.y=c[1]-(c[1]-V.y)*f; V.h=w*V.h/V.w; V.w=w; setVB(); };
  let d=null;
  svg.onpointerdown=ev=>{ if(ev.button) return; const n=ev.target.closest('.node');
    d={id:n?.dataset.id, sx:ev.clientX, sy:ev.clientY, vx:V.x, vy:V.y, moved:false}; svg.setPointerCapture(ev.pointerId); };
  svg.onpointermove=ev=>{ if(!d) return;
    if(!d.moved && Math.hypot(ev.clientX-d.sx, ev.clientY-d.sy)<5) return; d.moved=true;
    if(d.id){ const [x,y]=pt(ev); LAYOUT[d.id]=[Math.round(clamp(x,20,1080)), Math.round(clamp(y,20,520))]; $('#g-body').innerHTML=body(); wire(); }
    else { const k=V.w/svg.clientWidth; V.x=d.vx-(ev.clientX-d.sx)*k; V.y=d.vy-(ev.clientY-d.sy)*k; setVB(); } };
  svg.onpointerup=ev=>{ const x=d; d=null; if(!x) return; if(!x.moved){ if(x.id) pick(x.id); return; } if(x.id) saveWorld(); };
  svg.onpointercancel=()=>{ d=null; };
  svg.onwheel=ev=>{ if(!ev.ctrlKey && !ev.metaKey) return; ev.preventDefault(); zoom(ev.deltaY<0?0.88:1/0.88, pt(ev)); };
  $$('[data-zoom]').forEach(b=>b.onclick=()=>{ const z=b.dataset.zoom; if(z==='fit'){ Object.assign(V, fitView(V.h/V.w>0.6)); setVB(); } else zoom(z==='in'?0.8:1.25); });
  wire();
}
/* 아무것도 고르지 않았을 때 오른쪽 패널: 세계관 한눈에 보기 */
function overview(s){
  const recent=commits.slice(-3).reverse();
  return `<aside class="detail" id="detail" aria-label="세계관 요약">
    <div class="Box"><div class="Box-header"><h3>세계관 한눈에</h3></div>
      <div class="Box-body stack" style="gap:12px">
        <div class="ov-stats">${[['인물',s.characters.length],['단체',s.groups.length],['배경',s.background.length],['관계',s.relations.length]].map(([l,n])=>`<div><b>${n}</b><span>${l}</span></div>`).join('')}</div>
        <div class="caption">관계도나 왼쪽 목록에서 인물, 단체를 누르면 여기서 상황과 관계를 보고 바로 고칠 수 있어요.</div>
      </div></div>
    <div class="Box"><div class="Box-header"><h3>최근 사건</h3><span class="Counter">${commits.length}</span></div>
      ${recent.map(c=>`<div class="Box-row" style="align-items:flex-start"><span class="ov-n">${cnum(c.id).replace('. ','')}</span><div style="min-width:0"><div>${esc(cname(c.id))}</div>${c.event?.story_time?`<div class="caption">${esc(c.event.story_time)}</div>`:''}</div></div>`).join('')}
      <div class="Box-row"><button class="btn btn-sm" id="ov-event">${icon('bolt')}새 사건 입력</button><button class="btn btn-sm" id="ov-hist">버전 기록 보기</button></div></div>
  </aside>`;
}
/* 지난 시점을 보고 있을 때의 상세 (보기 전용) */
function pastDetail(s,e,ov,ovSrc){
  if(e.id.startsWith('bg_')) return `<div class="Box"><div class="Box-header"><h3>${esc(e.title)}</h3><span class="Label">${esc(e.category)}</span></div><div class="Box-body">${esc(e.content)}</div>
    <div class="Box-row"><button class="btn btn-sm" id="g-now">지금 시점으로 돌아가 고치기</button></div></div>`;
  const myRels=s.relations.filter(r=>r.from===e.id||r.to===e.id);
  return `<div class="Box">
        <div class="Box-header">${e.id.startsWith('chr_')?`<span class="dot" style="background:${nationColor(nationOf(s,e))}"></span>`:`<span class="sq" style="background:${nationColor(nationOf(s,e))}"></span>`}<h3>${esc(e.name)}</h3>
          <span class="Label">${e.id.startsWith('grp_')?KIND[e.kind]:'인물'}</span>${e.situation?.status?`<span class="Label ${statusCls(e.situation.status)}">${esc(e.situation.status)}</span>`:''}</div>
        <div class="Box-body stack" style="gap:12px">
          <p style="margin:0">${esc(e.situation?.current)}</p>
          ${ov[e.id]!==undefined?`<div style="display:flex;gap:8px;align-items:center"><span class="caption" style="flex:none">이 사건의 영향</span>${wbar(ov[e.id])}<span class="num ${ov[e.id]<0?'neg':'pos'}">${sf2(ov[e.id])}</span></div><div class="caption">${esc(ovSrc||'')}</div>`:''}
          <div>${(e.traits||[]).map(t=>`<div style="display:grid;grid-template-columns:minmax(0,1fr) 80px 56px;gap:8px;align-items:center;font-size:12px;padding:2px 0"><span>${esc(t.label)}</span><div class="meter"><i style="width:${t.value*100}%"></i></div><span style="text-align:right">${lvOf(t.value)}</span></div>`).join('')}</div>
        </div>
        ${myRels.map(r=>{const o=r.from===e.id?r.to:r.from; const R=REL[r.type]||REL.personal; return `<div class="Box-row"><div style="flex:1;min-width:0"><button class="btn-link" data-pick="${o}">${esc(nm(s,o))}</button>${r.note?`<div class="caption">${esc(r.note)}</div>`:''}</div><span class="Label" style="color:${R.c};border-color:${R.c}">${R.l}${r.directed?(r.from===e.id?' →':' ←'):''}</span>${lvTag(r.intensity)}</div>`}).join('')}
        <div class="Box-row"><button class="btn btn-sm" id="g-now">지금 시점으로 돌아가 고치기</button></div>
      </div>`;
}
/* 오른쪽 상세 패널의 수정 동작 */
function wireDetail(e){
  $$('[data-lv]').forEach(b=>b.onclick=()=>{ setManual(b.dataset.lv, +b.dataset.v); render('world'); });
  const sv=$('#sit-save'); if(sv) sv.onclick=()=>{
    const base=`/${coll(e.id)}/${e.id}/situation`;
    setManual(base+'/status', $('#sit-status').value.trim()); setManual(base+'/current', $('#sit-current').value.trim());
    toast(pending.length?'저장했어요':'바뀐 내용이 없어요'); render('world');
  };
  const bs=$('#bg-save'); if(bs) bs.onclick=()=>{
    const t=$('#bg-title').value.trim(); if(!t){ toast('제목을 입력하세요'); return; }
    setManual(`/background/${e.id}/title`, t); setManual(`/background/${e.id}/category`, $('#bg-cat').value.trim()||'기타');
    setManual(`/background/${e.id}/content`, $('#bg-content').value.trim()); toast(pending.length?'저장했어요':'바뀐 내용이 없어요'); render('world'); };
  if(!e.id.startsWith('bg_')) wireEntityEdit(e);
  const base=`/${coll(e.id)}/${e.id}`;
  const nt=$('#ent-notes'); if(nt) nt.onchange=()=>{ const v=nt.value.trim(); if(v===(e.notes||'')) return; setManual(base+'/notes', v); flushPending(); saveWorld(); toast('메모를 저장했어요'); };
  const ph=$('#ent-photo'); if(ph) ph.onchange=async()=>{ const f=ph.files?.[0]; if(!f) return;
    try{ setManual(base+'/photo', await shrinkPhoto(f)); toast('사진을 넣었어요'); render('world'); }catch(err){ toast('사진을 읽지 못했어요'); } };
  const pd=$('#ent-photo-del'); if(pd) pd.onclick=()=>{ setManual(base+'/photo', null); toast('사진을 뺐어요'); render('world'); };
  // 지우기: 바로 지우고 알림의 되돌리기로 되살린다
  const undoable=(msg, done)=>{ if(!done.length) return; render(); toastUndo(msg, ()=>{ restore(done); toast('되살렸어요'); render(); }); };
  const dl=$('#ent-del'); if(dl) dl.onclick=()=>{
    const name=e.name||e.title, rels=state.relations.filter(r=>r.from===e.id||r.to===e.id).length;
    const mem=e.id.startsWith('grp_')?state.characters.filter(ch=>(ch.memberships||[]).some(m=>m.group===e.id)).length:0;
    const more=[rels?`관계 ${rels}개`:'', mem?`소속 인물 ${mem}명의 소속`:''].filter(Boolean).join(', ');
    if(!confirm(`${jq(name,'를','을')} 지울까요?${more?` ${more}도 함께 지워져요.`:''} 지운 뒤에도 알림의 되돌리기로 되살릴 수 있어요.`)) return;
    ui.sel=null; ui.editing=null; undoable(`${jq(name,'를','을')} 지웠어요`, removeEntity(e.id)); };
  $$('[data-rmt]').forEach(b=>b.onclick=()=>{ const t=e.traits.find(x=>x.key===b.dataset.rmt); const p=removeManual(`${base}/traits/${b.dataset.rmt}`); undoable(`성격 ${jq(t?.label,'를','을')} 지웠어요`, p?[p]:[]); });
  $$('[data-rmm]').forEach(b=>b.onclick=()=>{ const g=b.dataset.rmm; const p=removeManual(`${base}/memberships/${g}`); undoable(`'${nm(state,g)}' 소속을 지웠어요`, p?[p]:[]); });
  $$('[data-rmr]').forEach(b=>b.onclick=()=>{ const r=state.relations.find(x=>x.id===b.dataset.rmr); const o=r&&(r.from===e.id?r.to:r.from); const p=removeManual(`/relations/${b.dataset.rmr}`); undoable(`${jo(nm(state,o),'와','과')}의 관계를 지웠어요`, p?[p]:[]); });
}
/* 사진은 가운데를 정사각형으로 잘라 160px JPEG로 줄여 저장한다 (세계관 문서 크기를 작게 유지) */
function shrinkPhoto(file){
  return new Promise((ok, fail)=>{ const img=new Image(), url=URL.createObjectURL(file);
    img.onload=()=>{ const n=Math.min(img.width,img.height), c=document.createElement('canvas'); c.width=c.height=160;
      c.getContext('2d').drawImage(img,(img.width-n)/2,(img.height-n)/2,n,n,0,0,160,160); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg',0.82)); };
    img.onerror=()=>{ URL.revokeObjectURL(url); fail(new Error('image')); }; img.src=url; });
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
const LANE_C=['var(--accent)','var(--done)','var(--success)','var(--severe)','var(--sponsor)','var(--attention)'];
function histHead(){
  return `<div class="Subhead"><h2>버전 기록</h2>
    <select class="form-control" id="h-branch" style="width:auto;padding:3px 8px;font-size:12px" aria-label="전개">${branches.map(b=>`<option value="${b.id}" ${b.id===branchId?'selected':''}>${esc(b.name)}</option>`).join('')}</select>
    <span class="muted">기록 ${commits.length}개${branches.length>1?` · 전개 ${branches.length}개`:''}</span>
    <div class="actions"><div class="seg" role="group" aria-label="보기 방식">${[['tree','이야기 흐름'],['time','타임라인'],['list','비교·되돌리기']].map(([k,l])=>`<button aria-pressed="${(ui.histView||'tree')===k}" data-hv="${k}">${l}</button>`).join('')}</div></div></div>`;
}
function wireHistHead(){
  $('#h-branch').onchange=ev=>{ if(switchBranch(ev.target.value)) toast(`'${curBranch().name}' 전개로 옮겼어요`); render(); };
  $$('[data-hv]').forEach(b=>b.onclick=()=>{ ui.histView=b.dataset.hv; renderHistory(); });
}
/* 타임라인: 지금 전개의 사건을 순서대로, 작중 시점과 함께. 인물·단체를 고르면 그 항목이 겪은 일만 모아 본다. */
function renderTimeline(){
  const f=ui.tlFocus && ent(state,ui.tlFocus) ? ui.tlFocus : '';
  const hist=id=>{ const e=ent(state,id); return e?.situation?.history||[]; };
  const touches=c=> c.event?.involved?.includes(f) || (c.impacts||[]).some(i=>i.target===f) || c.patches.some(p=>p.path.split('/')[2]===f);
  const rows=commits.filter(c=> f ? (c.kind!=='init' && touches(c)) : c.kind!=='manual');
  const opts=[...state.characters,...state.groups].map(x=>`<option value="${x.id}" ${f===x.id?'selected':''}>${esc(x.name)}</option>`).join('');
  $('#tab-history').innerHTML = histHead() + `
  <div class="tl-bar"><label for="tl-focus" class="caption">누구의 이야기를 볼까요?</label>
    <select class="form-control" id="tl-focus" style="width:auto"><option value="">모든 사건</option>${opts}</select>
    ${f?`<span class="caption">엮인 기록 ${rows.length}개</span>`:''}</div>
  <ol class="tl2">${rows.map(c=>{ const i=commits.indexOf(c);
    const imp=(c.impacts||[]).filter(x=>Math.abs(x.magnitude)>=0.25).sort((a,b)=>Math.abs(b.magnitude)-Math.abs(a.magnitude));
    const mine=f?hist(f).filter(h=>h.commit===c.id):[];
    return `<li><div class="tl2-when"><span class="tl2-n">${i+1}</span><span>${esc(c.event?.story_time||(c.kind==='init'?'시작':''))}</span></div>
      <div class="Box tl2-card"><div class="Box-body stack" style="gap:8px">
        <div><b>${esc(cname(c.id))}</b> <span class="Label">${COMMIT_KIND[c.kind]||c.kind}</span></div>
        ${c.event?.description?`<div class="muted">${esc(c.event.description)}</div>`:''}
        ${mine.length?`<div class="tl2-mine">${mine.map(h=>`<div><b>${esc(nm(state,f))}</b> ${esc(h.summary)}${h.weight!=null?` <span class="num ${h.weight<0?'neg':'pos'}">${h.weight<0?'피해':'이득'} ${lvOf(Math.abs(h.weight))}</span>`:''}</div>`).join('')}</div>`:''}
        ${!f && imp.length?`<div class="chips">${imp.slice(0,8).map(x=>`<button class="chip tl2-imp ${x.magnitude<0?'neg':'pos'}" data-tlgo="${x.target}">${esc(nm(state,x.target))} ${x.magnitude<0?'피해':'이득'}</button>`).join('')}${imp.length>8?`<span class="caption">외 ${imp.length-8}</span>`:''}</div>`:''}
        ${!f && c.event?.involved?.length && !imp.length?`<div class="chips">${c.event.involved.map(id=>`<button class="chip" data-tlgo="${id}">${esc(nm(state,id))}</button>`).join('')}</div>`:''}
      </div></div></li>`; }).join('') || '<li class="caption">아직 기록된 사건이 없어요. 사건 입력 탭에서 첫 사건을 적어 보세요.</li>'}</ol>`;
  wireHistHead();
  $('#tl-focus').onchange=ev=>{ ui.tlFocus=ev.target.value; renderTimeline(); };
  $$('[data-tlgo]').forEach(b=>b.onclick=()=>{ ui.tlFocus=b.dataset.tlgo; renderTimeline(); });
}
/* 커밋 트리: 갈래 순서대로 줄기를 훑어 처음 만난 갈래의 칸에 커밋을 둔다(main이 맨 왼쪽). 최신이 위. */
function renderTree(){
  const ROW=44, GAP=20, X0=14;
  const laneOf={}; branches.forEach((b,bi)=>lineOf(b.head).forEach(c=>{ if(laneOf[c.id]===undefined) laneOf[c.id]=bi; }));
  const used=[...new Set(Object.values(laneOf))].sort((x,y)=>x-y), lx=l=>X0+used.indexOf(l)*GAP, col=c=>LANE_C[laneOf[c.id]%LANE_C.length];
  const rows=allCommits.slice().reverse(), rowOf={}; rows.forEach((c,i)=>rowOf[c.id]=i);
  const SW=X0*2+(used.length-1)*GAP, y=i=>i*ROW+ROW/2;
  const heads={}; branches.forEach(b=>(heads[b.head]=heads[b.head]||[]).push(b));
  const onLine=new Set(commits.map(c=>c.id));
  const sel=ui.treeSel && byId(ui.treeSel) ? ui.treeSel : head().id; ui.treeSel=sel;
  const lines=rows.filter(c=>c.parent && rowOf[c.parent]!==undefined).map(c=>{
    const x1=lx(laneOf[c.id]), y1=y(rowOf[c.id]), x2=lx(laneOf[c.parent]), y2=y(rowOf[c.parent]);
    const d = x1===x2 ? `M${x1},${y1} L${x2},${y2}` : `M${x1},${y1} L${x1},${y2-ROW/2} Q${x1},${y2} ${x2},${y2}`;
    return `<path d="${d}" style="fill:none;stroke:${col(c)};stroke-width:2" opacity="${onLine.has(c.id)?1:.5}"/>`;
  }).join('');
  const dots=rows.map((c,i)=>{ const hd=c.id===head().id;
    return `<circle cx="${lx(laneOf[c.id])}" cy="${y(i)}" r="${hd?6:5}" style="fill:${hd?'var(--bg)':col(c)};stroke:${col(c)};stroke-width:${hd?3:0}"/>`; }).join('');
  const list=rows.map(c=>`<button class="tree-row" data-tc="${c.id}" aria-current="${c.id===sel}" style="height:${ROW}px;padding-left:${SW+6}px;${onLine.has(c.id)?'':'color:var(--fg-muted)'}">
      <span class="tree-msg">${esc(c.message)}</span>
      ${(heads[c.id]||[]).map(b=>`<span class="Label ${b.id===branchId?'Label--accent':''}">${esc(b.name)}</span>`).join('')}
      </button>`).join('');
  const c=byId(sel);
  $('#tab-history').innerHTML = pendingBanner() + histHead() + `
  <div class="split-r">
    <div class="Box"><div class="Box-header"><h3>이야기 흐름</h3><span class="caption right">기록을 누르면 오른쪽에 자세히 보여요</span></div>
      <div class="tree-graph"><svg width="${SW}" height="${rows.length*ROW}" aria-hidden="true">${lines}${dots}</svg>${list}</div></div>
    <aside class="stack">
      <div class="Box"><div class="Box-header"><h3>${esc(c.message)}</h3></div>
        <div class="Box-body stack" style="gap:8px">
          <div class="caption" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="Label">${COMMIT_KIND[c.kind]||c.kind}</span>${fmtDate(c.created_at)}${c.patches.length?` · 변경 ${c.patches.length}건`:''}</div>
          ${c.event?`<div style="padding:8px 12px;background:var(--bg-subtle);border-radius:6px">${esc(c.event.description)}${c.event.story_time?`<div class="caption" style="margin-top:4px">작중 시점: ${esc(c.event.story_time)}</div>`:''}</div>`:''}
          ${onLine.has(c.id)?'':`<div class="caption">지금 전개('${esc(curBranch().name)}')에는 없는 기록이에요.</div>`}
        </div>
        <div class="Box-row" style="flex-wrap:wrap;gap:8px">
          ${(heads[c.id]||[]).filter(b=>b.id!==branchId).map(b=>`<button class="btn btn-sm btn-primary" data-sw="${b.id}">'${esc(b.name)}' 전개로 이동</button>`).join('')}
          <button class="btn btn-sm" id="t-branch">${icon('commit')}여기서 '만약에' 전개 만들기</button>
          <button class="btn btn-sm" id="t-graph">${icon('graph')}이 시점 관계도</button>
        </div></div>
      <div class="Box"><div class="Box-header"><h3>전개</h3><span class="Counter">${branches.length}</span></div>
        ${branches.map((b,bi)=>`<div class="Box-row"><span class="dot" style="background:${LANE_C[bi%LANE_C.length]}"></span>
          <div style="flex:1;min-width:0"><b>${esc(b.name)}</b>${b.id===branchId?' <span class="Label Label--accent">지금</span>':''}<div class="caption">사건 ${lineOf(b.head).length}개 · 마지막: ${esc(cname(b.head))}</div></div>
          ${b.id===branchId?'':`<button class="btn btn-sm" data-sw="${b.id}">이동</button>${b.id==='main'?'':`<button class="btn btn-sm btn-danger" data-delb="${b.id}">지우기</button>`}`}</div>`).join('')}
        <div class="Box-row caption">지난 기록에서 '만약에' 전개를 만들면 본편은 그대로 두고 다른 이야기를 시험해 볼 수 있어요. 전개 합치기는 준비 중이에요.</div></div>
    </aside>
  </div>`;
  wireHistHead();
  $$('[data-tc]').forEach(b=>b.onclick=()=>{ ui.treeSel=b.dataset.tc; renderHistory(); });
  $$('[data-sw]').forEach(b=>b.onclick=()=>{ if(switchBranch(b.dataset.sw)) toast(`'${curBranch().name}' 전개로 옮겼어요`); render(); });
  $('#t-branch').onclick=()=>{ const name=(prompt('새 전개 이름 (예: 만약 바이가 떠나지 않았다면)')||'').trim(); if(!name) return; createBranch(sel, name); render(); };
  $('#t-graph').onclick=()=>{ ui.graphVer = sel===head().id?'work':sel; showTab('graph'); };
  $$('[data-delb]').forEach(b=>b.onclick=()=>{ const br=branches.find(x=>x.id===b.dataset.delb);
    if(!confirm(`'${br.name}' 전개를 지울까요? 이 전개에만 있는 기록도 함께 지워져요.`)) return;
    deleteBranch(br.id); toast('전개를 지웠어요'); render(); });
  wirePending();
}
function renderHistory(){
  if((ui.histView||'tree')==='tree') return renderTree();
  if(ui.histView==='time') return renderTimeline();
  const n=commits.length;
  if(!commits.some(c=>c.id===ui.cmpA)) ui.cmpA=commits[Math.max(0,n-2)].id;
  if(!commits.some(c=>c.id===ui.cmpB)) ui.cmpB=commits[n-1].id;
  let ia=commits.findIndex(c=>c.id===ui.cmpA), ib=commits.findIndex(c=>c.id===ui.cmpB); if(ia>ib) [ia,ib]=[ib,ia];
  const diff=coalesce(ia,ib); const lines=diff.flatMap(p=>patchLines(stateAt(ib),p));
  const cnt={add:0,chg:0,del:0}; lines.forEach(([c])=>cnt[c]++);
  $('#tab-history').innerHTML = pendingBanner() + `
  ${histHead()}
  <div class="split-r">
    <div class="timeline">
      ${commits.map((c,i)=>({c,i})).reverse().map(({c,i})=>{ const open=ui.open[c.id] ?? (i===n-1);
        return `<div class="tl-head">${icon('commit')}${fmtDate(c.created_at)}</div>
      <div class="Box" style="margin-bottom:8px"><div class="Box-body">
        <div class="commit">
          <div class="msg">${esc(c.message)}${i===n-1?'<span class="head-tag">지금</span>':''}
            <small><span class="Label" style="margin-right:4px">${COMMIT_KIND[c.kind]||c.kind}</span>${esc(USER.name)} 기록${c.impacts?.length?` · 영향 ${c.impacts.length}건`:''} · 변경 ${c.patches.length}건</small></div>
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
        ${ui.confirm===c.id?`<div class="confirm">${icon('alert')}<span style="flex:1 1 200px">이후 기록 ${n-1-i}개의 변경을 거꾸로 되돌려요. 기존 기록은 지워지지 않고 되돌리기 기록이 새로 쌓여요.</span>
          <button class="btn btn-sm" data-cancel>취소</button><button class="btn btn-sm btn-primary" data-ok="${c.id}">되돌리기</button></div>`:''}
      </div></div>`; }).join('')}
    </div>
    <aside class="Box" style="position:sticky;top:76px">
      <div class="Box-header"><h3>비교</h3><span class="caption">${esc(cnum(commits[ia].id)+cname(commits[ia].id))} → ${esc(cnum(commits[ib].id)+cname(commits[ib].id))}</span></div>
      <div class="Box-body stack" style="gap:4px;max-height:60vh;overflow:auto">
        ${ia===ib?'<span class="caption">A와 B에 서로 다른 기록을 고르세요.</span>':lines.length?lines.map(([c,l])=>`<span class="diffline ${c}">${esc(l)}</span>`).join(''):'<span class="caption">차이가 없습니다.</span>'}
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
    const id=newSha(); addCommit({id, parent:head().id, kind:'manual', message:`되돌리기: '${cname(b.dataset.ok)}' 시점으로 복원`, created_at:new Date().toISOString(), impacts:[], patches:inv});
    ui.confirm=null; ui.cmpA=b.dataset.ok; ui.cmpB=id; ui.open={[id]:true}; analysis=null; toast(`'${cname(b.dataset.ok)}' 시점으로 되돌렸어요`); render();
  });
  $('#h-graph').onclick=()=>{ ui.graphVer=commits[ib].id===head().id?'work':commits[ib].id; showTab('graph'); };
  wireHistHead();
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
const saveKey = k => `gitstory-save-${USER.uid}-${k}`;
/* 저장: 브라우저(localStorage)에 즉시, Firestore에는 0.8초 모아서. 실패하면 브라우저 저장만 유지 */
let lastJson=null, savedAt=0, cloudTimer=null;
function setCloud(st){
  const el=$('#cloud-status'); if(!el) return;
  const m={connecting:['클라우드 연결 중','Label--attention'], synced:['클라우드에 저장됨','Label--success'], saving:['저장 중','Label--attention'], offline:['브라우저에만 저장','Label--danger']}[st];
  el.textContent=m[0]; el.className='Label '+m[1];
}
function saveWorld(){
  const json=JSON.stringify(snapshot());
  if(json===lastJson) return;
  lastJson=json; savedAt=Date.now();
  try{ localStorage.setItem(saveKey(worldKey), JSON.stringify({...snapshot(), savedAt})); }catch(e){}
  clearTimeout(cloudTimer);
  const key=worldKey, at=savedAt, data={...snapshot(), meta:DATA.meta};
  setCloud('saving');
  cloudTimer=setTimeout(()=>{
    saveCloud(key, data, at).then(()=>setCloud('synced')).catch(err=>{ console.warn('Firestore 저장 실패', err); setCloud('offline'); });
  }, 800);
}
/* 오늘 남은 AI 토큰 표시 */
function showUsage(u){
  const el=$('#token-meter'); const left=Math.max(0,u.limit-u.used)+u.credits;
  el.textContent=`${u.plan==='pro'?'Pro · ':''}오늘 남은 토큰 ${left.toLocaleString()}`;
  el.className='Label '+(left>0?'':'Label--danger');
  el.title=`하루 ${u.limit.toLocaleString()} 중 ${u.used.toLocaleString()} 사용 · 충전 잔액 ${u.credits.toLocaleString()} · 매일 한국 시간 자정 초기화`;
}
function refreshUsage(){
  fetchUsage().then(showUsage).catch(err=>{ console.warn('토큰 사용량 확인 실패', err); const el=$('#token-meter'); el.textContent='남은 토큰을 확인하지 못했어요'; el.className='Label Label--danger'; el.title=friendlyErr(err); });
}
/* 다른 기기에서 저장한 게 더 최신이면 불러옴 */
function syncFromCloud(k){
  setCloud('connecting');
  loadCloud(k).then(remote=>{
    if(k!==worldKey) return;
    if(remote && remote.updatedAt>savedAt && remote.data?.state){
      state=remote.data.state; setTree(remote.data.commits, remote.data.branches, remote.data.branch); pending=remote.data.pending||[]; LAYOUT=remote.data.layout||{};
      savedAt=remote.updatedAt; lastJson=JSON.stringify(snapshot());
      try{ localStorage.setItem(saveKey(k), JSON.stringify({...snapshot(), savedAt})); }catch(e){}
      render(); toast('클라우드에 저장된 세계관을 불러왔어요');
    } else if(!remote || remote.updatedAt<savedAt){
      lastJson=null; saveWorld();
    }
    setCloud('synced');
  }).catch(err=>{ console.warn('Firestore 불러오기 실패', err); setCloud('offline'); });
}
function loadWorld(k, fresh=false){
  W=WORLDS[k]; DATA=W.data; POS=W.pos||{}; SAMPLE=W.sample||{title:'', description:'', story_time:'', direct:[], rewrite:{}, relations:[]}; worldKey=k;
  const pe=$('#proj-edit'); if(pe) pe.style.display=k.startsWith('p_')?'':'none';
  state=clone(DATA.state); setTree(clone(DATA.commits)); pending=[]; analysis=null; LAYOUT={}; ui.view=null;
  if(!fresh){
    try{
      const saved=JSON.parse(localStorage.getItem(saveKey(k)));
      if(saved?.state && saved?.commits){ state=saved.state; setTree(saved.commits, saved.branches, saved.branch); pending=saved.pending||[]; LAYOUT=saved.layout||{}; }
      savedAt=saved?.savedAt||0;
    }catch(e){ savedAt=0; }
  } else savedAt=0;
  lastJson=JSON.stringify(snapshot());
  Object.assign(ui, {sel:null, treeSel:null, editing:null, graphVer:'work', relFilter:'all', cmpA:null, cmpB:null, confirm:null, open:{}});
  try{ localStorage.setItem('gitstory-world', k); }catch(e){}
}
$('#side-q').oninput=ev=>{ ui.q=ev.target.value; renderSide(); };
$('#side-toggle').onclick=()=>sideOpen(!$('#side').classList.contains('open'));
$('#side-close').onclick=()=>sideOpen(false);
$('#side-backdrop').onclick=()=>sideOpen(false);
document.addEventListener('keydown',ev=>{ if(ev.key==='Escape' && $('#side').classList.contains('open')) sideOpen(false); });
$('#world-pick').onchange=ev=>{ loadWorld(ev.target.value); render(); syncFromCloud(worldKey); toast(`${DATA.meta.title} 세계관을 불러왔어요`); };
$('#world-reset').onclick=()=>{
  if(!confirm(`${DATA.meta.title}의 모든 변경을 지우고 처음 상태로 되돌릴까요?${worldKey.startsWith('p_')?' (직접 만든 프로젝트는 빈 상태가 됩니다)':''}`)) return;
  loadWorld(worldKey, true); lastJson=null; render(); toast('처음 상태로 되돌렸어요');
};
/* ---------- 직접 만든 프로젝트 (키 p_...) ----------
   목록은 브라우저에 두고, 각 프로젝트 내용은 다른 세계관처럼 users/{uid}/worlds/{키}에 meta와 함께 저장한다. */
const projKey=()=>`gitstory-projects-${USER.uid}`;
let PROJECTS=[];
try{ PROJECTS=JSON.parse(localStorage.getItem(projKey()))||[]; }catch(e){ PROJECTS=[]; }
function writeProjects(){ try{ localStorage.setItem(projKey(), JSON.stringify(PROJECTS)); }catch(e){} }
function customWorld(p){
  return {slug:p.key, pos:{}, sample:null, sel:null, zones:[], data:{meta:p.meta, state:{background:[], groups:[], characters:[], relations:[]},
    commits:[{id:p.key.slice(2,9).padEnd(7,'0'), parent:null, kind:'init', message:'프로젝트 시작', created_at:p.meta.created_at, patches:[]}]}};
}
function fillPicker(){
  const sel=$('#world-pick'), v=worldKey||sel.value;
  sel.innerHTML=`<optgroup label="예시 세계관"><option value="arcane">아케인</option><option value="hp">해리 포터</option><option value="jg">짱구는 못말려</option></optgroup>`
    + (PROJECTS.length?`<optgroup label="내 프로젝트">${PROJECTS.map(p=>`<option value="${p.key}">${esc(p.meta.title)}</option>`).join('')}</optgroup>`:'');
  sel.value=v; sel.setAttribute('aria-label','세계관 선택');
}
PROJECTS.forEach(p=>{ WORLDS[p.key]=customWorld(p); });
$('#world-pick').insertAdjacentHTML('afterend', '<button class="btn btn-sm" id="proj-new" type="button">+ 새 프로젝트</button><button class="btn btn-sm" id="proj-edit" type="button" style="display:none">프로젝트 이름 바꾸기</button>');
$('#proj-new').onclick=()=>{
  const title=(prompt('새 프로젝트(세계관) 이름')||'').trim(); if(!title) return;
  const description=(prompt('한 줄 설명 (비워도 돼요)')||'').trim();
  const key='p_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const p={key, meta:{id:key, title, description, created_at:new Date().toISOString()}};
  PROJECTS.push(p); writeProjects(); WORLDS[key]=customWorld(p);
  loadWorld(key); fillPicker(); showTab('world'); syncFromCloud(key);
  toast(`'${title}' 프로젝트를 만들었어요. 왼쪽의 + 인물 추가, + 단체 추가로 시작하세요`);
};
$('#proj-edit').onclick=()=>{
  const p=PROJECTS.find(x=>x.key===worldKey); if(!p) return;
  const title=(prompt('프로젝트 이름', p.meta.title)||'').trim(); if(!title) return;
  const d=prompt('한 줄 설명', p.meta.description||''); if(d!==null) p.meta.description=d.trim();
  p.meta.title=title; DATA.meta=p.meta; writeProjects(); fillPicker(); lastJson=null; render(); toast('프로젝트 정보를 바꿨어요');
};
/* 다른 기기에서 만든 프로젝트도 목록에 합친다 */
listProjects().then(list=>{
  let changed=false;
  list.forEach(r=>{ const mine=PROJECTS.find(p=>p.key===r.key);
    if(!mine){ const p={key:r.key, meta:r.meta}; PROJECTS.push(p); WORLDS[r.key]=customWorld(p); changed=true; }
    else if(r.meta.title!==mine.meta.title || r.meta.description!==mine.meta.description){ Object.assign(mine.meta, r.meta); changed=true; } });
  if(changed){ writeProjects(); fillPicker(); if(worldKey.startsWith('p_')) render(); }
}).catch(err=>console.warn('프로젝트 목록 불러오기 실패', err));
let startWorld='arcane';
try{ const v=localStorage.getItem('gitstory-world'); if(WORLDS[v]) startWorld=v; }catch(e){}
if(location.hash==='#hp' || location.hash==='#harry-potter') startWorld='hp';
if(location.hash==='#arcane') startWorld='arcane';
fillPicker(); loadWorld(startWorld); fillPicker();
document.querySelectorAll('[data-user-name]').forEach(el=>el.textContent=USER.name);
const av=$('#user-avatar'); av.title=USER.name;
if(USER.photo){ const img=document.createElement('img'); img.src=USER.photo; img.alt=''; img.referrerPolicy='no-referrer'; img.style.cssText='width:100%;height:100%;border-radius:50%'; av.appendChild(img); }
else av.textContent=(USER.name||'?').slice(0,1).toUpperCase();
$('#sign-out').onclick=()=>signOutUser().then(()=>location.reload());
/* ---------- 사용 안내 (처음 한 번, 이후 도움말 버튼) ---------- */
const TOUR=[
  ['world','세계관','오른쪽에 세계관 전체가 관계도로 보여요. 인물이나 단체를 누르면 상황, 성격, 관계가 옆에 열리고 바로 고칠 수 있어요. 왼쪽 도구창에서 + 인물 추가, + 단체 추가로 새로 만들어요. 위쪽에서 시점을 고르면 그때의 관계도로 바뀌어요.'],
  ['event','사건 입력','이야기에서 일어난 일을 적고 AI 영향 분석을 누르면, 누가 직접 영향을 받고 소속을 따라 어떻게 퍼지는지 보여줘요. 확인한 뒤 사건 기록하기를 누르면 버전으로 남아요.'],
  ['manuscript','원고 붙여넣기','쓴 원고를 한 화씩 붙여넣으면 AI가 새 인물, 바뀐 상황, 새 관계, 큰 사건을 후보로 골라줘요. 체크한 것만 반영돼요.'],
  ['history','버전 기록','모든 변화가 이야기 흐름으로 쌓여요. 지난 기록에서 \'만약에\' 전개를 만들어 다른 이야기를 시험하고, 언제든 되돌릴 수 있어요. 내 이야기는 왼쪽 도구창의 + 새 프로젝트로 시작하세요.']
];
function tour(i=0){
  $('#tour')?.remove(); $$('.tour-hl').forEach(el=>el.classList.remove('tour-hl'));
  if(i>=TOUR.length){ try{ localStorage.setItem('gitstory-tour-done','1'); }catch(e){} showTab('world'); return; }
  const [tab,title,text]=TOUR[i]; showTab(tab);
  const tb=$(`[role=tab][data-tab=${tab}]`); tb.classList.add('tour-hl'); tb.scrollIntoView({inline:'center', block:'nearest'});
  document.body.insertAdjacentHTML('beforeend', `<div class="tour" id="tour" role="dialog" aria-label="사용 안내"><div class="caption">사용 안내 ${i+1} / ${TOUR.length}</div><h3>${title}</h3><p>${text}</p>
    <div class="tour-actions"><button class="btn btn-sm" id="tour-skip">건너뛰기</button>${i?'<button class="btn btn-sm" id="tour-prev">이전</button>':''}<button class="btn btn-sm btn-primary" id="tour-next">${i===TOUR.length-1?'시작하기':'다음'}</button></div></div>`);
  $('#tour-next').onclick=()=>tour(i+1); $('#tour-skip').onclick=()=>tour(TOUR.length);
  const pv=$('#tour-prev'); if(pv) pv.onclick=()=>tour(i-1);
}
$('#help-btn').onclick=()=>tour(0);
document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && $('#tour')) tour(TOUR.length); });
/* ---------- 테마 고르기: 원고지(기본)·밤의 서고·작업 노트 × 시스템·밝게·어둡게. 이 브라우저에 기억한다 ---------- */
const SKINS=[['paper','원고지',['#fbfbf7','#2f7a5b','#1c211f']],['night','밤의 서고',['#11151f','#d6a84f','#ece3cf']],['note','작업 노트',['#f7f7fb','#4b3fe0','#17172b']]];
const MODES=[['system','시스템'],['light','밝게'],['dark','어둡게']];
const pref=(k,d)=>{ try{ return localStorage.getItem(k)||d; }catch(e){ return d; } };
function applyTheme(skin, mode){
  const r=document.documentElement;
  if(skin==='paper') delete r.dataset.skin; else r.dataset.skin=skin;
  if(mode==='system') delete r.dataset.theme; else r.dataset.theme=mode;
  try{ localStorage.setItem('gitstory-skin',skin); localStorage.setItem('gitstory-mode',mode); }catch(e){}
}
function themePop(){
  const skin=pref('gitstory-skin','paper'), mode=pref('gitstory-mode','system');
  return `<div class="theme-pop" id="theme-pop" role="dialog" aria-label="테마">
    <div class="lab">테마</div><div class="theme-opts">${SKINS.map(([k,l,c])=>`<button type="button" data-skin="${k}" aria-pressed="${skin===k}"><span class="swatch">${c.map(x=>`<i style="background:${x}"></i>`).join('')}</span>${l}</button>`).join('')}</div>
    <div class="lab">밝기</div><div class="theme-opts">${MODES.map(([k,l])=>`<button type="button" data-mode="${k}" aria-pressed="${mode===k}" ${skin==='night'?'disabled':''}>${l}</button>`).join('')}</div>
    ${skin==='night'?'<div class="caption">밤의 서고는 어두운 화면 하나만 있어요.</div>':''}</div>`;
}
function toggleTheme(open){
  $('#theme-pop')?.remove(); const btn=$('#theme-btn'); btn.setAttribute('aria-expanded', open);
  if(!open) return;
  $('.app-header').insertAdjacentHTML('beforeend', themePop());
  $$('#theme-pop [data-skin]').forEach(b=>b.onclick=()=>{ const sk=b.dataset.skin; applyTheme(sk, sk==='night'?'system':pref('gitstory-mode','system')); toggleTheme(true); render(); });
  $$('#theme-pop [data-mode]').forEach(b=>b.onclick=()=>{ applyTheme(pref('gitstory-skin','paper'), b.dataset.mode); toggleTheme(true); render(); });
}
$('#theme-btn').onclick=ev=>{ ev.stopPropagation(); toggleTheme(!$('#theme-pop')); };
document.addEventListener('click', ev=>{ const pop=$('#theme-pop'); if(pop && !ev.target.closest('#theme-pop')) toggleTheme(false); });
document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && $('#theme-pop')) toggleTheme(false); });
refreshUsage();
render('world');
try{ if(!localStorage.getItem('gitstory-tour-done')) tour(0); }catch(e){}
syncFromCloud(startWorld);
}
