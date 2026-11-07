// Fase 2: Estágio na empresa.
// Obstáculos: chefe bravo, reunião inútil e prazo estourado. Coleta: metas batidas.

const META_FASE2 = 20;

const METAS = [
  'Vendas +20%', 'Custos −15%', 'Cliente novo', 'Projeto entregue', 'NPS 90',
  'Lucro recorde', 'Relatório aprovado', 'Prazo cumprido', 'Equipe engajada', 'Meta do trimestre',
].map((nome) => ({ nome }));

// alto = precisa desviar; baixo = dá para pular por cima
const OBSTACULOS_FASE2 = {
  chefe: { nome: 'Chefe bravo', alto: true },
  reuniao: { nome: 'Reunião inútil', alto: true },
  prazo: { nome: 'Prazo estourado', alto: false, altura: 0.95 },
  // alta demais para pular: só passa abaixando (↓) ou trocando de faixa
  mesa: { nome: 'Mesa de documentos', passarPorBaixo: true },
};

// Rosto bravo "pintado": sobrancelhas em V, boca para baixo e bochechas vermelhas.
let texturaRostoBravo = null;
function rostoBravo() {
  if (texturaRostoBravo) return texturaRostoBravo;
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 104;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#e8b892';
  ctx.fillRect(0, 0, 128, 104);
  ctx.fillStyle = 'rgba(220, 38, 38, 0.45)';
  ctx.fillRect(10, 52, 22, 12);
  ctx.fillRect(96, 52, 22, 12);
  ctx.strokeStyle = '#1f2937';
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(22, 14); ctx.lineTo(54, 28); // sobrancelhas em V
  ctx.moveTo(106, 14); ctx.lineTo(74, 28);
  ctx.stroke();
  ctx.fillStyle = '#111111';
  ctx.fillRect(34, 34, 14, 12);
  ctx.fillRect(80, 34, 14, 12);
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(42, 86); ctx.quadraticCurveTo(64, 66, 86, 86); // boca para baixo
  ctx.stroke();
  texturaRostoBravo = new THREE.CanvasTexture(c);
  texturaRostoBravo.magFilter = THREE.NearestFilter;
  return texturaRostoBravo;
}

// As texturas de texto são criadas uma vez só e reaproveitadas
let texturasFase2 = null;
function prepararTexturasFase2() {
  if (texturasFase2) return texturasFase2;
  texturasFase2 = {
    grrr: criarTexturaTexto('GRRR!', { largura: 256, altura: 110, fundo: '#7f1d1d', cor: '#fecaca', borda: '#dc2626' }),
    bla: criarTexturaTexto('blá blá blá...', { largura: 384, altura: 140, fundo: '#ffffff', cor: '#334155', borda: '#94a3b8' }),
    prazo: criarTexturaTexto('PRAZO ESTOURADO', { largura: 384, altura: 100, fundo: '#facc15', cor: '#b91c1c' }),
    relogio: criarTexturaRelogio(),
    abaixe: criarTexturaTexto('↓ ABAIXE ↓', { largura: 384, altura: 100, fundo: '#facc15', cor: '#111827' }),
  };
  return texturasFase2;
}

function criarTexturaRelogio() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.beginPath(); ctx.arc(64, 64, 62, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#111827';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.fillRect(64 + Math.sin(a) * 50 - 3, 64 - Math.cos(a) * 50 - 3, 6, 6);
  }
  ctx.strokeStyle = '#111827';
  ctx.lineCap = 'round';
  ctx.lineWidth = 7;
  ctx.beginPath(); ctx.moveTo(64, 64); ctx.lineTo(64, 26); ctx.stroke(); // ponteiro grande
  ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(64, 64); ctx.lineTo(92, 70); ctx.stroke(); // ponteiro pequeno
  return new THREE.CanvasTexture(c);
}

// Boneco "de frente" para o jogador (os bonecos olham para -Z; giramos 180°)
function bonecoDeFrente(def, escala) {
  const p = criarPersonagem(def, { mochila: false, rosto: false }); // o chefe tem rosto bravo próprio
  p.scale.setScalar(escala);
  p.rotation.y = Math.PI;
  return p;
}

