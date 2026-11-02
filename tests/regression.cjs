const {test}=require('node:test');
const assert=require('node:assert/strict');
const {run,elt,cache,context}=require('./harness.cjs');
const product={id:'p',name:'Vatten',barcode:'123',category:'Vatten och dryck',minimum:6};
const model=()=>({version:2,products:[{...product}],lots:[{id:'a',productId:'p',qty:2,expiry:'2028-01-01'},{id:'b',productId:'p',qty:3,expiry:'2029-01-01'}]});
function set(d){run('data='+JSON.stringify(d)+';persist()')}
function check(d){return run('validateImport('+JSON.stringify(d)+')')}
test('två partier ger saldo 5 och påfyllnadsbehov 1; förbrukning bevarar sortiment',()=>{
 set(model());assert.match(elt('items').innerHTML,/Saldo: 5/);assert.match(elt('items').innerHTML,/Fyll på 1/);
 for(const id of ['a','a','b','b','b'])elt('items').listeners.click({target:{closest:()=>({dataset:{action:'dec',id}})}});
 const d=JSON.parse(cache.get('nodlada-data-v2'));assert.equal(d.products.length,1);assert.equal(d.lots.length,0);assert.match(elt('items').innerHTML,/Saldo: 0/);
});
test('import avvisar okänd version, trasiga fält, dubbletter och ogiltiga datum',()=>{
 const mutations=[d=>d.version=3,d=>delete d.version,d=>d.products[0].barcode=null,d=>d.products[0].category=7,d=>d.products.push({...product}),d=>d.products[0].minimum=1.5,d=>d.lots[1].id='a',d=>d.lots[0].id='',d=>d.lots[0].productId='missing',d=>d.lots[0].qty=0,d=>d.lots[0].qty=2**53,d=>d.lots[0].expiry='2027-02-29',d=>d.lots[0].expiry='2028-04-31',d=>d.lots[0].expiry=20280101];
 for(const mutate of mutations){const d=model();mutate(d);assert.throws(()=>check(d))}
 assert.equal(check(model()),true);assert.equal(run("validDate('2028-02-29')"),true);
});
test('datumvarning inkluderar 60 dagar och passerade datum men inte 61 dagar',()=>{
 const base=new Date(run('today()')+'T12:00:00Z');
 const d=model();d.lots=[-1,60,61].map((n,i)=>{const date=new Date(base);date.setUTCDate(date.getUTCDate()+n);return {id:String(i),productId:'p',qty:1,expiry:date.toISOString().slice(0,10)}});
 set(d);assert.equal(elt('soon').textContent,2);
});
test('utskrift innehåller även filtrerade och slutsålda produkter; filtret återställs',()=>{
 const d=model();d.products.push({...product,id:'zero',name:'Batterier',minimum:0});set(d);
 elt('filter').value='Vatten';elt('onlywarn').onclick();
 let printed;context.window.print=()=>{printed=elt('items').innerHTML};elt('print').onclick();
 assert.match(printed,/Batterier/);assert.match(printed,/Saldo: 0/);assert.doesNotMatch(elt('items').innerHTML,/Batterier/);
 elt('filter').value='';elt('onlywarn').onclick();
});
test('CSV skyddar formler och behåller svenska tecken, citat och saldo 0',()=>{
 for(const value of ['=1+1','+cmd','-cmd','@SUM(A1)',' \t=1'])assert.ok(run('csvEscape('+JSON.stringify(value)+')').startsWith('"\''));
 assert.equal(run('csvEscape(\'Åäö "vatten"\')'),'"Åäö ""vatten"""');
 let output;context.capture=(s)=>output=s;run('download=(s)=>capture(s)');
 set({version:2,products:[product],lots:[]});elt('excel').onclick();assert.ok(output.startsWith('\ufeff'));assert.match(output,/"Vatten";"123";"Vatten och dryck";"0";"6";"6"/);
});
test('backup och återställning bevarar partier, miniminivå och kontrolldatum',async()=>{
 set({...model(),review:'2028-02-29'});let backup;
 context.capture=s=>backup=s;run('download=(s)=>capture(s)');elt('backup').onclick();
 set({version:2,products:[],lots:[]});await elt('import').onchange({target:{files:[{text:async()=>backup}],value:'backup'}});
 const restored=JSON.parse(cache.get('nodlada-data-v2'));assert.equal(restored.review,'2028-02-29');delete restored.review;assert.deepEqual(restored,model());assert.equal(run('reviewDate()'),'2028-02-29');
});
test('ogiltig och avbruten import lämnar lagret och kontrolldatum orörda',async()=>{
 const before=cache.get('nodlada-data-v2'),review=cache.get('nodlada-review-v1');
 for(const d of [{...model(),version:9},{...model(),review:'2027-02-29'}])await elt('import').onchange({target:{files:[{text:async()=>JSON.stringify(d)}],value:'x'}});
 context.confirm=()=>false;await elt('import').onchange({target:{files:[{text:async()=>JSON.stringify({version:2,products:[],lots:[]})}],value:'x'}});context.confirm=()=>true;
 assert.equal(cache.get('nodlada-data-v2'),before);assert.equal(cache.get('nodlada-review-v1'),review);
});
test('äldre backup migreras utan att v1-originalet raderas',()=>{
 const old=[{id:'old',name:'Havre',qty:2,minimum:3,expiry:'2028-01-01'}];cache.set('nodlada-items-v1',JSON.stringify(old));
 const result=JSON.parse(run('JSON.stringify(parseBackup('+JSON.stringify({items:old})+'))'));
 assert.equal(result.loaded.products[0].minimum,3);assert.equal(result.loaded.lots[0].qty,2);assert.equal(cache.get('nodlada-items-v1'),JSON.stringify(old));
});
test('kalender hanterar skottår, årsskifte, textescaping och UTF-8-radbrytning',()=>{
 assert.equal(run("nextReview('2028-02-29')"),'2029-02-28');
 assert.equal(run("nextReview('2027-12-31')"),'2028-12-31');
 assert.equal(run("icsText('a,b;c\\nd')"),'a\\,b\\;c\\nd');
 const long=run('foldIcs('+JSON.stringify('SUMMARY:'+ 'Åäö '.repeat(70))+')');
 for(const line of long.split('\r\n'))assert.ok(Buffer.byteLength(line)<=75);
 assert.equal(long.replace(/\r\n /g,''),'SUMMARY:'+'Åäö '.repeat(70));
 let output;context.capture=s=>output=s;run('download=(s)=>capture(s)');
 set({...model(),review:'2028-02-29'});elt('calendar').onclick();
 assert.match(output,/DTSTART;VALUE=DATE:20290228/);assert.match(output,/RRULE:FREQ=YEARLY/);assert.match(output,/TRIGGER:PT9H/);
 assert.match(output,/DTSTAMP:\d{8}T\d{6}Z/);assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});
