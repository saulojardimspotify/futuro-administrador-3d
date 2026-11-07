// Junta tudo o que o .exe precisa na pasta "jogo", para funcionar sem internet:
//   1) copia os arquivos do jogo (sem os originais pesados do Mixamo);
//   2) baixa as bibliotecas do Three.js que o site pega da internet;
//   3) troca, no index.html, os endereços da internet pelos arquivos locais.
// Uso: node preparar.js "<pasta do jogo>"

const fs = require('fs');
const path = require('path');
const https = require('https');

const ORIGEM = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const DESTINO = path.join(__dirname, 'jogo');

const ITENS = ['index.html', 'style.css', 'js', 'img', 'sons', path.join('modelos', 'glb')];
const BIBLIOTECAS = {
  'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js': 'three.min.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/loaders/GLTFLoader.js': 'GLTFLoader.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/utils/SkeletonUtils.js': 'SkeletonUtils.js',
  'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/environments/RoomEnvironment.js': 'RoomEnvironment.js',
};

function baixar(url, arquivo) {
  return new Promise((ok, erro) => {
    https.get(url, (res) => {
      if (res.statusCode !== 200) return erro(new Error(`${url}: ${res.statusCode}`));
      res.pipe(fs.createWriteStream(arquivo)).on('finish', ok);
    }).on('error', erro);
  });
}

async function principal() {
  fs.rmSync(DESTINO, { recursive: true, force: true });
  for (const item of ITENS) {
    fs.cpSync(path.join(ORIGEM, item), path.join(DESTINO, item), { recursive: true });
  }

  const pastaBibliotecas = path.join(DESTINO, 'vendor');
  fs.mkdirSync(pastaBibliotecas, { recursive: true });
  let html = fs.readFileSync(path.join(DESTINO, 'index.html'), 'utf8');
  for (const [url, nome] of Object.entries(BIBLIOTECAS)) {
    await baixar(url, path.join(pastaBibliotecas, nome));
    html = html.replace(url, `vendor/${nome}`);
  }
  // fonte do Google: sem internet, o jogo usa Arial no lugar (não trava)
  fs.writeFileSync(path.join(DESTINO, 'index.html'), html);

  const tamanho = (pasta) => fs.readdirSync(pasta, { withFileTypes: true })
    .reduce((s, e) => s + (e.isDirectory() ? tamanho(path.join(pasta, e.name)) : fs.statSync(path.join(pasta, e.name)).size), 0);
  console.log(`Pronto: ${(tamanho(DESTINO) / 1048576).toFixed(1)} MB em ${DESTINO}`);
  console.log(`Endereços da internet que sobraram no index.html: ${(html.match(/src="https?:/g) || []).length}`);
}

principal().catch((e) => {
  console.error(e);
  process.exit(1);
});
