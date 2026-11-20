/* GitStory 샘플 앱 화면 로직. mockups/gitstory-prototype.html의 스크립트를 옮기고,
   세계관 상태를 브라우저(localStorage)에 저장하도록 했다. */
import DATA_ARCANE from "@/data/arcane.json";
import DATA_HP from "@/data/harry-potter.json";
import DATA_JG from "@/data/janggu.json";
import { loadCloud, saveCloud, signOutUser, fetchUsage, analyzeEvent, extractManuscript, listProjects, askWorld, getAiModel, setAiModel, fetchAiRuns } from "@/legacy/cloud";

let started = false;
let USER;

/** user: { uid, name, photo } */
export function start(user) {
if (started) return;
started = true;
USER = user;
/* 예시 데이터: design/arcane-example.json 그대로 */



let DATA, POS, SAMPLE, W;
let LAYOUT = {};
let PINS = [];        // 도구창 맨 위에 고정한 항목 id (버전과 무관)       // 사용자가 관계도에서 끌어 옮긴 위치 {id:[x,y]} (버전과 무관하게 저장)

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
const snapshot = () => ({state, commits:allCommits, pending, branches, branch:branchId, layout:LAYOUT, chapters:CHAPTERS, pins:PINS});
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
function nationColor(n){ const z=W.zones.find(z=>z.id===n); if(z) return `var(${z.c})`;
  const nats=state.groups.filter(g=>g.kind==='nation' && !g.parent), i=nats.findIndex(g=>g.id===n);
  return i>-1 ? LANE_C[i%LANE_C.length] : 'var(--fg-muted)'; }
function statusCls(st){ return st==='사망'?'Label--danger':/위기|마비|비상|충격|불안정|공백|도주|진압|교전|부상|축소|저항|쇠약|수감|수배|장악|숙청|상실|폐교|동요/.test(st||'')?'Label--attention':''; }
const cname = id => { const c=byId(id); return c ? c.message.replace(/^사건:\s*/,'') : '지워진 시점'; };
const cnum = id => { const i=commits.findIndex(c=>c.id===id); return i<0?'':`${i+1}. `; };
function fmtDate(s){ if(!s) return '방금 전'; const d=new Date(s); return `${d.getMonth()+1}월 ${d.getDate()}일 ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`; }
const clean=t=>String(t??'').replace(/[\u200e\u200f\u202a-\u202e\u2066-\u2069]/g,'');
function newId(p){ return `${p}_${Date.now().toString(36).slice(-5)}${Math.random().toString(36).slice(2,5)}`; }
function newSha(){ return Array.from({length:7},()=>'0123456789abcdef'[Math.random()*16|0]).join(''); }
function toast(t){ const el=$('#toast'); el.textContent=t; const lv=$('#live'); if(lv){ lv.textContent=''; setTimeout(()=>{ lv.textContent=t; }, 30); } el.hidden=false; clearTimeout(toast.t); toast.t=setTimeout(()=>el.hidden=true,2600); }
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
  if(!st){
    if(err instanceof TypeError && /fetch|network|load failed/i.test(err.message||'')) return '인터넷 연결이 끊겼거나 서버에 닿지 못했어요. 연결을 확인하고 다시 눌러 주세요';
    return 'AI 응답을 제대로 읽지 못했어요. 다시 눌러 주세요';
  }
  if(st===401||st===403) return '로그인이 풀렸어요. 새로고침한 뒤 다시 로그인해 주세요';
  if(st===413) return '세계관이나 원고가 너무 커서 한 번에 보낼 수 없어요';
  if(st===504) return 'AI 응답이 너무 오래 걸렸어요. 조금 뒤 다시 눌러 주세요';
  if(st===503) return korean ? msg : 'AI 서버가 붐벼요. 조금 뒤 다시 눌러 주세요';
  if(korean) return msg;
  if(st>=500) return 'AI 서버에 잠시 문제가 있어요. 조금 뒤 다시 눌러 주세요';
  return '알 수 없는 문제가 생겼어요. 조금 뒤 다시 눌러 주세요';
}

/* 429: 정말 토큰을 다 쓴 경우와 잠깐 몰린 경우를 나눠 안내하고, 머리줄의 남은 토큰도 맞춘다 */
function quotaNote(err){
  const u=err.body?.usage||lastUsage; if(err.body?.usage) showUsage(u); else refreshUsage();
  if(u && u.used < u.limit + (u.credits||0)) return '요청이 잠깐 몰렸어요. 조금 뒤 다시 눌러 주세요';
  return '오늘 쓸 수 있는 토큰을 다 썼어요. 한국 시간 자정에 다시 채워집니다.';
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
  if(rest.startsWith('situation/history')) return `${n} · 상황 이력`;
  if(rest==='situation') return `${n} · 상황`;
  if(rest.startsWith('aliases/')) return `${n} · 다른 이름`;
  if(rest==='memberships') return `${n} · 소속 목록`;
  if(rest==='parent_bond') return `${n} · 상위 단체 소속감`;
  let m=rest.match(/^traits\/([^/]+)(\/value)?$/); if(m) return `${n} · 성격 '${traitLabel(s,c,id,m[1])}'`;
  m=rest.match(/^memberships\/([^/]+)$/); if(m) return `${n} · '${nm(s,m[1])}' 소속`;
  m=rest.match(/^memberships\/([^/]+)\/bond$/); if(m) return `${n} · '${nm(s,m[1])}' 소속감`;
  m=rest.match(/^memberships\/([^/]+)\/active$/); if(m) return `${n} · '${nm(s,m[1])}' 소속 활성`;
  m=rest.match(/^traits\/([^/]+)\/label$/); if(m) return `${n} · 성격 이름`;
  m=rest.match(/^memberships\/([^/]+)\/role$/); if(m) return `${n} · '${nm(s,m[1])}'에서 맡은 일`;
  return `${n} · 세부 항목`;
}
function traitLabel(s,c,id,key){
  const e=ent(s,id)||ent(state,id); const t=e?.traits?.find(t=>t.key===key); if(t) return t.label;
  const path=`/${c}/${id}/traits/${key}`;
  const p=[...pending, ...allCommits.flatMap(x=>x.patches||[])].find(p=>p.path===path && (p.before||p.after)?.label);
  return p ? (p.before||p.after).label : '지워진 성격';
}
function ent2rel(s,id){ return s.relations.find(r=>r.id===id) || state.relations.find(r=>r.id===id); }
function showVal(v){ if(v==null || v==='') return '(없음)'; if(typeof v==='string' && v.startsWith('data:image')) return '(사진)'; if(Array.isArray(v)) return v.length?v.map(showVal).join(', '):'(없음)';
  if(typeof v==='object' && !Array.isArray(v) && ('current' in v || 'status' in v) && 'history' in v) return [v.status, v.current].filter(Boolean).join(' · ')||'(없음)';
  if(typeof v==='object' && v.label && v.value!=null) return `${v.label} ${lvOf(v.value)}`; if(typeof v==='object' && v.group && v.bond!=null) return `소속감 ${lvOf(v.bond)}${v.role?' · '+v.role:''}`; if(typeof v==='object' && v.key && v.value!=null) return lvOf(v.value); if(typeof v==='number') return v>=0&&v<=1?lvOf(v):f2(v); if(typeof v==='boolean') return v?'예':'아니오'; if(typeof v==='object') return v.type&&REL[v.type] ? `${REL[v.type].l} · ${lvOf(v.intensity)}${v.note?' · '+v.note:''}` : (v.summary || v.title || v.name || v.label || '항목'); return v; }
function fmtV(path, v){
  const k=path.split('/').pop();
  if(v==null || v==='') return '(없음)';
  if(k==='kind') return KIND[v]||v;
  if((k==='parent'||k==='from'||k==='to'||k==='group') && typeof v==='string') return nm(state,v);
  if(k==='type' && REL[v]) return REL[v].l;
  if(k==='directed') return v?'방향 있음':'방향 없음';
  if(k==='active') return v?'소속 중':'소속 끊김';
  return showVal(v);
}
function patchLines(s,p){
  const label=(p.op!=='replace' && p.path.startsWith('/relations/') && (p.after||p.before)?.from) ? `관계 ${nm(s,(p.after||p.before).from)} ↔ ${nm(s,(p.after||p.before).to)}` : describePath(s,p.path);
  if(p.op==='replace') return [['chg',`~ ${label}: ${fmtV(p.path,p.before)} → ${fmtV(p.path,p.after)}`]];
  if(p.op==='add' && p.path.split('/').length===3 && !p.path.startsWith('/relations/')) return [['add',`+ ${label} 추가`]];
  if(p.op==='remove' && p.path.split('/').length===3 && !p.path.startsWith('/relations/')) return [['del',`- ${{characters:'인물',groups:'단체',background:'배경'}[p.path.split('/')[1]]} '${p.before.name||p.before.title}' 지움`]];
  if(p.op==='remove') return [['del',`- ${label} 지움`]];
  if(p.op==='add') return [['add',`+ ${label}: ${fmtV(p.path,p.after)}`]];
  return [['del',`- ${label}: ${fmtV(p.path,p.before)}`]];
}

/* 수동 수정 → pending */
function setManual(path, value){
  const cur=getv(state,path); if(cur===value) return;
  let p=pending.find(x=>x.path===path && x.op==='replace');
  if(!p){ p={op:'replace', path, before:clone(cur), after:value}; pending.push(p); } else p.after=value;
  const r=walk(state,path); r.obj[r.key]=value;
  if(JSON.stringify(p.before)===JSON.stringify(p.after)) pending=pending.filter(x=>x!==p);
}

