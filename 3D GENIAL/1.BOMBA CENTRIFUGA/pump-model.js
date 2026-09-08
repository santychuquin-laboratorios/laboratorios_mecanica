import * as THREE from 'three';

// Bomba horizontal de aspiración axial. Modelo paramétrico propio, sin activos
// externos. Referencia visual: catálogo KSB KWP, pp. 7, 11 y 32.
// Interpretación didáctica sin escala ni tamaño comercial seleccionado.
export function buildDetailedPump({ scene, component }) {
  const blue='#285879', darkBlue='#203d55', steel='#b8c5ce', bronze='#b48a50', impellerMetal='#9da9ae', dark='#27313a';

  // Microrrugosidad reproducible de la pintura de fundición, compartida en GPU.
  let seed=1843;
  const pixels=new Uint8Array(128*128*4);
  for(let i=0;i<pixels.length;i+=4){seed=(1664525*seed+1013904223)>>>0;const v=110+(seed>>>25);pixels[i]=pixels[i+1]=pixels[i+2]=v;pixels[i+3]=255;}
  const grain=new THREE.DataTexture(pixels,128,128);grain.wrapS=grain.wrapT=THREE.RepeatWrapping;grain.repeat.set(9,9);grain.needsUpdate=true;
  function material(color,finish='paint'){
    const options={color,metalness:finish==='metal'?.94:finish==='rubber'?.03:.08,roughness:finish==='metal'?.22:finish==='rubber'?.84:.43,envMapIntensity:1.15};
    if(finish==='paint'){options.bumpMap=grain;options.bumpScale=.009;options.clearcoat=.18;options.clearcoatRoughness=.26;}
    return new THREE.MeshPhysicalMaterial(options);
  }
  // Se clonan materiales para que seleccionar una pieza no ilumine las demás.
  const materials=new Map();
  function add(g,geo,color,pos=[0,0,0],finish='paint'){
    const key=g.uuid+color+finish;if(!materials.has(key))materials.set(key,material(color,finish));
    const m=new THREE.Mesh(geo,materials.get(key));m.position.set(...pos);m.castShadow=m.receiveShadow=true;g.add(m);return m;
  }
  function cylinder(g,r,h,color,pos=[0,0,0],axis='z',segments=64,finish='metal'){
    const m=add(g,new THREE.CylinderGeometry(r,r,h,segments),color,pos,finish);if(axis==='z')m.rotation.x=Math.PI/2;return m;
  }
  function torus(g,r,t,color,pos=[0,0,0],axis='z',finish='metal'){
    const m=add(g,new THREE.TorusGeometry(r,t,10,64),color,pos,finish);if(axis==='y')m.rotation.x=Math.PI/2;return m;
  }
  // Superficies torneadas de revolución, con perfiles cerrados y pasos suaves.
  function lathe(g,profile,color,pos=[0,0,0],axis='z',finish='paint'){
    const geo=new THREE.LatheGeometry(profile.map(([r,z])=>new THREE.Vector2(r,z)),96);
    const m=add(g,geo,color,pos,finish);if(axis==='z')m.rotation.x=Math.PI/2;return m;
  }
  function sleeve(g,outer,inner,length,color,pos=[0,0,0],axis='z',finish='metal'){
    const z=length/2,b=Math.min(.018,length/5);
    return lathe(g,[[inner,-z],[outer-b,-z],[outer,-z+b],[outer,z-b],[outer-b,z],[inner,z],[inner,-z]],color,pos,axis,finish);
  }
  function roundedBox(g,w,h,d,color,pos,bevel=.035){
    const s=new THREE.Shape();s.moveTo(-w/2+bevel,-h/2+bevel);s.lineTo(w/2-bevel,-h/2+bevel);s.lineTo(w/2-bevel,h/2-bevel);s.lineTo(-w/2+bevel,h/2-bevel);s.closePath();
    const geo=new THREE.ExtrudeGeometry(s,{depth:d-2*bevel,bevelEnabled:true,bevelSize:bevel,bevelThickness:bevel,bevelSegments:3,steps:1});geo.translate(0,0,-d/2+bevel);return add(g,geo,color,pos);
  }
  function bolt(g,pos,size=.06,axis='z'){
    const head=cylinder(g,size,.065,steel,pos,axis,6);head.rotation.z+=Math.PI/6;
    const washer=[...pos];washer[axis==='z'?2:1]-=.04;
    sleeve(g,size*1.35,size*.57,.018,'#81919e',washer,axis);
    // Marca de resistencia en relieve y extremo del espárrago.
    const end=[...pos];end[axis==='z'?2:1]+=.035;
    cylinder(g,size*.38,.006,'#697b88',end,axis,24);
  }
  // Las bridas tienen taladros pasantes reales, no discos sobre la superficie.
  function flange(g,outer,inner,depth,boltCircle,count,pos,axis='z'){
    const s=new THREE.Shape();s.absarc(0,0,outer,0,Math.PI*2,false);
    const hole=(x,y,r)=>{const p=new THREE.Path();p.absarc(x,y,r,0,Math.PI*2,true);s.holes.push(p);};hole(0,0,inner);
    for(let i=0;i<count;i++){const a=(i+.5)*Math.PI*2/count;hole(Math.cos(a)*boltCircle,Math.sin(a)*boltCircle,.063);}
    const geo=new THREE.ExtrudeGeometry(s,{depth,bevelEnabled:true,bevelSize:.012,bevelThickness:.012,bevelSegments:2,curveSegments:32});geo.translate(0,0,-depth/2);
    const f=add(g,geo,blue,pos);if(axis==='y')f.rotation.x=-Math.PI/2;
    const face=[...pos];face[axis==='z'?2:1]+=depth/2+.014;
    sleeve(g,boltCircle-.105,inner,.025,steel,face,axis);
    // Finas marcas concéntricas de mecanizado en la cara de junta.
    for(let i=0;i<4;i++){const p=[...face];p[axis==='z'?2:1]+=.015;torus(g,inner+.025+i*.023,.0018,'#687c88',p,axis);}
  }
  function plaque(g){
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=256;
    const ctx=canvas.getContext('2d');ctx.fillStyle='#b7c2c7';ctx.fillRect(0,0,512,256);ctx.strokeStyle='#51616a';ctx.lineWidth=6;ctx.strokeRect(12,12,488,232);
    ctx.fillStyle='#142b39';ctx.font='bold 48px Arial';ctx.fillText('3D GENIAL',30,67);ctx.fillRect(30,82,450,3);ctx.font='23px Arial';ctx.fillText('BOMBA CENTRÍFUGA',30,120);ctx.font='20px monospace';ctx.fillText('REFERENCIA KWP',30,160);ctx.fillText('ASPIRACIÓN AXIAL   /   01',30,201);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
    const m=add(g,new THREE.BoxGeometry(.48,.24,.018),steel,[.51,.69,.544],'metal');m.material=m.material.clone();m.material.map=tex;m.material.roughness=.48;
    for(const x of [.305,.715])for(const y of [.60,.78])cylinder(g,.012,.025,'#536776',[x,y,.56]);
  }

  component('voluta',[0,0,0],[-2.7,.4,-.5],g=>{
    // Sección colectora redondeada de tamaño creciente, con cavidad interior.
    const vertices=[],indices=[],uSteps=128,vSteps=28;
    for(let layer=0;layer<2;layer++)for(let i=0;i<=uSteps;i++){
      const u=i/uSteps,a=u*Math.PI*2,R=1.14+.035*u,t=.18+.17*u-(layer?.07:0),depth=.38+.12*u-(layer?.08:0);
      // Sección de fundición de hombros anchos y esquinas redondeadas.
      // La superelipse evita la silueta de anillo tubular del modelo anterior.
      for(let j=0;j<=vSteps;j++){const b=j/vSteps*Math.PI*2,cb=Math.cos(b),sb=Math.sin(b),r=R+t*Math.sign(cb)*Math.pow(Math.abs(cb),.58);vertices.push(r*Math.cos(a),r*Math.sin(a),depth*Math.sign(sb)*Math.pow(Math.abs(sb),.58));}
    }
    const layerSize=(uSteps+1)*(vSteps+1);
    for(let layer=0;layer<2;layer++)for(let i=0;i<uSteps;i++)for(let j=0;j<vSteps;j++){
      const a=layer*layerSize+i*(vSteps+1)+j,b=a+vSteps+1;
      if(!layer)indices.push(a,b,a+1,b,b+1,a+1);else indices.push(a,a+1,b,b,a+1,b+1);
    }
    // Cerrar los extremos de la pared sin obstruir el paso hidráulico.
    for(const i of [0,uSteps])for(let j=0;j<vSteps;j++){const a=i*(vSteps+1)+j,b=a+layerSize;indices.push(a,a+1,b,a+1,b+1,b);}
    const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));geo.setIndex(indices);geo.computeVertexNormals();add(g,geo,blue);
    // Tapa abombada de fundición y línea de junta mecanizada.
    lathe(g,[[.385,.38],[.39,.56],[.52,.58],[.72,.56],[.92,.50],[1.08,.41],[1.16,.36],[1.20,.36],[1.20,.29],[1.04,.29],[.83,.36],[.59,.40],[.385,.38]],blue);
    sleeve(g,1.25,.99,.105,blue,[0,0,.31],'z','paint');
    torus(g,1.225,.012,'#243a48',[0,0,.245],'z','rubber');
    lathe(g,[[.18,-.53],[.45,-.53],[.78,-.46],[1.13,-.34],[1.20,-.32],[1.20,-.25],[.92,-.31],[.45,-.44],[.18,-.44],[.18,-.53]],blue);
    for(let i=0;i<12;i++){const a=(i+.5)*Math.PI/6;bolt(g,[1.15*Math.cos(a),1.15*Math.sin(a),.39],.063);}
    // Resaltes de los pernos y contrabrida posterior de la carcasa.
    for(let i=0;i<8;i++){const a=(i+.5)*Math.PI/4,x=1.20*Math.cos(a),y=1.20*Math.sin(a);cylinder(g,.10,.20,blue,[x,y,-.34],'z',32,'paint');bolt(g,[x,y,-.46],.065);}
    sleeve(g,1.22,1.08,.075,darkBlue,[0,0,-.34],'z','paint');
    // Nervios radiales fundidos en la tapa.
    for(let i=0;i<6;i++){const a=i*Math.PI/3;const rib=roundedBox(g,.48,.043,.045,blue,[.78*Math.cos(a),.78*Math.sin(a),.475],.012);rib.rotation.z=a;}
    for(const x of [-.78,.78]){
      roundedBox(g,.31,.60,.62,blue,[x,-1.43,-.05]);roundedBox(g,.57,.12,.90,blue,[x,-1.69,-.02]);
      for(const z of [-.32,.28])bolt(g,[x,-1.59,z],.07,'y');
      const rib=roundedBox(g,.10,.66,.72,blue,[x,-1.18,-.08],.025);rib.rotation.z=x>0?-.30:.30;
    }
    // Tapón de drenaje y resalte de fundición.
    cylinder(g,.12,.13,blue,[0,-1.37,.10],'y',32,'paint');cylinder(g,.088,.13,steel,[0,-1.46,.10],'y',6);
    plaque(g);
    // Orejeta de izaje solidaria con el cuerpo.
    const lug=sleeve(g,.155,.075,.13,blue,[-.72,1.31,-.05],'z','paint');lug.rotation.y=.15;
  });
  const rotor=component('impulsor',[0,0,0],[0,0,2],g=>{
    // Impulsor semiabierto: álabes curvados hacia atrás y cubo torneado.
    lathe(g,[[.17,-.28],[.91,-.28],[1.015,-.23],[1.02,-.18],[.93,-.17],[.35,-.15],[.17,-.15],[.17,-.28]],impellerMetal,[0,0,0],'z','metal');
    lathe(g,[[.165,-.3],[.29,-.3],[.32,-.20],[.29,.15],[.24,.23],[.165,.23],[.165,-.3]],impellerMetal,[0,0,0],'z','metal');
    for(let i=0;i<7;i++){
      const s=new THREE.Shape();s.moveTo(.285,-.025);s.bezierCurveTo(.48,-.04,.61,.26,.94,.32);s.lineTo(.96,.38);s.bezierCurveTo(.59,.34,.47,.065,.285,.045);s.closePath();
      const geo=new THREE.ExtrudeGeometry(s,{depth:.31,bevelEnabled:true,bevelThickness:.017,bevelSize:.012,bevelSegments:3,curveSegments:24});geo.translate(0,0,-.16);
      const blade=add(g,geo,impellerMetal,[0,0,0],'metal');blade.rotation.z=i*Math.PI*2/7;
    }
    sleeve(g,.235,.16,.022,steel,[0,0,.245]);cylinder(g,.185,.085,steel,[0,0,.285],'z',6);
    // Corona de entrada y anillo de desgaste del impulsor semiabierto.
    sleeve(g,.335,.275,.045,impellerMetal,[0,0,.17]);
    torus(g,.995,.012,'#b9c2c6',[0,0,-.19]);
    for(const r of [.79,.86,.94])torus(g,r,.003,'#7e8b91',[0,0,-.282]);
  });
  component('eje',[0,0,-1.85],[0,.9,-1.5],g=>{
    lathe(g,[[0,-2.07],[.145,-2.07],[.16,-2.02],[.16,-1.24],[.18,-1.22],[.18,-.87],[.155,-.84],[.155,.28],[.18,.30],[.18,.58],[.155,.60],[.155,1.23],[.17,1.25],[.17,1.57],[.145,1.6],[.145,2.10],[0,2.10]],steel,[0,0,0],'z','metal');
    roundedBox(g,.075,.045,.46,'#72818b',[0,.151,-1.78],.008);
    for(const z of [-1.21,-.88,.29,.6,1.24])torus(g,.16,.009,'#53636f',[0,0,z]);
  });
  component('aspiracion',[0,0,1.18],[0,0,3.7],g=>{
    lathe(g,[[.36,-.63],[.43,-.63],[.49,-.53],[.47,-.43],[.435,-.28],[.435,.37],[.49,.49],[.49,.58],[.36,.58],[.36,-.63]],blue);
    flange(g,.73,.36,.16,.59,8,[0,0,.60]);torus(g,.431,.015,blue,[0,0,.34],'z','paint');
  });
  component('descarga',[1.32,1.13,0],[1.8,1.6,0],g=>{
    lathe(g,[[.25,-1.28],[.37,-1.28],[.385,-.87],[.34,-.58],[.32,-.36],[.32,.48],[.38,.66],[.38,.78],[.25,.78],[.25,-1.28]],blue,[0,0,0],'y');
    flange(g,.55,.25,.15,.435,6,[0,.78,0],'y');
  });
  component('sello',[0,0,-.79],[0,1.3,0],g=>{
    sleeve(g,.355,.167,.12,steel,[0,0,.17]);sleeve(g,.30,.168,.11,'#1c2730',[0,0,.065],'z','rubber');
    sleeve(g,.28,.17,.10,'#7b8d96',[0,0,-.03]);sleeve(g,.24,.17,.28,steel,[0,0,-.15]);
    const helix=[];for(let i=0;i<=200;i++){const a=i/200*Math.PI*2*7;helix.push(new THREE.Vector3(.266*Math.cos(a),.266*Math.sin(a),-.32+i/200*.31));}
    add(g,new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix),200,.018,6,false),steel,[0,0,0],'metal');
    sleeve(g,.31,.17,.045,steel,[0,0,-.34]);
  });
  function bearing(g){
    sleeve(g,.435,.342,.255,steel);sleeve(g,.233,.165,.255,steel);
    for(const z of [-.132,.132]){torus(g,.407,.006,'#53616b',[0,0,z]);torus(g,.203,.005,'#53616b',[0,0,z]);}
    for(let i=0;i<10;i++){const a=i*Math.PI/5;add(g,new THREE.SphereGeometry(.058,16,12),'#d6e1e8',[.287*Math.cos(a),.287*Math.sin(a),0],'metal');
      const cage=add(g,new THREE.BoxGeometry(.03,.097,.012),'#aa8852',[.287*Math.cos(a+.15),.287*Math.sin(a+.15),.067],'metal');cage.rotation.z=a+.15;}
    torus(g,.287,.014,'#aa8852',[0,0,-.071]);
  }
  component('rodamiento-delantero',[0,0,-1.43],[1.5,.6,-.4],bearing);
  component('rodamiento-posterior',[0,0,-2.85],[1.6,.6,-1.3],bearing);
  component('acoplamiento',[0,0,-3.8],[0,0,-2.7],g=>{
    for(const z of [-.23,.23]){
      sleeve(g,.33,.15,.25,steel,[0,0,z]);sleeve(g,.39,.17,.08,'#a3afba',[0,0,z>0?.13:-.13]);
      for(let i=0;i<6;i++){const a=i*Math.PI/3;bolt(g,[.30*Math.cos(a),.30*Math.sin(a),z>0?.38:-.38],.04);}
    }
    cylinder(g,.315,.18,dark,[0,0,0],'z',48,'rubber');
    for(let i=0;i<6;i++){const a=i*Math.PI/3;const jaw=roundedBox(g,.12,.16,.17,bronze,[.30*Math.cos(a),.30*Math.sin(a),0],.016);jaw.rotation.z=a;}
  });
  component('soporte',[0,0,-2.12],[0,-.25,-1.2],g=>{
    // Linterna de unión: conecta el alojamiento con la tapa de la bomba.
    // Los huecos entre los nervios permiten reconocer el cartucho del sello.
    sleeve(g,.70,.40,.12,blue,[0,0,1.51],'z','paint');
    sleeve(g,.62,.43,.10,darkBlue,[0,0,1.03],'z','paint');
    for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;const rib=roundedBox(g,.16,.14,.49,blue,[.53*Math.cos(a),.53*Math.sin(a),1.27],.035);rib.rotation.z=a;bolt(g,[.58*Math.cos(a),.58*Math.sin(a),1.60],.055);}
    lathe(g,[[.445,-.99],[.54,-.99],[.62,-.88],[.62,-.76],[.55,-.67],[.51,-.53],[.51,.54],[.56,.68],[.62,.77],[.62,.92],[.55,.99],[.445,.99],[.445,-.99]],blue);
    for(const z of [-.97,.97]){
      sleeve(g,.60,.18,.07,darkBlue,[0,0,z],'z','paint');
      for(let i=0;i<6;i++){const a=(i+.5)*Math.PI/3;bolt(g,[.51*Math.cos(a),.51*Math.sin(a),z+(z>0?.055:-.055)],.047);}
    }
    roundedBox(g,.65,1.12,1.38,blue,[0,-1.03,0]);roundedBox(g,1.25,.17,2.05,blue,[0,-1.64,0]);
    // Nervaduras de rigidez del pedestal y aros del alojamiento.
    for(const x of [-.34,.34])for(const z of [-.48,.48]){const rib=roundedBox(g,.075,1.10,.21,blue,[x,-.96,z],.018);rib.rotation.z=x>0?-.22:.22;}
    for(const z of [-.44,0,.44])sleeve(g,.535,.48,.045,blue,[0,0,z],'z','paint');
    for(const x of [-.46,.46])for(const z of [-.75,.75])bolt(g,[x,-1.50,z],.063,'y');
    // Tapón de lubricación y visor de aceite en el costado visible.
    cylinder(g,.065,.16,steel,[0,.59,-.22],'y',6);cylinder(g,.09,.035,dark,[0,.69,-.22],'y',24);
    // Tornillos de fijación y tapón de vaciado del cárter.
    cylinder(g,.075,.10,steel,[.33,-.42,-.66],'z',6);
    for(const z of [-.72,.72])torus(g,.55,.012,'#1e303e',[0,0,z],'z','rubber');
    // Aceitera de nivel constante (638), Fig. 11 del catálogo KWP.
    // El depósito y su tubería pertenecen al soporte durante el despiece.
    const oilPipe=new THREE.CatmullRomCurve3([
      new THREE.Vector3(.48,-.20,.32),new THREE.Vector3(.76,-.20,.32),
      new THREE.Vector3(.86,-.10,.32),new THREE.Vector3(.86,.12,.32)]);
    add(g,new THREE.TubeGeometry(oilPipe,24,.037,10,false),steel,[0,0,0],'metal');
    cylinder(g,.145,.12,steel,[.86,.14,.32],'y');
    const reservoir=cylinder(g,.115,.32,'#dfedf0',[.86,.36,.32],'y',48);
    reservoir.material=reservoir.material.clone();
    reservoir.material.metalness=0;reservoir.material.roughness=.12;
    reservoir.material.transparent=true;reservoir.material.opacity=.30;
    reservoir.material.depthWrite=false;
    cylinder(g,.099,.17,'#b6771c',[.86,.29,.32],'y',48);
    cylinder(g,.14,.045,steel,[.86,.535,.32],'y');
    torus(g,.12,.012,steel,[.86,.19,.32],'y');
    // Respiradero del cárter y uniones de la tapa mecanizada.
    cylinder(g,.052,.16,steel,[-.16,.67,-.25],'y');
    cylinder(g,.094,.055,dark,[-.16,.765,-.25],'y');
    for(const z of [-.94,.94])for(let i=0;i<6;i++){
      const a=(i+.5)*Math.PI/3;
      bolt(g,[.49*Math.cos(a),.49*Math.sin(a),z],.045);
    }
    const sight=sleeve(g,.105,.071,.045,steel,[.515,-.08,.20]);sight.rotation.y=Math.PI/2;
    const glass=cylinder(g,.071,.022,'#ba7826',[.544,-.08,.20]);glass.rotation.set(0,0,Math.PI/2);glass.material=glass.material.clone();glass.material.metalness=.25;glass.material.roughness=.12;
  });
  const base=new THREE.Group();scene.add(base);
  roundedBox(base,3.2,.14,5.8,'#526472',[0,-1.83,-1.15],.04);
  for(const x of [-1.37,1.37])roundedBox(base,.16,.13,5.48,'#3b505e',[x,-1.88,-1.15],.025);
  for(const x of [-1.35,1.35])for(const z of [-3.70,1.40])bolt(base,[x,-1.715,z],.09,'y');
  // Ranuras y cartelas del bastidor soldado.
  for(const x of [-1.10,1.10])for(const z of [-3.5,1.15])roundedBox(base,.07,.012,.25,'#1e303b',[x,-1.751,z],.004);
  for(const z of [-3.5,1.2])roundedBox(base,2.6,.10,.10,'#3b505e',[0,-1.87,z],.018);
  return {rotor};
}


