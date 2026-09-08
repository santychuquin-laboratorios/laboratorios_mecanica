// Generador sin dependencias para la distribución a alumnos.
// Ejecutar desde cualquier carpeta: node build-standalone.cjs
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const read = name => fs.readFileSync(path.join(__dirname,name),'utf8');

// Empaqueta únicamente los módulos conocidos de este proyecto, manteniendo
// sus ámbitos separados. Falla si aparece una dependencia nueva sin registrar.
function moduleBody(name) {
  return read(name)
    .replace(/import\s+\*\s+as\s+THREE\s+from\s+['"]three['"];?/g,'')
    .replace(/import\s*\{([^}]+)\}\s*from\s*['"]three['"];?/g,(_,names)=>`const {${names}} = THREE;`)
    .replace(/import\s*\{([^}]+)\}\s*from\s*['"]\.\/(?:vendor\/|three\/)?[^'"]+['"];?/g,()=>{throw Error('Importación local inesperada');});
}
let three=read('vendor/three.module.js');
const exportMatch=three.match(/export\s*\{([^}]+)\};?\s*$/);
if(!exportMatch)throw Error('Formato de exportaciones de Three.js no reconocido');
const properties=exportMatch[1].split(',').map(item=>{const pair=item.trim().split(/\s+as\s+/);return pair.length===2?`${pair[1]}:${pair[0]}`:pair[0];}).join(',');
three=three.slice(0,exportMatch.index)+`\nreturn {${properties}};`;
function library(name,exportName){
  let body=moduleBody(name).replace(/export\s*\{[^}]+\};?\s*$/,'').replace(/export\s+(?=function|const|class)/g,'');
  return `const ${exportName} = (()=>{\n${body}\nreturn ${exportName};\n})();`;
}
let app=read('script.js').replace(/^import[^\n]+;\s*$/gm,'').replace(/export\s+const\s+labState/,'const labState');
const code=`(()=>{'use strict';\ntry {\nconst THREE=(()=>{${three}\n})();\n${library('vendor/OrbitControls.js','OrbitControls')}\n${library('vendor/RoomEnvironment.js','RoomEnvironment')}\n${library('pump-model.js','buildDetailedPump')}\n${library('flow-field.js','createFlowField')}\n${app}\n} catch(error){console.error(error);const message=document.getElementById('loading');message.hidden=false;message.textContent='No se pudo iniciar el visor 3D. Abre este archivo en una versión reciente de Chrome, Edge o Firefox con WebGL habilitado.';}\n})();`;
// Compilar sin ejecutar comprueba que no queden imports ni exports de módulos.
new vm.Script(code,{filename:'BOMBA_CENTRIFUGA_3D.html'});
const safeCode=code.replace(/<\/script/gi,'<\\/script');
const license=read('vendor/LICENSE-three.txt').replace(/-->/g,'-- >');
let html=read('index.html')
  .replace('<link rel="stylesheet" href="style.css">',()=>`<style>\n${read('style.css')}\n</style>`)
  .replace(/\s*<script type="importmap">[\s\S]*?<\/script>/,'')
  .replace('href="./"','href="#"')
  .replace(/<script type="module">[\s\S]*?<\/script>/,()=>`<!-- Three.js / MIT license\n${license}\n-->\n<script>\n${safeCode}\n</script>`)
  .replace('</main>','<p class="standalone-note" style="text-align:center;font:12px Segoe UI,Arial;color:#658091;padding:0 16px 20px">Edición para alumnos · Archivo autónomo · Abre este HTML con Chrome, Edge o Firefox. No necesita internet.</p></main>');
const output=path.join(__dirname,'BOMBA_CENTRIFUGA_3D.html');
fs.writeFileSync(output,html);
console.log(`Creado: ${output}\nTamaño: ${(Buffer.byteLength(html)/1024/1024).toFixed(2)} MB`);
