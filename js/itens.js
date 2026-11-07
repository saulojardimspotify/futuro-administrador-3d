// Disciplinas (livros para pegar), obstáculos (para desviar) e a porta do auditório.

// Quantas disciplinas é preciso pegar para se formar (pode repetir).
const META_DISCIPLINAS = 25;

const DISCIPLINAS = [
  { nome: 'Marketing', professor: 'Lais' },
  { nome: 'Prod. Financeiros', professor: 'Chesil' },
  { nome: 'Valuation', professor: 'Saulo' },
  { nome: 'Mat. Financeira', professor: 'Saulo' },
  { nome: 'TGA', professor: 'Túlio' },
  { nome: 'Gestão de Pessoas', professor: 'Túlio' },
  { nome: 'Política', professor: 'Chesil' },
  { nome: 'Contabilidade', professor: 'Saulo' },
  { nome: 'Finanças', professor: 'Saulo' },
  { nome: 'Estágio', professor: 'Chesil' },
  { nome: 'TCC', professor: 'Lais' },
  { nome: 'Economia', professor: 'Saulo' },
  { nome: 'ESG e Compliance', professor: 'Frank' },
  { nome: 'Administração', professor: 'Túlio' },
  { nome: 'Direito', professor: 'Frank' },
  { nome: 'Empreendedorismo', professor: 'Túlio' },
  { nome: 'Matemática', professor: 'Terezinha' },
  { nome: 'Logística', professor: 'Lais' },
];

// Posição de cada professor na imagem das fotos (coluna, linha)
const POSICAO_PROFESSOR = {
  Chesil: [0, 0], Frank: [1, 0], Terezinha: [2, 0],
  Lais: [0, 1], Saulo: [1, 1], Túlio: [2, 1],
};

// Recorta as 6 fotos da imagem grande quando ela terminar de carregar.
const fotosProfessores = {};
const imagemFotos = new Image();
imagemFotos.onload = () => {
  const larguraCelula = imagemFotos.width / 3;
  const alturaCelula = imagemFotos.height / 2;
  const lado = alturaCelula * 0.8; // só a foto, sem a faixa do nome embaixo
  for (const [nome, [col, lin]] of Object.entries(POSICAO_PROFESSOR)) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    c.getContext('2d').drawImage(
      imagemFotos,
      col * larguraCelula + (larguraCelula - lado) / 2, lin * alturaCelula + 4, lado, lado,
      0, 0, 256, 256
    );
    fotosProfessores[nome] = c;
  }
};
imagemFotos.src = FOTO_PROFESSORES;

// alto = precisa desviar; baixo = dá para pular por cima
const OBSTACULOS = {
  reprovacao: { nome: 'Reprovação', alto: true },
  festa: { nome: 'Festa', alto: true },
  bebida: { nome: 'Bebida', alto: false, altura: 0.75 },
};

function retanguloArredondado(ctx, x, y, l, a, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + l, y, x + l, y + a, r);
  ctx.arcTo(x + l, y + a, x, y + a, r);
  ctx.arcTo(x, y + a, x, y, r);
  ctx.arcTo(x, y, x + l, y, r);
  ctx.closePath();
}