/* 직접 고친 내용은 바로 기록한다. 방금(3분 안) 만든 '세계관 직접 수정' 기록이 맨 끝이고 그 뒤로 갈라진 전개가 없으면 거기에 이어 붙인다. */
let manualFrom=null;   // 이번 직접 수정이 어디서 왔는지 (예: 원고 '3화'에서 반영). 있으면 따로 기록한다
function flushPending(){
  if(!pending.length){ manualFrom=null; return; }
  const h=head(), now=new Date().toISOString(), from=manualFrom; manualFrom=null;
  const merge = !from && !h.from && h.kind==='manual' && h.auto && Date.now()-new Date(h.updated_at||h.created_at) < 3*60e3
    && !allCommits.some(c=>c.parent===h.id) && !branches.some(b=>b.id!==branchId && b.head===h.id);
  const id = merge ? h.id : newSha();
  pending.forEach(p=>{ const m=p.path.match(/^\/(groups|characters)\/([^/]+)\//); if(!m) return;
    const e=ent(state,m[2]); if(!e?.situation?.history) return;
    const summary=describePath(state,p.path).split(' · ')[1]+(p.op==='remove'?' 지움':p.op==='add'?' 추가':' 수정'); const last=e.situation.history.at(-1);
    if(last && last.commit===id && last.summary===summary) return;
    const hp={op:'add', path:`/${m[1]}/${m[2]}/situation/history/-`, after:{commit:id, summary, source:'manual'}}; applyPatch(state,hp); p.__h=hp; });
  const patches=pending.flatMap(p=>p.__h?[{op:p.op,path:p.path,before:p.before,after:p.after}, p.__h]:[{op:p.op,path:p.path,before:p.before,after:p.after}]);
  if(merge){ h.patches.push(...patches); h.updated_at=now; h.message=manualMsg(h.patches); }
  else addCommit({id, parent:h.id, kind:'manual', auto:true, ...(from?{from}:{}), message:from?`${from}: ${manualMsg(patches).replace(/^직접 수정: /,'')}`:manualMsg(patches), created_at:now, updated_at:now, impacts:[], patches});
  pending=[];
}
/* 직접 수정 기록 이름: 고친 항목 이름을 넣어 기록끼리 구분되게 한다 (예: '직접 수정: 징크스, 바이 외 2') */
function manualMsg(patches){
  const names=[];
  patches.forEach(p=>{ const m=p.path.match(/^\/(groups|characters|background|relations)\/([^/]+)/); if(!m) return;
    let n; if(m[1]==='relations'){ const r=ent(state,m[2])||state.relations.find(x=>x.id===m[2])||p.after||p.before; n=r&&r.from?`${nm(state,r.from)}↔${nm(state,r.to)}`:'관계'; }
    else n=ent(state,m[2])?nm(state,m[2]):(p.before?.name||p.before?.title||p.after?.name||p.after?.title||ghostName(m[2]));
    if(n && !names.includes(n)) names.push(n); });
  if(!names.length) return '세계관 직접 수정';
  return '직접 수정: '+names.slice(0,3).join(', ')+(names.length>3?` 외 ${names.length-3}`:'');
}
/* 새 항목 추가 → pending (id로 가리키는 경로라 되돌리기도 그 항목만 뺀다) */
function addManual(path, obj){ const p={op:'add', path, after:clone(obj)}; pending.push(p); applyPatch(state,p); }
/* 지우기 → pending. 되살리기에 쓰도록 만든 patch를 돌려준다 */
function removeManual(path){ const before=getv(state,path); if(before===undefined) return null; const w=walk(state,path); const p={op:'remove', path, before:clone(before)}; if(w?.arr && w.idx>-1) Object.defineProperty(p,'idx',{value:w.idx, enumerable:false}); pending.push(p); applyPatch(state,p); return p; }
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
function restore(done){ done.slice().reverse().forEach(p=>{
  if(p.op==='remove'){ addManual(p.path, p.before);
    if(p.idx!=null){ const w=walk(state,p.path); if(w?.arr && w.idx>-1 && w.idx!==p.idx){ const [x]=w.arr.splice(w.idx,1); w.arr.splice(Math.min(p.idx,w.arr.length),0,x); } } }
  else setManual(p.path, p.before); }); }
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

/* ---------- 다시 그린 뒤 키보드 포커스 되살리기 ----------
   화면을 innerHTML로 다시 그리면 보고 있던 버튼이 사라져 포커스가 맨 처음으로 튄다.
   마지막으로 포커스된 요소의 id나 data-* 값을 기억했다가, 같은 요소가 다시 생기면 그리로 옮긴다. */
const focusKey=el=>{
  if(!el || el===document.body || !el.closest('.main-col, .side')) return null;
  if(el.id) return '#'+CSS.escape(el.id);
  for(const a of el.attributes) if(a.name.startsWith('data-') && a.value!=='') return `${el.tagName.toLowerCase()}[${a.name}="${CSS.escape(a.value)}"]`;
  return null;
};
let lastFocus=null, lastSel=null;
document.addEventListener('focusin', ev=>{ lastFocus=focusKey(ev.target); lastSel=null; });
const rememberSel=ev=>{ const t=ev.target; if(t && 'selectionStart' in t && t===document.activeElement){ try{ lastSel=[t.selectionStart, t.selectionEnd]; }catch(e){} } };
['keyup','input','click','select'].forEach(n=>document.addEventListener(n, rememberSel));
document.addEventListener('focusout', ev=>{ const t=ev.target; setTimeout(()=>{ if(t.isConnected && (document.activeElement===document.body || !document.activeElement)) lastFocus=null; }, 0); });
new MutationObserver(()=>{
  if(!lastFocus || (document.activeElement && document.activeElement!==document.body)) return;
  const el=document.querySelector(lastFocus); if(!el || el.closest('[hidden]')) return;
  el.focus({preventScroll:true});
  if(lastSel && 'setSelectionRange' in el){ try{ el.setSelectionRange(...lastSel); }catch(e){} }
}).observe(document.querySelector('.workspace'), {childList:true, subtree:true});

/* 화면 안 입력창 (브라우저 기본 prompt 대신). fields=[{label, value, max, required}] → 값 배열, 취소하면 null */
/* 화면 안 확인창 (브라우저 기본 confirm 대신). 누르면 true, 취소·Esc·바깥 누르기는 false */
function sure(msg, ok='확인', danger=false){
  return new Promise(res=>{
    const back=document.activeElement; $('#ask')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div class="ask-back" id="ask"><div class="ask Box" role="alertdialog" aria-modal="true" aria-describedby="ask-msg">
      <div class="Box-body stack"><p id="ask-msg" style="margin:0;line-height:1.6">${esc(msg)}</p>
      <div class="row-end" style="gap:8px"><button class="btn" type="button" id="ask-no">취소</button><button class="btn ${danger?'btn-danger':'btn-primary'}" type="button" id="ask-yes">${esc(ok)}</button></div></div></div></div>`);
    const box=$('#ask'), done=v=>{ box.remove(); try{ if(back?.isConnected) back.focus(); }catch(e){} res(v); };
    $('#ask-no').focus();
    $('#ask-no').onclick=()=>done(false); $('#ask-yes').onclick=()=>done(true);
    box.onclick=ev=>{ if(ev.target===box) done(false); };
    box.onkeydown=ev=>{ if(ev.key==='Escape'){ ev.stopPropagation(); done(false); }
      if(ev.key==='Tab'){ ev.preventDefault(); (document.activeElement.id==='ask-no'?$('#ask-yes'):$('#ask-no')).focus(); } };
  });
}
function ask(title, fields, ok='확인'){
  return new Promise(res=>{
    const back=document.activeElement; $('#ask')?.remove();
    document.body.insertAdjacentHTML('beforeend', `<div class="ask-back" id="ask"><form class="ask Box" role="dialog" aria-modal="true" aria-labelledby="ask-h">
      <div class="Box-header"><h3 id="ask-h">${esc(title)}</h3></div><div class="Box-body stack">
      ${fields.map((f,i)=>`<div class="form-group"><label for="ask-${i}">${esc(f.label)}</label><input class="form-control" id="ask-${i}" maxlength="${f.max||60}" value="${esc(f.value||'')}" autocomplete="off"></div>`).join('')}
      <div class="row-end" style="gap:8px"><button class="btn" type="button" id="ask-no">취소</button><button class="btn btn-primary" type="submit">${esc(ok)}</button></div></div></form></div>`);
    const box=$('#ask'), done=v=>{ box.remove(); try{ back?.focus(); }catch(e){} res(v); };
    $('#ask-0').focus(); $('#ask-0').select();
    $('#ask-no').onclick=()=>done(null);
    box.onclick=ev=>{ if(ev.target===box) done(null); };
    box.onkeydown=ev=>{ if(ev.key==='Escape'){ ev.stopPropagation(); done(null); }
      if(ev.key==='Tab'){ const f=[...box.querySelectorAll('input,button')], a=f[0], z=f[f.length-1];
        if(ev.shiftKey && document.activeElement===a){ ev.preventDefault(); z.focus(); } else if(!ev.shiftKey && document.activeElement===z){ ev.preventDefault(); a.focus(); } } };
    box.querySelector('form').onsubmit=ev=>{ ev.preventDefault(); const v=fields.map((f,i)=>$('#ask-'+i).value.trim());
      if(fields.some((f,i)=>f.required && !v[i])){ toast(`${fields.find((f,i)=>f.required && !v[i]).label}을(를) 입력하세요`); return; } done(v); };
  });
}
/* ---------- 탭 ---------- */
$$('[role=tab]').forEach(b=>b.addEventListener('click',()=>showTab(b.dataset.tab)));
$('[role=tablist]').addEventListener('keydown', ev=>{
  const tabs=$$('[role=tab]'), i=tabs.indexOf(ev.target); if(i<0) return;
  const j={ArrowRight:i+1, ArrowLeft:i-1, Home:0, End:tabs.length-1}[ev.key]; if(j===undefined) return;
  ev.preventDefault(); const t=tabs[(j+tabs.length)%tabs.length]; showTab(t.dataset.tab); t.focus();
});
function showTab(t){
  $$('[role=tab]').forEach(b=>b.setAttribute('aria-selected', b.dataset.tab===t));
  if(t==='graph') t='world';
  $$('[role=tab]').forEach(b=>b.setAttribute('aria-selected', b.dataset.tab===t));
  $$('[role=tab]').forEach(b=>b.tabIndex = b.dataset.tab===t ? 0 : -1);
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
  const past=cur()==='world' && ui.graphVer!=='work';
  const s=past?graphState():state, q=(ui.q||'').trim().toLowerCase();
  const hit=x=>!q || [x.name||x.title, ...(x.aliases||[]), x.category||''].join(' ').toLowerCase().includes(q);
  const item=(x,mark,meta,pad=0)=>`<li><button data-side="${x.id}" aria-current="${x.id===ui.sel}" style="padding-left:${8+pad*14}px">${mark}<span class="nm">${esc(x.name||x.title)}</span>${meta?`<span class="meta">${esc(meta)}</span>`:''}</button></li>`;
  const PH={chr:'새 인물 이름',grp:'새 단체 이름',bg:'새 배경 제목'};
  const addRow=key=>ui.adding===key?`<li class="side-add"><form data-addform="${key}"><input class="form-control" id="side-add-name" maxlength="${NAME_MAX}" placeholder="${PH[key]}" aria-label="${PH[key]}" autocomplete="off"><button class="btn btn-sm btn-primary" type="submit">추가</button><button class="btn btn-sm" type="button" data-addcancel>취소</button></form></li>`:'';
  const sec=(key,label,n,body)=>`<section class="side-sec"><div class="side-sec-h"><span>${label}</span><span class="Counter">${n}</span><button class="btn btn-sm" data-new="${key}" aria-expanded="${ui.adding===key}">+ ${label} 추가</button></div>
    <ul class="tree">${addRow(key)}${body||(ui.adding===key?'':`<li class="caption side-empty">${q?'찾는 항목이 없어요':'아직 없어요'}</li>`)}</ul></section>`;
  const chars=s.characters.filter(hit), grps=q?s.groups.filter(hit).map(g=>[g,0]):treeGroups(s), bgs=s.background.filter(hit);
  const pins=PINS.map(id=>ent(s,id)).filter(x=>x && hit(x));
  const pinSec=pins.length?`<section class="side-sec side-pins"><div class="side-sec-h"><span>★ 고정</span><span class="Counter">${pins.length}</span></div><ul class="tree">${pins.map(x=>item(x,`<span class="pin-star" aria-hidden="true">★</span>`, x.id.startsWith('chr_')?'인물':x.id.startsWith('grp_')?KIND[x.kind]:'배경')).join('')}</ul></section>`:'';
  $('#side-list').innerHTML = pinSec + (past && ui.graphVer!=='work' ? `<div class="flash side-past">${ui.graphVer==='preview'?'AI 제안 미리보기':`'${esc(cname(ui.graphVer))}'`} 시점 목록이에요</div>` : '') +
    sec('chr','인물',chars.length, chars.map(c=>item(c, c.photo?`<img class="side-photo" src="${esc(c.photo)}" alt="" style="border-color:${nationColor(nationOf(s,c))}">`:`<span class="dot" style="background:${nationColor(nationOf(s,c))}${c.situation?.status==='사망'?';opacity:.4':''}"></span>`, c.situation?.status)).join('')) +
    sec('grp','단체',grps.length, grps.map(([g,d])=>item(g,`<span class="sq" style="background:${nationColor(nationOf(s,g))}"></span>`, KIND[g.kind], d)).join('')) +
    sec('bg','배경',bgs.length, bgs.map(b=>item(b,`<span class="sq" style="background:var(--border-strong)"></span>`, b.category)).join(''));
  $$('[data-side]').forEach(b=>b.onclick=()=>pick(b.dataset.side));
  // + 추가는 목록 맨 위에 이름 칸을 연다 (브라우저 입력창 대신)
  $$('[data-new]').forEach(b=>b.onclick=()=>{ ui.adding = ui.adding===b.dataset.new ? null : b.dataset.new; renderSide(); $('#side-add-name')?.focus(); });
  const backToAdd=k=>{ ui.adding=null; renderSide(); $(`[data-new="${k}"]`)?.focus(); };
  $$('[data-addcancel]').forEach(b=>b.onclick=()=>backToAdd(b.closest('[data-addform]').dataset.addform));
  $$('[data-addform]').forEach(f=>{
    f.onkeydown=ev=>{ if(ev.key==='Escape'){ ev.stopPropagation(); backToAdd(f.dataset.addform); } };
    f.onsubmit=async ev=>{ ev.preventDefault();
      const t=f.dataset.addform, name=clean($('#side-add-name').value).trim().slice(0,NAME_MAX); if(!name){ toast('이름을 입력하세요'); return; }
      const dup=sameName(name); if(dup && !(await sure(`${jq(dup.name||dup.title,'가','이')} 이미 있어요. 같은 이름으로 하나 더 만들까요?`, '하나 더 만들기'))) return;
      const sit={current:'', status:'', history:[]};
      if(t==='chr'){ const id=newId('chr'); addManual(`/characters/${id}`, {id, name, aliases:[], memberships:[], traits:[], situation:sit}); ui.sel=id; }
      else if(t==='grp'){ const id=newId('grp'); addManual(`/groups/${id}`, {id, name, kind:'organization', parent:null, traits:[], situation:sit}); ui.sel=id; }
      else { const id=newId('bg'); addManual(`/background/${id}`, {id, category:'기타', title:name, content:'', introduced_in:null}); ui.sel=id; }
      ui.adding=null; ui.editing=null; ui.graphVer='work'; ui.sheet='full'; toast(`${jq(name,'를','을')} 추가했어요`); sideOpen(false); showTab('world'); focusDetail(); };
  });
}
/* 인물·단체·배경을 골라 오른쪽 상세 패널로 연다 */
function pick(id){
  ui.sel=id; ui.editing=null; sideOpen(false);
  if(cur()!=='world') showTab('world'); else render('world');
  focusDetail();
}
function focusDetail(){ const d=$('#detail'); if(!d) return; d.setAttribute('tabindex','-1'); d.focus({preventScroll:true}); if(window.innerWidth<1200 && !isPhone()) d.scrollIntoView({behavior:'smooth', block:'start'}); }
function sideOpen(open){
  const side=$('#side'), was=side.classList.contains('open'), inside=side.contains(document.activeElement);
  side.classList.toggle('open', open); $('#side-backdrop').hidden=!open; document.body.classList.toggle('side-lock', open);
  const tg=$('#side-toggle'); tg.setAttribute('aria-expanded', open);
  if(open && !was && getComputedStyle(tg).display!=='none') $('#side-q').focus();
  else if(!open && was && inside) tg.focus();
}
/* 고정(즐겨찾기): 도구창 맨 위에 모아 둔다. 버전 기록에는 남기지 않는다 */
const pinBtn=id=>`<button class="btn btn-sm pin-btn" type="button" data-pin="${id}" aria-pressed="${PINS.includes(id)}" title="도구창 맨 위에 고정">${PINS.includes(id)?'★ 고정됨':'☆ 고정'}</button>`;
function togglePin(id){ const i=PINS.indexOf(id); if(i<0) PINS.unshift(id); else PINS.splice(i,1); lastJson=null; toast(i<0?`${jq(nm(state,id),'를','을')} 맨 위에 고정했어요`:'고정을 풀었어요'); }
function bgDetail(b){
  return `<div class="Subhead"><h2>${esc(b.title)}</h2><span class="Label">배경</span><span class="Label">${esc(b.category)}</span>
    ${b.introduced_in?`<span class="Label Label--done">${icon('commit')}${esc(cname(b.introduced_in))}에서 추가</span>`:''}
    <div class="actions">${pinBtn(b.id)}<button class="btn btn-sm btn-danger" id="ent-del">지우기</button></div></div>
    <div class="Box"><div class="Box-body stack">
      <div style="display:flex;gap:8px;flex-wrap:wrap"><div class="form-group" style="flex:2 1 200px"><label for="bg-title">제목</label><input class="form-control" id="bg-title" maxlength="${NAME_MAX}" value="${esc(b.title)}"></div>
        <div class="form-group" style="flex:1 1 120px"><label for="bg-cat">분류</label><input class="form-control" id="bg-cat" maxlength="20" value="${esc(b.category)}"></div></div>
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
    :`<div class="form-group"><label for="ed-alias">다른 이름 (쉼표로 구분)</label><input class="form-control" id="ed-alias" maxlength="120" value="${esc((e.aliases||[]).join(', '))}"></div>`}
    <div style="display:flex;gap:8px"><button class="btn btn-primary" id="ed-save">저장</button><button class="btn" id="ed-cancel">취소</button></div>
  </div></div>`;
}
function addRelRow(e){
  const others=[...state.groups,...state.characters].filter(x=>x.id!==e.id);
  if(!others.length) return '';
  return `<div class="Box-row" style="flex-wrap:wrap;gap:8px;background:var(--bg-subtle)">
    <select class="form-control" id="rel-to" style="flex:1 1 130px;width:auto" aria-label="관계 대상">${others.map(x=>`<option value="${x.id}">${esc(optName(others,x))}</option>`).join('')}</select>
    <select class="form-control" id="rel-type" style="width:auto" aria-label="관계 유형">${Object.entries(REL).map(([k,R])=>`<option value="${k}">${R.l}</option>`).join('')}</select>
    <select class="form-control" id="rel-dir" style="width:auto" aria-label="관계 방향"><option value="none">방향 없음</option><option value="out">${esc(e.name)} → 상대</option><option value="in">상대 → ${esc(e.name)}</option></select>
    ${levelSelect('rel-int',0.5,'관계 세기')}
    <input class="form-control" id="rel-note" maxlength="80" placeholder="메모 (선택)" style="flex:1 1 120px;width:auto" aria-label="메모">
    <button class="btn btn-sm" id="rel-add">+ 관계 추가</button></div>`;
}
function wireEntityEdit(e){
  const c=coll(e.id), base=`/${c}/${e.id}`;
  const done=msg=>{ toast(msg); render('world'); };
  $('#ent-edit').onclick=()=>{ ui.editing = ui.editing===e.id?null:e.id; render('world'); if(ui.editing) $('#ed-name')?.focus(); };
  const cc=$('#ed-cancel'); if(cc) cc.onclick=()=>{ ui.editing=null; render('world'); };
  const sv=$('#ed-save'); if(sv) sv.onclick=async ()=>{
    const name=clean($('#ed-name').value).trim().slice(0,NAME_MAX); if(!name){ toast('이름을 입력하세요'); return; }
    const dup=name!==e.name && sameName(name, e.id); if(dup && !(await sure(`${jq(dup.name||dup.title,'가','이')} 이미 있어요. 그래도 이 이름으로 바꿀까요?`, '바꾸기'))) return;
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
  const rt=$('#rel-type'), rd=$('#rel-dir'); if(rt && rd) rt.onchange=()=>{ rd.value = rt.value==='dominate' ? 'out' : 'none'; };
  const ra=$('#rel-add'); if(ra) ra.onclick=()=>{
    const id=newId('rel'), to=$('#rel-to').value, note=$('#rel-note').value.trim();
    const dir=$('#rel-dir').value;
    const r={id, from:dir==='in'?to:e.id, to:dir==='in'?e.id:to, type:$('#rel-type').value, intensity:Math.round(clamp(+$('#rel-int').value||0,0,1)*100)/100}; if(note) r.note=note; if(dir!=='none') r.directed=true;
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
      ${(()=>{ const cand=s.groups.filter(g=>!e.memberships.some(m=>m.group===g.id)); return cand.length?`<div class="Box-row" style="flex-wrap:wrap;gap:8px;background:var(--bg-subtle)"><select class="form-control" id="mem-group" style="flex:1 1 140px;width:auto" aria-label="소속 단체">${cand.map(g=>`<option value="${g.id}">${esc(g.name)}</option>`).join('')}</select><input class="form-control" id="mem-role" maxlength="30" placeholder="역할 (선택)" style="flex:1 1 110px;width:auto" aria-label="역할">${levelSelect('mem-bond',0.75,'소속감')}<button class="btn btn-sm" id="mem-add">+ 소속 추가</button></div>`:`<div class="Box-row caption">${s.groups.length?'추가할 수 있는 단체가 더 없어요.':'소속을 추가하려면 먼저 단체를 만드세요.'}</div>`; })()}</div>`;
  }
  return `<div class="Subhead">${e.photo?`<img class="ent-photo" src="${esc(e.photo)}" alt="${esc(e.name)} 사진">`:''}<h2>${esc(e.name)}</h2>
      ${isG?`<span class="Label">${KIND[e.kind]}</span>`:'<span class="Label">인물</span>'}
      ${nat&&nat!==e.id?`<span class="Label" style="color:${nationColor(nat)};border-color:${nationColor(nat)}">${esc(nm(s,nat))}</span>`:''}
      ${e.aliases?.length?`<span class="caption">다른 이름: ${esc(e.aliases.join(', '))}</span>`:''}
      <div class="actions">${pinBtn(e.id)}<button class="btn btn-sm" id="ent-edit" aria-pressed="${ui.editing===e.id}">이름·기본 정보 수정</button>
        <button class="btn btn-sm" type="button" id="ent-photo-btn">${e.photo?'사진 바꾸기':'사진 넣기'}</button><input type="file" accept="image/*" id="ent-photo" hidden>${e.photo?'<button class="btn btn-sm" id="ent-photo-del">사진 빼기</button>':''}<button class="btn btn-sm btn-danger" id="ent-del">지우기</button></div></div>
    ${ui.editing===e.id?editBox(e):''}
    <div class="cols2">
      <div class="stack">
        <div class="Box"><div class="Box-header"><h3>메모</h3><span class="caption right">다른 곳을 누르면 저장돼요</span></div>
          <div class="Box-body"><textarea class="form-control" id="ent-notes" rows="4" placeholder="${isG?'목표, 세력 규모, 근거지, 숨은 사정 등 자유롭게 적어요':'외모, 나이, 말투, 목표, 비밀 등 자유롭게 적어요'}">${esc(e.notes||'')}</textarea></div></div>
        <div class="Box"><div class="Box-header"><h3>상황</h3>${sit.status?`<span class="Label ${statusCls(sit.status)}">${esc(sit.status)}</span>`:''}<span class="caption right">다른 곳을 누르면 저장돼요</span></div>
          <div class="Box-body stack">
            <div class="form-group"><label for="sit-current">현재</label><textarea class="form-control" id="sit-current" rows="3">${esc(sit.current)}</textarea></div>
            <div style="display:flex;gap:8px;align-items:flex-end;flex-wrap:wrap"><div class="form-group" style="flex:1 1 140px"><label for="sit-status">상황 태그</label><input class="form-control" id="sit-status" maxlength="40" value="${esc(sit.status)}"></div>
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
          <div class="Box-row" style="flex-wrap:wrap;gap:8px;background:var(--bg-subtle)"><input class="form-control" id="tr-label" maxlength="30" placeholder="새 성격 (예: 복수심)" style="flex:1 1 150px;width:auto" aria-label="새 성격 이름">${levelSelect('tr-val',0.75,'성격 세기')}<button class="btn btn-sm" id="tr-add">+ 성격 추가</button></div></div>
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
  const tr=e=>(e.traits||[]).map(t=>({key:t.key,label:t.label,value:t.value,target:t.target}));
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
  const hit=new Set(items.filter(it=>it.source==='direct').map(it=>it.target));
  items.forEach(it=>{
    if(Math.abs(it.w)<0.25) return;
    if(it.source!=='direct' && hit.has(it.target)) return;
    const sum = it.summary || (a.rewrite[it.target]?.[1]) || `${nm(s,it.via)}에서 전해진 '${a.title}'의 영향을 받음.`;
    const h={commit:cid, summary:sum, source:it.source}; if(it.via){ h.via=it.via; h.weight=Math.round(it.w*100)/100; }
    patches.push({op:'add', path:`/${coll(it.target)}/${it.target}/situation/history/-`, after:h});
    if(!maxW[it.target] || Math.abs(it.w)>Math.abs(maxW[it.target])) maxW[it.target]=it.w;
  });
  Object.entries(maxW).forEach(([id,w])=>{
    if(Math.abs(w)<0.6) return; const e=ent(s,id); if(!e?.situation) return;
    const [st,txt]=a.rewrite[id] || [e.situation.status, `'${a.title}' 이후 ${w<0?'큰 타격을 받아 대응을 모색 중':'세력을 키울 기회를 잡음'}.`];
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
        <div class="form-group"><label for="ev-title">사건 제목</label><input class="form-control" id="ev-title" maxlength="60" value="${esc(analysis?.title ?? ui.evDraft?.title ?? '')}" placeholder="예: ${esc(SAMPLE.title||'왕국에 전쟁이 선포된다')}"></div>
        <div class="form-group"><label for="ev-text">무슨 일이 일어나나요?</label><textarea class="form-control" id="ev-text" rows="3" placeholder="누가 무엇을 했고, 어떤 단체와 인물이 엮이는지 적어 주세요">${esc(analysis?.description ?? ui.evDraft?.description ?? '')}</textarea></div>
        <div class="form-group" style="max-width:260px"><label for="ev-time">작중 시점</label><input class="form-control" id="ev-time" maxlength="40" value="${esc(analysis?.story_time ?? ui.evDraft?.story_time ?? '')}" placeholder="예: ${esc(SAMPLE.story_time||'2부 초반')}"></div>
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
  // 쓰던 제목·내용·시점은 탭을 옮겨도 남게 초안(ui.evDraft)에 계속 담는다
  const keep=()=>{ const d={title:$('#ev-title').value, description:$('#ev-text').value, story_time:$('#ev-time').value}; ui.evDraft=d; if(analysis){ analysis.title=d.title.trim()||analysis.title; analysis.description=d.description; analysis.story_time=d.story_time; } };
  $('#ev-title').oninput=e=>{ $('#ev-pos-title').textContent=e.target.value.trim()||'새 사건'; keep(); };
  $('#ev-text').oninput=keep; $('#ev-time').oninput=keep;
  if(evBusy){ $('#ev-run').disabled=true; $('#ev-result').innerHTML=`<div class="Box"><div class="Box-body" style="display:flex;gap:8px;align-items:center"><div class="spinner"></div><span class="muted">AI가 사건을 분석하고 있어요</span></div></div>`; }
  $('#ev-run').onclick=async (e, deep=false)=>{
    const text=$('#ev-text').value.trim(), time=$('#ev-time').value.trim();
    // 제목을 비우면 내용 앞부분을 이름으로 쓴다 (타임라인에 '새 사건'만 줄줄이 생기지 않게)
    const title=$('#ev-title').value.trim() || (text.length>18 ? text.slice(0,18).trim()+'…' : text) || '새 사건';
    if(!text){ $('#ev-result').innerHTML=`<div class="flash flash-warn" role="alert">${icon('alert')}<div>사건 내용을 입력하세요.</div></div>`; $('#ev-text').focus(); return; }
    const btn=$('#ev-run'); btn.disabled=true;
    // 이전 결과는 버린다: 기다리는 동안 예전 결과가 기록되지 않게
    const prev=deep&&analysis&&!analysis.guess&&!analysis.done?analysis:null;
    analysis=null; evBusy=true; ui.evDraft={title:$('#ev-title').value, description:text, story_time:time};
    const req=++evSeq, wk=worldKey, from=ui.evFrom;
    if(innerWidth<900) requestAnimationFrame(()=>$('#ev-result')?.scrollIntoView({behavior:'smooth', block:'nearest'}));
    $('#ev-result').innerHTML=`<div class="Box"><div class="Box-body" style="display:flex;gap:8px;align-items:center"><div class="spinner"></div><span class="muted">${deep?'AI가 사건을 깊게 다시 분석하고 있어요. 30~60초쯤 걸려요':'AI가 사건이 단체·인물에 주는 직접 영향을 판단하고 있습니다'} <span id="ev-wait"></span></span></div></div>`;
    const t0=Date.now(), tick=setInterval(()=>{ const w=$('#ev-wait'), s=Math.round((Date.now()-t0)/1000); if(w) w.textContent=`· ${s}초`+(s>=(deep?70:25)?' (AI 서버가 붐벼 다시 시도하는 중이에요)':''); },1000);
    let a, note='';
    try{
      const r=await analyzeEvent({title, description:text, story_time:time}, worldForAi(title+' '+text), deep);
      a=r.analysis; if(r.deep) a.deep=true; a.canDeep=r.usage?.admin||r.usage?.plan==='pro'; Object.entries(a.relevance||{}).forEach(([k,v])=>{ RELEVANCE[k]={...(RELEVANCE[k]||{}), ...v}; });
      showUsage(r.usage); toast(`AI 분석 완료 (${aiName(r)}) · 토큰 ${r.tokens.toLocaleString()} 사용`);
      if(!a.direct.length) note='AI가 직접 영향을 받는 대상을 찾지 못했습니다. 사건에 단체나 인물 이름을 넣어 보세요.';
    }catch(err){
      console.warn('AI 분석 실패', err);
      if(err.status===429) note=quotaNote(err);
      else if(deep) note=`깊게 분석하지 못했어요. ${friendlyErr(err)}. 다시 눌러 보세요.`;
      else note=`AI 분석을 쓸 수 없어 간단 추정으로 대신했어요. ${friendlyErr(err)}.`;
      if(deep && prev){ a=prev; }   // 깊게 분석이 실패하면 앞의 결과를 그대로 둔다
      else { a = (title===SAMPLE.title) ? {...clone(SAMPLE), description:text} : guessAnalysis(title, text); a.guess=true; }
    }
    clearInterval(tick);
    if(req!==evSeq) return;              // 더 새 분석이 시작됨
    evBusy=false;
    if(wk!==worldKey){ toast('다른 세계관으로 옮겨서 분석 결과를 버렸어요'); return; }
    // 기다리는 동안 지워진 대상은 뺀다
    const has=id=>!!ent(state,id);
    a.direct=(a.direct||[]).filter(d=>has(d.target)); a.relations=(a.relations||[]).filter(r=>{ const m=r.path?.match(/^\/relations\/([^/]+)/); return !m || state.relations.some(x=>x.id===m[1]); });
    if(a.rewrite) Object.keys(a.rewrite).forEach(k=>{ if(!has(k)) delete a.rewrite[k]; });
    analysis=a; analysis.story_time=time; analysis.from=from; analysis.note=note;
    if(cur()!=='event'){ toast('사건 분석이 끝났어요. 사건 입력 탭에서 확인하세요'); return; }
    btn.disabled=false; drawAnalysis();
    if(innerWidth<900) $('#ev-result')?.scrollIntoView({behavior:'smooth', block:'start'});
  };
  if(analysis && !evBusy) drawAnalysis();
  wirePending();
}
let evBusy=false, evSeq=0;
/* 사건 여파와 인물별 손익·행동. 분석 화면과 기록 화면에서 같이 쓴다 */
function reactionsHtml(aftermath, list, st=state){
  const rs=(list||[]).filter(r=>ent(st,r.id));
  if(!aftermath && !rs.length) return '';
  return `${aftermath?`<div class="Box-body" style="line-height:1.6">${esc(aftermath)}</div>`:''}
    ${rs.map(r=>`<div class="Box-row" style="align-items:flex-start;gap:12px">
      <div style="flex:0 0 110px;min-width:0"><b>${esc(nm(st,r.id))}</b><div class="caption"><span class="Label ${r.involvement==='연루'?'Label--attention':''}">${esc(r.involvement)}</span></div></div>
      <div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:4px">
        <div><span class="caption">손익 </span>${esc(r.impact)}</div>
        <div><span class="caption">앞으로 </span>${esc(r.action)}</div>
      </div></div>`).join('')}`;
}
function drawAnalysis(){
  const a=analysis, box=$('#ev-result'); if(!box) return;
  const cand=[...state.groups, ...state.characters].filter(e=>!a.direct.some(d=>d.target===e.id));
  box.innerHTML = `
  <div class="Box">
    ${a.note?`<div class="flash flash-warn" role="alert" style="margin:12px">${icon('alert')}<div>${esc(a.note)}</div></div>`:''}
    <div class="Box-header"><span class="step-badge">1</span><h3>직접 영향</h3>${a.guess?'<span class="Label Label--attention">간단 추정 (AI 아님)</span>':`<span class="ai-badge">${icon('spark')}AI 판단</span>`}<span class="caption right">영향 크기와 태그는 고칠 수 있어요</span></div>
    ${a.direct.length?'':'<div class="Box-body caption">사건에서 세계관 항목을 찾지 못했습니다. 아래에서 대상을 추가하세요.</div>'}
    ${a.direct.map((d,i)=>`<div class="direct-row">
      <div><b>${esc(nm(state,d.target))}</b><div class="caption">${d.target.startsWith('grp_')?KIND[ent(state,d.target).kind]:'인물'}</div></div>
      <div class="mrow"><input type="range" min="-1" max="1" step="0.05" value="${d.M}" data-m="${i}" aria-label="${esc(nm(state,d.target))} 영향 크기"><span class="num" id="mv${i}" style="width:44px;text-align:right">${sf2(d.M)}</span></div>
      <button class="btn btn-sm btn-danger" data-del="${i}" aria-label="삭제" style="padding:2px 6px">×</button>
      <div class="chips full">${TAGS.map(t=>`<button class="chip" data-tag="${i}|${t}" aria-pressed="${d.tags.includes(t)}">${t}</button>`).join('')}</div>
      <input class="form-control full" maxlength="200" data-sum="${i}" value="${esc(d.summary)}" aria-label="요약">
    </div>`).join('')}
    <div class="Box-row" style="background:var(--bg-subtle);flex-wrap:wrap"><select class="form-control" id="add-target" style="width:auto;flex:1 1 200px" aria-label="대상 추가">
      ${cand.map(e=>`<option value="${e.id}">${esc(e.name)}</option>`).join('')}</select><button class="btn btn-sm" id="add-direct">+ 직접 영향 추가</button></div>
  </div>
  ${(a.aftermath||a.reactions?.length)?`<div class="Box"><div class="Box-header"><h3>여파와 인물별 반응</h3><span class="ai-badge">${icon('spark')}AI 판단</span>${a.deep?'<span class="Label Label--success">깊게 분석</span>':''}<span class="caption right">누가 무엇을 잃고 어떻게 움직일지</span></div>${reactionsHtml(a.aftermath, a.reactions)}</div>`:''}
  ${a.canDeep&&!a.guess&&!a.deep?`<div class="Box"><div class="Box-row" style="background:var(--bg-subtle);flex-wrap:wrap;gap:8px"><span class="caption" style="flex:1 1 240px">여파와 인물 반응을 더 풍부하게 보고 싶다면 더 깊이 생각하는 AI로 한 번 더 분석해요. 30~60초쯤 걸리고 토큰을 조금 더 써요.</span><button class="btn btn-sm" id="ev-deep">${icon('spark')}깊게 분석</button></div></div>`:''}
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
  const dp=$('#ev-deep'); if(dp) dp.onclick=()=>{ const run=$('#ev-run'); if(run && !run.disabled) run.onclick(null, true); };
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
      <input class="form-control" id="ev-msg" maxlength="80" style="flex:1 1 240px;width:auto" value="사건: ${esc(a.title)}" aria-label="기록 이름">
      <button class="btn" id="ev-preview">${icon('graph')}관계도에서 미리보기</button>
      <button class="btn btn-primary" id="ev-commit" ${pending.length||!patches.length?'disabled':''}>${icon('commit')}사건 기록하기</button>
    </div>`;
  $('#ev-preview').onclick=()=>{ ui.graphVer='preview'; showTab('graph'); };
  $('#ev-commit').onclick=()=>{
    if(analysis!==a || a.done) return;   // 연타·이미 기록한 결과는 무시
    a.done=true; $('#ev-commit').disabled=true;
    const id=newSha(); const ps=buildPatches(a,id); const {items:its}=finals(a);
    ps.forEach(p=>applyPatch(state,p));
    addCommit({id, parent:head().id, kind:'event', message:$('#ev-msg').value.trim()||'사건: '+a.title, created_at:new Date().toISOString(),
      event:{title:a.title, description:a.description, story_time:a.story_time, involved:a.direct.map(d=>d.target), ...(a.aftermath?{aftermath:a.aftermath}:{}), ...(a.reactions?.length?{reactions:a.reactions}:{})},
      impacts:its.map(it=>({target:it.target, source:it.source, via:it.via, tags:it.tags, magnitude:Math.round(it.w*100)/100, summary:it.summary||''})), patches:ps});
    if(a.from && msResult) msResult.events=msResult.events.filter(e=>e!==a.from);   // 원고 후보에서 기록한 사건은 뺀다
    analysis=null; ui.evDraft=null; ui.evFrom=null; ui.graphVer='work'; ui.open={[id]:true}; toast(`'${cname(id)}' 사건을 기록했어요 · 변경 ${ps.length}건`); showTab('history');
  };
}

/* ---------- 원고 ----------
   화(챕터)별로 원고를 쓰고 저장한다. 목록(제목·글자 수·시각)은 세계관 저장본(snapshot.chapters)에 함께 두고,
   본문과 이전 버전은 화마다 따로 둔다: 브라우저 localStorage + Firestore users/{uid}/worlds/ms_{세계관}_{화 id}.
   (세계관 문서 하나의 1MB 한도를 넘지 않게 나눠 둔다.) 이전 버전마다 그때의 세계관 기록(commit)을 함께 남겨
   "이 원고를 쓸 때 세계관이 어땠는지"를 이어서 볼 수 있게 한다. AI로 읽기는 지금 화 본문으로 한다. */
const MS_MAX=12000, CH_MAX=30000, VER_MAX=8, VER_GAP=10*60*1000;
let CHAPTERS=[], msResult=null;
const chBody={};                 // id -> {title,text,versions:[{at,text,commit}],savedAt}
const chTimers={};
const chLocalKey=id=>`gitstory-ms-${USER.uid}-${worldKey}-${id}`;
const chCloudKey=id=>`ms_${worldKey}_${id}`;
const hm=t=>{ const x=new Date(t); return `${String(x.getHours()).padStart(2,'0')}:${String(x.getMinutes()).padStart(2,'0')}`; };
function when(t){
  if(!t) return ''; const d=Date.now()-t;
  if(d<60e3) return '방금'; if(d<3600e3) return `${Math.floor(d/60e3)}분 전`; if(d<86400e3) return `${Math.floor(d/3600e3)}시간 전`;
  const x=new Date(t); return `${x.getMonth()+1}월 ${x.getDate()}일`;
}
function chMeta(id){ return CHAPTERS.find(c=>c.id===id); }
function loadChapter(id){
  if(chBody[id]) return chBody[id];
  let b=null; try{ b=JSON.parse(localStorage.getItem(chLocalKey(id))); }catch(e){}
  chBody[id]=b&&typeof b.text==='string'?b:{title:chMeta(id)?.title||'', text:'', versions:[], savedAt:0};
  const key=worldKey;
  loadCloud(chCloudKey(id)).then(r=>{
    if(key!==worldKey || !r?.data || r.updatedAt<=(chBody[id]?.savedAt||0) || typeof r.data.text!=='string') return;
    chBody[id]={...r.data, savedAt:r.updatedAt};
    try{ localStorage.setItem(chLocalKey(id), JSON.stringify(chBody[id])); }catch(e){}
    if(cur()==='manuscript' && ui.ch===id) renderManuscript();
  }).catch(err=>console.warn('원고 불러오기 실패', err));
  return chBody[id];
}
function saveChapter(id, now=false){
  const b=chBody[id], m=chMeta(id); if(!b||!m) return;
  b.savedAt=Date.now(); m.updatedAt=b.savedAt; m.chars=b.text.length; m.title=b.title;
  if(localSet(chLocalKey(id), JSON.stringify(b))){ const s=$('#ch-saved'); if(s&&ui.ch===id) s.textContent='브라우저에 저장됨'; }
  else { const s=$('#ch-saved'); if(s&&ui.ch===id) s.textContent='브라우저에 저장 못 함 · 클라우드 저장 중'; }
  clearTimeout(chTimers[id]);
  const key=worldKey, go=()=>{ if(key!==worldKey) return; setCloud('saving');
    saveCloud(chCloudKey(id), b, b.savedAt).then(()=>{ setCloud('synced'); SAVE.cloud=true; saveHealth(); const s=$('#ch-saved'); if(s&&ui.ch===id) s.textContent='저장됨'; })
      .catch(err=>{ console.warn('원고 저장 실패', err); setCloud('offline'); SAVE.cloud=false; saveHealth(); const s=$('#ch-saved'); if(s&&ui.ch===id&&!SAVE.local) s.textContent='저장되지 않음'; }); };
  if(now) go(); else chTimers[id]=setTimeout(go, 800);
  saveWorld();
}
/* 지금 본문을 이전 버전으로 남긴다. 같은 내용이면 건너뛴다. 가장 오래된 것부터 지운다. */
function snapChapter(id, force=false){
  const b=chBody[id]; if(!b||!b.text.trim()) return false;
  const last=b.versions[0];
  if(last && last.text===b.text) return false;
  if(!force && last && Date.now()-last.at<VER_GAP) return false;
  b.versions.unshift({at:Date.now(), text:b.text, commit:head().id}); b.versions=b.versions.slice(0,VER_MAX);
  return true;
}
/* 새 화 이름: 아직 안 쓴 'N화' 중 가장 작은 번호 (지운 뒤 다시 만들어도 이름이 겹치지 않게) */
function nextChTitle(){ const used=new Set(CHAPTERS.map(c=>c.title)); let n=CHAPTERS.length+1; while(used.has(`${n}화`)) n++; return `${n}화`; }
function newChapter(){
  const id=newId('ch'), title=nextChTitle();
  CHAPTERS.push({id, title, chars:0, updatedAt:Date.now()});
  chBody[id]={title, text:'', versions:[], savedAt:0};
  ui.ch=id; ui.chDraft=null; saveChapter(id, true); return id;
}
let msBusy=null;   // AI로 읽는 중인 화 {cid, wk}
async function removeChapter(id){
  let i=CHAPTERS.findIndex(c=>c.id===id); if(i<0) return;
  const meta=CHAPTERS[i], body=loadChapter(id);
  if(body.text.trim() && !(await sure(`${jq(meta.title,'를','을')} 지울까요? 원고 ${body.text.length.toLocaleString()}자와 이전 버전이 함께 지워져요.`, '지우기', true))) return;
  i=CHAPTERS.findIndex(c=>c.id===id); if(i<0) return;
  CHAPTERS.splice(i,1); try{ localStorage.removeItem(chLocalKey(id)); }catch(e){}
  saveCloud(chCloudKey(id), {deleted:true}, Date.now()).catch(()=>{});
  if(ui.ch===id) ui.ch=CHAPTERS[Math.min(i,CHAPTERS.length-1)]?.id||null;
  if(msResult?.cid===id) msResult=null;
  saveWorld(); renderManuscript();
  toastUndo(`${jq(meta.title,'를','을')} 지웠어요`, ()=>{ CHAPTERS.splice(i,0,meta); chBody[id]=body; ui.ch=id; saveChapter(id, true); renderManuscript(); toast(`${jq(meta.title,'를','을')} 되살렸어요`); });
}
function chListHtml(){
  const list=CHAPTERS.map(c=>`<button type="button" class="ch-item" data-ch="${c.id}" ${c.id===ui.ch?'aria-current="true"':''}><b>${esc(c.title||'제목 없음')}</b><span class="caption">${(c.chars||0).toLocaleString()}자 · ${when(c.updatedAt)}${c.readAt?' · AI로 읽음':''}</span></button>`).join('');
  return `<div class="Box-header"><h3>화 목록</h3><span class="Counter">${CHAPTERS.length}</span><button class="btn btn-sm right" id="ch-new" type="button">+ 새 화</button></div>
      ${CHAPTERS.length?`<div class="ch-items">${list}</div>`:`<div class="Box-body caption">아직 저장한 원고가 없어요. 오른쪽에 바로 쓰거나 붙여넣으면 1화로 저장돼요.</div>`}`;
}
function wireChList(){
  $('#ch-new').onclick=()=>{
    if(Date.now()-(wireChList.t||0)<600) return; wireChList.t=Date.now();   // 연타로 빈 화가 여러 개 생기지 않게
    if(ui.ch===ui.chDraft && !chBody[ui.ch]?.text){ $('#ms-text').focus(); return; }
    if(ui.ch && !loadChapter(ui.ch).text.trim()){ $('#ms-text').focus(); toast(`${jq(chMeta(ui.ch)?.title||'이 화','가','이')} 아직 비어 있어요. 여기에 먼저 써 주세요`); return; }
    if(ui.ch) snapChapter(ui.ch); newChapter(); renderManuscript(); $('#ms-text').focus(); toast(`${jq(chMeta(ui.ch).title,'를','을')} 만들었어요`); };
  $$('[data-ch]').forEach(x=>x.onclick=()=>{ if(x.dataset.ch===ui.ch) return; if(ui.ch) snapChapter(ui.ch); ui.ch=x.dataset.ch; ui.chVers=false; renderManuscript(); });
  const cur=document.querySelector('.ch-item[aria-current="true"]'); if(cur) cur.scrollIntoView({block:'nearest', inline:'nearest'});
}
function redrawChList(){ const el=$('.ch-list'); if(!el) return; el.innerHTML=chListHtml(); wireChList(); }
function renderManuscript(){
  if(ui.ch && !chMeta(ui.ch) && ui.ch!==ui.chDraft) ui.ch=null;
  if(!ui.ch && CHAPTERS.length) ui.ch=CHAPTERS.reduce((x,y)=>(y.updatedAt||0)>=(x.updatedAt||0)?y:x).id; // 마지막으로 고친 화
  // 화가 하나도 없으면 아직 목록에 없는 빈 화를 준비해 둔다 (첫 글자를 칠 때 화면을 다시 그리지 않도록)
  if(!ui.ch){ const nid=newId('ch'); chBody[nid]={title:nextChTitle(), text:'', versions:[], savedAt:0}; ui.ch=nid; ui.chDraft=nid; }
  const id=ui.ch, b=chMeta(id)?loadChapter(id):chBody[id], m=chMeta(id), real=!!m;
  const vers=b?.versions||[];
  $('#tab-manuscript').innerHTML = pendingBanner() + `<div class="Subhead"><h2>원고</h2><span class="muted">화마다 원고를 쓰고 저장해요. AI가 읽고 세계관에 반영할 후보를 골라줘요</span></div>
  <div class="split ms-split">
    <aside class="Box ch-list">${chListHtml()}</aside>
    <div class="ms-work">
    <div class="stack" style="min-width:0">
      <div class="Box"><div class="Box-body stack">
        <div class="ch-head"><input class="form-control ch-title" id="ch-title" maxlength="60" placeholder="화 제목 (예: 3화 · 의회 습격)" aria-label="화 제목" value="${esc(b?.title||'')}">
          <button class="btn btn-sm btn-danger" id="ch-del" type="button" ${real?'':'hidden'}>이 화 지우기</button></div>
        <div class="ms-tools" role="toolbar" aria-label="원고 도구">
          <button class="btn btn-sm" id="ms-find" type="button" aria-pressed="${!!ui.find}">찾아 바꾸기</button>
          <details class="ms-export"><summary class="btn btn-sm">내보내기</summary><div class="ms-export-menu" role="menu">
            <button type="button" role="menuitem" data-exp="one">이 화 TXT</button><button type="button" role="menuitem" data-exp="txt">모든 화 TXT</button><button type="button" role="menuitem" data-exp="md">모든 화 Markdown</button><button type="button" role="menuitem" data-exp="pdf">모든 화 PDF (인쇄)</button></div></details>
          <button class="btn btn-sm" id="ms-explain" type="button" title="원고에서 문장을 고른 뒤 누르세요">${icon('spark')}고른 문장 설명해 줘</button>
        </div>
        ${ui.find?findBar():''}
        <div class="form-group"><label for="ms-text" class="sr-only">원고 본문</label>
          <textarea class="form-control ch-text" id="ms-text" rows="16" maxlength="${CH_MAX}" placeholder="여기에 원고를 쓰거나 붙여넣으세요. 쓰는 대로 저장돼요">${esc(b?.text||'')}</textarea>
          <div class="ch-foot"><span class="caption" id="ms-count"></span><span class="caption" id="ch-saved">${b?.savedAt?'저장됨 · '+when(b.savedAt):''}</span></div></div>
        <div class="row-end" style="justify-content:flex-start;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" id="ms-run" type="button">${icon('spark')}AI로 읽기</button>
          <button class="btn" id="ch-snap" type="button" ${real?'':'hidden'}>지금 버전 남기기</button>
          ${m?.readAt?`<span class="caption">AI로 읽음 · ${when(m.readAt)}</span>`:''}
        </div>
      </div></div>
      <div id="ms-result" class="stack"></div>
      ${vers.length?`<details class="Box ch-vers" ${ui.chVers?'open':''}><summary class="Box-header"><h3>이전 버전</h3><span class="Counter">${vers.length}</span><span class="caption right">최근 ${VER_MAX}개까지 남아요</span></summary>
        ${vers.map((v,i)=>`<div class="Box-row" style="align-items:flex-start;flex-wrap:wrap;gap:8px"><div style="flex:1 1 220px;min-width:0"><b>${when(v.at)}</b> <span class="caption">${hm(v.at)} · ${v.text.length.toLocaleString()}자</span>
          <div class="caption">그때 세계관: ${byId(v.commit)?esc(`'${cname(v.commit)}'`):'(지금은 없는 기록)'}</div>
          <div class="caption ch-peek">${esc(v.text.slice(0,90))}${v.text.length>90?'…':''}</div></div>
          <button class="btn btn-sm" data-chrestore="${i}" type="button">이 버전으로 되돌리기</button></div>`).join('')}</details>`:''}
    </div>
    <aside class="ms-aside stack" id="ms-aside" aria-label="설정 카드와 복선 메모">${msAside(id, b)}</aside>
    </div>
  </div>
  <div class="Box" style="margin-top:16px"><div class="Box-header"><h3>이렇게 반영돼요</h3></div><div class="Box-body stack" style="gap:8px">
    <div>1. 원고는 화마다 쓰는 대로 저장돼요. 10분마다, 그리고 AI로 읽을 때 이전 버전이 남아요.</div>
    <div>2. AI가 새 인물·단체, 상황이 바뀐 인물, 새 관계, 큰 사건을 후보로 골라요. 체크한 후보만 세계관에 반영돼요.</div>
    <div>3. 사건 후보는 사건 입력 탭으로 보내 영향 분석을 따로 해요.</div>
    <div class="caption">AI는 한 번에 ${MS_MAX.toLocaleString()}자까지 읽어요. 이미 있는 이름이나 다른 이름과 겹치는 인물은 새로 만들지 않아요.</div>
  </div></div>`;
  const ta=$('#ms-text'), tt=$('#ch-title');
  const cnt=()=>{ const n=ta.value.length; $('#ms-count').innerHTML=`${n.toLocaleString()} / ${CH_MAX.toLocaleString()}자${n>MS_MAX?` <span class="Label Label--attention">AI는 앞 ${MS_MAX.toLocaleString()}자만 읽을 수 있어요</span>`:''}`; };
  // 처음 쓰기 시작하면 준비해 둔 빈 화를 목록에 올린다. 편집기는 다시 그리지 않아 커서·한글 입력이 끊기지 않는다.
  const ensure=()=>{ if(ui.ch===ui.chDraft){ const nb=chBody[ui.ch]; CHAPTERS.push({id:ui.ch, title:nb.title, chars:0, updatedAt:Date.now()}); ui.chDraft=null; redrawChList(); ['#ch-del','#ch-snap'].forEach(q=>{ const el=$(q); if(el) el.hidden=false; }); } return chBody[ui.ch]; };
  const touched=()=>{ const s=$('#ch-saved'); if(s) s.textContent='저장 중…'; };
  ta.oninput=()=>{ const cb=ensure(); snapChapter(ui.ch); cb.text=ta.value; cnt(); touched(); saveChapter(ui.ch); refreshList();
    clearTimeout(ta._ents); ta._ents=setTimeout(()=>{ const el=$('#ms-ents'); if(el) el.innerHTML=msEntsHtml(ta.value); }, 1200); };
  ta.onpaste=ev=>{ const add=(ev.clipboardData?.getData('text')||'').length, room=CH_MAX-(ta.value.length-(ta.selectionEnd-ta.selectionStart)); if(add>room) toast(`한 화는 ${CH_MAX.toLocaleString()}자까지예요. 넘친 ${(add-room).toLocaleString()}자는 들어가지 않았어요. 화를 나눠 주세요`); };
  tt.oninput=()=>{ if(ui.ch===ui.chDraft && !tt.value.trim()) return; const cb=ensure(); cb.title=tt.value.trim()||nextChTitle(); touched(); saveChapter(ui.ch); refreshList(); };
  cnt();
  wireChList();
  wireMsAside(ta, ensure);
  wireFind(ta, pre=>{ if(pre){ ensure(); snapChapter(ui.ch, true); return; } ta.oninput(); });
  $('#ms-find').onclick=()=>{ ui.find=!ui.find; if(ui.find){ const bar=document.createElement('div'); bar.innerHTML=findBar(); ta.closest('.form-group').before(bar.firstElementChild); wireFind(ta, pre=>{ if(pre){ ensure(); snapChapter(ui.ch, true); return; } ta.oninput(); }); const sel=ta.value.slice(ta.selectionStart, ta.selectionEnd); if(sel && sel.length<60 && !sel.includes('\n')){ $('#find-q').value=sel; ui.findQ=sel; $('#find-q').oninput(); } $('#find-q').focus(); } else $('#find-close')?.click(); $('#ms-find').setAttribute('aria-pressed', !!ui.find); };
  $$('[data-exp]').forEach(x=>x.onclick=()=>{ x.closest('details').open=false; exportMs(x.dataset.exp); });
  $('#ms-explain').onclick=()=>{ const q=ta.value.slice(ta.selectionStart, ta.selectionEnd).trim();
    if(q.length<2){ toast('먼저 원고에서 설명이 필요한 문장을 끌어서 고르세요'); ta.focus(); return; }
    ui.askQuote=q.slice(0,1500); askOpen(); askSend('이 부분을 세계관과 앞 내용에 비춰 설명해 줘. 인물의 동기와 관계, 앞에서 이어지는 복선이 있으면 짚어 줘'); };
  const del=$('#ch-del'); if(del) del.onclick=()=>removeChapter(ui.ch);
  const snap=$('#ch-snap'); if(snap) snap.onclick=()=>{ if(snapChapter(ui.ch, true)){ saveChapter(ui.ch, true); ui.chVers=true; renderManuscript(); toast('지금 버전을 남겼어요'); } else toast(chBody[ui.ch]?.text.trim()?'바로 전 버전과 내용이 같아요':'아직 쓴 내용이 없어요'); };
  const vd=$('.ch-vers'); if(vd) vd.ontoggle=()=>{ ui.chVers=vd.open; };
  $$('[data-chrestore]').forEach(x=>x.onclick=()=>{
    const rid=ui.ch, cb=chBody[rid], v=cb.versions[+x.dataset.chrestore]; if(!v) return;
    const prev=cb.text; snapChapter(rid, true); cb.text=v.text; saveChapter(rid, true); renderManuscript();
    // 되돌리기 취소는 그 화에 저장한다 (그 사이 다른 화로 옮겼어도)
    toastUndo(`${hm(v.at)} 버전으로 되돌렸어요`, ()=>{ chBody[rid].text=prev; saveChapter(rid, true); if(cur()==='manuscript') renderManuscript(); });
  });
  $('#ms-run').onclick=async ()=>{
    const text=ta.value.trim(); if(!text){ toast('원고를 쓰거나 붙여넣으세요'); return; }
    if(text.length>MS_MAX){ toast(`AI는 한 번에 ${MS_MAX.toLocaleString()}자까지 읽어요. 화를 나눠 주세요`); return; }
    ensure(); const cid=ui.ch, wk=worldKey; snapChapter(cid, true); saveChapter(cid, true);
    const btn=$('#ms-run'); btn.disabled=true; let note=''; msBusy={cid, wk}; msResult=null;
    $('#ms-result').innerHTML=`<div class="Box"><div class="Box-body" style="display:flex;gap:8px;align-items:center"><div class="spinner"></div><span class="muted">AI가 원고를 읽고 있어요 <span id="ms-wait"></span></span></div></div>`;
    const t0=Date.now(), tick=setInterval(()=>{ const w=$('#ms-wait'), sec=Math.round((Date.now()-t0)/1000); if(w) w.textContent=`· ${sec}초`; },1000);
    try{
      // 겹치는 인물을 걸러야 하니 세계관 전체를 보낸다
      const r=await extractManuscript(text, worldForAi(''));
      // 이미 있는 이름은 기본으로 체크를 끄고 '이미 있어요'로 표시한다
      const on=a=>a.map(x=>({...x, on:true})), known=a=>a.map(x=>sameName(x.name)?{...x, on:false, dup:true}:{...x, on:true});
      if(wk===worldKey){
        msResult={cid, characters:known(r.result.characters), groups:known(r.result.groups), updates:on(r.result.updates), relations:on(r.result.relations), events:r.result.events};
        const cm=chMeta(cid); if(cm){ cm.readAt=Date.now(); cm.readCommit=head().id; saveWorld(); }
      }
      showUsage(r.usage); toast(`원고 읽기 완료 (${aiName(r)}) · 토큰 ${r.tokens.toLocaleString()} 사용`);
    }catch(err){
      console.warn('원고 읽기 실패', err);
      if(err.status===429) note=quotaNote(err);
      else note=`원고를 읽지 못했어요. ${friendlyErr(err)}.`;
    }
    clearInterval(tick); msBusy=null;
    // 기다리는 동안 다른 세계관으로 옮겼으면 결과를 버린다 (다른 세계관에 반영되지 않게)
    if(wk!==worldKey){ toast('다른 세계관으로 옮겨서 원고 읽기 결과를 버렸어요'); return; }
    if(note) msResult={cid, note};
    const title=chMeta(cid)?.title||'원고';
    if(ui.ch!==cid || cur()!=='manuscript'){ toast(note?`${title} 읽기에 실패했어요`:`${title} 읽기가 끝났어요. 원고 탭의 그 화에서 후보를 확인하세요`); return; }
    renderManuscript();
  };
  if(msBusy && msBusy.cid===ui.ch && msBusy.wk===worldKey){ $('#ms-run').disabled=true; $('#ms-result').innerHTML=`<div class="Box"><div class="Box-body" style="display:flex;gap:8px;align-items:center"><div class="spinner"></div><span class="muted">AI가 원고를 읽고 있어요</span></div></div>`; }
  else if(msResult && msResult.cid===ui.ch) drawMs();
  wirePending();
}
/* 원고 옆 패널: 카드 열기, 복선 메모 추가·체크·지우기 (편집기는 다시 그리지 않는다) */
function wireMsAside(ta, ensure){
  const box=$('#ms-aside'); if(!box) return;
  const redraw=()=>{ box.innerHTML=msAside(ui.ch, chBody[ui.ch]); wireMsAside(ta, ensure); };
  box.onclick=ev=>{
    const c=ev.target.closest('[data-mscard]'); if(c){ ui.msCard=ui.msCard===c.dataset.mscard && c.classList.contains('chip') ? null : c.dataset.mscard; redraw(); return; }
    const o=ev.target.closest('[data-msopen]'); if(o){ ui.graphVer='work'; ui.sheet='full'; pick(o.dataset.msopen); return; }
    const r=ev.target.closest('[data-memorm]'); if(r){ ev.preventDefault(); const b=ensure(); const i=(b.memos||[]).findIndex(m=>m.id===r.dataset.memorm); if(i<0) return; const [m]=b.memos.splice(i,1); saveChapter(ui.ch); redraw();
      toastUndo('복선 메모를 지웠어요', ()=>{ b.memos.splice(i,0,m); saveChapter(ui.ch); if(cur()==='manuscript') renderManuscript(); }); return; }
    const ch=ev.target.closest('[data-memoch]'); if(ch){ if(ui.ch) snapChapter(ui.ch); ui.ch=ch.dataset.memoch; renderManuscript(); }
  };
  $$('#ms-aside [data-memo]').forEach(x=>x.onchange=()=>{ const b=ensure(); const m=(b.memos||[]).find(y=>y.id===x.dataset.memo); if(!m) return; m.done=x.checked; if(m.done) m.doneAt=Date.now(); saveChapter(ui.ch); redraw(); if(m.done) toast('복선을 회수했어요'); });
  const pk=$('#ms-card-pick'); if(pk) pk.onchange=()=>{ ui.msCard=pk.value||null; redraw(); };
  const f=$('#memo-form'); if(f) f.onsubmit=ev=>{ ev.preventDefault(); const t=clean($('#memo-text').value).trim(); if(!t){ toast('복선 내용을 적어 주세요'); return; }
    const b=ensure(); (b.memos||(b.memos=[])).push({id:newId('memo'), text:t.slice(0,200), done:false, at:Date.now()}); saveChapter(ui.ch); redraw(); $('#memo-text').focus(); };
}
/* 목록의 글자 수·시각만 다시 그린다 (쓰는 중에 편집기를 다시 그리지 않도록) */
function refreshList(){
  CHAPTERS.forEach(c=>{ const el=document.querySelector(`[data-ch="${c.id}"]`); if(!el) return;
    el.querySelector('b').textContent=c.title||'제목 없음';
    el.querySelector('.caption').textContent=`${(c.chars||0).toLocaleString()}자 · ${when(c.updatedAt)}${c.readAt?' · AI로 읽음':''}`; });
  const s=$('#ch-saved'); 
}
function drawMs(){
  const r=msResult, box=$('#ms-result'); if(!box||!r||r.cid!==ui.ch) return;
  if(r.note){ box.innerHTML=`<div class="flash flash-warn" role="alert">${icon('alert')}<div>${esc(r.note)}</div></div>`; return; }
  const who=x=>ent(state,x)?nm(state,x):x;
  const row=(k,i,x,body)=>`<label class="Box-row" style="cursor:pointer;align-items:flex-start"><input type="checkbox" data-ms="${k}|${i}" ${x.on?'checked':''} style="margin-top:4px"><div style="flex:1;min-width:0">${body}</div></label>`;
  const sec=(k,title,items,fn)=>items.length?`<div class="Box"><div class="Box-header"><h3>${title}</h3><span class="Counter">${items.length}</span></div>${items.map((x,i)=>row(k,i,x,fn(x))).join('')}</div>`:'';
  const total=['characters','groups','updates','relations'].reduce((a,k)=>a+r[k].length,0);
  const picked=['characters','groups','updates','relations'].reduce((a,k)=>a+r[k].filter(x=>x.on).length,0);
  box.innerHTML = (total||r.events.length ? '' : '<div class="Box"><div class="Box-body caption">반영할 만한 새 내용을 찾지 못했어요.</div></div>')
    + sec('characters','새 인물',r.characters,c=>`<b>${esc(c.name)}</b>${c.dup?' <span class="Label Label--attention">이미 있어요</span>':''}${c.aliases.length?` <span class="caption">(${esc(c.aliases.join(', '))})</span>`:''}${c.group?` <span class="Label">${esc(who(c.group))}${c.role?' · '+esc(c.role):''}</span>`:''}<div class="caption">${esc(c.summary)}</div>`)
    + sec('groups','새 단체',r.groups,g=>`<b>${esc(g.name)}</b>${g.dup?' <span class="Label Label--attention">이미 있어요</span>':''} <span class="Label">${KIND[g.kind]||'조직'}</span>${g.parent?` <span class="caption">${esc(ent(state,g.parent)?nm(state,g.parent):g.parent)} 소속</span>`:''}<div class="caption">${esc(g.summary)}</div>`)
    + sec('updates','상황 변화',r.updates,u=>{ const e=ent(state,u.id); return `<b>${esc(nm(state,u.id))}</b> <span class="Label Label--attention">${esc(u.status)}</span><div class="ms-cmp"><div class="ms-cmp-a"><span class="caption">지금</span>${e?.situation?.status?` <span class="Label">${esc(e.situation.status)}</span>`:''}<div>${esc(e?.situation?.current||'(없음)')}</div></div><div class="ms-cmp-b"><span class="caption">바뀔 내용</span> <span class="Label Label--attention">${esc(u.status)}</span><div>${esc(u.text)}</div></div></div>`; })
    + sec('relations','새 관계',r.relations,x=>{ const R=REL[x.type]||REL.personal; return `<b>${esc(who(x.from))}</b> ↔ <b>${esc(who(x.to))}</b> <span class="Label" style="color:${R.c};border-color:${R.c}">${R.l} · ${lvOf(x.intensity)}</span>${x.note?`<div class="caption">${esc(x.note)}</div>`:''}`; })
    + (total?`<div class="Box"><div class="Box-row" style="background:var(--bg-subtle);flex-wrap:wrap"><span class="caption" style="flex:1">${picked}개 선택됨. 새 인물이 들어간 관계는 그 인물도 체크해야 담겨요. 반영하기 전까지 세계관은 바뀌지 않아요.</span><button class="btn btn-sm" id="ms-all" type="button">${picked===total?'모두 해제':'모두 선택'}</button><button class="btn btn-primary" id="ms-apply" ${picked?'':'disabled'}>선택한 후보 반영</button></div></div>`:'')
    + (r.events.length?`<div class="Box"><div class="Box-header"><h3>사건 후보</h3><span class="Counter">${r.events.length}</span><span class="caption right">하나씩 영향 분석해요</span></div>
      ${r.events.map((e,i)=>`<div class="Box-row" style="align-items:flex-start;flex-wrap:wrap"><div style="flex:1 1 220px;min-width:0"><b>${esc(e.title)}</b>${e.story_time?` <span class="caption">${esc(e.story_time)}</span>`:''}<div class="caption">${esc(e.description)}</div></div>
        <button class="btn btn-sm" data-msev="${i}">${icon('bolt')}사건 입력으로 보내기</button></div>`).join('')}</div>`:'');
  $$('[data-ms]').forEach(c=>c.onchange=()=>{ const [k,i]=c.dataset.ms.split('|'); r[k][i].on=c.checked; drawMs(); });
  $$('[data-msev]').forEach(b=>b.onclick=async ()=>{
    if(analysis && !(await sure('사건 입력 탭에 아직 기록하지 않은 분석 결과가 있어요. 버리고 이 후보를 보낼까요?', '버리고 보내기', true))) return;
    const e=r.events[+b.dataset.msev]; ui.evDraft={title:e.title, description:e.description, story_time:e.story_time}; ui.evFrom=e; analysis=null; showTab('event'); });
  const ap=$('#ms-apply'); if(ap) ap.onclick=applyMs;
  const ma=$('#ms-all'); if(ma) ma.onclick=()=>{ const on=picked!==total; ['characters','groups','updates','relations'].forEach(k=>r[k].forEach(x=>{ x.on=on; })); drawMs(); };
}
function applyMs(){
  const r=msResult, made={}; let n=0;
  if(!r || r.note || r.cid!==ui.ch) return;
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
  if(n){ const t=chMeta(r.cid)?.title||'원고'; manualFrom=`원고 '${t}'에서 반영`; }
  toast(`${n}개를 반영했어요`); render();
}

/* ---------- 화별 등장 ----------
   원고 본문에서 인물·단체 이름(다른 이름 포함)을 찾아 화마다 몇 번 나왔는지 센다. AI를 쓰지 않고 브라우저가 계산한다.
   두 글자 이상인 이름만 센다 (한 글자 이름은 다른 낱말에 섞여 잘못 잡히기 쉬워서). */
const GAP_MIN=3;   // 이만큼 이어서 안 나오면 '오래 안 나옴'
function nameKeys(e){ return [...new Set([e.name, ...(e.aliases||[])].map(x=>String(x||'').trim()).filter(x=>x.length>=2))]; }
function countIn(text, keys){ let n=0; keys.forEach(k=>{ let i=0; while((i=text.indexOf(k,i))>-1){ n++; i+=k.length; } }); return n; }
function chTextOf(id){ return chMeta(id)||chBody[id] ? (loadChapter(id).text||'') : ''; }
let APPEAR={sig:'', map:null};
function appearMap(){
  const ents=[...state.characters, ...state.groups];
  const sig=worldKey+'|'+CHAPTERS.map(c=>c.id+':'+(c.updatedAt||0)).join(',')+'|'+ents.map(e=>e.id+'='+nameKeys(e).join('/')).join(',');
  if(APPEAR.sig===sig && APPEAR.map) return APPEAR.map;
  const texts=CHAPTERS.map(c=>chTextOf(c.id));
  const map={}; ents.forEach(e=>{ const k=nameKeys(e); map[e.id]=texts.map(t=>k.length?countIn(t,k):0); });
  APPEAR={sig, map}; return map;
}
/* 한 화에 나온 항목: [{e, n}] 많이 나온 순 */
function appearIn(text){
  return [...state.characters, ...state.groups].map(e=>({e, n:countIn(text, nameKeys(e))})).filter(x=>x.n>0).sort((a,b)=>b.n-a.n);
}
/* 관계도 화 범위: 고른 화들에 한 번이라도 나온 항목 id. 범위를 안 골랐으면 null */
function rangeSet(){
  if(!ui.chRange || !CHAPTERS.length) return null;
  const [a,b]=ui.chRange.map(i=>clamp(i,0,CHAPTERS.length-1)); const m=appearMap(); const out=new Set();
  Object.entries(m).forEach(([id,arr])=>{ for(let i=a;i<=b;i++) if(arr[i]){ out.add(id); break; } });
  return out;
}
function rangePick(){
  if(!CHAPTERS.length) return '';
  const r=ui.chRange, opt=(i,on)=>`<option value="${i}" ${on?'selected':''}>${esc(CHAPTERS[i].title||`${i+1}화`)}</option>`;
  return `<span class="g-range" role="group" aria-label="화 범위"><select class="form-control" id="g-rf" aria-label="처음 화"><option value="">모든 화</option>${CHAPTERS.map((c,i)=>opt(i, r&&r[0]===i)).join('')}</select>
    ${r?`<span class="caption">~</span><select class="form-control" id="g-rt" aria-label="마지막 화">${CHAPTERS.map((c,i)=>i>=r[0]?opt(i, r[1]===i):'').join('')}</select>`:''}</span>`;
}
function wireRange(redraw){
  const f=$('#g-rf'), t=$('#g-rt');
  if(f) f.onchange=()=>{ if(f.value===''){ ui.chRange=null; } else { const a=+f.value; ui.chRange=[a, Math.max(a, ui.chRange?.[1]??a)]; } redraw(); };
  if(t) t.onchange=()=>{ ui.chRange=[ui.chRange[0], Math.max(ui.chRange[0], +t.value)]; redraw(); };
}
/* 버전 기록 > 화별 등장: 열은 화, 줄은 인물·단체. 나온 화는 막대로, 오래 안 나온 구간은 빗금으로 */
function renderAppear(){
  const m=appearMap(), n=CHAPTERS.length, kind=ui.apKind||'chr';
  const pool=kind==='chr'?state.characters:kind==='grp'?state.groups:[...state.characters,...state.groups];
  const rows=pool.map(e=>{ const arr=m[e.id]||[]; const first=arr.findIndex(x=>x>0); let last=-1; arr.forEach((x,i)=>{ if(x>0) last=i; });
    return {e, arr, first, last, total:arr.reduce((a,b)=>a+b,0)}; }).filter(r=>r.total>0).sort((a,b)=>a.first-b.first || b.total-a.total);
  const missing=pool.filter(e=>!(m[e.id]||[]).some(x=>x>0));
  const gapsOf=r=>{ const out=[]; let s=-1; for(let i=r.first+1;i<=n;i++){ const on=i<n && r.arr[i]>0; if(!on && i<n){ if(s<0) s=i; } else if(s>=0){ if(i-s>=GAP_MIN) out.push([s,i-1]); s=-1; } } return out; };
  const tail=r=>n-1-r.last;   // 마지막으로 나온 뒤 몇 화째 안 나오는지
  const quiet=rows.filter(r=>tail(r)>=GAP_MIN);
  const max=Math.max(1,...rows.flatMap(r=>r.arr));
  const head=`<div class="ap-row ap-head" style="--n:${n}"><div class="ap-name caption">이름</div>${CHAPTERS.map((c,i)=>`<button type="button" class="ap-col" data-apch="${c.id}" title="${esc(c.title)} 원고 열기">${esc((c.title||`${i+1}화`).slice(0,6))}</button>`).join('')}</div>`;
  const body=rows.map(r=>{ const gaps=gapsOf(r), inGap=i=>gaps.some(([a,b])=>i>=a&&i<=b);
    const col=nationColor(nationOf(state,r.e));
    return `<div class="ap-row" style="--n:${n}"><button type="button" class="ap-name btn-link" data-apgo="${r.e.id}">${esc(r.e.name)}${tail(r)>=GAP_MIN?` <span class="Label Label--attention">${tail(r)}화째 없음</span>`:''}</button>
      ${r.arr.map((x,i)=>{ const on=x>0, cont=on && r.arr[i-1]>0, next=on && r.arr[i+1]>0;
        return `<span class="ap-cell${on?' on':''}${cont?' l':''}${next?' r':''}${!on&&inGap(i)?' gap':''}" title="${esc(r.e.name)} · ${esc(CHAPTERS[i].title)} · ${x}번"${on?` style="--c:${col};--a:${(0.35+0.65*x/max).toFixed(2)}"`:''}></span>`; }).join('')}</div>`; }).join('');
  $('#tab-history').innerHTML = histHead() + `
  <div class="tl-bar"><div class="seg" role="group" aria-label="보일 항목">${[['chr','인물'],['grp','단체'],['all','모두']].map(([k,l])=>`<button aria-pressed="${kind===k}" data-apk="${k}">${l}</button>`).join('')}</div>
    <span class="caption">원고에 이름(다른 이름 포함)이 나온 화를 막대로 보여줘요. 빗금은 ${GAP_MIN}화 넘게 안 나온 구간이에요.</span></div>
  ${!n?`<div class="Box"><div class="Box-body caption">아직 원고가 없어요. 원고 탭에서 화를 쓰면 여기에 누가 몇 화에 나왔는지 그려져요.</div></div>`:
  `${quiet.length?`<div class="flash flash-warn" style="margin-bottom:12px">${icon('alert')}<div><b>한동안 안 나온 인물·단체</b><div class="chips" style="margin-top:6px">${quiet.map(r=>`<button class="chip" data-apgo="${r.e.id}">${esc(r.e.name)} · ${tail(r)}화째</button>`).join('')}</div></div></div>`:''}
  <div class="Box ap-box"><div class="ap-grid">${head}${body||`<div class="Box-body caption">원고에서 ${kind==='grp'?'단체':'인물'} 이름을 찾지 못했어요.</div>`}</div></div>
  ${missing.length?`<p class="caption" style="margin-top:8px">원고에 아직 안 나온 ${kind==='grp'?'단체':kind==='chr'?'인물':'항목'}: ${missing.slice(0,20).map(e=>esc(e.name)).join(', ')}${missing.length>20?` 외 ${missing.length-20}`:''}</p>`:''}`}`;
  wireHistHead();
  $$('[data-apk]').forEach(b=>b.onclick=()=>{ ui.apKind=b.dataset.apk; renderAppear(); });
  $$('[data-apgo]').forEach(b=>b.onclick=()=>pick(b.dataset.apgo));
  $$('[data-apch]').forEach(b=>b.onclick=()=>{ ui.ch=b.dataset.apch; showTab('manuscript'); });
}

/* ---------- 원고 옆 패널: 이 화에 나온 인물 카드, 복선 메모 ---------- */
function miniCard(e){
  if(!e) return '';
  const s=state, isG=e.id.startsWith('grp_'), isB=e.id.startsWith('bg_');
  if(isB) return `<div class="mini-card"><div class="mini-h"><b>${esc(e.title)}</b><span class="Label">배경</span></div><p class="caption">${esc(e.content||'내용이 없어요')}</p><button class="btn btn-sm" data-msopen="${e.id}">세계관에서 열기</button></div>`;
  const rels=s.relations.filter(r=>r.from===e.id||r.to===e.id).sort((a,b)=>b.intensity-a.intensity);
  const st=e.situation?.status;
  return `<div class="mini-card"><div class="mini-h">${e.photo?`<img class="side-photo" src="${esc(e.photo)}" alt="">`:`<span class="${isG?'sq':'dot'}" style="background:${nationColor(nationOf(s,e))}"></span>`}<b>${esc(e.name)}</b><span class="Label">${isG?KIND[e.kind]:'인물'}</span>${st?`<span class="Label ${statusCls(st)}">${esc(st)}</span>`:''}</div>
    ${e.aliases?.length?`<div class="caption">다른 이름: ${esc(e.aliases.join(', '))}</div>`:''}
    ${e.situation?.current?`<p>${esc(e.situation.current)}</p>`:''}
    ${!isG && e.memberships?.length?`<div class="chips">${e.memberships.map(m=>`<span class="chip chip-static">${esc(nm(s,m.group))}${m.role?' · '+esc(m.role):''}</span>`).join('')}</div>`:''}
    ${(e.traits||[]).length?`<div class="caption">성격: ${(e.traits||[]).map(t=>esc(t.label)).join(', ')}</div>`:''}
    ${rels.length?`<ul class="mini-rels">${rels.slice(0,6).map(r=>{ const R=REL[r.type]||REL.personal, o=r.from===e.id?r.to:r.from; return `<li><i style="border-top:2px ${R.dash?'dashed':'solid'} ${R.c}"></i><button class="btn-link" data-mscard="${o}">${esc(nm(s,o))}</button><span class="caption">${R.l}</span>${r.note?`<span class="chip chip-static">${esc(r.note)}</span>`:''}</li>`; }).join('')}${rels.length>6?`<li class="caption">외 ${rels.length-6}개</li>`:''}</ul>`:''}
    ${e.notes?.trim()?`<div class="mini-note"><span class="Label">메모</span> ${esc(e.notes.length>200?e.notes.slice(0,200)+'…':e.notes)}</div>`:''}
    <button class="btn btn-sm" data-msopen="${e.id}">세계관에서 열기</button></div>`;
}
function msEntsHtml(text){
  const list=appearIn(text);
  return list.length?`<div class="chips">${list.slice(0,24).map(({e,n})=>`<button type="button" class="chip" data-mscard="${e.id}" aria-pressed="${ui.msCard===e.id}">${esc(e.name)} <span class="num">${n}</span></button>`).join('')}</div>`
    :'<span class="caption">원고에 세계관 인물·단체 이름이 아직 안 나왔어요.</span>';
}
/* 다른 화에 남은, 아직 회수 안 한 복선 */
function openMemos(except){
  return CHAPTERS.filter(c=>c.id!==except).flatMap(c=>(loadChapter(c.id).memos||[]).filter(m=>!m.done).map(m=>({c, m})));
}
function msAside(id, b){
  const memos=b?.memos||[], opens=openMemos(id);
  const all=[...state.characters,...state.groups,...state.background];
  const card=ui.msCard && ent(state, ui.msCard);
  return `<div class="Box"><div class="Box-header"><h3>이 화에 나온 인물·단체</h3></div><div class="Box-body stack" style="gap:10px">
      <div id="ms-ents">${msEntsHtml(b?.text||'')}</div>
      <select class="form-control" id="ms-card-pick" aria-label="세계관 카드 열기"><option value="">다른 카드 열기…</option>${all.map(x=>`<option value="${x.id}" ${ui.msCard===x.id?'selected':''}>${esc(optName(all,x))}</option>`).join('')}</select>
      <div id="ms-card">${card?miniCard(card):'<span class="caption">이름을 누르면 설정 카드가 여기에 열려요. 원고를 쓰면서 설정을 확인하세요.</span>'}</div>
    </div></div>
    <div class="Box"><div class="Box-header"><h3>복선 메모</h3><span class="Counter">${memos.filter(m=>!m.done).length}</span><span class="caption right">회수하면 체크해요</span></div>
      ${memos.map(m=>`<label class="Box-row memo${m.done?' done':''}"><input type="checkbox" data-memo="${m.id}" ${m.done?'checked':''}><span style="flex:1;min-width:0">${esc(m.text)}</span><button type="button" class="rm" data-memorm="${m.id}" aria-label="복선 메모 지우기" title="지우기">×</button></label>`).join('')}
      <form class="Box-row" id="memo-form" style="gap:8px;background:var(--bg-subtle)"><input class="form-control" id="memo-text" maxlength="200" placeholder="예: 바이의 문신은 나중에 정체가 드러남" aria-label="새 복선 메모" style="flex:1"><button class="btn btn-sm" type="submit">+ 추가</button></form>
      ${opens.length?`<div class="Box-row" style="display:block"><div class="caption" style="margin-bottom:4px">다른 화에서 아직 회수 안 한 복선 ${opens.length}개</div>
        <ul class="memo-open">${opens.slice(0,8).map(({c,m})=>`<li><button class="btn-link" data-memoch="${c.id}">${esc(c.title)}</button> ${esc(m.text)}</li>`).join('')}</ul></div>`:''}
    </div>`;
}

/* ---------- 찾아 바꾸기 ---------- */
function findBar(){
  return `<div class="find-bar" id="find-bar" role="search" aria-label="찾아 바꾸기"><input class="form-control" id="find-q" placeholder="찾을 말" aria-label="찾을 말" value="${esc(ui.findQ||'')}"><input class="form-control" id="find-r" placeholder="바꿀 말" aria-label="바꿀 말" value="${esc(ui.findR||'')}">
    <span class="caption" id="find-n" aria-live="polite"></span><button class="btn btn-sm" type="button" id="find-next">다음</button><button class="btn btn-sm" type="button" id="find-one">바꾸기</button><button class="btn btn-sm" type="button" id="find-all">모두 바꾸기</button><button class="btn btn-sm" type="button" id="find-close" aria-label="찾아 바꾸기 닫기">닫기</button></div>`;
}
/* 고른 위치가 보이게 편집기를 굴린다 */
function scrollToSel(ta, i){
  const lines=ta.value.slice(0,i).split('\n').length, all=ta.value.split('\n').length||1;
  ta.scrollTop=Math.max(0, ta.scrollHeight*lines/all - ta.clientHeight/2);
}
function wireFind(ta, onChange){
  const q=$('#find-q'), r=$('#find-r'), n=$('#find-n'); if(!q) return;
  const count=()=>{ const k=q.value; n.textContent=k?`${k? ta.value.split(k).length-1 : 0}곳`:''; };
  const next=(keepQ)=>{ const k=q.value; if(!k) return false; let i=ta.value.indexOf(k, ta.selectionEnd); if(i<0) i=ta.value.indexOf(k); if(i<0){ toast(`'${k}'${jo(k,'를','을').slice(k.length)} 찾지 못했어요`); return false; }
    ta.focus(); ta.setSelectionRange(i, i+k.length); scrollToSel(ta, i); if(keepQ===true) q.focus(); return true; };
  q.oninput=()=>{ ui.findQ=q.value; count(); }; r.oninput=()=>{ ui.findR=r.value; };
  q.onkeydown=ev=>{ if(ev.key==='Enter'){ ev.preventDefault(); next(true); } if(ev.key==='Escape') $('#find-close').click(); };
  $('#find-next').onclick=()=>next();
  $('#find-one').onclick=()=>{ const k=q.value; if(!k) return; if(ta.value.slice(ta.selectionStart, ta.selectionEnd)!==k && !next()) return;
    const a=ta.selectionStart; ta.setRangeText(r.value, a, a+k.length, 'end'); onChange(); count(); next(); };
  $('#find-all').onclick=()=>{ const k=q.value; if(!k) return; const c=ta.value.split(k).length-1; if(!c){ toast('바꿀 곳이 없어요'); return; }
    onChange(true); ta.value=ta.value.split(k).join(r.value); onChange(); count(); toast(`${c}곳을 바꿨어요. 이전 버전에 바꾸기 전 원고가 남아 있어요`); };
  $('#find-close').onclick=()=>{ ui.find=false; $('#find-bar')?.remove(); $('#ms-find')?.setAttribute('aria-pressed','false'); ta.focus(); };
  count();
}

/* ---------- 내보내기: TXT · Markdown · PDF(인쇄) ---------- */
function download(name, text, type='text/plain'){
  const url=URL.createObjectURL(new Blob([text], {type:type+';charset=utf-8'}));
  const a=document.createElement('a'); a.href=url; a.download=name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 2000);
}
const safeName=t=>String(t||'원고').replace(/[\\/:*?"<>|]+/g,'_').trim().slice(0,60)||'원고';
function exportMs(kind){
  const list=kind==='one' ? [chMeta(ui.ch)||{id:ui.ch, title:chBody[ui.ch]?.title}] : CHAPTERS;
  const items=list.map(c=>({title:c.title||'제목 없음', text:chTextOf(c.id)||chBody[c.id]?.text||''})).filter(x=>x.text.trim());
  if(!items.length){ toast('내보낼 원고가 없어요'); return; }
  const book=DATA.meta.title;
  if(kind==='md'){ download(`${safeName(book)}.md`, `# ${book}\n\n`+items.map(x=>`## ${x.title}\n\n${x.text.trim()}\n`).join('\n'), 'text/markdown'); }
  else if(kind==='pdf'){
    const fr=document.createElement('iframe'); fr.style.cssText='position:fixed;right:0;bottom:0;width:0;height:0;border:0'; document.body.appendChild(fr);
    const d=fr.contentDocument;
    d.open(); d.write(`<!doctype html><html lang="ko"><head><meta charset="utf-8"><title>${esc(book)}</title><style>body{font-family:"Noto Serif KR","Nanum Myeongjo",serif;line-height:1.9;font-size:11pt;margin:0}h1{font-size:20pt;text-align:center;margin:30vh 0 0}h2{font-size:14pt;page-break-before:always;margin:0 0 1.2em}p{margin:0 0 .6em;text-indent:1em;white-space:pre-wrap}@page{margin:22mm 20mm}</style></head><body><h1>${esc(book)}</h1>${items.map(x=>`<h2>${esc(x.title)}</h2>${x.text.trim().split(/\n+/).map(p=>`<p>${esc(p)}</p>`).join('')}`).join('')}</body></html>`); d.close();
    setTimeout(()=>{ try{ fr.contentWindow.focus(); fr.contentWindow.print(); }catch(e){ toast('인쇄 창을 열지 못했어요'); } setTimeout(()=>fr.remove(), 60000); }, 300);
    toast('인쇄 창에서 "PDF로 저장"을 고르세요'); return;
  }
  else download(`${safeName(kind==='one'?items[0].title:book)}.txt`, items.map(x=>`${x.title}\n\n${x.text.trim()}\n`).join('\n\n'));
  toast(`${items.length}화를 내보냈어요`);
}

/* ---------- 물어보기: 세계관·원고·기록을 읽고 답하는 AI ----------
   답에는 근거(인물·단체·배경, 화, 기록)를 눌러 열 수 있는 칩으로 붙인다. AI는 원고와 세계관을 고치지 않는다. */
const ASK_BUDGET=36000;   // 원고 본문으로 보낼 글자 수
const ASK_EXAMPLES=['주인공이 처음 흔들리는 장면은 어디야?','지금 서로 대립하는 세력을 정리해 줘','설정끼리 어긋나는 곳이 있어?','오래 안 나온 인물은 누구야?'];
function askPayload(question, quote){
  const world=worldForAi('');
  world.background=(state.background||[]).map(b=>({id:b.id, title:b.title, content:b.content}));
  const ents=[...state.characters,...state.groups,...state.background];
  const notes=ents.filter(e=>e.notes?.trim()).map(e=>({id:e.id, name:e.name||e.title, notes:e.notes.slice(0,600)}));
  const cs=commits.filter(c=>c.kind!=='init').slice(-60).map(c=>({id:c.id, n:commits.indexOf(c)+1, message:c.message, story_time:c.event?.story_time||undefined, description:c.event?.description?.slice(0,300)||undefined}));
  const chs=CHAPTERS.map(c=>({id:c.id, title:c.title, text:chTextOf(c.id), memos:(loadChapter(c.id).memos||[]).map(m=>(m.done?'(회수됨) ':'')+m.text)}));
  const total=chs.reduce((a,c)=>a+c.text.length,0);
  if(total>ASK_BUDGET){
    // 질문·고른 문장에 이름이 나온 화와 지금 화를 먼저 길게 보내고, 나머지는 앞부분만
    const q=(question+' '+(quote||'')); const named=ents.filter(e=>nameKeys(e).some(k=>q.includes(k)));
    const focus=new Set(chs.filter(c=>c.id===ui.ch || named.some(e=>countIn(c.text, nameKeys(e)))).map(c=>c.id));
    let left=ASK_BUDGET; const per=Math.max(400, Math.floor(ASK_BUDGET*0.3/Math.max(1,chs.length-focus.size)));
    chs.filter(c=>!focus.has(c.id)).forEach(c=>{ c.text=c.text.slice(0,per); left-=c.text.length; });
    const fper=Math.max(800, Math.floor(left/Math.max(1,focus.size)));
    chs.filter(c=>focus.has(c.id)).forEach(c=>{ if(c.text.length>fper) c.text=c.text.slice(0,fper)+' …(뒷부분 생략)'; });
  }
  return {question, quote:quote||undefined, world, notes, commits:cs, chapters:chs.filter(c=>c.text.trim()||c.memos.length),
    ids:[...ents.map(e=>e.id), ...CHAPTERS.map(c=>c.id), ...cs.map(c=>c.id)]};
}
function srcLabel(id){
  if(chMeta(id)) return ['화', chMeta(id).title];
  if(byId(id)) return ['기록', cname(id)];
  const e=ent(state,id); if(e) return [id.startsWith('chr_')?'인물':id.startsWith('grp_')?'단체':'배경', e.name||e.title];
  return null;
}
function askHtml(){
  const log=ui.askLog||[];
  const msgs=log.map((m,i)=>m.role==='me'
    ? `<div class="ask-msg me">${m.quote?`<blockquote>${esc(m.quote.length>160?m.quote.slice(0,160)+'…':m.quote)}</blockquote>`:''}${esc(m.text)}</div>`
    : m.busy ? `<div class="ask-msg ai"><div class="spinner"></div> <span class="muted">원고와 세계관을 읽고 있어요</span></div>`
    : m.error ? `<div class="ask-msg ai err">${esc(m.error)}</div>`
    : `<div class="ask-msg ai"><div class="ask-ans">${esc(m.text).replace(/\n/g,'<br>')}</div>${m.sources?.length?`<div class="ask-src"><span class="caption">근거</span>${m.sources.map(s=>{ const l=srcLabel(s.id); return l?`<button type="button" class="chip src-chip" data-src="${s.id}" title="${esc(s.why)}"><small>${l[0]}</small>${esc(l[1])}${s.from_notes?' <span class="src-note">메모</span>':''}</button>`:''; }).join('')}</div>`:''}</div>`).join('');
  return `<div class="ask-panel" id="ask-panel" role="dialog" aria-label="물어보기">
    <div class="ask-h"><b>${icon('spark')}물어보기</b><span class="caption">원고·세계관·기록을 읽고 답해요. 원고는 고치지 않아요</span><button class="btn btn-sm" id="ask-close" type="button">닫기</button></div>
    <div class="ask-body" id="ask-body">${msgs||`<div class="ask-empty"><p class="caption">${esc(DATA.meta.title)}에 대해 무엇이든 물어보세요. 답마다 근거를 눌러 바로 열 수 있어요.</p><div class="chips">${ASK_EXAMPLES.map(x=>`<button type="button" class="chip" data-askex="${esc(x)}">${esc(x)}</button>`).join('')}</div></div>`}</div>
    ${ui.askQuote?`<div class="ask-quote"><span class="caption">고른 문장</span><blockquote>${esc(ui.askQuote.length>160?ui.askQuote.slice(0,160)+'…':ui.askQuote)}</blockquote><button type="button" class="rm" id="ask-unquote" aria-label="고른 문장 빼기">×</button></div>`:''}
    <form class="ask-form" id="ask-form"><textarea class="form-control" id="ask-q" rows="2" maxlength="500" placeholder="예: 3화에서 징크스와 바이는 어떤 사이였지?" aria-label="질문"></textarea><button class="btn btn-primary" type="submit" ${askBusy?'disabled':''}>묻기</button></form>
  </div>`;
}
let askBusy=false;
function askOpen(open=true){
  const typed=$('#ask-q')?.value||'';
  $('#ask-panel')?.remove(); $('#ask-btn')?.setAttribute('aria-expanded', open);
  if(!open){ document.body.classList.remove('ask-lock'); return; }
  document.body.insertAdjacentHTML('beforeend', askHtml()); document.body.classList.toggle('ask-lock', isPhone());
  const body=$('#ask-body'); body.scrollTop=body.scrollHeight;
  $('#ask-close').onclick=()=>{ askOpen(false); $('#ask-btn')?.focus(); };
  $('#ask-panel').onkeydown=ev=>{ if(ev.key==='Escape'){ ev.stopPropagation(); askOpen(false); $('#ask-btn')?.focus(); } };
  const uq=$('#ask-unquote'); if(uq) uq.onclick=()=>{ ui.askQuote=null; askOpen(); };
  $$('[data-askex]').forEach(b=>b.onclick=()=>askSend(b.dataset.askex));
  $$('[data-src]').forEach(b=>b.onclick=()=>openSource(b.dataset.src));
  const q=$('#ask-q'); q.value=typed;
  q.onkeydown=ev=>{ if(ev.key==='Enter' && !ev.shiftKey && !ev.isComposing){ ev.preventDefault(); $('#ask-form').requestSubmit(); } };
  $('#ask-form').onsubmit=ev=>{ ev.preventDefault(); const t=q.value.trim(); if(!t){ toast('질문을 적어 주세요'); return; } askSend(t); };
  if(!askBusy) q.focus();
}
function openSource(id){
  if(isPhone()) askOpen(false);
  if(chMeta(id)){ if(ui.ch && ui.ch!==id) snapChapter(ui.ch); ui.ch=id; showTab('manuscript'); return; }
  if(byId(id)){ ui.histView='list'; ui.cmpB=id; const i=commits.findIndex(c=>c.id===id); if(i>0) ui.cmpA=commits[i-1].id; ui.open={[id]:true}; showTab('history'); return; }
  if(ent(state,id)){ ui.graphVer='work'; ui.sheet='full'; pick(id); }
}
async function askSend(question){
  if(askBusy) return;
  const quote=ui.askQuote; ui.askQuote=null; const qa=$('#ask-q'); if(qa) qa.value='';
  const log=ui.askLog||(ui.askLog=[]); log.push({role:'me', text:question, quote}); const wait={role:'ai', busy:true}; log.push(wait);
  askBusy=true; askOpen(); const wk=worldKey;
  try{
    const r=await askWorld(askPayload(question, quote));
    Object.assign(wait, {busy:false, text:r.result.answer||'답을 받지 못했어요.', sources:r.result.sources});
    showUsage(r.usage); if(r.usage?.admin) toast(`답변 모델: ${r.model} · 토큰 ${r.tokens.toLocaleString()} 사용`);
  }catch(err){
    console.warn('물어보기 실패', err);
    Object.assign(wait, {busy:false, error: err.status===429 ? quotaNote(err) : `답하지 못했어요. ${friendlyErr(err)}.`});
  }
  askBusy=false;
  if(wk!==worldKey) return;
  if($('#ask-panel')) askOpen(); else toast('물어보기 답이 왔어요. 머리줄의 물어보기를 눌러 확인하세요');
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
  if(ui.graphVer==='work' || ui.graphVer==='preview' || ui.graphVer===head().id){ ui.graphVer='work'; return state; }
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
  // 한 번 정한 자리는 LAYOUT에 적어 두어, 다른 항목을 옮기거나 추가·삭제해도 나머지가 움직이지 않게 한다
  const auto={}; const all=[...s.groups,...s.characters]; const missing=all.filter(x=>!POS[x.id] && !LAYOUT[x.id]);
  if(missing.length){
    const empty=!Object.keys(POS).length;
    const taken=all.filter(x=>POS[x.id]||LAYOUT[x.id]).map(x=>LAYOUT[x.id]||POS[x.id]);
    const slot=k=>empty ? [Math.round((k%6+0.5)*1100/6), 80+Math.floor(k/6)*95] : [Math.round((k%8+0.5)*1100/8), Math.max(40, 470-Math.floor(k/8)*60)];
    let k=0;
    missing.forEach(x=>{ let p; for(let tries=0; tries<400; tries++, k++){ p=slot(k); if(!taken.some(t=>Math.hypot(t[0]-p[0], t[1]-p[1])<60)) break; } k++;
      auto[x.id]=p; taken.push(p); if(s===state) LAYOUT[x.id]=p; });
  }
  /* 휴대폰 세로 화면에서는 지역이 위→아래로 쌓이게 가로·세로를 바꿔 그린다 (저장되는 위치는 그대로) */
  const PH=isPhone(), VERT=PH && isPortrait(); ui.vert=VERT;
  const raw=id=>LAYOUT[id]||POS[id]||auto[id]||[430,300];
  const pos=id=>{ const p=raw(id); return VERT?[p[1],p[0]]:p; };
  const V=ui.view||(ui.view=PH?{x:0,y:0,w:VERT?540:1100,h:VERT?1100:540,fresh:true}:fitView());
  const linked=new Set(sel?[sel]:[]); s.relations.forEach(r=>{ if(r.from===sel) linked.add(r.to); if(r.to===sel) linked.add(r.from); });
  const isNode=id=>id.startsWith('grp_')||id.startsWith('chr_');
  /* 선이 다른 노드를 지나가면 휘는 정도를 바꿔 피해 간다. 가장 덜 겹치는 곡선의 조절점을 돌려준다 */
  const NPOS=[...s.groups,...s.characters].map(x=>({id:x.id, p:pos(x.id), r:x.id.startsWith('grp_')?Math.max(30,(x.name||'').length*8+12):30}));
  const bend=(a,b,x1,y1,x2,y2,base)=>{
    const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy)||1, nx=-dy/L, ny=dx/L;
    const others=NPOS.filter(n=>n.id!==a && n.id!==b && Math.abs(n.p[0]-(x1+x2)/2)<L/2+n.r+80 && Math.abs(n.p[1]-(y1+y2)/2)<L/2+n.r+80);
    const hits=off=>{ const cx=(x1+x2)/2+nx*off, cy=(y1+y2)/2+ny*off; let h=0;
      for(let t=0.08;t<0.93;t+=0.06){ const u=1-t, px=u*u*x1+2*u*t*cx+t*t*x2, py=u*u*y1+2*u*t*cy+t*t*y2;
        for(const n of others){ const ex=n.r, ey=n.id.startsWith('grp_')?24:30; const q=((px-n.p[0])/ex)**2+((py-n.p[1])/ey)**2; if(q<1) h+=1-q; } }
      return h; };
    let best=base, bh=hits(base);
    if(bh>0) for(const d of [50,-50,90,-90,140,-140,200,-200]){ const h=hits(base+d); if(h<bh-0.01){ bh=h; best=base+d; if(!h) break; } }
    return [(x1+x2)/2+nx*best, (y1+y2)/2+ny*best];
  };
  const INI=initials(s.characters.filter(c=>!c.photo));
  const RNG=rangeSet();   // 화 범위를 골랐으면 그 화들에 나온 항목만 또렷하게
  const edge=(r)=>{
    const k=[r.from,r.to].sort().join('|'); const grp=pairs[k]; const i=grp.indexOf(r), n=grp.length;
    let [x1,y1]=pos(r.from), [x2,y2]=pos(r.to);
    const dx=x2-x1, dy=y2-y1, L=Math.hypot(dx,dy)||1; const off=(i-(n-1)/2)*34;
    const sgn = r.from<r.to?1:-1;
    const [cx,cy]=bend(r.from, r.to, x1,y1,x2,y2, off*sgn);
    if(r.directed){ const ex=x2-cx, ey=y2-cy, el=Math.hypot(ex,ey)||1; x2-=ex/el*30; y2-=ey/el*30; }
    const R=REL[r.type]||REL.personal; const dim = sel && !(r.from===sel||r.to===sel); const out=RNG && !(RNG.has(r.from)&&RNG.has(r.to));
    const w=1+r.intensity*3.5;
    const lx=(x1+2*cx+x2)/4; let ly=(y1+2*cy+y2)/4;
    if(sel && !dim){ for(let t=0; t<8 && labelsAt.some(([a,b])=>Math.abs(a-lx)<70 && Math.abs(b-ly)<15); t++) ly+=16; labelsAt.push([lx,ly]); }
    const note=r.note?` · ${r.note.length>14?r.note.slice(0,13)+'…':r.note}`:'';
    return `<g opacity="${out?.1:dim?.35:1}"><path d="M${x1},${y1} Q${cx},${cy} ${x2},${y2}" style="fill:none;stroke:${R.c};stroke-width:${w};${R.dash?`stroke-dasharray:${R.dash}`:''}" stroke-linecap="round" ${r.directed?'marker-end="url(#arrow)"':''}><title>${esc(nm(s,r.from))} ${r.directed?'→':'↔'} ${esc(nm(s,r.to))} · ${R.l} · ${lvOf(r.intensity)}${r.note?' · '+esc(r.note):''}</title></path>
      ${sel && !dim?`<text x="${lx}" y="${ly-5}" text-anchor="middle" font-size="13" style="fill:${R.c};paint-order:stroke;stroke:var(--bg);stroke-width:4px">${R.l} · ${lvOf(r.intensity)}${esc(note)}</text>`:''}</g>`;
  };
  const memberLines = () => ui.showMembers ? [
    ...s.groups.filter(g=>g.parent).map(g=>({a:g.id,b:g.parent,bond:g.parent_bond??0.6,active:true})),
    ...s.characters.flatMap(c=>(c.memberships||[]).map(m=>({a:c.id,b:m.group,bond:m.bond,active:m.active!==false})))
  ].map(m=>{ const [x1,y1]=pos(m.a),[x2,y2]=pos(m.b); const dim=sel && !(m.a===sel||m.b===sel); const [cx,cy]=bend(m.a,m.b,x1,y1,x2,y2,0);
    return `<path d="M${x1},${y1} Q${cx},${cy} ${x2},${y2}" style="fill:none;stroke:var(--border-strong);stroke-width:${0.6+m.bond*1.6};stroke-dasharray:2 4" opacity="${m.active?(dim?.35:.9):.2}"><title>${esc(nm(s,m.a))} → ${esc(nm(s,m.b))} 소속 · 소속감 ${lvOf(m.bond)}</title></path>`; }).join('') : '';
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
    /* 노드 모양: 단체는 왼쪽에 지역 색 점이 있는 알약 모양, 인물은 지역 색이 옅게 깔린 원. 굵은 테두리 대신 가는 선과 옅은 색면 */
    const hit = w!==undefined && Math.abs(w)>=0.25, hc = w<0?'var(--danger)':'var(--success)';
    if(e.id.startsWith('grp_')){
      const nat=e.kind==='nation', fs=nat?15:13.5, h=nat?36:30, wd=Math.round(e.name.length*fs*1.02+(nat?46:40)), x0=x-wd/2, y0=y-h/2, r=h/2;
      const hb = hit ? `<rect x="${x0-5}" y="${y0-5}" width="${wd+10}" height="${h+10}" rx="${r+5}" style="fill:${hc};opacity:.16;stroke:${hc};stroke-width:1.5"/>` : '';
      under = `<rect x="${x0}" y="${y0}" width="${wd}" height="${h}" rx="${r}" style="fill:var(--bg)"/>`;
      shape = `${hb}${isSel?`<rect x="${x0-4}" y="${y0-4}" width="${wd+8}" height="${h+8}" rx="${r+4}" style="fill:none;stroke:${col};stroke-width:2;opacity:.55"/>`:''}
        <rect x="${x0}" y="${y0}" width="${wd}" height="${h}" rx="${r}" style="fill:var(--bg-subtle)"/>
        <rect x="${x0}" y="${y0}" width="${wd}" height="${h}" rx="${r}" style="fill:${col};opacity:${nat?.2:.11}"/>
        <rect class="nshape" x="${x0}" y="${y0}" width="${wd}" height="${h}" rx="${r}" style="fill:none;stroke:${col};stroke-width:${isSel?1.8:1};stroke-opacity:${isSel?1:.55};${e.kind==='solo'?'stroke-dasharray:3 3':''}"/>
        <circle cx="${x0+(nat?17:15)}" cy="${y}" r="${nat?4.5:3.5}" style="fill:${col}"/>
        <text x="${x+(nat?7:6)}" y="${y+fs*0.36}" text-anchor="middle" font-size="${fs}" font-weight="${nat?700:600}" letter-spacing="-.2" style="fill:var(--fg)">${esc(e.name)}</text>`;
    } else {
      const R=20;
      under = `<circle cx="${x}" cy="${y}" r="34" style="fill:transparent"/><circle cx="${x}" cy="${y}" r="${R}" style="fill:var(--bg)"/>`;
      const face = e.photo ? `<clipPath id="cp-${e.id}"><circle cx="${x}" cy="${y}" r="${R-1}"/></clipPath><image href="${esc(e.photo)}" x="${x-R+1}" y="${y-R+1}" width="${2*R-2}" height="${2*R-2}" preserveAspectRatio="xMidYMid slice" clip-path="url(#cp-${e.id})"/>`
        : `<text x="${x}" y="${y+5.5}" text-anchor="middle" font-size="${INI[e.id]?.length>1?13:15.5}" font-weight="700" style="fill:${col}">${esc(INI[e.id]||initial(e.name))}</text>`;
      shape = `${halo}${isSel?`<circle cx="${x}" cy="${y}" r="${R+5}" style="fill:none;stroke:${col};stroke-width:2;opacity:.55"/>`:''}
        <circle cx="${x}" cy="${y}" r="${R}" style="fill:var(--bg-subtle)"/>
        <circle cx="${x}" cy="${y}" r="${R}" style="fill:${col};opacity:.16"/>
        ${face}<circle class="nshape" cx="${x}" cy="${y}" r="${R}" style="fill:none;stroke:${col};stroke-width:${isSel?2:1.25};stroke-opacity:${isSel?1:.7}"/>
        <text x="${x}" y="${y+R+17}" text-anchor="middle" font-size="13.5" font-weight="${isSel?700:500}" letter-spacing="-.2" style="fill:var(--fg);paint-order:stroke;stroke:var(--bg);stroke-width:4px;stroke-linejoin:round">${esc(e.name)}${dead?' (사망)':''}</text>`;
    }
    const out=RNG && !RNG.has(e.id);
    return `<g class="node${out?' n-out':''}" data-id="${e.id}" tabindex="0" role="button" aria-label="${esc(e.name)}${out?' (고른 화에 안 나옴)':''}">${under}<g opacity="${out?.15:dead?.5:dim?.4:1}">${shape}${badge}</g></g>`;
  };
  const zones=()=>W.zones.map((z,i)=>VERT
    ? `<rect x="-3000" y="${z.x}" width="6540" height="${z.w}" style="fill:var(${z.fill})"/>${i?`<line x1="-3000" y1="${z.x}" x2="3540" y2="${z.x}" style="stroke:var(--border);stroke-dasharray:2 6"/>`:''}<text x="14" y="${z.x+22}" font-size="14" font-weight="700" letter-spacing="1" style="fill:var(${z.c})">${esc(z.label)}</text>`
    : `<rect x="${z.x}" y="0" width="${z.w}" height="540" style="fill:var(${z.fill})"/>${i?`<line x1="${z.x}" y1="0" x2="${z.x}" y2="540" style="stroke:var(--border);stroke-dasharray:2 6"/>`:''}<text x="${z.x+14}" y="528" font-size="11" font-weight="600" letter-spacing="1" style="fill:var(${z.c})">${esc(z.label)}</text>`).join('');
  let labelsAt=[];
  const body=()=>{ labelsAt=[]; return `${memberLines()}${rels.map(edge).join('')}${[...s.groups,...s.characters].filter(x=>isNode(x.id)).map(node).join('')}`; };
  const verLabel = ui.graphVer==='preview'?'AI 제안 미리보기':ui.graphVer==='work'?`지금 · ${cname(head().id)}`:cnum(ui.graphVer)+cname(ui.graphVer);
  const ovSrc = ui.graphVer==='preview'?'미리보기 사건':(ui.graphVer==='work'?head():byId(ui.graphVer))?.message;
  const other = !['work','preview'].includes(ui.graphVer) && !commits.some(c=>c.id===ui.graphVer) ? byId(ui.graphVer) : null;
  const FILTERS=[['all','전체'],['conflict','대립·경쟁'],['coop','공존·동맹'],['dominate','지배'],['personal','가족·개인']];
  const svgHTML=`<svg id="g-svg" viewBox="${V.x} ${V.y} ${V.w} ${V.h}" role="img" aria-label="단체·인물 관계도">
        <defs><marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" style="fill:var(--done)"/></marker></defs>
        ${zones()}
        <g id="g-body">${body()}</g>
      </svg>`;
  const legendHTML=`
        ${Object.values(REL).map(R=>`<span><i style="border-top:2px ${R.dash?'dashed':'solid'} ${R.c}"></i>${R.l}</span>`).join('')}
        <span><i style="border-top:2px dotted var(--border-strong)"></i>소속</span>
        <span>선 굵기 = 강도</span>
        ${W.zones.map(z=>`<span><span class="sq" style="background:var(${z.c})"></span>${esc(nm(state,z.id))}</span>`).join('')}
        <span><span class="dot" style="background:var(--danger);opacity:.6"></span>피해</span><span><span class="dot" style="background:var(--success);opacity:.6"></span>이득</span>
      `;
  const panel = pe ? `<aside class="detail" id="detail" aria-label="${esc(pe.name||pe.title)} 자세히">
      <div class="detail-bar"><span class="caption">${editable?'여기서 바로 고칠 수 있어요':'지난 시점이라 보기만 할 수 있어요'}</span><button class="btn btn-sm" id="detail-close">닫기</button></div>
      ${editable ? (pe.id.startsWith('bg_')?bgDetail(pe):entityDetail(pe)) : pastDetail(s,pe,ov,ovSrc)}</aside>` : overview(s);
  const SHEET = !PH ? null : (ui.sheet==='full' || pe?.id.startsWith('bg_')) ? 'full' : 'peek';
  const graph = first ? (PH?phoneBox():graphBox()) : `<div class="Box"><div class="Box-body caption" style="text-align:center;padding:48px 16px">아직 인물이나 단체가 없어요.<br>왼쪽 도구창의 <b>+ 인물 추가</b>, <b>+ 단체 추가</b>로 시작하면 여기에 관계도가 그려져요.</div></div>`;
  function graphBox(){ return `<div class="Box">
      <div class="Box-header" style="gap:12px">
        <div class="seg" role="group" aria-label="관계 필터">${FILTERS.map(([k,l])=>`<button aria-pressed="${ui.relFilter===k}" data-f="${k}">${l}</button>`).join('')}</div>
        <label class="check"><input type="checkbox" id="g-mem" ${ui.showMembers?'checked':''}>소속 선</label>
        <label class="check"><input type="checkbox" id="g-ov" ${ui.overlay?'checked':''}>사건 영향 표시</label>
        ${rangePick()}
        <div class="zoom" role="group" aria-label="확대와 축소"><button type="button" data-zoom="in" aria-label="확대">+</button><button type="button" data-zoom="out" aria-label="축소">−</button><button type="button" data-zoom="fit">전체</button></div>
      </div>
      <div class="graph-wrap">${svgHTML}</div>
      <div class="Box-row caption graph-tip">인물이나 단체를 끌어서 자리를 옮길 수 있어요. 빈 곳을 끌면 화면이 움직여요. 확대는 + − 버튼, Ctrl(⌘)+휠, 휴대폰에서는 두 손가락으로 해요.</div>
      <div class="Box-row" style="flex-wrap:wrap"><div class="legend">${legendHTML}</div></div>
    </div>
`; }
  /* 휴대폰: 관계도가 화면을 채우고, 필터는 위에 한 줄로 떠 있고, 설정·범례는 '보기' 시트, 고른 항목은 아래 시트로 */
  function phoneBox(){ return `<div class="Box g-phone"><div class="graph-wrap" id="g-wrap">${svgHTML}
      <div class="g-chips" role="group" aria-label="관계 필터"><button type="button" class="g-chip g-chip-ic" id="g-view" aria-haspopup="dialog" aria-expanded="${!!ui.viewSheet}">${ICON_LAYERS}보기</button>${FILTERS.map(([k,l])=>`<button type="button" class="g-chip" aria-pressed="${ui.relFilter===k}" data-f="${k}">${l}</button>`).join('')}</div>
      <button type="button" class="g-fab" data-zoom="fit" aria-label="전체가 보이게 맞추기" title="전체 맞춤">${ICON_FIT}</button>
      ${SHEET==='peek'?peek():''}
      ${ui.viewSheet?viewSheet():''}
    </div></div>`; }
  function peek(){
    if(!pe || pe.id.startsWith('bg_')) return `<div class="g-sheet g-peek" id="g-peek"><button type="button" class="sheet-grab" data-sheet="full" aria-label="세계관 요약 펼치기"></button>
      <div class="g-stats">${[['인물',s.characters.length],['단체',s.groups.length],['관계',s.relations.length]].map(([l,n])=>`<span><b class="num">${n}</b>${l}</span>`).join('')}<button type="button" class="btn-link" data-sheet="full">요약 보기 ›</button></div></div>`;
    const my=s.relations.filter(r=>r.from===pe.id||r.to===pe.id), grp=pe.id.startsWith('grp_');
    const col=nationColor(nationOf(s,pe)), st=pe.situation?.status;
    return `<div class="g-sheet g-peek" id="g-peek" aria-label="${esc(pe.name)} 요약"><button type="button" class="sheet-grab" data-sheet="full" aria-label="자세히 펼치기"></button>
      <div class="g-peek-h">${grp?`<span class="sq" style="background:${col}"></span>`:`<span class="dot" style="background:${col}"></span>`}<h3>${esc(pe.name)}</h3><span class="Label">${grp?KIND[pe.kind]:'인물'}</span>${st?`<span class="Label ${statusCls(st)}">${esc(st)}</span>`:''}<button type="button" class="rm" id="peek-close" aria-label="닫기">×</button></div>
      ${pe.situation?.current?`<p class="g-peek-sit">${esc(pe.situation.current)}</p>`:''}
      <ul class="g-peek-rels">${my.length?my.slice(0,3).map(r=>{ const R=REL[r.type]||REL.personal, o=r.from===pe.id?r.to:r.from;
        return `<li><i style="border-top:3px ${R.dash?'dashed':'solid'} ${R.c}"></i><span class="nm">${esc(nm(s,o))}</span><span class="caption">${R.l} · ${lvOf(r.intensity)}</span></li>`; }).join('')+(my.length>3?`<li class="caption">외 ${my.length-3}개</li>`:''):'<li class="caption">아직 관계가 없어요</li>'}</ul>
      <div class="g-peek-act"><button type="button" class="btn btn-sm btn-primary" data-sheet="full">${editable?'자세히 보고 고치기':'자세히 보기'}</button></div></div>`;
  }
  function viewSheet(){ return `<div class="g-scrim" data-close-view></div>
    <div class="g-sheet g-viewsheet" role="dialog" aria-label="보기 설정"><div class="g-sheet-h"><h3>보기 설정</h3><button type="button" class="btn btn-sm" data-close-view>닫기</button></div>
      <label class="g-switch"><span>소속 선<small>인물이 어느 단체에 속하는지 점선으로 보여요</small></span><input type="checkbox" role="switch" id="g-mem" ${ui.showMembers?'checked':''}></label>
      <label class="g-switch"><span>사건 영향 표시<small>이 시점의 사건으로 이득·피해를 본 곳에 표시해요</small></span><input type="checkbox" role="switch" id="g-ov" ${ui.overlay?'checked':''}></label>
      ${CHAPTERS.length?`<div class="g-legend-h">화 범위</div><div class="caption" style="margin-bottom:6px">고른 화에 나온 인물·단체만 또렷하게 보여요</div>${rangePick()}`:''}
      <div class="g-legend-h">범례</div><div class="legend">${legendHTML}</div></div>`; }
  $('#tab-world').innerHTML = pendingBanner() + `<div class="Subhead"><h2>세계관</h2><span class="muted">${esc(verLabel)}</span>${ui.graphVer==='preview'?'<span class="Label Label--done">아직 기록 안 됨</span>':''}
    <div class="actions">
      <select class="form-control" id="g-ver" style="width:auto;padding:3px 8px;font-size:12px" aria-label="버전">
        <option value="work" ${ui.graphVer==='work'?'selected':''}>지금 (${esc(cname(head().id))})</option>
        ${analysis?`<option value="preview" ${ui.graphVer==='preview'?'selected':''}>AI 제안 미리보기</option>`:''}
        ${other?`<option value="${other.id}" selected>${esc(cname(other.id))} (다른 전개)</option>`:''}
        ${commits.slice().reverse().filter(c=>c.id!==head().id).map(c=>`<option value="${c.id}" ${ui.graphVer===c.id?'selected':''}>${cnum(c.id)}${esc(cname(c.id))}</option>`).join('')}
      </select>
    </div></div>
  <div class="ws has-detail${PH?' ws-phone':''}"><div class="ws-graph">${graph}</div>${!PH?panel:SHEET==='full'?fullSheet(panel):''}</div>`;
  $$('[data-f]').forEach(b=>b.onclick=()=>{ ui.relFilter=b.dataset.f; renderWorld(); });
  $('#g-ver').onchange=ev=>{ ui.graphVer=ev.target.value; ui.editing=null; renderWorld(); };
  const gm=$('#g-mem'); if(gm) gm.onchange=ev=>{ ui.showMembers=ev.target.checked; renderWorld(); };
  const go_=$('#g-ov'); if(go_) go_.onchange=ev=>{ ui.overlay=ev.target.checked; renderWorld(); };
  wireRange(renderWorld);
  const svg=$('#g-svg');
  if(svg) wireGraph(svg, body);
  $$('[data-pick],[data-go]').forEach(b=>b.onclick=()=>pick(b.dataset.pick||b.dataset.go));
  const dc=$('#detail-close'); if(dc) dc.onclick=()=>{ ui.sel=null; ui.editing=null; render('world'); };
  const oe=$('#ov-event'); if(oe) oe.onclick=()=>showTab('event');
  const oh=$('#ov-hist'); if(oh) oh.onclick=()=>showTab('history');
  const gn=$('#g-now'); if(gn) gn.onclick=()=>{ ui.graphVer='work'; render('world'); };
  if(pe && editable && (!PH || SHEET==='full')) wireDetail(pe);
  if(PH) wirePhone(pe, pos);
  wirePending();
}
const fitView=()=>({x:0,y:0,w:1100,h:540});
/* ---------- 휴대폰 관계도 ---------- */
/* 폭이 좁거나, 눕힌 휴대폰처럼 높이가 낮은 터치 화면 */
const isPhone=()=>innerWidth<600 || (innerHeight<500 && matchMedia('(pointer:coarse)').matches);
const isPortrait=()=>{ const t=screen.orientation?.type; return t ? t.startsWith('portrait') : innerHeight>=innerWidth; };
const ICON_LAYERS='<svg class="oct" viewBox="0 0 16 16" aria-hidden="true"><path d="M8 1 15 4.6 8 8.2 1 4.6Zm-5.3 6.3L8 10l5.3-2.7L15 8.2 8 11.8 1 8.2Zm0 3.6L8 13.6l5.3-2.7 1.7.9L8 15.4 1 11.8Z"/></svg>';
const ICON_FIT='<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" style="fill:none;stroke:currentColor;stroke-width:1.6;stroke-linecap:round"><path d="M1.8 5.5V1.8h3.7M14.2 5.5V1.8h-3.7M1.8 10.5v3.7h3.7M14.2 10.5v3.7h-3.7"/></svg>';
/* 관계도 영역이 화면 아래까지 차도록 높이를 맞춘다 */
function sizePhoneGraph(){
  const gw=$('#g-wrap'); if(!gw) return;
  const top=gw.getBoundingClientRect().top+scrollY;
  gw.style.height=Math.max(360, Math.round(innerHeight-top-10))+'px';
}
/* 내용 전체가 위쪽 필터 줄과 아래 시트 사이에 들어오게 viewBox를 맞춘다 (화면 비율 그대로라 위아래가 비지 않는다) */
function fitPhone(V){
  const svg=$('#g-svg'), g=$('#g-body'); if(!svg||!g) return;
  const cw=svg.clientWidth, ch=svg.clientHeight; if(!cw||!ch) return;
  let b=null; try{ b=g.getBBox(); }catch(e){}
  if(!b||!b.width) b={x:0, y:0, width:ui.vert?540:1100, height:ui.vert?1100:540};
  const top=58, bot=($('#g-peek')?.offsetHeight||64)+14, side=10, ah=Math.max(120, ch-top-bot);
  const k=Math.max(b.width/(cw-side*2), b.height/ah);
  V.w=cw*k; V.h=ch*k; V.x=b.x+b.width/2-V.w/2; V.y=b.y-top*k-(ah*k-b.height)/2; delete V.fresh; delete V.touched;
  V.fitW=V.w; V.fitSize=`${cw}x${ch}`;
  svg.setAttribute('viewBox', `${V.x} ${V.y} ${V.w} ${V.h}`);
}
/* 확대·축소 한계: 휴대폰에서는 '전체 맞춤'보다 조금 더 작게까지만 줄어든다 */
function zoomRange(V){ return isPhone() ? [150, Math.max(400, (V.fitW||2200)*1.15)] : [280, 2200]; }
/* 영역 크기가 바뀌었는데(주소창이 사라지는 등) 아직 손대지 않았으면 다시 맞춘다 */
function refitPhone(){ const V=ui.view, svg=$('#g-svg'); if(!V||!svg) return;
  if(V.fresh || (!V.touched && V.fitSize!==`${svg.clientWidth}x${svg.clientHeight}`)) fitPhone(V); }
