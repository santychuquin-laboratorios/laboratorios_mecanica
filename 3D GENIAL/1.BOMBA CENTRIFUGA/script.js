import * as THREE from 'three';
import { OrbitControls } from 'three/addons/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/RoomEnvironment.js';
import { buildDetailedPump } from './pump-model.js';
import { createFlowField } from './flow-field.js';

// Catálogo separado del visor: un futuro GLB debe conservar estos identificadores
// como nombres de grupos, con el pivote del impulsor alineado con el eje Z.
const catalog = [
  ['voluta','Carcasa / Voluta','#287fa9','Contiene el fluido y recoge el caudal que sale del impulsor mediante un conducto de sección creciente.','Conduce el fluido hacia la descarga y convierte parte de su energía cinética en presión.'],
  ['impulsor','Impulsor abierto','#9da9ae','Transfiere energía mecánica desde el eje hacia el fluido a través de sus álabes.','Aumenta la energía del fluido, elevando su velocidad y contribuyendo al aumento de presión.'],
  ['eje','Eje','#9caeb9','Transmite el par del accionamiento al impulsor y mantiene alineado el conjunto giratorio.','Permite la transferencia de potencia mecánica. Su alineación ayuda a limitar vibraciones.'],
  ['aspiracion','Boca de aspiración','#4aa9c9','Conduce el fluido axialmente hasta el ojo del impulsor.','Las pérdidas en la aspiración reducen el NPSH disponible. Una presión local insuficiente puede provocar cavitación.'],
  ['descarga','Boca de descarga','#287fa9','Conecta la salida de la voluta con la tubería de impulsión.','Entrega el fluido al sistema. El punto de operación depende de las curvas de la bomba y de la instalación.'],
  ['sello','Sello mecánico','#6c8592','Limita la fuga de líquido en el paso del eje a través de la carcasa mediante caras de sellado.','Mantiene la estanqueidad; requiere condiciones adecuadas de lubricación y refrigeración.'],
  ['rodamiento-delantero','Rodamiento delantero','#b3bac1','Guía el eje cerca del impulsor y soporta las cargas asignadas según el diseño.','Reduce la fricción y limita desplazamientos radiales del conjunto giratorio.'],
  ['rodamiento-posterior','Rodamiento posterior','#b3bac1','Apoya el extremo posterior del eje y completa su guiado junto al rodamiento delantero.','Contribuye a la estabilidad del rotor; el reparto de cargas axiales depende del montaje.'],
  ['acoplamiento','Acoplamiento','#e69a43','Une el eje de la bomba al eje del motor, que no se representa en este modelo.','Transmite el par y puede admitir pequeñas desalineaciones, sin sustituir una alineación correcta.'],
  ['soporte','Soporte de rodamientos','#30576e','Aloja los rodamientos y fija el conjunto a la bancada. Incluye cárter, respiradero y aceitera de nivel constante, tomando como referencia el catálogo KWP.','Mantiene la alineación del eje y transmite las cargas mecánicas hacia la base.']
].map(([id,name,color,func,effect])=>({id,name,color,func,effect}));

