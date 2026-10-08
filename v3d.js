/* v3d.js · utilidades 3D compartidas por las apps de "Explorar" (espacio, acuario, ciudades…) */
(function(){
var V=window.V3={},T=window.THREE;
V.touch=matchMedia('(pointer:coarse)').matches||('ontouchstart' in window);
V.rnd=function(a,b){return a+Math.random()*(b-a)};V.cl=function(v,a,b){return Math.max(a,Math.min(b,v))};V.lerp=function(a,b,t){return a+(b-a)*t};V.pick=function(a){return a[Math.floor(Math.random()*a.length)]};
var rs=12345;V.sr=function(){rs=(rs*16807)%2147483647;return rs/2147483647};V.seed=function(s){rs=s||1};
/* ruido */
function hs(x,y){var h=Math.sin(x*127.1+y*311.7)*43758.5453;return h-Math.floor(h)}
function vn(x,y){var xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=xf*xf*(3-2*xf),v=yf*yf*(3-2*yf);var a=hs(xi,yi),b=hs(xi+1,yi),c=hs(xi,yi+1),d=hs(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v}
V.noise=vn;V.fbm=function(x,y,o){var s=0,a=.5,f=1;for(var i=0;i<(o||4);i++){s+=a*vn(x*f,y*f);f*=2.03;a*=.5}return s};
/* canvas */
V.cvs=function(w,h,fn){var c=document.createElement('canvas');c.width=w;c.height=h;fn(c.getContext('2d'),w,h);return c};
V.tex=function(c,o){o=o||{};var t=new T.CanvasTexture(c);t.colorSpace=T.SRGBColorSpace;if(o.repeat){t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(o.repeat[0],o.repeat[1])}t.anisotropy=4;return t};
V.dot=function(){if(V._dot)return V._dot;return V._dot=V.tex(V.cvs(64,64,function(x){var g=x.createRadialGradient(32,32,1,32,32,31);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.3,'rgba(255,255,255,.55)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,64,64)}))};
V.label=function(txt,o){o=o||{};var c=V.cvs(256,64,function(x,w,h){x.font='700 30px system-ui,sans-serif';x.textAlign='center';x.textBaseline='middle';x.lineWidth=6;x.strokeStyle='rgba(0,0,0,.7)';x.strokeText(txt,w/2,h/2);x.fillStyle=o.color||'#fff';x.fillText(txt,w/2,h/2)});var s=new T.Sprite(new T.SpriteMaterial({map:V.tex(c),transparent:true,depthWrite:false,depthTest:o.depth===true,fog:false}));s.scale.set(o.w||8,(o.w||8)/4,1);return s};
/* geometria */
V.MX=function(x,y,z,rx,ry,rz,sx,sy,sz){return new T.Matrix4().compose(new T.Vector3(x||0,y||0,z||0),new T.Quaternion().setFromEuler(new T.Euler(rx||0,ry||0,rz||0)),new T.Vector3(sx||1,sy||1,sz||1))};
V.I=function(g,col,x,y,z,rx,ry,rz,sx,sy,sz){return[g,V.MX(x,y,z,rx,ry,rz,sx,sy,sz),col]};
V.merge=function(items){var P=[],N=[],U=[],C=[];items.forEach(function(it){var g=it[0].index?it[0].toNonIndexed():it[0].clone();if(it[1])g.applyMatrix4(it[1]);var p=g.attributes.position.array,n=g.attributes.normal.array,u=g.attributes.uv?g.attributes.uv.array:null,cc=(it[2]===undefined&&g.attributes.color)?g.attributes.color.array:null,c=new T.Color(it[2]===undefined?0xffffff:it[2]);for(var i=0;i<p.length;i++){P.push(p[i]);N.push(n[i])}for(var j=0;j<p.length/3;j++){U.push(u?u[j*2]:0,u?u[j*2+1]:0);if(cc)C.push(cc[j*3],cc[j*3+1],cc[j*3+2]);else C.push(c.r,c.g,c.b)}});var r=new T.BufferGeometry();r.setAttribute('position',new T.Float32BufferAttribute(P,3));r.setAttribute('normal',new T.Float32BufferAttribute(N,3));r.setAttribute('uv',new T.Float32BufferAttribute(U,2));r.setAttribute('color',new T.Float32BufferAttribute(C,3));return r};
V.sph=function(r,w,h){return new T.SphereGeometry(r,w||12,h||9)};V.cyl=function(a,b,h,s){return new T.CylinderGeometry(a,b,h,s||8)};V.box=function(x,y,z){return new T.BoxGeometry(x,y,z)};V.cap=function(r,l){return new T.CapsuleGeometry(r,l,4,10)};V.cone=function(r,h,s){return new T.ConeGeometry(r,h,s||8)};
/* arranque */
V.init=function(o){o=o||{};
 var r=new T.WebGLRenderer({antialias:!V.touch,powerPreference:'high-performance',alpha:false});r.setPixelRatio(Math.min(devicePixelRatio||1,o.pr||(V.touch?1.6:2)));
 r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=o.exposure||1;if(o.shadows){r.shadowMap.enabled=true;r.shadowMap.type=T.PCFSoftShadowMap}
 var cv=r.domElement;cv.style.cssText='position:fixed;inset:0;width:100%;height:100%;display:block;touch-action:none;z-index:0';document.body.appendChild(cv);
 V.r=r;V.canvas=cv;V.scene=new T.Scene();V.cam=new T.PerspectiveCamera(o.fov||55,1,o.near||.1,o.far||4000);V.scene.add(V.cam);
 function rs(){var w=innerWidth,h=innerHeight;r.setSize(w,h,false);V.cam.aspect=w/h;V.cam.updateProjectionMatrix();V.w=w;V.h=h}addEventListener('resize',rs);rs();
 V.time=0;V.updaters=[];
 var last=performance.now();
 function loop(t){requestAnimationFrame(loop);var dt=Math.min(.05,(t-last)/1000||0);last=t;if(document.hidden)return;V.time+=dt;for(var i=0;i<V.updaters.length;i++)V.updaters[i](dt,V.time);if(V.render)V.render(dt);else r.render(V.scene,V.cam)}
 requestAnimationFrame(loop);return V};
V.on=function(fn){V.updaters.push(fn)};
/* camara orbital con inercia: arrastrar = girar, pellizcar o rueda = zoom */
V.orbit=function(o){o=o||{};
 var S={yaw:o.yaw||0,pitch:o.pitch||.3,dist:o.dist||30,min:o.min||3,max:o.max||300,target:new T.Vector3(),tgt:new T.Vector3(),vy:0,vp:0,auto:o.auto||0,minP:o.minP===undefined?-1.4:o.minP,maxP:o.maxP||1.45,lock:false,follow:null,smooth:o.smooth||6};
 var ptr={},pd=0,moved=0,t0=0,sx=0,sy=0;
 var cv=V.canvas;
 cv.addEventListener('pointerdown',function(e){cv.setPointerCapture(e.pointerId);ptr[e.pointerId]={x:e.clientX,y:e.clientY};moved=0;t0=performance.now();sx=e.clientX;sy=e.clientY;var k=Object.keys(ptr);if(k.length===2)pd=Math.hypot(ptr[k[0]].x-ptr[k[1]].x,ptr[k[0]].y-ptr[k[1]].y)});
 cv.addEventListener('pointermove',function(e){var p=ptr[e.pointerId];if(!p)return;var dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;var k=Object.keys(ptr);
  if(k.length===1){S.yaw-=dx*.0055;S.pitch=V.cl(S.pitch+dy*.0045,S.minP,S.maxP);S.vy=-dx*.0055*30;S.vp=dy*.0045*30;moved+=Math.abs(dx)+Math.abs(dy);S.auto=0}
  else if(k.length===2){var d=Math.hypot(ptr[k[0]].x-ptr[k[1]].x,ptr[k[0]].y-ptr[k[1]].y);if(pd)S.dist=V.cl(S.dist*pd/d,S.min,S.max);pd=d;moved+=10}});
 function up(e){delete ptr[e.pointerId];pd=0;if(!Object.keys(ptr).length&&moved<8&&performance.now()-t0<400&&S.onTap)S.onTap(e.clientX,e.clientY)}
 cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
 cv.addEventListener('wheel',function(e){e.preventDefault();S.dist=V.cl(S.dist*(1+e.deltaY*.0012),S.min,S.max)},{passive:false});
 S.update=function(dt){if(S.follow)S.tgt.copy(S.follow.getWorldPosition?S.follow.getWorldPosition(new T.Vector3()):S.follow);S.target.lerp(S.tgt,1-Math.exp(-S.smooth*dt));
  if(S.auto)S.yaw+=S.auto*dt;else{S.yaw+=S.vy*dt;S.pitch=V.cl(S.pitch+S.vp*dt,S.minP,S.maxP);var f=Math.exp(-4*dt);S.vy*=f;S.vp*=f}
  var cp=Math.cos(S.pitch),c=V.cam;c.position.set(S.target.x+Math.sin(S.yaw)*cp*S.dist,S.target.y+Math.sin(S.pitch)*S.dist,S.target.z+Math.cos(S.yaw)*cp*S.dist);c.lookAt(S.target)};
 S.ray=function(x,y,objs,rec){var rc=new T.Raycaster(),v=new T.Vector2(x/innerWidth*2-1,-(y/innerHeight)*2+1);rc.setFromCamera(v,V.cam);return rc.intersectObjects(objs,rec!==false)};
 V.o=S;return S};
/* interfaz comun */
V.css=function(){var s=document.createElement('style');s.textContent=':root{--ink:#fff;--dim:rgba(255,255,255,.7);--glass:rgba(12,14,24,.55);--line:rgba(255,255,255,.18);--acc:#6aa8ff;--font:-apple-system,BlinkMacSystemFont,"SF Pro Text",system-ui,sans-serif}*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;-webkit-user-select:none;user-select:none}html,body{margin:0;height:100%;overflow:hidden;background:#05060c;color:var(--ink);font-family:var(--font);overscroll-behavior:none;touch-action:none}'+
 '.v-back{position:fixed;z-index:20;left:calc(env(safe-area-inset-left) + 12px);top:calc(env(safe-area-inset-top) + 10px);padding:7px 13px;border-radius:999px;color:#fff;text-decoration:none;font-weight:700;font-size:13px;background:var(--glass);border:1px solid var(--line);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px)}'+
 '.v-glass{background:var(--glass);border:1px solid var(--line);-webkit-backdrop-filter:blur(16px) saturate(1.4);backdrop-filter:blur(16px) saturate(1.4);border-radius:16px}'+
 '.v-title{position:fixed;z-index:10;left:50%;transform:translateX(-50%);top:calc(env(safe-area-inset-top) + 12px);font-weight:800;font-size:15px;letter-spacing:.08em;text-transform:uppercase;text-shadow:0 1px 6px #000;pointer-events:none}'+
 '.v-bar{position:fixed;z-index:15;left:0;right:0;bottom:calc(env(safe-area-inset-bottom) + 10px);display:flex;gap:7px;justify-content:center;flex-wrap:wrap;padding:0 10px;pointer-events:none}'+
 '.v-chip{pointer-events:auto;padding:9px 13px;border-radius:999px;border:1px solid var(--line);background:var(--glass);color:#fff;font:700 13px var(--font);-webkit-backdrop-filter:blur(14px);backdrop-filter:blur(14px);cursor:pointer}.v-chip.on{background:var(--acc);border-color:transparent;color:#04101f}.v-chip:active{transform:scale(.95)}'+
 '.v-side{position:fixed;z-index:15;right:calc(env(safe-area-inset-right) + 12px);top:calc(env(safe-area-inset-top) + 50px);display:flex;flex-direction:column;gap:7px;align-items:flex-end}'+
 '.v-card{position:fixed;z-index:16;left:calc(env(safe-area-inset-left) + 12px);top:calc(env(safe-area-inset-top) + 50px);width:min(300px,46vw);padding:12px 14px;display:none}.v-card h3{margin:0 0 2px;font-size:20px}.v-card .sb{color:var(--dim);font-size:12px;margin-bottom:8px}.v-card table{width:100%;border-collapse:collapse;font-size:12.5px}.v-card td{padding:3px 0;border-top:1px solid rgba(255,255,255,.1)}.v-card td:first-child{color:var(--dim);padding-right:8px}.v-card p{margin:8px 0 0;font-size:12.5px;line-height:1.4;color:#e8ecf8}'+
 '@media (max-height:460px){.v-card{width:min(250px,40vw);padding:9px 11px}.v-card h3{font-size:16px}.v-card table,.v-card p{font-size:11px}.v-chip{padding:7px 10px;font-size:12px}}';document.head.appendChild(s)};
V.back=function(){var a=document.createElement('a');a.className='v-back';a.href='index.html';a.textContent='‹ Apps';document.body.appendChild(a)};
V.chip=function(parent,txt,fn,on){var b=document.createElement('button');b.className='v-chip'+(on?' on':'');b.type='button';b.textContent=txt;b.onclick=function(e){e.stopPropagation();fn(b)};parent.appendChild(b);return b};
/* audio ambiental con muestras reales */
V.ac=null;V.bufs={};
V.audio=function(){if(!V.ac){try{V.ac=new(window.AudioContext||window.webkitAudioContext)();V.master=V.ac.createGain();V.master.gain.value=1;V.master.connect(V.ac.destination)}catch(e){}}if(V.ac&&V.ac.state==='suspended')try{V.ac.resume()}catch(e){}return V.ac};
V.sample=function(n){if(V.bufs[n])return V.bufs[n];var ac=V.audio();if(!ac)return Promise.resolve(null);return V.bufs[n]=fetch('audio/s/'+n+'.mp3').then(function(r){return r.arrayBuffer()}).then(function(b){return new Promise(function(ok,ko){ac.decodeAudioData(b,ok,ko)})}).catch(function(){return null})};
V.loopSample=function(n,vol){var h={g:null,s:null,vol:vol||0};V.sample(n).then(function(buf){if(!buf||!V.ac)return;var s=V.ac.createBufferSource();s.buffer=buf;s.loop=true;var g=V.ac.createGain();g.gain.value=0;s.connect(g);g.connect(V.master);s.start(0,Math.random()*Math.max(1,buf.duration-1));h.g=g;h.s=s;g.gain.setTargetAtTime(h.vol,V.ac.currentTime,.8)});h.set=function(v){h.vol=v;if(h.g)h.g.gain.setTargetAtTime(v,V.ac.currentTime,.6)};return h};
V.shot=function(n,vol,rate){V.sample(n).then(function(buf){if(!buf||!V.ac)return;var s=V.ac.createBufferSource();s.buffer=buf;s.playbackRate.value=rate||1;var g=V.ac.createGain();g.gain.value=vol||1;s.connect(g);g.connect(V.master);s.start()})};
V.noiseBuf=function(){if(V._nb)return V._nb;var ac=V.audio();var b=ac.createBuffer(1,ac.sampleRate*3,ac.sampleRate),d=b.getChannelData(0);for(var i=0;i<d.length;i++)d[i]=Math.random()*2-1;return V._nb=b};
V.fadeAll=function(sec){if(V.master&&V.ac)V.master.gain.setTargetAtTime(0,V.ac.currentTime,sec/3)};V.unfade=function(){if(V.master&&V.ac)V.master.gain.setTargetAtTime(1,V.ac.currentTime,.3)};
})();
