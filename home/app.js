/* Our home — a little block home Baji and Anujin build and wander together.
   Everything shared (blocks, letters, who was here) lives in Supabase behind the secret word;
   live movement, hearts and new blocks travel over a realtime channel whose name only the word unlocks. */
(function(){
"use strict";
const CONFIG={url:"https://rnagnimphpekwiigxcup.supabase.co",key:"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJuYWduaW1waHBla3dpaWd4Y3VwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTM3MTE3OTAsImV4cCI6MjEwOTI4Nzc5MH0.daqH0Ac-lmNUG44FEEWxfIiMaMotlvN_lEtLavOdCpg"}; // public key: it only reaches the word-checked functions
const DEMO=new URLSearchParams(location.search).has("demo");
const $=id=>document.getElementById(id);
const store={get:k=>{try{return localStorage.getItem(k)}catch(_){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(_){}},del:k=>{try{localStorage.removeItem(k)}catch(_){}}};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch=matchMedia("(pointer:coarse)").matches;
// Anujin and Baji are a pair (kisses, sword fights, letters); Urii, our little girl, can come home too and just play
const COUPLE=["Anujin","Baji"],EVERYONE=["Anujin","Baji","Urii"];
const other=w=>w==="Anujin"?"Baji":w==="Baji"?"Anujin":null;
const ago=iso=>{if(!iso)return"";const s=(Date.now()-new Date(iso).getTime())/1000;if(s<90)return"just now";const m=s/60;if(m<60)return Math.round(m)+" min ago";const h=m/60;if(h<24)return Math.round(h)+" h ago";const d=h/24;return d<2?"yesterday":Math.round(d)+" days ago"};
const when=iso=>new Date(iso).toLocaleString("en-GB",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});

// ---------- blocks ----------
const B=[["Oak planks","planks"],["Oak log","log"],["Brick","brick"],["Stone brick","stone"],["Glass","glass"],["Roof tile","roof"],
  ["White wool","wool"],["Pink wool","pink"],["Leaves","leaves"],["Lamp","lamp"],["Heart","heart"],["Grass","grass"],["Dirt","dirt"]];
const ID=Object.fromEntries(B.map((b,i)=>[b[1],i]));
function rnd(seed){let s=seed;return()=>(s=(s*16807)%2147483647)/2147483647}
function px(draw,seed){const c=document.createElement("canvas");c.width=c.height=16;draw(c.getContext("2d"),rnd(seed||7));return c}
const noise=(g,r,base,vars,amt)=>{for(let y=0;y<16;y++)for(let x=0;x<16;x++){g.fillStyle=r()<amt?vars[Math.floor(r()*vars.length)]:base;g.fillRect(x,y,1,1)}};
const TX={
  grassTop:px((g,r)=>noise(g,r,"#8fab78",["#9fbb88","#7f9a69","#a7c18f"],.45),3),
  grassSide:px((g,r)=>{noise(g,r,"#8a6447",["#7a5638","#9a7354","#6f4d33"],.5);for(let x=0;x<16;x++){const h=3+Math.floor(r()*2.2);g.fillStyle="#8fab78";g.fillRect(x,0,1,h);g.fillStyle="#7f9a69";g.fillRect(x,h-1,1,1)}},5),
  dirt:px((g,r)=>noise(g,r,"#8a6447",["#7a5638","#9a7354","#6f4d33"],.5),9),
  planks:px((g,r)=>{noise(g,r,"#c99a64",["#bd8e58","#d4a66f","#b98a55"],.35);g.fillStyle="#9c7243";for(let y=3;y<16;y+=4)g.fillRect(0,y,16,1);[[5,0],[12,4],[3,8],[10,12]].forEach(([x,y])=>g.fillRect(x,y,1,3))},11),
  logSide:px((g,r)=>{for(let x=0;x<16;x++){g.fillStyle=["#6f4b30","#7d5638","#644229","#7a5536"][Math.floor(r()*4)];g.fillRect(x,0,1,16)}for(let i=0;i<10;i++){g.fillStyle="#563823";g.fillRect(Math.floor(r()*16),Math.floor(r()*16),1,2)}},13),
  logTop:px(g=>{g.fillStyle="#6f4b30";g.fillRect(0,0,16,16);[["#c99a64",1],["#b88a57",3],["#c99a64",5],["#a57a4a",7]].forEach(([c,i])=>{g.fillStyle=c;g.fillRect(i,i,16-i*2,16-i*2)})},15),
  brick:px((g,r)=>{g.fillStyle="#d9cfc4";g.fillRect(0,0,16,16);for(let row=0;row<4;row++){const off=row%2?4:0;for(let b=-1;b<2;b++){g.fillStyle=["#b4553f","#a84b37","#bf5f48"][Math.floor(r()*3)];g.fillRect(b*8+off+1,row*4+1,7,3)}}},17),
  stone:px((g,r)=>{noise(g,r,"#a8a39e",["#9b9590","#b5b0aa","#908a85"],.4);g.fillStyle="#7f7a75";g.fillRect(0,7,16,1);g.fillRect(0,15,16,1);g.fillRect(7,0,1,7);g.fillRect(3,8,1,7);g.fillRect(12,8,1,7)},19),
  glass:px(g=>{g.fillStyle="rgba(220,236,242,.35)";g.fillRect(0,0,16,16);g.fillStyle="#f4fbff";g.fillRect(0,0,16,1);g.fillRect(0,15,16,1);g.fillRect(0,0,1,16);g.fillRect(15,0,1,16);g.fillRect(3,4,1,1);g.fillRect(4,3,1,1);g.fillRect(4,5,1,1);g.fillRect(5,4,1,1)}),
  roof:px((g,r)=>{noise(g,r,"#8c2f4a",["#7a2840","#9b3956","#842c45"],.35);g.fillStyle="#5e1c30";for(let y=3;y<16;y+=4){g.fillRect(0,y,16,1);const o=(y%8===3)?0:4;for(let x=o;x<16;x+=8)g.fillRect(x,y-3,1,3)}},21),
  wool:px((g,r)=>noise(g,r,"#f6f1ea",["#ebe4da","#fffdf9","#e4dccf"],.4),23),
  pink:px((g,r)=>noise(g,r,"#e9b7c5",["#dfa7b7","#f2c9d3","#d99aaa"],.4),25),
  leaves:px((g,r)=>{noise(g,r,"#6f8f5e",["#5f7f52","#82a26d","#4f6b44"],.6);for(let i=0;i<14;i++){g.fillStyle="#3f5737";g.fillRect(Math.floor(r()*16),Math.floor(r()*16),1,1)}},27),
  lamp:px((g,r)=>{g.fillStyle="#d9a441";g.fillRect(0,0,16,16);g.fillStyle="#f3d27a";g.fillRect(2,2,12,12);g.fillStyle="#fff1c4";g.fillRect(5,5,6,6);for(let i=0;i<10;i++){g.fillStyle="#fff8dc";g.fillRect(2+Math.floor(r()*12),2+Math.floor(r()*12),1,1)}},29),
  heart:px((g,r)=>{noise(g,r,"#f2c9d3",["#e9b7c5","#f7dae1"],.35);g.fillStyle="#a8476b";["0110110","1111111","1111111","0111110","0011100","0001000"].forEach((row,y)=>[...row].forEach((c,x)=>{if(c==="1")g.fillRect(x+4,y+5,1,1)}));g.fillStyle="#f7dae1";g.fillRect(5,6,1,1)},31),
};
const FACES={grass:["grassSide","grassSide","grassTop","dirt","grassSide","grassSide"],log:["logSide","logSide","logTop","logTop","logSide","logSide"]};
const facesOf=k=>FACES[k]||Array(6).fill(k);

function starter(){const out=new Map(),put=(x,y,z,t)=>out.set(x+","+y+","+z,t);
  for(let x=-12;x<=12;x++)for(let z=-12;z<=12;z++)put(x,0,z,ID.grass);
  for(let x=-4;x<=4;x++)for(let z=-3;z<=3;z++)put(x,0,z,ID.planks);
  for(let y=1;y<=3;y++)for(let x=-4;x<=4;x++)for(let z=-3;z<=3;z++){
    if(Math.abs(x)!==4&&Math.abs(z)!==3)continue;
    if(z===3&&x===0&&y<=2)continue;
    let t=ID.planks;
    if(Math.abs(x)===4&&Math.abs(z)===3)t=ID.log;
    else if(y===2&&((Math.abs(z)===3&&Math.abs(x)===2)||(Math.abs(x)===4&&z===0)))t=ID.glass;
    put(x,y,z,t)}
  for(let x=-4;x<=4;x++)for(let z=-3;z<=3;z++)if(Math.abs(x)===4||Math.abs(z)===3)put(x,4,z,ID.log);
  put(0,3,3,ID.heart);
  put(-1,1,-2,ID.wool);put(0,1,-2,ID.wool);put(-1,1,-1,ID.pink);put(0,1,-1,ID.pink);
  put(2,1,-2,ID.lamp);put(-3,1,-2,ID.planks);
  for(let z=4;z<=9;z++)put(0,0,z,ID.stone);
  [[-2,5],[2,5],[-3,5],[3,5]].forEach(([x,z],i)=>put(x,1,z,i<2?ID.pink:ID.leaves));
  for(let y=1;y<=4;y++)put(7,y,-6,ID.log);
  for(let x=6;x<=8;x++)for(let z=-7;z<=-5;z++)for(let y=4;y<=5;y++)if(!(x===7&&z===-6&&y===4))put(x,y,z,ID.leaves);
  put(7,6,-6,ID.leaves);
  return out}

// ---------- the connection ----------
function SupaNet(){
  const sb=supabase.createClient(CONFIG.url,CONFIG.key,{auth:{persistSession:false,autoRefreshToken:false}});
  let S="",W="",ch=null,h=null;
  async function rpc(fn,args){const{data,error}=await sb.rpc(fn,Object.assign({p_secret:S,p_who:W},args||{}));
    if(error){const e=new Error(error.message);e.code=/secret word/i.test(error.message)?"bad_secret":"net";throw e}return data}
  const send=(event,payload)=>{if(ch)ch.send({type:"broadcast",event,payload}).catch(()=>{})};
  return{
    async enter(s,w){S=s;W=w;return rpc("home_enter")},
    seed:blocks=>rpc("home_seed",{p_blocks:blocks}),
    async setBlock(x,y,z,t){send("block",{x,y,z,t,who:W});await rpc("home_set_block",{p_x:x,p_y:y,p_z:z,p_t:t})},
    async addNote(x,y,z,body){const n=await rpc("home_add_note",{p_x:x,p_y:y,p_z:z,p_body:body});send("note",n);return n},
    async readNote(id){const n=await rpc("home_read_note",{p_id:id});send("note-read",{id,read_at:n&&n.read_at});return n},
    async delNote(id){await rpc("home_delete_note",{p_id:id});send("note-del",{id})},
    touch:()=>rpc("home_touch").catch(()=>{}),
    live(channel,handlers){h=handlers;if(ch)sb.removeChannel(ch);
      ch=sb.channel("home-"+channel,{config:{broadcast:{self:false},presence:{key:W}}});
      ["pos","block","note","note-read","note-del","emote"].forEach(ev=>ch.on("broadcast",{event:ev},({payload})=>h[ev]&&h[ev](payload)));
      ch.on("presence",{event:"sync"},()=>h.presence(Object.keys(ch.presenceState())));
      ch.subscribe(async st=>{h.status(st);if(st==="SUBSCRIBED"){try{await ch.track({who:W,at:Date.now()})}catch(_){}}})},
    sendPos:p=>send("pos",p), sendEmote:(k,extra)=>send("emote",Object.assign({who:W,k},extra||{})),
    leave(){if(ch){sb.removeChannel(ch);ch=null}}
  };
}
// a pretend connection for trying it out in two tabs: ?demo, word "demo"
function DemoNet(){
  const K="demo-home", bc=new BroadcastChannel("demo-home"); let W="",h=null,seen={},hb=null;
  const load=()=>{try{return JSON.parse(localStorage.getItem(K))||{blocks:[],notes:[],seen:{}}}catch(_){return{blocks:[],notes:[],seen:{}}}};
  const save=s=>localStorage.setItem(K,JSON.stringify(s));
  const post=(t,p)=>bc.postMessage({t,p,from:W});
  bc.onmessage=e=>{const m=e.data;if(!h||m.from===W)return;
    if(m.t==="here"){seen[m.from]=Date.now();h.presence(online())}else if(m.t==="bye"){delete seen[m.from];h.presence(online())}else if(h[m.t])h[m.t](m.p)};
  const online=()=>[W,...Object.keys(seen).filter(k=>Date.now()-seen[k]<5000)];
  return{
    async enter(s,w){await new Promise(r=>setTimeout(r,250));if(s!=="demo"){const e=new Error("wrong");e.code="bad_secret";throw e}W=w;const st=load();st.seen[w]=new Date().toISOString();save(st);
      return{channel:"demo",blocks:st.blocks,notes:st.notes,seen:st.seen}},
    async seed(blocks){const st=load();if(!st.blocks.length){st.blocks=blocks;save(st)}return st.blocks.length},
    async setBlock(x,y,z,t){post("block",{x,y,z,t,who:W});const st=load();st.blocks=st.blocks.filter(b=>!(b[0]===x&&b[1]===y&&b[2]===z));if(t!=null)st.blocks.push([x,y,z,t]);save(st)},
    async addNote(x,y,z,body){const n={id:Math.random().toString(36).slice(2),x,y,z,author:W,body,created_at:new Date().toISOString(),read_at:null};const st=load();st.notes.push(n);save(st);post("note",n);return n},
    async readNote(id){const st=load();const n=st.notes.find(n=>n.id===id);if(n&&n.author!==W&&!n.read_at){n.read_at=new Date().toISOString();save(st)}post("note-read",{id,read_at:n&&n.read_at});return n},
    async delNote(id){const st=load();st.notes=st.notes.filter(n=>n.id!==id);save(st);post("note-del",{id})},
    touch(){const st=load();st.seen[W]=new Date().toISOString();save(st)},
    live(_c,handlers){h=handlers;h.status("SUBSCRIBED");post("here");clearInterval(hb);hb=setInterval(()=>{post("here");h.presence(online())},2000);h.presence(online());addEventListener("pagehide",()=>post("bye"))},
    sendPos:p=>post("pos",p), sendEmote:(k,extra)=>post("emote",Object.assign({who:W,k},extra||{})), leave(){post("bye");clearInterval(hb)}
  };
}
const net=DEMO?DemoNet():(CONFIG.url&&CONFIG.key&&window.supabase?SupaNet():null);

// ---------- scene ----------
const T=THREE, cv=$("cv"), app=$("app");
if(touch) app.classList.remove("no-touch");
const renderer=new T.WebGLRenderer({canvas:cv,antialias:true});
renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
const scene=new T.Scene(),SKY=0xf3ddd6;scene.background=new T.Color(SKY);scene.fog=new T.Fog(SKY,40,95);
const camera=new T.PerspectiveCamera(55,1,.1,300);
scene.add(new T.HemisphereLight(0xfff6ee,0x7d8f6c,.62));
const sun=new T.DirectionalLight(0xffeedd,.78);sun.position.set(16,28,12);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);
Object.assign(sun.shadow.camera,{left:-20,right:20,top:20,bottom:-20,near:1,far:70});sun.shadow.bias=-.0008;scene.add(sun);
const texCache={};const tex=k=>{if(!texCache[k]){const t=new T.CanvasTexture(TX[k]);t.magFilter=T.NearestFilter;t.minFilter=T.NearestFilter;texCache[k]=t}return texCache[k]};
const geo=new T.BoxGeometry(1,1,1),CAP=5000,meshes=[],lists=B.map(()=>[]),dummy=new T.Object3D();
B.forEach((b,i)=>{const k=b[1];const ms=facesOf(k).map(f=>new T.MeshLambertMaterial({map:tex(f),transparent:k==="glass",opacity:k==="glass"?.55:1,depthWrite:k!=="glass",emissive:k==="lamp"?0x7a5a10:0}));
  const m=new T.InstancedMesh(geo,ms,CAP);m.count=0;m.castShadow=k!=="glass";m.receiveShadow=true;m.frustumCulled=false;m.userData.t=i;if(k==="glass")m.renderOrder=2;scene.add(m);meshes.push(m)});
let world=new Map();
const K=(x,y,z)=>x+","+y+","+z;
function rebuild(){lists.forEach(l=>l.length=0);world.forEach((t,key)=>{if(lists[t])lists[t].push(key)});
  meshes.forEach((m,i)=>{const l=lists[i];m.count=Math.min(l.length,CAP);for(let j=0;j<m.count;j++){const [x,y,z]=l[j].split(",").map(Number);dummy.position.set(x,y,z);dummy.updateMatrix();m.setMatrixAt(j,dummy.matrix)}m.instanceMatrix.needsUpdate=true})}

// people
function nameTag(name,color){const c=document.createElement("canvas");c.width=192;c.height=56;const g=c.getContext("2d");
  g.fillStyle="rgba(255,253,249,.95)";g.fillRect(8,8,176,40);g.strokeStyle="#b8935c";g.lineWidth=1.5;g.strokeRect(12,12,168,32);
  g.fillStyle=color;g.font="italic 500 28px 'Cormorant Garamond',Georgia,serif";g.textAlign="center";g.textBaseline="middle";g.fillText(name,96,29);
  const t=new T.CanvasTexture(c);const s=new T.Sprite(new T.SpriteMaterial({map:t,transparent:true,depthTest:false}));s.scale.set(1.15,.34,1);s.renderOrder=5;return s}
function person(o){const g=new T.Group(),body=new T.Group();g.add(body);const gold_=()=>new T.MeshLambertMaterial({color:0xd9b46a,emissive:0x3a2a08});const m=c=>new T.MeshLambertMaterial({color:c}),sk=m(o.skin),sh=m(o.shirt),pa=m(o.pants),ha=m(o.hair);
  const part=(w,h,d,mt,x,y,z,p=body)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),mt);b.position.set(x,y,z);b.castShadow=true;p.add(b);return b};
  const limb=(mt,x,y,len,w)=>{const p=new T.Group();p.position.set(x,y,0);body.add(p);part(w,len,w,mt,0,-len/2,0,p);return p};
  let legL,legR,armL,armR;
  if(o.buff){
    // Baji: a fitted black tee on a broad chest, chain and watch, light-wash baggy jeans, clean white sneakers
    const tee=m(0x1f1f24),tee2=m(0x2a2a31),denim=m(0x8da2bd),denim2=m(0x7a8faa),white=m(0xf4f2ee),gum=m(0xd9d4cc),blk=m(0x141418),
      silver=new T.MeshLambertMaterial({color:0xd8d8de,emissive:0x2a2a30});
    const leg=sd=>{const p=new T.Group();p.position.set(sd*.25,1.12,0);body.add(p);
      part(.48,.98,.5,denim,0,-.49,0,p);part(.06,.3,.3,denim2,sd*.25,-.42,.02,p);part(.5,.08,.52,denim2,0,-.94,0,p);
      part(.46,.18,.62,white,0,-1.03,.06,p);part(.48,.06,.64,gum,0,-1.09,.06,p);part(.02,.07,.26,blk,sd*.235,-1.02,.06,p);part(.28,.03,.22,m(0xdedbd6),0,-.935,.2,p);return p};
    legL=leg(-1);legR=leg(1);
    part(1,.1,.56,blk,0,1.17,0);part(.14,.09,.04,silver,0,1.17,.29);
    part(.92,.4,.52,tee,0,1.42,0);
    part(1.22,.62,.6,tee,0,1.92,0);part(.46,.22,.05,tee2,-.26,2.02,.31);part(.46,.22,.05,tee2,.26,2.02,.31);
    part(.34,.3,.54,tee,-.68,2.08,0);part(.34,.3,.54,tee,.68,2.08,0);
    part(.42,.2,.4,sk,0,2.3,0);part(.3,.08,.04,sk,0,2.2,.3);
    part(.46,.03,.44,silver,0,2.22,0);part(.06,.09,.03,silver,0,2.1,.32);
    const arm=(sd,watch)=>{const p=new T.Group();p.position.set(sd*.8,2.16,0);body.add(p);
      part(.52,.34,.52,tee,0,-.17,0,p);part(.5,.32,.5,sk,0,-.5,0,p);part(.44,.42,.44,sk,0,-.86,0,p);part(.4,.18,.42,sk,0,-1.13,.01,p);
      if(watch){part(.47,.09,.47,blk,0,-.98,0,p);part(.03,.12,.14,silver,sd*.25,-.98,0,p)}return p};
    armL=arm(-1,true);armR=arm(1,false);
  }else if(o.street){
    // Anujin: lavender cropped baby tee, black baggy cargos with a chain, all-black Docs, tattooed arms
    const tee=m(0xc9b8e6),cargo=m(0x1f1c22),cargo2=m(0x2b2730),boot=m(0x141016),sole=m(0x0b0809),stitch=m(0x2e2a31),
      silver=new T.MeshLambertMaterial({color:0xd8d8de,emissive:0x2a2a30});
    const inkTex=draw=>{const c=document.createElement("canvas");c.width=16;c.height=32;const k=c.getContext("2d");k.fillStyle=o.skinCss;k.fillRect(0,0,16,32);k.fillStyle="rgba(30,26,34,.85)";
      draw((...r)=>{for(let j=0;j<r.length;j+=2)k.fillRect(r[j],r[j+1],1,1)});const t=new T.CanvasTexture(c);t.magFilter=T.NearestFilter;return new T.MeshLambertMaterial({map:t})};
    const inkL=inkTex(d=>{d(6,3,7,3,8,3,5,4,9,4,5,5,7,5,9,5,6,6,8,6,7,7,7,8,6,9,8,10,5,11,9,12,4,13,10,14,4,15,11,16,5,17,12,18,  // rose and its vine
      11,22,10,23,11,23,12,23,11,24, 3,22,5,22,3,23,4,23,5,23,4,24, 2,28,3,28,4,28,5,28,6,28,7,28,8,28,9,28,10,28,11,28,12,28,13,28)}); // star, heart, wrist band
    const inkR=inkTex(d=>{d(5,4,6,5,7,6,9,6,10,5,11,4,5,6,6,7,10,7,11,6,8,6,8,7,8,8,6,8,10,8,  // butterfly
      4,13,5,13,6,14,7,14,8,13,9,13,10,14,11,14,  4,16,6,16,8,16,10,16,  // script
      10,21,9,22,9,23,9,24,10,25,11,25, 3,27,3,28,3,29, 2,28,4,28)}); // moon, sparkle
    const leg=sd=>{const p=new T.Group();p.position.set(sd*.23,1.02,0);body.add(p);
      part(.42,.76,.44,cargo,0,-.38,0,p);part(.06,.24,.26,cargo2,sd*.23,-.36,.02,p);part(.44,.05,.46,cargo2,0,-.74,0,p);
      part(.38,.3,.52,boot,0,-.86,.04,p);part(.42,.08,.6,sole,0,-1.04,.05,p);part(.43,.025,.61,stitch,0,-.99,.05,p);part(.12,.12,.03,stitch,0,-.72,-.235,p);
      part(.14,.2,.02,cargo2,0,-.8,.3,p);return p};
    legL=leg(-1);legR=leg(1);
    part(.86,.16,.5,cargo,0,1.06,0);part(.88,.05,.52,cargo2,0,1.12,0);
    [[-.34,1.0],[-.27,.95],[-.19,.93],[-.11,.95],[-.04,1.0]].forEach(([cx,cy])=>part(.05,.05,.05,silver,cx,cy,.27));
    part(.7,.18,.42,sk,0,1.23,0);
    part(.86,.52,.48,tee,0,1.58,0);part(.88,.06,.5,m(0xb6a2d8),0,1.34,0);part(.06,.05,.02,m(0x8c2f4a),.15,1.66,.25);part(.06,.05,.02,m(0x8c2f4a),.22,1.66,.25);part(.12,.05,.02,m(0x8c2f4a),.185,1.62,.25);part(.05,.04,.02,m(0x8c2f4a),.185,1.585,.25);
    part(.3,.12,.3,sk,0,1.9,0);part(.32,.03,.32,silver,0,1.86,0);part(.05,.06,.03,silver,0,1.8,.17);
    const arm=(sd,ink)=>{const p=new T.Group();p.position.set(sd*.59,1.8,0);body.add(p);part(.36,.26,.36,tee,0,-.12,0,p);part(.3,.66,.3,ink,0,-.58,0,p);part(.06,.06,.06,silver,sd*.1,-.9,.13,p);return p};
    armL=arm(-1,inkL);armR=arm(1,inkR);
  }else{
    legL=limb(pa,-.24,.95,.95,.46);legR=limb(pa,.24,.95,.95,.46);part(1.02,1,.52,sh,0,1.45,0);
    armL=limb(sh,-.73,1.92,.95,.42);armR=limb(sh,.73,1.92,.95,.42);part(.42,.2,.42,sk,0,-.92,0,armL);part(.42,.2,.42,sk,0,-.92,0,armR);
  }
  const c=document.createElement("canvas");c.width=c.height=32;const x=c.getContext("2d");if(!o.street&&!o.buff){x.fillStyle=o.skinCss;x.fillRect(0,0,32,32);x.fillStyle="#2b2026";x.fillRect(9,11,4,6);x.fillRect(19,11,4,6);
  x.strokeStyle="#2b2026";x.lineWidth=2;x.beginPath();x.arc(16,17,6,.35,Math.PI-.35);x.stroke();x.fillStyle="rgba(200,100,130,.45)";x.fillRect(5,19,4,2);x.fillRect(23,19,4,2);}
  if(o.buff){x.fillStyle=o.skinCss;x.fillRect(0,0,32,32);
    const px_=(c,...r)=>{x.fillStyle=c;for(let i=0;i<r.length;i+=4)x.fillRect(r[i],r[i+1],r[i+2],r[i+3])};
    px_("#1c1410",7,9,6,2,19,9,6,2,6,10,1,1,25,10,1,1);
    px_("#fffdf9",9,13,4,3,19,13,4,3);px_("#2b1d14",10,13,3,3,20,13,3,3);px_("#120c0a",11,14,1,1,21,14,1,1);px_("#fffdf9",10,13,1,1,20,13,1,1);
    px_("#d6a982",15,16,2,4,14,19,4,1);
    px_("#5a2f2a",12,22,8,1,20,21,1,1);px_("#a86a5a",13,23,6,1);
  }
  if(o.street){x.fillStyle="#f1c9a5";x.fillRect(0,0,32,32);
    const px_=(c,...r)=>{x.fillStyle=c;for(let i=0;i<r.length;i+=4)x.fillRect(r[i],r[i+1],r[i+2],r[i+3])};
    px_("#3a2418",9,12,4,5,19,12,4,5);px_("#1a1014",10,13,2,3,20,13,2,3);px_("#fffdf9",10,13,1,1,20,13,1,1,12,15,1,1,22,15,1,1);
    px_("#1a1014",8,11,6,1,18,11,6,1,7,10,1,1,6,9,1,1,24,10,1,1,25,9,1,1,8,17,1,1,23,17,1,1);
    px_("rgba(222,120,150,.45)",5,18,4,2,23,18,4,2);px_("#e2b08f",15,18,2,1);
    px_("#9a3a50",12,21,1,1,19,21,1,1,13,22,6,1);px_("#b85068",14,23,4,1);
  }

  const ft=new T.CanvasTexture(c);ft.magFilter=T.NearestFilter;
  const hs=o.headS||.72,head=new T.Mesh(new T.BoxGeometry(hs,hs,hs),[sk,sk,sk,sk,new T.MeshLambertMaterial({map:ft}),sk]);head.position.y=o.headY||2.32;head.castShadow=true;body.add(head);
  if(o.buff){
    // textured crop: volume and a lifted fringe on top, a tight fade on the sides
    const fade=m(0x4a3a32);
    part(.82,.2,.82,ha,0,3.2,0);part(.6,.1,.56,ha,.04,3.33,.04);part(.22,.08,.22,ha,-.2,3.34,-.14);part(.18,.07,.2,ha,.24,3.32,.18);
    const fr=part(.8,.14,.16,ha,0,3.2,.37);fr.rotation.x=.3;part(.3,.08,.1,ha,-.18,3.29,.43);
    [-1,1].forEach(sd=>{part(.05,.2,.76,ha,sd*.39,3.04,0);part(.04,.12,.7,fade,sd*.385,2.88,-.01);part(.07,.17,.12,sk,sd*.395,2.76,.04)});
    part(.8,.28,.06,ha,0,3.0,-.4);part(.78,.1,.05,fade,0,2.82,-.395);
    // glasses: thin black rectangular frames, a bridge, arms back to the ears, a faint lens
    const fr_=m(0x18161a),lens=new T.MeshLambertMaterial({color:0xdfeaf2,transparent:true,opacity:.18,depthWrite:false});
    [-1,1].forEach(sd=>{const cx=sd*.118;
      part(.17,.025,.03,fr_,cx,2.9,.395);part(.17,.025,.03,fr_,cx,2.757,.395);part(.025,.168,.03,fr_,cx-.085,2.828,.395);part(.025,.168,.03,fr_,cx+.085,2.828,.395);
      part(.15,.12,.01,lens,cx,2.828,.392);part(.025,.03,.4,fr_,sd*.392,2.88,.19)});
    part(.07,.022,.03,fr_,0,2.86,.395);
  }else if(o.street){
    // wolf cut: volume at the crown, blunt bangs, choppy layers to the shoulders, ears out with piercings
    const silver=new T.MeshLambertMaterial({color:0xd8d8de,emissive:0x2a2a30});
    part(.82,.2,.82,ha,0,2.75,0);part(.62,.08,.6,ha,-.04,2.88,-.04);part(.3,.06,.3,ha,.14,2.94,.06);
    part(.76,.2,.09,ha,0,2.58,.39);part(.1,.07,.09,ha,-.22,2.45,.39);part(.12,.06,.09,ha,.12,2.46,.39);part(.08,.05,.09,ha,.3,2.47,.39);
    [-1,1].forEach(sd=>{
      part(.1,.3,.76,ha,sd*.41,2.53,-.01);                                   // temple: hair over the whole side above the ear
      part(.1,.5,.13,ha,sd*.405,2.33,.3);part(.08,.12,.1,ha,sd*.4,2.04,.28);  // face-framing piece down to the jaw
      part(.07,.17,.12,sk,sd*.375,2.25,.08);                                 // ear
      part(.12,.56,.36,ha,sd*.41,2.18,-.2);part(.12,.3,.22,ha,sd*.4,1.8,-.25);part(.1,.16,.12,ha,sd*.39,1.6,-.2);part(.1,.1,.1,ha,sd*.4,1.66,-.06); // layers behind the ear
      part(.04,.04,.04,silver,sd*.415,2.33,.08);part(.04,.04,.04,silver,sd*.415,2.25,.12);part(.04,.04,.04,silver,sd*.415,2.18,.11);
      part(.03,.1,.03,silver,sd*.415,2.08,.1);part(.03,.03,.07,silver,sd*.415,2.03,.09)});
    part(.82,.78,.18,ha,0,2.32,-.36);part(.66,.3,.16,ha,0,1.8,-.34);
    part(.14,.16,.12,ha,-.25,1.6,-.33);part(.12,.2,.12,ha,.06,1.56,-.34);part(.14,.12,.12,ha,.27,1.62,-.33);
  }else{
  part(.78,.2,.78,ha,0,2.72,0);if(o.long)part(.78,.95,.2,ha,0,2.25,-.33);else part(.78,.3,.16,ha,0,2.55,-.32);if(o.bow)part(.34,.18,.12,m(0xe9c6cf),.28,2.82,-.28);}
  body.scale.setScalar(o.scale||.66);const tag=nameTag(o.name,o.tag);tag.position.y=o.tagY||2.2;g.add(tag);scene.add(g);
  return{g,body,legL,legR,armL,armR}}