test('misslyckad lagersparning återställer visat saldo och behåller formuläret',()=>{
 set(model());const before=cache.get('nodlada-data-v2');const write=context.localStorage.setItem;
 const alerts=[];context.alert=s=>alerts.push(s);context.localStorage.setItem=()=>{throw Error('Full lagring')};
 elt('name').value='Nytt';elt('barcode').value='';elt('category').value='Övrigt';elt('qty').value='1';elt('minimum').value='1';elt('expiry').value='';
 try{elt('save').onclick();assert.equal(cache.get('nodlada-data-v2'),before);assert.equal(elt('name').value,'Nytt');assert.doesNotMatch(elt('items').innerHTML,/Nytt/);assert.equal(alerts.length,1);assert.match(alerts[0],/sparades inte/)}finally{context.localStorage.setItem=write}
});
test('import skriver lager och kontrolldatum atomiskt och rullar tillbaka vid lagringsfel',async()=>{
 set({...model(),review:'2028-01-01'});const before=cache.get('nodlada-data-v2');const write=context.localStorage.setItem;
 context.localStorage.setItem=()=>{throw Error('Full lagring')};
 try{await elt('import').onchange({target:{files:[{text:async()=>JSON.stringify({version:2,products:[],lots:[],review:'2029-01-01'})}],value:'x'}});assert.equal(cache.get('nodlada-data-v2'),before);assert.equal(run('reviewDate()'),'2028-01-01');assert.match(elt('items').innerHTML,/Vatten/)}finally{context.localStorage.setItem=write}
});
test('misslyckad lagerkontroll sparas inte och visas inte som genomförd',()=>{
 set({...model(),review:'2028-01-01'});const write=context.localStorage.setItem;
 context.localStorage.setItem=()=>{throw Error('Full lagring')};
 try{elt('reviewdone').onclick();assert.equal(run('reviewDate()'),'2028-01-01')}finally{context.localStorage.setItem=write}
});
test('oläsbart befintligt register skyddas från överskrivning',()=>{
 const before=cache.get('nodlada-data-v2');cache.set('nodlada-data-v2','{broken');
 run('load()');assert.equal(run('persist()'),false);assert.equal(cache.get('nodlada-data-v2'),'{broken');
 cache.set('nodlada-data-v2',before);run('storageBlocked=false;load()');
});
test('äldre separat kontrolldatum följer med vid första nya sparningen',()=>{
 cache.set('nodlada-review-v1','2027-11-01');cache.set('nodlada-data-v2',JSON.stringify(model()));
 run('load();persist()');assert.equal(JSON.parse(cache.get('nodlada-data-v2')).review,'2027-11-01');assert.equal(cache.get('nodlada-review-v1'),'2027-11-01');
});