// Desenha o "cartão" da disciplina: foto do professor + livro com o nome grande.
const texturasDisciplina = {};
function texturaDisciplina(d) {
  const foto = fotosProfessores[d.professor];
  if (texturasDisciplina[d.nome] && foto) return texturasDisciplina[d.nome];

  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 400;
  const ctx = c.getContext('2d');

  // Raios amarelos
  ctx.strokeStyle = '#facc15';
  ctx.lineWidth = 12;
  ctx.lineCap = 'round';
  for (const [x1, y1, x2, y2] of [[110, 70, 135, 100], [95, 125, 135, 135], [402, 70, 377, 100], [417, 125, 377, 135]]) {
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }

  // Foto do professor num círculo com borda amarela
  ctx.fillStyle = '#facc15';
  ctx.beginPath(); ctx.arc(256, 125, 108, 0, Math.PI * 2); ctx.fill();
  ctx.save();
  ctx.beginPath(); ctx.arc(256, 125, 96, 0, Math.PI * 2); ctx.clip();
  ctx.fillStyle = '#93c5fd';
  ctx.fillRect(150, 20, 220, 220);
  if (foto) ctx.drawImage(foto, 160, 29, 192, 192);
  ctx.restore();

  // Livro verde por cima
  ctx.fillStyle = '#15803d';
  retanguloArredondado(ctx, 20, 200, 472, 180, 26); ctx.fill();
  ctx.fillStyle = '#fdf6e3';
  ctx.fillRect(40, 352, 432, 16);
  ctx.fillStyle = '#facc15';
  ctx.fillRect(28, 225, 22, 20);
  ctx.fillRect(28, 315, 22, 20);
  retanguloArredondado(ctx, 62, 214, 416, 128, 18); ctx.fill();
  ctx.fillStyle = '#fffbea';
  retanguloArredondado(ctx, 70, 222, 400, 112, 12); ctx.fill();

  // Nome da disciplina, o maior possível
  const palavras = d.nome.split(' ');
  let linhas = [d.nome];
  let tamanho = 64;
  const caber = () => {
    ctx.font = `900 ${tamanho}px Nunito, Arial, sans-serif`;
    return linhas.every((l) => ctx.measureText(l).width < 370) && linhas.length * tamanho * 1.05 < 104;
  };
  while (!caber() && tamanho > 30) tamanho -= 2;
  if (!caber() && palavras.length > 1) {
    const meio = Math.ceil(palavras.length / 2);
    linhas = [palavras.slice(0, meio).join(' '), palavras.slice(meio).join(' ')];
    tamanho = 52;
    while (!caber() && tamanho > 20) tamanho -= 2;
  }
  ctx.fillStyle = '#0f1f4d';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  linhas.forEach((l, i) => ctx.fillText(l, 270, 279 + (i - (linhas.length - 1) / 2) * tamanho * 1.02));

  const textura = new THREE.CanvasTexture(c);
  textura.anisotropy = 16;
  if (foto) texturasDisciplina[d.nome] = textura;
  return textura;
}

// O livro é um cartão "de papelão" (plano) sempre de frente para o jogador.
function criarLivro(d) {
  const g = new THREE.Group();
  const cartao = new THREE.Mesh(
    new THREE.PlaneGeometry(2.0, 1.56),
    new THREE.MeshBasicMaterial({ map: texturaDisciplina(d), transparent: true, alphaTest: 0.1, side: THREE.DoubleSide })
  );
  g.add(cartao);
  return g;
}

// As texturas das placas são criadas uma vez só e reaproveitadas.
let texturaReprovado = null;
let texturaFesta = null;
let texturaBebida = null;

// Atalho para cilindros (garrafas, latas, cabo da foice...)
function cilindro(raioTopo, raioBase, altura, cor, lados = 12) {
  return new THREE.Mesh(
    new THREE.CylinderGeometry(raioTopo, raioBase, altura, lados),
    new THREE.MeshLambertMaterial({ color: cor })
  );
}

// Xícara de café com pires e vapor: dá +1 vida.
function criarCafe() {
  const g = new THREE.Group();
  const xicara = new THREE.Group();
  const corpo = cilindro(0.28, 0.22, 0.42, 0xffffff, 18);
  const faixa = cilindro(0.285, 0.27, 0.08, 0xdc2626, 18);
  faixa.position.y = 0.08;
  const cafe = cilindro(0.25, 0.25, 0.02, 0x4a2c17, 18);
  cafe.position.y = 0.2;
  const alca = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.035, 8, 16), new THREE.MeshLambertMaterial({ color: 0xffffff }));
  alca.position.set(0.3, 0, 0);
  const pires = cilindro(0.42, 0.34, 0.05, 0xffffff, 20);
  pires.position.y = -0.23;
  xicara.add(corpo, faixa, cafe, alca, pires);
  xicara.scale.setScalar(2.1);
  // brilho dourado atrás, para chamar atenção
  const brilho = new THREE.Mesh(
    new THREE.RingGeometry(0.75, 0.92, 32),
    new THREE.MeshBasicMaterial({ color: 0xffd34d, transparent: true, opacity: 0.7, side: THREE.DoubleSide })
  );
  g.add(xicara, brilho);
  g.userData.brilho = brilho;

  // vapor: 3 bolinhas que sobem e somem
  g.userData.vapor = [-0.1, 0.05, 0.12].map((x) => {
    const v = new THREE.Mesh(
      new THREE.SphereGeometry(0.09, 8, 6),
      new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 })
    );
    v.position.x = x;
    g.add(v);
    return v;
  });
  return g;
}