const LOOK={Anujin:{name:"Anujin",skin:0xf1c9a5,skinCss:"#f1c9a5",shirt:0xc9b8e6,pants:0x1f1c22,hair:0x1d1411,street:true,tag:"#a8476b"},
  Baji:{name:"Baji",skin:0xe9bf98,skinCss:"#e9bf98",shirt:0x1f1f24,pants:0x8da2bd,hair:0x1c1410,buff:true,scale:.63,headY:2.78,headS:.76,tagY:2.38,tag:"#41577a"}};
const people={Anujin:person(LOOK.Anujin),Baji:person(LOOK.Baji)};
Object.values(people).forEach(p=>p.g.visible=false);
people.Baji.lean=.24;people.Anujin.lean=.13;people.Anujin.lift=.12; // he leans down, she goes up on her toes

// our little girl, Urii: twin tails, a purple dress. When nobody is playing her, her walk is timed by the clock, so she's in the same spot on every phone;
// when someone comes home as Urii, she's theirs to walk around. Tap her for a hop and hearts
const KID=(function(){
  const g=new T.Group(),body=new T.Group();g.add(body);
  const m=c=>new T.MeshLambertMaterial({color:c}),sk=m(0xf3cfae),dress=m(0x8e5aa8),skirt=m(0x7a4794),collar=m(0xfffdf9),tights=m(0xfaf6ef),shoe=m(0x8c2f4a),hair=m(0x2b1d18),bow=m(0xa8476b);
  const part=(w,h,d,mt,x,y,z,p=body)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),mt);b.position.set(x,y,z);b.castShadow=true;p.add(b);return b};
  const limb=(mt,x,y,len,w,end)=>{const p=new T.Group();p.position.set(x,y,0);body.add(p);part(w,len,w,mt,0,-len/2,0,p);if(end)part(w+.03,.15,w+.08,end,0,-len+.07,.03,p);return p};
  const legL=limb(tights,-.17,.62,.62,.3,shoe),legR=limb(tights,.17,.62,.62,.3,shoe);
  part(1,.36,.68,skirt,0,.62,0);part(.78,.5,.46,dress,0,1.02,0);part(.8,.08,.48,collar,0,1.26,0);
  const armL=limb(dress,-.52,1.22,.5,.26,sk),armR=limb(dress,.52,1.22,.5,.26,sk);
  const c=document.createElement("canvas");c.width=c.height=32;const x=c.getContext("2d");x.fillStyle="#f3cfae";x.fillRect(0,0,32,32);
  x.fillStyle="#2b2026";x.fillRect(8,13,5,7);x.fillRect(19,13,5,7);x.fillStyle="#fffdf9";x.fillRect(9,14,2,2);x.fillRect(20,14,2,2);
  x.strokeStyle="#2b2026";x.lineWidth=2;x.beginPath();x.arc(16,21,4,.4,Math.PI-.4);x.stroke();x.fillStyle="rgba(214,110,140,.55)";x.fillRect(3,21,5,3);x.fillRect(24,21,5,3);
  const ft=new T.CanvasTexture(c);ft.magFilter=T.NearestFilter;
  const head=new T.Mesh(new T.BoxGeometry(.8,.8,.8),[sk,sk,sk,sk,new T.MeshLambertMaterial({map:ft}),sk]);head.position.y=1.7;head.castShadow=true;body.add(head);
  part(.86,.2,.86,hair,0,2.12,0);part(.86,.66,.18,hair,0,1.82,-.36);part(.86,.14,.07,hair,0,2.0,.42);
  part(.08,.3,.5,hair,-.42,1.88,.08);part(.08,.3,.5,hair,.42,1.88,.08);
  const tails=[-1,1].map(sd=>{const t=new T.Group();t.position.set(sd*.47,1.98,-.08);body.add(t);
    part(.3,.16,.12,bow,0,.02,0,t);part(.14,.14,.16,bow,0,.02,0,t);
    part(.26,.5,.26,hair,0,-.3,0,t);part(.2,.22,.2,hair,0,-.62,0,t);t.userData.sd=sd;return t});
  body.scale.setScalar(.6);
  const hit=new T.Mesh(new T.BoxGeometry(1,1.5,1),new T.MeshBasicMaterial({visible:false}));hit.position.y=.75;g.add(hit);
  const tag=nameTag("Urii","#7a4794");tag.position.y=1.62;tag.scale.multiplyScalar(.85);g.add(tag);
  scene.add(g);

  // her loop: [x, z, seconds she stops there]
  const R=[[0,8,3],[0,4.4],[0,1.8],[1.4,-1.2,4],[0,1.8],[0,4.4],[0,7],[5.5,7],[6,-4.4,4],[2,-7.5],[-6.5,-6.5,3],[-7,4],[-4,8]],SPEED=1.5;
  const segs=[];let period=0;
  R.forEach((a,i)=>{const b=R[(i+1)%R.length];if(a[2]){segs.push({t0:period,d:a[2],a,b:a,stop:true});period+=a[2]}
    const d=Math.hypot(b[0]-a[0],b[1]-a[1])/SPEED;segs.push({t0:period,d,a,b});period+=d});
  function where(sec){const u=((sec%period)+period)%period;let s=segs[segs.length-1];for(const x of segs)if(u>=x.t0&&u<x.t0+x.d){s=x;break}
    const k=s.stop?0:(u-s.t0)/s.d;return{x:s.a[0]+(s.b[0]-s.a[0])*k,z:s.a[1]+(s.b[1]-s.a[1])*k,moving:!s.stop,yaw:s.stop?null:Math.atan2(s.b[0]-s.a[0],s.b[1]-s.a[1])}}
  function standAt(px_,pz){const cx=Math.round(px_),cz=Math.round(pz);let y=1;while(y<22&&solidAt(cx,y,cz))y++;return y-.5}
  let yaw=Math.PI,ky=.5,hopAt=-1e9,ready=false;
  const tailSway=(tt,moving,hop)=>tails.forEach(t=>{const sd=t.userData.sd;t.rotation.z=sd*(.42+(moving?Math.sin(tt*12+sd)*.14:Math.sin(tt*1.6+sd)*.05)+(hop?.35:0));t.rotation.x=moving?Math.sin(tt*6)*.12:0});
  // someone is playing her: on their own phone (me), or on another phone and still here
  const playing=()=>me==="Urii"||(online.has("Urii")&&!!remote.Urii);
  function update(dt,tt,now){
    const hopT=(now-hopAt)/1000,hop=hopT<.55?Math.sin(hopT/.55*Math.PI)*.7:0;
    body.position.y=hop;
    if(playing()){
      // where she is and how her legs move is handled like any other person; here just her twin tails and the hop
      const moving=me==="Urii"?myMoving:!!(remote.Urii&&remote.Urii.moving&&now-remote.Urii.at<600);
      if(hop){armL.rotation.x=0;armR.rotation.x=0;armL.rotation.z=-2.6;armR.rotation.z=2.6+Math.sin(tt*9)*.4}
      yaw=g.rotation.y;ready=false;tailSway(tt,moving,hop);return}
    const w=where(Date.now()/1000),gy=standAt(w.x,w.z);
    if(!ready){ky=gy;ready=true}ky+=(gy-ky)*Math.min(1,dt*10);
    g.position.set(w.x,ky,w.z);
    // she turns to whoever is closest when she stops, and waves at you when you're right by her
    let look=w.yaw,near=null,nd=4.5;
    Object.values(people).forEach(p=>{if(p===people.Urii||!p.g.visible)return;const d=Math.hypot(p.g.position.x-w.x,p.g.position.z-w.z);if(d<nd){nd=d;near=p}});
    if(look==null)look=near?Math.atan2(near.g.position.x-w.x,near.g.position.z-w.z):yaw;
    let d=look-yaw;d=Math.atan2(Math.sin(d),Math.cos(d));yaw+=d*Math.min(1,dt*6);g.rotation.y=yaw;
    const sw=w.moving?Math.sin(tt*12)*.75:0;legL.rotation.x=sw;legR.rotation.x=-sw;armL.rotation.x=-sw*.8;
    const mine=me&&people[me],close=mine&&mine.g.visible&&Math.hypot(mine.g.position.x-w.x,mine.g.position.z-w.z)<2.6;
    if(close||hop){armR.rotation.x=0;armR.rotation.z=2.6+Math.sin(tt*9)*.4}else{armR.rotation.z=0;armR.rotation.x=sw*.8}
    if(hop){armL.rotation.x=0;armL.rotation.z=-2.6}else armL.rotation.z=0;
    tailSway(tt,w.moving,hop)}
  function cheer(){const now=performance.now();if(now-hopAt<450)return;hopAt=now;burst({x:g.position.x,y:g.position.y-.5,z:g.position.z})}
  return{g,body,legL,legR,armL,armR,hit,update,cheer,playing};
})();
people.Urii=KID; // she's always in the house, so she stays visible

