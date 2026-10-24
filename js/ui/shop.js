// Entrada de compatibilidade da loja: o Santuário reúne os baús e visuais locais.
(function(G){
G.shopHTML=()=>G.Sanctuary?G.Sanctuary.render('vault'):`<section class="center"><h1>Santuário da noite</h1><p>Volte ao menu para acessar os baús e visuais.</p><button data-act="menu">Voltar</button></section>`;
})(globalThis.GOGHOS);
