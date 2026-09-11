import * as THREE from 'three';

// Deterministic, seekable particles: no frame-dependent physics or texture assets.
export function createFireworks(container, options = {}) {
  const { loop = true, autoplay = true, density = 1, speed = 2, onComplete } = options;
  const duration = 7.2;
  const normalizeSpeed = value => Number.isFinite(value) ? Math.max(0.1, Math.min(10, value)) : 2;
  let playbackSpeed = normalizeSpeed(speed);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, premultipliedAlpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.domElement.style.cssText = 'display:block;width:100%;height:100%;pointer-events:none;background:transparent';
  container.appendChild(renderer.domElement);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 100);
  camera.position.set(0, 0, 20);
  const uniforms = { uTime: { value: 0 }, uScale: { value: 1 } };
  let seed = 72191;
  const rand = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
  const particles = [];
  const add = (p, v, start, life, color, size, drag = 0.9, gravity = 0.65, trail = 0.13) => particles.push({ p, v, start, life, color, size, drag, gravity, trail });
  const countScale = Math.max(0.15, Math.min(2, density));
  const palette = [[0.68,0.78,1], [0.92,0.95,1], [0.52,0.66,1], [1,0.72,0.38]];
  const shows = [
    [-2.65,2.0,0,0.18,1.25,2.45], [2.6,2.8,-0.6,0.52,1.3,2.5],
    [0.05,1.0,0.8,0.85,1.3,2.8], [-1.55,3.55,-1.2,1.75,1.1,1.9],
    [2.3,0.0,0.5,2.05,1.2,1.9], [-2.25,-0.6,0.4,2.42,1.05,1.65],
    [0.9,3.15,-0.8,2.58,1.1,2.05]
  ];
  // 7 original launches plus 2 companions each = 21 launches.
  // x * 0.5 to converge launches toward center
  const expandedShows = shows.flatMap(([x, y, z, start, rise, radius]) => {
    const cx = x * 0.1 - 0.7;
    const cy = y - 4; // 폭발 높이 낮추기 (값 조절: -1 살짝, -3 많이)
    return [
      [cx, cy, z, start, rise, radius],
      [cx * 0.7 - 0.8, cy - 0.6, z - 0.6, start + 0.15, rise, radius * 0.8],
      [cx * 0.7 + 0.8, cy + 0.3, z + 0.3, start + 0.3, rise, radius * 0.85],
    ];
  });
  for (const [x,y,z,start,rise,radius] of expandedShows) {
    const origin = [x * 0.65, -5.65, z];
    const rocket = t => { const q = t / rise; return [origin[0] + (x-origin[0])*q + 0.07*Math.sin(q*12)*Math.sin(q*Math.PI), origin[1]+(y-origin[1])*(1-Math.pow(1-q,1.35)),z]; };
    for(let i=0;i<Math.round(190*countScale);i++) {
      const t=rise*i/(190*countScale), p=rocket(t);
      const color=rand()<0.17 ? [0.8,0.45,1] : [1,0.45+rand()*0.42,0.13];
      add(p,[(rand()-.5)*.35,-.3-rand()*.5,(rand()-.5)*.35],start+t,.4+rand()*.55,color,2+rand()*3,1,1.3,.06);
    }
    // Dense luminous rocket head sampled along its ascending path.
    for(let i=0;i<100;i++) add(rocket(rise*i/100),[0,0,0],start+rise*i/100,.055,[1,.9,.7],12,0,0,0);
    const burst=start+rise;
    add([x,y,z],[0,0,0],burst,.24,[1,.9,.67],105,0,0,0);
    add([x,y,z],[0,0,0],burst,.09,[1,1,1],36,0,0,0);
    for(let i=0;i<Math.round(165*countScale);i++) {
      const h=rand()*2-1, a=rand()*Math.PI*2, s=Math.sqrt(1-h*h);
      const speed=radius*(1.05+rand()*.55);
      const v=[Math.cos(a)*s*speed,Math.sin(a)*s*speed,h*speed*.85];
      const c=palette[Math.floor(rand()*palette.length)];
      add([x,y,z],v,burst,1.15+rand()*1.35,c,1.4+rand()*1.8,.85,.65,.13+rand()*.08);
      // Delayed gold embers are born on the same trajectory, then descend.
      if(rand()<.45) {
        const t=.75+rand()*.35, f=(1-Math.exp(-.85*t))/.85;
        add([x+v[0]*f,y+v[1]*f-.5*.65*t*t,z+v[2]*f],v.map((n,j)=>n*Math.exp(-.85*t)-(j===1?.65*t:0)),burst+t,.7+rand()*1.15,[1,.54,.2],2+rand()*2.4,1.6,.8,.03);
      }
    }
  }
  const vertexCommon = `
    uniform float uTime; uniform float uScale;
    attribute vec3 aVelocity; attribute vec3 aColor;
    attribute vec4 aTiming; attribute vec4 aStyle; attribute float aLag;
    varying vec3 vColor; varying float vAlpha;
    void main() {
      float age=uTime-aTiming.x;
      float t=max(0.0,age-aLag*aStyle.w);
      float drag=aTiming.z;
      float travel=drag<0.001?t:(1.0-exp(-drag*t))/drag;
      vec3 p=position+aVelocity*travel;
      p.y-=0.5*aTiming.w*t*t;
      float alive=step(0.0,age)*step(age,aTiming.y);
      float fade=pow(max(0.0,1.0-age/aTiming.y),0.7);
      float flicker=mix(1.0,0.6+0.4*sin(age*45.0+aTiming.x*93.0+position.x*31.0),smoothstep(.5,1.0,age/aTiming.y));
      vAlpha=alive*fade*flicker*(1.0-aLag*.94);
      vColor=aColor;
      vec4 mv=modelViewMatrix*vec4(p,1.0);
      gl_Position=projectionMatrix*mv;
      gl_PointSize=clamp(aStyle.x*uScale*20.0/(-mv.z),1.0,160.0);
    }`;
  const blending = {
    transparent:true, depthWrite:false, depthTest:false, blending:THREE.CustomBlending,
    blendEquation:THREE.AddEquation, blendSrc:THREE.SrcAlphaFactor, blendDst:THREE.OneFactor,
    blendEquationAlpha:THREE.AddEquation, blendSrcAlpha:THREE.OneFactor, blendDstAlpha:THREE.OneMinusSrcAlphaFactor
  };
  function make(points) {
    const values={position:[],aVelocity:[],aColor:[],aTiming:[],aStyle:[],aLag:[]};
    const push=(p,lag)=> {values.position.push(...p.p);values.aVelocity.push(...p.v);values.aColor.push(...p.color);values.aTiming.push(p.start,p.life,p.drag,p.gravity);values.aStyle.push(p.size,0,0,p.trail);values.aLag.push(lag);};
    for(const p of particles) {
      if(points) push(p,0);
      else if(p.trail>0) for(let i=0;i<8;i++) {push(p,i/8);push(p,(i+1)/8);}
    }
    const geometry=new THREE.BufferGeometry();
    for(const [name,data] of Object.entries(values)) geometry.setAttribute(name,new THREE.Float32BufferAttribute(data,name==='aLag'?1:(name==='aTiming'||name==='aStyle'?4:3)));
    const material=new THREE.ShaderMaterial({uniforms,vertexShader:vertexCommon,fragmentShader:points?`
      varying vec3 vColor; varying float vAlpha;
      void main(){
        vec2 q=gl_PointCoord*2.0-1.0; float r=length(q);
        if(r>1.0) discard;
        float glow=exp(-r*r*6.0)*.4+exp(-r*r*55.0)*.6;
        float cross=exp(-abs(q.x)*65.0)*exp(-abs(q.y)*5.0)+exp(-abs(q.y)*65.0)*exp(-abs(q.x)*5.0);
        float alpha=(glow+cross*.12)*vAlpha;
        gl_FragColor=vec4(vColor,alpha);
      }`:`varying vec3 vColor; varying float vAlpha;
      void main(){gl_FragColor=vec4(vColor,vAlpha*.65);}`, ...blending});
    const object=points?new THREE.Points(geometry,material):new THREE.LineSegments(geometry,material);
    object.frustumCulled=false;scene.add(object);
  }
  make(false);make(true);
  function resize(){
    const w=Math.max(1,container.clientWidth), h=Math.max(1,container.clientHeight);
    renderer.setSize(w,h,false);camera.aspect=w/h;
    // Preserve the full composition on portrait and landscape containers.
    camera.position.z=Math.max(20,18/camera.aspect);
    camera.updateProjectionMatrix();uniforms.uScale.value=renderer.getPixelRatio()*Math.min(w,h)/650;
    renderer.render(scene,camera);
  }
  const observer=new ResizeObserver(resize);observer.observe(container);resize();
  let time=0,playing=false,raf=0,last=0,disposed=false;
  function frame(now){
    if(!playing||disposed)return;
    time+=((now-last)/1000)*playbackSpeed;last=now;
    if(time>=duration){if(loop)time%=duration;else{time=duration;playing=false;}}
    uniforms.uTime.value=time;renderer.render(scene,camera);
    if(playing)raf=requestAnimationFrame(frame);else onComplete?.();
  }
  const api={
    canvas:renderer.domElement,duration,
    get speed(){return playbackSpeed;},
    setSpeed(value){playbackSpeed=normalizeSpeed(value);last=performance.now();},
    play(){if(disposed||playing)return;if(time>=duration)time=0;playing=true;last=performance.now();raf=requestAnimationFrame(frame);},
    pause(){playing=false;cancelAnimationFrame(raf);},
    restart(){api.pause();time=0;uniforms.uTime.value=0;renderer.render(scene,camera);api.play();},
    seek(seconds){time=Math.max(0,Math.min(duration,seconds));last=performance.now();uniforms.uTime.value=time;renderer.render(scene,camera);},
    get time(){return time;},get playing(){return playing;},
    dispose(){if(disposed)return;api.pause();disposed=true;observer.disconnect();scene.traverse(o=>{o.geometry?.dispose();o.material?.dispose();});renderer.dispose();renderer.domElement.remove();}
  };
  if(autoplay)api.play();
  return api;
}