// letters in the world
const envMat=new T.MeshLambertMaterial({color:0xfffdf9}),sealMat=new T.MeshLambertMaterial({color:0x8c2f4a,emissive:0x2a0610});
const envGeo=new T.BoxGeometry(.8,.54,.08),sealGeo=new T.CylinderGeometry(.1,.1,.03,16),flapGeo=new T.BoxGeometry(.8,.025,.08);
const heartTex=(()=>{const c=document.createElement("canvas");c.width=c.height=32;const g=c.getContext("2d");g.fillStyle="#c06a86";g.beginPath();g.moveTo(16,28);g.bezierCurveTo(2,18,2,6,10,6);g.bezierCurveTo(14,6,16,9,16,11);g.bezierCurveTo(16,9,18,6,22,6);g.bezierCurveTo(30,6,30,18,16,28);g.fill();return new T.CanvasTexture(c)})();
let notes=[];const noteObjs=new Map();
function noteMesh(n){const g=new T.Group();const e=new T.Mesh(envGeo,envMat);e.castShadow=true;g.add(e);
  const s=new T.Mesh(sealGeo,sealMat);s.rotation.x=Math.PI/2;s.position.z=.05;g.add(s);
  const f1=new T.Mesh(flapGeo,new T.MeshBasicMaterial({color:0xd9c7a8}));f1.scale.x=.62;f1.position.set(-.12,.08,.04);f1.rotation.z=-.6;g.add(f1);
  const f2=f1.clone();f2.position.x=.12;f2.rotation.z=.6;g.add(f2);
  const hs=new T.Sprite(new T.SpriteMaterial({map:heartTex,transparent:true,depthTest:false}));hs.scale.set(.32,.32,1);hs.position.y=.5;hs.renderOrder=4;g.add(hs);
  g.position.set(n.x,n.y,n.z);g.userData={id:n.id,heart:hs,phase:Math.random()*6};e.userData.noteId=n.id;s.userData.noteId=n.id;scene.add(g);return g}
