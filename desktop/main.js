// Versão para computador (.exe) do Futuro Administrador, feita com Electron.
// O programa abre o jogo numa janela própria, sem internet: todos os arquivos
// (jogo, modelos 3D, texturas e bibliotecas) vêm dentro dele, na pasta "jogo".

const { app, BrowserWindow, Menu } = require('electron');
const http = require('http');
const fs = require('fs');
const path = require('path');

// Usa a placa de vídeo mais forte (notebooks com duas placas) e não bloqueia
// placas antigas: o jogo 3D roda bem mais liso assim.
app.commandLine.appendSwitch('force_high_performance_gpu');
app.commandLine.appendSwitch('ignore-gpu-blocklist');

const PASTA_JOGO = path.join(__dirname, 'jogo');
const TIPOS = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.glb': 'model/gltf-binary', '.jpg': 'image/jpeg', '.png': 'image/png',
  '.webp': 'image/webp', '.mp3': 'audio/mpeg',
};

// Servidor só dentro do computador (127.0.0.1): o jogo carrega os modelos 3D
// como faz no site, sem os bloqueios que o navegador aplica a arquivos locais.
function iniciarServidor() {
  return new Promise((pronto) => {
    const servidor = http.createServer((req, res) => {
      const url = new URL(req.url, 'http://localhost');
      const caminho = url.pathname === '/' ? '/index.html' : decodeURIComponent(url.pathname);
      const arquivo = path.join(PASTA_JOGO, caminho);
      if (!arquivo.startsWith(PASTA_JOGO) || !fs.existsSync(arquivo) || fs.statSync(arquivo).isDirectory()) {
        res.writeHead(404);
        return res.end();
      }
      res.writeHead(200, { 'Content-Type': TIPOS[path.extname(arquivo)] || 'application/octet-stream' });
      fs.createReadStream(arquivo).pipe(res);
    });
    servidor.listen(0, '127.0.0.1', () => pronto(servidor.address().port));
  });
}

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null); // sem a barra de menus do Windows
  const porta = await iniciarServidor();
  const janela = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    title: 'Futuro Administrador',
    backgroundColor: '#1a1f4d',
    webPreferences: { backgroundThrottling: false },
  });
  janela.maximize();
  janela.loadURL(`http://127.0.0.1:${porta}/index.html`);
  janela.once('ready-to-show', () => janela.show());
});

app.on('window-all-closed', () => app.quit());