function criarChefe() {
  const t = prepararTexturasFase2();
  const g = new THREE.Group();
  // chefe realista ("The Boss" do Mixamo) ou, se não baixou, o de blocos com rosto bravo
  const real = Modelos.criarJa('chefe', 'bravo');
  let chefe;
  if (real) {
    chefe = real.grupo;
    chefe.rotation.y = Math.PI; // de frente para o jogador
  } else {
    chefe = bonecoDeFrente({ pele: 0xe8b892, cabelo: 0x4b5563, longo: false, camisa: 0x1f2937, calca: 0x111827 }, 1);
    const rosto = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.42), new THREE.MeshLambertMaterial({ map: rostoBravo() }));
    rosto.position.set(0, -0.04, -0.295);
    rosto.rotation.y = Math.PI;
    chefe.userData.cabeca.add(rosto);
    const gravata = caixa(0.1, 0.45, 0.02, 0xdc2626);
    gravata.position.set(0, 1.15, -0.19);
    chefe.add(gravata);
  }
  g.add(chefe);

  // nuvem de raiva em cima da cabeça (mais baixa no realista, que é menor)
  const yNuvem = real ? -0.35 : 0;
  for (const [x, y, r] of [[-0.25, 2.55, 0.22], [0.05, 2.65, 0.28], [0.32, 2.55, 0.2]]) {
    const bola = new THREE.Mesh(new THREE.SphereGeometry(r, 10, 8), new THREE.MeshLambertMaterial({ color: 0x7f1d1d }));
    bola.position.set(x, y + yNuvem, 0);
    g.add(bola);
  }
  const grrr = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.34), new THREE.MeshBasicMaterial({ map: t.grrr }));
  grrr.position.set(0.03, 2.6 + yNuvem, 0.32);
  g.add(grrr);

  if (real) {
    // gesto de bravo parado; andando de verdade quando vem atrás do jogador
    let zInicial = null;
    g.userData.animar = (tempo, jogo) => {
      if (zInicial === null) zInicial = g.position.z;
      const dt = real.ultimoT === undefined ? 0 : Math.min(0.1, tempo - real.ultimoT);
      const andou = g.position.z - zInicial;
      if (jogo && jogo.z - g.position.z < 40 && andou < (g.userData.limite ?? 8)) {
        g.position.z += dt * 7;
        real.tocar('andar', 0.2);
        real.velocidade(1.8); // passos rápidos
      } else real.tocar('bravo', 0.2);
      real.atualizarAte(tempo);
    };
    return g;
  }

  // Dedo apontando e balançando. Quando o jogador está a 40 m, o chefe vem andando
  // rápido na direção dele. Ele para antes da fileira da frente ("limite", definido
  // em itens.js), para nunca bloquear a única faixa livre de outra fileira.
  let ultimo = null;
  let zInicial = null;
  g.userData.animar = (tempo, jogo) => {
    const dt = ultimo === null ? 0 : tempo - ultimo;
    ultimo = tempo;
    if (zInicial === null) zInicial = g.position.z;
    chefe.userData.bracoD.rotation.x = 1.4 + Math.sin(tempo * 10) * 0.3;
    chefe.userData.bracoE.rotation.z = -0.5;
    const andou = g.position.z - zInicial;
    if (jogo && jogo.z - g.position.z < 40 && andou < (g.userData.limite ?? 8)) {
      g.position.z += dt * 7;
      chefe.userData.pernaE.rotation.x = Math.sin(tempo * 12) * 0.7;
      chefe.userData.pernaD.rotation.x = -Math.sin(tempo * 12) * 0.7;
      chefe.rotation.x = 0.15; // inclinado para a frente, andando decidido
    } else {
      chefe.userData.pernaE.rotation.x = chefe.userData.pernaD.rotation.x = 0;
      chefe.rotation.x = 0;
    }
  };
  return g;
}