function syncNotes(){const ids=new Set(notes.map(n=>n.id));
  noteObjs.forEach((g,id)=>{if(!ids.has(id)){scene.remove(g);noteObjs.delete(id)}});
  notes.forEach(n=>{if(!noteObjs.has(n.id))noteObjs.set(n.id,noteMesh(n));noteObjs.get(n.id).userData.heart.visible=isUnread(n)});
  const u=notes.filter(isUnread).length;$("badge").hidden=!u;$("badge").textContent=u}
// letters are between Anujin and Baji: when Urii is playing she doesn't see them, open them or mark them read
let me="";const isUnread=n=>!!other(me)&&n.author!==me&&!n.read_at;

let hearts=[];
function burst(p){for(let i=0;i<14;i++){const s=new T.Sprite(new T.SpriteMaterial({map:heartTex,transparent:true,depthTest:false}));s.renderOrder=6;const a=Math.random()*6.28,r=Math.random()*.7,sc=.22+Math.random()*.25;
  s.position.set(p.x+Math.cos(a)*r,p.y+1.6+Math.random()*.6,p.z+Math.sin(a)*r);s.scale.set(sc,sc,1);scene.add(s);hearts.push({s,vy:.9+Math.random()*1.2,born:performance.now()+Math.random()*300})}}