// Anjo da Morte segurando a foice e a placa "REPROVAÇÃO". A frente dele aponta para +Z (para o jogador).
function criarAnjoDaMorte() {
  const g = new THREE.Group();
  const corManto = 0x1c1c22;

  const manto = cilindro(0.32, 0.78, 1.9, corManto, 10);
  manto.position.y = 0.95;
  g.add(manto);
  // barra rasgada do manto
  for (let i = 0; i < 10; i++) {
    const ang = (i / 10) * Math.PI * 2;
    const tira = caixa(0.22, 0.25 + (i % 3) * 0.08, 0.06, corManto);
    tira.position.set(Math.sin(ang) * 0.74, 0.08, Math.cos(ang) * 0.74);
    tira.rotation.y = ang;
    g.add(tira);
  }

  // Capuz com rosto escuro e olhos vermelhos
  const capuz = new THREE.Mesh(new THREE.SphereGeometry(0.36, 14, 12), new THREE.MeshLambertMaterial({ color: 0x15151a }));
  capuz.position.y = 2.05;
  capuz.scale.set(1, 1.15, 1);
  const rosto = new THREE.Mesh(new THREE.CircleGeometry(0.22, 16), new THREE.MeshBasicMaterial({ color: 0x000000 }));
  rosto.position.set(0, 2.0, 0.33);
  g.add(capuz, rosto);
  for (const x of [-0.08, 0.08]) {
    const olho = new THREE.Mesh(new THREE.SphereGeometry(0.035, 8, 8), new THREE.MeshBasicMaterial({ color: 0xff2a2a }));
    olho.position.set(x, 2.04, 0.36);
    g.add(olho);
  }

  // Braços (mangas largas) e mãos de esqueleto
  const braco = (lado) => {
    const manga = cilindro(0.1, 0.2, 0.75, corManto, 8);
    manga.position.set(lado * 0.48, 1.45, 0.15);
    manga.rotation.z = lado * 0.7;
    manga.rotation.x = 0.5;
    const mao = caixa(0.12, 0.16, 0.1, 0xd6d3d1);
    mao.position.set(lado * 0.72, 1.25, 0.38);
    g.add(manga, mao);
  };
  braco(-1);
  braco(1);

  // Foice na mão esquerda (do ponto de vista do jogador)
  const cabo = cilindro(0.03, 0.03, 2.8, 0x8b6b3d, 8);
  cabo.position.set(-0.75, 1.4, 0.38);
  cabo.rotation.z = 0.06;
  const lamina = new THREE.Mesh(
    new THREE.TorusGeometry(0.6, 0.045, 6, 18, Math.PI * 0.55),
    new THREE.MeshLambertMaterial({ color: 0x9ca3af })
  );
  lamina.position.set(-0.2, 2.45, 0.38);
  lamina.rotation.z = Math.PI * 0.42;
  g.add(cabo, lamina);

  // Placa "REPROVAÇÃO" na mão direita
  const placa = caixa(1.3, 0.62, 0.05, 0xffffff);
  placa.position.set(0.55, 1.15, 0.5);
  placa.rotation.z = -0.08;
  const texto = new THREE.Mesh(new THREE.PlaneGeometry(1.26, 0.58), new THREE.MeshBasicMaterial({ map: texturaReprovado }));
  texto.position.set(0.55, 1.15, 0.53);
  texto.rotation.z = -0.08;
  g.add(placa, texto);

  g.userData.flutua = true; // sobe e desce devagar
  return g;
}

