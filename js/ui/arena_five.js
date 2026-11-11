// Integrated draft -> 5x5 arena. Local bots; no account or network matchmaking.
(function(G){
'use strict';
let active=null;
function open(options={}){
 if(active)return false;
 const root=document.createElement('div');root.id='five-root';root.setAttribute('role','dialog');root.setAttribute('aria-label','Arena 5 por 5');root.setAttribute('aria-modal','true');
 G.CosmosMenu?.detach();G.DuelMotion?.detach();
 const app=document.getElementById('app'),wasInert=app.inert;app.inert=true;document.body.append(root);
 let closed=false,paused=false,portrait=false,matchToken=null;
 const timeouts=new Set(),intervals=new Set(),animations=new Set();
 const setTimeout=(fn,ms)=>{const id=globalThis.setTimeout(()=>{timeouts.delete(id);if(!closed)fn();},ms);timeouts.add(id);return id;};
 const clearTimeout=id=>{globalThis.clearTimeout(id);timeouts.delete(id);};
 const setInterval=(fn,ms)=>{const id=globalThis.setInterval(()=>{if(!closed)fn();},ms);intervals.add(id);return id;};
 const $=selector=>root.querySelector(selector);
 const H={},Menu={on:(key,fn)=>{(H[key]||=[]).push(fn);}};
 const Aud={init:()=>{},sfx:kind=>G.PresentationFX?.interaction?.(({pick:'select',ban:'cancel',hit:'confirm',crit:'confirm',skill:'star',heal:'equip'})[kind]||'click')};
 const BattleEngine=G.ArenaFiveEngine;
 const reduced=()=>!!G.PresentationFX?.getPreferences?.().reducedMotion;
 const assets={"bg": "assets/arena-five/bg.jpg", "logo": "assets/arena-five/logo.webp", "coins": "assets/arena-five/coins.webp", "deck": "assets/arena-five/deck.webp", "shop": "assets/arena-five/shop.webp", "star": "assets/arena-five/star.webp", "frame": "assets/arena-five/frame.webp", "trophy": "assets/arena-five/trophy.webp", "dots": "assets/arena-five/dots.webp", "play": "assets/arena-five/play.webp", "chars": ["assets/arena-five/chars-0.webp", "assets/arena-five/chars-1.webp", "assets/arena-five/chars-2.webp", "assets/arena-five/chars-3.webp", "assets/arena-five/chars-4.webp", "assets/arena-five/chars-5.webp", "assets/arena-five/chars-6.webp", "assets/arena-five/chars-7.webp", "assets/arena-five/chars-8.webp", "assets/arena-five/chars-9.webp", "assets/arena-five/chars-10.webp", "assets/arena-five/chars-11.webp", "assets/arena-five/chars-12.webp", "assets/arena-five/chars-13.webp", "assets/arena-five/chars-14.webp", "assets/arena-five/chars-15.webp", "assets/arena-five/chars-16.webp", "assets/arena-five/chars-17.webp", "assets/arena-five/chars-18.webp"], "audio": {"music": "assets/arena-five/audio-music.mp3", "title": "Ace Beneath the Sleeve"}, "bg2": "assets/arena-five/bg2.jpg", "faces": ["assets/arena-five/faces-0.webp", "assets/arena-five/faces-1.webp", "assets/arena-five/faces-2.webp", "assets/arena-five/faces-3.webp", "assets/arena-five/faces-4.webp", "assets/arena-five/faces-5.webp", "assets/arena-five/faces-6.webp", "assets/arena-five/faces-7.webp", "assets/arena-five/faces-8.webp", "assets/arena-five/faces-9.webp", "assets/arena-five/faces-10.webp", "assets/arena-five/faces-11.webp", "assets/arena-five/faces-12.webp", "assets/arena-five/faces-13.webp", "assets/arena-five/faces-14.webp", "assets/arena-five/faces-15.webp", "assets/arena-five/faces-16.webp", "assets/arena-five/faces-17.webp", "assets/arena-five/faces-18.webp"]};
 const ASSETS=assets;
 root.innerHTML='<div id="five-stage">'+"<div id=\"draft\"><img id=\"dbg\" data-a=\"bg2\" alt=\"\"><div id=\"dshade\"></div>\n<div id=\"mm\" class=\"scr\"><div class=\"lg\"><img data-a=\"logo\" width=\"520\" alt=\"\"></div><div id=\"mmt\"></div><div id=\"mmd\"></div></div>\n<div id=\"dr\" class=\"scr\">\n<svg width=\"1920\" height=\"1080\" viewBox=\"0 0 1920 1080\" style=\"left:0;top:0;pointer-events:none\"><polygon points=\"960,72 1378,170 1378,760 1336,830 960,992 584,830 542,760 542,170\" fill=\"#0a1c34b8\" stroke=\"#0a1626\" stroke-width=\"16\" stroke-linejoin=\"round\"/><line x1=\"960\" y1=\"82\" x2=\"960\" y2=\"985\" stroke=\"#6cf5\" stroke-width=\"3\"/></svg>\n<div id=\"dvs\">VS</div><div id=\"bgl\" class=\"bgb\"></div><div id=\"bgr\" class=\"bgb\"></div>\n<div id=\"bl\" class=\"bz\"></div><div id=\"br\" class=\"bz\"></div>\n<div id=\"dtitle\"></div><div id=\"dtime\"></div><div id=\"dsub\"></div><div id=\"dexit\" class=\"mbtn\">Sair</div>\n<div id=\"grid\"></div><div id=\"sheet\"></div><div id=\"info\"></div><div id=\"sup\"></div>\n<div id=\"ll\" class=\"ld\"></div><div id=\"lr\" class=\"ld\"></div><div id=\"tl\" class=\"bar\"></div><div id=\"tr\" class=\"bar\"></div>\n</div>\n<div id=\"dend\" class=\"scr\"><h1>Equipes prontas!</h1><div id=\"dsum\"></div><div id=\"dback\" class=\"mbtn\">Voltar ao menu</div></div>\n</div>\n<div id=\"arena\"><img id=\"abg\" alt=\"\"><div id=\"ashade\"></div><div id=\"afloor\"></div><div id=\"aunits\"></div>\n<div id=\"atimer\"><img data-a=\"trophy\" alt=\"\"><b id=\"atm\">3:00</b><small>Time</small><span id=\"arnd\">1\u00b0 Rodada</span></div>\n<div id=\"aexit\" class=\"mbtn\">Sair</div><div id=\"aspd\" class=\"mbtn\">x1</div><div id=\"aauto\" class=\"mbtn\">AUTO</div>\n<div id=\"ascore\"><div class=\"sc l\"><b id=\"asl\">0</b><span id=\"ant0\">RED TEAM</span><em id=\"aal\">5/5</em></div><div class=\"sc r\"><b id=\"asr\">0</b><span id=\"ant1\">BLUE TEAM</span><em id=\"aar\">5/5</em></div><div id=\"aem\"><img data-a=\"trophy\" alt=\"\"><small>CHAMPIONSHIP</small></div></div>\n<div id=\"aturns\"></div>\n<div id=\"abase\"></div><div id=\"askills\"></div><div id=\"aatk\">ATTACK</div><div id=\"apass\" class=\"mbtn\">PASSAR</div><div id=\"aclr\" class=\"mbtn\">QUEBRAR</div><div id=\"aen\"></div><div id=\"atbar\"><i></i></div><div id=\"atip\"></div>\n<div id=\"aact\"></div><div id=\"afx\"></div><div id=\"abn\"></div><div id=\"aend\"></div></div>\n\n"+'</div><button class="five-pause">Pausar</button>';
 $('#atip').setAttribute('role','status');$('#atip').setAttribute('aria-live','polite');
 root.querySelectorAll('[data-a]').forEach(img=>img.src=ASSETS[img.dataset.a]);$('#dbg').src='assets/visual-v0.27/backgrounds/crystal-valley.png';
 const fit=()=>{portrait=innerHeight>innerWidth;root.classList.toggle('portrait',portrait);const stage=$('#five-stage');stage.style.width=(portrait?1080:1920)+'px';stage.style.height=(portrait?1920:1080)+'px';stage.style.transform='translate(-50%,-50%) scale('+Math.min(innerWidth/(portrait?1080:1920),innerHeight/(portrait?1920:1080))+')';Arena.relayout();};
 function close(){if(closed)return;closed=true;Draft.exit();Arena.exit();G.VictoryPresenter?.close();for(const id of timeouts)globalThis.clearTimeout(id);for(const id of intervals)globalThis.clearInterval(id);for(const animation of animations)animation.cancel();observer.disconnect();globalThis.removeEventListener('resize',fit);globalThis.removeEventListener('goghos:presentation-preferences',preferences);document.removeEventListener('visibilitychange',visibility);root.remove();app.inert=wasInert;active=null;G.Soundtrack?.setContext('menu');options.onClose?.();document.querySelector('[data-act="play"]')?.focus();}
let inspectedPause=null;
function inspect(index,unit){const previousFocus=document.activeElement,c=BattleEngine.character(index),power=G.getMainAbility(c);if(!c)return;inspectedPause=paused;paused=true;for(const animation of animations)animation.pause();
 const hero=['sam','unicorn','sarck','zuri','nully','linx','vaglar','fonior','chama'].includes(c.id)?'<img class="inspect-character" src="assets/visual-v0.27/characters/'+c.id+'.png" alt="">':G.actorPortraitHTML(c,'five-hero');
 const overlay=document.createElement('div');overlay.id='five-inspect';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Ficha de '+c.name);
 overlay.innerHTML=`<button class="inspect-back">‹ Voltar</button><div class="inspect-cards">${G.cardHTML(c)}</div><div class="inspect-hero">${hero}</div><article><small>CAMPEÃO · ${G.CLASS_LABEL[c.class]}</small><h2>${c.name}</h2><div class="inspect-numbers"><span>♥ ${unit?.hp??c.maxHp}<small>Vida</small></span><span>✦ ${unit?Arena.battle.eff(unit,'atk'):c.damage}<small>Ataque</small></span><span>» ${unit?Arena.battle.eff(unit,'spd'):c.speed||'—'}<small>Velocidade</small></span></div><h3>✦ ${power.name}</h3><p>${power.description}</p><h3>◇ Tributo da classe</h3><p>${BattleEngine.TRIBUTES[c.class]}</p><small>Sem poderes extras equipados.</small></article>`;
 root.append(overlay);overlay.querySelector('button').focus();const done=()=>{overlay.remove();paused=inspectedPause;inspectedPause=null;if(!paused)for(const animation of animations)animation.play();if(previousFocus?.isConnected)previousFocus.focus();};overlay.querySelector('button').onclick=done;overlay.onkeydown=e=>{if(e.key==='Escape'){e.stopPropagation();done();}if(e.key==='Tab'){e.preventDefault();overlay.querySelector('button').focus();}};
}
const Draft=(()=>{
const $$=s=>root.querySelectorAll(s),rnd=a=>a[Math.random()*a.length|0],shuf=n=>[...Array(n).keys()].sort(()=>Math.random()-.5);
const ORDER=[0,1,1,0,0,1,0,1,0,1]; /* 0 = equipe sorteada, 1 = outra: 1-2-2-1-1-1-1-1 → 5 de cada lado */
const TEAMS=[{n:'RED TEAM',m:['Jogador','Bot1','Bot2','Bot3','Bot4']},{n:'BLUE TEAM',m:['Bot5','Bot6','Bot7','Bot8','Bot9']}];
const PAL=[['#7be0b0','#d3ffe9'],['#ff8fc0','#ffe08a'],['#ffe27a','#fff6c4'],['#ff5b6e','#ff9f7a'],['#8fb4ff','#dce8ff'],['#b690ff','#f2dcff']];
const SUP=[['Escudo','🛡️','+10% de defesa no início.'],['Cura','💚','Recupera 6% da vida a cada turno.'],['Velocidade','⚡','Age primeiro no desempate.'],['Foco','🎯','+10% de chance crítica.'],['Vingança','🔥','Dano extra ao ser derrotado.'],['Sorte','🍀','25% de chance de repetir a ação.']];
const TBD=[['Em breve','✨','Habilidade ainda não definida.'],['Em breve','✨','Habilidade ainda não definida.']];
/* EDITE AQUI: [nome, [[habilidade, ícone, descrição] x2], recorte do rosto [x, y, largura]] (a ordem = ASSETS.chars) */
const ROSTER=BattleEngine.CHARS.map((c,i)=>{
 const base=BattleEngine.character(i),power=G.getMainAbility(base),active=BattleEngine.SKILL[c.pw];
 return{n:c.n,k:[[power.name,'✦',power.description,active?'Ativo':'Próprio'],['Tributo de '+(G.CLASS_LABEL[c.cls]||c.cls),'◇',BattleEngine.TRIBUTES[c.cls],'Classe']],crop:[0,0,0],c:PAL[i%PAL.length],st:c};
});
let page=0;
const portrait=i=>G.actorPortraitHTML(BattleEngine.character(i),'five-portrait');
const draftPages=document.createElement('nav');draftPages.id='draft-pages';draftPages.setAttribute('aria-label','Páginas dos campeões');draftPages.innerHTML='<button id="draft-prev" aria-label="Campeões anteriores">‹</button><span></span><button id="draft-next" aria-label="Próximos campeões">›</button>';$('#dr').append(draftPages);
function pageGrid(){const cards=[...$$('#grid>.cd')];cards.forEach((el,i)=>el.hidden=Math.floor(i/6)!==page);$('#draft-pages span').textContent=(page+1)+' / '+Math.ceil(ROSTER.length/6);$('#draft-prev').disabled=page===0;$('#draft-next').disabled=page>=Math.ceil(ROSTER.length/6)-1;}
$('#draft-prev').onclick=()=>{page=Math.max(0,page-1);pageGrid();};$('#draft-next').onclick=()=>{page=Math.min(3,page+1);pageGrid();};
let S={run:0,id:0};const TH=[];let thP;
const W=ms=>{const id=S.id;return new Promise(r=>setTimeout(r,ms)).then(()=>{if(!S.run||S.id!=id)throw 0})};
async function until(f,ms){let left=ms,last=Date.now();while((!f()&&left>0)||paused||document.hidden){await W(100);const now=Date.now();if(paused||document.hidden){if(S.dl)S.dl+=now-last;}else left-=now-last;last=now;}}
const show=id=>['mm','dr','dend'].forEach(x=>$('#'+x).classList.toggle('on',x==id));
const T=(a,b='')=>{$('#dtitle').textContent=a;$('#dsub').textContent=b};
const hint=(h,p)=>$('#info').innerHTML=`<div class="t"><h3>${h}</h3><p>${p}</p></div>`;
const face=m=>m.ch>=0?(BattleEngine.character(m.ch).portraitBanner?.src||BattleEngine.character(m.ch).art):ASSETS.deck;
function thumbs(){ASSETS.faces.forEach((s,i)=>TH[i]=s);return Promise.resolve()}

/* ---------- desenho ---------- */
function cardHTML(i){const r=ROSTER[i];return `<div class="cd" data-i="${i}" style="--a:${r.c[0]};--b:${r.c[1]}"><div class="in"><img class="st" src="${ASSETS.star}">${portrait(i)}<span class="nm">${r.n}</span><span class="ks">${r.k.map(k=>k[1]).join('')}</span><em></em></div></div>`}
const buildGrid=()=>{$('#grid').innerHTML=ROSTER.map((_,i)=>cardHTML(i)).join('');page=0;pageGrid();};
function paint(){$$('#grid .cd').forEach(e=>{const i=+e.dataset.i,b=S.rev&&S.bans.has(i),p=S.owner[i]!=null;e.classList.toggle('bn',!!b);e.classList.toggle('pk',p);e.classList.toggle('sl',S.sel.includes(i));e.querySelector('em').textContent=p?'ESCOLHIDO':b?'BANNED':''})}
function renderBans(){[0,1].forEach(t=>{const b=S.banBy[t];$(t?'#br':'#bl').innerHTML=`<h3>*Área banidos*</h3><div class="bw">${[0,1].map(i=>b[i]!=null&&S.rev?cardHTML(b[i]).replace('class="cd"','class="cd bn"').replace('<em></em>','<em>BANNED</em>'):'<div class="cd ph"></div>').join('')}</div>`})}
function slot(m){const r=m.ch>=0&&ROSTER[m.ch];return `<div data-pick-key="${m.t}-${m.j}" data-picked="${m.ch}" class="sl2${m.h?' me':''}${S.turn==m?' tn':''}" style="--a:${r?r.c[0]:'#1c1c22'};--b:${r?r.c[1]:'#3a3a44'}"><div class="in">${r?portrait(m.ch):'<span class="five-unknown">?</span>'}<small>${r?r.n:''}</small></div><span>${m.n}</span></div>`}
const seenPicks=new Map();
function renderSlots(){TEAMS.forEach((t,k)=>{$(k?'#tr':'#tl').innerHTML=`<h2>${t.n}</h2>`+S.mem.filter(m=>m.t==k).map(slot).join('')});S.lead.forEach((m,k)=>{$(k?'#lr':'#ll').innerHTML=`<img src="${face(m)}" class="${m.ch>=0&&ROSTER[m.ch].crop?'':'q'}"><b>Líder</b><span>${m.n}</span>`})}
function animatePicks(){if(reduced())return;for(const el of root.querySelectorAll('[data-pick-key]')){const key=el.dataset.pickKey,id=+el.dataset.picked;if(id>=0&&seenPicks.get(key)!==id){const a=el.animate([{opacity:0,translate:'0 28px',scale:.75},{opacity:1,translate:'0 0',scale:1}],{duration:480,easing:'cubic-bezier(.2,1.25,.4,1)'});animations.add(a);a.finished.catch(()=>{}).finally(()=>animations.delete(a));}seenPicks.set(key,id);}}
function info(i){S.view=i;const r=ROSTER[i],ban=S.mode=='ban',ok=ban?S.hb&&S.sel.length==2:S.mode=='pick'&&S.ht&&S.sel[0]!=null;
$('#info').innerHTML=`${portrait(i)}<div class="t"><h3>${r.n}</h3>${r.k.map(k=>`<p><b>${k[1]} ${k[0]}</b> — ${k[2]}</p>`).join('')}</div><button class="inspect-link" data-inspect-index="${i}">Ver ficha</button>${S.hb||S.ht?`<div id="ok" class="mbtn${ok?'':' off'}">${ban?'BANIR '+S.sel.length+'/2':'ESCOLHER'}</div>`:''}`}
function buildSheet(){$('#sheet').innerHTML=TEAMS.map((_,t)=>`<div class="col">${S.mem.filter(m=>m.t==t).map(m=>{const r=ROSTER[m.ch];return `<div class="rw${m.h?' me':''}" style="--a:${r.c[0]};--b:${r.c[1]}">${portrait(m.ch)}<div class="t"><b>${m.n}</b><small>${r.n}</small></div><span class="e">${r.k.map(k=>k[1]).join('')}<br>◇ ${G.CLASS_LABEL[r.st.cls]||r.st.cls}</span></div>`}).join('')}</div>`).join('')}
function buildSup(){const me=S.mem[0],r=ROSTER[me.ch];$('#sup').innerHTML='<div class="t"><h4>Seu campeão está pronto</h4><p>✦ '+r.k[0][0]+' · ◇ '+(G.CLASS_LABEL[r.st.cls]||r.st.cls)+'</p><small>Somente habilidade própria e tributo da classe.</small></div><button id="rdy" class="mbtn">PRONTO</button>';}


/* ---------- interação ---------- */
$('#grid').onclick=e=>{const c=e.target.closest('.cd');if(!c||!S.run)return;const i=+c.dataset.i;Aud.sfx('click');
if(!((S.rev&&S.bans.has(i))||S.owner[i]!=null)){if(S.mode=='ban'&&S.hb){const k=S.sel.indexOf(i);k>=0?S.sel.splice(k,1):(S.sel.push(i),S.sel.length>2&&S.sel.shift())}else if(S.mode=='pick'&&S.ht)S.sel=[i]}
info(i);paint()};
$('#info').onclick=e=>{if(e.target.closest('[data-inspect-index]')){inspect(+e.target.closest('[data-inspect-index]').dataset.inspectIndex);return;}if(e.target.closest('#ok:not(.off)')&&S.conf){Aud.sfx('pick');S.conf()}};
$('#sup').onclick=e=>{if(e.target.closest('#rdy')){Aud.sfx('pick');S.rd=1;}};
setInterval(()=>{const el=$('#dtime');if(!S.run||!S.dl){el.textContent='';el.classList.remove('lo');return}const s=Math.max(0,Math.ceil((S.dl-Date.now())/1000));el.textContent=s+'s';el.classList.toggle('lo',s<=5);if(s<=5&&s>0&&s!=S.ls&&(S.hb||S.ht||S.mode=='rev')){S.ls=s;Aud.sfx('tick')}},250);

/* ---------- fases ---------- */
async function search(){show('mm');const t=$('#mmt'),d=$('#mmd');d.innerHTML='<i></i>'.repeat(10);let n=1;
const f=()=>{t.textContent=`Preparando equipe local ${n}/10`;[...d.children].forEach((e,i)=>e.classList.toggle('on',i<n))};f();
while(n<10){await W(100+Math.random()*150);n=Math.min(10,n+1+(Math.random()<.25));Aud.sfx('hover');f()}
t.textContent='Equipes prontas!';Aud.sfx('open');await W(1200)}

async function banPhase(){
const S0=S;S.mode='ban';S.lead=[S.mem[0],rnd(S.mem.filter(m=>m.t===1))];S.hb=S.lead[0].h?1:0;S.banBy=[[],[]];
const[a,b]=S.lead,dn=[0,0],pk=[[],[]];
show('dr');buildGrid();renderSlots();renderBans();paint();hint('Banimento','Toque em um personagem para ver as habilidades.');
T('BANIMENTO',S.hb?'Você é o líder! Escolha 2 personagens para banir.':`Aguardando ${a.n} e ${b.n} banirem…`);
S.lead.forEach((m,t)=>{if(!m.h)setTimeout(()=>{if(S0.run){pk[t]=shuf(ROSTER.length).slice(0,2);dn[t]=1}},1400+Math.random()*1000)});
S.conf=()=>{pk[0]=S.sel.slice();dn[0]=1;S.hb=0;T('BANIMENTO',`Aguardando ${b.n} banir…`);hint('Banimento enviado','Aguarde o outro líder.')};
S.dl=Date.now()+20000;await until(()=>dn[0]&&dn[1],20000);
if(!dn[0])pk[0]=S.sel.slice();
pk.forEach((p,t)=>{const s=new Set(p);while(s.size<2)s.add(Math.random()*ROSTER.length|0);pk[t]=[...s]});
const used=new Set(pk[0]);pk[1]=pk[1].map(i=>{while(used.has(i))i=Math.random()*ROSTER.length|0;used.add(i);return i});
S.banBy=pk;pk.flat().forEach(i=>S.bans.add(i));S.hb=0;S.sel=[];S.rev=1;S.dl=0;S.conf=null;
paint();renderBans();Aud.sfx('ban');T('BANIDOS!');hint('Banimentos revelados','Personagens banidos não podem ser escolhidos.');await W(2800)}

async function pickPhase(){
S.mode='pick';const f=Math.random()<.5?0:1,av=()=>ROSTER.map((_,i)=>i).filter(i=>!S.bans.has(i)&&S.owner[i]==null);
T('SORTEIO','Sorteando quem começa…');await W(1300);T(TEAMS[f].n+' COMEÇA!');Aud.sfx('open');await W(1600);
for(const o of ORDER){const t=o?1-f:f,m=rnd(S.mem.filter(x=>x.t==t&&x.ch<0));
S.turn=m;S.ht=m.h?1:0;if(S.ht)page=Math.floor(av()[0]/6);pageGrid();S.sel=[];S.pc=null;renderSlots();paint();
T(`VEZ DE ${m.n}!`,m.h?'Sua vez! Toque em um personagem e confirme.':TEAMS[t].n);
hint(m.h?'Sua vez!':`${m.n} está escolhendo…`,'Toque em um personagem para ver as habilidades.');
S.conf=()=>{S.pc=S.sel[0]};S.dl=Date.now()+30000;let ch;
if(m.h){Aud.sfx('turn');await until(()=>S.pc!=null,30000);ch=S.pc??S.sel[0]??rnd(av())}
else{await W(800+Math.random()*800);ch=rnd(av());S.sel=[ch];page=Math.floor(ch/6);pageGrid();paint();await W(650)}
S.ht=0;m.ch=ch;S.owner[ch]=m;S.sel=[];S.dl=0;S.conf=null;Aud.sfx('pick');renderSlots();animatePicks();paint();await W(700)}
S.turn=null;renderSlots()}

async function review(){
S.mode='rev';S.mem.forEach(m=>m.sup=[]);$('#draft-pages').hidden=true;
$('#grid').style.display=$('#info').style.display='none';$('#sheet').classList.add('on');$('#sup').classList.add('on');
T('PREPARE-SE!','Confira sua habilidade e o tributo da classe.');S.dl=Date.now()+30000;S.rd=0;buildSup();buildSheet();Aud.sfx('turn');
await until(()=>S.rd,30000)}

function finish(){S.dl=0;
const res={bans:S.banBy.map(a=>a.map(i=>ROSTER[i].n)),teams:TEAMS.map((t,k)=>({name:t.n,players:S.mem.filter(m=>m.t==k).map(m=>({name:m.n,human:m.h,char:ROSTER[m.ch].n,charId:m.ch,support:m.sup.map(i=>SUP[i][0])}))}))};
Menu.lastDraft=res;H.battle&&H.battle.forEach(f=>f(res));
$('#dsum').innerHTML=res.teams.map(t=>`<b>${t.name}</b>: ${t.players.map(p=>p.char).join(', ')}`).join('<br>');show('dend');Aud.sfx('play')}

/* ---------- controle ---------- */
function start(){if(S.run)return;
const mem=[];TEAMS.forEach((t,k)=>t.m.forEach((n,j)=>mem.push({t:k,j,n,ch:-1,sup:[],h:k==0&&j==0})));
S={run:1,id:++start.n,mem,bans:new Set(),owner:{},sel:[],mode:'',rev:0,lead:[],banBy:[[],[]],turn:null,ht:0,hb:0,dl:0};
$('#draft-pages').hidden=false;$('#grid').style.display=$('#info').style.display='';$('#sheet').classList.remove('on');$('#sup').classList.remove('on');$('#draft').classList.add('on');
thumbs().then(async()=>{await search();await banPhase();await pickPhase();await review();finish()}).catch(e=>e!==0&&console.error(e))}
start.n=0;
function exit(){S.run=0;$('#draft').classList.remove('on')}
$('#dexit').onclick=$('#dback').onclick=()=>{Aud.sfx('click');close()};
return{start,exit,ROSTER,get state(){return S}}})();

const Arena=(()=>{
const E=BattleEngine,AR=$('#arena'),RO=()=>Draft.ROSTER;
const SUPN=['Escudo','Cura','Velocidade','Foco','Vingança','Sorte'],SUPI={Escudo:'🛡️',Cura:'💚',Velocidade:'⚡',Foco:'🎯','Vingança':'🔥',Sorte:'🍀'};
const SUPD={Escudo:'+10% de defesa no início da rodada.',Cura:'Cura 6% da vida a cada turno.',Velocidade:'Age primeiro no desempate.',Foco:'+10% de chance crítica.','Vingança':'Dano extra ao ser derrotado.',Sorte:'25% de repetir a ação.'};
let B=null,on=0,runId=0,spd=.65,auto=0,els={},pend=null,sel=null,human=null,cur=null,roundOn=0,res0=null,tt=null,inputSerial=0;
const sleep=async (ms,valid)=>{const id=runId;let left=ms;while(left>0){await new Promise(r=>setTimeout(r,50));if(!on||runId!==id||valid&&!valid())throw 0;if(!paused&&!document.hidden)left-=50*spd;}};
const pos=u=>portrait?({x:220+u.slot%3*280,y:(u.team?450:1000)+Math.floor(u.slot/3)*260}):({x:(u.team?935:100)+u.slot*152,y:u.slot%2?585:560}),ctr=u=>{const p=pos(u);return{x:p.x,y:p.y+105}};
const faceOf=u=>BattleEngine.character(u.ch).portraitBanner?.src||BattleEngine.character(u.ch).art,cardOf=u=>BattleEngine.character(u.ch).cardBase.src,R0=u=>RO()[u.ch];
const cardFor=u=>G.cardHTML({...BattleEngine.character(u.ch),hp:u.hp,maxHp:u.max,mana:u.mana,maxMana:u.cls==='MAGO'?3:0,damage:B.eff(u,'atk'),speed:B.eff(u,'spd')});
const shuf=n=>[...Array(n).keys()].sort(()=>Math.random()-.5);

/* ---------- construção ---------- */
function unitHTML(u){const r=R0(u),p=pos(u);
 return `<div class="au ${u.team?'bl':'rd'}${u.human?' me':''}" id="au${u.id}" data-id="${u.id}" aria-label="${u.name}" tabindex="0" role="button" style="left:${p.x-73}px;top:${p.y}px;z-index:${p.y}"><div class="au-in">
<div class="au-st"></div><div class="au-base"></div><div class="five-card-art">${cardFor(u)}</div>
<div class="au-hp"><i></i><b>${u.max}</b></div><div class="au-class" title="${BattleEngine.TRIBUTES[u.cls]}">${G.VisualShell?.icon(({ASSASSIN:'assassin',FIGHTER:'sword',MAGO:'moon',SUPPORT:'plus',DESTROYER:'target',TANK:'bolt'})[u.cls])||'◇'}</div>
<div class="au-own">${u.owner}</div></div></div>`}
function buildUnits(){$('#aunits').innerHTML=B.units.map(unitHTML).join('');els={};B.units.forEach(u=>els[u.id]=$('#au'+u.id))}
function buildBar(){const h=human;if(!h)return;const r=R0(h),k=B.skill(h);$('#askills').innerHTML=`<div class="ad ${k?'sk':'ps'}" data-i="0"><div class="dm"></div><span class="ic">✦</span><small>${k?'HABILIDADE':'PASSIVA'}</small></div><button class="ad tribute" id="class-info" aria-label="Ver tributo da classe"><div class="dm"></div><span class="ic">◇</span><small>CLASSE</small></button><button id="atransit" class="mbtn" hidden>Retaguarda</button><button id="amana" class="mbtn" hidden>Mana 0/3</button>`;$('#class-info').onclick=()=>inspect(h.ch,h);$('#atransit').onclick=()=>{if(pend?.u===h&&B.transit(h)){paintUnit(h);bar();tip(h.row==='rear'?'Na retaguarda: protegido de ataques básicos.':'Na linha de frente.');}};$('#amana').onclick=()=>{if(pend?.u===h){h.manaSpend=(h.manaSpend+1)%(h.mana+1);bar();}};}
function statusIcons(u){const s=[];if(u.st.pet!=null)s.push('🗿');if(u.st.slp)s.push('💤');if(u.st.burn&&u.st.burn.length)s.push('🔥');
 if(B.units.some(x=>x.alive&&x.team!==u.team&&x.st.mark===u.id))s.push('🎯');if(B.units.some(x=>x.team!==u.team&&x.st.fear&&x.st.fear[u.id]))s.push('😨');
 if(u.st.und!=null)s.push('Oni '+u.st.und+' ações');if(u.row==='rear')s.push('Retaguarda');if(u.st.starred)s.push('⭐');if(u.pw==='soul'&&u.st.souls)s.push('👻 '+u.st.souls);return s.join('')}
function paintUnit(u,hp){const e=els[u.id];if(!e)return;hp=hp==null?u.hp:hp;e.querySelector('.five-card-art').innerHTML=cardFor({...u,hp:Math.max(0,hp)});const r=Math.max(0,Math.min(1,hp/u.max)),b=e.querySelector('.au-hp');
 if(hp>0)e.classList.remove('dead');e.classList.toggle('is-fallen',hp<=0);b.firstElementChild.style.width=`calc((100% - 6px) * ${r})`;b.dataset.l=r>.5?'h':r>.25?'m':'l';b.lastElementChild.textContent=Math.round(Math.max(0,hp));e.classList.toggle('rear',u.row==='rear');e.querySelector('[data-value="hp"]')&&(e.querySelector('[data-value="hp"]').textContent=Math.max(0,hp));e.querySelector('.au-st').textContent=statusIcons(u)}
function paintAll(){B.units.forEach(u=>paintUnit(u));counters();bar()}
function counters(){[0,1].forEach(t=>$(t?'#aar':'#aal').textContent=B.alive(t).length+'/5');$('#asl').textContent=B.score[0];$('#asr').textContent=B.score[1]}
const portraitFor=u=>G.actorPortraitHTML(BattleEngine.character(u.ch),'five-portrait');
function paintQueue(c){const q=B.preview(c,6);$('#aturns').innerHTML=q.map((u,i)=>`<div class="aqw${i==0?' cur':''}"><b>${i==0?'VEZ':i==1?'PRÓXIMO':''}</b><div class="aq ${u.team?'bl':'rd'}"><div class="aqb"><img class="st" src="${ASSETS.star}">${portraitFor(u)}</div></div></div>`).reverse().join('')}
function paintActive(u){const r=R0(u);$('#aact').innerHTML=`<div class="five-active-portrait">${portraitFor(u)}</div><div class="nmk">${u.name}</div><div class="pwl">✦ ${r.k[0][0]}</div><div class="cl">◇ ${G.CLASS_LABEL[u.cls]||u.cls}</div><div class="lf"><i style="width:${u.hp/u.max*100}%"></i><b>${u.hp}<small> / ${u.max}</small></b></div><div class="df"><small>VEL</small> <b>${B.eff(u,'spd')}</b></div><div class="ak"><small>ATQ</small> <b>${u.pw==='claw'?'35%':B.eff(u,'atk')}</b></div>`;}
function bar(){const h=human;if(!h)return;$('#atransit').hidden=h.cls!=='SUPPORT';$('#atransit').disabled=pend?.u!==h;$('#atransit').textContent=h.row==='rear'?'Ir à frente':'Retaguarda';$('#amana').hidden=h.cls!=='MAGO'||h.base.atk<=0;$('#amana').disabled=pend?.u!==h;$('#amana').textContent='Mana '+h.manaSpend+'/'+h.mana;const mine=!!(h.alive&&pend&&pend.u===h),k=B.skill(h);
 const d=root.querySelector('#askills .ad[data-i="0"]');if(d){d.classList.toggle('off',!(k&&mine&&B.skillReady(h)));d.classList.toggle('sel',!!sel&&sel.type==='skill')}
 $('#aatk').classList.toggle('off',!(mine&&(h.base.atk>0||h.pw==='claw')&&B.targets(h).length));$('#aatk').style.display=(h.base.atk>0||h.pw==='claw')?'':'none';$('#aatk').classList.toggle('sel',!!sel&&sel.type==='attack');
 $('#apass').classList.toggle('off',!mine);const br=h.alive&&B.breakables(h).length>0;$('#aclr').style.display=br?'':'none';$('#aclr').classList.toggle('off',!(mine&&br));$('#aclr').classList.toggle('sel',!!sel&&sel.type==='break')}

/* ---------- efeitos visuais ---------- */
const anim=(el,kf,o)=>{if(reduced())return Promise.resolve();try{const animation=el.animate(kf,Object.assign({duration:300/spd,easing:'ease-out'},o));animations.add(animation);if(paused)animation.pause();return animation.finished.catch(()=>0).finally(()=>animations.delete(animation));}catch(e){return Promise.resolve()}};
function float(x,y,t,cls=''){for(const old of root.querySelectorAll('.aft'))if(Math.abs(Number(old.dataset.x)-x)<30&&Math.abs(Number(old.dataset.y)-y)<30)old.remove();const e=document.createElement('div');e.className='aft '+cls;e.dataset.x=x;e.dataset.y=y;e.textContent=t;e.style.left=x+'px';e.style.top=y+'px';$('#afx').appendChild(e);
 anim(e,[{transform:'translate(-50%,-50%) scale(.4)',opacity:0},{transform:'translate(-50%,-95%) scale(1.18)',opacity:1,offset:.18},{transform:'translate(-50%,-170%) scale(1)',opacity:1,offset:.72},{transform:'translate(-50%,-225%) scale(.9)',opacity:0}],{duration:1150/spd}).then(()=>e.remove())}
function spark(x,y,n=10,k=1){const C=['#ffe27a','#ff9ad5','#8fe6ff','#fff'];for(let i=0;i<n;i++){const e=document.createElement('i');e.className='ast';const s=(10+Math.random()*16)*k;e.style.cssText=`left:${x}px;top:${y}px;width:${s}px;height:${s}px;background:${C[i%4]}`;$('#afx').appendChild(e);
 const a=Math.random()*6.28,v=(70+Math.random()*150)*k;anim(e,[{transform:'translate(-50%,-50%) scale(.3) rotate(0)',opacity:1},{transform:`translate(${Math.cos(a)*v-s/2}px,${Math.sin(a)*v-s/2}px) scale(1) rotate(${(Math.random()-.5)*300}deg)`,opacity:1,offset:.55},{transform:`translate(${Math.cos(a)*v*1.2-s/2}px,${Math.sin(a)*v*1.2+30}px) scale(.2)`,opacity:0}],{duration:(520+Math.random()*260)/spd}).then(()=>e.remove())}}
async function banner(t,ms=1000,cls=''){const b=$('#abn');b.className=cls;b.textContent=t;anim(b,[{opacity:0,transform:'scale(2.4) rotate(-8deg)'},{opacity:1,transform:'scale(1) rotate(-3deg)',offset:.16},{opacity:1,transform:'scale(1.05) rotate(-3deg)',offset:.8},{opacity:0,transform:'scale(.9) translateY(-50px) rotate(-3deg)'}],{duration:ms/spd,fill:'forwards'});await sleep(ms)}
const inner=u=>els[u.id].firstElementChild;
function lunge(a,t){const trace=document.createElement('i'),ca=ctr(a),ct=ctr(t);trace.className='five-strike';trace.style.cssText='left:'+ca.x+'px;top:'+ca.y+'px;width:'+Math.hypot(ct.x-ca.x,ct.y-ca.y)+'px;rotate:'+Math.atan2(ct.y-ca.y,ct.x-ca.x)+'rad';$('#afx').append(trace);anim(trace,[{opacity:0,scale:'.2 1'},{opacity:.85,scale:'1 1',offset:.5},{opacity:0,scale:'1 0'}],{duration:560/spd}).then(()=>trace.remove());const A=els[a.id],pa=pos(a),pt=pos(t),dx=(pt.x-pa.x)*.6,dy=(pt.y-pa.y)*.6;A.style.zIndex=2000;
 return anim(inner(a),[{transform:'none'},{transform:`translate(${-dx*.1}px,${-dy*.1}px) scale(.95)`,offset:.2},{transform:`translate(${dx}px,${dy}px) scale(1.14)`,offset:.52},{transform:'none'}],{duration:520/spd}).then(()=>A.style.zIndex=pos(a).y)}
function hurt(t,crit){return anim(inner(t),[{transform:'none',filter:'none'},{transform:`translateX(${crit?-26:-14}px) rotate(${crit?-6:-3}deg)`,filter:'brightness(2.6) saturate(0)',offset:.25},{transform:'translateX(10px)',offset:.6},{transform:'none',filter:'none'}],{duration:(crit?460:340)/spd})}
function shake(k=1){anim(AR,[{transform:'none'},{transform:`translate(${9*k}px,${-6*k}px)`},{transform:`translate(${-8*k}px,${5*k}px)`},{transform:`translate(${5*k}px,${3*k}px)`},{transform:'none'}],{duration:320/spd})}

/* ---------- reprodução dos eventos do motor ---------- */
const STN={burn:'🔥 QUEIMANDO!',mark:'🎯 MARCADO!',star:'⭐ ESTRELA CELESTE!','spd+':'VEL +1',stun:'ATORDOADO!'};
async function play(evs,fast){for(const e of evs)await ev1(e,fast)}
async function ev1(e,fast){const u=B.units[e.u],c=u&&ctr(u),S=B.units[e.src];switch(e.t){
 case'act':{const a=u;if(e.k==='attack'){Aud.sfx('click');lunge(a,B.units[e.tg[0]]);await sleep(230)}
  else{const r=R0(a),nm=e.name||'ação';Aud.sfx('skill');float(c.x,c.y-60,`${r.k[0][1]} ${nm}${e.again?' x2':''}!`,'sk');spark(c.x,c.y,8,.9);
   anim(inner(a),[{transform:'none'},{transform:'scale(1.16) translateY(-10px)',filter:'brightness(1.6)'},{transform:'none'}],{duration:500/spd});await sleep(520)}break}
 case'dmg':{const t=u;tip((S?.name||'Efeito')+' → '+u.name+': −'+e.v+' de Vida');float(c.x,c.y,(e.dot?'🔥':e.rev?'🔥':'')+'-'+e.v,e.crit?'cr':e.dot?'bn':'');if(e.crit)float(c.x,c.y-70,'CRÍTICO!','cr2');
  Aud.sfx(e.crit?'crit':'hit');hurt(t,e.crit);spark(c.x,c.y,e.multi?4:e.crit?16:8,e.crit?1.2:.8);if(e.crit)shake(.6);paintUnit(t,e.hp);await sleep(e.multi?440:e.crit?850:650);break}
 case'heal':float(c.x,c.y,'+'+e.v,'hl');if(e.src==='skill')Aud.sfx('heal');spark(c.x,c.y,5,.7);paintUnit(u,e.hp);await sleep(fast?150:360);break;
 case'miss':float(c.x,c.y,e.k==='combo'?'COMBO QUEBRADO!':'ERROU!','mi');Aud.sfx('miss');await sleep(420);break;
 case'parry':float(c.x,c.y,'PARRY · d6 '+e.roll,'mi');Aud.sfx('miss');await sleep(420);break;
 case'dodge':float(c.x,c.y,'ESQUIVA · d6 '+e.roll,'mi');await anim(inner(u),[{transform:'none'},{transform:'translateX(45px)',offset:.45},{transform:'none'}],{duration:420/spd});break;
 case'block':float(c.x,c.y,'🛡️ BLOQUEADO!','mi');Aud.sfx('miss');await sleep(420);break;
 case'vital':float(c.x,c.y,'🗡️ PONTO VITAL!','cr');shake(1.6);Aud.sfx('crit');await sleep(500);break;
 case'execute':float(c.x,c.y,'☠️ EXECUTADO!','cr');shake(1.4);Aud.sfx('crit');spark(c.x,c.y,12,1.1);await sleep(560);break;
 case'book':float(c.x,c.y,'📓 O LIVRO O ELIMINOU!','cr');shake(1.4);await sleep(560);break;
 case'jump':float(c.x,c.y,'😱 JUMPSCARE!','cr');shake(1.6);Aud.sfx('crit');await sleep(560);break;
 case'dice':float(c.x,c.y-30,'🎲 '+e.v,'sp');await sleep(380);break;
 case'petrify':float(c.x,c.y,'🗿 PETRIFICADO!','sp');paintUnit(u);Aud.sfx('stun');await sleep(500);break;
 case'unpetrify':float(c.x,c.y,'✨ LIBERTADO!','hl');paintUnit(u);await sleep(420);break;
 case'petrified':float(c.x,c.y,'🗿 PRESO','sp');await sleep(520);break;
 case'sleep':float(c.x,c.y,'💤 DORMIU!','sp');paintUnit(u);Aud.sfx('stun');await sleep(450);break;
 case'asleep':float(c.x,c.y,'💤 Zzz...','sp');await sleep(520);break;
 case'wake':float(c.x,c.y,'😳 ACORDOU!','hl');paintUnit(u);await sleep(420);break;
 case'fear':float(c.x,c.y,'😨 MEDO!','sp');paintUnit(u);await sleep(fast?120:300);break;
 case'status':float(c.x,c.y,STN[e.k]||'!','sp');paintUnit(u);await sleep(fast?120:360);break;
 case'resist':float(c.x,c.y,'RESISTIU','mi');await sleep(300);break;
 case'immortal':float(c.x,c.y,'♾️ IMORTAL!','sp');paintUnit(u);await sleep(420);break;
 case'undying':float(c.x,c.y,'ONI · 4 AÇÕES','sp');paintUnit(u);await sleep(520);break;
 case'soul':float(c.x,c.y-40,'ALMAS '+e.n+' · +20 MÁX.','sp');paintUnit(u);await sleep(380);break;
 case'swap':float(c.x,c.y,e.auto?'🔄 SEGUNDA VERSÃO!':'🔄 PLAYER 2!','sp');paintUnit(u,e.hp);Aud.sfx('skill');await sleep(520);break;
 case'pass':float(c.x,c.y,'PASSOU','mi');await sleep(380);break;
 case'sup':{float(c.x,c.y-60,(SUPI[e.name]||'')+' '+e.name,'sp');const s=els[u.id].querySelector(`.au-sup [data-s="${e.name}"]`);s&&anim(s,[{transform:'scale(1)'},{transform:'scale(1.8)',background:'#ffc61a'},{transform:'scale(1)'}],{duration:500/spd});
  document.querySelectorAll(`#askills .sp[data-s="${e.name}"]`).forEach(d=>u.human&&anim(d,[{transform:'scale(1)'},{transform:'scale(1.25)',filter:'brightness(1.8)'},{transform:'scale(1)'}],{duration:500/spd}));await sleep(fast?110:420);break}
 case'die':Aud.sfx('die');spark(c.x,c.y,10,.8);paintUnit(u,0);await anim(inner(u),[{opacity:1,filter:'brightness(1.3)'},{opacity:0,filter:'grayscale(1)',translate:'0 -36px'}],{duration:520/spd});els[u.id].classList.add('dead');counters();await sleep(220);break}}

/* ---------- entrada do jogador ---------- */
const tip=t=>$('#atip').textContent=t;
function targetsFor(a){const h=pend.u;
 if(a.type==='attack')return B.targets(h);
 if(a.type==='break')return B.breakables(h);
 if(a.type==='skill'){const k=B.skill(h);if(k.tg==='enemy')return B.abilityTargets(h);if(k.tg==='ally')return B.alive(h.team).filter(x=>h.pw==='star'||x!==h&&x.hp<x.max)}
 return[]}
function mark(list){B.units.forEach(u=>{const e=els[u.id];if(!e)return;const target=!!list&&list.includes(u);e.classList.toggle('tgt',target);e.setAttribute('role','button');e.setAttribute('tabindex',target?'0':'-1');e.setAttribute('aria-label',u.name+' · '+u.hp+' de Vida');})}
function humanInput(u){return new Promise(res=>{const inputId=++inputSerial;pend={u,res};sel=null;bar();tip('Sua vez! Escolha uma ação.');
 const s=B.o.TURN_SEC/spd;$('#atbar').style.setProperty('--d',s+'s');$('#atbar').classList.remove('on');void $('#atbar').offsetWidth;$('#atbar').classList.add('on');
 clearTimeout(tt);sleep(B.o.TURN_SEC*1000,()=>inputSerial===inputId).then(()=>{if(pend&&pend.u===u&&inputSerial===inputId){const p=B.ai(u);commit(p.a,p.tid)}}).catch(()=>{})})}
function commit(a,tid){if(!pend||paused)return;inputSerial++;const p=pend;pend=null;sel=null;clearTimeout(tt);$('#atbar').classList.remove('on');mark(null);tip('');bar();p.res({a,tid})}
function choose(a){if(!pend||paused)return;const u=pend.u;
 if(a.type==='skill'&&B.skill(u).tg==='self'){commit(a,-1);return}
 const list=targetsFor(a);if(!list.length){tip('Sem alvos disponíveis.');return}
 if(sel&&sel.type===a.type){sel=null;mark(null);tip('Sua vez! Escolha uma ação.');bar();return}
 sel=a;mark(list);const k=a.type==='skill'?B.skill(u):null;tip(a.type==='attack'?'Toque em um inimigo para atacar.':a.type==='break'?'Toque no aliado petrificado para tentar libertá-lo.':`${k.n}: toque no alvo.`);bar()}
$('#aatk').onclick=()=>{Aud.sfx('click');choose({type:'attack'})};
$('#aclr').onclick=()=>{Aud.sfx('click');choose({type:'break'})};
$('#apass').onclick=()=>{Aud.sfx('click');pend&&commit({type:'pass'},-1)};
$('#askills').onclick=e=>{const d=e.target.closest('.sk');if(!d||!pend||!human)return;if(!B.skillReady(human)){tip('Poder indisponível agora.');Aud.sfx('ban');return}Aud.sfx('click');choose({type:'skill'})};
$('#askills').onpointerover=e=>{const d=e.target.closest('.ad');if(!d||!human)return;if(d.dataset.s)tip(`${SUPI[d.dataset.s]} ${d.dataset.s}: ${SUPD[d.dataset.s]}`);else{const k=R0(human).k[0];tip(`${k[1]} ${k[0]} (${k[3]}): ${k[2]}`)}};
$('#askills').onpointerout=()=>{if(!pend)tip('')};
$('#aunits').onclick=e=>{const c=e.target.closest('.au.tgt');if(c&&sel&&pend){Aud.sfx('pick');commit(sel,+c.dataset.id)}else{const unit=e.target.closest('.au');if(unit)inspect(B.units[+unit.dataset.id].ch,B.units[+unit.dataset.id]);}};
$('#aauto').onclick=()=>{auto^=1;$('#aauto').classList.toggle('act',!!auto);Aud.sfx('click');if(auto&&pend){const p=B.ai(pend.u);commit(p.a,p.tid)}};
$('#aspd').onclick=()=>{const rates=[.65,1,1.5];spd=rates[(rates.indexOf(spd)+1)%rates.length];$('#aspd').textContent=spd===.65?'Calmo':spd===1?'Normal':'Rápido';Aud.sfx('click')};
$('#aexit').onclick=()=>{Aud.sfx('click');close()};

/* ---------- fluxo: partida → rodadas → turnos ---------- */
async function turn(u){cur=u;tip('Vez de '+u.name+' · '+u.owner);els[u.id].classList.add('cur');paintQueue(u);paintActive(u);
 const b=B.beginTurn(u);await play(b.ev);paintActive(u);
 if(!b.skip&&u.alive){let free=true;for(let choice=0;choice<4&&free&&u.alive;choice++){let pick;
  if(u.human&&!auto)pick=await humanInput(u);else{await sleep(1100);pick=B.ai(u);}
  const events=B.act(u,pick.a,pick.tid);await play(events);free=events.free===true;if(free){paintActive(u);bar();tip('Habilidade aplicada · sua ação de ataque continua disponível.');}
 }}
 B.endTurn(u);await play(B.takeLate());paintUnit(u);paintActive(u);bar();els[u.id].classList.remove('cur');counters();
 const w=B.check();if(w!=null)return{w,kind:'wipe'};
 if(B.timeLeft<=0||B.cycle>B.o.MAX_CYCLES)return{w:B.byTime(),kind:'time'};return null}
async function runMatch(id){
 while(!B.over){
  const ev=B.startRound();paintAll();$('#arnd').textContent=B.round+'° Rodada';tick();roundOn=0;
  Aud.sfx('round');tip('Rodada '+B.round+' · nova formação, Vida restaurada.');await banner('RODADA '+B.round,1600);await play(ev.filter(e=>e.t==='sup'||e.t==='fear'||e.t==='status'),1);await banner('BATALHA!',900,'fg');
  roundOn=1;let r=null;for(;;){const u=B.next();if(!u){r={w:B.byTime(),kind:'time'};break}r=await turn(u);if(r)break}
  roundOn=0;cur&&els[cur.id]&&els[cur.id].classList.remove('cur');const res=B.finishRound(r.w,r.kind);counters();Aud.sfx('round');
  await banner(r.kind==='time'?'TEMPO ESGOTADO!':'ROUND VENCIDO!',900,r.w?'bl':'rd');
  await banner(`${B.names[r.w]} +1`,1000,r.w?'bl':'rd');
  const sc=$(r.w?'#asr':'#asl');anim(sc,[{transform:'scale(1)'},{transform:'scale(1.8)'},{transform:'scale(1)'}],{duration:500/spd});spark(r.w?1120:800,90,18,1.2);await sleep(700);
  if(res.done)break;await sleep(250)}
 await matchEnd()}
async function matchEnd(){const w=B.winner,ht=human?human.team:0,win=w===ht;const reward=G.Sanctuary?.awardMatch(matchToken,win?'victory':'defeat');G.Soundtrack?.setContext(win?'victory':'defeat');if(win&&G.VictoryPresenter){await G.VictoryPresenter.open({coins:reward?.coins||0,onChoice:choice=>{if(choice==='play')begin();else close();}});return;}Aud.sfx(win?'win':'lose');
 const mvp=B.units.slice().sort((a,b)=>b.stat.dmg-a.stat.dmg)[0];
 $('#aend').innerHTML=`<h1 class="${win?'w':'l'}">${win?'VITÓRIA!':'DERROTA'}</h1><div class="sc2"><b class="rd">${B.score[0]}</b><span>x</span><b class="bl">${B.score[1]}</b></div><p>${B.names[w]} chegou a ${B.o.WIN} pontos em ${B.round} rodadas.</p>
 <div class="mv"><img src="${faceOf(mvp)}"><div>MVP<br><b>${mvp.name}</b> <small>${mvp.owner}</small><br><small>${mvp.stat.dmg} de dano · ${mvp.stat.kills} abates · ${mvp.stat.heal} de cura</small></div></div>
 <div class="bt"><div id="areb" class="mbtn">Revanche</div><div id="amen" class="mbtn">Voltar ao menu</div></div>`;
 $('#aend').classList.add('on');spark(960,300,30,1.6);
 $('#areb').onclick=()=>{Aud.sfx('click');begin()};$('#amen').onclick=()=>{Aud.sfx('click');close()}}
function tick(){const s=Math.ceil(Math.max(0,B.timeLeft));$('#atm').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0');$('#atm').classList.toggle('lo',s<=10&&roundOn)}
setInterval(()=>{if(!on||!B||!roundOn||paused||document.hidden||pend)return;B.timeLeft=Math.max(0,B.timeLeft-.1*spd);tick();if(B.timeLeft<=0&&pend)commit({type:'pass'},-1)},100);

/* ---------- entrada / saída ---------- */
function begin(){runId++;pend=null;sel=null;clearTimeout(tt);$('#aend').classList.remove('on');$('#afx').innerHTML='';
 B=new E.Battle(res0,options.rules||{});matchToken=G.Sanctuary?.newMatchToken();G.Soundtrack?.setContext('combat');human=B.units.find(u=>u.human)||null;buildUnits();buildBar();
 $('#ant0').textContent=B.names[0];$('#ant1').textContent=B.names[1];$('#atm').textContent='3:00';$('#atip').textContent='';paintAll();const first=B.order()[0];if(first){paintQueue(first);paintActive(first);}
 on=1;AR.classList.add('on');const id=runId;runMatch(id).catch(e=>{if(e!==0)console.error(e)})}
function start(res){res0=res;try{Draft.exit()}catch(e){}$('#abg').src='assets/visual-v0.27/backgrounds/crystal-valley.png';begin()}
function demo(){const ch=shuf(RO().length),mk=(t,n)=>({name:t?'BLUE TEAM':'RED TEAM',players:n.map((nm,j)=>({name:nm,human:!t&&!j,char:RO()[ch[t*5+j]].n,charId:ch[t*5+j],support:[]}))});
 Aud.init&&Aud.init();start({bans:[[],[]],teams:[mk(0,['Jogador','Bot1','Bot2','Bot3','Bot4']),mk(1,['Bot5','Bot6','Bot7','Bot8','Bot9'])]})}
function exit(){on=0;runId++;pend=null;clearTimeout(tt);AR.classList.remove('on');$('#aend').classList.remove('on');roundOn=0}

Menu.on('battle',r=>{setTimeout(()=>{if(!on&&!closed)start(r)},1200)});

return{start,demo,exit,get battle(){return B},get pending(){return pend},get speed(){return spd},relayout:()=>{if(B)for(const u of B.units){const p=pos(u),e=els[u.id];if(e){e.style.left=(p.x-73)+'px';e.style.top=p.y+'px';e.style.zIndex=p.y;}}},E}})();


 const accessible=()=>root.querySelectorAll('.mbtn,.cd:not(.ph),.chip,.sk,#aatk,.au.tgt').forEach(el=>{el.setAttribute('role','button');el.setAttribute('tabindex',el.classList.contains('off')?'-1':'0');el.setAttribute('aria-disabled',String(el.classList.contains('off')));});
 const observer=new MutationObserver(accessible);observer.observe(root,{childList:true,subtree:true});accessible();
 root.addEventListener('keydown',event=>{if(event.key==='Tab'){const items=[...root.querySelectorAll('button,[tabindex="0"]')].filter(e=>e.getClientRects().length&&!e.closest('.off'));const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}if((event.key==='Enter'||event.key===' ')&&event.target.matches('[role="button"]')){event.preventDefault();if(event.target.getAttribute('aria-disabled')!=='true')event.target.click();}});
 $('.five-pause').onclick=()=>{if(!Arena.battle)return;paused=!paused;for(const animation of animations)animation[paused?'pause':'play']();$('.five-pause').textContent=paused?'Continuar':'Pausar';root.classList.toggle('five-paused',paused);G.Soundtrack?.setContext(Arena.battle?'combat':'menu',{paused});};
 const preferences=()=>root.classList.toggle('reduced',reduced());
 const visibility=()=>{root.classList.toggle('five-hidden',document.hidden);for(const animation of animations)animation[document.hidden||paused?'pause':'play']();};
 globalThis.addEventListener('goghos:presentation-preferences',preferences);document.addEventListener('visibilitychange',visibility);globalThis.addEventListener('resize',fit);fit();$('#aspd').textContent='Calmo';
 active={close,root,Draft,Arena,get paused(){return paused}};
 root.classList.toggle('reduced',reduced());if(options.match)Arena.start(options.match);else if(options.demo)Arena.demo();else Draft.start();return true;
}
G.ArenaFive=Object.freeze({open,close:()=>active?.close(),getDebugState:()=>({active:!!active,paused:!!active?.paused,phase:active?.Arena.battle?'battle':active?.Draft.state.mode||'closed',draft:active?.Draft.state,battle:active?.Arena.battle,speed:active?.Arena.speed}),demo:()=>open({demo:true})});
})(globalThis.GOGHOS);