// ---------- me: walking with simple block physics ----------
const P={x:0,y:.5,z:6,vy:0,yaw:Math.PI,ground:false};
const HW=.28,HH=1.7;
const solidAt=(x,y,z)=>world.has(K(x,y,z));
function hits(px_,py,pz){const x0=Math.floor(px_-HW+.5),x1=Math.floor(px_+HW+.5-1e-6),y0=Math.floor(py+.5),y1=Math.floor(py+HH+.5-1e-6),z0=Math.floor(pz-HW+.5),z1=Math.floor(pz+HW+.5-1e-6);
  for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)if(solidAt(x,y,z))return true;return false}
let myMoving=false;
function spawn(){const sx=me==="Anujin"?-.6:me==="Baji"?.6:0;Object.assign(P,{x:sx,y:.5,z:6.2,vy:0,yaw:Math.PI});while(hits(P.x,P.y,P.z)&&P.y<30)P.y+=1}
function moveAxis(ax,d){if(!d)return;P[ax]+=d;if(!hits(P.x,P.y,P.z))return;
  if(P.ground&&!hits(P.x,P.y+1,P.z)){P.y+=1;return} // step up one block
  P[ax]-=d}

// ---------- modes, cameras ----------
let mode="walk",camYaw=0,camPitch=.42,camDist=8;let bYaw=.55,bPitch=.62,bDist=24;const bTarget=new T.Vector3(0,2.5,0);
function setMode(m){mode=m;document.querySelectorAll("[data-mode]").forEach(b=>{const on=b.dataset.mode===m;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on?"true":"false")});
  $("walkUI").hidden=m!=="walk";$("buildUI").hidden=m!=="build";$("nearBtn").hidden=true;keys.clear();joy.x=joy.y=0;
  if(m==="build"){bTarget.set(P.x*.5,2.5,P.z*.5);showHint(touch?"Tap to place · drag to turn · pinch to zoom":"Click to place · right-click to break · drag to turn · scroll to zoom")}
  else if(me==="Urii")showHint(touch?"Joystick to walk · tap Jump · tap the heart":"WASD to walk · space to jump · H for hearts")
  else showHint(touch?"Joystick to walk · drag to look around":"WASD to walk · space to jump · F to swing · H for hearts · K to kiss")}
document.querySelectorAll("[data-mode]").forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
let hintT=null;function showHint(t){const h=$("hint");h.textContent=t;h.classList.remove("gone");clearTimeout(hintT);hintT=setTimeout(()=>h.classList.add("gone"),4500)}

// build tools
let tool="place",cur=0;const LETTER=-1;const undo=[];
const bar=$("bar");
bar.innerHTML=`<button type="button" role="option" class="slot letter" data-b="-1" aria-label="Leave a letter"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true"><rect x="3" y="5.5" width="18" height="13" rx="1"/><path d="M3.5 6.5l8.5 6.5 8.5-6.5"/></svg></button>`+
  B.map((b,i)=>`<button type="button" role="option" class="slot${i?"":" on"}" data-b="${i}" aria-label="${b[0]}" style="background-image:url(${TX[facesOf(b[1])[4]].toDataURL()})"></button>`).join("");
function choose(i){cur=i;bar.querySelectorAll(".slot").forEach(s=>{const on=+s.dataset.b===i;s.classList.toggle("on",on);s.setAttribute("aria-selected",on?"true":"false")});
  $("label").textContent=i===LETTER?"Letter · tap where to leave it":B[i][0];if(tool!=="place")setTool("place")}
function setTool(t){tool=t;document.querySelectorAll("[data-tool]").forEach(b=>{const on=b.dataset.tool===t;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on?"true":"false")});$("label").textContent=t==="break"?"Break · tap a block to remove it":(cur===LETTER?"Letter · tap where to leave it":B[cur][0])}
bar.querySelectorAll(".slot").forEach(s=>s.onclick=()=>choose(+s.dataset.b));
document.querySelectorAll("[data-tool]").forEach(b=>b.onclick=()=>setTool(b.dataset.tool));
choose(0);
const inBounds=(x,y,z)=>Math.abs(x)<=12&&Math.abs(z)<=12&&y>=0&&y<=20;
function setBlock(x,y,z,t,remember=true){const k=K(x,y,z),before=world.has(k)?world.get(k):null;if(before===t)return;
  if(t==null)world.delete(k);else world.set(k,t);rebuild();
  if(remember){undo.push([x,y,z,before]);if(undo.length>60)undo.shift();$("undoBtn").disabled=false}
  if(net)net.setBlock(x,y,z,t).catch(()=>toast("That block didn't save. Check your connection."));
  if(hits(P.x,P.y,P.z))P.y=Math.max(P.y,y+.5)}
$("undoBtn").onclick=()=>{const u=undo.pop();if(!u)return;setBlock(u[0],u[1],u[2],u[3],false);$("undoBtn").disabled=!undo.length};

const ray=new T.Raycaster(),ndc=new T.Vector2();
function aim(cx,cy){const r=cv.getBoundingClientRect();ndc.set((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height)*2+1);ray.setFromCamera(ndc,camera)}
function pickNote(){const objs=[];noteObjs.forEach(g=>g.children.forEach(c=>{if(c.userData.noteId)objs.push(c)}));const h=ray.intersectObjects(objs,false)[0];return h?h.object.userData.noteId:null}
function pickBlock(){const h=ray.intersectObjects(meshes,false)[0];if(!h||h.instanceId==null)return null;const key=lists[h.object.userData.t][h.instanceId];if(!key)return null;
  const [x,y,z]=key.split(",").map(Number),n=h.face.normal;return{x,y,z,nx:x+Math.round(n.x),ny:y+Math.round(n.y),nz:z+Math.round(n.z)}}
function tap(cx,cy,alt){aim(cx,cy);const nid=other(me)?pickNote():null;if(nid){openLetter(nid);return}
  const kh=ray.intersectObject(KID.hit,false)[0];if(kh){const bh=mode==="build"?ray.intersectObjects(meshes,false)[0]:null;if(!bh||kh.distance<bh.distance){KID.cheer();if(net&&me)net.sendEmote("kid");buzz();return}}
  if(mode!=="build")return;const p=pickBlock();if(!p)return;
  if(tool==="break"||alt){setBlock(p.x,p.y,p.z,null);buzz();return}
  if(!inBounds(p.nx,p.ny,p.nz)||world.has(K(p.nx,p.ny,p.nz)))return;
  if(cur===LETTER){compose({x:p.nx,y:p.ny,z:p.nz});return}
  setBlock(p.nx,p.ny,p.nz,cur);buzz()}
const buzz=()=>{if(navigator.vibrate)try{navigator.vibrate(8)}catch(_){}};

// ---------- input ----------
const keys=new Set();const joy={x:0,y:0,id:null};let wantJump=false;
const KEYS={KeyW:"f",ArrowUp:"f",KeyS:"b",ArrowDown:"b",KeyA:"l",ArrowLeft:"l",KeyD:"r",ArrowRight:"r"};
addEventListener("keydown",e=>{if(!$("sheet").hidden||!$("enter").hidden||e.target.closest("input,textarea"))return;
  if(KEYS[e.code]&&mode==="walk"){keys.add(KEYS[e.code]);e.preventDefault()}
  else if(e.code==="Space"&&mode==="walk"){wantJump=true;e.preventDefault()}
  else if(e.code==="KeyH")hearts_();
  else if(e.code==="KeyK")kissNow();
  else if(e.code==="KeyF"&&mode==="walk")swing();
  else if(e.code==="KeyB")setMode(mode==="walk"?"build":"walk");
  else if(e.code==="KeyE"&&nearId)openLetter(nearId);
  else if(mode==="build"&&/^Digit[1-9]$/.test(e.code)){const n=+e.code.slice(5)-1;if(B[n])choose(n)}
  else if(mode==="build"&&(e.ctrlKey||e.metaKey)&&e.code==="KeyZ"){e.preventDefault();$("undoBtn").click()}});
addEventListener("keyup",e=>{if(KEYS[e.code])keys.delete(KEYS[e.code])});
addEventListener("blur",()=>keys.clear());
const joyEl=$("joy"),knob=joyEl.firstElementChild;
function joyMove(e){const r=joyEl.getBoundingClientRect();let dx=e.clientX-(r.left+r.width/2),dy=e.clientY-(r.top+r.height/2);const m=Math.hypot(dx,dy),mx=44;if(m>mx){dx*=mx/m;dy*=mx/m}joy.x=dx/mx;joy.y=dy/mx;knob.style.transform=`translate(${dx}px,${dy}px)`}
joyEl.addEventListener("pointerdown",e=>{e.preventDefault();joy.id=e.pointerId;try{joyEl.setPointerCapture(e.pointerId)}catch(_){}joyMove(e)});
joyEl.addEventListener("pointermove",e=>{if(e.pointerId===joy.id)joyMove(e)});
const joyEnd=e=>{if(e.pointerId!==joy.id)return;joy.id=null;joy.x=joy.y=0;knob.style.transform=""};
joyEl.addEventListener("pointerup",joyEnd);joyEl.addEventListener("pointercancel",joyEnd);
$("jumpBtn").addEventListener("pointerdown",e=>{e.preventDefault();wantJump=true});
// ---------- kisses: close together you kiss (both of you lean in), further apart you blow one ----------
const KISS_NEAR=2.6,KISS_GAP=.95,flyers=[],kissBtn=$("kissBtn");let kiss=null,kissHinted=false;
function otherPos(){const w=me&&other(me),o=w&&people[w],s=w&&remote[w];return o&&o.g.visible&&s?{x:s.x,y:s.y,z:s.z}:null}
function blowKiss(from,to){const s=new T.Sprite(new T.SpriteMaterial({map:heartTex,transparent:true,depthTest:false}));s.renderOrder=6;s.scale.set(.42,.42,1);scene.add(s);
  flyers.push({s,from:{x:from.x,y:from.y+1.6,z:from.z},to:{x:to.x,y:to.y+1.6,z:to.z},t0:performance.now(),dur:1300})}