// Estado preparado para módulos posteriores de H-Q, eficiencia, NPSH y semejanza.
export const labState = {mode:'external',rpm:1450,spinning:false,flow:false,labels:false,selected:'voluta',hydraulics:null};
const $ = id => document.getElementById(id);
const viewport=$('viewport'), scene=new THREE.Scene();
scene.background=new THREE.Color('#edf3f7');
const camera=new THREE.PerspectiveCamera(40,1,.1,150);
const renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
renderer.setPixelRatio(Math.min(devicePixelRatio,2));
renderer.outputColorSpace=THREE.SRGBColorSpace;
renderer.toneMapping=THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure=1.0;
renderer.shadowMap.enabled=false;
// Iluminación de estudio sin sombras proyectadas.
// Reflejos de un estudio virtual: el acero deja de parecer plástico gris.
const environmentGenerator=new THREE.PMREMGenerator(renderer);
const studio=new RoomEnvironment();
scene.environment=environmentGenerator.fromScene(studio,.04).texture;
scene.environmentIntensity=1.05;
studio.dispose();environmentGenerator.dispose();
viewport.appendChild(renderer.domElement);
renderer.domElement.setAttribute('aria-label','Modelo 3D: arrastra para rotar y usa la rueda o dos dedos para acercar. La lista permite seleccionar componentes.');
const controls=new OrbitControls(camera,renderer.domElement);
controls.enableDamping=true; controls.dampingFactor=.075; controls.minDistance=2; controls.maxDistance=32;
controls.touches.ONE=THREE.TOUCH.ROTATE; controls.touches.TWO=THREE.TOUCH.DOLLY_PAN;
scene.add(new THREE.HemisphereLight(0xf1f7ff,0x657080,1.15));
for(const [position,power] of [[[4,7,6],3.2],[[-5,3,-5],1.6]]){const l=new THREE.DirectionalLight(0xffffff,power);l.position.set(...position);scene.add(l);}
const grid=new THREE.GridHelper(24,48,0xd0dce5,0xe1e8ee);grid.position.y=-1.96;grid.material.transparent=true;grid.material.opacity=.42;scene.add(grid);
const pump=new THREE.Group();scene.add(pump);
const parts=new Map(), meshes=[];
function component(id,position,offset,build){const group=new THREE.Group();group.name=id;group.position.set(...position);pump.add(group);build(group);const entry={...catalog.find(x=>x.id===id),group,home:group.position.clone(),offset:new THREE.Vector3(...offset)};parts.set(id,entry);group.traverse(m=>{if(m.isMesh){m.userData.component=id;meshes.push(m);}});return group;}
const {rotor}=buildDetailedPump({scene,component});

