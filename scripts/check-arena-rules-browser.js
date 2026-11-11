'use strict';
const assert=require('node:assert/strict'),{chromium}=require('playwright');
(async()=>{const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox']});
try{for(const viewport of [{width:1366,height:768},{width:390,height:844}]){const p=await browser.newPage({viewport});const errors=[];p.on('pageerror',e=>errors.push(e.message));p.on('response',r=>{if(r.status()>=400)errors.push(r.status()+' '+r.url());});await p.goto(process.env.TEST_URL||'http://127.0.0.1:8000');await p.evaluate(()=>{document.querySelector('.duel-intro')?.remove();document.getElementById('app').inert=false;const ids=[9,8,14,7,18,2,6,13,16,4];const match={teams:[0,1].map(t=>({name:t?'BLUE TEAM':'RED TEAM',players:ids.slice(t*5,t*5+5).map((id,j)=>({charId:id,name:!t&&!j?'Jogador':'Bot '+(t*5+j),human:!t&&!j,support:['Cura','Sorte']}))}))};GOGHOS.ArenaFive.open({match,rules:{seed:73}});});
await p.waitForFunction(()=>!document.querySelector('#aatk').classList.contains('off'),null,{timeout:20000});
assert.equal(await p.locator('#five-root .au-sup').count(),0);assert.equal(await p.evaluate(()=>GOGHOS.ArenaFive.getDebugState().battle.units.some(u=>u.sup.length)),false);
await p.locator('.au[data-id="0"]').click();await p.locator('#five-inspect').waitFor();assert((await p.locator('#five-inspect article').textContent()).includes('Combo de socos'));assert((await p.locator('#five-inspect article').textContent()).includes('Parry'));
const snapshot=await p.evaluate(()=>JSON.stringify(GOGHOS.ArenaFive.getDebugState().battle.units.map(u=>[u.hp,u.st.und])));await p.waitForTimeout(500);assert.equal(await p.evaluate(()=>JSON.stringify(GOGHOS.ArenaFive.getDebugState().battle.units.map(u=>[u.hp,u.st.und]))),snapshot);
await p.screenshot({path:'/tmp/ficha-v038-'+viewport.width+'.png'});await p.locator('.inspect-back').click();
await p.locator('#aatk').click();await p.locator('.au.tgt[data-id="5"]').click();
await p.waitForFunction(()=>document.querySelector('.au[data-id="5"]').classList.contains('dead'),null,{timeout:20000});
await p.waitForFunction(()=>Number(getComputedStyle(document.querySelector('.au[data-id="5"]')).opacity)<.05);
assert.equal(await p.evaluate(()=>GOGHOS.ArenaFive.getDebugState().battle.units[5].hp),0);assert.equal(await p.evaluate(()=>GOGHOS.ArenaFive.getDebugState().battle.units[5].alive),false);
assert.equal(await p.evaluate(()=>GOGHOS.ArenaFive.getDebugState().battle.units.some(u=>u.pw!=='oni'&&u.st.und!=null)),false);
await p.screenshot({path:'/tmp/combate-v038-'+viewport.width+'.png'});await p.locator('.five-pause').click();const before=await p.evaluate(()=>GOGHOS.ArenaFive.getDebugState().battle.action);await p.waitForTimeout(800);assert.equal(await p.evaluate(()=>GOGHOS.ArenaFive.getDebugState().battle.action),before);
await p.setViewportSize({width:844,height:390});await p.waitForTimeout(200);assert.equal(await p.evaluate(()=>GOGHOS.ArenaFive.getDebugState().battle.action),before);
await p.evaluate(()=>GOGHOS.ArenaFive.close());assert.deepEqual(errors,[]);console.log('PASS own ability/class, real attack and elimination, inspection, pause and resize at '+viewport.width+'px');await p.close();}}
finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1;});