function beginKiss(at){const M={x:(P.x+at.x)/2,z:(P.z+at.z)/2};let dx=P.x-M.x,dz=P.z-M.z;const l=Math.hypot(dx,dz)||1;dx/=l;dz/=l;
  let tx=M.x+dx*KISS_GAP/2,tz=M.z+dz*KISS_GAP/2;if(hits(tx,P.y,tz)){tx=P.x;tz=P.z}
  kiss={t0:performance.now(),sx:P.x,sz:P.z,tx,tz,M,burst:false};swordOut=false;keys.clear();joy.x=joy.y=0;knob.style.transform=""}
function kissPose(now){if(!kiss)return null;const e=(now-kiss.t0)/1000;if(e>2.5){kiss=null;return null}
  const ramp=(t,a,b)=>Math.max(0,Math.min(1,(t-a)/(b-a)));
  if(!kiss.burst&&e>.85){kiss.burst=true;const op=otherPos()||kiss.M,mid={x:(P.x+op.x)/2,y:P.y,z:(P.z+op.z)/2};burst(mid);
    const s=new T.Sprite(new T.SpriteMaterial({map:heartTex,transparent:true,depthTest:false}));s.renderOrder=6;s.scale.set(.7,.7,1);s.position.set(mid.x,mid.y+1.85,mid.z);scene.add(s);hearts.push({s,vy:.45,born:now});
    if(Math.hypot(KID.g.position.x-mid.x,KID.g.position.z-mid.z)<5)KID.cheer()}
  return{lean:ramp(e,.4,.8)*(1-ramp(e,1.9,2.3)),hug:ramp(e,.3,.7)*(1-ramp(e,2,2.45))}}
function pose(p,k){p.body.rotation.x=k?(p.lean||.15)*k.lean:0;p.body.position.y=k?(p.lift||0)*k.lean:0;if(k&&k.hug){p.armL.rotation.x=-1.25*k.hug;p.armR.rotation.x=-1.25*k.hug;p.armL.rotation.z=.4*k.hug;p.armR.rotation.z=-.4*k.hug}else{p.armL.rotation.z=0;p.armR.rotation.z=0}}
function kissNow(){if(!me||kiss||ko)return;const op=otherPos();if(!op)return;
  if(Math.hypot(op.x-P.x,op.z-P.z)<KISS_NEAR){beginKiss(op);if(net)net.sendEmote("kiss",{x:+P.x.toFixed(2),z:+P.z.toFixed(2)})}
  else{blowKiss(P,op);if(net)net.sendEmote("blow")}buzz()}
function onKiss(e){if(e.who===me)return;
  if(e.who!==other(me)){ // Urii watching the two of them: hearts where they kiss, or a kiss flying between them
    const a=people[e.who],b=people[other(e.who)];if(!a||!a.g.visible)return;const pa=a.g.position,pb=b&&b.g.visible?b.g.position:null;
    if(e.k==="kiss")setTimeout(()=>{const q=pb||pa,mid={x:(pa.x+q.x)/2,y:pa.y,z:(pa.z+q.z)/2};burst(mid);if(Math.hypot(P.x-mid.x,P.z-mid.z)<5)KID.cheer()},850);
    else if(pb)blowKiss(pa,pb);return}
  const op=otherPos();
  if(!op){toast(e.who+(e.k==="kiss"?" wants a kiss ♡":" blew you a kiss ♡"));buzz();return}
  if(e.k==="kiss"){if(!kiss)beginKiss({x:e.x??op.x,z:e.z??op.z})}else blowKiss(op,P);buzz()}
kissBtn.onclick=kissNow;
// ---------- sword fights: tap the sword to swing; five hearts each; lose them all and you're knocked over for three seconds ----------
const MAXHP=5,sparks=[],swordBtn=$("swordBtn"),hpBar=$("hpBar");
// (the other side's swing and knock-over live on their entry in `remote`, so Urii can watch the two of them fight)
let myHp=MAXHP,theirHp=MAXHP,swordOut=false,swingT0=-1e9,lastFight=-1e9,hurtUntil=0,kb=null,ko=null,shakeUntil=0,hpKey="";
const starTex=(()=>{const c=document.createElement("canvas");c.width=c.height=32;const g=c.getContext("2d");g.fillStyle="#fff3c4";g.beginPath();
  [[16,1],[19.5,12.5],[31,16],[19.5,19.5],[16,31],[12.5,19.5],[1,16],[12.5,12.5]].forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();g.fillStyle="#fff";g.fillRect(14,14,4,4);return new T.CanvasTexture(c)})();
function sparkle(p){const now=performance.now();for(let i=0;i<9;i++){const s=new T.Sprite(new T.SpriteMaterial({map:starTex,transparent:true,depthTest:false}));s.renderOrder=7;const sc=.16+Math.random()*.2;s.scale.set(sc,sc,1);
  s.position.set(p.x,p.y+1.15,p.z);scene.add(s);const a=Math.random()*6.28,v=1.4+Math.random()*2;sparks.push({s,vx:Math.cos(a)*v,vy:1+Math.random()*2.4,vz:Math.sin(a)*v,born:now})}}
function addSword(p,hand,guard){const g=new T.Group(),mt=c=>new T.MeshLambertMaterial({color:c});
  const bx=(w,h,d,c,x,y,z)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),mt(c));b.position.set(x,y,z);b.castShadow=true;g.add(b)};
  bx(.1,.13,1.22,0xdfe3e8,0,0,.78);bx(.112,.045,1.18,0xa9b1bc,0,0,.76);bx(.07,.09,.12,0xdfe3e8,0,0,1.44);
  bx(.52,.1,.12,guard,0,0,.12);bx(.1,.1,.32,0x5a3a26,0,0,-.08);bx(.15,.15,.12,guard,0,0,-.27);
  g.position.set(0,-hand,0);g.visible=false;p.armR.add(g);p.sword=g}
addSword(people.Anujin,.9,0xa8476b);addSword(people.Baji,1.13,0x41577a);
function flash(p){const ms=[];p.g.traverse(o=>{if(o.isMesh&&o.material)(Array.isArray(o.material)?o.material:[o.material]).forEach(m=>{if(m.emissive){if(m.userData.e0==null)m.userData.e0=m.emissive.getHex();ms.push(m);m.emissive.setHex(0x8a1020)}})});
  setTimeout(()=>ms.forEach(m=>m.emissive.setHex(m.userData.e0)),170)}
function swing(){if(!me||!other(me)||ko||kiss)return;const now=performance.now();if(now-swingT0<450)return;swordOut=true;swingT0=now;lastFight=now;
  const op=otherPos(),ps=remote[other(me)];let hit=false,dx=0,dz=0;
  if(op&&!(ps&&ps.ko)){const d=Math.hypot(op.x-P.x,op.z-P.z);if(d<3.2&&d>.01){dx=(op.x-P.x)/d;dz=(op.z-P.z)/d;let a=Math.atan2(dx,dz)-P.yaw;a=Math.atan2(Math.sin(a),Math.cos(a));
    if(Math.abs(a)<1.65){P.yaw+=a;const l=Math.max(0,Math.min(.8,d-1.1));moveAxis("x",dx*l);moveAxis("z",dz*l);hit=Math.hypot(op.x-P.x,op.z-P.z)<2.4}}}
  if(hit)setTimeout(()=>{const o=people[other(me)];flash(o);sparkle(o.g.position)},120);
  if(net)net.sendEmote("swing",hit?{hit:1,dx:+dx.toFixed(3),dz:+dz.toFixed(3)}:{});buzz()}
function onFight(e){if(e.who===me)return;const now=performance.now(),s=remote[e.who];
  if(s){if(e.k==="swing"){s.swingT0=now;s.sword=true}else if(e.k==="hp")s.ko=e.ko?{t0:now}:null}
  if(e.who!==other(me))return; // only your other half can hit you; Urii just watches
  const o=people[e.who];lastFight=now;
  if(e.k==="swing"){
    if(e.hit&&!ko&&now>hurtUntil){myHp=Math.max(0,myHp-1);hurtUntil=now+450;setTimeout(()=>{flash(people[me]);sparkle(P)},120);kb={dx:e.dx||0,dz:e.dz||0,t0:now+120};shakeUntil=now+320;
      if(navigator.vibrate)try{navigator.vibrate(myHp?40:[60,40,120])}catch(_){}
      if(myHp<=0){ko={t0:now+150};swordOut=false;setTimeout(()=>toast(other(me)+" wins this round ♡"),350)}
      if(net)net.sendEmote("hp",{hp:myHp,ko:myHp<=0?1:0})}}
  else if(e.k==="hp"){theirHp=e.hp;if(e.ko)setTimeout(()=>{toast("You win this round ♡");burst(o.g.position)},350)}}
function fightTick(now,dt){
  if(ko&&now-ko.t0>3000){ko=null;myHp=MAXHP;hurtUntil=now+1500;if(net)net.sendEmote("hp",{hp:myHp,ko:0})}
  for(const w in remote){const s=remote[w];if(s.ko&&now-s.ko.t0>4500)s.ko=null}
  if(swordOut&&now-swingT0>20000)swordOut=false;
  if(now-lastFight>20000&&!ko){if(myHp<MAXHP){myHp=MAXHP;if(net)net.sendEmote("hp",{hp:myHp,ko:0})}theirHp=MAXHP}
  const show=!!me&&mode==="walk"&&(now-lastFight<20000||myHp<MAXHP);if(hpBar.hidden===show)hpBar.hidden=!show;
  if(show){const h=n=>"♥".repeat(n)+"♡".repeat(MAXHP-n),k=myHp+"|"+theirHp;if(k!==hpKey){hpKey=k;hpBar.innerHTML=`<span><b>You</b>${h(myHp)}</span><span><b>${esc(other(me))}</b>${h(theirHp)}</span>`}}
  for(let i=sparks.length-1;i>=0;i--){const s=sparks[i],a=(now-s.born)/1000;if(a>.6){scene.remove(s.s);sparks.splice(i,1);continue}
    s.s.position.x+=s.vx*dt;s.s.position.y+=s.vy*dt;s.s.position.z+=s.vz*dt;s.vy-=6*dt;s.s.material.opacity=1-a/.6}}
function fightPose(p,isMe,now,s){if(!p.sword)return; // Urii has no sword
  const out=isMe?(swordOut&&!ko):(!!(s&&s.sword)&&!(s&&s.ko));p.sword.visible=out;
  if(out&&!(kiss&&kissPose(now))){const u=(now-(isMe?swingT0:(s.swingT0||-1e9)))/340;let th=-.55;
    if(u>=0&&u<1)th=u<.3?-.55-2.05*(u/.3):-2.6+2.35*Math.pow((u-.3)/.7,.6);p.armR.rotation.x=th;p.armR.rotation.z=0}
  const k=isMe?ko:(s&&s.ko),t=k?Math.max(0,Math.min(1,(now-k.t0)/350)):0,e=t*t*(3-2*t);p.body.rotation.z=-1.5*e;if(k)p.body.rotation.x=0}
