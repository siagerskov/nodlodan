const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const script=src.split('<script>')[1].split('</script>')[0];
const cache=new Map(),els=new Map();
function elt(id){if(!els.has(id))els.set(id,{id,value:'',textContent:'',innerHTML:'',classList:{remove(){},add(){}},addEventListener(t,fn){this.listeners??={};this.listeners[t]=fn},click(){this.onclick?.()},scrollTo(){}});return els.get(id)}
const document={getElementById:elt,createElement:()=>({click(){},remove(){},set href(v){},set download(v){}}),body:{appendChild(){}}};
const localStorage={getItem:k=>cache.has(k)?cache.get(k):null,setItem:(k,v)=>cache.set(k,v)};
const context={document,localStorage,crypto:{randomUUID:()=>Math.random().toString(36).slice(2)},Date,Math,JSON,String,Number,Map,Set,Array,window:{addEventListener(){},isSecureContext:true,scrollTo(){},print(){}},navigator:{},location:{protocol:'http:'},alert:()=>{},confirm:()=>true,prompt:()=> '3',URL:{createObjectURL:()=>'',revokeObjectURL(){}},Blob,TextEncoder,console};
vm.createContext(context);vm.runInContext(script,context);
elt('name').value='Vatten 1,5 l';elt('qty').value='0';elt('minimum').value='6';elt('category').value='Vatten och dryck';elt('save').onclick();
let data=JSON.parse(cache.get('nodlada-data-v2'));assert.equal(data.products.length,1);assert.equal(data.lots.length,0);assert.equal(elt('low').textContent,1);assert.match(elt('items').innerHTML,/Saldo: 0/);
elt('name').value='Vatten 1,5 l';elt('qty').value='2';elt('minimum').value='6';elt('expiry').value='2028-01-01';elt('category').value='Vatten och dryck';elt('save').onclick();data=JSON.parse(cache.get('nodlada-data-v2'));assert.equal(data.lots.length,1);assert.equal(elt('low').textContent,1);
const lotId=data.lots[0].id;
const click=(action,id)=>elt('items').listeners.click({target:{closest:()=>({dataset:{action,id}})}});
click('dec',lotId);click('dec',lotId);data=JSON.parse(cache.get('nodlada-data-v2'));assert.equal(data.lots.length,0);assert.equal(data.products.length,1);assert.equal(elt('low').textContent,1);
click('edit',data.products[0].id);data=JSON.parse(cache.get('nodlada-data-v2'));assert.equal(data.products[0].minimum,3);
console.log('PASS: zero stock retained, low stock counted, increment/decrement, min edit');
// Migration of v1 storage
const old=[{id:'oldlot',name:'Havregryn',barcode:'123',category:'Torrvaror',qty:1,minimum:5,expiry:'2027-08-01'}];
const migrate=vm.runInContext('migrateV1',context);const migrated=migrate(old);assert.equal(migrated.products[0].minimum,5);assert.equal(migrated.lots[0].qty,1);
console.log('PASS: legacy schema migration');
