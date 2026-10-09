V3.init({fov:66,far:400,exposure:1.05,pr:1.6,shadows:true});
var T=THREE,scene=V3.scene,cam=V3.cam,R=function(a,b){return a+Math.random()*(b-a)},clamp=function(x,a,b){return x<a?a:x>b?b:x};
function $(i){return document.getElementById(i)}
function px(w,h,fn,rep){var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d'),im=x.createImageData(w,h),d=im.data;for(var j=0;j<h;j++)for(var i=0;i<w;i++){var q=fn(i,j),o=(j*w+i)*4;d[o]=q[0];d[o+1]=q[1];d[o+2]=q[2];d[o+3]=q.length>3?q[3]:255}x.putImageData(im,0,0);var t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;if(rep)t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t}
function txt(s,w,h,bg,fg,font){var c=document.createElement('canvas');c.width=w;c.height=h;var x=c.getContext('2d');if(bg){x.fillStyle=bg;x.fillRect(0,0,w,h)}x.fillStyle=fg||'#fff';x.font=font||'900 56px system-ui,sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillText(s,w/2,h/2);var t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;return t}
/* ---------------- guardado ---------------- */
var SK=CFG.id+'_v1';var S={money:0,level:1,up:{grip:0,motor:0,turbo:0,magnet:0,clock:0},skin:'clasico',skins:{clasico:1},best:0};
try{var o=JSON.parse(localStorage.getItem(SK)||'null');if(o){for(var k in o)S[k]=o[k];S.up=Object.assign({grip:0,motor:0,turbo:0,magnet:0,clock:0},o.up)}}catch(e){}
function save(){try{localStorage.setItem(SK,JSON.stringify(S))}catch(e){}}
var LT=CFG.light||{};
scene.background=new T.Color(LT.bg||0xcfe0e8);scene.fog=new T.Fog(LT.fog||0xdde8ec,LT.near||50,LT.far||150);
var hemi=new T.HemisphereLight(LT.hs||0xffffff,LT.hg||0xb0b8b0,LT.hi||1.5),sun=new T.DirectionalLight(0xfff6e8,LT.si||.8);sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);var shc=sun.shadow.camera;shc.left=-26;shc.right=26;shc.top=26;shc.bottom=-26;shc.near=1;shc.far=90;sun.shadow.bias=-.0005;scene.add(hemi,sun,sun.target);
var X0=CFG.b[0],X1=CFG.b[1],Z0=CFG.b[2],Z1=CFG.b[3];var colliders=[];
function box(x,z,w,d){colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2})}
function I(g,c,x,y,z,rx,ry,rz,sx,sy,sz){return V3.I(g,c,x,y,z,rx,ry,rz,sx,sy,sz)}
function bx(w,h,d,c,x,y,z){return V3.I(V3.box(w,h,d),c,x,y,z)}
function E(g,c,x,y,z,rx,ry,rz,sx,sy,sz){return V3.I(g,c,x,y,z,rx,ry,rz,sx,sy,sz)}
var matV=new T.MeshStandardMaterial({vertexColors:true,roughness:.7,metalness:.05});
var glassM=new T.MeshStandardMaterial({color:0xcfe8f4,transparent:true,opacity:.22,roughness:.1,metalness:.2,depthWrite:false});
function mk(items,mat,cast){var m=new T.Mesh(V3.merge(items),mat||matV);m.castShadow=!!cast;m.receiveShadow=true;scene.add(m);return m}
function isFree(x,z,r){if(x<X0+1||x>X1-1||z<Z0+1||z>Z1-1)return false;for(var i=0;i<colliders.length;i++){var c=colliders[i];if(x>c.x0-r&&x<c.x1+r&&z>c.z0-r&&z<c.z1+r)return false}return true}
function freeNear(x,z,r,rad){for(var k=0;k<60;k++){var a=k*2.4,d=k*rad/60;var px_=x+Math.cos(a)*d,pz=z+Math.sin(a)*d;if(isFree(px_,pz,r))return[px_,pz]}return[x,z]}
function sign(s,x,y,z,w,rot,col,top){var m=new T.Mesh(new T.PlaneGeometry(w,w*.28),new T.MeshBasicMaterial({map:txt(s,512,144,col||'#0e8a48','#fff','900 62px system-ui')}));m.position.set(x,y,z);m.rotation.y=rot||0;scene.add(m);var b=new T.Mesh(new T.BoxGeometry(w+.1,w*.28+.1,.1),new T.MeshStandardMaterial({color:0x222222}));b.position.set(x-Math.sin(rot||0)*.06,y,z-Math.cos(rot||0)*.06);b.rotation.y=rot||0;scene.add(b);
 if(top){var cb=new T.Mesh(new T.BoxGeometry(.05,top-y,.05),new T.MeshStandardMaterial({color:0x555555}));[-1,1].forEach(function(sd){var c=cb.clone();c.position.set(x+Math.cos(rot||0)*sd*(w/2-.3),(y+top)/2,z-Math.sin(rot||0)*sd*(w/2-.3));scene.add(c)})}return m}
