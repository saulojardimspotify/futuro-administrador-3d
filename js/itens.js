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
  bebida: { nome: 'Bebida', alto: false, altura: 0.65 },
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
  textura.anisotropy = 8;
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

function criarObstaculo(tipo) {
  if (!texturaReprovado) {
    texturaReprovado = criarTexturaTexto(['F', 'REPROVADO'], { largura: 384, altura: 280, cor: '#dc2626', borda: '#dc2626', tamanho: 120 });
    texturaFesta = criarTexturaTexto('FESTA!', { largura: 256, altura: 90, fundo: '#111827', cor: '#f0abfc' });
  }
  const g = new THREE.Group();
  if (tipo === 'reprovacao') {
    for (const x of [-0.55, 0.55]) {
      const poste = caixa(0.08, 1.4, 0.08, 0x6b7280);
      poste.position.set(x, 0.7, 0);
      g.add(poste);
    }
    const placa = caixa(1.5, 1.1, 0.08, 0xffffff);
    placa.position.y = 1.5;
    const texto = new THREE.Mesh(
      new THREE.PlaneGeometry(1.44, 1.04),
      new THREE.MeshBasicMaterial({ map: texturaReprovado })
    );
    texto.position.set(0, 1.5, 0.045);
    g.add(placa, texto);
  } else if (tipo === 'festa') {
    const som = caixa(0.95, 1.4, 0.7, 0x111827);
    som.position.y = 0.7;
    g.add(som);
    for (const [y, r] of [[1.0, 0.24], [0.45, 0.3]]) {
      const altoFalante = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.06, 20), new THREE.MeshLambertMaterial({ color: 0x4b5563 }));
      altoFalante.rotation.x = Math.PI / 2;
      altoFalante.position.set(0, y, 0.36);
      g.add(altoFalante);
    }
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
    // bebida: engradado com garrafas e copos (baixo, dá para pular)
    const engradado = caixa(1.3, 0.3, 0.6, 0xf59e0b);
    engradado.position.y = 0.15;
    g.add(engradado);
    for (let i = 0; i < 4; i++) {
      const garrafa = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.26, 10), new THREE.MeshLambertMaterial({ color: 0x166534 }));
      garrafa.position.set(-0.45 + i * 0.3, 0.43, 0);
      const gargalo = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.05, 0.12, 8), new THREE.MeshLambertMaterial({ color: 0x166534 }));
      gargalo.position.set(-0.45 + i * 0.3, 0.62, 0);
      g.add(garrafa, gargalo);
    }
    for (const x of [-0.75, 0.75]) {
      const copo = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.09, 0.3, 12), new THREE.MeshLambertMaterial({ color: 0xdc2626 }));
      copo.position.set(x, 0.15, 0.35);
      g.add(copo);
    }
  }
  return g;
}

class Itens {
  constructor(cena) {
    this.cena = cena;
    this.lista = [];
    this.porta = null;
    this.reiniciar();
  }

  reiniciar() {
    this.lista.forEach(descartar);
    this.lista = [];
    if (this.porta) descartar(this.porta);
    this.porta = null;
    this.proximoZ = -35;
    this.coletadas = [];
    this.modoFinal = false;
  }

  // Disciplinas que podem aparecer (repetir é permitido, só não duas iguais na tela ao mesmo tempo).
  pendentes() {
    const naTela = this.lista.filter((i) => i.userData.tipo === 'livro').map((i) => i.userData.nome);
    return DISCIPLINAS.filter((d) => !naTela.includes(d.nome));
  }

  adicionar(objeto, faixa, z, dados) {
    objeto.position.set(faixa * 2, 0, z);
    if (dados.tipo !== 'livro') objeto.traverse((o) => (o.castShadow = true));
    objeto.userData = Object.assign(objeto.userData, dados, { faixa });
    this.cena.add(objeto);
    this.lista.push(objeto);
  }

  // Cria uma "fileira": 1 ou 2 obstáculos e, às vezes, um livro numa faixa livre.
  gerarFileira(z) {
    const faixas = [-1, 0, 1].sort(() => Math.random() - 0.5);
    const qtd = Math.random() < 0.35 ? 2 : 1;
    const tipos = Object.keys(OBSTACULOS);
    for (let i = 0; i < qtd; i++) {
      const tipo = tipos[Math.floor(Math.random() * tipos.length)];
      this.adicionar(criarObstaculo(tipo), faixas[i], z, Object.assign({ tipo: 'obstaculo' }, OBSTACULOS[tipo]));
    }
    const pendentes = this.pendentes();
    if (pendentes.length && Math.random() < 0.5) {
      const disciplina = pendentes[Math.floor(Math.random() * pendentes.length)];
      const livro = criarLivro(disciplina);
      this.adicionar(livro, faixas[qtd], z, { tipo: 'livro', nome: disciplina.nome });
    }
  }

  // Chamado a cada quadro. Devolve a lista do que o jogador pegou/bateu.
  atualizar(jogo, t) {
    while (!this.modoFinal && this.proximoZ > jogo.z - 120) {
      this.gerarFileira(this.proximoZ);
      this.proximoZ -= Math.max(11, jogo.vel * 0.9);
    }

    const eventos = [];
    for (const item of [...this.lista]) {
      const d = item.userData;
      if (d.tipo === 'livro') {
        item.rotation.y = Math.sin(t * 2 + item.position.z) * 0.15;
        item.position.y = 1.35 + Math.sin(t * 3 + item.position.z) * 0.12;
      }

      const dz = Math.abs(item.position.z - jogo.z);
      const dx = Math.abs(item.position.x - jogo.x);
      if (!d.usado && dz < 0.6) {
        if (d.tipo === 'livro' && dx < 0.9) {
          this.coletadas.push(d.nome);
          eventos.push({ tipo: 'livro', nome: d.nome });
          this.remover(item);
          continue;
        }
        if (d.tipo === 'obstaculo' && dx < 1.0 && (d.alto || jogo.y < d.altura)) {
          d.usado = true;
          eventos.push({ tipo: 'obstaculo', nome: d.nome });
        }
      }
      if (item.position.z > jogo.z + 8) this.remover(item);
    }
    return eventos;
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
      if (item.userData.tipo === 'livro' || item.position.z < zPorta + 25) this.remover(item);
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
