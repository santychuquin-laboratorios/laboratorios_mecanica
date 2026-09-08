import * as THREE from 'three';

// Posprocesado ilustrativo de un campo prescrito. No integra Navier–Stokes.
// Cada trayectoria cruza aspiración, región radial, colector y descarga.
export function createFlowField(scene,pressureCase) {
  const group=new THREE.Group();scene.add(group);group.visible=false;
  const uniforms={time:{value:0},backbone:{value:1},density:{value:1},gain:{value:1}};
  const material=new THREE.ShaderMaterial({
    uniforms,transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:`
      attribute float pressure; attribute float lane;
      varying float progress; varying float magnitude; varying float seed;
      void main(){progress=uv.x;magnitude=pressure;seed=lane;
        gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}
    `,
    fragmentShader:`
      uniform float time,backbone,density,gain;
      varying float progress,magnitude,seed;
      vec3 ramp(float v){
        vec3 a=vec3(.07,.23,.88),b=vec3(0.,.74,.95),c=vec3(.16,.83,.50),d=vec3(1.,.84,.12),e=vec3(.97,.19,.09);
        float x=clamp(v,0.,1.)*4.;
        if(x<1.)return mix(a,b,x);if(x<2.)return mix(b,c,x-1.);
        if(x<3.)return mix(c,d,x-2.);return mix(d,e,x-3.);
      }
      void main(){
        if(fract(seed*.618)>density)discard;
        float phase=fract(progress*13.-time+seed*.37);
        float trail=smoothstep(.45,.94,phase)*(1.-smoothstep(.96,1.,phase));
        float head=smoothstep(.87,.95,phase)*(1.-smoothstep(.95,.985,phase));
        float alpha=(.14*backbone+trail*.83)*gain;
        if(alpha<.015)discard;
        vec3 color=ramp(magnitude);color=mix(color,vec3(1.),head*.38);
        // La paleta se define en sRGB, igual que la leyenda HTML.
        color=mix(color/12.92,pow((color+.055)/1.055,vec3(2.4)),step(vec3(.04045),color));
        gl_FragColor=vec4(color,alpha);
        #include <colorspace_fragment>
      }
    `
  });
  const paths=[];
  for(let lane=0;lane<42;lane++){
    const sector=lane%7,layer=Math.floor(lane/7),angle=.24+sector/7*5.5;
    const offset=(layer-2.5)*.034,seedAngle=angle-.65;
    const inletR=.12+layer*.025,p=[];
    for(let j=0;j<=16;j++){const t=j/16;p.push(new THREE.Vector3(inletR*Math.cos(seedAngle),inletR*Math.sin(seedAngle),2.75-t*2.35));}
    // Un codo suave desvía la entrada axial hacia la periferia del impulsor.
    for(let j=1;j<=28;j++){const t=j/28,r=inletR+(1.08+offset-inletR)*t,a=seedAngle+.65*t;p.push(new THREE.Vector3(r*Math.cos(a),r*Math.sin(a),.40*(1-t)+offset*t));}
    for(let j=1;j<=52;j++){const t=j/52,a=angle+(Math.PI*2-angle)*t,r=1.08+.16*t+offset;p.push(new THREE.Vector3(r*Math.cos(a),r*Math.sin(a),offset));}
    const outletR=.055+layer*.02,outletX=outletR*Math.cos(sector/7*Math.PI*2),outletZ=outletR*Math.sin(sector/7*Math.PI*2);
    p.push(new THREE.Vector3(1.29+offset,.24,offset),new THREE.Vector3(1.32+outletX,.65,outletZ));
    for(let j=1;j<=12;j++)p.push(new THREE.Vector3(1.32+outletX,.65+j/12*2.1,outletZ));
    const curve=new THREE.CatmullRomCurve3(p),geo=new THREE.TubeGeometry(curve,260,.0085,5,false);
    const count=geo.attributes.position.count,pressure=new Float32Array(count),lanes=new Float32Array(count);
    // Presión ilustrativa normalizada por tramos del recorrido, no por posición
    // espacial: evita clasificar el colector como descarga en zonas superpuestas.
    // Ligera caída hasta el ojo, aumento en impulsor y recuperación en voluta.
    // No representa presión manométrica/absoluta ni un resultado de un solver.
    for(let i=0;i<count;i++){
      const u=geo.attributes.uv.getX(i);
      const station=curve.getUtoTmapping(u)*(p.length-1);
      let value;
      if(station<=16)value=THREE.MathUtils.lerp(.18,.08,THREE.MathUtils.smoothstep(station,0,16));
      else if(station<=44)value=THREE.MathUtils.lerp(.08,.68,THREE.MathUtils.smoothstep(station,16,44));
      else if(station<=96)value=THREE.MathUtils.lerp(.68,.94,THREE.MathUtils.smoothstep(station,44,96));
      else value=.94;
      // Calibrar entrada y salida al caso; el perfil interno sigue prescrito.
      const bar=pressureCase.inlet+(value-.18)/(.94-.18)*(pressureCase.outlet-pressureCase.inlet);
      pressure[i]=THREE.MathUtils.clamp((bar-pressureCase.min)/(pressureCase.outlet-pressureCase.min),0,1);lanes[i]=lane;
    }
    geo.setAttribute('pressure',new THREE.BufferAttribute(pressure,1));geo.setAttribute('lane',new THREE.BufferAttribute(lanes,1));
    const m=new THREE.Mesh(geo,material);m.renderOrder=3;group.add(m);paths.push(m);
  }
  return {
    group,
    update(dt,{visible,paused,rpm,rate,density,lines}){
      group.visible=visible;if(!visible)return;
      if(!paused)uniforms.time.value+=dt*1.3*(rpm/1450)*rate;
      uniforms.density.value=density;uniforms.backbone.value=lines?1:0;
    }
  };
}
