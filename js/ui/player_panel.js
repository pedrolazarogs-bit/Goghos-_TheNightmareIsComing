// The same player panel is used in the arena and its isolated visual preview.
(function(root){
'use strict';
const assets='assets/player-panel-v048/';
function mount(host,actions={}){
 const controller=new AbortController();
 host.classList.add('player-panel');
 host.innerHTML='<div id="portrait" class="player-portrait"><img alt="" draggable="false"></div>'+
  '<div id="inspector" class="player-stats"><img class="hud-base" src="'+assets+'panel-base.png" alt="">'+
   '<div class="stat-life" role="progressbar" aria-label="Vida" aria-valuemin="0"><img class="hud-life-fill" src="'+assets+'health-bar.png" alt=""><strong id="hud-hp"></strong></div>'+
   '<button id="inspect-selected" class="hud-icon hud-heart" data-panel-action="inspect" aria-label="Ver atributos"><img src="'+assets+'heart.png" alt=""></button>'+
   '<div class="hud-damage"><strong id="hud-damage"></strong><button class="hud-icon hud-damage-icon" data-panel-action="inspect" aria-label="Ver dano"><img src="'+assets+'damage.png" alt=""></button></div>'+
   '<div class="hud-identity"><span id="hud-name"></span><small id="hud-state"></small></div></div>'+
  '<button id="principal-ability" class="principal-ability hud-icon" data-panel-action="ability" aria-label="Ver habilidade principal"><img src="assets/card-touch-v044/star.png" alt=""></button>'+
  '<button id="player-breath" class="hud-icon hud-breath" data-panel-action="breath" aria-label="Ver fôlego"><img src="assets/menu-v036/star.webp" alt=""><strong id="hud-breath"></strong></button>';
 const find=selector=>host.querySelector(selector),portrait=find('#portrait'),portraitImage=portrait.querySelector('img'),life=find('.stat-life'),hp=find('#hud-hp'),damage=find('#hud-damage'),breath=find('#hud-breath');
 let character=null;
 host.addEventListener('click',event=>{const button=event.target.closest('[data-panel-action]');if(button&&character&&!button.disabled)actions[button.dataset.panelAction]?.(character);},{signal:controller.signal});
 function render(c,definition){
  character=c;host.hidden=!c;if(!c)return;
  const image=definition.portrait||definition.image;
  if(portraitImage.getAttribute('src')!==image)portraitImage.src=image;
  portraitImage.alt=c.name;portrait.classList.toggle('uses-card',!definition.portrait);
  host.classList.toggle('is-defeated',c.hp===0);
  const currentHp=Math.max(0,Math.min(c.maxHp,c.hp));
  hp.textContent=String(currentHp);life.style.setProperty('--health',String(currentHp/c.maxHp));
  life.setAttribute('aria-valuemax',String(c.maxHp));life.setAttribute('aria-valuenow',String(currentHp));life.setAttribute('aria-valuetext',currentHp+' de '+c.maxHp+' pontos de vida');
  damage.textContent=c.baseAtk===null?'—':c.baseAtk+(c.hits>1?' × '+c.hits:'');
  damage.classList.toggle('has-multiplier',c.hits>1);
  const value=c.breath??definition.breath;
  breath.textContent=value==null?'?':String(value);
  find('#hud-name').textContent=c.name;
  find('#hud-state').textContent=c.hp===0?'ELIMINADO NESTA RODADA':'VOCÊ · EQUIPE AZUL';
  find('#principal-ability').setAttribute('aria-label','Ver habilidade principal de '+c.name);
  find('#inspect-selected').setAttribute('aria-label','Ver atributos de '+c.name);
  find('#player-breath').setAttribute('aria-label','Fôlego de '+c.name+': '+(value??'não definido')+' · ver informações');
  find('.hud-damage-icon').setAttribute('aria-label',c.atk===null?'Ataque de '+c.name+' aguardando regras':'Ver dano de '+c.name+': '+c.atk);
 }
 render(null);
 return Object.freeze({render,destroy(){controller.abort();host.replaceChildren();}});
}
root.GoghosPlayerPanel=Object.freeze({mount});
})(globalThis);