function criarObstaculo(tipo) {
  if (!texturaReprovado) {
    texturaReprovado = criarTexturaTexto('REPROVAÇÃO', { largura: 512, altura: 230, cor: '#dc2626', borda: '#dc2626', tamanho: 110 });
    texturaFesta = criarTexturaTexto('FESTA!', { largura: 256, altura: 90, fundo: '#111827', cor: '#f0abfc' });
    texturaBebida = criarTexturaTexto('BEBIDA', { largura: 256, altura: 80, fundo: '#fef3c7', cor: '#92400e' });
  }
  const g = new THREE.Group();
  if (tipo === 'reprovacao') {
    return criarAnjoDaMorte();
  } else if (tipo === 'festa') {
    const som = caixa(0.95, 1.4, 0.7, 0x111827);
    som.position.y = 0.7;
    g.add(som);
    g.userData.altoFalantes = [];
    for (const [y, r] of [[1.0, 0.24], [0.45, 0.3]]) {
      const altoFalante = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.06, 20), new THREE.MeshLambertMaterial({ color: 0x4b5563 }));
      altoFalante.rotation.x = Math.PI / 2;
      altoFalante.position.set(0, y, 0.36);
      g.add(altoFalante);
      g.userData.altoFalantes.push(altoFalante);
    }
    // Dois bonecos dançando, um de cada lado da caixa de som
    g.userData.dancarinos = [-0.78, 0.78].map((x) => {
      const base = PERSONAGENS[Math.floor(Math.random() * PERSONAGENS.length)];
      const pessoa = criarPersonagem(Object.assign({}, base, { camisa: Math.floor(Math.random() * 0xffffff) }), { mochila: false });
      pessoa.scale.setScalar(0.62);
      pessoa.position.set(x, 0, 0.15);
      g.add(pessoa);
      return pessoa;
    });
    const coresBalao = [0xec4899, 0xfacc15, 0x22d3ee];
    coresBalao.forEach((cor, i) => {
      const x = (i - 1) * 0.35;
      const balao = new THREE.Mesh(new THREE.SphereGeometry(0.24, 14, 12), new THREE.MeshLambertMaterial({ color: cor }));
      balao.position.set(x, 2.15 + (i % 2) * 0.2, 0);
      const fio = caixa(0.015, 0.75, 0.015, 0xffffff);
      fio.position.set(x * 0.6, 1.65, 0);
      g.add(balao, fio);
    });
    const placa = new THREE.Mesh(
      new THREE.PlaneGeometry(0.85, 0.3),
      new THREE.MeshBasicMaterial({ map: texturaFesta })
    );
    placa.position.set(0, 1.28, 0.36);
    g.add(placa);
  } else {
    // bebida: engradado de madeira com garrafas de cerveja, latinhas e copos de festa (baixo, dá para pular)
    const engradado = caixa(1.3, 0.3, 0.6, 0xa16207);
    engradado.position.y = 0.15;
    const rotulo = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.2), new THREE.MeshBasicMaterial({ map: texturaBebida }));
    rotulo.position.set(0, 0.15, 0.31);
    g.add(engradado, rotulo);
    for (let i = 0; i < 4; i++) {
      const x = -0.45 + i * 0.3;
      const corpo = cilindro(0.09, 0.09, 0.3, 0x92400e); // vidro marrom
      corpo.position.set(x, 0.45, 0);
      const etiqueta = cilindro(0.093, 0.093, 0.11, 0xfefce8);
      etiqueta.position.set(x, 0.45, 0);
      const ombro = cilindro(0.035, 0.09, 0.08, 0x92400e);
      ombro.position.set(x, 0.64, 0);
      const gargalo = cilindro(0.035, 0.035, 0.12, 0x92400e, 8);
      gargalo.position.set(x, 0.74, 0);
      const tampinha = cilindro(0.045, 0.045, 0.03, 0xeab308, 8);
      tampinha.position.set(x, 0.81, 0);
      g.add(corpo, etiqueta, ombro, gargalo, tampinha);
    }
    // latinhas
    [[-0.55, 0xdc2626], [0.55, 0xd1d5db]].forEach(([x, cor]) => {
      const lata = cilindro(0.08, 0.08, 0.22, cor);
      lata.position.set(x, 0.11, 0.45);
      const topo = cilindro(0.075, 0.08, 0.02, 0xe5e7eb);
      topo.position.set(x, 0.23, 0.45);
      g.add(lata, topo);
    });
    // copos vermelhos com espuma
    for (const x of [-0.8, 0.8]) {
      const copo = cilindro(0.14, 0.1, 0.32, 0xdc2626);
      copo.position.set(x, 0.16, 0.3);
      const espuma = new THREE.Mesh(new THREE.SphereGeometry(0.13, 10, 8), new THREE.MeshLambertMaterial({ color: 0xfffbeb }));
      espuma.position.set(x, 0.33, 0.3);
      espuma.scale.y = 0.5;
      g.add(copo, espuma);
    }
  }
  return g;
}

class Itens {
  constructor(cena) {
    this.cena = cena;
    this.lista = [];
    this.porta = null;
    this.fase = 1;
    this.reiniciar();
  }

  reiniciar() {
    this.lista.forEach(descartar);
    this.lista = [];
    if (this.porta) descartar(this.porta);
    this.porta = null;
    this.proximoZ = -35;
    this.zUltimaFileira = undefined;
    this.coletadas = [];
    this.modoFinal = false;
  }

  // Disciplinas que podem aparecer (repetir é permitido, só não duas iguais na tela ao mesmo tempo).
  pendentes() {
    const naTela = this.lista.filter((i) => i.userData.tipo === 'livro').map((i) => i.userData.nome);
    return FASES[this.fase].colecao.filter((d) => !naTela.includes(d.nome));
  }

