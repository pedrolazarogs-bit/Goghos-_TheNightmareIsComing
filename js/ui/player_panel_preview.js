(function(){
'use strict';
const $=id=>document.getElementById(id),cards=GoghosCharacters,select=$('preview-character'),dialog=$('panel-dialog');
let character,definition;
function show(title,body){$('panel-dialog-title').textContent=title;$('panel-dialog-body').textContent=body;dialog.showModal();}
const panel=GoghosPlayerPanel.mount($('player-panel'),{
 inspect:c=>show(c.name,'Vida: '+c.hp+' / '+c.maxHp+'\nDano: '+(c.atk===null?'— · aguardando regras':c.baseAtk+(c.hits>1?' × '+c.hits+' = '+c.atk:''))+'\nFôlego: '+c.breath+' / '+c.maxBreath),
 ability:c=>show('Habilidade principal · '+c.name,'A estrela fica fixa e abre as informações somente ao clicar. Os efeitos da habilidade aguardam suas regras.'),
 breath:c=>show('Fôlego · '+c.name,c.breath+' de '+c.maxBreath+'. O valor máximo vem do losango impresso na carta. Os controles desta prévia apenas simulam mudanças visuais; consumo e recuperação na batalha aguardam regras.')
});
select.replaceChildren(...cards.map((c,i)=>{const option=document.createElement('option');option.value=i;option.textContent=c.name;return option;}));
function render(message=''){
 panel.render(character,definition);
 $('preview-summary').textContent=character.maxHp+' PV · '+(character.atk===null?'Ataque pendente':character.baseAtk+(character.hits>1?' × '+character.hits:'')+' dano')+' · '+character.maxBreath+' fôlego';
 $('preview-status').textContent=message;
}
function reset(){definition=cards[Number(select.value)];character={...definition,hp:definition.maxHp,atk:definition.baseAtk===null?null:definition.baseAtk*definition.hits,breath:definition.breath,maxBreath:definition.breath};render('Valores da carta restaurados.');}
function amount(){const value=Number($('preview-amount').value);if(!Number.isInteger(value)||value<1||value>9999){$('preview-status').textContent='Informe um valor inteiro de 1 a 9999.';return null;}return value;}
select.addEventListener('change',reset);$('preview-reset').addEventListener('click',reset);
$('preview-damage').addEventListener('click',()=>{const n=amount();if(n===null)return;character.hp=Math.max(0,character.hp-n);render('Vida atual: '+character.hp+'.');});
$('preview-heal').addEventListener('click',()=>{const n=amount();if(n===null)return;character.hp=Math.min(character.maxHp,character.hp+n);render('Vida atual: '+character.hp+'.');});
$('preview-breath-down').addEventListener('click',()=>{character.breath=Math.max(0,character.breath-1);render('Fôlego simulado: '+character.breath+'.');});
$('preview-breath-up').addEventListener('click',()=>{character.breath=Math.min(character.maxBreath,character.breath+1);render('Fôlego simulado: '+character.breath+'.');});
$('panel-dialog-close').addEventListener('click',()=>dialog.close());
const resize=new ResizeObserver(()=>{const box=$('panel-preview-viewport').getBoundingClientRect();$('panel-preview-stage').style.setProperty('--panel-scale',String(Math.min(box.width/650,box.height/420)));});resize.observe($('panel-preview-viewport'));
select.value='2';reset();
})();
