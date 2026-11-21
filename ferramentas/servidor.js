// Servidor local para converter modelos (uso: node ferramentas/servidor.js).
// Serve a pasta do jogo e salva em modelos/glb os arquivos enviados pelo conversor.
const http = require('http');
const fs = require('fs');
const path = require('path');

const JOGO = path.resolve(__dirname, '..');
const SAIDA = path.join(JOGO, 'modelos', 'glb');
fs.mkdirSync(SAIDA, { recursive: true });

const TIPOS = {
  '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.fbx': 'application/octet-stream',
  '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp', '.mp3': 'audio/mpeg',
};

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (req.method === 'POST' && url.pathname === '/salvar') {
    const nome = path.basename(url.searchParams.get('nome') || '');
    if (!/^[a-z0-9_-]+\.(glb|jpg)$/i.test(nome)) {
      res.writeHead(400);
      return res.end('nome inválido');
    }
    const partes = [];
    req.on('data', (p) => partes.push(p));
    req.on('end', () => {
      fs.writeFileSync(path.join(SAIDA, nome), Buffer.concat(partes));
      res.end('ok');
    });
    return;
  }
  const arquivo = path.join(JOGO, decodeURIComponent(url.pathname));
  if (!arquivo.startsWith(JOGO) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
    res.writeHead(404);
    return res.end();
  }
  res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
  fs.createReadStream(arquivo).pipe(res);
}).listen(8095, () => console.log('Conversor: http://localhost:8095/ferramentas/conversor.html'));