swordBtn.addEventListener("pointerdown",e=>{e.preventDefault();swing()});
let lastHeart=0;function hearts_(){const now=performance.now();if(now-lastHeart<700)return;lastHeart=now;burst(P);if(net)net.sendEmote("hearts");buzz()}
$("heartBtn").onclick=hearts_;
// canvas: drag to turn, pinch to zoom, tap to act
const pts=new Map();let pinch=0,moved=false,downT=0;
cv.addEventListener("contextmenu",e=>e.preventDefault());
cv.addEventListener("pointerdown",e=>{if(e.pointerType==="touch")app.classList.remove("no-touch");try{cv.setPointerCapture(e.pointerId)}catch(_){}pts.set(e.pointerId,{x:e.clientX,y:e.clientY,sx:e.clientX,sy:e.clientY});
  if(pts.size===1){moved=false;downT=performance.now()}else{moved=true;const [a,b]=[...pts.values()];pinch=Math.hypot(a.x-b.x,a.y-b.y)}});
cv.addEventListener("pointermove",e=>{const p=pts.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(pts.size===1){if(Math.hypot(p.x-p.sx,p.y-p.sy)>6)moved=true;if(!moved)return;
    if(mode==="walk"){camYaw-=dx*.009;camPitch=Math.max(.05,Math.min(1.2,camPitch+dy*.006));lastLook=performance.now()}
    else{bYaw-=dx*.008;bPitch=Math.max(.12,Math.min(1.45,bPitch+dy*.006))}}
  else if(pts.size===2){const [a,b]=[...pts.values()],d=Math.hypot(a.x-b.x,a.y-b.y);if(pinch){if(mode==="walk")camDist=Math.max(3,Math.min(14,camDist*pinch/d));else bDist=Math.max(8,Math.min(46,bDist*pinch/d))}pinch=d}});
const up=e=>{if(!pts.has(e.pointerId))return;pts.delete(e.pointerId);if(pts.size===0&&!moved&&e.type==="pointerup"&&performance.now()-downT<600)tap(e.clientX,e.clientY,e.button===2);if(pts.size<2)pinch=0};
cv.addEventListener("pointerup",up);cv.addEventListener("pointercancel",up);
cv.addEventListener("wheel",e=>{e.preventDefault();const f=1+Math.sign(e.deltaY)*.08;if(mode==="walk")camDist=Math.max(3,Math.min(14,camDist*f));else bDist=Math.max(8,Math.min(46,bDist*f))},{passive:false});
let lastLook=0;

// ---------- the other person, live ----------
// remote: everyone else who's home right now, by name — where they're headed, sword out, knocked over
let online=new Set(),seen={},remote={},connected=false;
function chip(){const o=other(me),c=$("chip"),t=$("chipText");c.classList.remove("on","off","lost");
  if(!connected){c.classList.add("lost");t.textContent="Reconnecting…";return}
  if(!o){const here=COUPLE.filter(w=>online.has(w));
    if(here.length){c.classList.add("on");t.textContent=(here.length>1?"Anujin & Baji are":here[0]+" is")+" here ♡"}else{c.classList.add("off");t.textContent="Just you for now, Urii ♡"}return}
  const kid=online.has("Urii");
  if(online.has(o)){c.classList.add("on");t.textContent=o+(kid?" & Urii are":" is")+" here ♡"}
  else if(kid){c.classList.add("on");t.textContent="Urii is here ♡"}
  else{c.classList.add("off");t.textContent=seen[o]?o+" was here "+ago(seen[o]):o+" hasn't been home yet"}}
setInterval(()=>{if(me)chip()},30000);
let toastT=null;function toast(t){const el=$("toast");el.textContent=t;el.hidden=false;el.style.animation="none";void el.offsetWidth;el.style.animation="";clearTimeout(toastT);toastT=setTimeout(()=>el.hidden=true,3600)}
const handlers={
  pos(p){if(!p||p.who===me||!people[p.who])return;remote[p.who]=Object.assign(remote[p.who]||{x:p.x,y:p.y,z:p.z,yaw:p.yaw},{tx:p.x,ty:p.y,tz:p.z,tyaw:p.yaw,moving:p.m,sword:!!p.sw,at:performance.now()});people[p.who].g.visible=true},
  block(b){const k=K(b.x,b.y,b.z);if(b.t==null)world.delete(k);else world.set(k,b.t);rebuild();if(hits(P.x,P.y,P.z))P.y+=1},
  note(n){if(!other(me))return;if(!notes.some(x=>x.id===n.id)){notes.push(n);syncNotes();if(n.author!==me){toast(n.author+" left you a letter ♡");buzz()}}},
  "note-read"(r){const n=notes.find(x=>x.id===r.id);if(n){n.read_at=r.read_at||new Date().toISOString();syncNotes()}},
  "note-del"(r){notes=notes.filter(x=>x.id!==r.id);syncNotes()},
  emote(e){if(e.k==="kid"){KID.cheer();buzz();return}if(e.k==="kiss"||e.k==="blow"){onKiss(e);return}if(e.k==="swing"||e.k==="hp"){onFight(e);return}const p=people[e.who];if(p&&p.g.visible)burst(p.g.position);else if(e.who!==me)toast(e.who+" sent you hearts ♡");buzz()},
  presence(list){const was=online;online=new Set(list);
    EVERYONE.forEach(w=>{if(w===me)return;
      if(online.has(w)&&!was.has(w)){toast(w+" just came home ♡");buzz()}
      if(!online.has(w)&&was.has(w)){seen[w]=new Date().toISOString();delete remote[w];if(w!=="Urii")people[w].g.visible=false}}); // Urii goes back to her own little walk
    chip()},
  status(st){const was=connected;connected=st==="SUBSCRIBED";chip();if(connected&&!was&&wasEverConnected)resync();if(connected)wasEverConnected=true}
};
let wasEverConnected=false;
async function resync(){try{const d=await net.enter(secret,me);applyData(d)}catch(_){}}

// ---------- letters ----------
const sheet=$("sheet"),paper=$("paper");
function openSheet(html){paper.innerHTML=`<button class="x" type="button" aria-label="Close">×</button>`+html;sheet.hidden=false;paper.querySelector(".x").onclick=closeSheet;keys.clear();joy.x=joy.y=0}
function closeSheet(){sheet.hidden=true;paper.innerHTML="";cv.focus({preventScroll:true})}
sheet.addEventListener("click",e=>{if(e.target===sheet)closeSheet()});
addEventListener("keydown",e=>{if(e.key==="Escape"&&!sheet.hidden)closeSheet()});
function switchWho(){store.del("home-secret");store.del("home-who");location.reload()}
$("lettersBtn").onclick=()=>{
  if(!other(me)){openSheet(`<div class="caps">Hello</div><h2>Hi <em>Urii</em> ♡</h2>
    <p class="letter-body">Walk around the house, jump, send hearts, and build anything you like.</p>
    <div class="btns"><button class="btn solid" type="button" id="close2">Let's play</button></div>
    <div class="btns"><button class="linkish" type="button" id="notMe">Not Urii? Switch</button></div>`);
    $("close2").onclick=closeSheet;$("notMe").onclick=switchWho;return}
  const list=[...notes].sort((a,b)=>b.created_at<a.created_at?-1:1);
  openSheet(`<div class="caps">Between us</div><h2>Our <em>letters</em></h2>
    ${list.length?`<ul class="list">${list.map(n=>`<li class="${isUnread(n)?"unread":""}"><button type="button" data-id="${esc(n.id)}"><span class="dot"></span><span class="meta">${n.author===me?"You wrote":"From "+esc(n.author)} · ${esc(ago(n.created_at))}${n.author===me?(n.read_at?" · read ♡":" · not opened yet"):""}</span><span class="pv">${esc(n.body.split("\n")[0])}</span></button></li>`).join("")}</ul>`
      :`<p class="empty">No letters yet. Leave the first one somewhere in the house for ${esc(other(me))} to find.</p>`}
    <div class="btns"><button class="btn solid" type="button" id="writeHere">Write a letter here</button></div>
    <div class="btns"><button class="linkish" type="button" id="notMe">Not ${esc(me)}? Switch</button></div>`);
  paper.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>openLetter(b.dataset.id));
  $("writeHere").onclick=()=>{const fx=Math.round(P.x-Math.sin(P.yaw)*1.2),fz=Math.round(P.z-Math.cos(P.yaw)*1.2);let fy=Math.round(P.y+.5);
    let spot={x:fx,y:fy,z:fz};if(world.has(K(fx,fy,fz))||!inBounds(fx,fy,fz))spot={x:Math.round(P.x),y:Math.round(P.y+.5)+1,z:Math.round(P.z)};compose(spot)};
  $("notMe").onclick=switchWho};
function compose(spot){openSheet(`<div class="caps">For ${esc(other(me))}</div><h2>Leave a <em>letter</em></h2>
  <textarea id="body" maxlength="1000" placeholder="Write something for ${esc(other(me))} to find…" aria-label="Your letter"></textarea>
  <div class="btns"><button class="btn solid" type="button" id="send">Leave it here</button><button class="btn" type="button" id="cancel">Not now</button><span class="status" id="st"></span></div>`);
  const ta=$("body");setTimeout(()=>ta.focus(),60);$("cancel").onclick=closeSheet;
  $("send").onclick=async()=>{const body=ta.value.trim();if(!body){$("st").textContent="Write something first.";return}
    $("send").disabled=true;$("st").textContent="Leaving it…";
    try{const n=await net.addNote(spot.x,spot.y,spot.z,body);if(!notes.some(x=>x.id===n.id))notes.push(n);syncNotes();closeSheet();toast("Your letter is waiting for "+other(me)+" ♡")}
    catch(_){$("st").textContent="It didn't send. Check your connection and try again.";$("send").disabled=false}}}
async function openLetter(id){const n=notes.find(x=>x.id===id);if(!n||!other(me))return;const mine=n.author===me;
  openSheet(`<div class="caps">${mine?"You wrote this":"From "+esc(n.author)} · ${esc(when(n.created_at))}</div>
    <p class="letter-body">${esc(n.body)}</p><div class="sig">${esc(n.author)}</div>
    <div class="btns">${mine?`<span class="status">${n.read_at?esc(other(me))+" read it "+esc(ago(n.read_at))+" ♡":"Not opened yet"}</span><button class="btn warn" type="button" id="del">Take it back</button>`:`<button class="btn" type="button" id="close2">Close</button>`}</div>`);
  if(mine){let armed=false;$("del").onclick=async()=>{if(!armed){armed=true;$("del").textContent="Tap again to remove";return}
    try{await net.delNote(id);notes=notes.filter(x=>x.id!==id);syncNotes();closeSheet()}catch(_){$("del").textContent="Couldn't remove it"}}}
  else{$("close2").onclick=closeSheet;if(!n.read_at){n.read_at=new Date().toISOString();syncNotes();try{await net.readNote(id)}catch(_){}}}}
