// Consultas paginadas da arena. Nunca avançam a fila nem alteram o estado da partida.
(function(G){
  'use strict';
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const text=html=>String(html??'').replace(/<[^>]*>/g,' ').replace(/&#(x[\da-f]+|\d+);/gi,(all,n)=>{
    const code=n[0].toLowerCase()==='x'?parseInt(n.slice(1),16):Number(n);
    return code>0&&code<=0x10ffff?String.fromCodePoint(code):all;
  }).replace(/&(amp|lt|gt|quot|apos|nbsp|#39);/g,(_,n)=>({amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' ','#39':"'"}[n])).replace(/\s+/g,' ').trim();
  const clamp=(value,max)=>Math.max(0,Math.min(max-1,Math.trunc(Number(value)||0)));
  const viewport=()=>({short:Number(globalThis.innerHeight)>0&&globalThis.innerHeight<520,narrow:Number(globalThis.innerWidth)>0&&globalThis.innerWidth<620});
  function chunks(value,limit){
    let rest=String(value??'').trim();const output=[];
    while(rest.length>limit){
      let at=rest.lastIndexOf(' ',limit);
      if(at<limit*.5)at=limit;
      output.push(rest.slice(0,at).trim());rest=rest.slice(at).trim();
    }
    if(rest)output.push(rest);return output;
  }
  function paginate(items,count){
    const pages=[];for(let i=0;i<items.length;i+=count)pages.push(items.slice(i,i+count));
    return pages.length?pages:[[]];
  }
  function navigation(page,pages){
    return `<nav class="fit-reader-nav" aria-label="Páginas desta consulta"><button type="button" data-act="reader-prev"${page===0?' disabled':''} aria-label="Página anterior">‹ Anterior</button><span aria-live="polite">${page+1} / ${pages}</span><button type="button" data-act="reader-next"${page>=pages-1?' disabled':''} aria-label="Próxima página">Próxima ›</button></nav>`;
  }
  const empty=message=>`<p class="reader-empty">${escape(message)}</p>`;
  const body=(html,cls='')=>`<div class="fit-reader-body ${cls}">${html}</div>`;
  function cardPages(o,size){
    if(!o.unit)return[empty('Toque em um personagem para ver sua ficha.')];
    const info=G.actorInfoHTML(o.state,o.unit),details=info.match(/<details\b[^>]*class="[^"]*ability-details[^"]*"[^>]*>[\s\S]*?<\/details>/i)?.[0]||'';
    const stats=info.replace(details,'');
    const pages=[`<div class="inspect-content reader-card-summary"><div class="inspect-card">${G.cardHTML(o.unit)}</div>${stats}</div>`];
    const notes=[];
    for(const match of details.matchAll(/<p\b([^>]*)>([\s\S]*?)<\/p>/gi)){
      const content=text(match[2]),kind=match[1].includes('actor-status')?'status':match[1].includes('actor-tribute')?'tribute':'ability';
      chunks(content,size.short?260:450).forEach((part,index)=>notes.push({kind,part,continued:index>0}));
    }
    // Text budgets include the space used by the section labels, so MAX tributes also fit.
    let group=[],used=0;
    const budget=size.short?280:470;
    const push=()=>{if(group.length){pages.push(`<div class="reader-card-notes">${group.map(n=>`<article class="reader-note ${n.kind}"><h4>${n.kind==='ability'?'Habilidade':n.kind==='tribute'?'Tributo da classe':'Efeitos em campo'}${n.continued?' · continuação':''}</h4><p>${escape(n.part)}</p></article>`).join('')}</div>`);group=[];used=0;}};
    for(const note of notes){if(group.length&&(used+note.part.length+45>budget||group.length>=(size.short?2:3)))push();group.push(note);used+=note.part.length+45;}push();
    return pages;
  }
  function historyPages(o,size){
    const limit=size.short?120:size.narrow?110:190;
    const entries=[...(o.state?.log||[])].reverse().flatMap((entry,index)=>chunks(entry,limit).map((part,i)=>({part,index,continued:i>0})));
    return paginate(entries,size.short?2:4).map(page=>page.length?`<div class="log-list full-history reader-history">${page.map(e=>`<article class="reader-log-entry"><small>${e.continued?'Continuação do acontecimento':`Acontecimento ${(o.state?.log?.length||0)-e.index}`}</small><p>${escape(e.part)}</p></article>`).join('')}</div>`:empty('Os acontecimentos da batalha aparecerão aqui.'));
  }
  function orderPages(o,size){
    const s=o.state||{},current=o.actor?.uid||null,units=(s.order||[]).map(uid=>G.getUnit?.(s,uid)||(s.units||[]).find(u=>u.uid===uid)).filter(Boolean);
    return paginate(units,size.short?6:12).map(page=>page.length?`<ol class="reader-order">${page.map(u=>{const done=!!s.acted?.[u.uid],now=u.uid===current;return `<li class="${now?'current':done?'done':''}"${now?' aria-current="true"':''}><b class="reader-speed">${escape(u.speed??'—')}</b><span><strong>${escape(u.name)}</strong><small>${now?'Vez atual':done?'Já agiu':u.team==='player'?'Sua equipe':'Adversário'}</small></span></li>`;}).join('')}</ol>`:empty('A fila será formada no próximo ciclo.'));
  }
  function eliminatedPages(o){
    return paginate([...(o.state?.eliminated||[])],6).map(page=>page.length?`<div class="reader-eliminated">${page.map(e=>`<article><strong>${escape(e.name)}</strong><span>${escape(G.CLASS_LABEL?.[e.class]||e.class||'Personagem')}</span><small>${e.team==='player'?'Sua equipe':'Adversário'} · Rodada ${escape(e.round??'—')}</small></article>`).join('')}</div>`:empty('Nenhum personagem foi eliminado.'));
  }
  G.ArenaReaders={render(options={}){
    const o=options,size=viewport(),type=o.type||'card';let title,content;
    switch(type){
      case 'history':title='Registro da batalha';content=historyPages(o,size);break;
      case 'order':title='Ordem de velocidade';content=orderPages(o,size);break;
      case 'eliminated':title='Personagens eliminados';content=eliminatedPages(o);break;
      case 'settings':title='Som e efeitos';content=Array.from({length:3},(_,page)=>`<div class="reader-settings" data-reader-page="${page}">${o.settingsHTML||empty('Preferências indisponíveis.')}</div>`);break;
      case 'hand':title='Carta da sua mão';content=Array.from({length:Math.max(1,Math.trunc(Number(o.handPages)||1))},()=>`<div class="reader-hand"><div class="reader-hand-art">${o.handArtHTML||''}</div><div class="reader-hand-detail">${o.handDetailHTML||empty('Selecione uma carta da mão.')}</div></div>`);break;
      default:title=o.unit?`Ficha · ${o.unit.name}`:'Ficha da carta';content=cardPages(o,size);break;
    }
    const pages=content.length,page=clamp(o.page,pages);
    return{title,html:body(content[page],`reader-${type}-body`),page,pages,navigation:navigation(page,pages)};
  }};
})(globalThis.GOGHOS);
