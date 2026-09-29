// Interpretación visual propia del catálogo ERHARD, páginas 3–5.
// Proporciones didácticas, sin dimensiones ni certificación de fabricante.
function buildCatalogValve({THREE,make,add,tube}) {
  const blue='#0879b4', steel='#b8c8d0', dark='#163a50', rubber='#172630';
  function cyl(g,r,h,c,p=[0,0,0],axis='z',n=64){return add(g,new THREE.CylinderGeometry(r,r,h,n),c,p,axis==='z'?[Math.PI/2,0,0]:axis==='x'?[0,0,Math.PI/2]:[0,0,0]);}
  function ring(g,r,t,c,p=[0,0,0],axis='z'){return add(g,new THREE.TorusGeometry(r,t,12,96),c,p,axis==='y'?[Math.PI/2,0,0]:axis==='x'?[0,Math.PI/2,0]:[0,0,0]);}
  function rounded(g,w,h,d,c,p=[0,0,0],r=.06){
    const s=new THREE.Shape(),x=-w/2,y=-h/2;
    s.moveTo(x+r,y);s.lineTo(x+w-r,y);s.quadraticCurveTo(x+w,y,x+w,y+r);s.lineTo(x+w,y+h-r);s.quadraticCurveTo(x+w,y+h,x+w-r,y+h);s.lineTo(x+r,y+h);s.quadraticCurveTo(x,y+h,x,y+h-r);s.lineTo(x,y+r);s.quadraticCurveTo(x,y,x+r,y);
    const geo=new THREE.ExtrudeGeometry(s,{depth:d-.04,bevelEnabled:true,bevelSize:.02,bevelThickness:.02,bevelSegments:3,curveSegments:12});geo.translate(0,0,-d/2+.02);return add(g,geo,c,p);
  }
  function fastener(g,p,axis='z',r=.065){
    const q=p.slice(),index=axis==='z'?2:axis==='x'?0:1;
    cyl(g,r*1.4,.022,steel,q,axis,32);q[index]+=.042;cyl(g,r,.066,steel,q,axis,6);
    q[index]+=.036;cyl(g,r*.3,.004,dark,q,axis,16);
  }
  function flangeGeometry(){
    const s=new THREE.Shape();s.absarc(0,0,1.82,0,Math.PI*2,false);
    function hole(x,y,r){const h=new THREE.Path();h.absarc(x,y,r,0,Math.PI*2,true);s.holes.push(h);}
    hole(0,0,1.17);for(let i=0;i<12;i++){const a=(i+.5)*Math.PI/6;hole(1.58*Math.cos(a),1.58*Math.sin(a),.082);}
    const geo=new THREE.ExtrudeGeometry(s,{depth:.18,bevelEnabled:true,bevelSize:.016,bevelThickness:.016,bevelSegments:3,curveSegments:64});geo.translate(0,0,-.09);return geo;
  }
  make('cuerpo',[0,0,0],[-2.6,0,0],g=>{
    tube(g,1.38,1.17,.84,blue);
    for(const z of [-.48,.48]){
      add(g,flangeGeometry(),blue,[0,0,z]);
      tube(g,1.43,1.17,.025,'#7197aa',z+Math.sign(z)*.112);
      for(const r of [1.22,1.28,1.34,1.40])ring(g,r,.0025,'#496e83',[0,0,z+Math.sign(z)*.13]);
      rounded(g,1.16,.23,.21,blue,[0,-1.75,z],.055);
    }
    for(const x of [-1.43,1.43])cyl(g,.32,.53,blue,[x,.04,.14],'x');
    cyl(g,.38,.11,blue,[-1.70,.04,.14],'x');
    for(const y of [-.20,.28])for(const z of [-.10,.38])fastener(g,[-1.77,y,z],'x',.046);
    for(const x of [-.80,.80])for(const z of [-.25,.25]){const rib=rounded(g,.13,.43,.10,blue,[x,-1.21,z],.025);rib.rotation.z=x>0?.5:-.5;}
  });
  const disc=make('disco',[0,.04,.14],[0,0,2.5],g=>{
    // Perfil abombado, borde fino y eje desplazado del plano de cierre.
    const profile=[[0,-.17],[.3,-.16],[.68,-.12],[.96,-.055],[1.09,-.025],[1.115,0],[1.09,.03],[.94,.075],[.68,.16],[.3,.22],[0,.23]];
    const geo=new THREE.LatheGeometry(profile.map(([r,z])=>new THREE.Vector2(r,z)),128);geo.rotateX(Math.PI/2);
    add(g,geo,blue,[0,-.04,-.14]);
    ring(g,1.10,.029,rubber,[0,-.04,-.14]);
    tube(g,1.076,.978,.025,'#294b60',-.235).position.y=-.04;
    for(let i=0;i<16;i++){const a=i*Math.PI/8;fastener(g,[1.025*Math.cos(a),1.025*Math.sin(a)-.04,-.266],'z',.024);}
    // Resaltes perfilados que protegen los dos semiejes.
    for(const x of [-.77,.77]){
      const boss=add(g,new THREE.SphereGeometry(1,32,20),blue,[x,0,.02]);boss.scale.set(.32,.23,.21);
      cyl(g,.16,.35,blue,[x,0,.02],'x');
    }
  });
  const shaft=make('eje',[0,.04,.14],[1.8,1.5,0],g=>{
    for(const side of [-1,1]){cyl(g,.112,.83,steel,[side*1.22,0,0],'x');cyl(g,.155,.12,steel,[side*1.40,0,0],'x');ring(g,.117,.012,dark,[side*1.52,0,0],'x');}
  });
  make('asiento',[0,0,0],[0,-2.1,.8],g=>{tube(g,1.19,1.118,.11,rubber);ring(g,1.14,.018,'#32424b');});
  make('cuello',[1.79,.04,.14],[1.6,1.6,0],g=>{
    cyl(g,.27,.35,blue,[0,0,0],'x');cyl(g,.35,.085,blue,[.18,0,0],'x');
    for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2;fastener(g,[.235,.26*Math.sin(a),.26*Math.cos(a)],'x',.045);}
  });
  let wheel,crank;
  const handle=make('palanca',[2.18,.04,.14],[2.8,1.2,0],g=>{
    rounded(g,.72,1.36,.72,blue,[.12,.30,0],.20);
    rounded(g,.78,1.25,.08,'#16577b',[.12,.30,.39],.18);
    for(const x of [-.13,.36])for(const y of [-.14,.74])fastener(g,[x,y,.455],'z',.045);
    cyl(g,.29,.105,blue,[.12,1.03,0],'y');cyl(g,.082,.28,steel,[.12,1.21,0],'y');
    wheel=new THREE.Group();wheel.position.set(.12,1.40,0);g.add(wheel);
    ring(wheel,.50,.055,'#71a9c3',[0,0,0],'y');cyl(wheel,.12,.11,steel,[0,0,0],'y');
    for(let i=0;i<3;i++){const a=i*Math.PI*2/3;const spoke=rounded(wheel,.075,.40,.055,'#71a9c3',[Math.sin(a)*.27,0,Math.cos(a)*.27],.03);spoke.rotation.set(Math.PI/2,a,0);}
    fastener(wheel,[0,.08,0],'y',.05);
    // Indicador mecánico de posición en la cara frontal.
    cyl(g,.19,.03,dark,[.12,.22,.455]);
    crank=rounded(g,.035,.25,.016,'#e7be4e',[.12,.22,.48],.012);
    // Placa del modelo didáctico, sin marcas de certificación.
    const canvas=document.createElement('canvas');canvas.width=512;canvas.height=192;const ctx=canvas.getContext('2d');ctx.fillStyle='#c7d3d9';ctx.fillRect(0,0,512,192);ctx.fillStyle='#17394e';ctx.font='bold 42px Arial';ctx.fillText('3D GENIAL',22,57);ctx.font='25px Arial';ctx.fillText('MARIPOSA · MODELO DIDÁCTICO',22,108);ctx.fillText('INSPIRACIÓN ERHARD ROCO',22,153);
    const tex=new THREE.CanvasTexture(canvas);tex.colorSpace=THREE.SRGBColorSpace;
    const plate=rounded(g,.53,.20,.014,steel,[.12,.67,.459],.012);plate.material.map=tex;plate.material.metalness=.15;plate.material.needsUpdate=true;
  });
  make('pernos',[0,0,0],[2.5,-1.7,0],g=>{
    for(let i=0;i<12;i++){const a=(i+.5)*Math.PI/6,x=1.58*Math.cos(a),y=1.58*Math.sin(a);cyl(g,.048,1.26,'#8195a2',[x,y,0]);for(const z of [-.64,.61])fastener(g,[x,y,z],'z');}
  });
  return {disc,shaft,handle,update(angle){disc.rotation.x=-THREE.MathUtils.degToRad(angle);wheel.rotation.y=THREE.MathUtils.degToRad(angle*8);crank.rotation.z=-THREE.MathUtils.degToRad(angle);}};
}