/* 아래 시트를 손가락으로 끌기: 따라 움직이다가, 놓으면 펼치거나 접거나 제자리로 부드럽게 */
const SHEET_EASE='transform .28s cubic-bezier(.2,.8,.2,1)';
function sheetDrag(sheet, handles, {up, down}){
  if(!sheet) return;
  let st=null;
  const begin=ev=>{ if(ev.button || ev.target.closest('input,textarea,select,a,button:not(.sheet-grab)')) return;
    st={y:ev.clientY, t:performance.now(), dy:0, moved:false, id:ev.pointerId, el:ev.currentTarget};
    try{ ev.currentTarget.setPointerCapture(ev.pointerId); }catch(e){} };
  const move=ev=>{ if(!st || ev.pointerId!==st.id) return; const dy=ev.clientY-st.y;
    if(!st.moved && Math.abs(dy)<6) return; st.moved=true; st.dy=dy;
    /* 펼칠 수 없는 쪽으로는 살짝만 끌린다 */
    const t = dy<0 ? (up?Math.max(dy*0.45,-80):dy*0.15) : (down?dy:dy*0.15);
    sheet.style.transition='none'; sheet.style.transform=`translateY(${t}px)`; };
  const end=ev=>{ if(!st || ev.pointerId!==st.id) return; const {dy, moved, t}=st; st=null;
    if(!moved){ return; }
    ev.currentTarget.dataset.dragged='1';
    const v=dy/Math.max(1, performance.now()-t);
    if(up && (dy<-40 || v<-0.45)){ sheet.style.transition=SHEET_EASE; sheet.style.transform='translateY(-24px)'; up(); return; }
    if(down && (dy>70 || v>0.5)){ sheet.style.transition='transform .2s ease-in'; sheet.style.transform='translateY(110%)';
      const sc=$('.g-full-scrim'); if(sc && sheet.classList.contains('g-full')){ sc.style.transition='opacity .2s'; sc.style.opacity='0'; }
      setTimeout(down, 190); return; }
    sheet.style.transition=SHEET_EASE; sheet.style.transform=''; };
  handles.filter(Boolean).forEach(h=>{ h.onpointerdown=begin; h.onpointermove=move; h.onpointerup=end; h.onpointercancel=end;
    h.addEventListener('click', ev=>{ if(h.dataset.dragged){ ev.stopImmediatePropagation(); ev.preventDefault(); delete h.dataset.dragged; } }, true); });
}
/* 고른 항목이 시트에 가려 있으면 보이는 곳 가운데로 옮긴다 (새로 골랐을 때만) */
function revealPhone(V, p){
  const svg=$('#g-svg'); if(!svg) return; const cw=svg.clientWidth, ch=svg.clientHeight; if(!cw||!ch) return;
  const k=V.w/cw, sh=$('#g-peek')?.offsetHeight||0, lo=60, hi=ch-sh-50;
  const sx=(p[0]-V.x)/k, sy=(p[1]-V.y)/k;
  if(sx>36 && sx<cw-36 && sy>lo && sy<hi) return;
  V.x=p[0]-cw/2*k; V.y=p[1]-Math.max(lo,(lo+hi)/2)*k;
  svg.setAttribute('viewBox', `${V.x} ${V.y} ${V.w} ${V.h}`);
}
/* 자세히(또는 세계관 요약)는 아래에서 올라오는 큰 시트로 */
function fullSheet(panel){
  return `<div class="g-scrim g-full-scrim" data-sheet="peek"></div>`+panel.replace('<aside class="detail"', '<aside class="detail g-full"').replace(/(<aside[^>]*>)/, '$1<button type="button" class="sheet-grab" data-sheet="peek" aria-label="접기"></button>');
}
function wirePhone(pe, pos){
  const V=ui.view;
  sizePhoneGraph();
  const pk=$('#g-peek'); $('#g-wrap')?.style.setProperty('--peek-h', (pk?pk.offsetHeight:0)+'px');
  refitPhone();
  const selId = pe && !pe.id.startsWith('bg_') ? pe.id : null;
  if(selId && ui.revealed!==selId && $('#g-peek')) revealPhone(V, pos(selId));
  ui.revealed=selId;
  const open=to=>{ if(to==='peek' && pe?.id.startsWith('bg_')){ ui.sel=null; ui.editing=null; }
    ui.sheet=to; render('world'); if(to==='full') focusDetail(); else $('#g-view')?.focus({preventScroll:true}); };
  $$('[data-sheet]').forEach(b=>b.onclick=()=>open(b.dataset.sheet));
  const close=()=>{ ui.sel=null; ui.editing=null; render('world'); };
  /* 새로 나타난 시트만 아래에서 올라오게 (다시 그릴 때마다 움직이지 않게) */
  const full=$('.detail.g-full'), peekEl=$('#g-peek');
  const key=full?`full:${pe?.id||''}`:peekEl?`peek:${selId||''}`:'';
  if(key && key!==ui.sheetKey){ (full||peekEl).classList.add('enter'); if(full) $('.g-full-scrim')?.classList.add('enter'); }
  ui.sheetKey=key;
  /* 요약 시트: 위로 밀면 자세히, 아래로 밀면 닫기(고른 항목이 있을 때) */
  sheetDrag(peekEl, [peekEl], {up:()=>open('full'), down:selId?close:null});
  /* 자세히 시트: 손잡이나 맨 위 줄을 아래로 밀면 접힌다 */
  if(full) sheetDrag(full, [full.querySelector('.sheet-grab'), full.querySelector('.detail-bar')], {down:()=>open('peek')});
  const pc=$('#peek-close'); if(pc) pc.onclick=close;
  const gv=$('#g-view'); if(gv) gv.onclick=()=>{ ui.viewSheet=true; renderWorld(); $('.g-viewsheet input')?.focus(); };
  $$('[data-close-view]').forEach(b=>b.onclick=()=>{ ui.viewSheet=false; renderWorld(); $('#g-view')?.focus({preventScroll:true}); });
  /* 처음 한 번만: 사용법 안내 */
  let seen='1'; try{ seen=localStorage.getItem('gitstory-graph-tip'); }catch(e){}
  const gw=$('#g-wrap');
  if(!seen && gw && !ui.viewSheet && !$('#g-tip')){
    gw.insertAdjacentHTML('beforeend', '<div class="g-tip" id="g-tip" role="status">끌어서 이동 · 두 손가락으로 확대 · 눌러서 자세히</div>');
    const done=()=>{ const tip=$('#g-tip'); if(tip) tip.outerHTML=''; try{ localStorage.setItem('gitstory-graph-tip','1'); }catch(e){} };
    $('#g-svg')?.addEventListener('pointerdown', done, {once:true}); setTimeout(done, 7000);
  }
}
/* 관계도 조작: 노드 끌어 옮기기(위치 저장), 빈 곳 끌어 이동, 확대·축소. 4px 안 움직이면 클릭으로 본다. */
function wireGraph(svg, body){
  const V=ui.view, setVB=()=>svg.setAttribute('viewBox', `${V.x} ${V.y} ${V.w} ${V.h}`);
  const pt=ev=>{ const p=new DOMPoint(ev.clientX, ev.clientY).matrixTransform(svg.getScreenCTM().inverse()); return [p.x, p.y]; };
  const wire=()=>svg.querySelectorAll('.node').forEach(n=>n.onkeydown=ev=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); pick(n.dataset.id); } });
  const zoom=(k,c=[V.x+V.w/2, V.y+V.h/2])=>{ const [mn,mx]=zoomRange(V), w=clamp(V.w*k, mn, mx), f=w/V.w; V.touched=true; V.x=c[0]-(c[0]-V.x)*f; V.y=c[1]-(c[1]-V.y)*f; V.h=w*V.h/V.w; V.w=w; setVB(); };
  /* 빈 곳으로 너무 멀리 끌면 살짝 버티다가, 놓으면 허용 범위 안으로 부드럽게 돌아온다. */
  const PULL=0.35, MARGIN=0.12;
  /* 내용 가장자리 밖으로는 화면의 12%까지만 빈 곳이 보이게 한다. 내용이 화면보다 작으면 화면 안에 머문다.
     휴대폰에서는 위쪽 필터 줄과 아래 시트에 가리는 만큼을 더 내어 준다 */
  const span=(lo,len,view,m,a,z)=>len+a+z+2*m>=view ? [lo-m-a, lo+len-view+m+z] : [lo+len-view+m+z, lo-m-a];
  const range=()=>{ const g=$('#g-body'); let b; try{ b=g.getBBox(); }catch(e){ return null; } if(!b.width&&!b.height) return null;
    const k=V.w/(svg.clientWidth||1), ph=isPhone(), top=ph?58*k:0, bot=ph?(($('#g-peek')?.offsetHeight||0)+14)*k:0, m=Math.min(V.w,V.h)*MARGIN;
    const [x0,x1]=span(b.x,b.width,V.w,m,0,0), [y0,y1]=span(b.y,b.height,V.h,m,top,bot);
    return {x0, x1, y0, y1}; };
  const soft=(v,lo,hi)=>v<lo?lo-(lo-v)*PULL:v>hi?hi+(v-hi)*PULL:v;
  let anim=0;
  const settle=()=>{ const r=range(); if(!r) return;
    const tx=clamp(V.x,r.x0,r.x1), ty=clamp(V.y,r.y0,r.y1); if(tx===V.x && ty===V.y) return;
    const fx=V.x, fy=V.y, t0=performance.now(), dur=380;
    const step=now=>{ const t=Math.min(1,(now-t0)/dur), e=1-Math.pow(1-t,3); V.x=fx+(tx-fx)*e; V.y=fy+(ty-fy)*e; setVB(); if(t<1) anim=requestAnimationFrame(step); };
    cancelAnimationFrame(anim); anim=requestAnimationFrame(step); };
  let d=null; const pts=new Map(); let pinch=null;
  const two=()=>{ const [a,b]=[...pts.values()]; return {dist:Math.hypot(a.x-b.x, a.y-b.y)||1, cx:(a.x+b.x)/2, cy:(a.y+b.y)/2}; };
  svg.onpointerdown=ev=>{ if(ev.button) return; cancelAnimationFrame(anim); pts.set(ev.pointerId, {x:ev.clientX, y:ev.clientY});
    try{ svg.setPointerCapture(ev.pointerId); }catch(e){}
    if(pts.size>=2){ if(d?.id && !d.ro && d.moved) saveWorld(); d=null; pinch={...two(), w:V.w}; return; }
    const n=ev.target.closest('.node'), ro=ui.graphVer!=='work';
    let hw=24; if(n){ try{ hw=Math.max(24, n.getBBox().width/2); }catch(e){} }
    d={id:n?.dataset.id, ro, hw, sx:ev.clientX, sy:ev.clientY, vx:V.x, vy:V.y, moved:false, r:(n&&!ro)?null:range()}; };
  svg.onpointermove=ev=>{ if(pts.has(ev.pointerId)) pts.set(ev.pointerId, {x:ev.clientX, y:ev.clientY});
    if(pinch && pts.size>=2){ const t=two(); const [cx,cy]=pt({clientX:t.cx, clientY:t.cy}); zoom(pinch.w*pinch.dist/t.dist/V.w, [cx,cy]); return; }
    if(!d) return;
    if(!d.moved && Math.hypot(ev.clientX-d.sx, ev.clientY-d.sy)<5) return; d.moved=true;
    if(d.id && !d.ro){ const [x,y]=pt(ev), hw=Math.min(d.hw+4, 540);
      /* 세로 화면에서는 가로·세로를 바꿔 그렸으니 저장할 때 되돌린다 */
      LAYOUT[d.id] = ui.vert ? [Math.round(clamp(y,28,1072)), Math.round(clamp(x,28,500))] : [Math.round(clamp(x,hw,1100-hw)), Math.round(clamp(y,28,500))];
      $('#g-body').innerHTML=body(); wire(); }
    else { const k=V.w/svg.clientWidth, x=d.vx-(ev.clientX-d.sx)*k, y=d.vy-(ev.clientY-d.sy)*k, r=d.r;
      V.x=r?soft(x,r.x0,r.x1):x; V.y=r?soft(y,r.y0,r.y1):y; V.touched=true; setVB(); } };
  const lift=ev=>{ pts.delete(ev.pointerId); if(pinch){ if(pts.size<2){ pinch=null; settle(); } return true; } return false; };
  svg.onpointerup=ev=>{ if(lift(ev)) return; const x=d; d=null; if(!x) return; if(!x.moved){ if(x.id){ ui.sheet='peek'; pick(x.id); } else if(isPhone() && ui.sel){ ui.sel=null; ui.editing=null; render('world'); } return; } if(x.id && !x.ro) saveWorld(); else settle(); };
  svg.onpointercancel=ev=>{ if(lift(ev)) return; const x=d; d=null; if(x && !x.id) settle(); };
  svg.onwheel=ev=>{ if(!ev.ctrlKey && !ev.metaKey) return; ev.preventDefault(); zoom(ev.deltaY<0?0.88:1/0.88, pt(ev)); clearTimeout(svg.st); svg.st=setTimeout(settle,250); };
  $$('[data-zoom]').forEach(b=>b.onclick=()=>{ const z=b.dataset.zoom; if(z==='fit'){ if(isPhone()) fitPhone(V); else { Object.assign(V, fitView()); setVB(); } } else { zoom(z==='in'?0.8:1.25); settle(); } });
  wire();
}
/* 아무것도 고르지 않았을 때 오른쪽 패널: 세계관 한눈에 보기 */
function overview(s){
  const line=(ui.graphVer==='work'||ui.graphVer==='preview'||!byId(ui.graphVer)) ? commits : lineOf(ui.graphVer);
  const recent=line.slice(-3).reverse();
  return `<aside class="detail" id="detail" aria-label="세계관 요약">
    <div class="Box"><div class="Box-header"><h3>세계관 한눈에</h3></div>
      <div class="Box-body stack" style="gap:12px">
        <div class="ov-stats">${[['인물',s.characters.length],['단체',s.groups.length],['배경',s.background.length],['관계',s.relations.length]].map(([l,n])=>`<div><b>${n}</b><span>${l}</span></div>`).join('')}</div>
        <div class="caption">관계도나 왼쪽 목록에서 인물, 단체를 누르면 여기서 상황과 관계를 보고 바로 고칠 수 있어요.</div>
      </div></div>
    <div class="Box"><div class="Box-header"><h3>${line===commits?'최근 사건':'이 시점까지의 사건'}</h3><span class="Counter">${line.length}</span></div>
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
  $$('[data-pin]').forEach(b=>b.onclick=()=>{ togglePin(b.dataset.pin); render('world'); });
  $$('[data-lv]').forEach(b=>b.onclick=()=>{ setManual(b.dataset.lv, +b.dataset.v); render('world'); });
  const sitKeep=()=>{ const base=`/${coll(e.id)}/${e.id}/situation`; setManual(base+'/status', $('#sit-status').value.trim().slice(0,40)); setManual(base+'/current', $('#sit-current').value.trim()); saveWorld(); };
  ['#sit-current','#sit-status'].forEach(q=>{ const el=$(q); if(el) el.onchange=sitKeep; });
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
  const pb=$('#ent-photo-btn'); if(pb) pb.onclick=()=>$('#ent-photo').click();
  const ph=$('#ent-photo'); if(ph) ph.onchange=async()=>{ const f=ph.files?.[0]; if(!f) return;
    try{ setManual(base+'/photo', await shrinkPhoto(f)); toast('사진을 넣었어요'); render('world'); }catch(err){ toast('사진을 읽지 못했어요'); } };
  const pd=$('#ent-photo-del'); if(pd) pd.onclick=()=>{ setManual(base+'/photo', null); toast('사진을 뺐어요'); render('world'); };
  // 지우기: 바로 지우고 알림의 되돌리기로 되살린다
  const undoable=(msg, done)=>{ if(!done.length) return; render(); toastUndo(msg, ()=>{ restore(done); toast('되살렸어요'); render(); }); };
  const dl=$('#ent-del'); if(dl) dl.onclick=async ()=>{
    const name=e.name||e.title, rels=state.relations.filter(r=>r.from===e.id||r.to===e.id).length;
    const mem=e.id.startsWith('grp_')?state.characters.filter(ch=>(ch.memberships||[]).some(m=>m.group===e.id)).length:0;
    const more=[rels?`관계 ${rels}개`:'', mem?`소속 인물 ${mem}명의 소속`:''].filter(Boolean).join(', ');
    const subs=e.id.startsWith('grp_')?state.groups.filter(g=>g.parent===e.id).length:0;
    if(!(await sure(`${jq(name,'를','을')} 지울까요?${more?` ${more}도 함께 지워져요.`:''}${subs?` 하위 단체 ${subs}개는 최상위 단체가 돼요.`:''} 지운 뒤에도 알림의 되돌리기로 되살릴 수 있어요.`, '지우기', true))) return;
    if(!ent(state,e.id)) return;
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
/* 관계도 동그라미 글자: 같은 글자가 겹치면 두 글자로 */
function initials(list){ const base={}, cnt={}; list.forEach(c=>{ const k=initial(c.name||'?'); base[c.id]=k; cnt[k]=(cnt[k]||0)+1; });
  const out={}; list.forEach(c=>{ const k=base[c.id]; out[c.id]= cnt[k]>1 ? (c.name||'?').replace(/\s+/g,'').slice(0,2) : k; }); return out; }
/* 드롭다운 이름: 같은 이름이 둘 이상이면 소속이나 순번을 붙인다 */
function optName(list, x){ const same=list.filter(y=>(y.name||y.title)===(x.name||x.title)); if(same.length<2) return x.name||x.title;
  const g=x.memberships?.[0]?.group||x.parent; return `${x.name||x.title} (${g?nm(state,g):same.indexOf(x)+1+'번째'})`; }
function memberOf(s,a,b){
  const ea=ent(s,a), eb=ent(s,b);
  return (ea?.memberships||[]).some(m=>m.group===b) || (eb?.memberships||[]).some(m=>m.group===a) || ea?.parent===b || eb?.parent===a;
}

/* ---------- 버전 기록 ---------- */
const realCount=c=>c.patches.filter(p=>!(p.op==='add' && /\/situation\/history\/-$/.test(p.path) && p.after?.source==='manual')).length;
function coalesce(from, to){
  const map=new Map(); const out=[];
  commits.slice(from+1, to+1).forEach(c=>c.patches.forEach(p=>{
    if(p.op==='replace'){ const m=map.get(p.path); if(m) m.after=p.after; else { const x={...p}; map.set(p.path,x); out.push(x); } }
    else out.push(p);
  }));
  const J=JSON.stringify, gone=new Set();
  out.forEach((p,i)=>{ if(gone.has(i) || p.path.endsWith('/-')) return;
    for(let j=i+1;j<out.length;j++){ const q=out[j]; if(gone.has(j) || q.path!==p.path) continue;
      if((p.op==='add' && q.op==='remove') || (p.op==='remove' && q.op==='add' && J(p.before)===J(q.after))){ gone.add(i); gone.add(j); }
      break; } });
  return out.filter((p,i)=>!gone.has(i) && (p.op!=='replace' || J(p.before)!==J(p.after)));
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
    <div class="actions"><div class="seg" role="group" aria-label="보기 방식">${[['tree','이야기 흐름'],['time','타임라인'],['appear','화별 등장'],['list','비교·되돌리기']].map(([k,l])=>`<button aria-pressed="${(ui.histView||'tree')===k}" data-hv="${k}">${l}</button>`).join('')}</div></div></div>`;
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
  const ol=[...state.characters,...state.groups]; const opts=ol.map(x=>`<option value="${x.id}" ${f===x.id?'selected':''}>${esc(optName(ol,x))}</option>`).join('');
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
          <div class="caption" style="display:flex;gap:6px;align-items:center;flex-wrap:wrap"><span class="Label">${COMMIT_KIND[c.kind]||c.kind}</span>${fmtDate(c.created_at)}${realCount(c)?` · 변경 ${realCount(c)}건`:''}</div>
          ${c.event?`<div style="padding:8px 12px;background:var(--bg-subtle);border-radius:6px">${esc(c.event.description)}${c.event.story_time?`<div class="caption" style="margin-top:4px">작중 시점: ${esc(c.event.story_time)}</div>`:''}</div>`:''}
          ${c.event&&(c.event.aftermath||c.event.reactions?.length)?`<div class="Box" style="margin:0"><div class="Box-header"><h3>여파와 인물별 반응</h3></div>${reactionsHtml(c.event.aftermath, c.event.reactions)}</div>`:''}
          ${onLine.has(c.id)?'':`<div class="caption">지금 전개('${esc(curBranch().name)}')에는 없는 기록이에요.</div>`}
        </div>
        <div class="Box-row" style="flex-wrap:wrap;gap:8px">
          ${(heads[c.id]||[]).filter(b=>b.id!==branchId).map(b=>`<button class="btn btn-sm btn-primary" data-sw="${b.id}">'${esc(b.name)}' 전개로 이동</button>`).join('')}
          <button class="btn btn-sm" id="t-branch">${icon('commit')}여기서 '만약에' 전개 만들기</button>
          <button class="btn btn-sm" id="t-graph">${icon('graph')}이 시점 관계도</button>
        </div></div>
      <div class="Box"><div class="Box-header"><h3>전개</h3><span class="Counter">${branches.length}</span></div>
        ${branches.map((b,bi)=>`<div class="Box-row"><span class="dot" style="background:${LANE_C[bi%LANE_C.length]}"></span>
          <div style="flex:1;min-width:0"><b>${esc(b.name)}</b>${b.id===branchId?' <span class="Label Label--accent">지금</span>':''}<div class="caption">기록 ${lineOf(b.head).length}개 · 마지막: ${esc(cname(b.head))}</div></div>
          ${b.id===branchId?'':`<button class="btn btn-sm" data-sw="${b.id}">이동</button>${b.id==='main'?'':`<button class="btn btn-sm btn-danger" data-delb="${b.id}">지우기</button>`}`}</div>`).join('')}
        <div class="Box-row caption">지난 기록에서 '만약에' 전개를 만들면 본편은 그대로 두고 다른 이야기를 시험해 볼 수 있어요. 전개 합치기는 준비 중이에요.</div></div>
    </aside>
  </div>`;
  wireHistHead();
  $$('[data-tc]').forEach(b=>b.onclick=()=>{ ui.treeSel=b.dataset.tc; renderHistory(); });
  $$('[data-sw]').forEach(b=>b.onclick=()=>{ if(switchBranch(b.dataset.sw)) toast(`'${curBranch().name}' 전개로 옮겼어요`); render(); });
  $('#t-branch').onclick=async ()=>{ const v=await ask("'만약에' 전개 만들기", [{label:'새 전개 이름 (예: 만약 바이가 떠나지 않았다면)', max:40, required:true}], '만들기'); if(!v) return;
    let name=v[0]; if(branches.some(b=>b.name===name)){ let k=2; while(branches.some(b=>b.name===`${name} (${k})`)) k++; name=`${name} (${k})`; toast(`같은 이름이 있어 '${name}'으로 만들었어요`); }
    createBranch(sel, name); render(); };
  $('#t-graph').onclick=()=>{ ui.graphVer = sel===head().id?'work':sel; showTab('graph'); };
  $$('[data-delb]').forEach(b=>b.onclick=async ()=>{ const br=branches.find(x=>x.id===b.dataset.delb);
    if(!(await sure(`'${br.name}' 전개를 지울까요? 이 전개에만 있는 기록도 함께 지워져요.`, '지우기', true))) return;
    if(!branches.some(x=>x.id===br.id) || br.id===branchId) return;
    deleteBranch(br.id); toast('전개를 지웠어요'); render(); });
  wirePending();
}
function renderHistory(){
  if((ui.histView||'tree')==='tree') return renderTree();
  if(ui.histView==='time') return renderTimeline();
  if(ui.histView==='appear') return renderAppear();
  const n=commits.length;
  if(!commits.some(c=>c.id===ui.cmpA)) ui.cmpA=commits[Math.max(0,n-2)].id;
  if(!commits.some(c=>c.id===ui.cmpB)) ui.cmpB=commits[n-1].id;
  let ia=commits.findIndex(c=>c.id===ui.cmpA), ib=commits.findIndex(c=>c.id===ui.cmpB); if(ia>ib) [ia,ib]=[ib,ia];
  const same=ia!==ib && JSON.stringify(stateAt(ia))===JSON.stringify(stateAt(ib));
  const diff=same?[]:coalesce(ia,ib); const lines=diff.flatMap(p=>patchLines(stateAt(ib),p));
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
            <small><span class="Label" style="margin-right:4px">${COMMIT_KIND[c.kind]||c.kind}</span>${esc(USER.name)} 기록${c.impacts?.length?` · 영향 ${c.impacts.length}건`:''} · 변경 ${realCount(c)}건</small></div>
          <div class="pick" role="group" aria-label="비교 대상">
            <label><input type="radio" name="cmpA" value="${c.id}" ${ui.cmpA===c.id?'checked':''}>A</label>
            <label><input type="radio" name="cmpB" value="${c.id}" ${ui.cmpB===c.id?'checked':''}>B</label>
          </div>
          ${i<n-1?`<button class="btn btn-sm btn-danger" data-rb="${c.id}">이 시점으로 되돌리기</button>`:''}
        </div>
        ${c.event?`<div style="margin-top:8px;padding:8px 12px;background:var(--bg-subtle);border-radius:6px"><div>${esc(c.event.description)}</div>
          <div class="caption" style="margin-top:4px">${c.event.story_time?`작중 시점: ${esc(c.event.story_time)} · `:''}관련: ${(c.event.involved||[]).map(id=>esc(nm(state,id))).join(', ')}</div></div>`:''}
        ${(c.impacts?.length||c.patches.length)?`<button class="btn-link" data-open="${c.id}" style="margin-top:8px;font-size:12px">${open?'접기':'영향과 변경 보기'}</button>`:''}
        ${open?`${c.event&&(c.event.aftermath||c.event.reactions?.length)?`<div class="Box" style="margin-top:8px"><div class="Box-header"><h3>여파와 인물별 반응</h3></div>${reactionsHtml(c.event.aftermath, c.event.reactions, stateAt(i))}</div>`:''}${impactTable(c)}${c.patches.length?`<div class="stack" style="gap:3px;margin-top:12px">${c.patches.flatMap(p=>patchLines(stateAt(i),p)).map(([k,l])=>`<span class="diffline ${k}">${esc(l)}</span>`).join('')}</div>`:''}`:''}
        ${ui.confirm===c.id?`<div class="confirm">${icon('alert')}<span style="flex:1 1 200px">이후 기록 ${n-1-i}개의 변경을 거꾸로 되돌려요. 기존 기록은 지워지지 않고 되돌리기 기록이 새로 쌓여요.</span>
          <button class="btn btn-sm" data-cancel>취소</button><button class="btn btn-sm btn-primary" data-ok="${c.id}">되돌리기</button></div>`:''}
      </div></div>`; }).join('')}
    </div>
    <aside class="Box" style="position:sticky;top:76px">
      <div class="Box-header"><h3>비교</h3><span class="caption">${esc(cnum(commits[ia].id)+cname(commits[ia].id))} → ${esc(cnum(commits[ib].id)+cname(commits[ib].id))}</span></div>
      <div class="Box-body stack" style="gap:4px;max-height:60vh;overflow:auto">
        ${ia===ib?'<span class="caption">A와 B에 서로 다른 기록을 고르세요.</span>':same?'<span class="caption">두 시점의 세계관 내용이 똑같아요. 되돌리기가 제대로 됐다는 뜻이에요.</span>':lines.length?lines.map(([c,l])=>`<span class="diffline ${c}">${esc(l)}</span>`).join(''):'<span class="caption">차이가 없습니다.</span>'}
      </div>
      <div class="Box-row" style="flex-wrap:wrap"><span class="caption" style="flex:1">${cnt.add}개 추가 · ${cnt.chg}개 변경 · ${cnt.del}개 삭제</span>
        <button class="btn btn-sm" id="h-graph">${icon('graph')}B 시점 관계도</button></div>
    </aside>
  </div>`;
  $$('input[name=cmpA]').forEach(r=>r.onchange=()=>{ ui.cmpA=r.value; renderHistory(); });
  $$('input[name=cmpB]').forEach(r=>r.onchange=()=>{ ui.cmpB=r.value; renderHistory(); });
  $$('[data-open]').forEach(b=>b.onclick=()=>{ const id=b.dataset.open; const i=commits.findIndex(c=>c.id===id); ui.open[id]=!(ui.open[id] ?? (i===n-1)); renderHistory(); });
  $$('[data-rb]').forEach(b=>b.onclick=()=>{ ui.confirm=b.dataset.rb; renderHistory(); });
  const cancelRb=()=>{ const id=ui.confirm; ui.confirm=null; renderHistory(); $(`[data-rb="${id}"]`)?.focus(); };
  $$('[data-cancel]').forEach(b=>b.onclick=cancelRb);
  const cf=$('.confirm'); if(cf){ cf.querySelector('[data-cancel]')?.focus(); cf.onkeydown=ev=>{ if(ev.key==='Escape'){ ev.stopPropagation(); cancelRb(); } }; }
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
/* 저장 실패 알림: 브라우저 저장과 클라우드 저장이 둘 다 실패하면 닫을 수 없는 경고를 띄운다 */
const SAVE={local:true, cloud:true, warned:false};
function saveHealth(){
  let el=$('#save-warn');
  const bad=!SAVE.local && !SAVE.cloud;
  if(bad && !el){ $('.main-col')?.insertAdjacentHTML('afterbegin', `<div class="flash flash-error save-warn" id="save-warn" role="alert">${icon('alert')}<div><b>지금 고친 내용이 저장되지 않고 있어요.</b> 브라우저 저장 공간이 꽉 찼고 클라우드에도 연결되지 않았어요. 창을 닫거나 새로고침하면 사라질 수 있어요. 인터넷 연결을 확인하거나 다른 탭·사이트의 저장 공간을 비워 주세요.</div></div>`); }
  if(!bad && el) el.remove();
  if(!SAVE.local && SAVE.cloud && !SAVE.warned){ SAVE.warned=true; toast('브라우저 저장 공간이 꽉 차서 클라우드에만 저장하고 있어요'); }
}
function localSet(k, v){ try{ localStorage.setItem(k, v); SAVE.local=true; saveHealth(); return true; }catch(e){ console.warn('브라우저 저장 실패', e); SAVE.local=false; saveHealth(); return false; } }
function setCloud(st){
  const el=$('#cloud-status'); if(!el) return;
  const m={connecting:['클라우드 연결 중','Label--attention'], synced:['클라우드에 저장됨','Label--success'], saving:['저장 중','Label--attention'], offline:['브라우저에만 저장','Label--danger']}[st];
  el.textContent=m[0]; el.className='Label '+m[1];
}
function saveWorld(){
  const json=JSON.stringify(snapshot());
  if(json===lastJson) return;
  lastJson=json; savedAt=Date.now();
  localSet(saveKey(worldKey), JSON.stringify({...snapshot(), savedAt}));
  clearTimeout(cloudTimer);
  const key=worldKey, at=savedAt, data={...snapshot(), meta:DATA.meta};
  setCloud('saving');
  cloudTimer=setTimeout(()=>{
    saveCloud(key, data, at).then(()=>{ setCloud('synced'); SAVE.cloud=true; saveHealth(); }).catch(err=>{ console.warn('Firestore 저장 실패', err); setCloud('offline'); SAVE.cloud=false; saveHealth(); });
  }, 800);
}
/* 오늘 남은 AI 토큰 표시 */
let lastUsage=null;
function showUsage(u){
  lastUsage=u;
  const el=$('#token-meter'); const left=Math.max(0,u.limit-u.used)+u.credits;
  el.textContent=u.admin?`관리자 · 오늘 ${u.used.toLocaleString()} 토큰 사용`:`${u.plan==='pro'?'Pro · ':''}오늘 남은 토큰 ${left.toLocaleString()}`;
  el.className='Label '+(u.admin||left>0?'':'Label--danger');
  el.title=`하루 ${u.limit.toLocaleString()} 중 ${u.used.toLocaleString()} 사용 · 충전 잔액 ${u.credits.toLocaleString()} · 매일 한국 시간 자정 초기화`;
  showModelPicker(u);
}
/* 관리자만: 어떤 AI 모델로 부를지 고르는 메뉴. 고른 값은 이 브라우저에 기억하고 요청마다 서버에 알린다 */
function showModelPicker(u){
  let sel=$('#ai-model');
  if(!u.admin||!u.models?.length){ if(sel) sel.remove(); $('#ai-runs')?.remove(); return; }
  if(!$('#ai-runs')){
    const b=document.createElement('button'); b.id='ai-runs'; b.type='button'; b.className='btn btn-sm'; b.textContent='AI 기록 복사';
    b.title='관리자용: 최근 AI 실행 20개(모델·시간·토큰·결과)를 비교용으로 복사';
    b.onclick=copyAiRuns; $('#token-meter').before(b);
  }
  if(!sel){
    sel=document.createElement('select'); sel.id='ai-model'; sel.className='form-control'; sel.style.cssText='width:auto;max-width:160px;height:28px;padding:0 6px;font-size:12px';
    sel.setAttribute('aria-label','AI 모델 (관리자)'); sel.title='관리자용: AI 모델 고르기';
    sel.addEventListener('change',()=>{ setAiModel(sel.value); toast(`AI 모델: ${sel.selectedOptions[0]?.textContent}`); });
    $('#token-meter').before(sel);
  }
  const cur=getAiModel(); const known=u.models.some(m=>m.id===cur);
  if(cur&&!known) setAiModel('');
  sel.innerHTML=`<option value="">요금제대로 (${u.plan==='pro'?'Pro':'무료'})</option>`+u.models.map(m=>`<option value="${esc(m.id)}">${esc(m.label)}</option>`).join('');
  sel.value=known?cur:'';
}
/* 관리자: 최근 AI 실행 기록을 비교하기 좋은 글로 복사한다 */
async function copyAiRuns(){
  try{
    const {runs}=await fetchAiRuns();
    if(!runs.length){ toast('아직 저장된 AI 실행 기록이 없어요'); return; }
    const text=runs.map(r=>`## ${new Date(r.at).toLocaleString('ko-KR')} · ${r.kind} · ${r.model} · ${(r.ms/1000).toFixed(1)}초 · 토큰 ${r.tokens} (${r.detail})\n입력: ${JSON.stringify(r.input)}\n결과: ${JSON.stringify(r.output)}`).join('\n\n');
    await navigator.clipboard.writeText(text);
    toast(`AI 실행 기록 ${runs.length}개를 복사했어요`);
  }catch(err){ console.warn('AI 기록 복사 실패', err); toast(`AI 기록을 복사하지 못했어요. ${friendlyErr(err)}`); }
}
/* 결과 알림에 쓸 AI 이름. 관리자에게는 실제 모델 이름까지 보여준다 */
const aiName=r=>r.usage?.admin?r.model:(r.provider==='claude'?'Claude':'Gemini');
function refreshUsage(){
  fetchUsage().then(showUsage).catch(err=>{ console.warn('토큰 사용량 확인 실패', err); const el=$('#token-meter'); el.textContent='남은 토큰을 확인하지 못했어요'; el.className='Label Label--danger'; el.title=friendlyErr(err); });
}
/* 다른 기기에서 저장한 게 더 최신이면 불러옴 */
function syncFromCloud(k){
  setCloud('connecting');
  loadCloud(k).then(remote=>{
    if(k!==worldKey) return;
    if(remote && remote.updatedAt>savedAt && remote.data?.state){
      state=remote.data.state; setTree(remote.data.commits, remote.data.branches, remote.data.branch); pending=remote.data.pending||[]; LAYOUT=remote.data.layout||{}; CHAPTERS=remote.data.chapters||[]; PINS=remote.data.pins||[];
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
  state=clone(DATA.state); setTree(clone(DATA.commits)); pending=[]; analysis=null; LAYOUT={}; PINS=[]; ui.view=null; CHAPTERS=[]; msResult=null; Object.keys(chBody).forEach(k=>delete chBody[k]);
  if(!fresh){
    try{
      const saved=JSON.parse(localStorage.getItem(saveKey(k)));
      if(saved?.state && saved?.commits){ state=saved.state; setTree(saved.commits, saved.branches, saved.branch); pending=saved.pending||[]; LAYOUT=saved.layout||{}; CHAPTERS=saved.chapters||[]; PINS=saved.pins||[]; }
      savedAt=saved?.savedAt||0;
    }catch(e){ savedAt=0; }
  } else savedAt=0;
  lastJson=JSON.stringify(snapshot());
  Object.assign(ui, {ch:null, chDraft:null, chVers:false, sel:null, treeSel:null, editing:null, graphVer:'work', relFilter:'all', chRange:null, askLog:[], askQuote:null, msCard:null, sheet:'peek', viewSheet:false, revealed:null, cmpA:null, cmpB:null, confirm:null, open:{}});
  try{ localStorage.setItem('gitstory-world', k); }catch(e){}
}
$('#side-q').oninput=ev=>{ ui.q=ev.target.value; renderSide(); };
$('#side-toggle').onclick=()=>sideOpen(!$('#side').classList.contains('open'));
$('#side-close').onclick=()=>sideOpen(false);
$('#side-backdrop').onclick=()=>sideOpen(false);
document.addEventListener('keydown',ev=>{ if(ev.key==='Escape' && $('#side').classList.contains('open')) sideOpen(false); });
$('#world-pick').onchange=ev=>{ loadWorld(ev.target.value); render(); syncFromCloud(worldKey); toast(`${DATA.meta.title} 세계관을 불러왔어요`); };
$('#world-reset').onclick=async ()=>{
  if(!(await sure(`${DATA.meta.title}의 모든 변경을 지우고 처음 상태로 되돌릴까요?${worldKey.startsWith('p_')?' (직접 만든 프로젝트는 빈 상태가 됩니다)':''}`, '처음 상태로 되돌리기', true))) return;
  loadWorld(worldKey, true); lastJson=null; render(); toast('처음 상태로 되돌렸어요');
};
/* ---------- 직접 만든 프로젝트 (키 p_...) ----------
   목록은 브라우저에 두고, 각 프로젝트 내용은 다른 세계관처럼 users/{uid}/worlds/{키}에 meta와 함께 저장한다. */
const projKey=()=>`gitstory-projects-${USER.uid}`;
let PROJECTS=[];
try{ PROJECTS=JSON.parse(localStorage.getItem(projKey()))||[]; }catch(e){ PROJECTS=[]; }
function writeProjects(){ localSet(projKey(), JSON.stringify(PROJECTS)); }
/* 다른 탭에서 바뀐 프로젝트 목록을 합친다 (덮어써서 사라지지 않게) */
function mergeProjects(){
  let other=[]; try{ other=JSON.parse(localStorage.getItem(projKey()))||[]; }catch(e){}
  other.forEach(o=>{ const mine=PROJECTS.find(p=>p.key===o.key); if(!mine){ PROJECTS.push(o); WORLDS[o.key]=customWorld(o); } else Object.assign(mine.meta, o.meta); });
}
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
$('#proj-new').onclick=async ()=>{
  const v=await ask('새 프로젝트 만들기', [{label:'프로젝트(세계관) 이름', max:40, required:true},{label:'한 줄 설명 (비워도 돼요)', max:120}], '만들기'); if(!v) return;
  const [title, description]=v;
  const key='p_'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);
  const p={key, meta:{id:key, title, description, created_at:new Date().toISOString()}};
  mergeProjects(); PROJECTS.push(p); writeProjects(); WORLDS[key]=customWorld(p);
  loadWorld(key); fillPicker(); showTab('world'); syncFromCloud(key);
  toast(`'${title}' 프로젝트를 만들었어요. 왼쪽의 + 인물 추가, + 단체 추가로 시작하세요`);
};
$('#proj-edit').onclick=async ()=>{
  const p=PROJECTS.find(x=>x.key===worldKey); if(!p) return;
  const v=await ask('프로젝트 정보 바꾸기', [{label:'프로젝트 이름', value:p.meta.title, max:40, required:true},{label:'한 줄 설명', value:p.meta.description||'', max:120}], '바꾸기'); if(!v) return;
  const [title, d]=v; p.meta.description=d;
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
/* 같은 브라우저의 다른 탭에서 저장하면 그 내용을 받아 온다. 각 탭이 자기 상태로 덮어써 한쪽 작업이 사라지는 것을 막는다. */
window.addEventListener('storage', ev=>{
  if(!ev.key || ev.newValue==null) return;
  if(ev.key===projKey()){ mergeProjects(); fillPicker(); return; }
  if(ev.key===saveKey(worldKey)){
    let saved=null; try{ saved=JSON.parse(ev.newValue); }catch(e){ return; }
    if(!saved?.state || !saved?.commits || (saved.savedAt||0)<=savedAt) return;

    state=saved.state; setTree(saved.commits, saved.branches, saved.branch); pending=saved.pending||[]; LAYOUT=saved.layout||{}; CHAPTERS=saved.chapters||[]; PINS=saved.pins||[];
    savedAt=saved.savedAt; lastJson=JSON.stringify(snapshot());
    render(); toast('다른 탭에서 바뀐 내용을 불러왔어요');
    return;
  }
  const pre=`gitstory-ms-${USER.uid}-${worldKey}-`;
  if(ev.key.startsWith(pre)){
    const id=ev.key.slice(pre.length); let b=null; try{ b=JSON.parse(ev.newValue); }catch(e){ return; }
    if(!b || (chBody[id]?.savedAt||0)>=(b.savedAt||0)) return;
    chBody[id]=b; if(cur()==='manuscript' && ui.ch===id) renderManuscript();
  }
});
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
/* 프로필 사진 메뉴: 휴대폰에서는 테마·도움말·로그아웃 버튼을 여기로 모은다 */
av.setAttribute('role','button'); av.tabIndex=0; av.setAttribute('aria-haspopup','menu'); av.setAttribute('aria-expanded','false'); av.setAttribute('aria-label', `${USER.name} 메뉴`);
function userMenu(open){
  const old=$('#user-menu'); if(old) old.outerHTML=''; av.setAttribute('aria-expanded', !!open); if(!open) return;
  $('.app-header').insertAdjacentHTML('beforeend', `<div class="user-menu" id="user-menu" role="menu" aria-label="${esc(USER.name)} 메뉴"><div class="caption">${esc(USER.name)}</div>
    <button type="button" role="menuitem" data-um="theme-btn">테마</button><button type="button" role="menuitem" data-um="help-btn">도움말</button><button type="button" role="menuitem" data-um="sign-out">로그아웃</button></div>`);
  $$('[data-um]').forEach(b=>b.onclick=ev=>{ ev.stopPropagation(); userMenu(false); $('#'+b.dataset.um).click(); });
  $('#user-menu').onkeydown=ev=>{ if(ev.key==='Escape'){ userMenu(false); av.focus(); } };
  $('#user-menu button').focus();
}
av.onclick=ev=>{ ev.stopPropagation(); userMenu(!$('#user-menu')); };
av.onkeydown=ev=>{ if(ev.key==='Enter'||ev.key===' '){ ev.preventDefault(); userMenu(!$('#user-menu')); } };
document.addEventListener('click', ev=>{ if($('#user-menu') && !ev.target.closest('#user-menu')) userMenu(false); });
/* 화면을 돌리거나 크기가 바뀌면: 휴대폰·세로 여부가 바뀔 때만 관계도를 다시 그린다 (입력 중에는 건드리지 않는다) */
{ let mode=`${isPhone()}:${isPortrait()}`, t=0;
  addEventListener('resize', ()=>{ clearTimeout(t); t=setTimeout(()=>{
    const m=`${isPhone()}:${isPortrait()}`, typing=document.activeElement?.matches?.('input,textarea,select,[contenteditable]');
    if(m!==mode){ mode=m; ui.view=null; ui.viewSheet=false; if(cur()==='world' && !typing) renderWorld(); }
    else if(cur()==='world' && isPhone() && !typing){ sizePhoneGraph(); refitPhone(); }
  }, 150); });
}
/* ---------- 사용 안내 (처음 한 번, 이후 도움말 버튼) ---------- */
const TOUR=[
  ['world','세계관','세계관 전체가 관계도로 보여요. 인물이나 단체를 누르면 상황, 성격, 관계가 자세히 열리고 바로 고칠 수 있어요. 도구창(휴대폰에서는 ☰ 목록)의 + 인물 추가, + 단체 추가로 새로 만들어요. 오른쪽 위에서 시점을 고르면 그때의 관계도로 바뀌어요.'],
  ['event','사건 입력','이야기에서 일어난 일을 적고 AI 영향 분석을 누르면, 누가 직접 영향을 받고 소속을 따라 어떻게 퍼지는지 보여줘요. 확인한 뒤 사건 기록하기를 누르면 버전으로 남아요.'],
  ['manuscript','원고','화마다 원고를 쓰거나 붙여넣으면 저장돼요. AI로 읽으면 새 인물, 바뀐 상황, 새 관계, 큰 사건을 후보로 골라줘요. 체크한 것만 반영돼요.'],
  ['history','버전 기록','모든 변화가 이야기 흐름으로 쌓여요. 지난 기록에서 \'만약에\' 전개를 만들어 다른 이야기를 시험하고, 언제든 되돌릴 수 있어요. 내 이야기는 도구창의 + 새 프로젝트로 시작하세요. 이 안내는 머리줄의 도움말(휴대폰에서는 프로필 사진 메뉴)로 다시 볼 수 있어요.']
];
let tourFrom=null;
function tour(i=0){
  $('#tour')?.remove(); $$('.tour-hl').forEach(el=>el.classList.remove('tour-hl'));
  if(i>=TOUR.length){ const had=!!tourFrom; try{ localStorage.setItem('gitstory-tour-done','1'); }catch(e){} showTab('world'); if(had){ (tourFrom.isConnected?tourFrom:$('#help-btn')).focus(); tourFrom=null; } return; }
  if(!tourFrom) tourFrom=document.activeElement&&document.activeElement!==document.body?document.activeElement:$('#help-btn');
  const [tab,title,text]=TOUR[i]; showTab(tab);
  const tb=$(`[role=tab][data-tab=${tab}]`); tb.classList.add('tour-hl'); tb.scrollIntoView({inline:'center', block:'nearest'});
  document.body.insertAdjacentHTML('beforeend', `<div class="tour" id="tour" role="dialog" aria-label="사용 안내"><div class="caption">사용 안내 ${i+1} / ${TOUR.length}</div><h3>${title}</h3><p>${text}</p>
    <div class="tour-actions"><button class="btn btn-sm" id="tour-skip">건너뛰기</button>${i?'<button class="btn btn-sm" id="tour-prev">이전</button>':''}<button class="btn btn-sm btn-primary" id="tour-next">${i===TOUR.length-1?'시작하기':'다음'}</button></div></div>`);
  $('#tour-next').onclick=()=>tour(i+1); $('#tour-skip').onclick=()=>tour(TOUR.length); $('#tour-next').focus();
  $('#tour').onkeydown=ev=>{ if(ev.key!=='Tab') return; const b=$$('#tour button'), f=b[0], l=b[b.length-1];
    if(ev.shiftKey && document.activeElement===f){ ev.preventDefault(); l.focus(); } else if(!ev.shiftKey && document.activeElement===l){ ev.preventDefault(); f.focus(); } };
  const pv=$('#tour-prev'); if(pv) pv.onclick=()=>tour(i-1);
}
$('#help-btn').onclick=()=>tour(0);
$('#help-btn').insertAdjacentHTML('beforebegin', `<button class="btn btn-sm btn-ask" id="ask-btn" type="button" aria-expanded="false" aria-haspopup="dialog">${icon('spark')}<span>물어보기</span></button>`);
$('#ask-btn').onclick=()=>askOpen(!$('#ask-panel'));
/* 휴대폰 뒤로가기: 열린 창·패널·상세를 먼저 닫고, 더 닫을 게 없으면 한 번 더 눌러야 나간다 */
{ const guard=()=>{ try{ history.pushState(null, '', location.href); }catch(e){} };
  let backAt=0; guard();
  addEventListener('popstate', ()=>{
    if(Date.now()-backAt<2000 && backAt){ backAt=0; history.back(); return; }
    if($('#ask')) $('#ask-no')?.click();
    else if($('#ask-panel')) askOpen(false);
    else if($('#user-menu')) userMenu(false);
    else if($('#theme-pop')) toggleTheme(false, 'btn');
    else if($('#tour')) tour(TOUR.length);
    else if($('#side').classList.contains('open')) sideOpen(false);
    else if(cur()==='world' && ui.viewSheet){ ui.viewSheet=false; renderWorld(); }
    else if(cur()==='world' && isPhone() && ui.sheet==='full' && !ui.sel?.startsWith('bg_')){ ui.sheet='peek'; render('world'); }
    else if(cur()==='world' && ui.sel){ ui.sel=null; ui.editing=null; render('world'); }
    else if(cur()!=='world') showTab('world');
    else { backAt=Date.now(); toast('뒤로가기를 한 번 더 누르면 나가요'); }
    guard();
  });
}
{ const sk=$('#skip-link'); if(sk) sk.onclick=ev=>{ ev.preventDefault(); $('[role=tab][aria-selected=true]').focus(); }; }
document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && $('#tour')) tour(TOUR.length); });
/* ---------- 테마 고르기: 원고지(기본)·밤의 서고·작업 노트 × 시스템·밝게·어둡게. 이 브라우저에 기억한다 ---------- */
const SKINS=[['studio','스튜디오',['#f5f5f7','#5847e0','#18181b']],['paper','원고지',['#fbfbf7','#2f7a5b','#1c211f']],['night','밤의 서고',['#1a1630','#e6b85c','#93d6ea']],['note','작업 노트',['#fdfcf5','#2c5ccf','#fff07a']]];
const MODES=[['system','시스템'],['light','밝게'],['dark','어둡게']];
const pref=(k,d)=>{ try{ return localStorage.getItem(k)||d; }catch(e){ return d; } };
function applyTheme(skin, mode){
  const r=document.documentElement;
  if(skin==='studio') delete r.dataset.skin; else r.dataset.skin=skin;
  if(mode==='system') delete r.dataset.theme; else r.dataset.theme=mode;
  try{ localStorage.setItem('gitstory-skin',skin); localStorage.setItem('gitstory-mode',mode); }catch(e){}
}
function themePop(){
  const skin=pref('gitstory-skin','studio'), mode=pref('gitstory-mode','system');
  return `<div class="theme-pop" id="theme-pop" role="dialog" aria-label="테마">
    <div class="lab">테마</div><div class="theme-opts">${SKINS.map(([k,l,c])=>`<button type="button" data-skin="${k}" aria-pressed="${skin===k}"><span class="swatch">${c.map(x=>`<i style="background:${x}"></i>`).join('')}</span>${l}</button>`).join('')}</div>
    <div class="lab">밝기</div><div class="theme-opts">${MODES.map(([k,l])=>`<button type="button" data-mode="${k}" aria-pressed="${mode===k}" ${skin==='night'?'disabled':''}>${l}</button>`).join('')}</div>
    ${skin==='night'?'<div class="caption">밤의 서고는 어두운 화면 하나만 있어요.</div>':''}</div>`;
}
function toggleTheme(open, keep){
  const was=$('#theme-pop'), inside=was?.contains(document.activeElement);
  was?.remove(); const btn=$('#theme-btn'); btn.setAttribute('aria-expanded', open);
  if(!open){ if(inside || keep==='btn') btn.focus(); return; }
  $('.app-header').insertAdjacentHTML('beforeend', themePop());
  const pop=$('#theme-pop');
  (pop.querySelector(keep||'[data-skin][aria-pressed="true"]')||pop.querySelector('button')).focus();
  pop.onkeydown=ev=>{ if(ev.key!=='Tab') return; const f=[...pop.querySelectorAll('button:not([disabled])')], a=f[0], z=f[f.length-1];
    if(ev.shiftKey && document.activeElement===a){ ev.preventDefault(); z.focus(); } else if(!ev.shiftKey && document.activeElement===z){ ev.preventDefault(); a.focus(); } };
  $$('#theme-pop [data-skin]').forEach(b=>b.onclick=()=>{ const sk=b.dataset.skin; applyTheme(sk, sk==='night'?'system':pref('gitstory-mode','system')); toggleTheme(true, `[data-skin="${sk}"]`); render(); });
  $$('#theme-pop [data-mode]').forEach(b=>b.onclick=()=>{ const md=b.dataset.mode; applyTheme(pref('gitstory-skin','studio'), md); toggleTheme(true, `[data-mode="${md}"]`); render(); });
}
$('#theme-btn').onclick=ev=>{ ev.stopPropagation(); toggleTheme(!$('#theme-pop')); };
document.addEventListener('click', ev=>{ const pop=$('#theme-pop'); if(pop && !ev.target.closest('#theme-pop') && !ev.target.closest('#theme-btn')){ ev.preventDefault(); ev.stopPropagation(); toggleTheme(false); } }, true);
document.addEventListener('keydown', ev=>{ if(ev.key==='Escape' && $('#theme-pop')) toggleTheme(false, 'btn'); });
refreshUsage();
render('world');
try{ if(!localStorage.getItem('gitstory-tour-done')) tour(0); }catch(e){}
syncFromCloud(startWorld);
}
