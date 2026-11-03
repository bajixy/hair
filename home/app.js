/* Our home — a little block home Baji and Anujin build and wander together.
   Everything shared (blocks, letters, who was here) lives in Supabase behind the secret word;
   live movement, hearts and new blocks travel over a realtime channel whose name only the word unlocks. */
(function(){
"use strict";
const CONFIG={url:"",key:""}; // filled in once the database is set up
const DEMO=new URLSearchParams(location.search).has("demo");
const $=id=>document.getElementById(id);
const store={get:k=>{try{return localStorage.getItem(k)}catch(_){return null}},set:(k,v)=>{try{localStorage.setItem(k,v)}catch(_){}},del:k=>{try{localStorage.removeItem(k)}catch(_){}}};
const esc=s=>String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const reduce=matchMedia("(prefers-reduced-motion: reduce)").matches;
const touch=matchMedia("(pointer:coarse)").matches;
const other=w=>w==="Anujin"?"Baji":"Anujin";
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
    sendPos:p=>send("pos",p), sendEmote:k=>send("emote",{who:W,k}),
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
    sendPos:p=>post("pos",p), sendEmote:k=>post("emote",{who:W,k}), leave(){post("bye");clearInterval(hb)}
  };
}
const net=DEMO?DemoNet():(CONFIG.url&&window.supabase?SupaNet():null);

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
function person(o){const g=new T.Group(),body=new T.Group();g.add(body);const m=c=>new T.MeshLambertMaterial({color:c}),sk=m(o.skin),sh=m(o.shirt),pa=m(o.pants),ha=m(o.hair);
  const part=(w,h,d,mt,x,y,z,p=body)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),mt);b.position.set(x,y,z);b.castShadow=true;p.add(b);return b};
  const limb=(mt,x,y,len,w)=>{const p=new T.Group();p.position.set(x,y,0);body.add(p);part(w,len,w,mt,0,-len/2,0,p);return p};
  const legL=limb(pa,-.24,.95,.95,.46),legR=limb(pa,.24,.95,.95,.46);part(1.02,1,.52,sh,0,1.45,0);
  const armL=limb(sh,-.73,1.92,.95,.42),armR=limb(sh,.73,1.92,.95,.42);part(.42,.2,.42,sk,0,-.92,0,armL);part(.42,.2,.42,sk,0,-.92,0,armR);
  const c=document.createElement("canvas");c.width=c.height=32;const x=c.getContext("2d");x.fillStyle=o.skinCss;x.fillRect(0,0,32,32);x.fillStyle="#2b2026";x.fillRect(9,11,4,6);x.fillRect(19,11,4,6);
  x.strokeStyle="#2b2026";x.lineWidth=2;x.beginPath();x.arc(16,17,6,.35,Math.PI-.35);x.stroke();x.fillStyle="rgba(200,100,130,.45)";x.fillRect(5,19,4,2);x.fillRect(23,19,4,2);
  const ft=new T.CanvasTexture(c);ft.magFilter=T.NearestFilter;
  const head=new T.Mesh(new T.BoxGeometry(.72,.72,.72),[sk,sk,sk,sk,new T.MeshLambertMaterial({map:ft}),sk]);head.position.y=2.32;head.castShadow=true;body.add(head);
  part(.78,.2,.78,ha,0,2.72,0);if(o.long)part(.78,.95,.2,ha,0,2.25,-.33);else part(.78,.3,.16,ha,0,2.55,-.32);if(o.bow)part(.34,.18,.12,m(0xe9c6cf),.28,2.82,-.28);
  body.scale.setScalar(.66);const tag=nameTag(o.name,o.tag);tag.position.y=2.2;g.add(tag);scene.add(g);
  return{g,legL,legR,armL,armR}}
const LOOK={Anujin:{name:"Anujin",skin:0xf1c9a5,skinCss:"#f1c9a5",shirt:0xa8476b,pants:0x3d2a36,hair:0x2b1d18,long:true,bow:true,tag:"#a8476b"},
  Baji:{name:"Baji",skin:0xe9bf98,skinCss:"#e9bf98",shirt:0x41577a,pants:0x2b2026,hair:0x1c1410,tag:"#41577a"}};
const people={Anujin:person(LOOK.Anujin),Baji:person(LOOK.Baji)};
Object.values(people).forEach(p=>p.g.visible=false);

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
let me="";const isUnread=n=>n.author!==me&&!n.read_at;