test('bekräftad giltig backup kan återställa ett oläsbart register',async()=>{
 cache.set('nodlada-data-v2','{broken');run('load()');
 await elt('import').onchange({target:{files:[{text:async()=>JSON.stringify({...model(),review:'2028-01-01'})}],value:'x'}});
 assert.equal(JSON.parse(cache.get('nodlada-data-v2')).products[0].name,'Vatten');
 assert.equal(run('storageBlocked'),false);assert.equal(run('persist()'),true);
});
test('skannern använder produktformat, anpassad läsyta och ett enda uppslag per kod',async()=>{
 const formats={EAN_13:9,EAN_8:10,UPC_A:14,UPC_E:15,CODE_128:5};
 let config,startConfig,onDecode,stops=0,lookups=0,instances=0;
 class Scanner{constructor(id,c){instances++;assert.equal(id,'reader');config=c}async start(camera,c,callback){startConfig=c;onDecode=callback}async stop(){stops++}clear(){}}
 context.window.Html5Qrcode=Scanner;context.Html5Qrcode=Scanner;context.Html5QrcodeSupportedFormats=formats;
 const lookup=elt('lookup').onclick;elt('lookup').onclick=()=>{lookups++};
 try{
  const first=elt('scan').onclick();await elt('scan').onclick();await first;
  assert.equal(instances,1);assert.deepEqual(Array.from(config.formatsToSupport),[9,10,14,15,5]);
  assert.equal(startConfig.disableFlip,true);assert.equal(startConfig.videoConstraints.width.ideal,1280);
  for(const [w,h] of [[320,240],[390,219],[240,320]]){const box=startConfig.qrbox(w,h);assert.ok(box.width<=w&&box.height<=h);assert.ok(box.width>w*0.85)}
  await onDecode('7310000000001');await onDecode('7310000000001');
  assert.equal(stops,1);assert.equal(lookups,1);assert.equal(elt('barcode').value,'7310000000001');assert.equal(elt('scan').disabled,false);
 }finally{elt('lookup').onclick=lookup;delete context.window.Html5Qrcode;delete context.Html5Qrcode;delete context.Html5QrcodeSupportedFormats}
});
test('nekad kamera ger manuell reservväg och tillåter nytt försök',async()=>{
 class Scanner{async start(){throw Error('Permission denied')}async stop(){}clear(){}}
 context.window.Html5Qrcode=Scanner;context.Html5Qrcode=Scanner;context.Html5QrcodeSupportedFormats={};
 try{await elt('scan').onclick();assert.match(elt('scanstatus').textContent,/skriv streckkoden manuellt/);assert.equal(run('scanner'),null);assert.equal(elt('scan').disabled,false)}finally{delete context.window.Html5Qrcode;delete context.Html5Qrcode;delete context.Html5QrcodeSupportedFormats}
});
