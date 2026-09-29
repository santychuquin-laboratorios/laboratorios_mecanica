// AVK DN400: serie756 Appendix1 rev.AF junio2026 p.3; serie820 Pressure loss p.1.
const kCatalogs={
 avk756:{name:'AVK 756 · DN 400',color:'#58c8f2',points:[[10,868.04],[20,194.86],[30,62.76],[40,25.95],[50,10.27],[60,3.89],[70,1.30],[80,.54],[90,.23]]},
 avk820:{name:'AVK 820 · DN 400',color:'#f5a6db',points:[[20,306.81],[30,55.27],[40,18.17],[50,6.59],[60,2.58],[70,.94],[80,.39],[90,.30]]}
};
let activeKCatalog='avk756';
function getCatalogK(id,angle){
 const points=kCatalogs[id].points;
 if(!Number.isFinite(angle)||angle<points[0][0]||angle>90)return null;
 const exact=points.find(p=>p[0]===angle);if(exact)return exact[1];
 for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i];if(angle<b[0]){const t=(angle-a[0])/(b[0]-a[0]);return Math.exp(Math.log(a[1])*(1-t)+Math.log(b[1])*t);}}
 return null;
}
function kRange(angle){const k=getCatalogK(activeKCatalog,angle);return k===null?null:[k,k];}
function formatCatalogK(k){return k.toLocaleString('es',{maximumFractionDigits:2});}
function drawKChart(){
 const canvas=document.getElementById('k-chart'),ctx=canvas.getContext('2d');
 const w=canvas.width,h=canvas.height,L=68,R=28,T=40,B=62;
 const x=a=>L+a/90*(w-L-R),y=k=>T+(3-Math.log10(k))/4*(h-T-B);
 ctx.clearRect(0,0,w,h);ctx.fillStyle='#0c2940';ctx.fillRect(0,0,w,h);
 ctx.font='21px Segoe UI';ctx.lineWidth=1;
 for(const tick of [.1,1,10,100,1000]){ctx.strokeStyle='#35566b';ctx.beginPath();ctx.moveTo(L,y(tick));ctx.lineTo(w-R,y(tick));ctx.stroke();ctx.textAlign='right';ctx.fillStyle='#bdd3df';ctx.fillText(formatCatalogK(tick),L-8,y(tick)+7);}
 for(const tick of [0,10,20,30,40,50,60,70,80,90]){ctx.strokeStyle='#264b63';ctx.beginPath();ctx.moveTo(x(tick),T);ctx.lineTo(x(tick),h-B);ctx.stroke();ctx.textAlign='center';ctx.fillStyle='#bdd3df';ctx.fillText(tick,x(tick),h-34);}
 for(const [id,catalog] of Object.entries(kCatalogs)){
  ctx.strokeStyle=catalog.color;ctx.fillStyle=catalog.color;ctx.lineWidth=id===activeKCatalog?3.5:2;
  ctx.setLineDash(id==='avk820'?[8,5]:[]);ctx.beginPath();catalog.points.forEach((p,i)=>{i?ctx.lineTo(x(p[0]),y(p[1])):ctx.moveTo(x(p[0]),y(p[1]));});ctx.stroke();ctx.setLineDash([]);
  for(const [angle,k] of catalog.points){ctx.beginPath();if(id==='avk820')ctx.rect(x(angle)-4,y(k)-4,8,8);else ctx.arc(x(angle),y(k),4,0,Math.PI*2);ctx.fill();}
 }
 const k=getCatalogK(activeKCatalog,opening);
 ctx.strokeStyle='#ffc86c';ctx.lineWidth=1.5;ctx.setLineDash([4,5]);ctx.beginPath();ctx.moveTo(x(opening),T);ctx.lineTo(x(opening),h-B);ctx.stroke();ctx.setLineDash([]);
 if(k!==null){ctx.beginPath();ctx.arc(x(opening),y(k),8,0,Math.PI*2);ctx.strokeStyle='#ffc86c';ctx.lineWidth=3;ctx.stroke();}
 ctx.fillStyle='#d6e9f4';ctx.textAlign='left';ctx.font='21px Segoe UI';ctx.fillText('K',L,25);
 ctx.textAlign='center';ctx.font='20px Segoe UI';ctx.fillText('Ángulo de apertura [°]',(L+w-R)/2,h-5);
 document.getElementById('k-value').value=k===null?'Sin dato':formatCatalogK(k);
 const exact=kCatalogs[activeKCatalog].points.some(p=>p[0]===opening);
 document.getElementById('k-reading').textContent=`${kCatalogs[activeKCatalog].name} · ${Math.round(opening)}° · ${k===null?'fuera del intervalo publicado':exact?'valor tabulado':'interpolación logarítmica'}`;
 canvas.setAttribute('aria-label',`K frente al ángulo de apertura, DN 400. ${document.getElementById('k-reading').textContent}. K: ${k===null?'sin dato':formatCatalogK(k)}.`);
}