let hearts=[];
function burst(p){for(let i=0;i<14;i++){const s=new T.Sprite(new T.SpriteMaterial({map:heartTex,transparent:true}));const a=Math.random()*6.28,r=Math.random()*.7,sc=.22+Math.random()*.25;
  s.position.set(p.x+Math.cos(a)*r,p.y+1.6+Math.random()*.6,p.z+Math.sin(a)*r);s.scale.set(sc,sc,1);scene.add(s);hearts.push({s,vy:.9+Math.random()*1.2,born:performance.now()+Math.random()*300})}}

// ---------- me: walking with simple block physics ----------
const P={x:0,y:.5,z:6,vy:0,yaw:Math.PI,ground:false};
const HW=.28,HH=1.7;
const solidAt=(x,y,z)=>world.has(K(x,y,z));
function hits(px_,py,pz){const x0=Math.floor(px_-HW+.5),x1=Math.floor(px_+HW+.5-1e-6),y0=Math.floor(py+.5),y1=Math.floor(py+HH+.5-1e-6),z0=Math.floor(pz-HW+.5),z1=Math.floor(pz+HW+.5-1e-6);
  for(let x=x0;x<=x1;x++)for(let y=y0;y<=y1;y++)for(let z=z0;z<=z1;z++)if(solidAt(x,y,z))return true;return false}
function spawn(){const sx=me==="Anujin"?-.6:.6;Object.assign(P,{x:sx,y:.5,z:6.2,vy:0,yaw:Math.PI});while(hits(P.x,P.y,P.z)&&P.y<30)P.y+=1}
function moveAxis(ax,d){if(!d)return;P[ax]+=d;if(!hits(P.x,P.y,P.z))return;
  if(P.ground&&!hits(P.x,P.y+1,P.z)){P.y+=1;return} // step up one block
  P[ax]-=d}

