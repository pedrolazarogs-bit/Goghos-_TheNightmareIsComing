// Presentation disclosures never spend an action, trigger a redraw entry or alter a deck.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
let passed=0;
const test=(name,fn)=>{fn();passed++;console.log('OK  '+name);};
function setup(){
 const entries=[],interactions=[],unit={id:'sam',name:'Sam',rarity:'MYTHIC'},state={round:4,hp:190,deck:['support']};
 const G={state,getCharacterById:id=>id==='sam'?unit:null,PresentationFX:{playEntry:(...args)=>entries.push(args),interaction:(...args)=>interactions.push(args)}};
 class Element{
  constructor(tag='div'){this.tagName=tag;this.dataset={};this.attrs={};this.children=[];this.listeners={};this.selectors={};this.all={};this.parents={};this.isConnected=true;this.open=false;this.classList={contains:cls=>this.classes?.includes(cls)};}
  setAttribute(k,v){this.attrs[k]=v;}querySelector(k){return this.selectors[k]||null;}querySelectorAll(k){return this.all[k]||[];}closest(k){return this.parents[k]||null;}matches(k){return this.match===k;}
  appendChild(el){if(el.parentNode)el.parentNode.children=el.parentNode.children.filter(x=>x!==el);el.parentNode=this;this.children.push(el);return el;}
  insertBefore(el,before){el.parentNode=this;this.children.splice(this.children.indexOf(before),0,el);}
  addEventListener(k,fn){(this.listeners[k]??=[]).push(fn);}emit(k,event){for(const fn of this.listeners[k]||[])fn(event);}
 }
 const document={hidden:false,createElement:tag=>new Element(tag)},context={GOGHOS:G,document};vm.createContext(context);vm.runInContext(fs.readFileSync('js/ui/cartoon_motion.js','utf8'),context);
 const host=new Element(),article=new Element('article'),stage=new Element(),card=new Element(),detail=new Element('details'),copy=new Element(),paragraph=new Element('p'),summary=new Element('summary');
 card.dataset.id='sam';stage.selectors['.card']=card;stage.parents['.fg-archive-item']=article;stage.parents['.fg-card-stage']=stage;article.selectors['.fg-ability-copy']=detail;article.selectors['.fg-card-stage']=stage;copy.all[':scope > p']=[paragraph];copy.children=[paragraph];paragraph.parentNode=copy;
 summary.parents['.fg-ability-copy > summary']=summary;summary.parents['.fg-archive-item']=article;summary.parentNode=detail;
 host.all['.fg-archive-item .fg-card-stage']=[stage];host.all['.ability-tests .fg-item-copy,.support-tests .fg-item-copy']=[copy];
 return {M:G.CartoonMotion,G,document,host,article,stage,card,detail,copy,paragraph,summary,entries,interactions,Element};
}
test('montar ou redesenhar o arquivo não reproduz sons nem entradas e vincula um único par de controles',()=>{
 const q=setup(),before=JSON.stringify(q.G.state);q.M.mountInterface(q.host);q.M.mountInterface(q.host);assert.equal(q.entries.length,0);assert.equal(q.interactions.length,0);assert.equal(q.host.listeners.click.length,1);assert.equal(q.host.listeners.keydown.length,1);assert.equal(JSON.stringify(q.G.state),before);assert.equal(q.stage.attrs.role,'button');assert.equal(q.stage.attrs.tabindex,'0');assert.equal(q.stage.attrs['aria-label'],'Ver habilidade de Sam');
});
test('descrições longas do laboratório passam a ter divulgação explícita mantendo todo o texto existente',()=>{
 const q=setup();q.M.mountInterface(q.host);const detail=q.copy.children[0];assert.equal(detail.tagName,'details');assert.equal(detail.open,false);assert.equal(detail.children[0].textContent,'Habilidade');assert.equal(detail.children[1],q.paragraph);assert.equal(q.paragraph.parentNode,detail);
});
test('tocar ou pressionar espaço na arte abre a habilidade com a assinatura da raridade, sem tocar regras',()=>{
 const q=setup(),before=JSON.stringify(q.G.state);q.M.mountInterface(q.host);q.host.emit('click',{target:q.stage});assert(q.detail.open);assert.equal(q.stage.attrs['aria-expanded'],'true');assert.equal(q.entries.length,1);assert.equal(q.entries[0][0].rarity,'MYTHIC');assert.equal(q.entries[0][2].kind,'preview');let prevented=false;q.host.emit('keydown',{target:q.stage,key:' ',preventDefault(){prevented=true;}});assert(prevented);assert.equal(q.detail.open,false);assert.equal(q.entries.length,1);assert.equal(JSON.stringify(q.G.state),before);
});
test('a prévia responde somente a uma escolha efetiva, mesmo quando o rascunho substituiu o elemento clicado',()=>{
 const q=setup();q.M.mountInterface(q.host);const old=new q.Element(),current=new q.Element();old.dataset.character=current.dataset.character='sam';old.parents['[data-character]']=old;current.classes=['player'];old.isConnected=false;q.host.all['[data-character]']=[current];q.host.emit('click',{target:old});assert.equal(q.entries.length,1);assert.equal(q.entries[0][1],current);current.classes=[];q.host.emit('click',{target:old});assert.equal(q.entries.length,1);
});
test('a apresentação global não interfere com a arena e não inicia prévias numa aba oculta',()=>{
 const q=setup();q.M.mountInterface(q.host);q.host.selectors['.arena']={};q.host.emit('click',{target:q.stage});assert.equal(q.detail.open,false);assert.equal(q.entries.length,0);delete q.host.selectors['.arena'];q.document.hidden=true;assert.equal(q.M.reveal(q.stage,q.G.getCharacterById('sam')),false);assert.equal(q.entries.length,0);
});
console.log(`${passed} testes da identidade global passaram`);
