// Carta = cor da raridade (atrás, só nos vazados) + arte (atrás) + moldura oficial intacta + textos/ícones.
// Coordenadas em pixels da imagem original (1536x2048), medidas sobre a carta de referência. Ajuste SÓ este arquivo.
(function(G){
const F={x:159,y:14,w:1218,h:2034,imgW:1536}; // área útil da moldura (sem margem transparente)
const X=x=>((x-F.x)/F.w*100).toFixed(2)+'%',Y=y=>((y-F.y)/F.h*100).toFixed(2)+'%';
const box=b=>`left:${X(b[0])};top:${Y(b[1])};width:${((b[2]-b[0])/F.w*100).toFixed(2)}%;height:${((b[3]-b[1])/F.h*100).toFixed(2)}%`;
const fs=n=>`font-size:${(n/F.w*100).toFixed(2)}cqw`;
// Cor das bordas por raridade. Só LEGENDARY está definida; as outras aguardam referência (NONE = branco, como na base).
G.RARITY_BG={NONE:'#fff',LEGENDARY:'repeating-linear-gradient(135deg,#ff8fb1 0%,#ffe48a 1.6%,#9dffb0 3.2%,#8fd8ff 4.8%,#b69cff 6.4%,#ff8fb1 8%)'};
const L=G.CARD_LAYOUT={frame:'assets/cards/card_base.png',holes:'assets/cards/card_holes_mask.png',
 window:[[285,515],[345,447],[300,400],[465,358],[535,272],[645,237],[768,352],[890,237],[1000,272],[1070,358],[1235,400],[1190,447],[1250,515],[1250,1170],[285,1170]],
 art:[285,237,1250,1170],
 speed:{b:[690,95,855,255],s:116,a:'c',c:'#2c2338'},        // losango superior: Velocidade
 stamina:{b:[350,675,490,765],s:50,a:'c',c:'#fffbe0'},      // brilho: Fôlego
 name:{b:[305,1035,720,1150],s:110,a:'l',c:'#1a1420'},      // etiqueta: Nome
 damage:{b:[505,1140,800,1340],s:108,a:'l',c:'#1a1420'},
 hp:{b:[495,1310,980,1550],s:170,a:'l',c:'#1a1420'},
 ability:{b:[688,1175,840,1222],s:38,a:'l',c:'#1a1420'},   // nome da Habilidade principal
 abilityIcon:[925,1190,1125,1380],                           // dentro da estrela
 classIcon:[700,1700,840,1890]};                             // losango inferior: Classe
if(typeof Image!=='undefined')new Image().src=L.frame; // pré-carrega a moldura: evita "piscar" na 1ª exibição
// Classes cuja moldura já traz o ícone de classe e o Tributo desenhados (a base enviada pelo criador).
G.CLASS_FRAME={ // src: moldura da classe · stamina: caixa do número do Fôlego (o brilho fica 19 px mais acima) · mask: máscara de raridade própria
  MAGO:{src:'assets/cards/card_base_mago.png',stamina:[350,656,490,746]},
  ASSASSIN:{src:'assets/cards/card_base_assassin.png',stamina:[350,656,490,746],mask:'--holes-assassin'}};
if(typeof Image!=='undefined')Object.values(G.CLASS_FRAME).forEach(f=>{new Image().src=f.src;});
Object.keys(G.CLASS_FRAME).forEach(c=>{L['stamina_'+c]=Object.assign({},L.stamina,{b:G.CLASS_FRAME[c].stamina});}); // o brilho do Fôlego fica 19 px mais acima nessa moldura
L.mana={b:[352,828,492,968],s:76,a:'c',c:'#2c2338'};            // orbe do Tributo "Mana" (Mago)
// Ainda não desenhados (aguardam explicação): escudo do Tributo (Fighter) e o "x6" ao lado do Dano.
const t=(k,txt,size,ex='',u='')=>{const o=L[k];return `<div class="t" style="${box(o.b)};${fs(size||o.s)};justify-content:${o.a==='c'?'center':'flex-start'};color:${o.c};${ex}">${txt}${u}</div>`;};
const unit=(label,px,size,drop)=>`<small class="u" style="font-size:${(px/size).toFixed(3)}em;top:${drop}em">${label}</small>`; // rótulo colado ao número
G.cardHTML=function(u,cls='',caption=''){
  const base=G.getCharacterById(u.id)||u,dead=u.hp!==undefined&&u.hp<=0,hp=u.hp!==undefined?u.hp:u.maxHp,st=u.stamina!==undefined?u.stamina:base.stamina;
  const clip=L.window.map(p=>X(p[0])+' '+Y(p[1])).join(','),fr=`left:${X(0)};top:${Y(0)};width:${(F.imgW/F.w*100).toFixed(2)}%`;
  const bg=G.RARITY_BG[base.rarity]||G.RARITY_BG.NONE,m='var('+((G.CLASS_FRAME[u.class]||{}).mask||'--holes')+')'; // máscara embutida em js/ui/holes-data.js
  const cf=G.CLASS_FRAME[u.class],frameSrc=cf?cf.src:L.frame,mana=u.mana!==undefined?u.mana:G.manaFor(base);
  const nameSize=Math.min(L.name.s,Math.floor(415/(u.name.length*0.63)));
  const safeName=String(u.name).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  return `<div class="slot"><div class="card ${cls}${dead?' dead':''}${cf?' baked':''}" data-id="${u.uid||u.id}">`
   +`<div class="rar" style="${fr};background:${bg};-webkit-mask-image:${m};mask-image:${m}"></div>`
   +`<div class="art art-${String(u.class).toLowerCase()}" style="clip-path:polygon(${clip})"><span class="art-placeholder"><b>✦</b><small>${safeName}</small></span><img decoding="sync" src="${u.art}" alt="" style="${base.fullCardArt?fr:box(L.art)}" onload="this.previousElementSibling.remove()" onerror="this.remove()"></div>`
   +`<img class="frame" decoding="sync" src="${frameSrc}" alt="" style="${fr}">`
   +t('speed',u.speed)+(st!=null?t(cf?'stamina_'+u.class:'stamina',st):'')+t('name',u.name,nameSize,'text-transform:uppercase')
   +t('damage',u.damage,0,'',unit('Atk',31,108,-.65))+t('hp',hp,0,'',unit('Life',40,170,-.1))+(u.class==='MAGO'?t('mana',mana):'')+(base.mainAbility?t('ability',base.mainAbility):'')
   +(base.mainAbility?`<div class="ci" style="${box(L.abilityIcon)}"><img src="assets/abilities/${base.id}.png" alt="" onerror="this.remove()"></div>`:'')
   +`<div class="ci cls" style="${box(L.classIcon)};${fs(24)}"><span>${u.class}</span><img src="assets/classes/${u.class.toLowerCase()}.png" alt="" onload="this.previousElementSibling.remove()" onerror="this.remove()"></div>`
   +(dead?'<em>DERROTADO</em>':'')+`</div>${caption?`<small>${caption}</small>`:''}</div>`;
};
})(globalThis.GOGHOS);