// ---------- modes, cameras ----------
let mode="walk",camYaw=0,camPitch=.42,camDist=8;let bYaw=.55,bPitch=.62,bDist=24;const bTarget=new T.Vector3(0,2.5,0);
function setMode(m){mode=m;document.querySelectorAll("[data-mode]").forEach(b=>{const on=b.dataset.mode===m;b.classList.toggle("on",on);b.setAttribute("aria-pressed",on?"true":"false")});
  $("walkUI").hidden=m!=="walk";$("buildUI").hidden=m!=="build";$("nearBtn").hidden=true;keys.clear();joy.x=joy.y=0;
  if(m==="build"){bTarget.set(P.x*.5,2.5,P.z*.5);showHint(touch?"Tap to place · drag to turn · pinch to zoom":"Click to place · right-click to break · drag to turn · scroll to zoom")}
  else showHint(touch?"Joystick to walk · drag to look around":"WASD to walk · space to jump · drag to look · H for hearts")}
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
function tap(cx,cy,alt){aim(cx,cy);const nid=pickNote();if(nid){openLetter(nid);return}
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
let online=new Set(),seen={},otherState=null,connected=false;
function chip(){const o=other(me),c=$("chip"),t=$("chipText");c.classList.remove("on","off","lost");
  if(!connected){c.classList.add("lost");t.textContent="Reconnecting…";return}
  if(online.has(o)){c.classList.add("on");t.textContent=o+" is here ♡"}else{c.classList.add("off");t.textContent=seen[o]?o+" was here "+ago(seen[o]):o+" hasn't been home yet"}}
setInterval(()=>{if(me)chip()},30000);
let toastT=null;function toast(t){const el=$("toast");el.textContent=t;el.hidden=false;el.style.animation="none";void el.offsetWidth;el.style.animation="";clearTimeout(toastT);toastT=setTimeout(()=>el.hidden=true,3600)}
const handlers={
  pos(p){if(p.who!==other(me))return;otherState=Object.assign(otherState||{x:p.x,y:p.y,z:p.z,yaw:p.yaw},{tx:p.x,ty:p.y,tz:p.z,tyaw:p.yaw,moving:p.m,at:performance.now()});people[p.who].g.visible=true},
  block(b){const k=K(b.x,b.y,b.z);if(b.t==null)world.delete(k);else world.set(k,b.t);rebuild();if(hits(P.x,P.y,P.z))P.y+=1},
  note(n){if(!notes.some(x=>x.id===n.id)){notes.push(n);syncNotes();if(n.author!==me){toast(n.author+" left you a letter ♡");buzz()}}},
  "note-read"(r){const n=notes.find(x=>x.id===r.id);if(n){n.read_at=r.read_at||new Date().toISOString();syncNotes()}},
  "note-del"(r){notes=notes.filter(x=>x.id!==r.id);syncNotes()},
  emote(e){const p=people[e.who];if(p&&p.g.visible)burst(p.g.position);else if(e.who!==me)toast(e.who+" sent you hearts ♡");buzz()},
  presence(list){const o=other(me),was=online.has(o);online=new Set(list);
    if(online.has(o)&&!was){toast(o+" just came home ♡");buzz()}
    if(!online.has(o)&&was){seen[o]=new Date().toISOString();people[o].g.visible=false;otherState=null}
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
$("lettersBtn").onclick=()=>{const list=[...notes].sort((a,b)=>b.created_at<a.created_at?-1:1);
  openSheet(`<div class="caps">Between us</div><h2>Our <em>letters</em></h2>
    ${list.length?`<ul class="list">${list.map(n=>`<li class="${isUnread(n)?"unread":""}"><button type="button" data-id="${esc(n.id)}"><span class="dot"></span><span class="meta">${n.author===me?"You wrote":"From "+esc(n.author)} · ${esc(ago(n.created_at))}${n.author===me?(n.read_at?" · read ♡":" · not opened yet"):""}</span><span class="pv">${esc(n.body.split("\n")[0])}</span></button></li>`).join("")}</ul>`
      :`<p class="empty">No letters yet. Leave the first one somewhere in the house for ${esc(other(me))} to find.</p>`}
    <div class="btns"><button class="btn solid" type="button" id="writeHere">Write a letter here</button></div>
    <div class="btns"><button class="linkish" type="button" id="notMe">Not ${esc(me)}? Switch</button></div>`);
  paper.querySelectorAll("[data-id]").forEach(b=>b.onclick=()=>openLetter(b.dataset.id));
  $("writeHere").onclick=()=>{const fx=Math.round(P.x-Math.sin(P.yaw)*1.2),fz=Math.round(P.z-Math.cos(P.yaw)*1.2);let fy=Math.round(P.y+.5);
    let spot={x:fx,y:fy,z:fz};if(world.has(K(fx,fy,fz))||!inBounds(fx,fy,fz))spot={x:Math.round(P.x),y:Math.round(P.y+.5)+1,z:Math.round(P.z)};compose(spot)};
  $("notMe").onclick=()=>{store.del("home-secret");store.del("home-who");location.reload()}};
function compose(spot){openSheet(`<div class="caps">For ${esc(other(me))}</div><h2>Leave a <em>letter</em></h2>
  <textarea id="body" maxlength="1000" placeholder="Write something for ${esc(other(me))} to find…" aria-label="Your letter"></textarea>
  <div class="btns"><button class="btn solid" type="button" id="send">Leave it here</button><button class="btn" type="button" id="cancel">Not now</button><span class="status" id="st"></span></div>`);
  const ta=$("body");setTimeout(()=>ta.focus(),60);$("cancel").onclick=closeSheet;
  $("send").onclick=async()=>{const body=ta.value.trim();if(!body){$("st").textContent="Write something first.";return}
    $("send").disabled=true;$("st").textContent="Leaving it…";
    try{const n=await net.addNote(spot.x,spot.y,spot.z,body);if(!notes.some(x=>x.id===n.id))notes.push(n);syncNotes();closeSheet();toast("Your letter is waiting for "+other(me)+" ♡")}
    catch(_){$("st").textContent="It didn't send. Check your connection and try again.";$("send").disabled=false}}}
async function openLetter(id){const n=notes.find(x=>x.id===id);if(!n)return;const mine=n.author===me;
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
function frame(now){requestAnimationFrame(frame);if(document.hidden)return;
  const dt=Math.min(.05,(now-last)/1000);last=now;const tt=now/1000;
  const mine=me&&people[me];
  if(mine){
    let moving=false;
    if(mode==="walk"&&sheet.hidden){
      let f=(keys.has("f")?1:0)-(keys.has("b")?1:0)-joy.y,s=(keys.has("r")?1:0)-(keys.has("l")?1:0)+joy.x;const m=Math.hypot(f,s);if(m>1){f/=m;s/=m}
      const fx=-Math.sin(camYaw),fz=-Math.cos(camYaw),mx=(fx*f-fz*s)*4.6,mz=(fz*f+fx*s)*4.6;
      moveAxis("x",mx*dt);moveAxis("z",mz*dt);moving=Math.hypot(mx,mz)>.3;
      if(moving){let d=Math.atan2(mx,mz)-P.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));P.yaw+=d*Math.min(1,dt*12);
        if(now-lastLook>900){let c=(P.yaw+Math.PI)-camYaw;c=Math.atan2(Math.sin(c),Math.cos(c));camYaw+=c*dt*1.4*Math.min(1,Math.abs(f)+.2)}}
    }
    if(wantJump&&P.ground)P.vy=7.4;wantJump=false;
    P.vy=Math.max(-30,P.vy-24*dt);const dy=P.vy*dt;P.y+=dy;P.ground=false;
    if(hits(P.x,P.y,P.z)){if(dy<0){P.y=Math.ceil(P.y-.5)+.5;P.ground=true}else P.y-=dy;P.vy=0}
    if(P.y<-12)spawn();
    Object.assign(P,{x:Math.max(-13,Math.min(13,P.x)),z:Math.max(-13,Math.min(13,P.z))});
    mine.g.position.set(P.x,P.y,P.z);mine.g.rotation.y=P.yaw;mine.g.visible=true;
    const sw=moving?Math.sin(tt*10)*.7:0;mine.legL.rotation.x=sw;mine.legR.rotation.x=-sw;mine.armL.rotation.x=-sw;mine.armR.rotation.x=sw;
    if(net&&connected&&now-lastSend>110){const key=[P.x.toFixed(2),P.y.toFixed(2),P.z.toFixed(2),P.yaw.toFixed(2),moving?1:0].join();
      if(key!==lastSent||now-lastSend>2500){net.sendPos({who:me,x:+P.x.toFixed(2),y:+P.y.toFixed(2),z:+P.z.toFixed(2),yaw:+P.yaw.toFixed(2),m:moving?1:0});lastSent=key;lastSend=now}}
    // a letter nearby
    let best=null,bd=2.6;notes.forEach(n=>{if(!isUnread(n))return;const d=Math.hypot(n.x-P.x,n.y-(P.y+.6),n.z-P.z);if(d<bd){bd=d;best=n.id}});
    if(best!==nearId){nearId=best;$("nearBtn").hidden=!(best&&mode==="walk")}
  }
  const o=me&&people[other(me)];
  if(o&&otherState&&o.g.visible){const s=otherState,k=Math.min(1,dt*10);s.x+=(s.tx-s.x)*k;s.y+=(s.ty-s.y)*k;s.z+=(s.tz-s.z)*k;let d=s.tyaw-s.yaw;d=Math.atan2(Math.sin(d),Math.cos(d));s.yaw+=d*k;
    o.g.position.set(s.x,s.y,s.z);o.g.rotation.y=s.yaw;const sw=s.moving&&now-s.at<600?Math.sin(tt*10)*.7:0;o.legL.rotation.x=sw;o.legR.rotation.x=-sw;o.armL.rotation.x=-sw;o.armR.rotation.x=sw}
  noteObjs.forEach(g=>{const ph=g.userData.phase;g.rotation.y=tt*.8+ph;g.position.y=notes.find(n=>n.id===g.userData.id).y+Math.sin(tt*2+ph)*.08});
  hearts=hearts.filter(h=>{if(now<h.born){h.s.visible=false;return true}h.s.visible=true;const a=(now-h.born)/1000;h.s.position.y+=h.vy*dt;h.s.material.opacity=Math.max(0,1-a/2.2);if(a>2.2){scene.remove(h.s);return false}return true});
  if(!me)bYaw+=dt*.07;
  if(mode==="walk"&&me){const ty=P.y+1.4,cp=camPitch;camera.position.set(P.x+Math.sin(camYaw)*Math.cos(cp)*camDist,ty+Math.sin(cp)*camDist,P.z+Math.cos(camYaw)*Math.cos(cp)*camDist);camera.lookAt(P.x,ty,P.z)}
  else{camera.position.set(bTarget.x+Math.sin(bYaw)*Math.cos(bPitch)*bDist,bTarget.y+Math.sin(bPitch)*bDist,bTarget.z+Math.cos(bYaw)*Math.cos(bPitch)*bDist);camera.lookAt(bTarget)}
  renderer.render(scene,camera)}
function size(){const w=innerWidth,h=innerHeight;renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();if(w<520)bDist=Math.max(bDist,30)}
addEventListener("resize",size);size();

// ---------- coming in ----------
let secret="";
function applyData(d){world=new Map();(d.blocks||[]).forEach(([x,y,z,t])=>{if(B[t])world.set(K(x,y,z),t)});rebuild();
  notes=d.notes||[];syncNotes();seen=d.seen||{};chip()}
async function enter(word,who){
  const d=await net.enter(word,who);secret=word;me=who;
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