// Caso elegido dentro del diagrama de selección KWP K, p. 17; no curva de ensayo.
const pressureCase={rho:1000,g:9.80665,head:22,inlet:0,min:-.30};
pressureCase.outlet=pressureCase.inlet+pressureCase.rho*pressureCase.g*pressureCase.head/100000;
const flowField=createFlowField(scene,pressureCase);
const flowSettings={paused:false,rate:1,density:1,lines:true};
// Leyenda y controles de posprocesado, visibles solamente al activar el flujo.
const flowLegend=document.createElement('section');flowLegend.id='flow-legend';flowLegend.hidden=true;
flowLegend.innerHTML=`<span class="eyebrow">CASO DE EJEMPLO · KWP K</span><strong>Presión estimada · bar(g)</strong><div class="color-ramp"></div><div class="scale-ticks">${[0,.25,.5,.75,1].map(t=>`<span>${(pressureCase.min+t*(pressureCase.outlet-pressureCase.min)).toFixed(2)}</span>`).join('')}</div><small>Entrada: 0,00 · Salida: ≈ ${pressureCase.outlet.toFixed(2)}<br>Agua · 1450 RPM · Q ≈ 70 m³/h<br>H ≈ 22 m · KWP K 65-315<br>Catálogo p. 17 · zona de selección<br>Mapa interior ilustrativo, no CFD.<br>bar(g): presión manométrica.<br>Referencia fija a 1450 RPM.</small>`;
viewport.append(flowLegend);
const flowPanel=document.createElement('section');flowPanel.id='flow-panel';flowPanel.hidden=true;
flowPanel.innerHTML=`<div class="flow-summary"><span class="eyebrow">TRAYECTORIAS DEL FLUIDO</span><strong>Entrada axial → impulsor → voluta → descarga</strong><small>El color representa un perfil ilustrativo de presión en bar manométricos para el caso de referencia. Las estelas indican el sentido del recorrido.</small></div><div class="flow-options"><button id="flow-pause" aria-pressed="false">Ⅱ Pausar estelas</button><button id="flow-lines" aria-pressed="true">Líneas de corriente</button><label>Densidad<select id="flow-density"><option value="0.34">Baja · 14 trayectorias aprox.</option><option value="0.67">Media · 28 trayectorias aprox.</option><option value="1" selected>Alta · 42 trayectorias</option></select></label><label>Velocidad visual<select id="flow-rate"><option value="0.5">0.5×</option><option value="1" selected>1×</option><option value="2">2×</option></select></label></div><p id="flow-note" role="status"></p>`;
document.querySelector('.simulation').after(flowPanel);
function updateFlowUI(){
  flowLegend.hidden=flowPanel.hidden=!labState.flow;
  $('flow-pause').setAttribute('aria-pressed',String(flowSettings.paused));
  $('flow-pause').textContent=flowSettings.paused?'▶ Reanudar estelas':'Ⅱ Pausar estelas';
  $('flow-lines').setAttribute('aria-pressed',String(flowSettings.lines));
  $('flow-note').textContent=labState.rpm===0?'0 RPM · transporte visual detenido. El campo de colores permanece como referencia.':flowSettings.paused?'Estelas en pausa para inspeccionar el campo.':'Transporte visual proporcional a las RPM seleccionadas; independiente del botón de giro. Caso fijo a 1450 RPM: Δp ≈ ρgH = 2,16 bar; entrada supuesta 0 bar(g). Se omiten diferencias de cota y velocidad. Cambiar RPM solo modifica la animación.';
}
$('flow-pause').onclick=()=>{flowSettings.paused=!flowSettings.paused;updateFlowUI();};
$('flow-lines').onclick=()=>{flowSettings.lines=!flowSettings.lines;updateFlowUI();};
$('flow-density').onchange=e=>{flowSettings.density=Number(e.target.value);};
$('flow-rate').onchange=e=>{flowSettings.rate=Number(e.target.value);};
let cameraMove=null, explosion=0;
function moveCamera(target,distance){const direction=camera.position.clone().sub(controls.target).normalize();cameraMove={target:target.clone(),position:target.clone().addScaledVector(direction,distance)};}
function resetCamera(){const wide=labState.mode==='explode';const d=(wide?15:9.7)*Math.max(1, .95/camera.aspect);cameraMove={target:new THREE.Vector3(0,.1,-.65),position:new THREE.Vector3(7,3.4,5).normalize().multiplyScalar(d).add(new THREE.Vector3(0,.1,-.65))};}
controls.addEventListener('start',()=>cameraMove=null);
function sync(){
  updateFlowUI();
  for(const id of ['external','internal','explode'])$(id).setAttribute('aria-pressed',String(labState.mode===id));
  $('view-title').textContent={external:'Conjunto ensamblado',internal:'Exploración del interior',explode:'Vista explotada · 10 componentes'}[labState.mode];
  $('spin').textContent=labState.spinning?'Ⅱ Detener impulsor':'▶ Iniciar impulsor';$('spin').setAttribute('aria-pressed',String(labState.spinning));
  $('flow').setAttribute('aria-pressed',String(labState.flow));$('flow').textContent=labState.flow?'≈ Detener flujo':'≈ Animación del flujo';
  $('labels-toggle').textContent=labState.labels?'⌖ Ocultar etiquetas':'⌖ Mostrar etiquetas';$('labels-toggle').setAttribute('aria-pressed',String(labState.labels));
  const selected=parts.get(labState.selected);$('visibility').textContent=selected.group.visible?'Ocultar pieza':'Mostrar pieza';$('visibility').setAttribute('aria-pressed',String(!selected.group.visible));
}
function setMode(mode){labState.mode=mode;if(mode!=='internal')labState.flow=false;for(const p of parts.values())p.group.visible=true;resetCamera();sync();}
// Imágenes aisladas del propio modelo, generadas una vez por componente.
const previewFigure=document.createElement('figure');previewFigure.className='component-preview';
const previewImage=document.createElement('img');
const previewCaption=document.createElement('figcaption');
previewFigure.append(previewImage,previewCaption);document.querySelector('.info-panel').append(previewFigure);
const previewRenderer=new THREE.WebGLRenderer({antialias:true,alpha:false});
previewRenderer.setSize(480,300);previewRenderer.setPixelRatio(1);
previewRenderer.outputColorSpace=THREE.SRGBColorSpace;
previewRenderer.toneMapping=THREE.ACESFilmicToneMapping;
const previewScene=new THREE.Scene();previewScene.background=new THREE.Color('#e8f0f5');
previewScene.environment=scene.environment;
previewScene.add(new THREE.HemisphereLight(0xffffff,0x657080,2));
const previewLight=new THREE.DirectionalLight(0xffffff,3);previewLight.position.set(3,5,6);previewScene.add(previewLight);
const previewCamera=new THREE.PerspectiveCamera(35,480/300,.01,100);
const previewCache=new Map();
function showComponentImage(part){
  if(!previewCache.has(part.id)){
    const model=part.group.clone(true);model.position.set(0,0,0);model.rotation.set(0,0,0);model.visible=true;
    const temporaryMaterials=[];
    model.traverse(o=>{if(o.isMesh){o.visible=true;o.material=o.material.clone();temporaryMaterials.push(o.material);o.material.opacity=1;o.material.transparent=false;o.material.depthWrite=true;if(o.material.emissive)o.material.emissive.set(0x000000);}});
    const bounds=new THREE.Box3().setFromObject(model),center=bounds.getCenter(new THREE.Vector3());
    const radius=bounds.getSize(new THREE.Vector3()).length()/2;
    model.position.sub(center);previewScene.add(model);
    const distance=radius/Math.sin(THREE.MathUtils.degToRad(35/2))*1.12;
    previewCamera.position.copy(new THREE.Vector3(1,.65,1.8).normalize().multiplyScalar(distance));previewCamera.lookAt(0,0,0);previewCamera.updateProjectionMatrix();
    previewRenderer.render(previewScene,previewCamera);
    previewCache.set(part.id,previewRenderer.domElement.toDataURL('image/png'));
    previewScene.remove(model);temporaryMaterials.forEach(m=>m.dispose());
  }
  previewImage.src=previewCache.get(part.id);previewImage.alt='Vista aislada: '+part.name;
  previewCaption.textContent=part.name+' · Vista del modelo';
}
function select(id,focus=true){
  labState.selected=id;const p=parts.get(id);p.group.visible=true;
  // Revelar piezas internas cuando se seleccionan desde la lista.
  if(focus && !['voluta','aspiracion','descarga','soporte','acoplamiento'].includes(id) && labState.mode==='external'){labState.mode='internal';}
  for(const [key,entry] of parts){entry.group.traverse(m=>{if(m.isMesh){m.material.emissive.set(key===id?'#965015':'#000000');m.material.emissiveIntensity=key===id?.075:0;}});entry.button.setAttribute('aria-pressed',String(key===id));}
  showComponentImage(p);$('part-name').textContent=p.name;$('part-function').textContent=p.func;$('part-effect').textContent=p.effect;$('part-number').textContent=String(catalog.findIndex(x=>x.id===id)+1).padStart(2,'0')+' / 10';
  if(focus){const box=new THREE.Box3().setFromObject(p.group);moveCamera(box.getCenter(new THREE.Vector3()),Math.max(3.8,box.getSize(new THREE.Vector3()).length()*1.6)*Math.max(1,.8/camera.aspect));}
  $('status').textContent=p.name+' seleccionado';sync();
}
for(const [i,data] of catalog.entries()){
  const p=parts.get(data.id);const button=document.createElement('button');button.className='part-row';button.innerHTML=`<span class="num">${String(i+1).padStart(2,'0')}</span><span class="dot" style="background:${data.color}"></span><span>${data.name}</span><span class="arrow">›</span>`;button.onclick=()=>select(data.id);$('parts-list').append(button);p.button=button;
  const label=document.createElement('button');label.className='part-label';label.textContent=data.name;label.onclick=()=>select(data.id);label.hidden=true;$('labels').append(label);p.label=label;
}
for(const mode of ['external','internal','explode'])$(mode).onclick=()=>setMode(mode);
$('assemble').onclick=()=>setMode('external');$('reset').onclick=resetCamera;
$('spin').onclick=()=>{labState.spinning=!labState.spinning;sync();};
$('rpm').oninput=e=>{labState.rpm=Number(e.target.value);$('rpm-value').value=labState.rpm;updateFlowUI();window.dispatchEvent(new CustomEvent('pump:statechange',{detail:{...labState}}));};
$('flow').onclick=()=>{labState.flow=!labState.flow;if(labState.flow){labState.mode='internal';for(const p of parts.values())p.group.visible=true;resetCamera();}$('status').textContent=labState.flow?'Flujo ilustrativo : axial → radial → voluta → descarga':'Flujo detenido';sync();};
$('labels-toggle').onclick=()=>{labState.labels=!labState.labels;sync();};
$('visibility').onclick=()=>{const p=parts.get(labState.selected);p.group.visible=!p.group.visible;sync();};$('show-all').onclick=()=>{for(const p of parts.values())p.group.visible=true;sync();};
// Distinguir un clic de un arrastre o un gesto con varios dedos.
const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();let pointerStart=null,gesture=false,activePointers=new Set();
renderer.domElement.addEventListener('pointerdown',e=>{activePointers.add(e.pointerId);if(activePointers.size>1)gesture=true;else{gesture=false;pointerStart={x:e.clientX,y:e.clientY};}});
renderer.domElement.addEventListener('pointercancel',e=>{activePointers.delete(e.pointerId);pointerStart=null;});
renderer.domElement.addEventListener('pointerup',e=>{activePointers.delete(e.pointerId);if(gesture||!pointerStart||Math.hypot(e.clientX-pointerStart.x,e.clientY-pointerStart.y)>5)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(meshes).filter(hit=>parts.get(hit.object.userData.component).group.visible);const hit=hits.find(h=>h.object.material.opacity>.45)||hits[0];if(hit)select(hit.object.userData.component,false);pointerStart=null;});
function resize(){const w=viewport.clientWidth,h=viewport.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h);resetCamera();}
new ResizeObserver(resize).observe(viewport);resize();camera.position.set(6,4,7);resetCamera();camera.position.copy(cameraMove.position);controls.target.copy(cameraMove.target);cameraMove=null;controls.update();select('voluta',false);
$('loading').hidden=true;
renderer.domElement.addEventListener('webglcontextlost',e=>{e.preventDefault();$('loading').hidden=false;$('loading').textContent='Se perdió el contexto gráfico. Recarga la página para reanudar el visor.';});
const clock=new THREE.Clock(),labelPos=new THREE.Vector3();
// Una sola animación independiente de la frecuencia de pantalla; geometrías compartidas
// para las partículas y resolución limitada para equipos móviles.
function animate(){
  requestAnimationFrame(animate);const dt=Math.min(clock.getDelta(),.05);if(document.hidden)return;
  const ease=1-Math.exp(-dt*6);explosion=THREE.MathUtils.lerp(explosion,labState.mode==='explode'?1:0,ease);
  for(const p of parts.values()){
    p.group.position.copy(p.home).addScaledVector(p.offset,explosion);
    const translucent=['voluta','soporte','aspiracion','descarga'].includes(p.id)||(p.id==='impulsor'&&labState.flow);const opacity=translucent&&labState.mode==='internal'?(labState.flow?.075:.16):1;
    p.group.traverse(m=>{if(m.isMesh&&(translucent||p.id==='impulsor')){m.material.opacity=THREE.MathUtils.lerp(m.material.opacity,opacity,ease);const transparent=m.material.opacity<.995;if(m.material.transparent!==transparent){m.material.transparent=transparent;m.material.needsUpdate=true;}m.material.depthWrite=!transparent;m.castShadow=!transparent;}});
  }
  if(labState.spinning){const angle=labState.rpm/60*Math.PI*2/30*dt;rotor.rotation.z+=angle;parts.get('eje').group.rotation.z+=angle;parts.get('acoplamiento').group.rotation.z+=angle;}
  flowField.update(dt,{visible:labState.flow && explosion<.025,rpm:labState.rpm,...flowSettings});
  if(cameraMove){camera.position.lerp(cameraMove.position,ease);controls.target.lerp(cameraMove.target,ease);if(camera.position.distanceTo(cameraMove.position)<.005)cameraMove=null;}
  controls.update();renderer.render(scene,camera);
  // Proyectar las etiquetas desde los pivotes de las piezas en movimiento.
  const occupied=[];
  for(const p of parts.values()){
    p.group.getWorldPosition(labelPos);labelPos.y+=p.id==='voluta'?1.05:.40;labelPos.project(camera);
    let x=(labelPos.x*.5+.5)*viewport.clientWidth,y=(-labelPos.y*.5+.5)*viewport.clientHeight;
    const visible=labState.labels&&p.group.visible&&labelPos.z>-1&&labelPos.z<1&&x>15&&x<viewport.clientWidth-15&&y>10&&y<viewport.clientHeight-50;
    p.label.hidden=!visible;if(!visible)continue;
    x=THREE.MathUtils.clamp(x,75,viewport.clientWidth-75);
    for(let n=0;n<12&&occupied.some(q=>Math.abs(q.x-x)<135&&Math.abs(q.y-y)<25);n++)y+=26;
    y=Math.min(y,viewport.clientHeight-65);occupied.push({x,y});p.label.style.left=x+'px';p.label.style.top=y+'px';
  }
}
animate();