/* piezas reutilizables para los mundos */
var PI=[];
function solid(items,x,z,w,d){for(var i=0;i<items.length;i++)PI.push(items[i]);if(w)box(x,z,w,d)}
function floorPlane(w,d,col,tex,rep,y){var m=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshStandardMaterial({color:col||0xffffff,map:tex||null,roughness:.35,metalness:.05}));if(tex&&rep)tex.repeat.set(rep[0],rep[1]);m.rotation.x=-Math.PI/2;m.position.y=y||0;m.receiveShadow=true;scene.add(m);return m}
function patch(x,z,w,d,c,y){var m=new T.Mesh(new T.PlaneGeometry(w,d),new T.MeshStandardMaterial({color:c,roughness:.6}));m.rotation.x=-Math.PI/2;m.position.set(x,y||.012,z);m.receiveShadow=true;scene.add(m);return m}
function walls(h,wm,gr,ye){var it=[];wm=wm||0xf2f4ee;it.push(bx(X1-X0,h,.6,wm,(X0+X1)/2,h/2,Z0-.3),bx(X1-X0,h,.6,wm,(X0+X1)/2,h/2,Z1+.3),bx(.6,h,Z1-Z0,wm,X0-.3,h/2,(Z0+Z1)/2),bx(.6,h,Z1-Z0,wm,X1+.3,h/2,(Z0+Z1)/2));
 if(gr!==undefined){var cx=(X0+X1)/2,cz=(Z0+Z1)/2;it.push(bx(X1-X0,.9,.7,gr,cx,h-.7,Z0-.3),bx(X1-X0,.9,.7,gr,cx,h-.7,Z1+.3),bx(.7,.9,Z1-Z0,gr,X0-.3,h-.7,cz),bx(.7,.9,Z1-Z0,gr,X1+.3,h-.7,cz))}
 mk(it);var cx=(X0+X1)/2,cz=(Z0+Z1)/2;box(cx,Z0-.5,X1-X0+2,1);box(cx,Z1+.5,X1-X0+2,1);box(X0-.5,cz,1,Z1-Z0+2);box(X1+.5,cz,1,Z1-Z0+2)}
function fenceWalls(h,col){walls(h,col)}
function ceiling(h,col,tex){var ct=px(128,128,function(x,y){var l=(x%64<2||y%64<2)?-40:0;return[222+l,226+l,224+l]},true);ct.repeat.set((X1-X0)/4,(Z1-Z0)/4);var c=new T.Mesh(new T.PlaneGeometry(X1-X0,Z1-Z0),new T.MeshStandardMaterial({map:ct,roughness:1,color:col||0xffffff}));c.rotation.x=Math.PI/2;c.position.set((X0+X1)/2,h,(Z0+Z1)/2);scene.add(c);
 var it=[];for(var x=X0+6;x<=X1-6;x+=8)for(var z=Z0+4;z<=Z1-4;z+=6)it.push(bx(5.2,.1,.6,0xffffff,x,h-.07,z));scene.add(new T.Mesh(V3.merge(it),new T.MeshBasicMaterial({vertexColors:true})))}
