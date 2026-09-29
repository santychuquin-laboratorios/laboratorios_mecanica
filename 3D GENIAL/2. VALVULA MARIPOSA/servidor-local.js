const http = require('http');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

const root = __dirname;
const types = { '.html':'text/html; charset=utf-8', '.js':'text/javascript; charset=utf-8', '.css':'text/css; charset=utf-8', '.png':'image/png', '.jpg':'image/jpeg', '.svg':'image/svg+xml' };

const server = http.createServer((request, response) => {
  const urlPath = decodeURIComponent(new URL(request.url, 'http://localhost').pathname);
  const requested = urlPath === '/' ? 'index.html' : urlPath.replace(/^[/\\]+/, '');
  const filePath = path.resolve(root, requested);
  if (!filePath.startsWith(root + path.sep) || !fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    response.writeHead(404, { 'Content-Type':'text/plain; charset=utf-8' });
    response.end('Archivo no encontrado');
    return;
  }
  response.writeHead(200, { 'Content-Type': types[path.extname(filePath).toLowerCase()] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(response);
});

server.listen(8765, '127.0.0.1', () => {
  const address = 'http://localhost:8765/';
  console.log(`Laboratorio activo en ${address}`);
  console.log('Mantén esta ventana abierta mientras usas el visor 3D. Presiona Ctrl+C para detenerlo.');
  exec(`start "" "${address}"`);
});

server.on('error', error => {
  if (error.code === 'EADDRINUSE') {
    console.log('El laboratorio ya está abierto en http://localhost:8765/');
    exec('start "" "http://localhost:8765/"');
  } else {
    console.error(error.message);
  }
});
