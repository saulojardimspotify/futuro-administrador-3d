// Os 6 bonecos que o jogador pode escolher.
// Cada boneco é montado com caixas (cabeça, tronco, braços, pernas, cabelo).

const PELE_NEGRA = 0x6b4226;
const PELE_BRANCA = 0xf1c9a5;

const PERSONAGENS = [
  { nome: 'Mario', descricao: 'Homem negro, cabelo preto curto', mulher: false, pele: PELE_NEGRA, cabelo: 0x111111, longo: false, raspado: true, camisa: 0x1e3a8a, calca: 0x1f2937 },
  { nome: 'Enzo', descricao: 'Homem branco, cabelo preto', mulher: false, pele: PELE_BRANCA, cabelo: 0x111111, longo: false, camisa: 0x15803d, calca: 0x1f2937 },
  { nome: 'Joca', descricao: 'Homem branco, cabelo roxo curto', mulher: false, pele: PELE_BRANCA, cabelo: 0x8e44ad, longo: false, camisa: 0xea580c, calca: 0x334155 },
  { nome: 'Valentina', descricao: 'Mulher negra, cabelo preto longo', mulher: true, pele: PELE_NEGRA, cabelo: 0x111111, longo: true, camisa: 0xdb2777, calca: 0x1f2937 },
  { nome: 'Isabella', descricao: 'Mulher branca, cabelo loiro longo', mulher: true, pele: PELE_BRANCA, cabelo: 0xf4c430, longo: true, camisa: 0x7c3aed, calca: 0x334155 },
  { nome: 'Maria Flor', descricao: 'Mulher branca, cabelo azul longo', mulher: true, pele: PELE_BRANCA, cabelo: 0x2f80ed, longo: true, camisa: 0x0891b2, calca: 0x1f2937 },
];

// Monta um boneco. A frente dele aponta para -Z (a direção em que ele corre).
function criarPersonagem(def, opcoes = {}) {
  const mochila = opcoes.mochila !== false;
  const boneco = new THREE.Group();

  // Pernas: o "pivô" (ponto de giro) fica no quadril, para elas balançarem ao correr.
  const criarPerna = (x) => {
    const perna = new THREE.Group();
    perna.position.set(x, 0.75, 0);
    const coxa = caixa(0.24, 0.7, 0.26, def.calca);
    coxa.position.y = -0.35;
    const tenis = caixa(0.27, 0.12, 0.36, 0xffffff);
    tenis.position.set(0, -0.69, -0.05);
    perna.add(coxa, tenis);
    boneco.add(perna);
    return perna;
  };
  const pernaE = criarPerna(-0.15);
  const pernaD = criarPerna(0.15);

  const tronco = caixa(0.62, 0.7, 0.36, def.camisa);
  tronco.position.y = 1.1;
  boneco.add(tronco);

  // Braços: pivô no ombro.
  const criarBraco = (x) => {
    const braco = new THREE.Group();
    braco.position.set(x, 1.4, 0);
    const manga = caixa(0.21, 0.3, 0.23, def.camisa);
    manga.position.y = -0.13;
    const mao = caixa(0.17, 0.4, 0.19, def.pele);
    mao.position.y = -0.46;
    braco.add(manga, mao);
    boneco.add(braco);
    return braco;
  };
  const bracoE = criarBraco(-0.42);
  const bracoD = criarBraco(0.42);

  // Cabeça
  const cabeca = new THREE.Group();
  cabeca.position.y = 1.78;
  cabeca.add(caixa(0.56, 0.56, 0.52, def.pele));
  for (const x of [-0.12, 0.12]) {
    const olho = caixa(0.08, 0.1, 0.02, 0x111111);
    olho.position.set(x, 0.02, -0.27);
    cabeca.add(olho);
    if (def.mulher) {
      const cilio = caixa(0.12, 0.025, 0.02, 0x111111);
      cilio.position.set(x, 0.09, -0.27);
      cabeca.add(cilio);
    }
  }
  const boca = caixa(0.16, 0.035, 0.02, def.mulher ? 0xc2185b : 0x7a2e2e);
  boca.position.set(0, -0.14, -0.27);
  cabeca.add(boca);

  // Cabelo
  const pecaCabelo = (l, a, p, x, y, z) => {
    const c = caixa(l, a, p, def.cabelo);
    c.position.set(x, y, z);
    cabeca.add(c);
  };
  if (def.raspado) {
    pecaCabelo(0.58, 0.08, 0.54, 0, 0.3, 0);
    pecaCabelo(0.58, 0.2, 0.06, 0, 0.18, 0.27);
  } else {
    pecaCabelo(0.6, 0.15, 0.56, 0, 0.32, 0);
    pecaCabelo(0.6, 0.32, 0.1, 0, 0.14, 0.27);
    pecaCabelo(0.6, 0.1, 0.07, 0, 0.22, -0.27);
  }
  if (def.longo) {
    pecaCabelo(0.62, 0.9, 0.14, 0, -0.16, 0.29);
    pecaCabelo(0.08, 0.62, 0.42, -0.31, -0.02, 0.06);
    pecaCabelo(0.08, 0.62, 0.42, 0.31, -0.02, 0.06);
  }
  boneco.add(cabeca);

  if (mochila) {
    const m = caixa(0.5, 0.56, 0.22, 0x1d4ed8);
    m.position.set(0, 1.12, 0.29);
    boneco.add(m);
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
  g.position.y = 0.38;
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
    camera.position.set(0.3, 1.9, -1.9);
    camera.lookAt(0, 1.72, 0);
  }
  renderizadorRetrato.render(cena, camera);
  return renderizadorRetrato.domElement.toDataURL();
}
