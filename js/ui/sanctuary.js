// Santuário local: moedas e visuais de perfil. Não lê nem altera estado de combate.
(function(G){
'use strict';
const KEY='goghos.sanctuary.v1',PRICE=90,MATCH_REWARD=50,START_COINS=180;
const COSMETICS=Object.freeze([
 {id:'frame-ink',kind:'frame',name:'Tinta da noite',color:'#c7b7ed',base:true,glyph:'✦',desc:'Um traço de tinta entre as estrelas.'},
 {id:'frame-moon',kind:'frame',name:'Prata lunar',color:'#a4e8ff',glyph:'☾',desc:'O brilho frio de uma lua distante.'},
 {id:'frame-scarlet',kind:'frame',name:'Marca rubra',color:'#ff8caa',glyph:'✧',desc:'Uma assinatura que a noite reconhece.'},
 {id:'frame-prism',kind:'frame',name:'Luz prismática',color:'#f2d89a',glyph:'◈',desc:'Todas as cores cabem nesta pequena luz.'},
 {id:'mood-void',kind:'mood',name:'Fenda cósmica',color:'#b49cff',base:true,glyph:'◌',background:'cosmic-rift',desc:'Uma janela aberta para o impossível.'},
 {id:'mood-grove',kind:'mood',name:'Vale de cristal',color:'#8be2d0',glyph:'♧',background:'crystal-valley',desc:'Até o silêncio tem cor neste lugar.'},
 {id:'mood-ember',kind:'mood',name:'Árvore carmesim',color:'#ff9e9b',glyph:'❋',background:'red-tree-field',desc:'Folhas vermelhas sob um céu sem pressa.'},
 {id:'mood-aurora',kind:'mood',name:'Aurora arcana',color:'#96caff',glyph:'✺',background:'cosmic-rift',desc:'A noite também sabe amanhecer.'},
 {id:'title-watch',kind:'title',name:'Vigilante',color:'#c7b7ed',base:true,glyph:'◇',desc:'Há sempre mais uma história para descobrir.'},
 {id:'title-crystal',kind:'title',name:'Guardião de cristais',color:'#8be2d0',glyph:'◈',desc:'Uma luz pequena. Uma promessa enorme.'},
 {id:'title-star',kind:'title',name:'Dente de estrelas',color:'#f2d89a',glyph:'✦',desc:'Um sorriso que atravessa a escuridão.'},
 {id:'title-rift',kind:'title',name:'Além da fenda',color:'#ff8caa',glyph:'◌',desc:'O horizonte é só o começo.'}
].map(c=>Object.freeze(c)));
const byId=id=>COSMETICS.find(c=>c.id===id),baseIds=COSMETICS.filter(c=>c.base).map(c=>c.id);
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const clone=x=>JSON.parse(JSON.stringify(x));
// Variáveis de imagem são consumidas em css/: URLs absolutas também funcionam em file://.
function cssAsset(path){
 let src='../'+path;
 try{const base=globalThis.document?.baseURI||globalThis.location?.href;if(base&&typeof globalThis.URL==='function')src=new globalThis.URL(path,base).href;}catch{}
 return 'url('+JSON.stringify(src)+')';
}
let cached=null,volatile=false,nonce=0;
const ui={tab:'vault',chapter:0,loreId:null,reveal:null,notice:'',category:'all',detailId:null};
const bounded=(n,max=10000000)=>Number.isFinite(n)?Math.max(0,Math.min(max,Math.trunc(n))):0;
function defaults(){return{schema:1,coins:START_COINS,owned:[...baseIds],equipped:{frame:'frame-ink',mood:'mood-void',title:'title-watch'},issued:[],claimed:[],matches:0,opened:0};}
function normalize(raw){
 if(!raw||raw.schema!==1)return defaults();
 const s=defaults();s.coins=bounded(raw.coins);s.owned=[...new Set(baseIds.concat(Array.isArray(raw.owned)?raw.owned.filter(x=>byId(x)):[]))];
 for(const kind of ['frame','mood','title']){const id=raw.equipped?.[kind];if(s.owned.includes(id)&&byId(id)?.kind===kind)s.equipped[kind]=id;}
 for(const key of ['issued','claimed'])s[key]=[...new Set(Array.isArray(raw[key])?raw[key].filter(x=>typeof x==='string'&&x.length>0&&x.length<160):[])].slice(-128);
 s.matches=bounded(raw.matches);s.opened=bounded(raw.opened);return s;
}
function save(s){cached=clone(s);try{const store=globalThis.localStorage;if(!store){volatile=true;return;}store.setItem(KEY,JSON.stringify(s));}catch{volatile=true;}}
function read(){
 if(volatile)return clone(cached||defaults());
 try{const store=globalThis.localStorage;if(!store){volatile=true;cached??=defaults();return clone(cached);}const raw=store.getItem(KEY);cached=normalize(raw?JSON.parse(raw):null);if(!raw)save(cached);return clone(cached);}catch{volatile=true;cached??=defaults();return clone(cached);}
}
function transact(change){const s=read(),result=change(s);if(result.ok)save(s);return{...result,balance:s.coins};}
function newMatchToken(){
 const token=globalThis.crypto?.randomUUID?.()||'match-'+Date.now().toString(36)+'-'+(++nonce).toString(36)+'-'+Math.random().toString(36).slice(2);
 const s=read();s.issued.push(token);s.issued=s.issued.slice(-128);save(s);return token;
}
const formatCoins=n=>n>=1000000?(n/1000000).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mi':n>=10000?(n/1000).toLocaleString('pt-BR',{maximumFractionDigits:1})+' mil':n.toLocaleString('pt-BR');
const coinHTML=()=>'<img class="sanctuary-coin" src="assets/concepts/kikiy/36.png" alt="" decoding="async">';
function receipt(){return `<div class="sanctuary-match-reward">${coinHTML()}<div><strong>+${MATCH_REWARD} moedas</strong><span>Uma história a mais no seu santuário.</span></div><button data-act="sanctuary-vault">Ver baús <span aria-hidden="true">↗</span></button></div>`;}
function awardMatch(token,result){
 if(!['victory','defeat','draw'].includes(result))return{awarded:false,coins:0,balance:read().coins,html:''};
 const r=transact(s=>{if(s.claimed.includes(token))return{ok:false,already:true};if(typeof token!=='string'||!s.issued.includes(token))return{ok:false};s.issued=s.issued.filter(x=>x!==token);s.claimed.push(token);s.claimed=s.claimed.slice(-128);s.coins=bounded(s.coins+MATCH_REWARD);s.matches++;return{ok:true};});
 return{awarded:r.ok,already:!!r.already,coins:r.ok?MATCH_REWARD:0,balance:r.balance,html:r.ok||r.already?receipt():''};
}
function applyCosmetics(){
 const s=read(),mood=byId(s.equipped.mood),frame=byId(s.equipped.frame);try{const el=globalThis.document?.documentElement;if(el){el.dataset.goghosMood=mood.id;el.dataset.goghosFrame=frame.id;el.style.setProperty('--cosmetic-aura',mood.color);el.style.setProperty('--cosmetic-trim',frame.color);el.style.setProperty('--cosmetic-background',cssAsset('assets/visual-v0.27/backgrounds/'+mood.background+'.png'));}}catch{}return{mood:mood.id,frame:frame.id,title:byId(s.equipped.title).name};
}
function homeBadgeHTML(){const s=read();return `<div class="sanctuary-home-wallet"><span class="sanctuary-wallet-value" aria-label="${s.coins} moedas">${coinHTML()}<b>${formatCoins(s.coins)}</b><small>moedas</small></span><span class="sanctuary-profile-title">✦ ${safe(byId(s.equipped.title).name)}</span></div>`;}
const button=(act,label,cls='',disabled=false)=>`<button class="${cls}" data-act="sanctuary-${act}"${disabled?' disabled':''}>${label}</button>`;
const kindLabel={frame:'Moldura de perfil',mood:'Ambiente',title:'Título de perfil'};
function preview(c,large=false){
 const classes='sanctuary-cosmetic-preview '+c.kind+(large?' large':'');
 if(c.kind==='mood')return `<div class="${classes}" style="--item-color:${c.color};background-image:linear-gradient(0deg,#17102015,#17102015),url('assets/visual-v0.27/backgrounds/${c.background}.png')"><i aria-hidden="true">${c.glyph}</i></div>`;
 if(c.kind==='frame')return `<div class="${classes}" style="--item-color:${c.color}"><span><img src="assets/visual-v0.27/ui/ability-star.png" alt="" decoding="async"></span><i aria-hidden="true">${c.glyph}</i></div>`;
 return `<div class="${classes}" style="--item-color:${c.color}"><i aria-hidden="true">${c.glyph}</i><span>${safe(c.name)}</span></div>`;
}
function chestHTML(open=false){return `<div class="sanctuary-chest${open?' opened':''}" aria-hidden="true"><div class="sanctuary-chest-rays"></div><span class="chest-spark spark-one">✦</span><span class="chest-spark spark-two">✧</span><span class="chest-spark spark-three">✦</span><svg viewBox="0 0 360 300" role="presentation"><defs><linearGradient id="sanctuaryChestBody" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#55416d"/><stop offset="1" stop-color="#251b3d"/></linearGradient><linearGradient id="sanctuaryChestTrim" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff0b7"/><stop offset="1" stop-color="#d79096"/></linearGradient></defs><ellipse cx="180" cy="265" rx="115" ry="18" fill="#100c22" opacity=".5"/><g class="chest-lid"><path d="M62 147 73 102Q180 45 287 102L298 147 180 174Z" fill="url(#sanctuaryChestBody)" stroke="#100c22" stroke-width="10" stroke-linejoin="round"/><path d="M76 137 86 111Q180 68 274 111L284 137 180 162Z" fill="none" stroke="url(#sanctuaryChestTrim)" stroke-width="11" stroke-linejoin="round"/><path d="M122 95 116 151M239 95 245 151" stroke="#f6d4a9" stroke-width="11"/></g><path d="M63 147 180 174 297 147 285 235 180 263 75 235Z" fill="url(#sanctuaryChestBody)" stroke="#100c22" stroke-width="10" stroke-linejoin="round"/><path d="M77 160 88 224 180 249 272 224 283 160M180 179V247" fill="none" stroke="url(#sanctuaryChestTrim)" stroke-width="10" stroke-linejoin="round"/><path d="m180 157 15 27 30 6-22 22 4 31-27-15-27 15 4-31-22-22 30-6Z" fill="#f4c2b7" stroke="#100c22" stroke-width="8" stroke-linejoin="round"/><path d="m180 180 10 18-10 19-10-19Z" fill="#6e477f"/><path d="m93 173 8 11-8 14-8-14ZM267 173l8 11-8 14-8-14Z" fill="#9de5dc"/></svg></div>`;}
const shopKinds=[['mood','Ambientes','Mude o cenário. Mantenha sua história.'],['frame','Molduras','Seu perfil com um toque de magia.'],['title','Títulos','Uma assinatura para chamar de sua.']];
function categoryNav(){return `<nav class="shop-categories" aria-label="Categorias de visuais">${[['all','✦','Tudo'],['mood','◌','Ambientes'],['frame','◇','Molduras'],['title','☾','Títulos']].map(([id,glyph,label])=>`<button data-act="sanctuary-category-${id}" aria-pressed="${ui.category===id}"><i aria-hidden="true">${glyph}</i>${label}</button>`).join('')}</nav>`;}
function shopCard(c,s){
 const owned=s.owned.includes(c.id),active=s.equipped[c.kind]===c.id,selected=ui.detailId===c.id;
 return `<article class="shop-card${owned?' is-owned':' is-discovery'}${active?' is-equipped':''}${selected?' is-selected':''}" style="--shop-accent:${c.color}" data-cosmetic="${c.id}"><button class="shop-card-art" data-act="sanctuary-preview-${c.id}" aria-label="Conhecer ${safe(c.name)}" aria-expanded="${selected}"${selected?' aria-controls="shop-cosmetic-detail"':''}>${preview(c)}<span class="shop-item-state${active?' active':''}">${active?'✓ Em uso':owned?'Na coleção':'No baú'}</span><span class="shop-art-hint" aria-hidden="true"><svg viewBox="0 0 20 20"><path d="M5 15 15 5M6 5h9v9"/></svg></span></button><div class="shop-card-copy"><span class="shop-card-kind">${kindLabel[c.kind]}</span><h4>${safe(c.name)}</h4>${owned?button('equip-'+c.id,active?'Equipado':'Usar visual',active?'shop-equip is-equipped':'shop-equip',active):button('preview-'+c.id,'Conhecer <span aria-hidden="true">→</span>','shop-discover')}</div></article>`;
}
function shopDetail(c,s){
 const owned=s.owned.includes(c.id),active=s.equipped[c.kind]===c.id;
 return `<aside class="shop-detail" id="shop-cosmetic-detail" aria-label="Detalhes de ${safe(c.name)}" style="--shop-accent:${c.color}">${preview(c,true)}<div class="shop-detail-copy"><span class="sanctuary-eyebrow">${kindLabel[c.kind]} · ${owned?'Na sua coleção':'Disponível nos baús'}</span><h3>${safe(c.name)}</h3><p>${safe(c.desc)}</p>${owned?button('equip-'+c.id,active?'✓ Já está em uso':'Usar este visual',active?'shop-detail-equipped':'sanctuary-primary',active):`<p class="shop-detail-note">Um dos visuais que você pode descobrir no Baú da noite.</p>${button('featured','Ver o baú <span aria-hidden="true">→</span>','sanctuary-primary')}`}</div><button data-act="sanctuary-preview-close" class="shop-detail-close" aria-label="Fechar detalhes">×</button></aside>`;
}
function shopCatalog(s){
 return `${categoryNav()}${shopKinds.filter(([kind])=>ui.category==='all'||ui.category===kind).map(([kind,name,desc])=>{const items=COSMETICS.filter(c=>c.kind===kind),detail=items.find(c=>c.id===ui.detailId);return `<section class="shop-section" aria-labelledby="shop-section-${kind}"><div class="shop-section-heading"><div><h3 id="shop-section-${kind}">${name}</h3><p>${desc}</p></div><span>${items.filter(c=>s.owned.includes(c.id)).length} / ${items.length}<span class="sr-only"> na coleção</span></span></div>${detail?shopDetail(detail,s):''}<div class="shop-catalog-grid">${items.map(c=>shopCard(c,s)).join('')}</div></section>`;}).join('')}`;
}
function vault(s){
 if(ui.reveal){const c=ui.reveal.cosmetic;return `<div class="sanctuary-reveal" role="status" aria-live="polite"><div class="sanctuary-eyebrow">O baú guardava uma surpresa</div><h2>${ui.reveal.duplicate?'Uma lembrança conhecida':'Você encontrou!'}</h2>${ui.reveal.duplicate?`<div class="sanctuary-duplicate">${coinHTML()}<b>+30 moedas</b></div>`:preview(c,true)}<p class="sanctuary-reward-kind">${ui.reveal.duplicate?'Sua coleção já está completa':kindLabel[c.kind]}</p><h3>${ui.reveal.duplicate?'Uma noite de coleção completa':safe(c.name)}</h3><p>${ui.reveal.duplicate?'Os visuais repetidos se transformam em 30 moedas.':safe(c.desc)}</p><div class="sanctuary-reveal-actions">${ui.reveal.duplicate?'':button('equip-'+c.id,'Usar agora','sanctuary-primary')}${button('keep','Guardar e continuar',ui.reveal.duplicate?'sanctuary-primary':'')}</div></div>`;}
 const remaining=COSMETICS.filter(c=>!s.owned.includes(c.id)).length;
 return `<div class="shop-storefront">${ui.category==='all'?`<section class="shop-featured" aria-labelledby="shop-chest-title"><div class="shop-featured-copy"><span class="shop-featured-label"><i aria-hidden="true">✦</i> Descobertas do santuário</span><h2 id="shop-chest-title">Baú da noite</h2><p>Uma pequena surpresa.<br>Um novo jeito de brilhar.</p><div class="shop-featured-tags"><span>Molduras</span><span>Ambientes</span><span>Títulos</span></div>${button('open-chest',`<span>Abrir baú</span><span class="shop-button-price">${coinHTML()}<b>${PRICE}</b></span>`,'shop-chest-buy',s.coins<PRICE)}<small class="sanctuary-price-note">${s.coins<PRICE?'Cada partida concluída rende '+MATCH_REWARD+' moedas.':remaining?'Um visual novo enquanto houver peças para descobrir.':'Coleção completa: novos baús devolvem 30 moedas.'}</small></div><div class="shop-featured-art">${chestHTML()}<span class="shop-featured-seal">${remaining?'1 visual<br><b>para descobrir</b>':'+30 moedas<br><b>coleção completa</b>'}</span></div></section>`:''}${shopCatalog(s)}<div class="shop-store-note"><span aria-hidden="true">✧</span><p>Visuais para a sua coleção. Todos os personagens continuam disponíveis para jogar.</p><span>${coinHTML()} +${MATCH_REWARD} por partida concluída</span></div></div>`;
}
function collection(s){return `<div class="shop-storefront shop-collection"><div class="shop-collection-heading"><div><span class="sanctuary-eyebrow">Do seu jeito</span><h2>Seu pedaço da noite.</h2><p>Escolha os detalhes do seu perfil e da sua arena.</p></div><span class="shop-collection-total"><b>${s.owned.length}</b> / ${COSMETICS.length}<small>na coleção</small></span></div>${shopCatalog(s)}</div>`;}
const CHAPTERS=[
 {title:'Antes do primeiro golpe',hero:'sam',art:'sam',scene:'crystal-valley',text:'A arena ainda está quieta. Atrás dos guardiões, a Daly Mãe ilumina o chão. Uma carta toca a mesa, outra responde. E a noite prende a respiração.'},
 {title:'Do outro lado',hero:'penxy',scene:'cosmic-rift',text:'O mundo parece caber em uma pequena fresta. Penxy estende a mão. Do outro lado, a arena fica distante, e só duas sombras continuam na mesma história.'},
 {title:'O sorriso que espera',hero:'sarck',art:'sarck',scene:'cosmic-rift',text:'Sark não corre atrás do primeiro golpe. Ele espera. Há um sorriso entre a ameaça e a resposta; quem se aproxima precisa saber se consegue terminar o que começou.'},
 {title:'Antes do último soco',hero:'sam',art:'sam',scene:'red-tree-field',text:'Uma luva corta o ar. A segunda vem logo atrás. Sam acompanha o ritmo dos dados, como se cada número novo fosse uma batida que a noite ainda não ouviu.'},
 {title:'Uma estrela emprestada',hero:'unicorn',art:'unicorn',scene:'crystal-valley',text:'Nem toda luz nasce para ferir. Uma estrela muda de mãos e pousa perto de um aliado. Naquela pequena claridade, alguém encontra força para continuar.'},
 {title:'Três pedaços do impossível',hero:'zenneriam',scene:'cosmic-rift',text:'Separados, os fragmentos parecem apenas promessas. Juntos, fazem a arena silenciar. Um nome atravessa o brilho: Zeenneriam. O impossível acaba de chegar.'}
];
function roster(){return [...(G.CHARACTERS||[]),...(G.GODS||[])];}
function heroArt(c,art){return art?`<img class="sanctuary-story-illustration" src="assets/visual-v0.27/characters/${art}.png" alt="${safe(c?.name||'Personagem')}" decoding="async">`:c&&G.cardHTML?`<div class="sanctuary-story-card">${G.cardHTML(c)}</div>`:'<span class="sanctuary-story-symbol" aria-hidden="true">✦</span>';}
function story(){
 const chapter=CHAPTERS[ui.chapter],c=roster().find(c=>c.id===(ui.loreId||chapter.hero)),ability=c?G.getMainAbility?.(c):null;
 const copy=ui.loreId?{title:c?.name||'Ecos da arena',scene:'cosmic-rift',text:'Cada carta guarda uma forma diferente de enfrentar a noite. Conheça a habilidade de '+(c?.name||'quem está chegando')+' antes de colocá-la em campo.'}:chapter;
 return `<div class="sanctuary-story-heading"><div><span class="sanctuary-eyebrow">Crônicas do protótipo</span><h2>A noite tem suas histórias.</h2></div><p>Pequenas cenas criadas para esta versão, inspiradas nas cartas.</p></div><div class="sanctuary-story-scene" style="--story-background:${safe(cssAsset('assets/visual-v0.27/backgrounds/'+copy.scene+'.png'))}"><div class="sanctuary-story-figure">${heroArt(c,copy.art)}</div><article><span class="sanctuary-chapter-label">${ui.loreId?'Ecos da arena':'Fragmento '+(ui.chapter+1)+' / '+CHAPTERS.length}</span><h3>${safe(copy.title)}</h3><p>${safe(copy.text)}</p>${ui.loreId&&ability?`<div class="sanctuary-lore-ability"><strong>✦ ${safe(ability.name)}</strong><p>${safe(ability.description)}</p></div>`:''}<div class="sanctuary-story-controls">${ui.loreId?button('story-return','Voltar às crônicas'):button('story-prev','← Anterior','',ui.chapter===0)+button('story-next',ui.chapter===CHAPTERS.length-1?'Ler de novo ↺':'Próximo fragmento →','sanctuary-primary')}</div></article></div>${ui.loreId?'':`<nav class="sanctuary-chapter-dots" aria-label="Fragmentos das crônicas">${CHAPTERS.map((c,i)=>button('chapter-'+i,'<span class="sr-only">'+safe(c.title)+'</span><i aria-hidden="true">'+(i+1)+'</i>',i===ui.chapter?'selected':'')).join('')}</nav>`}<div class="sanctuary-roster"><h3>Ecos da arena</h3><p>Toque em um nome para conhecer sua habilidade atual.</p><div>${roster().map(c=>button('lore-'+c.id,safe(c.name),ui.loreId===c.id?'selected':'')).join('')}</div></div>`;
}
function render(tab){
 if(['vault','collection','story'].includes(tab))ui.tab=tab;
 const s=read();applyCosmetics();
 return `<section class="sanctuary shop-hub" data-shop-tab="${ui.tab}" aria-labelledby="sanctuary-title"><header class="sanctuary-header"><button data-act="menu" class="sanctuary-back"><span aria-hidden="true">←</span> Menu</button><div class="sanctuary-heading"><span class="sanctuary-eyebrow">Santuário da noite</span><h1 id="sanctuary-title">${ui.tab==='story'?'Crônicas':ui.tab==='collection'?'Meus visuais':'Loja da noite'}</h1></div><div class="sanctuary-wallet" aria-label="${s.coins} moedas disponíveis">${coinHTML()}<span><strong>${formatCoins(s.coins)}</strong><small>suas moedas</small></span></div></header><nav class="sanctuary-tabs" aria-label="Áreas do santuário">${[['vault','✦','Loja'],['collection','◇','Meus visuais'],['story','☾','Crônicas']].map(([id,icon,label])=>`<button data-act="sanctuary-${id}"${ui.tab===id?' aria-current="page"':''}><i aria-hidden="true">${icon}</i>${label}</button>`).join('')}</nav>${ui.notice?'<p class="sanctuary-notice" role="status">'+safe(ui.notice)+'</p>':''}<div class="sanctuary-content">${ui.tab==='vault'?vault(s):ui.tab==='collection'?collection(s):story()}</div><footer class="sanctuary-footer"><span>✦ ${safe(byId(s.equipped.title).name)}</span><span>${s.matches} partida${s.matches===1?'':'s'} concluída${s.matches===1?'':'s'} · ${s.opened} baú${s.opened===1?'':'s'} aberto${s.opened===1?'':'s'}</span>${volatile?'<span>Progresso desta sessão</span>':''}</footer></section>`;
}
function handle(action){
 if(typeof action!=='string'||!action.startsWith('sanctuary-'))return{handled:false};
 const a=action.slice(10);let ok=true,sound='navigate',reward=null;ui.notice='';
 if(['vault','collection','story'].includes(a))ui.tab=a;
 else if(a.startsWith('category-')){const category=a.slice(9);if(['all','mood','frame','title'].includes(category)){ui.category=category;ui.detailId=null;}else ok=false;}
 else if(a==='preview-close')ui.detailId=null;
 else if(a.startsWith('preview-')){const c=byId(a.slice(8));if(c){ui.detailId=c.id;if(ui.tab==='story')ui.tab='vault';ui.category=c.kind;}else ok=false;}
 else if(a==='featured'){ui.tab='vault';ui.category='all';ui.detailId=null;}
 else if(a==='open-chest'){
  if(ui.reveal){ok=false;ui.notice='Guarde sua descoberta antes de abrir outro baú.';}
  else{const r=transact(s=>{if(s.coins<PRICE)return{ok:false};const pool=COSMETICS.filter(c=>!s.owned.includes(c.id)),c=pool.length?pool[Math.min(pool.length-1,Math.floor(Math.random()*pool.length))]:null;s.coins-=PRICE;s.opened++;if(c)s.owned.push(c.id);else s.coins+=30;return{ok:true,cosmetic:c,duplicate:!c};});ok=r.ok;if(ok){ui.reveal={cosmetic:r.cosmetic,duplicate:r.duplicate};reward=r.cosmetic;ui.tab='vault';sound='chest';}else ui.notice='Você precisa de '+PRICE+' moedas. Cada partida concluída dá '+MATCH_REWARD+'.';}
 }else if(a.startsWith('equip-')){
  const id=a.slice(6),c=byId(id),r=transact(s=>{if(!c||!s.owned.includes(id))return{ok:false};s.equipped[c.kind]=id;return{ok:true};});ok=r.ok;if(ok){ui.notice=c.name+' está em uso.';ui.reveal=null;ui.tab='collection';sound='equip';applyCosmetics();}else ui.notice='Encontre este visual em um baú para usá-lo.';
 }else if(a==='keep'){ui.reveal=null;ui.notice='Descoberta guardada na sua coleção.';ui.tab='vault';sound='reward';}
 else if(a==='story-prev'){ui.chapter=Math.max(0,ui.chapter-1);ui.loreId=null;ui.tab='story';}
 else if(a==='story-next'){ui.chapter=(ui.chapter+1)%CHAPTERS.length;ui.loreId=null;ui.tab='story';}
 else if(a==='story-return'){ui.loreId=null;ui.tab='story';}
 else if(a.startsWith('chapter-')){const n=Number(a.slice(8));if(Number.isInteger(n)&&n>=0&&n<CHAPTERS.length){ui.chapter=n;ui.loreId=null;ui.tab='story';}else ok=false;}
 else if(a.startsWith('lore-')){const id=a.slice(5);if(roster().some(c=>c.id===id)){ui.loreId=id;ui.tab='story';}else ok=false;}
 else return{handled:false};
 return{handled:true,ok,html:render(),notice:ui.notice,reward,sound};
}
G.Sanctuary=Object.freeze({read,render,handle,newMatchToken,awardMatch,homeBadgeHTML,applyCosmetics,cosmetics:COSMETICS,price:PRICE,matchReward:MATCH_REWARD,storageKey:KEY});
})(globalThis.GOGHOS=globalThis.GOGHOS||{});