  adicionar(objeto, faixa, z, dados) {
    objeto.position.set(faixa * 2, 0, z);
    if (dados.tipo !== 'livro') objeto.traverse((o) => (o.castShadow = true));
    objeto.userData = Object.assign(objeto.userData, dados, { faixa });
    this.cena.add(objeto);
    this.lista.push(objeto);
  }

  // Cria uma "fileira": 1 ou 2 obstáculos e, às vezes, um livro numa faixa livre.
  // Se o jogador tem só 1 vida, às vezes aparece também uma xícara de café.
  gerarFileira(z, jogo) {
    const fase = FASES[this.fase];
    const faixas = [-1, 0, 1].sort(() => Math.random() - 0.5);
    const qtd = Math.random() < fase.chanceDois ? 2 : 1;
    const tipos = Object.keys(fase.obstaculos);
    // até onde um obstáculo que anda (o chefe) pode ir: para 2,5 m antes da fileira da frente
    const limite = this.zUltimaFileira === undefined ? 8 : this.zUltimaFileira - z - 2.5;
    this.zUltimaFileira = z;
    for (let i = 0; i < qtd; i++) {
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      this.adicionar(fase.criarObstaculo(tipo), faixas[i], z, Object.assign({ tipo: 'obstaculo', limite }, fase.obstaculos[tipo]));
    }
    const livres = faixas.slice(qtd);
    const pendentes = this.pendentes();
    if (pendentes.length && Math.random() < fase.chanceItem) {
      // fase 1: livro da disciplina; fase 2: meta batida (o tipo continua "livro" nas regras)
      const item = pendentes[Math.floor(Math.random() * pendentes.length)];
      this.adicionar(fase.criarColetavel(item), livres.shift(), z, { tipo: 'livro', nome: item.nome });
    }
    const temCafe = this.lista.some((i) => i.userData.tipo === 'cafe');
    if (jogo.vidas === 1 && livres.length && !temCafe && Math.random() < fase.chanceCafe) {
      this.adicionar(criarCafe(), livres[0], z, { tipo: 'cafe' });
    }
  }

  // Chamado a cada quadro. Devolve a lista do que o jogador pegou/bateu.
  atualizar(jogo, t) {
    while (!this.modoFinal && this.proximoZ > jogo.z - 120) {
      this.gerarFileira(this.proximoZ, jogo);
      const [minimo, fator] = FASES[this.fase].espaco;
      this.proximoZ -= Math.max(minimo, jogo.vel * fator);
    }

    const eventos = [];
    for (const item of [...this.lista]) {
      const d = item.userData;
      if (d.tipo === 'livro') {
        item.rotation.y = Math.sin(t * 2 + item.position.z) * 0.15;
        item.position.y = 1.35 + Math.sin(t * 3 + item.position.z) * 0.12;
      } else if (d.flutua) {
        item.position.y = 0.12 + Math.sin(t * 2 + item.position.z) * 0.1;
      } else if (d.dancarinos) {
        this.animarFesta(d, t);
      } else if (d.animar) {
        d.animar(t, jogo);
      } else if (d.tipo === 'cafe') {
        // o café só existe enquanto o jogador tem 1 vida
        if (jogo.vidas > 1) {
          this.remover(item);
          continue;
        }
        item.rotation.y = Math.sin(t * 1.5) * 0.6; // balança, sem dar as costas para o jogador
        item.position.y = 1.0 + Math.sin(t * 3 + item.position.z) * 0.12;
        d.brilho.scale.setScalar(1 + Math.sin(t * 5) * 0.08);
        d.vapor.forEach((v, i) => {
          const k = (t * 0.8 + i / 3) % 1; // sobe, some e recomeça
          v.position.y = 0.6 + k * 0.9;
          v.material.opacity = 0.7 * (1 - k);
        });
      }

      const dz = Math.abs(item.position.z - jogo.z);
      const dx = Math.abs(item.position.x - jogo.x);
      if (!d.usado && dz < 0.6) {
        if (d.tipo === 'cafe' && dx < 0.9) {
          eventos.push({ tipo: 'cafe' });
          this.remover(item);
          continue;
        }
        if (d.tipo === 'livro' && dx < 0.9) {
          this.coletadas.push(d.nome);
          eventos.push({ tipo: 'livro', nome: d.nome });
          this.remover(item);
          continue;
        }
        // mesa: só passa abaixado; os outros: alto = desviar, baixo = pular por cima
        const acertou = d.passarPorBaixo ? !(jogo.abaixado > 0) : d.alto || jogo.y < d.altura;
        if (d.tipo === 'obstaculo' && dx < 1.0 && acertou) {
          d.usado = true;
          eventos.push({ tipo: 'obstaculo', nome: d.nome });
        }
      }
      if (item.position.z > jogo.z + 8) this.remover(item);
    }
    return eventos;
  }

