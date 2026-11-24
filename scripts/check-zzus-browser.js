const {chromium}=require('playwright');
const assert=require('node:assert/strict');

(async()=>{
 const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox']});
 try{
  const page=await browser.newPage({viewport:{width:1280,height:800}}),errors=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)errors.push(r.url());});
  // Only set initial initiative and HP to exercise redirection, including a lethal hit.
  await page.route('**/js/penxy/battle.js',async route=>{
   const file=await route.fetch();
   await route.fulfill({response:file,body:(await file.text())+`
    const original=window.GoghosBattleLab;
    window.GoghosBattleLab={...original,start(s,...args){
     if(!original.start(s,...args))return false;
     const hero=s.cards.find(c=>c.skill==='protect'),foe=s.cards.find(c=>c.id==='red-0');
     s.cards.forEach(c=>c.speed=1);hero.speed=11;foe.speed=10;
     s.cursor=s.order.indexOf(hero.id);
     if(hero.controller==='bot'){hero.hp=150;s.cards[0].hp=10;}
     return true;
    }};
   `});
  });
  const url=new URL(process.env.ARENA_URL||'http://127.0.0.1:8000/arena-batalha.html');
  url.searchParams.set('personagem','Z-Zus');
  const ready=()=>page.waitForFunction(()=>!GoghosBattle.snapshot().busy);
  async function start(name){
   await page.goto(url.href);
   assert.equal(await page.locator('#owned-character option:checked').textContent(),'Z-Zus');
   await page.locator('#owned-character').selectOption({label:name});
   await page.getByRole('button',{name:'Iniciar batalha'}).click();
  }
  await start('Z-Zus');
  await page.locator('[data-battle-card=red-0]').click();await page.locator('.tc-atk').click();
  await ready();
  assert.equal(await page.locator('[data-zzus-fx=canvas]').count(),1);
  const first=await page.evaluate(()=>GoghosBattle.snapshot());
  assert.equal(first.last,first.playerId);
  assert.equal(first.cards[4].hp,Math.max(0,first.cards[4].maxHp-first.cards[0].atk));
  await start('Z-Zus');
  await page.locator('[data-slot=ability]').click();
  await page.getByRole('button',{name:'Proteger P.ULLYS',exact:true}).click();
  await ready();
  assert(await page.evaluate(()=>ZzusFX.hero.active));
  await page.locator('summary').click();await page.locator('#motion').click();
  assert(!await page.evaluate(()=>ZzusFX.hero.active));
  await page.locator('summary').click();await page.locator('#motion').click();
  assert(await page.evaluate(()=>ZzusFX.hero.active));
  await start('Dashow Only');
  await page.waitForFunction(()=>ZzusFX.hero.active);
  assert.equal(await page.evaluate(()=>ZzusFX.hero.current.allyEl.dataset.battleCard),'blue-0');
  await page.getByText('PROTEGIDO',{exact:true}).waitFor();
  await page.waitForFunction(()=>!GoghosBattle.snapshot().busy&&!ZzusFX.hero.active);
  const last=await page.evaluate(()=>GoghosBattle.snapshot());
  assert.equal(last.cards[0].hp,10);assert.equal(last.cards[1].hp,0);
  assert(!await page.locator('[data-battle-card=blue-1]').isVisible());
  assert.deepEqual(errors,[]);
  console.log('PASS Z-Zus: Pedrinha, vínculo do jogador e do bot, efeitos reduzidos, transferência letal e fim da proteção.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