function criarReuniao() {
  const t = prepararTexturasFase2();
  const g = new THREE.Group();
  // com pessoas realistas (tamanho de gente), a mesa fica mais alta e as pessoas mais afastadas
  const realista = !!Modelos.prontos.isabella && Modelos.usarFigurantes;
  const alturaMesa = realista ? 0.75 : 0.55;
  const mesa = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.05, 18), new THREE.MeshLambertMaterial({ color: 0xd1d5db }));
  mesa.position.y = alturaMesa;
  const pe = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, alturaMesa, 8), new THREE.MeshLambertMaterial({ color: 0x475569 }));
  pe.position.y = alturaMesa / 2;
  g.add(mesa, pe);

  // 3 pessoas em volta da mesa, viradas para o centro
  const pessoas = [Math.PI / 6, (Math.PI * 5) / 6, (Math.PI * 3) / 2].map((a) => {
    const real = realista && Modelos.criarJa(null, 'conversar');
    if (real) {
      real.grupo.scale.setScalar(0.85);
      real.grupo.position.set(Math.sin(a) * 0.72, 0, Math.cos(a) * 0.72);
      real.grupo.rotation.y = a;
      g.add(real.grupo);
      return real.grupo;
    }
    const base = PERSONAGENS[Math.floor(Math.random() * PERSONAGENS.length)];
    const p = criarPersonagem(Object.assign({}, base, { camisa: Math.floor(Math.random() * 0xffffff) }), { mochila: false });
    p.scale.setScalar(0.62);
    p.position.set(Math.sin(a) * 0.62, 0, Math.cos(a) * 0.62);
    p.rotation.y = a;
    g.add(p);
    return p;
  });
  const balao = new THREE.Mesh(new THREE.PlaneGeometry(1.3, 0.48), new THREE.MeshBasicMaterial({ map: t.bla }));
  const alturaBalao = realista ? 2.0 : 1.85;
  balao.position.set(0, alturaBalao, 0.3);
  g.add(balao);

  // conversando (realista) ou gesticulando (blocos); o balão sobe e desce
  g.userData.animar = (tempo) => {
    pessoas.forEach((p, i) => {
      if (p.userData.real) p.userData.real.atualizarAte(tempo);
      else p.userData.bracoD.rotation.x = 0.8 + Math.sin(tempo * 6 + i * 2) * 0.5;
    });
    balao.position.y = alturaBalao + Math.sin(tempo * 3) * 0.06;
  };
  return g;
}

function criarPrazo() {
  const t = prepararTexturasFase2();
  const g = new THREE.Group();
  const papeis = caixa(1.0, 0.3, 0.6, 0xf8fafc);
  papeis.position.y = 0.15;
  const aviso = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.25), new THREE.MeshBasicMaterial({ map: t.prazo }));
  aviso.position.set(0, 0.15, 0.31);
  g.add(papeis, aviso);

  const relogio = new THREE.Group();
  relogio.position.y = 0.62;
  const aro = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.12, 24), new THREE.MeshLambertMaterial({ color: 0xdc2626 }));
  aro.rotation.x = Math.PI / 2;
  const mostrador = new THREE.Mesh(new THREE.CircleGeometry(0.26, 24), new THREE.MeshBasicMaterial({ map: t.relogio }));
  mostrador.position.z = 0.065;
  relogio.add(aro, mostrador);
  for (const x of [-0.2, 0.2]) {
    const sino = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 8), new THREE.MeshLambertMaterial({ color: 0xfacc15 }));
    sino.position.set(x, 0.3, 0);
    relogio.add(sino);
  }
  g.add(relogio);

  // despertador tremendo
  g.userData.animar = (tempo) => (relogio.rotation.z = Math.sin(tempo * 30) * 0.12);
  return g;
}

// Mesa alta com pilhas de documentos e pastas em cima. Por baixo fica um vão para deslizar.
function criarMesaDocumentos() {
  const t = prepararTexturasFase2();
  const g = new THREE.Group();
  const tampo = caixa(1.8, 0.1, 1.0, 0x8b5a2b);
  tampo.position.y = 1.3;
  g.add(tampo);
  for (const [x, z] of [[-0.82, -0.42], [0.82, -0.42], [-0.82, 0.42], [0.82, 0.42]]) {
    const perna = caixa(0.08, 1.25, 0.08, 0x5b3a1e);
    perna.position.set(x, 0.625, z);
    g.add(perna);
  }
  // pilhas de papel (um pouco tortas) e pastas coloridas
  [[-0.6, 0.55], [-0.15, 0.75], [0.3, 0.45], [0.65, 0.65]].forEach(([x, altura], i) => {
    const pilha = caixa(0.36, altura, 0.48, i % 2 ? 0xf8fafc : 0xfef9c3);
    pilha.position.set(x, 1.35 + altura / 2, -0.1 + (i % 2) * 0.15);
    pilha.rotation.y = (i - 1.5) * 0.12;
    g.add(pilha);
  });
  [0xdc2626, 0x2563eb, 0x16a34a].forEach((cor, i) => {
    const pasta = caixa(0.42, 0.06, 0.55, cor);
    pasta.position.set(-0.4 + i * 0.4, 1.38 + i * 0.07, 0.25);
    pasta.rotation.y = 0.2 - i * 0.2;
    g.add(pasta);
  });
  // aviso na frente da mesa
  const aviso = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.3), new THREE.MeshBasicMaterial({ map: t.abaixe }));
  aviso.position.set(0, 1.12, 0.51);
  g.add(aviso);
  return g;
}

