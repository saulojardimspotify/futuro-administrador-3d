// Os 6 bonecos que o jogador pode escolher.
// Cada boneco é montado com caixas (cabeça, tronco, braços, pernas, cabelo).

const PELE_NEGRA = 0x6b4226;
const PELE_BRANCA = 0xf1c9a5;

const PERSONAGENS = [
  { nome: 'Mario', arquivo: 'mario', descricao: 'Homem negro, cabelo preto curto', mulher: false, pele: PELE_NEGRA, cabelo: 0x111111, longo: false, raspado: true, camisa: 0x1e3a8a, calca: 0x1f2937 },
  { nome: 'Enzo', arquivo: 'enzo', descricao: 'Homem branco, cabelo preto', mulher: false, pele: PELE_BRANCA, cabelo: 0x111111, longo: false, camisa: 0x15803d, calca: 0x1f2937 },
  { nome: 'Joca', arquivo: 'joca', descricao: 'Homem branco, cabelo roxo curto', mulher: false, pele: PELE_BRANCA, cabelo: 0x8e44ad, longo: false, camisa: 0xea580c, calca: 0x334155 },
  { nome: 'Valentina', arquivo: 'valentina', descricao: 'Mulher negra, cabelo preto longo', mulher: true, pele: PELE_NEGRA, cabelo: 0x111111, longo: true, camisa: 0xdb2777, calca: 0x1f2937 },
  { nome: 'Isabella', arquivo: 'isabella', descricao: 'Mulher branca, cabelo loiro longo', mulher: true, pele: PELE_BRANCA, cabelo: 0xf4c430, longo: true, camisa: 0x7c3aed, calca: 0x334155 },
  { nome: 'Maria Flor', arquivo: 'mariaflor', descricao: 'Mulher branca, cabelo azul longo', mulher: true, pele: PELE_BRANCA, cabelo: 0x2f80ed, longo: true, camisa: 0x0891b2, calca: 0x1f2937 },
];

const corCss = (hex) => '#' + hex.toString(16).padStart(6, '0');

// Escurece/clareia uma cor (fator < 1 escurece, > 1 clareia)
function tonalidade(hex, fator) {
  const c = new THREE.Color(hex);
  c.r = Math.min(1, c.r * fator);
  c.g = Math.min(1, c.g * fator);
  c.b = Math.min(1, c.b * fator);
  return c.getHex();
}

