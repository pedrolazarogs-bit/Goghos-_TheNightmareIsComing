// A abertura obrigatória termina no menu; Play abre a arena em sua própria página.
(function(G){
'use strict';
const app=document.getElementById('app');
G.PresentationFX.init();
G.Soundtrack.init();
app.innerHTML=G.CosmosMenu.html();
G.IntroPresenter.open({onClose:()=>G.CosmosMenu.mount(app)});
})(globalThis.GOGHOS);
