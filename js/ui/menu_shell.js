// A abertura termina no menu. Não há roteador nem telas internas nesta edição.
(function(G){
'use strict';
const app=document.getElementById('app');
G.PresentationFX.init();
G.Soundtrack.init();
app.innerHTML=G.CosmosMenu.html();
G.IntroPresenter.open({onClose:()=>G.CosmosMenu.mount(app)});
})(globalThis.GOGHOS);