// Rosto desenhado: olhos com íris e brilho, sobrancelhas, nariz, boca e bochechas.
// Cada combinação de pele/cabelo/gênero é desenhada uma vez só e reaproveitada.
const rostosDesenhados = {};
function texturaRosto(def) {
  const chave = `${def.pele}|${def.cabelo}|${def.mulher}`;
  if (rostosDesenhados[chave]) return rostosDesenhados[chave];
  const c = document.createElement('canvas');
  c.width = 230;
  c.height = 210;
  const ctx = c.getContext('2d');
  ctx.fillStyle = corCss(def.pele);
  ctx.fillRect(0, 0, 230, 210);

  // bochechas rosadas
  ctx.fillStyle = def.mulher ? 'rgba(244, 114, 182, 0.35)' : 'rgba(239, 68, 68, 0.15)';
  for (const x of [48, 182]) {
    ctx.beginPath(); ctx.ellipse(x, 128, 22, 13, 0, 0, Math.PI * 2); ctx.fill();
  }

  // sobrancelhas (um pouco mais escuras que o cabelo)
  ctx.strokeStyle = corCss(tonalidade(def.cabelo, 0.7));
  ctx.lineWidth = def.mulher ? 7 : 10;
  ctx.lineCap = 'round';
  for (const [x1, x2] of [[45, 90], [140, 185]]) {
    ctx.beginPath(); ctx.moveTo(x1, 50); ctx.quadraticCurveTo((x1 + x2) / 2, 38, x2, 48); ctx.stroke();
  }

  // olhos: branco, íris castanha, pupila e brilho
  for (const x of [68, 162]) {
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.ellipse(x, 85, 22, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#5b3a1e';
    ctx.beginPath(); ctx.arc(x, 88, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#111111';
    ctx.beginPath(); ctx.arc(x, 88, 7, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath(); ctx.arc(x + 5, 82, 4.5, 0, Math.PI * 2); ctx.fill();
    // contorno de cima do olho (cílios mais grossos nas mulheres)
    ctx.strokeStyle = '#1f1309';
    ctx.lineWidth = def.mulher ? 6 : 3.5;
    ctx.beginPath(); ctx.ellipse(x, 85, 22, 20, 0, Math.PI * 1.08, Math.PI * 1.92); ctx.stroke();
    if (def.mulher) {
      ctx.beginPath(); ctx.moveTo(x + 18, 73); ctx.lineTo(x + 28, 66); ctx.stroke();
    }
  }

  // nariz: só uma sombra suave
  ctx.strokeStyle = 'rgba(0, 0, 0, 0.22)';
  ctx.lineWidth = 5;
  ctx.beginPath(); ctx.moveTo(108, 128); ctx.quadraticCurveTo(115, 136, 122, 128); ctx.stroke();

  // boca sorrindo (lábios rosados nas mulheres)
  ctx.fillStyle = def.mulher ? '#d1495b' : '#7a2e2e';
  ctx.beginPath(); ctx.moveTo(88, 154); ctx.quadraticCurveTo(115, 184, 142, 154); ctx.quadraticCurveTo(115, 164, 88, 154); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.moveTo(96, 157); ctx.quadraticCurveTo(115, 168, 134, 157); ctx.quadraticCurveTo(115, 161, 96, 157); ctx.fill();

  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 16;
  rostosDesenhados[chave] = t;
  return t;
}

// Monta um boneco. A frente dele aponta para -Z (a direção em que ele corre).
// opcoes.mochila = false tira a mochila; opcoes.rosto = false não desenha o rosto
// (usado pelo Túlio e pelo chefe, que têm rosto próprio).
function criarPersonagem(def, opcoes = {}) {
  const mochila = opcoes.mochila !== false;
  const boneco = new THREE.Group();

  // Pernas: o "pivô" (ponto de giro) fica no quadril, para elas balançarem ao correr.
  const criarPerna = (x) => {
    const perna = new THREE.Group();
    perna.position.set(x, 0.75, 0);
    const coxa = caixaArredondada(0.24, 0.66, 0.26, def.calca);
    coxa.position.y = -0.33;
    const tenis = caixaArredondada(0.27, 0.12, 0.38, 0xf8fafc);
    tenis.position.set(0, -0.67, -0.05);
    const sola = caixa(0.28, 0.04, 0.39, 0x94a3b8);
    sola.position.set(0, -0.73, -0.05);
    perna.add(coxa, tenis, sola);
    boneco.add(perna);
    return perna;
  };
  const pernaE = criarPerna(-0.15);
  const pernaD = criarPerna(0.15);

  const tronco = caixaArredondada(0.62, 0.7, 0.36, def.camisa);
  tronco.position.y = 1.1;
  const gola = caixaArredondada(0.36, 0.07, 0.3, tonalidade(def.camisa, 0.75));
  gola.position.set(0, 1.44, -0.02);
  const cinto = caixaArredondada(0.63, 0.07, 0.37, 0x1f2937);
  cinto.position.y = 0.78;
  const pescoco = caixaArredondada(0.2, 0.12, 0.2, tonalidade(def.pele, 0.9));
  pescoco.position.y = 1.5;
  boneco.add(tronco, gola, cinto, pescoco);

  // Braços: pivô no ombro.
  const criarBraco = (x) => {
    const braco = new THREE.Group();
    braco.position.set(x, 1.4, 0);
    const manga = caixaArredondada(0.21, 0.3, 0.23, def.camisa);
    manga.position.y = -0.13;
    const antebraco = caixaArredondada(0.16, 0.28, 0.18, def.pele);
    antebraco.position.y = -0.4;
    const mao = caixaArredondada(0.18, 0.15, 0.2, def.pele);
    mao.position.y = -0.6;
    braco.add(manga, antebraco, mao);
    boneco.add(braco);
    return braco;
  };
  const bracoE = criarBraco(-0.42);
  const bracoD = criarBraco(0.42);

  // Cabeça (um pouco maior, estilo boneco "fofo")
  const cabeca = new THREE.Group();
  cabeca.position.y = 1.83;
  cabeca.add(caixaArredondada(0.64, 0.62, 0.58, def.pele));
  for (const x of [-0.33, 0.33]) {
    const orelha = caixaArredondada(0.06, 0.15, 0.11, tonalidade(def.pele, 0.93));
    orelha.position.set(x, 0, 0.02);
    cabeca.add(orelha);
  }
  if (opcoes.rosto !== false) {
    const rosto = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.42), new THREE.MeshLambertMaterial({ map: texturaRosto(def) }));
    rosto.position.set(0, -0.04, -0.295);
    rosto.rotation.y = Math.PI; // virado para a frente do boneco (-Z)
    cabeca.add(rosto);
  }

  // Cabelo
  const pecaCabelo = (l, a, p, x, y, z, giro = 0) => {
    const c = caixaArredondada(l, a, p, def.cabelo);
    c.position.set(x, y, z);
    c.rotation.z = giro;
    cabeca.add(c);
  };
  if (def.raspado) {
    pecaCabelo(0.64, 0.08, 0.6, 0, 0.32, 0);
    pecaCabelo(0.64, 0.22, 0.06, 0, 0.18, 0.3);
  } else {
    pecaCabelo(0.68, 0.16, 0.62, 0, 0.35, 0);
    pecaCabelo(0.68, 0.36, 0.1, 0, 0.15, 0.31);
    pecaCabelo(0.66, 0.12, 0.08, 0, 0.26, -0.3);
    if (!def.longo) {
      // topete com volume
      pecaCabelo(0.34, 0.12, 0.34, -0.08, 0.45, -0.1, 0.15);
      pecaCabelo(0.26, 0.1, 0.3, 0.15, 0.44, 0.05, -0.2);
    }
  }
  if (def.longo) {
    pecaCabelo(0.7, 0.98, 0.14, 0, -0.18, 0.33);
    pecaCabelo(0.08, 0.68, 0.46, -0.35, -0.03, 0.06);
    pecaCabelo(0.08, 0.68, 0.46, 0.35, -0.03, 0.06);
    pecaCabelo(0.5, 0.12, 0.4, 0, 0.44, 0.02); // volume no topo
  }
  boneco.add(cabeca);

  if (mochila) {
    const m = caixaArredondada(0.5, 0.56, 0.22, 0x1d4ed8);
    m.position.set(0, 1.12, 0.29);
    const bolso = caixaArredondada(0.34, 0.2, 0.06, 0x1e40af);
    bolso.position.set(0, 0.97, 0.41);
    boneco.add(m, bolso);
  }

  boneco.userData = { pernaE, pernaD, bracoE, bracoD, cabeca };
  return boneco;
}

// Balança braços e pernas. "fase" é um número que cresce com o tempo.
function animarCorrida(boneco, fase, intensidade = 0.9) {
  const a = Math.sin(fase) * intensidade;
  const p = boneco.userData;
  p.pernaE.rotation.x = a;
  p.pernaD.rotation.x = -a;
  p.bracoE.rotation.x = -a;
  p.bracoD.rotation.x = a;
}

// Pose do pulo: pernas dobradas e braços para cima.
function poseSalto(boneco) {
  const p = boneco.userData;
  p.pernaE.rotation.x = 0.7;
  p.pernaD.rotation.x = -0.4;
  p.bracoE.rotation.x = 2.6;
  p.bracoD.rotation.x = 2.6;
}

// Capelo de formatura (o chapéu quadrado).
function criarCapelo() {
  const g = new THREE.Group();
  const base = caixa(0.6, 0.14, 0.58, 0x111111);
  const topo = caixa(0.86, 0.04, 0.86, 0x111111);
  topo.position.y = 0.09;
  const borla = caixa(0.04, 0.28, 0.04, 0xfacc15);
  borla.position.set(0.4, -0.05, -0.4);
  g.add(base, topo, borla);
  g.position.y = 0.46;
  return g;
}

// Tira uma "foto" do boneco para usar nos cartões de escolha e no HUD.
let renderizadorRetrato = null;
function gerarRetrato(def, corpoInteiro) {
  if (!renderizadorRetrato) {
    renderizadorRetrato = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderizadorRetrato.setSize(256, 256);
  }
  const cena = new THREE.Scene();
  cena.add(new THREE.HemisphereLight(0xffffff, 0x8888aa, 0.9));
  const luz = new THREE.DirectionalLight(0xffffff, 0.6);
  luz.position.set(1, 2, -3);
  cena.add(luz);
  cena.add(criarPersonagem(def, { mochila: false }));

  const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  if (corpoInteiro) {
    camera.position.set(0.9, 1.5, -5.4);
    camera.lookAt(0, 1.08, 0);
  } else {
    camera.position.set(0.3, 2.0, -2.1);
    camera.lookAt(0, 1.8, 0);
  }
  renderizadorRetrato.render(cena, camera);
  return renderizadorRetrato.domElement.toDataURL();
}
