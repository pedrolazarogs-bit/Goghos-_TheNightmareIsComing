const fixedMatchups=require('../tests/fixed-arena-matchups');
const assert=require('node:assert/strict');
const {chromium}=require('playwright');

(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800},reducedMotion:'reduce'});
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  await page.addInitScript(()=>{
   // Keep the real media element so this test exercises decoding and native looping.
   window.testAudio=[];
   window.Audio=class extends Audio {
    constructor(...args){super(...args);window.testAudio.push(this);}
   };
   Math.random=()=>0.1;
  });
  // Shorten each round to one hit while retaining the normal score and result flow.
  await page.route('**/js/penxy/battle.js',async route=>{
   const response=await route.fetch();
   await route.fulfill({response,body:(await response.text())+`
    const model=(${fixedMatchups})(window.GoghosBattleLab);
    function oneHit(begin){
     return (state,...args)=>{
      const started=begin(state,...args);
      if(started){
       state.cursor=state.order.indexOf(state.playerId);
       for(const card of state.cards.filter(c=>c.team==='red'))card.hp=Number(card.slot===0);
      }
      return started;
     };
    }
    window.GoghosBattleLab={...model,start:oneHit(model.start),continueRound:oneHit(model.continueRound)};
   `});
  });
  await page.goto(process.env.ARENA_URL||'http://127.0.0.1:8000/arena-batalha.html');
  const button=name=>page.getByRole('button',{name,exact:true});
  const music=()=>page.evaluate(()=>GOGHOS.Soundtrack.getDebugState());
  assert.equal((await music()).tracks.length,0);
  await page.locator('#owned-character').selectOption({label:'Penxy'});
  await button('Iniciar batalha').click();
  await page.waitForFunction(()=>GOGHOS.Soundtrack.getDebugState().playing);
  assert.equal((await music()).activeTrack,'The_Last_Gambit');
  await page.evaluate(()=>{
   const audio=window.testAudio.find(a=>a.src.endsWith('/The_Last_Gambit.mp3'));
   window.seriesAudio=audio;
   audio.currentTime=audio.duration-.25;
  });
  await page.waitForFunction(()=>seriesAudio.currentTime>0&&seriesAudio.currentTime<2&&!seriesAudio.paused);
  for(let round=1;round<=3;round++){
   await page.locator('[data-battle-card="red-0"]').click();
   await page.locator('.tc-atk').click();
   const next=button(round===3?'Nova série':'Próxima rodada');
   await next.waitFor();
   if(round<3){
    assert(await page.evaluate(()=>!seriesAudio.paused&&seriesAudio.loop));
    await next.click();
    assert.equal((await music()).playCount,1);
   }else{
    assert.equal((await music()).tracks.length,0);
    assert(await page.evaluate(()=>seriesAudio.paused));
    await next.click();
   }
  }
  await page.evaluate(()=>Math.random=()=>0.9);
  await button('Iniciar batalha').click();
  await page.waitForFunction(()=>GOGHOS.Soundtrack.getDebugState().playing);
  assert.equal((await music()).activeTrack,'Final_Gambit');
  assert((await music()).tracks[0].loop);
  await page.locator('summary').click();
  await page.locator('#restart').click();
  await page.locator('#dialog-actions').getByRole('button',{name:'Reiniciar',exact:true}).click();
  assert.equal((await music()).tracks.length,0);
  assert.deepEqual(errors,[]);
  console.log('PASS trilha da arena: dois sorteios, loop real do MP3, três rodadas contínuas, encerramento e reinício.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