let nearId=null;
$("nearBtn").onclick=()=>{if(nearId)openLetter(nearId)};

// ---------- loop ----------
let last=performance.now(),lastSend=0,lastSent="";
function frame(){requestAnimationFrame(frame);if(document.hidden)return;const now=performance.now();
  const dt=Math.min(.05,(now-last)/1000);last=now;const tt=now/1000;
  const mine=me&&people[me];
  if(mine){
    let moving=false;
    if(mode==="walk"&&sheet.hidden&&!kiss&&!ko){
      let f=(keys.has("f")?1:0)-(keys.has("b")?1:0)-joy.y,s=(keys.has("r")?1:0)-(keys.has("l")?1:0)+joy.x;const m=Math.hypot(f,s);if(m>1){f/=m;s/=m}
      const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),mx=(fx*f-fz*s)*4.6,mz=(fz*f+fx*s)*4.6;
      moveAxis("x",mx*dt);moveAxis("z",mz*dt);moving=Math.hypot(mx,mz)>.3;
      if(moving){let d=Math.atan2(mx,mz)-P.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));P.yaw+=d*Math.min(1,dt*12);
        if(now-lastLook>900){let c=(P.yaw+Math.PI)-camYaw;c=Math.atan2(Math.sin(c),Math.cos(c));camYaw+=c*dt*1.4*Math.min(1,Math.abs(f)+.2)}}
    }
    if(kiss){const e=(now-kiss.t0)/1000,a=Math.min(1,e/.5),sm=a*a*(3-2*a);P.x=kiss.sx+(kiss.tx-kiss.sx)*sm;P.z=kiss.sz+(kiss.tz-kiss.sz)*sm;
      const op=otherPos()||kiss.M;let d=Math.atan2(op.x-P.x,op.z-P.z)-P.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));P.yaw+=d*Math.min(1,dt*10);wantJump=false}
    if(kb&&now>kb.t0&&now-kb.t0<260){moveAxis("x",kb.dx*3*dt);moveAxis("z",kb.dz*3*dt)}if(ko)wantJump=false;
    if(wantJump&&P.ground)P.vy=7.4;wantJump=false;
    P.vy=Math.max(-30,P.vy-24*dt);const dy=P.vy*dt;P.y+=dy;P.ground=false;
    if(hits(P.x,P.y,P.z)){if(dy<0){P.y=Math.ceil(P.y-.5)+.5;P.ground=true}else P.y-=dy;P.vy=0}
    if(P.y<-12)spawn();
    Object.assign(P,{x:Math.max(-13,Math.min(13,P.x)),z:Math.max(-13,Math.min(13,P.z))});
    mine.g.position.set(P.x,P.y,P.z);mine.g.rotation.y=P.yaw;mine.g.visible=true;
    myMoving=moving;const sw=moving?Math.sin(tt*10)*.7:0;mine.legL.rotation.x=sw;mine.legR.rotation.x=-sw;mine.armL.rotation.x=-sw;mine.armR.rotation.x=sw;
    pose(mine,kissPose(now));fightPose(mine,true,now);
    if(net&&connected&&now-lastSend>110){const key=[P.x.toFixed(2),P.y.toFixed(2),P.z.toFixed(2),P.yaw.toFixed(2),moving?1:0,swordOut?1:0].join();
      if(key!==lastSent||now-lastSend>2500){net.sendPos({who:me,x:+P.x.toFixed(2),y:+P.y.toFixed(2),z:+P.z.toFixed(2),yaw:+P.yaw.toFixed(2),m:moving?1:0,sw:swordOut&&!ko?1:0});lastSent=key;lastSend=now}}
    // a letter nearby
    let best=null,bd=2.6;notes.forEach(n=>{if(!isUnread(n))return;const d=Math.hypot(n.x-P.x,n.y-(P.y+.6),n.z-P.z);if(d<bd){bd=d;best=n.id}});
    if(best!==nearId){nearId=best;$("nearBtn").hidden=!(best&&mode==="walk")}
  }
  // everyone else who's home (Urii only once she's really here; until then she walks her own loop)
  if(me)for(const w in remote){const s=remote[w],o=people[w];if(!o||!o.g.visible||(w==="Urii"&&!online.has(w)))continue;
    const k=Math.min(1,dt*10);s.x+=(s.tx-s.x)*k;s.y+=(s.ty-s.y)*k;s.z+=(s.tz-s.z)*k;let d=s.tyaw-s.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));s.yaw+=d*k;
    o.g.position.set(s.x,s.y,s.z);o.g.rotation.y=s.yaw;const sw=s.moving&&now-s.at<600?Math.sin(tt*10)*.7:0;o.legL.rotation.x=sw;o.legR.rotation.x=-sw;o.armL.rotation.x=-sw;o.armR.rotation.x=sw;
    pose(o,w===other(me)?kissPose(now):null);fightPose(o,false,now,s)}
  if(me){const op=otherPos(),show=!!op;if(kissBtn.hidden===show)kissBtn.hidden=!show;
    if(op){const near=Math.hypot(op.x-P.x,op.z-P.z)<KISS_NEAR;if(kissBtn.classList.contains("close")!==near){kissBtn.classList.toggle("close",near);kissBtn.setAttribute("aria-label",near?"Kiss "+other(me):"Blow "+other(me)+" a kiss");
      if(near&&!kissHinted&&mode==="walk"){kissHinted=true;toast("Close enough for a kiss ♡")}}}}
  for(let i=flyers.length-1;i>=0;i--){const f=flyers[i],u=(now-f.t0)/f.dur;if(u>=1){scene.remove(f.s);burst({x:f.to.x,y:f.to.y-1.6,z:f.to.z});flyers.splice(i,1);continue}
    f.s.position.set(f.from.x+(f.to.x-f.from.x)*u,f.from.y+(f.to.y-f.from.y)*u+Math.sin(u*Math.PI)*1.2,f.from.z+(f.to.z-f.from.z)*u);const sc=.42+Math.sin(u*Math.PI)*.18;f.s.scale.set(sc,sc,1)}
  fightTick(now,dt);
  KID.update(dt,tt,now);
  noteObjs.forEach(g=>{const ph=g.userData.phase;g.rotation.y=tt*.8+ph;g.position.y=notes.find(n=>n.id===g.userData.id).y+Math.sin(tt*2+ph)*.08});
  hearts=hearts.filter(h=>{if(now<h.born){h.s.visible=false;return true}h.s.visible=true;const a=(now-h.born)/1000;h.s.position.y+=h.vy*dt;h.s.material.opacity=Math.max(0,1-a/2.2);if(a>2.2){scene.remove(h.s);return false}return true});
  if(!me)bYaw+=dt*.07;
  if(mode==="walk"&&me){const ty=P.y+(me==="Urii"?1:1.4),cp=camPitch;camera.position.set(P.x+Math.sin(camYaw)*Math.cos(cp)*camDist,ty+Math.sin(cp)*camDist,P.z+Math.cos(camYaw)*Math.cos(cp)*camDist);camera.lookAt(P.x,ty,P.z);if(now<shakeUntil){camera.position.x+=(Math.random()-.5)*.22;camera.position.y+=(Math.random()-.5)*.16}}
  else{camera.position.set(bTarget.x+Math.sin(bYaw)*Math.cos(bPitch)*bDist,bTarget.y+Math.sin(bPitch)*bDist,bTarget.z+Math.cos(bYaw)*Math.cos(bPitch)*bDist);camera.lookAt(bTarget)}
  renderer.render(scene,camera)}
function size(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(w<520)bDist=Math.max(bDist,30)}
addEventListener("resize",size);size();

// ---------- coming in ----------
let secret="";
function applyData(d){world=new Map();(d.blocks||[]).forEach(([x,y,z,t])=>{if(B[t])world.set(K(x,y,z),t)});rebuild();
  notes=other(me)?d.notes||[]:[];syncNotes();seen=d.seen||{};chip()}
async function enter(word,who){
  const d=await net.enter(word,who);secret=word;me=who;
  if(!other(me)){ // Urii: no sword, no letters, a little house button to say hi (and switch) instead
    swordBtn.hidden=true;bar.querySelector(".slot.letter").hidden=true;$("lettersBtn").setAttribute("aria-label","Hello");
    $("lettersBtn").innerHTML=`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" aria-hidden="true"><path d="M3.5 11 12 4l8.5 7"/><path d="M5.5 9.5V20h13V9.5"/><path d="M12 17.6s-2.6-1.6-2.6-3.4a1.4 1.4 0 0 1 2.6-.8 1.4 1.4 0 0 1 2.6.8c0 1.8-2.6 3.4-2.6 3.4z" fill="currentColor" stroke="none"/></svg><b class="badge" id="badge" hidden>0</b>`}
  if(!d.blocks||!d.blocks.length){const st=[...starter()].map(([k,t])=>[...k.split(",").map(Number),t]);try{await net.seed(st)}catch(_){}d.blocks=st}
  applyData(d);spawn();camYaw=0;
  net.live(d.channel,handlers);net.touch();setInterval(()=>net.touch(),60000);
  addEventListener("pagehide",()=>{net.touch();net.leave()});
  $("enter").hidden=true;setMode("walk");cv.focus({preventScroll:true});
}
// show the starter home behind the entry card
world=starter();rebuild();me="";requestAnimationFrame(frame);
camera.position.set(14,10,18);camera.lookAt(0,2,0);
let who=store.get("home-who")||"";
const pickBtns=$("pick").querySelectorAll("button");
function pickWho(w){who=w;pickBtns.forEach(b=>{const on=b.dataset.who===w;b.classList.toggle("on",on);b.setAttribute("aria-checked",on?"true":"false")})}
pickBtns.forEach(b=>b.onclick=()=>pickWho(b.dataset.who));if(who)pickWho(who);
if(!net){$("enterLine").textContent=DEMO?"Who's coming home?":"Almost ready. Baji is still putting the house together.";$("go").disabled=!DEMO}
$("enterForm").onsubmit=async e=>{e.preventDefault();if(!net)return;const word=$("word").value.trim();
  if(!who){$("err").textContent="Tap your name first.";return}if(!word){$("err").textContent="Type our word.";return}
  $("go").disabled=true;$("go").textContent="Opening the door…";$("err").textContent="";
  try{await enter(word,who);store.set("home-secret",word);store.set("home-who",who)}
  catch(err){$("err").textContent=err.code==="bad_secret"?"That's not our word. Try again.":"Couldn't reach the house. Check your connection.";$("go").disabled=false;$("go").textContent="Come in"}};
const saved=store.get("home-secret");
if(net&&saved&&who){$("go").textContent="Opening the door…";$("go").disabled=true;$("word").value=saved;
  enter(saved,who).catch(err=>{if(err.code==="bad_secret")store.del("home-secret");$("go").disabled=false;$("go").textContent="Come in";$("word").value="";$("err").textContent=err.code==="bad_secret"?"Our word changed. Type the new one.":"Couldn't reach the house. Check your connection."})}
})();