function tree(it,x,z,s){s=s||1;it.push(I(V3.cyl(.2*s,.3*s,2.4*s,6),0x4a3220,x,1.2*s,z),I(V3.sph(1.5*s,8,6),0x3f7a34,x,3.4*s,z,0,0,0,1,.95,1),I(V3.sph(1.1*s,8,6),0x4c8a3c,x+.7*s,4.1*s,z+.3*s))}
function plant(it,x,z){it.push(I(V3.cyl(.4,.3,.6,8),0xa8683a,x,.3,z),I(V3.sph(.55,7,6),0x2a7a2a,x,1.0,z),I(V3.sph(.4,7,6),0x3a8a3a,x+.2,1.4,z+.1))}
function humanGeo(c){var it=[bx(.9,1.0,.5,c.shirt||0x3a6ad8,0,1.45,0),bx(.8,.8,.8,c.skin||0xf2c8a0,0,2.3,0),bx(.82,.22,.82,c.hair||0x2a1a10,0,2.64,0),bx(.4,1.0,.4,c.shirt||0x3a6ad8,-.66,1.4,0),bx(.4,1.0,.4,c.shirt||0x3a6ad8,.66,1.4,0),bx(.42,.95,.42,c.pants||0x3a3a3a,-.23,.48,0),bx(.42,.95,.42,c.pants||0x3a3a3a,.23,.48,0)];var g=V3.merge(it);g.scale(.66,.66,.66);return g}
/* ---------------- mundo del juego ---------------- */
var WORLD=CFG.world();
PI.length&&mk(PI,matV,true);
var TG=CFG.targets();
var prodGroup=new T.Group();scene.add(prodGroup);
TG.forEach(function(p){if(p.x==null){var q=freePoint2(p);p.x=q[0];p.z=q[1]}var g=new T.Group();var m=new T.Mesh(p.geo(),matV);m.scale.setScalar(p.sc||1.9);m.castShadow=true;g.add(m);
 var ring=new T.Mesh(new T.RingGeometry(1,1.25,28),new T.MeshBasicMaterial({color:0xffe45a,transparent:true,opacity:.8,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.04;g.add(ring);
 var lb=new T.Mesh(new T.PlaneGeometry(3.2,.8),new T.MeshBasicMaterial({map:txt(p.n,256,64,'rgba(10,60,30,.85)','#ffe45a','900 34px system-ui'),transparent:true,depthTest:false}));lb.position.y=2.6;lb.renderOrder=9;g.add(lb);
 var arr=new T.Mesh(new T.ConeGeometry(.3,.6,4),new T.MeshBasicMaterial({color:0xffe45a}));arr.rotation.x=Math.PI;arr.position.y=1.9;g.add(arr);
 g.position.set(p.x,p.y0||.05,p.z);g.visible=false;prodGroup.add(g);p.g=g;p.m=m;p.lb=lb;p.ring=ring;p.arr=arr});
function freePoint2(p){return freeNear(R(X0+6,X1-6),R(Z0+6,Z1-6),1,4)}
/* ---------------- vehículo ---------------- */
var DSK={clasico:{n:'Clásico',price:0,a:0xe03030,b:0x2a2e34,c:0xf0f0f0,grip:0,spd:0},azul:{n:'Azul racing',price:90,a:0x2a6ad8,b:0x1a2a4a,c:0xffd23a,grip:.05,spd:0},verde:{n:'Verde lima',price:150,a:0x5ad83a,b:0x1a4a1a,c:0xffffff,grip:.08,spd:0},neon:{n:'Neón',price:280,a:0xff40d0,b:0x30e0ff,c:0xffffff,grip:.1,spd:.04},dorado:{n:'Dorado',price:520,a:0xffd23a,b:0xd8a020,c:0xffffff,grip:.12,spd:.08},arcoiris:{n:'Arcoíris',price:900,a:0xffffff,b:0xffffff,c:0xffffff,grip:.15,spd:.12,rainbow:1}};
var SKINS=CFG.skins||DSK;
var cart=new T.Group(),cartParts={};
function buildCart(){while(cart.children.length)cart.remove(cart.children[0]);cartParts={tint:[]};var sk=SKINS[S.skin]||SKINS.clasico;CFG.vehicle(cart,sk,cartParts);
 cartParts.items=new T.Group();cart.add(cartParts.items);
 var ar=new T.Mesh(V3.merge([I(V3.cone(.3,.8,4),0xffe45a,0,0,.4,Math.PI/2,0,0),bx(.16,.1,.7,0xffe45a,0,0,-.2)]),new T.MeshBasicMaterial({vertexColors:true,depthTest:false}));ar.position.set(0,CFG.arrowY||2.8,0);ar.renderOrder=10;ar.visible=false;cart.add(ar);cartParts.arrow=ar;if(!cartParts.rider)cartParts.rider=new T.Group()}
scene.add(cart);
var basketN=0;function addBasket(p){var cg=CFG.cargo||{x:.3,z:.5,y:.6};var m=new T.Mesh(p.geo(),matV);m.scale.setScalar(CFG.cargoSc||.7);m.position.set(R(-cg.x,cg.x),cg.y+Math.floor(basketN/4)*.18,R(-cg.z,cg.z)+(cg.oz||0));m.rotation.y=R(0,6);cartParts.items.add(m);basketN++}
/* ---------------- física ---------------- */
var car={x:WORLD.spawn[0],z:WORLD.spawn[1],h:WORLD.spawn[2],vx:0,vz:0,steer:0,drift:false,slip:0,boost:0,bcd:0,stun:0,yaw:0};
function upg(){return{acc:12+S.up.motor*1.8+SKINS[S.skin].spd*25,max:13+S.up.motor*1.1+SKINS[S.skin].spd*20,gripD:1.0+S.up.grip*.38+SKINS[S.skin].grip*3,steer:2.3+S.up.grip*.08,mag:2.2+S.up.magnet*.7,clock:S.up.clock*10,boost:S.up.turbo}}
/* ---------------- entrada ---------------- */
var jx=0,jz=0,jid=null,hand=false,wantBoost=false,keys={};
var joy=$('joy');function jm(e){var r=joy.getBoundingClientRect(),dx=e.clientX-(r.left+65),dy=e.clientY-(r.top+65),l=Math.hypot(dx,dy),m=55;if(l>m){dx*=m/l;dy*=m/l}jx=dx/m;jz=dy/m;joy.firstChild.style.transform='translate('+dx+'px,'+dy+'px)'}
joy.addEventListener('pointerdown',function(e){jid=e.pointerId;joy.setPointerCapture(e.pointerId);jm(e);audioOn()});joy.addEventListener('pointermove',function(e){if(e.pointerId===jid)jm(e)});function jend(e){if(e.pointerId===jid){jid=null;jx=jz=0;joy.firstChild.style.transform=''}}joy.addEventListener('pointerup',jend);joy.addEventListener('pointercancel',jend);
function hold(id,on,off){var b=$(id);b.addEventListener('pointerdown',function(e){e.preventDefault();b.setPointerCapture(e.pointerId);b.classList.add('on');on();audioOn()});function up(){b.classList.remove('on');off&&off()}b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up)}
hold('bDrift',function(){hand=true},function(){hand=false});hold('bTurbo',function(){doBoost()});hold('bHint',function(){doHint()});hold('bShop',function(){openShop()});
addEventListener('keydown',function(e){keys[e.code]=1;if(e.code==='Space')hand=true;if(e.code==='ShiftLeft'||e.code==='KeyE')doBoost();if(e.code==='KeyH')doHint()});addEventListener('keyup',function(e){keys[e.code]=0;if(e.code==='Space')hand=false});
/* ---------------- audio ---------------- */
var au=false,sfxN={};
function audioOn(){if(au)return;var ac=V3.audio();if(!ac)return;au=true;
 var nb=ac.createBufferSource();nb.buffer=V3.noiseBuf();nb.loop=true;var lp=ac.createBiquadFilter();lp.type='bandpass';lp.frequency.value=900;lp.Q.value=.8;var g=ac.createGain();g.gain.value=0;nb.connect(lp);lp.connect(g);g.connect(V3.master);nb.start();sfxN.roll={g:g,f:lp};
 var nb2=ac.createBufferSource();nb2.buffer=V3.noiseBuf();nb2.loop=true;nb2.playbackRate.value=1.4;var bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=2600;bp.Q.value=5;var g2=ac.createGain();g2.gain.value=0;nb2.connect(bp);bp.connect(g2);g2.connect(V3.master);nb2.start();sfxN.skid={g:g2,f:bp};startMusic()}
function startMusic(){var ac=V3.audio();var notes=[261.6,329.6,392,523.3,392,329.6,293.7,349.2,440,587.3,440,349.2];var i=0;var mg=ac.createGain();mg.gain.value=.05;mg.connect(V3.master);setInterval(function(){if(window.__misMute||ST!=='play')return;var o=ac.createOscillator(),g=ac.createGain();o.type='triangle';o.frequency.value=notes[i%notes.length]*(i%24<12?1:1.5);g.gain.setValueAtTime(0,ac.currentTime);g.gain.linearRampToValueAtTime(.7,ac.currentTime+.02);g.gain.exponentialRampToValueAtTime(.001,ac.currentTime+.32);o.connect(g);g.connect(mg);o.start();o.stop(ac.currentTime+.35);i++},260)}
function snd(n,v,r){if(window.__misMute)return;V3.shot(n,v,r)}
function pa(t){try{if(window.__misMute||!window.speechSynthesis)return;var u=new SpeechSynthesisUtterance(t);u.lang='es-ES';u.rate=1.05;u.pitch=1.1;u.volume=.8;speechSynthesis.cancel();speechSynthesis.speak(u)}catch(e){}}
function dingdong(){var ac=V3.audio();if(!ac||window.__misMute)return;[880,660].forEach(function(f,i){var o=ac.createOscillator(),g=ac.createGain();o.type='sine';o.frequency.value=f;var t=ac.currentTime+i*.35;g.gain.setValueAtTime(0,t);g.gain.linearRampToValueAtTime(.12,t+.02);g.gain.exponentialRampToValueAtTime(.001,t+.8);o.connect(g);g.connect(V3.master);o.start(t);o.stop(t+.9)})}
/* ---------------- gente ---------------- */
var npcs=[],guard=null;
var PH=CFG.lines;
function human(o){var g=new T.Group(),mat=new T.MeshStandardMaterial({vertexColors:true,roughness:.8,flatShading:true});function part(it,x,y,z){var m=new T.Mesh(V3.merge(it),mat);m.position.set(x,y,z);m.castShadow=true;g.add(m);return m}
 part([bx(.9,1.0,.5,o.shirt,0,0,0)],0,1.45,0);part([bx(.8,.8,.8,o.skin,0,0,0),bx(.82,.22,.82,o.hair,0,.34,0),bx(.14,.1,.04,0x1a1a1a,-.2,.05,.41),bx(.14,.1,.04,0x1a1a1a,.2,.05,.41)].concat(o.cap?[bx(.9,.2,.9,o.cap,0,.46,.05),bx(.8,.06,.5,o.cap,0,.4,.5)]:[]),0,2.3,0);
 function limb(x,y,w,h,c,c2){var p=new T.Group();p.position.set(x,y,0);var m=new T.Mesh(V3.merge([bx(w,h,w,c,0,-h/2,0),bx(w+.02,h*.28,w+.02,c2||c,0,-h*.86,0)]),mat);m.castShadow=true;p.add(m);g.add(p);return p}
 var aL=limb(-.66,1.9,.4,1.0,o.shirt,o.skin),aR=limb(.66,1.9,.4,1.0,o.shirt,o.skin),lL=limb(-.23,.95,.42,.95,o.pants),lR=limb(.23,.95,.42,.95,o.pants);g.scale.setScalar(.66);g.userData={aL:aL,aR:aR,lL:lL,lR:lR};return g}
function freePoint(r){for(var k=0;k<80;k++){var x=R(X0+2,X1-2),z=R(Z0+2,Z1-2);if(isFree(x,z,r||.7))return[x,z]}return[WORLD.spawn[0],WORLD.spawn[1]]}
function spawnNPC(i){var n=freePoint(.8);var m=human({skin:[0xf2c8a0,0xd8a070,0x9a6a40][i%3],shirt:CFG.npcShirts?CFG.npcShirts[i%CFG.npcShirts.length]:new T.Color().setHSL(R(0,1),.5,.5).getHex(),pants:[0x2a3a6a,0x3a3a3a,0x5a4a3a][i%3],hair:[0x2a1a10,0x6a4a2a,0xc8c8c8,0x1a1a1a][i%4]});if(CFG.npcScale)m.scale.setScalar(CFG.npcScale*(i%3===0?.82:1));m.position.set(n[0],0,n[1]);scene.add(m);
 npcs.push({g:m,x:n[0],z:n[1],tx:n[0],tz:n[1],wait:R(0,3),sp:R(1.1,1.7),down:0,ph:R(0,6),talk:0,bonus:0})}
for(var i=0;i<(CFG.npcN||30);i++)spawnNPC(i);
function say(npc,t){if(npc.sp_){npc.g.remove(npc.sp_)}var s=new T.Sprite(new T.SpriteMaterial({map:txt(t,256,64,'rgba(255,255,255,.95)','#222','800 32px system-ui'),transparent:true,depthTest:false}));s.scale.set(3.2,.8,1);s.position.y=3.9;s.renderOrder=11;npc.g.add(s);npc.sp_=s;npc.talk=1.6}
function mkGuard(){if(guard)return;var CH=CFG.chaser;var m=human(CH.look);m.scale.setScalar(CH.scale||.72);var sp=null;for(var k=0;k<40;k++){var q=freePoint(.8);if(Math.hypot(q[0]-car.x,q[1]-car.z)>34){sp=q;break}}sp=sp||freePoint(.8);m.position.set(sp[0],0,sp[1]);scene.add(m);guard={g:m,x:sp[0],z:sp[1],cd:0};say({g:m},'');pa(CH.pa)}
function guardOff(){if(guard){scene.remove(guard.g);guard=null}}
/* ---------------- estado de la partida ---------------- */
var ST='menu',L={items:[],got:{},time:0,max:0,hits:0,earned:0,start:0,hint:0,done:false,combo:0,perf:0};
function newList(){var n=Math.min(2+S.level,9);var pool=TG.slice();L.items=[];for(var i=0;i<n;i++){var k=Math.floor(Math.random()*pool.length);L.items.push(pool.splice(k,1)[0])}L.got={};L.max=50+n*26+upg().clock;L.time=L.max;L.hits=0;L.earned=0;L.done=false;L.hint=0;basketN=0;while(cartParts.items.children.length)cartParts.items.remove(cartParts.items.children[0]);
 TG.forEach(function(p){p.g.visible=L.items.indexOf(p)>=0;p.lb.visible=false;p.arr.visible=true});uiList()}
function uiList(){var h='<b>'+CFG.listTitle+' · nivel '+S.level+'</b>';L.items.forEach(function(p){var d=L.got[p.id];h+='<div class="'+(d?'d':'')+'">'+(d?'✓ ':'☐ ')+p.n+' <small>'+p.sec+'</small></div>'});$('list').innerHTML=h}
function uiMoney(){$('money').textContent=Math.floor(S.money)+' €'}
function pop(t,c){var d=document.createElement('div');d.textContent=t;if(c)d.style.color=c;$('pop').appendChild(d);setTimeout(function(){if(d.parentNode)d.parentNode.removeChild(d)},1450);if($('pop').children.length>3)$('pop').removeChild($('pop').firstChild)}
function doBoost(){if(ST!=='play'||car.bcd>0||upg().boost<=0)return;car.boost=.9;car.bcd=Math.max(2.5,7-upg().boost*.8);pop('¡TURBO!','#5ac8ff');snd('swoosh',.5,1.4)}
function doHint(){if(ST!=='play')return;if(S.money<5){pop('Necesitas 5 €','#ff9a9a');return}S.money-=5;uiMoney();L.hint=12;pop('Pista activada','#ffe45a')}
/* ---------------- tienda ---------------- */
var UPS=[{k:'grip',n:'Ruedas de drift',d:'Más control al derrapar y giro más ágil',max:5,cost:[60,120,220,380,600]},{k:'motor',n:'Motor del carro',d:'Más aceleración y velocidad máxima',max:5,cost:[70,140,240,400,640]},{k:'turbo',n:'Turbo',d:'Desbloquea el turbo y lo recarga antes',max:5,cost:[80,150,260,420,660]},{k:'magnet',n:'Imán de compra',d:'Coges productos desde más lejos',max:4,cost:[50,100,180,300]},{k:'clock',n:'Reloj extra',d:'+10 segundos por lista',max:5,cost:[50,100,170,260,380]}];
var EXT=[{n:'Bebida energética',d:'Recarga el turbo al instante',c:15,f:function(){car.bcd=0;pop('Turbo listo','#5ac8ff')}},{n:'Tiempo extra',d:'+20 segundos en la lista actual',c:25,f:function(){L.time+=20;pop('+20 s','#a8ffc8')}},{n:'Cupón descuento',d:'Siguiente lista: premio +50 %',c:40,f:function(){L.coupon=1;pop('Cupón activado','#ffe45a')}}];
var tab=1;
function shopRender(){$('shMoney').textContent=Math.floor(S.money)+' €';var h='';
 if(tab===1)UPS.forEach(function(u){var lv=S.up[u.k],mx=lv>=u.max,c=u.cost[lv];h+='<div class="it"><b>'+u.n+' · nivel '+lv+'/'+u.max+'</b><small>'+u.d+'</small><button '+(mx||S.money<c?'disabled':'')+' onclick="buyUp(\''+u.k+'\')">'+(mx?'Máximo':'Comprar · '+c+' €')+'</button></div>'});
 else if(tab===2)Object.keys(SKINS).forEach(function(k){var s=SKINS[k],own=S.skins[k];h+='<div class="it"><b>'+s.n+'</b><small>'+(s.grip||s.spd?'Bonus: '+(s.grip?'derrape ':'')+(s.spd?'velocidad':''):'Sin bonus')+'</small><button '+(own?(S.skin===k?'disabled':''):(S.money<s.price?'disabled':''))+' onclick="buySkin(\''+k+'\')">'+(own?(S.skin===k?'En uso':'Usar'):'Comprar · '+s.price+' €')+'</button></div>'});
 else EXT.forEach(function(e,i){h+='<div class="it"><b>'+e.n+'</b><small>'+e.d+'</small><button '+(S.money<e.c||ST!=='play'&&ST!=='paused'?'disabled':'')+' onclick="buyExt('+i+')">Comprar · '+e.c+' €</button></div>'});
 $('shList').innerHTML=h;$('t1').className=tab===1?'on':'';$('t2').className=tab===2?'on':'';$('t3').className=tab===3?'on':''}
function buyUp(k){var u=UPS.filter(function(x){return x.k===k})[0],lv=S.up[k];if(lv>=u.max||S.money<u.cost[lv])return;S.money-=u.cost[lv];S.up[k]++;snd('cash',.6,1);save();shopRender();uiMoney()}
function buySkin(k){var s=SKINS[k];if(!S.skins[k]){if(S.money<s.price)return;S.money-=s.price;S.skins[k]=1;snd('cash',.6,1)}S.skin=k;buildCart();save();shopRender();uiMoney()}
function buyExt(i){var e=EXT[i];if(S.money<e.c)return;S.money-=e.c;e.f();snd('cash',.6,1);save();shopRender();uiMoney()}
var shopFrom='';
function openShop(){shopFrom=ST;if(ST==='play')ST='paused';$('ovShop').style.display='flex';tab=tab||1;shopRender()}
function closeShop(){$('ovShop').style.display='none';if(shopFrom==='play')ST='play';else if(shopFrom==='sum')$('ovSum').style.display='flex';else if(shopFrom==='menu')$('ovStart').style.display='flex'}
$('t1').onclick=function(){tab=1;shopRender()};$('t2').onclick=function(){tab=2;shopRender()};$('t3').onclick=function(){tab=3;shopRender()};
$('shClose').onclick=closeShop;$('shopB0').onclick=function(){$('ovStart').style.display='none';shopFrom='menu';ST='menuShop';$('ovShop').style.display='flex';shopRender()};
var _cs=closeShop;closeShop=function(){$('ovShop').style.display='none';if(shopFrom==='play'){ST='play'}else if(shopFrom==='sum'){$('ovSum').style.display='flex';ST='sum'}else{$('ovStart').style.display='flex';ST='menu'}};$('shClose').onclick=closeShop;
$('startB').onclick=function(){$('ovStart').style.display='none';startRun()};
function startRun(){newList();car.x=WORLD.spawn[0];car.z=WORLD.spawn[1];car.h=WORLD.spawn[2];car.vx=car.vz=0;car.stun=0;ST='play';$('bShop').style.display='flex';audioOn();dingdong();pa(CFG.pa.welcome);while(npcs.length<10+S.level*2&&npcs.length<26)spawnNPC(npcs.length);guardOff()}
function endRun(ok){if(ST!=='play')return;ST='sum';var base=ok?30+L.items.length*12+Math.floor(L.time):0;if(ok&&L.coupon){base=Math.floor(base*1.5);L.coupon=0}S.money+=base;if(ok)S.level++;if(Math.floor(L.earned)>S.best)S.best=Math.floor(L.earned);save();uiMoney();
 $('sumT').textContent=ok?CFG.winTitle:'Se acabó el tiempo';$('sumP').innerHTML=(ok?CFG.winLabel+': <b>+'+base+' €</b><br>':CFG.failLabel+'<br>')+'Dinero ganado derrapando: <b>'+Math.floor(L.earned)+' €</b><br>Gente embestida: '+L.hits+'<br>Dinero total: <b>'+Math.floor(S.money)+' €</b>';$('sumNext').textContent=ok?'Siguiente lista':'Reintentar';$('ovSum').style.display='flex';$('bShop').style.display='none';guardOff();if(ok){snd('win',.7,1);dingdong()}}
$('sumNext').onclick=function(){$('ovSum').style.display='none';startRun()};$('sumShop').onclick=function(){$('ovSum').style.display='none';shopFrom='sum';ST='sumShop';$('ovShop').style.display='flex';shopRender()};
/* ---------------- bucle principal ---------------- */
var camX=WORLD.spawn[0],camZ=WORLD.spawn[1]+6,pend=0,combo=1,dTimer=0,noDrift=0,camShake=0,nearT=0,paT=30,skT=0,skI=0;
buildCart();uiMoney();
var skids=[];(function(){for(var i=0;i<160;i++){var m=new T.Mesh(new T.PlaneGeometry(.18,.5),new T.MeshBasicMaterial({color:0x1a1a1a,transparent:true,opacity:0,depthWrite:false}));m.rotation.x=-Math.PI/2;m.position.y=.02;scene.add(m);skids.push({m:m,t:9})}})();
function circleBox(c,r){var cx=clamp(car.x,c.x0,c.x1),cz=clamp(car.z,c.z0,c.z1),dx=car.x-cx,dz=car.z-cz,d=Math.hypot(dx,dz);
 if(d<r&&d>1e-5){var nx=dx/d,nz=dz/d;car.x=cx+nx*r;car.z=cz+nz*r;var vn=car.vx*nx+car.vz*nz;if(vn<0){car.vx-=1.35*vn*nx;car.vz-=1.35*vn*nz;return -vn}}
 else if(d<=1e-5){var a=car.x-c.x0,b=c.x1-car.x,cc=car.z-c.z0,dd=c.z1-car.z,m=Math.min(a,b,cc,dd);if(m===a)car.x=c.x0-r;else if(m===b)car.x=c.x1+r;else if(m===cc)car.z=c.z0-r;else car.z=c.z1+r}
 return 0}
function bankDrift(lost){if(pend>0){if(lost){pend*=.35;pop('¡Choque! Pierdes parte','#ff9a9a')}var e=pend/14;S.money+=e;L.earned+=e;if(e>=1){pop('+'+Math.floor(e)+' €','#a8ffc8');snd('coins',.5,1)}uiMoney();pend=0}combo=1;dTimer=0;$('drift').innerHTML=''}
function npcStep(dt){
 npcs.forEach(function(n){
  if(n.down>0){n.down-=dt;var k=n.down>2.4?(3-n.down)/.6:n.down<.5?n.down/.5:1;n.g.rotation.x=-Math.PI/2*clamp(k,0,1);n.g.position.y=.35*clamp(k,0,1);return}
  n.g.rotation.x=0;n.g.position.y=0;n.bonus=Math.max(0,n.bonus-dt);
  var moving=false;if(n.wait>0){n.wait-=dt}else{var dx=n.tx-n.x,dz=n.tz-n.z,d=Math.hypot(dx,dz);if(d<.5){n.wait=R(.5,4);var a=R(0,6.283),r=R(5,16);var tx=n.x+Math.cos(a)*r,tz=n.z+Math.sin(a)*r;n.tx=tx;n.tz=tz}else{var nx=n.x+dx/d*n.sp*dt,nz=n.z+dz/d*n.sp*dt;if(isFree(nx,nz,.6)){n.x=nx;n.z=nz;moving=true;n.g.rotation.y+=(((Math.atan2(dx,dz)-n.g.rotation.y+Math.PI*3)%(Math.PI*2))-Math.PI)*Math.min(1,dt*8)}else{n.tx=n.x;n.tz=n.z;n.wait=R(.2,1)}}}
  if(moving)n.ph+=dt*n.sp*5;var sw=moving?Math.sin(n.ph)*.7:0,u=n.g.userData;u.lL.rotation.x=sw;u.lR.rotation.x=-sw;u.aL.rotation.x=-sw*.7;u.aR.rotation.x=sw*.7;n.g.position.x=n.x;n.g.position.z=n.z;
  if(n.talk>0){n.talk-=dt;if(n.talk<=0&&n.sp_){n.g.remove(n.sp_);n.sp_=null}}})}
V3.on(function(dt,t){
 dt=Math.min(dt||.016,.05);
 if(ST==='play'){
  var u=upg();
  L.time-=dt;if(L.time<=0){endRun(false)}var tm=Math.max(0,Math.ceil(L.time));$('tm').textContent=Math.floor(tm/60)+':'+('0'+tm%60).slice(-2);$('timer').style.color=L.time<15?'#ff8a8a':'#fff';
  var sx=clamp(jx+(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),-1,1);var fwd=clamp(-jz*1.3,0,1)+(keys.KeyW||keys.ArrowUp?1:0);fwd=Math.min(1,fwd);var back=jz>.3||keys.KeyS||keys.ArrowDown;
  car.steer+=(sx-car.steer)*Math.min(1,dt*9);
  var fx=Math.sin(car.h),fz=Math.cos(car.h),rx=Math.cos(car.h),rz=-Math.sin(car.h);
  var vf=car.vx*fx+car.vz*fz;var stunned=car.stun>0;car.stun-=dt;car.bcd-=dt;
  var spd=Math.hypot(car.vx,car.vz);
  car.h-=car.steer*u.steer*clamp(vf/3.5,-1,1)*(hand?1.6:1)*dt;
  fx=Math.sin(car.h);fz=Math.cos(car.h);rx=Math.cos(car.h);rz=-Math.sin(car.h);
  vf=car.vx*fx+car.vz*fz;var vr=car.vx*rx+car.vz*rz;
  var amax=u.max*(CFG.maxMul||1)*(car.boost>0?1.55:1);
  if(!stunned){if(back){vf-=(vf>.5?28:u.acc*.6)*dt*clamp(jz*1.4,.5,1)}else if(fwd>0&&vf<amax){vf+=((u.acc*(CFG.accMul||1))+(car.boost>0?22:0))*fwd*dt}else if(fwd<=0){vf*=1-1.3*dt}}
  vf*=1-.28*dt*(CFG.roll||1);if(hand)vf*=1-.35*dt;vf=clamp(vf,-6,amax*1.15);car.boost-=dt;
  vr*=Math.exp(-(hand?u.gripD*(CFG.gripD||1):8*(CFG.gripN||1))*dt);
  car.vx=fx*vf+rx*vr;car.vz=fz*vf+rz*vr;
  car.x+=car.vx*dt;car.z+=car.vz*dt;
  var imp=0;for(var i=0;i<colliders.length;i++){var c=colliders[i];if(car.x<c.x0-2||car.x>c.x1+2||car.z<c.z0-2||car.z>c.z1+2)continue;imp=Math.max(imp,circleBox(c,.95))}
  if(imp>3){snd('metal'+(1+Math.floor(Math.random()*4)),clamp(imp/14,.15,.6),R(.8,1.2));camShake=Math.min(.6,imp*.05);if(imp>7)bankDrift(true)}
  spd=Math.hypot(car.vx,car.vz);var slip=Math.atan2(Math.abs(vr),Math.abs(vf)+.01);car.slip=slip;
  var drifting=spd>4.5&&((hand&&slip>.2)||slip>.55);car.drift=drifting;
  if(drifting){noDrift=0;dTimer+=dt;pend+=spd*slip*14*dt*combo;if(dTimer>1.6){dTimer=0;combo=Math.min(combo+1,8);pop('COMBO x'+combo,'#5ac8ff')}$('drift').innerHTML=Math.floor(pend)+' pts<small>COMBO x'+combo+'</small>';
   skT-=dt;if(skT<=0){skT=.045;[[-.45,-.65],[.45,-.65]].forEach(function(w){var s=skids[skI++%skids.length];s.t=0;s.m.position.set(car.x+rx*w[0]+fx*w[1],.02,car.z+rz*w[0]+fz*w[1]);s.m.rotation.z=-car.h+Math.atan2(vr,vf)*0;s.m.rotation.y=0;s.m.rotation.set(-Math.PI/2,0,-Math.atan2(car.vx,car.vz)+Math.PI)})}}
  else{noDrift+=dt;if(noDrift>1&&pend>0)bankDrift(false)}
  skids.forEach(function(s){if(s.t<8){s.t+=dt;s.m.material.opacity=Math.max(0,.55-s.t*.09)}});
  /* productos */
  var mag=u.mag+.9;L.items.forEach(function(p){if(L.got[p.id])return;var dx=p.x-car.x,dz=p.z-car.z,d=Math.hypot(dx,dz);p.lb.visible=d<16;p.lb.quaternion.copy(cam.quaternion);p.g.rotation.y+=dt*1.5;p.m.position.y=.2+Math.sin(t*3+p.x)*.12;p.arr.position.y=2+Math.sin(t*4)*.15;p.ring.scale.setScalar(1+Math.sin(t*4)*.08);
   if(d<mag){L.got[p.id]=1;p.g.visible=false;addBasket(p);snd('coin',.7,1.1);pop('✓ '+p.n,'#a8ffc8');uiList();dingdong();if(L.items.every(function(q){return L.got[q.id]}))endRun(true)}});
  /* pista */
  if(L.hint>0){L.hint-=dt;var tgt=L.items.filter(function(p){return!L.got[p.id]}).sort(function(a,b){return Math.hypot(a.x-car.x,a.z-car.z)-Math.hypot(b.x-car.x,b.z-car.z)})[0];cartParts.arrow.visible=!!tgt;if(tgt){cartParts.arrow.rotation.y=Math.atan2(tgt.x-car.x,tgt.z-car.z)-car.h}}else cartParts.arrow.visible=false;
  /* gente */
  npcStep(dt);
  npcs.forEach(function(n){var dx=n.x-car.x,dz=n.z-car.z,d=Math.hypot(dx,dz);
   if(n.down<=0&&d<1.35){n.down=3;L.hits++;car.vx*=.75;car.vz*=.75;snd('punch'+(1+Math.floor(Math.random()*3)),.6,1);say(n,PH[Math.floor(Math.random()*PH.length)]);pop('¡Bolos!','#ff9a9a');if(S.money>=3){S.money-=3;uiMoney()}pend*=.85;if(L.hits>=3&&!guard)mkGuard()}
   else if(drifting&&n.down<=0&&d>1.35&&d<3&&n.bonus<=0){n.bonus=3;var b=Math.floor(60*combo);pend+=b;pop('¡SUSTO! +'+b,'#ffe45a');say(n,PH[Math.floor(Math.random()*PH.length)])}});
  /* segurata */
  if(guard){var dx=car.x-guard.x,dz=car.z-guard.z,d=Math.hypot(dx,dz);var gs=(CFG.chaser.speed||7)+Math.min(S.level,6)*.35;guard.x+=dx/d*gs*dt;guard.z+=dz/d*gs*dt;guard.g.position.set(guard.x,0,guard.z);guard.g.rotation.y=Math.atan2(dx,dz);var sw=Math.sin(t*12)*.9,gu=guard.g.userData;gu.lL.rotation.x=sw;gu.lR.rotation.x=-sw;gu.aL.rotation.x=-1.4;gu.aR.rotation.x=-1.4;guard.cd-=dt;
   if(d<1.7&&guard.cd<=0){guard.cd=3;car.stun=1.3;car.vx=dx/d*-1+car.vx*.2;car.vz=dz/d*-1;S.money=Math.max(0,S.money-10);uiMoney();pop(CFG.chaser.fine||'¡Multa! -10 €','#ff9a9a');snd('pain1',.6,1);bankDrift(true);guard.x-=dx/d*4;guard.z-=dz/d*4}}
  /* anuncios */
  paT-=dt;if(paT<=0){paT=R(40,70);dingdong();setTimeout(function(){pa(CFG.pa.random[Math.floor(Math.random()*CFG.pa.random.length)])},900)}
  /* sonido */
  if(sfxN.roll){var ac=V3.audio().currentTime;sfxN.roll.g.gain.setTargetAtTime(window.__misMute?0:clamp(spd/14,0,1)*.13,ac,.08);sfxN.roll.f.frequency.setTargetAtTime(500+spd*80,ac,.1);sfxN.skid.g.gain.setTargetAtTime(drifting&&!window.__misMute?.14*clamp(slip*2,0,1):0,ac,.05);sfxN.skid.f.frequency.setTargetAtTime(2200+spd*70,ac,.1)}
  /* cartel de combo parpadea */
 }
 /* visuales del carro */
 cart.position.set(car.x,0,car.z);cart.rotation.y=car.h;cart.rotation.z=-car.steer*clamp(Math.hypot(car.vx,car.vz)/14,0,1)*.12*(car.drift?1.5:1);if(cartParts.rider){cartParts.rider.rotation.z=car.steer*.12}
 if(SKINS[S.skin].rainbow&&cartParts.tint){cartParts.tint.forEach(function(m,i){m.color.setHSL((t*.4+i*.3)%1,.9,.55)})}
 sun.position.set(car.x+10,16,car.z+8);sun.target.position.set(car.x,0,car.z);
 /* cámara */
 if(ST==='play'||ST==='paused'||ST==='sum'||ST==='sumShop'){var fx2=Math.sin(car.h),fz2=Math.cos(car.h);var sp2=Math.hypot(car.vx,car.vz);var mvx=sp2>1?car.vx/sp2:fx2,mvz=sp2>1?car.vz/sp2:fz2;
  var dx=fx2*.75+mvx*.25,dz=fz2*.75+mvz*.25,dl=Math.hypot(dx,dz)||1;dx/=dl;dz/=dl;
  var dist=(CFG.camD||5.2)+sp2*.1,tx=car.x-dx*dist,tz=car.z-dz*dist;
  /* la cámara no atraviesa estantes: acerca el punto hasta que quede libre */
  var tt=1;for(var it2=0;it2<9;it2++){var qx=car.x+(tx-car.x)*tt,qz=car.z+(tz-car.z)*tt;if(isFree(qx,qz,.5))break;tt-=.12}if(tt<.15)tt=.15;tx=car.x+(tx-car.x)*tt;tz=car.z+(tz-car.z)*tt;
  var k=1-Math.exp(-dt*(ST==='play'?7:2));camX+=(tx-camX)*k;camZ+=(tz-camZ)*k;
  cam.rotation.order='XYZ';cam.position.set(camX+(Math.random()-.5)*camShake,(CFG.camH||2.7)+tt*.7+(Math.random()-.5)*camShake+clamp(sp2*.025,0,.4),camZ+(Math.random()-.5)*camShake);camShake=Math.max(0,camShake-dt*2);
  cam.lookAt(car.x+dx*3.2,.8,car.z+dz*3.2);cam.fov+=((72+clamp(sp2*.7,0,12)+(car.boost>0?10:0))-cam.fov)*Math.min(1,dt*4);cam.updateProjectionMatrix();cartParts.rider.visible=false}
 else{var a=t*.12;cam.rotation.order='XYZ';cam.rotation.set(0,0,0);var OR=CFG.orbit||[58,34,26,0,4];cam.position.set(Math.cos(a)*OR[0]+OR[3],OR[2],Math.sin(a)*OR[1]+OR[4]);cam.lookAt(OR[3],1,OR[4]);npcStep(dt)}
});
$('bShop').style.display='none';
