const fs=require('fs'),vm=require('vm'),assert=require('assert');
const src=fs.readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
const script=src.split('<script>')[1].split('</script>')[0];
const cache=new Map(),els=new Map();
function elt(id){if(!els.has(id))els.set(id,{id,value:'',textContent:'',innerHTML:'',classList:{remove(){},add(){}},addEventListener(t,fn){this.listeners??={};this.listeners[t]=fn},click(){this.onclick?.()},scrollTo(){}});return els.get(id)}
const document={getElementById:elt,createElement:()=>({click(){},remove(){},set href(v){},set download(v){}}),body:{appendChild(){}}};
const localStorage={getItem:k=>cache.has(k)?cache.get(k):null,setItem:(k,v)=>cache.set(k,v)};
const context={document,localStorage,crypto:{randomUUID:()=>Math.random().toString(36).slice(2)},Date,Math,JSON,String,Number,Map,Set,Array,window:{addEventListener(){},isSecureContext:true,scrollTo(){},print(){}},navigator:{},location:{protocol:'http:'},alert:()=>{},confirm:()=>true,prompt:()=> '3',URL:{createObjectURL:()=>'',revokeObjectURL(){}},Blob,TextEncoder,console,setTimeout:()=>{}};
vm.createContext(context);vm.runInContext(script,context);

module.exports={context,elt,cache,run:code=>vm.runInContext(code,context)};