function criarObstaculoFase2(tipo) {
  if (tipo === 'chefe') return criarChefe();
  if (tipo === 'reuniao') return criarReuniao();
  if (tipo === 'mesa') return criarMesaDocumentos();
  return criarPrazo();
}

// Cartão "Meta batida!": alvo com flecha no centro + nome da meta.
const texturasMeta = {};
function texturaMeta(nome) {
  if (texturasMeta[nome]) return texturasMeta[nome];
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 400;
  const ctx = c.getContext('2d');
  ['#dc2626', '#ffffff', '#dc2626', '#ffffff', '#dc2626'].forEach((cor, i) => {
    ctx.fillStyle = cor;
    ctx.beginPath(); ctx.arc(256, 130, 115 - i * 23, 0, Math.PI * 2); ctx.fill();
  });
  // flecha cravada no centro
  ctx.strokeStyle = '#78350f';
  ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(256, 130); ctx.lineTo(370, 30); ctx.stroke();
  ctx.fillStyle = '#16a34a';
  ctx.beginPath(); ctx.moveTo(370, 30); ctx.lineTo(395, 40); ctx.lineTo(385, 10); ctx.closePath(); ctx.fill();

  ctx.fillStyle = '#16a34a';
  retanguloArredondado(ctx, 30, 240, 452, 150, 26); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 54px Nunito, Arial, sans-serif';
  ctx.fillText('META BATIDA!', 256, 285);
  let tamanho = 44;
  do ctx.font = `900 ${(tamanho -= 2)}px Nunito, Arial, sans-serif`;
  while (ctx.measureText(nome).width > 410 && tamanho > 20);
  ctx.fillStyle = '#facc15';
  ctx.fillText(nome, 256, 345);

  const textura = new THREE.CanvasTexture(c);
  textura.anisotropy = 16;
  texturasMeta[nome] = textura;
  return textura;
}

function criarMeta(m) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 1.48),
    new THREE.MeshBasicMaterial({ map: texturaMeta(m.nome), transparent: true, alphaTest: 0.1, side: THREE.DoubleSide })
  ));
  return g;
}

// Tudo o que muda de uma fase para a outra fica aqui. São as "alavancas" de dificuldade:
//   vel        = [velocidade inicial, ganho por segundo, ganho por item pego, velocidade máxima]
//   chanceDois = chance de uma fileira ter 2 obstáculos (em vez de 1)
//   espaco     = [distância mínima entre fileiras, fator da velocidade] (menor = fileiras mais grudadas)
//   chanceItem = chance de aparecer um livro/meta na fileira
//   chanceCafe = chance de aparecer café (quando resta 1 vida)
//   invencivel = segundos piscando sem levar dano depois de bater
const FASES = {
  1: {
    meta: META_DISCIPLINAS, colecao: DISCIPLINAS, obstaculos: OBSTACULOS,
    criarObstaculo, criarColetavel: criarLivro, tema: 'faculdade', corFundo: 0xe6e1f0,
    unidade: 'disciplinas', titulo: '🎓 Progresso acadêmico', curso: 'CURSO DE ADMINISTRAÇÃO',
    vel: [9, 0.06, 0.5, 28], chanceDois: 0.35, espaco: [11, 0.9], chanceItem: 0.5, chanceCafe: 0.3, invencivel: 1.6,
  },
  2: {
    meta: META_FASE2, colecao: METAS, obstaculos: OBSTACULOS_FASE2,
    criarObstaculo: criarObstaculoFase2, criarColetavel: criarMeta, tema: 'empresa', corFundo: 0xe8eef5,
    unidade: 'metas', titulo: '🏆 Rumo à promoção', curso: 'ESTÁGIO EM ADMINISTRAÇÃO',
    vel: [17, 0.12, 0.75, 38], chanceDois: 0.65, espaco: [8, 0.7], chanceItem: 0.38, chanceCafe: 0.15, invencivel: 1.0,
  },
};
