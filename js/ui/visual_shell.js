// Cenário, abertura e preferências de apresentação. Não participa das regras da partida.
(function(G){
const A='assets/visual-v0.27/',safe=s=>G.escapeUI?G.escapeUI(s):String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={play:'M8 5l11 7-11 7Z',cards:'M7 3h12v16H7zM4 6v15h12',chest:'M3 9h18v11H3zM3 9l3-5h12l3 5M10 9v5h4V9',book:'M12 5C8 2 4 3 3 4v15c3-2 6-2 9 0 3-2 6-2 9 0V4c-3-2-6-2-9 1zm0 0v14',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8m0-6v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2',sound:'M4 9h4l5-4v14l-5-4H4zm12-2c4 3 4 7 0 10m3-13c6 5 6 11 0 16',mute:'M4 9h4l5-4v14l-5-4H4zm12 0 5 6m0-6-5 6',back:'M19 12H5m7-7-7 7 7 7',sword:'m4 20 3-3m0-4 4 4M8 14 18 3l3 0 0 3-11 10',pause:'M8 5v14m8-14v14',move:'M3 7h16l-4-4m4 4-4 4M21 17H5l4-4m-4 4 4 4',star:'m12 2 3 6 7 1-5 5 1 7-6-3-6 3 1-7-5-5 7-1Z',eye:'M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12m10-3a3 3 0 1 0 0 6 3 3 0 0 0 0-6',heart:'M12 20S2 14 2 8c0-5 7-6 10-1 3-5 10-4 10 1 0 6-10 12-10 12',bolt:'m14 2-9 12h7l-2 8 9-12h-7Z',moon:'M20 15A9 9 0 0 1 9 4 9 9 0 1 0 20 15',target:'M12 2v4m0 12v4M2 12h4m12 0h4m-10-5a5 5 0 1 0 0 10 5 5 0 0 0 0-10',plus:'M12 4v16M4 12h16'};
paths.check='M5 12l4 4L19 6';
paths.assassin='M3 5l6 10M9 5 3 15M15 5l6 10M21 5l-6 10M7 20q5 3 10 0';
const icon=name=>`<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[name]||paths.star}"/></svg>`;
const actionIcons={play:'play',characters:'cards',menu:'back',settings:'settings','sound-toggle':'sound','card-info':'eye',pause:'pause',attack:'sword',move:'move',fight:'sword',redeem:'cards',summon:'star','close-drawer':'back','new-abilities':'sword','support-test':'cards','divine-test':'star','sark-test':'eye','ability-test':'bolt','sanctuary-open':'chest','sanctuary-lore':'book','mode-normal':'sword','mode-double':'sword','mode-heal':'heart','mode-area':'bolt','mode-stun':'bolt','full-heal':'heart'};
const T='assets/visual-v0.28/',BRAND='GOGHOS — Without Mercy';
const artIcon=name=>`<img class="toon-icon" src="${T}icons/${name}.svg" alt="" aria-hidden="true">`;
let overlay=null,preloadToken=0,previousFocus=null,introTimers=new Set();
const boundMenus=new WeakSet();
const introLater=(fn,ms)=>{const id=setTimeout(()=>{introTimers.delete(id);fn();},ms);introTimers.add(id);return id;};
function mount(){
 if(typeof document==='undefined'||overlay)return;
 const home=document.querySelector?.('.toon-home');if(!home)return;
 G.CartoonMotion?.attach(home.querySelector('.toon-backdrop'));
 if(boundMenus.has(home))return;boundMenus.add(home);
 let hovered=null;
 home.addEventListener('pointerover',e=>{const b=e.target.closest?.('.toon-button');if(b&&b!==hovered){hovered=b;G.PresentationFX?.interaction('hover');}});
 home.addEventListener('pointerdown',e=>{const b=e.target.closest?.('button');if(b)G.CartoonMotion?.burst(b);});
}

const prefs=()=>G.PresentationFX?.getPreferences()||{muted:true,volume:.38,motion:'auto'};
function settingsHTML(){const p=prefs();return `<section class="settings-content"><div class="settings-heading">${artIcon('settings')}<span><small>À sua maneira</small><h2>Som e movimento</h2></span></div><p>O ritmo é seu. Ajuste a apresentação sem alterar a batalha.</p><div class="setting-row"><span><b>Efeitos sonoros</b><small>Golpes, dados, cartas e interações</small></span><button data-act="fx-toggle-sound" aria-pressed="${!p.muted}">${icon(p.muted?'mute':'sound')}${p.muted?'Ativar som':'Som ligado'}</button></div><div class="setting-row"><span><b>Volume</b><small>${Math.round(p.volume*100)}%</small></span><div class="volume-controls"><button data-act="fx-volume-down" aria-label="Diminuir volume">−</button><span class="volume-meter" style="--volume:${p.volume*100}%" aria-hidden="true"></span><button data-act="fx-volume-up" aria-label="Aumentar volume">+</button></div></div><div class="setting-row motion-setting"><span><b>Animações</b><small>Movimento reduzido preserva todos os resultados.</small></span><div class="settings-options">${[['auto','Do dispositivo'],['full','Completas'],['reduced','Reduzidas']].map(([v,l])=>`<button data-act="fx-motion-${v}" aria-pressed="${p.motion===v}">${l}</button>`).join('')}</div></div><p class="settings-footnote">Preferências salvas neste navegador.</p></section>`;}
function handleSetting(action){const p=prefs();if(action==='fx-toggle-sound')G.PresentationFX?.setPreferences({muted:!p.muted});else if(action==='fx-volume-down'||action==='fx-volume-up')G.PresentationFX?.setPreferences({volume:Math.max(0,Math.min(1,p.volume+(action.endsWith('up')?0.1:-0.1)))});else if(action.startsWith('fx-motion-'))G.PresentationFX?.setPreferences({motion:action.slice(10)});else return false;return true;}
function closeIntro(){
 preloadToken++;for(const id of introTimers)clearTimeout(id);introTimers.clear();
 if(!overlay)return;
 try{localStorage.setItem('goghos-intro-v028','seen');}catch{}
 G.CartoonMotion?.detach();overlay.remove();overlay=null;mount();
 (previousFocus?.isConnected&&previousFocus!==document.body?previousFocus:document.querySelector('[data-act="play"]'))?.focus?.({preventScroll:true});
 G.PresentationFX?.interaction('confirm');
}
function boot(force=false){
 if(typeof document==='undefined'||!document.body||typeof Image==='undefined')return;
 try{if(!force&&localStorage.getItem('goghos-intro-v028')==='seen')return;}catch{}
 closeIntro();previousFocus=document.activeElement;const token=++preloadToken;
 overlay=document.createElement('div');overlay.className='world-intro toon-intro';overlay.setAttribute('role','dialog');overlay.setAttribute('aria-modal','true');overlay.setAttribute('aria-label','Abertura de GOGHOS Without Mercy');
 overlay.innerHTML=`<div class="toon-backdrop" aria-hidden="true"></div><button class="intro-skip" data-act="shell-skip">${artIcon('back')}Pular abertura</button><div class="toon-intro-streaks" aria-hidden="true"></div><div class="toon-intro-ring" aria-hidden="true"></div><div class="toon-intro-impact" aria-hidden="true"></div><div class="toon-intro-content"><span class="toon-intro-eyebrow">O portal está aberto</span><div class="toon-intro-logo"><img src="${T}logo-without-mercy.webp" alt="${BRAND}"><i class="toon-logo-glint" aria-hidden="true"></i><img src="${T}beta.webp" class="toon-beta" alt="Beta"></div><p>Reúna seus campeões. Proteja sua Daly Mãe.</p><div class="intro-loading" role="status"><span>Preparando a arena…</span><progress max="4" value="0" aria-label="Artes essenciais carregadas"></progress></div><button data-act="shell-enter" class="intro-enter" hidden>${artIcon('play')}Entrar no jogo</button></div>`;
 document.body.append(overlay);G.CartoonMotion?.attach(overlay.querySelector('.toon-backdrop'),{intro:true});
 overlay.querySelector('[data-act="shell-skip"]').focus();
 overlay.addEventListener('click',e=>{if(e.target.closest('[data-act="shell-skip"],[data-act="shell-enter"]'))closeIntro();});
 overlay.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeIntro();}if(e.key==='Tab'){const bs=Array.from(overlay.querySelectorAll('button')).filter(b=>!b.hidden),first=bs[0],last=bs.at(-1);if(e.shiftKey&&e.target===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&e.target===last){e.preventDefault();first.focus();}}});
 const sources=[T+'logo-without-mercy.webp',T+'beta.webp',T+'icons/play.svg',T+'icons/store.svg'];let done=0,loaded=false,settled=false;
 const ready=()=>{if(token!==preloadToken||!overlay||!loaded||!settled)return;overlay.classList.add('is-ready');overlay.querySelector('.intro-loading').hidden=true;overlay.querySelector('.intro-enter').hidden=false;};
 const jobs=sources.map(src=>new Promise(resolve=>{const im=new Image();let finished=false;const finish=()=>{if(finished)return;finished=true;if(token===preloadToken&&overlay)overlay.querySelector('progress').value=++done;resolve();};im.onload=finish;im.onerror=finish;im.src=src;}));
 Promise.all(jobs).then(()=>{loaded=true;ready();});
 introLater(()=>{if(token===preloadToken&&overlay)G.PresentationFX?.interaction('open');},500);
 introLater(()=>{settled=true;ready();},prefs().reducedMotion?0:1600);
 introLater(()=>{loaded=settled=true;ready();},4500);
}
// A escolha organiza os acessos existentes; não cria regras ou recompensas novas.
const MODES=Object.freeze([
 {id:'arena',name:'Arena',tag:'Você × Bot',icon:'sword',scene:'red-tree-field',description:'Escolha seus Comuns. Proteja a Daly Mãe.',detail:'Partida completa · seleção alternada de personagens',action:'play'},
 {id:'champions',name:'Treino de campeões',tag:'Laboratório',icon:'target',scene:'crystal-valley',description:'Conheça cada habilidade no campo.',detail:'Escolha um personagem oficial e experimente sua habilidade',action:'new-abilities'},
 {id:'support',name:'Mesa de Apoios',tag:'Laboratório',icon:'cards',scene:'cosmic-rift',description:'Uma boa carta muda a sua jogada.',detail:'Experimente as cartas de Apoio já disponíveis',action:'support-test'},
 {id:'divine',name:'Invocação primordial',tag:'Laboratório',icon:'star',scene:'cosmic-rift',description:'Teste a presença de Zeenneriam.',detail:'Um campo de treino dedicado à invocação',action:'divine-test'}
]);
let selectedMode='arena';
const getMode=()=>MODES.find(m=>m.id===selectedMode)||MODES[0];
function selectMode(id){if(!MODES.some(m=>m.id===id))return false;selectedMode=id;return true;}
const modeArt=m=>{const path=A+'backgrounds/'+m.scene+'.png',url=typeof document!=='undefined'&&document.baseURI?new URL(path,document.baseURI).href:path;return `style="--mode-scene:url('${safe(url)}')"`;};
function modesHTML(){return `<section class="mode-screen"><header class="mode-header"><button data-act="menu" class="mode-back">${artIcon('back')}Voltar</button><div><span class="eyebrow">Encontre sua próxima jogada</span><h1>Como vamos jogar?</h1></div><img src="${T}logo-without-mercy.webp" alt="${BRAND}"></header><div class="mode-grid" aria-label="Modos disponíveis">${MODES.map(m=>`<button class="mode-tile mode-tile-${m.id}${selectedMode===m.id?' is-selected':''}" data-act="mode-select-${m.id}" aria-pressed="${selectedMode===m.id}" ${modeArt(m)}><span class="mode-tile-art" aria-hidden="true">${m.id==='arena'?'<img src="assets/arena/daly_mae.png" alt="">':m.id==='champions'?'<img src="'+A+'characters/linx.png" alt="">':m.id==='support'?'<img src="'+A+'ui/framed-card-back.png" alt="">':'<img src="'+T+'ornaments/energy-flame.svg" alt="">'}</span><span class="mode-tile-label"><small>${m.tag}</small><strong>${m.name}</strong><span>${m.detail}</span></span><span class="mode-tile-check">${icon(selectedMode===m.id?'check':'play')}${selectedMode===m.id?'Selecionado':'Selecionar'}</span></button>`).join('')}</div><p class="mode-footnote">A Arena é a partida completa. Os laboratórios servem para testar e não concedem moedas.</p></section>`;}
function menuButton(action,label,picture,color,index,small=''){
 return `<button class="toon-button toon-button-${color}" data-act="${action}" style="--menu-index:${index}"><span class="toon-button-shadow" aria-hidden="true"></span><span class="toon-button-face">${artIcon(picture)}<span class="toon-button-copy"><strong>${label}</strong>${small?'<small>'+small+'</small>':''}</span><span class="toon-button-arrow" aria-hidden="true">${icon('play')}</span></span></button>`;
}
const homeHTML=()=>{const m=getMode(),state=G.Sanctuary?.read(),title=G.Sanctuary?.cosmetics.find(c=>c.id===state?.equipped.title)?.name||'Vigilante';return `<section class="home toon-home"><div class="toon-backdrop" aria-hidden="true"></div><header class="toon-topbar"><button class="toon-profile" data-act="sanctuary-collection" aria-label="Meus visuais e perfil">${artIcon('heart')}<span><small>Seu santuário</small><b>${safe(title)}</b></span></button><div class="toon-resources">${G.Sanctuary?.homeBadgeHTML()||''}</div></header><main class="toon-main"><div class="toon-brand"><div class="toon-brand-logo"><img src="${T}logo-without-mercy.webp" alt="${BRAND}" class="toon-logo"><i class="toon-logo-glint" aria-hidden="true"></i><img src="${T}beta.webp" class="toon-beta" alt="Beta"></div><p>Monte sua equipe. Proteja sua Daly Mãe.</p><button class="toon-feature" data-act="sanctuary-lore-sam"><img src="assets/visual-v0.27/characters/sam.png" alt=""><span><small>Conheça os campeões</small><b>Comece pelo Sam</b></span>${icon('back')}</button></div><div class="toon-menu-wrap"><button data-act="mode-open" class="toon-mode" ${modeArt(m)} aria-label="Escolher modo. Atual: ${m.name}">${artIcon('mode')}<span><small>${m.tag}</small><strong>${m.name}</strong></span>${icon('back')}</button><nav class="toon-menu" aria-label="Menu principal">${menuButton('play','Jogar','play','sun',0,m.id==='arena'?'Montar equipe':'Abrir laboratório')}${menuButton('characters','Personagens','cards','pink',1)}${menuButton('sanctuary-open','Loja','store','cyan',2)}${menuButton('sanctuary-collection','Coleção','star','mint',3)}${menuButton('sanctuary-lore','Crônicas','book','peach',4)}${menuButton('settings','Configurações','settings','violet',5)}</nav></div></main><footer class="toon-footer"><button data-act="shell-intro">${artIcon('play')}Rever abertura</button><details class="training-menu"><summary>Atalhos de treino <span>+</span></summary><div class="training-grid"><button data-act="new-abilities">${icon('sword')}Personagens</button><button data-act="support-test">${icon('cards')}Cartas de Apoio</button><button data-act="divine-test">${icon('star')}Zeenneriam</button><button data-act="sark-test">Sark</button><button data-act="ability-test">Elétrica e John</button></div></details><small>v${G.CONFIG.version} · Beta</small></footer></section>`;};
G.VisualShell={icon,artIcon,brand:BRAND,mount,actionIcon:act=>actionIcons[act]?icon(actionIcons[act]):'',settingsHTML,handleSetting,homeHTML,getMode,selectMode,modesHTML,boot,closeIntro,prefs};
})(globalThis.GOGHOS);
