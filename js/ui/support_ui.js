// Painel de cartas de Apoio (lado esquerdo da batalha). A arte enviada é exibida como está, recortada na área útil.
(function(G){
const CROP={x:267,y:235,w:1002,h:1578,iw:1536}; // área útil das artes de apoio (pixels da imagem 1536x2048)
const artStyle=`left:${(-CROP.x/CROP.w*100).toFixed(2)}%;top:${(-CROP.y/CROP.h*100).toFixed(2)}%;width:${(CROP.iw/CROP.w*100).toFixed(2)}%`;
const art=d=>`<div class="scard"><span>${d.name}</span><img decoding="sync" src="${d.art}" alt="${d.name}" style="${artStyle}" onload="this.previousElementSibling.remove()" onerror="this.remove()"></div>`;
G.supportArtHTML=art;
if(typeof Image!=='undefined')G.SUPPORT_CARDS.forEach(d=>{new Image().src=d.art;}); // pré-carrega as artes (evita piscar)
G.supportPanelHTML=function(s,st){
  const sp=s.support,max=G.CONFIG.supportMax;if(!sp.slots.length)return '';
  const used=sp.usedTurn===s.turn;
  const slots=Array.from({length:max},(_,i)=>{const sl=sp.slots[i];if(!sl)return '<div class="ap-slot empty"><span>vazio</span></div>';
    const d=G.getSupportCard(sl.id),on=d.effect==='onAllyDefeatedHeal'&&sp.brisa,out=sl.uses<=0,sel=st.sel===i;
    const tag=sel?'SELECIONADA':on?'ATIVA':out?'ESGOTADA':'';
    return `<div class="ap-slot${sel?' sel':''}${on?' on':''}${out?' out':''}" data-sup="${i}" title="${d.name}: ${d.description}">${art(d)}<b class="ap-badge">×${sl.uses}</b>${tag?`<em class="ap-tag">${tag}</em>`:''}<div class="ap-name">${d.name}</div><small>Restam ${sl.uses}/${sl.maxUses}</small></div>`;});
  return `<aside class="apoio"><h4>Apoio</h4><p class="ap-turn${used?' used':''}">${used?'Já usou neste turno':'1 uso por turno'}</p>${slots.join('')}</aside>`;
};
})(globalThis.GOGHOS);