  // Dança: pulinhos no ritmo, corpo balançando e braços para cima alternados.
  animarFesta(d, t) {
    d.dancarinos.forEach((p, i) => {
      const f = t * 8 + i * Math.PI;
      const membros = p.userData;
      p.position.y = Math.abs(Math.sin(f)) * 0.12;
      p.rotation.y = Math.PI + (i ? -0.4 : 0.4) + Math.sin(t * 3) * 0.3; // de frente para o jogador
      membros.bracoE.rotation.x = Math.PI * (0.6 + 0.4 * Math.sin(f));
      membros.bracoD.rotation.x = Math.PI * (0.6 - 0.4 * Math.sin(f));
      membros.pernaE.rotation.x = Math.sin(f) * 0.3;
      membros.pernaD.rotation.x = -Math.sin(f) * 0.3;
    });
    const pulso = 1 + Math.abs(Math.sin(t * 16)) * 0.12;
    d.altoFalantes.forEach((a) => a.scale.set(pulso, 1, pulso));
  }

  remover(item) {
    this.lista.splice(this.lista.indexOf(item), 1);
    descartar(item);
  }

  // Todas as disciplinas pegas: coloca a porta do auditório lá na frente.
  criarPorta(zJogador) {
    this.modoFinal = true;
    const zPorta = zJogador - 90;
    // tira os livros que sobraram e os obstáculos perto da porta
    for (const item of [...this.lista]) {
      if (['livro', 'cafe'].includes(item.userData.tipo) || item.position.z < zPorta + 25) this.remover(item);
    }

    const g = new THREE.Group();
    const corParede = 0xf3ead8;
    const esq = caixa(2.6, ALTURA_CORREDOR, 0.3, corParede);
    esq.position.set(-2.7, ALTURA_CORREDOR / 2, 0);
    const dir = esq.clone();
    dir.position.x = 2.7;
    const topo = caixa(2.8, 1.2, 0.3, corParede);
    topo.position.set(0, 3.6, 0);
    g.add(esq, dir, topo);

    const moldura = caixa(3.0, 3.15, 0.25, 0xd4a017);
    moldura.position.set(0, 1.5, -0.05);
    const luzAlem = new THREE.Mesh(new THREE.PlaneGeometry(2.8, 3.0), new THREE.MeshBasicMaterial({ color: 0xfff4c2 }));
    luzAlem.position.set(0, 1.5, -0.6);
    g.add(moldura, luzAlem);

    // Duas folhas de porta, cada uma girando na sua dobradiça
    const criarFolha = (lado) => {
      const pivo = new THREE.Group();
      pivo.position.set(lado * 1.4, 0, 0.12);
      const folha = caixa(1.4, 3.0, 0.1, 0x7c4a1e);
      folha.position.set(-lado * 0.7, 1.5, 0);
      const puxador = caixa(0.06, 0.5, 0.08, 0xd4a017);
      puxador.position.set(-lado * 1.25, 1.5, 0.08);
      pivo.add(folha, puxador);
      g.add(pivo);
      return pivo;
    };
    g.userData.folhaE = criarFolha(-1);
    g.userData.folhaD = criarFolha(1);

    const placa = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 0.75),
      new THREE.MeshBasicMaterial({ map: criarTexturaTexto('🎓 AUDITÓRIO', { largura: 640, altura: 150, fundo: '#1e3a8a', cor: '#facc15' }) })
    );
    placa.position.set(0, 3.6, 0.17);
    g.add(placa);

    const tapete = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 30), new THREE.MeshLambertMaterial({ color: 0xb91c1c }));
    tapete.rotation.x = -Math.PI / 2;
    tapete.position.set(0, 0.015, 15);
    g.add(tapete);

    g.position.z = zPorta;
    this.cena.add(g);
    this.porta = g;
    return zPorta;
  }

  // aberta: 0 = fechada, 1 = totalmente aberta
  abrirPorta(aberta) {
    if (!this.porta) return;
    this.porta.userData.folhaE.rotation.y = aberta * 1.6;
    this.porta.userData.folhaD.rotation.y = -aberta * 1.6;
  }
}
