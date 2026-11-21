// Fase 3: Gerente — a crise na empresa.
// Andar da diretoria com janelões para a cidade (o dia passa: manhã → pôr do sol → noite),
// caixa da empresa, combo, poderes, portões de decisão e, no fim, a reunião com o conselho.

const META_FASE3 = 30;

const SOLUCOES = [
  'Corte de custos', 'Novo cliente', 'Inovação', 'Equipe motivada', 'Parceria nova',
  'Processo enxuto', 'Marketing digital', 'Fluxo de caixa', 'Produto novo', 'Cliente fiel',
  'Treinamento', 'Plano estratégico',
].map((nome) => ({ nome }));

// alto = desviar; baixo = pular; passarPorBaixo = abaixar
const OBSTACULOS_FASE3 = {
  grafico: { nome: 'Gráfico em queda', alto: true },
  emails: { nome: 'E-mails acumulados', alto: false, altura: 0.85 },
  incendio: { nome: 'Incêndio para apagar', alto: true },
  cliente: { nome: 'Cliente insatisfeito', alto: true },
  impressora: { nome: 'Impressora travada', passarPorBaixo: true },
};

// Perguntas de gestão: usadas nos portões do corredor e na reunião com o conselho.
// "certa" é o índice da resposta correta.
const PERGUNTAS = [
  { p: 'As vendas caíram 20%. O que fazer primeiro?', r: ['Analisar o mercado', 'Demitir todos', 'Ignorar a queda'], certa: 0 },
  { p: 'A equipe está desmotivada. Melhor atitude?', r: ['Ouvir e reconhecer', 'Cobrar mais horas', 'Cortar salários'], certa: 0 },
  { p: 'Os 4 Ps do Marketing são Produto, Preço, Praça e...', r: ['Promoção', 'Pessoas', 'Processos'], certa: 0 },
  { p: 'Quem é considerado o "pai" da Administração Científica?', r: ['Taylor', 'Fayol', 'Maslow'], certa: 0 },
  { p: 'Na pirâmide de Maslow, qual necessidade fica na base?', r: ['Fisiológicas', 'Autorrealização', 'Estima'], certa: 0 },
  { p: 'Análise que avalia Forças, Fraquezas, Oportunidades e Ameaças:', r: ['SWOT', 'PDCA', 'BCG'], certa: 0 },
  { p: 'O que significa PDCA?', r: ['Planejar, Fazer, Checar, Agir', 'Produzir, Doar, Comprar, Avaliar', 'Pagar, Dever, Cobrar, Atrasar'], certa: 0 },
  { p: 'Para saber se um investimento vale a pena, usamos:', r: ['VPL', 'IPTU', 'CLT'], certa: 0 },
  { p: 'O que é capital de giro?', r: ['Dinheiro para a operação do dia a dia', 'Dinheiro dos sócios', 'Lucro do ano'], certa: 0 },
  { p: 'Receita menos todos os custos e despesas é o:', r: ['Lucro', 'Faturamento', 'Patrimônio'], certa: 0 },
  { p: 'Um cliente reclamou nas redes sociais. O que fazer?', r: ['Responder rápido e resolver', 'Apagar o comentário', 'Ignorar'], certa: 0 },
  { p: 'ESG significa Ambiental, Social e...', r: ['Governança', 'Gestão', 'Garantia'], certa: 0 },
  { p: 'Estoque que gira devagar demais significa:', r: ['Dinheiro parado', 'Lucro garantido', 'Venda certa'], certa: 0 },
  { p: 'Na matriz BCG, o produto que dá muito lucro e cresce pouco é a:', r: ['Vaca leiteira', 'Estrela', 'Interrogação'], certa: 0 },
  { p: 'Fayol definiu as funções administrativas: planejar, organizar, comandar, coordenar e...', r: ['Controlar', 'Comprar', 'Contratar'], certa: 0 },
  { p: 'Um bom líder, diante de um erro da equipe:', r: ['Busca a causa e ensina', 'Procura um culpado', 'Finge que não viu'], certa: 0 },
  { p: 'Ponto de equilíbrio é quando a empresa:', r: ['Não tem lucro nem prejuízo', 'Tem lucro máximo', 'Fecha as portas'], certa: 0 },
  { p: 'Just in Time é uma técnica de:', r: ['Logística e estoques', 'Recrutamento', 'Publicidade'], certa: 0 },
  { p: 'Missão, visão e valores fazem parte do:', r: ['Planejamento estratégico', 'Balanço patrimonial', 'Folha de pagamento'], certa: 0 },
  { p: 'Antes de abrir um negócio, o empreendedor deve fazer um:', r: ['Plano de negócios', 'Empréstimo alto', 'Festa de inauguração'], certa: 0 },
];

// Sorteia uma pergunta ainda não usada nesta partida, com as respostas embaralhadas
function sortearPergunta(usadas) {
  const livres = PERGUNTAS.map((_, i) => i).filter((i) => !usadas.includes(i));
  const indice = (livres.length ? livres : PERGUNTAS.map((_, i) => i))[Math.floor(Math.random() * (livres.length || PERGUNTAS.length))];
  usadas.push(indice);
  const q = PERGUNTAS[indice];
  const ordem = [0, 1, 2].sort(() => Math.random() - 0.5);
  return { pergunta: q.p, respostas: ordem.map((i) => q.r[i]), certa: ordem.indexOf(q.certa) };
}

// ---------- A cidade vista dos janelões (desenhada no código) ----------
// "noite = true" desenha os prédios escuros com as janelas acesas.
// O céu fica transparente: quem pinta o céu é a cor de fundo da cena (que muda com o dia).
const texturasCidade = {};
function texturaCidade(noite) {
  const chave = noite ? 'noite' : 'dia';
  if (texturasCidade[chave]) return texturasCidade[chave];
  const c = document.createElement('canvas');
  c.width = 1024;
  c.height = 512;
  const ctx = c.getContext('2d');
  let semente = 7; // aleatório repetível: o desenho do dia e da noite é a mesma cidade
  const aleatorio = () => ((semente = (semente * 9301 + 49297) % 233280) / 233280);
  for (let camada = 0; camada < 3; camada++) {
    const longe = camada === 0;
    let x = -20;
    while (x < 1024) {
      const largura = 40 + aleatorio() * 90;
      const altura = (longe ? 180 : 120) + aleatorio() * (longe ? 260 : 300) - camada * 30;
      const topo = 512 - altura;
      const tom = noite ? 12 + camada * 8 : 120 + camada * 25 - (longe ? 30 : 0);
      ctx.fillStyle = noite ? `rgb(${tom},${tom + 4},${tom + 18})` : `rgb(${tom - 20},${tom},${tom + 25})`;
      ctx.fillRect(x, topo, largura, altura);
      // janelas: reflexo claro de dia, luzes amarelas de noite
      for (let jy = topo + 10; jy < 500; jy += 14) {
        for (let jx = x + 6; jx < x + largura - 8; jx += 12) {
          const acesa = aleatorio();
          if (noite) {
            if (acesa < 0.45) continue;
            ctx.fillStyle = acesa > 0.9 ? '#fff4c4' : '#ffc94d';
          } else {
            ctx.fillStyle = acesa > 0.7 ? 'rgba(220,235,255,0.75)' : 'rgba(80,110,150,0.5)';
          }
          ctx.fillRect(jx, jy, 6, 8);
        }
      }
      x += largura + 4 + aleatorio() * 18;
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = THREE.RepeatWrapping;
  t.anisotropy = 8;
  texturasCidade[chave] = t;
  return t;
}

// Gráfico animado nas TVs da diretoria (uma textura só, redesenhada a cada meio segundo)
let telaGrafico = null;
function texturaTelaGrafico() {
  if (telaGrafico) return telaGrafico.textura;
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 144;
  telaGrafico = { c, ctx: c.getContext('2d'), textura: new THREE.CanvasTexture(c), ultimo: -1 };
  desenharTelaGrafico(0);
  return telaGrafico.textura;
}
function desenharTelaGrafico(t) {
  if (!telaGrafico || Math.floor(t * 2) === telaGrafico.ultimo) return;
  telaGrafico.ultimo = Math.floor(t * 2);
  const { ctx } = telaGrafico;
  ctx.fillStyle = '#0b1530';
  ctx.fillRect(0, 0, 256, 144);
  ctx.strokeStyle = '#1e3a8a';
  ctx.lineWidth = 1;
  for (let y = 20; y < 144; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(256, y); ctx.stroke(); }
  ctx.lineWidth = 4;
  ctx.strokeStyle = telaGrafico.ultimo % 6 < 3 ? '#ef4444' : '#22c55e';
  ctx.beginPath();
  for (let i = 0; i <= 16; i++) {
    const x = 10 + i * 15;
    const y = 72 + Math.sin(i * 0.9 + t * 2) * 30 + (telaGrafico.ultimo % 6 < 3 ? i * 2.5 : -i * 2.5);
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.stroke();
  ctx.fillStyle = '#facc15';
  ctx.font = '900 20px Nunito, Arial';
  ctx.fillText(telaGrafico.ultimo % 6 < 3 ? 'AÇÕES ▼ 12%' : 'AÇÕES ▲ 8%', 12, 26);
  telaGrafico.textura.needsUpdate = true;
}

// ---------- Obstáculos ----------
let texturasFase3 = null;
function prepararTexturasFase3() {
  if (texturasFase3) return texturasFase3;
  texturasFase3 = {
    queda: criarTexturaTexto('VENDAS ▼', { largura: 384, altura: 110, fundo: '#ffffff', cor: '#dc2626', borda: '#dc2626' }),
    emails: criarTexturaTexto('999+ E-MAILS', { largura: 384, altura: 100, fundo: '#1e3a8a', cor: '#ffffff' }),
    cliente: criarTexturaTexto(['Quero falar', 'com o gerente!'], { largura: 384, altura: 170, fundo: '#ffffff', cor: '#b91c1c', borda: '#b91c1c' }),
    papel: criarTexturaTexto('PAPEL ATOLADO', { largura: 384, altura: 90, fundo: '#facc15', cor: '#111827' }),
  };
  return texturasFase3;
}

const materialFisico = (cor, extra) => new THREE.MeshStandardMaterial(Object.assign({ color: cor, roughness: 0.6 }, extra));

// Seta vermelha gigante apontando para baixo, num quadro de gráfico
function criarGraficoQueda() {
  const t = prepararTexturasFase3();
  const g = new THREE.Group();
  const quadro = caixa(1.5, 1.1, 0.08, 0xf8fafc);
  quadro.position.set(0, 1.25, -0.1);
  g.add(quadro);
  [0.7, 0.55, 0.35, 0.2].forEach((h, i) => {
    const barra = caixa(0.22, h, 0.04, 0x60a5fa);
    barra.position.set(-0.5 + i * 0.33, 0.75 + h / 2, -0.04);
    g.add(barra);
  });
  for (const x of [-0.6, 0.6]) {
    const pe = caixa(0.07, 0.7, 0.07, 0x334155);
    pe.position.set(x, 0.35, -0.1);
    g.add(pe);
  }
  const seta = new THREE.Group();
  const haste = new THREE.Mesh(new THREE.BoxGeometry(0.22, 1.3, 0.18), materialFisico(0xdc2626, { emissive: 0x4d0000 }));
  haste.position.y = 0.35;
  const ponta = new THREE.Mesh(new THREE.ConeGeometry(0.38, 0.6, 4), materialFisico(0xdc2626, { emissive: 0x4d0000 }));
  ponta.rotation.x = Math.PI; // aponta para baixo
  ponta.position.y = -0.5;
  seta.add(haste, ponta);
  seta.rotation.z = -0.6;
  seta.position.set(0.1, 1.6, 0.2);
  g.add(seta);
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 0.29), new THREE.MeshBasicMaterial({ map: t.queda }));
  placa.position.set(0, 2.05, -0.05);
  g.add(placa);
  g.userData.animar = (tempo) => (seta.position.y = 1.6 - Math.abs(Math.sin(tempo * 3)) * 0.35);
  return g;
}

// Pilha de envelopes (baixa: dá para pular)
function criarEmails() {
  const t = prepararTexturasFase3();
  const g = new THREE.Group();
  for (let i = 0; i < 9; i++) {
    const env = caixa(0.55, 0.08, 0.4, i % 3 === 0 ? 0xfef3c7 : 0xffffff);
    env.position.set(-0.45 + (i % 3) * 0.45, 0.04 + Math.floor(i / 3) * 0.09, (i % 2) * 0.08);
    env.rotation.y = (i * 0.37) % 0.5 - 0.25;
    g.add(env);
  }
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.3), new THREE.MeshBasicMaterial({ map: t.emails }));
  placa.position.set(0, 0.55, 0.25);
  g.add(placa);
  g.userData.animar = (tempo) => (placa.position.y = 0.55 + Math.sin(tempo * 5) * 0.05);
  return g;
}

// Lixeira pegando fogo, com chamas tremendo e fumaça subindo
function criarIncendio() {
  const g = new THREE.Group();
  const lata = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.33, 0.75, 16), materialFisico(0x6b7280, { metalness: 0.6, roughness: 0.4 }));
  lata.position.y = 0.375;
  g.add(lata);
  const chamas = [0xf97316, 0xfacc15, 0xef4444, 0xfb923c].map((cor, i) => {
    const ch = new THREE.Mesh(new THREE.ConeGeometry(0.22 - i * 0.03, 0.9 - i * 0.12, 8), new THREE.MeshBasicMaterial({ color: cor }));
    ch.position.set((i - 1.5) * 0.14, 1.15, (i % 2) * 0.1 - 0.05);
    g.add(ch);
    return ch;
  });
  const fumaca = [0, 1, 2].map(() => {
    const f = new THREE.Mesh(new THREE.SphereGeometry(0.25, 10, 8), new THREE.MeshBasicMaterial({ color: 0x9ca3af, transparent: true, opacity: 0.5 }));
    g.add(f);
    return f;
  });
  g.userData.animar = (tempo) => {
    chamas.forEach((ch, i) => (ch.scale.y = 0.8 + Math.abs(Math.sin(tempo * 12 + i)) * 0.5));
    fumaca.forEach((f, i) => {
      const k = (tempo * 0.6 + i / 3) % 1;
      f.position.set(Math.sin(tempo + i) * 0.2, 1.5 + k * 1.2, 0);
      f.scale.setScalar(0.8 + k);
      f.material.opacity = 0.5 * (1 - k);
    });
  };
  return g;
}

// Cliente insatisfeito: realista gritando (vem na direção do jogador, como o chefe)
function criarCliente() {
  const t = prepararTexturasFase3();
  const g = new THREE.Group();
  const real = Modelos.criarJa('cliente', 'gritar');
  let pessoa;
  if (real) {
    pessoa = real.grupo;
    pessoa.rotation.y = Math.PI;
  } else {
    pessoa = bonecoDeFrente({ pele: 0xf1c9a5, cabelo: 0x3b2a1e, longo: false, camisa: 0xffffff, calca: 0x1e3a8a }, 1);
    const rosto = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.42), new THREE.MeshLambertMaterial({ map: rostoBravo() }));
    rosto.position.set(0, -0.04, -0.295);
    rosto.rotation.y = Math.PI;
    pessoa.userData.cabeca.add(rosto);
  }
  g.add(pessoa);
  const balao = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.62), new THREE.MeshBasicMaterial({ map: t.cliente }));
  balao.position.set(0, real ? 2.3 : 2.7, 0.3);
  g.add(balao);

  let zInicial = null;
  g.userData.animar = (tempo, jogo) => {
    if (zInicial === null) zInicial = g.position.z;
    balao.position.y = (real ? 2.3 : 2.7) + Math.sin(tempo * 4) * 0.05;
    const andou = g.position.z - zInicial;
    const perto = jogo && jogo.z - g.position.z < 40 && andou < (g.userData.limite ?? 8);
    if (real) {
      const dt = real.ultimoT === undefined ? 0 : Math.min(0.1, tempo - real.ultimoT);
      if (perto) {
        g.position.z += dt * 6;
        real.tocar('andar', 0.2);
        real.velocidade(1.7);
      } else real.tocar('gritar', 0.2);
      real.atualizarAte(tempo);
    } else if (perto) {
      g.position.z += 0.1;
      pessoa.userData.pernaE.rotation.x = Math.sin(tempo * 12) * 0.7;
      pessoa.userData.pernaD.rotation.x = -Math.sin(tempo * 12) * 0.7;
    }
  };
  return g;
}

// Impressora travada no alto, com papel pendurado: só passa abaixando
function criarImpressora() {
  const t = prepararTexturasFase3();
  const t2 = prepararTexturasFase2();
  const g = new THREE.Group();
  for (const x of [-0.85, 0.85]) {
    const poste = caixa(0.1, 1.9, 0.1, 0x334155);
    poste.position.set(x, 0.95, 0);
    g.add(poste);
  }
  const prateleira = caixa(1.9, 0.08, 0.6, 0x475569);
  prateleira.position.y = 1.9;
  const impressora = caixa(0.9, 0.45, 0.55, 0xe5e7eb);
  impressora.position.y = 2.17;
  const luz = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.08, 0.02), new THREE.MeshBasicMaterial({ color: 0xef4444 }));
  luz.position.set(0.32, 2.25, 0.28);
  g.add(prateleira, impressora, luz);
  // papel saindo e pendurado (a faixa que obriga a abaixar)
  const folhas = [];
  for (let i = 0; i < 6; i++) {
    const folha = caixa(0.28, 0.6, 0.01, 0xffffff);
    folha.position.set(-0.75 + i * 0.3, 1.55, 0.1);
    folhas.push(folha);
    g.add(folha);
  }
  const aviso = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 0.3), new THREE.MeshBasicMaterial({ map: t2.abaixe }));
  aviso.position.set(0, 1.12, 0.12);
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.28), new THREE.MeshBasicMaterial({ map: t.papel }));
  placa.position.set(0, 2.6, 0.1);
  g.add(aviso, placa);
  g.userData.animar = (tempo) => {
    luz.visible = Math.floor(tempo * 4) % 2 === 0; // luz vermelha piscando
    folhas.forEach((f, i) => (f.rotation.x = Math.sin(tempo * 4 + i) * 0.15));
  };
  return g;
}

function criarObstaculoFase3(tipo) {
  if (tipo === 'grafico') return criarGraficoQueda();
  if (tipo === 'emails') return criarEmails();
  if (tipo === 'incendio') return criarIncendio();
  if (tipo === 'cliente') return criarCliente();
  return criarImpressora();
}

// ---------- Soluções (o que o gerente coleta) ----------
const texturasSolucao = {};
function texturaSolucao(nome) {
  if (texturasSolucao[nome]) return texturasSolucao[nome];
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 400;
  const ctx = c.getContext('2d');
  // lâmpada acesa (ideia!)
  const brilho = ctx.createRadialGradient(256, 120, 20, 256, 120, 120);
  brilho.addColorStop(0, 'rgba(255, 240, 150, 0.95)');
  brilho.addColorStop(1, 'rgba(255, 240, 150, 0)');
  ctx.fillStyle = brilho;
  ctx.fillRect(130, 0, 252, 240);
  ctx.fillStyle = '#facc15';
  ctx.beginPath(); ctx.arc(256, 115, 70, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#94a3b8';
  ctx.fillRect(226, 180, 60, 40);
  ctx.fillStyle = '#64748b';
  for (let i = 0; i < 3; i++) ctx.fillRect(226, 186 + i * 11, 60, 4);
  ctx.fillStyle = '#7c3aed';
  retanguloArredondado(ctx, 30, 240, 452, 150, 26); ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = '900 56px Nunito, Arial, sans-serif';
  ctx.fillText('SOLUÇÃO!', 256, 285);
  let tamanho = 46;
  do ctx.font = `900 ${(tamanho -= 2)}px Nunito, Arial, sans-serif`;
  while (ctx.measureText(nome).width > 410 && tamanho > 20);
  ctx.fillStyle = '#fde68a';
  ctx.fillText(nome, 256, 345);
  const textura = new THREE.CanvasTexture(c);
  textura.anisotropy = 16;
  texturasSolucao[nome] = textura;
  return textura;
}

function criarSolucao(s) {
  const g = new THREE.Group();
  g.add(new THREE.Mesh(
    new THREE.PlaneGeometry(1.9, 1.48),
    new THREE.MeshBasicMaterial({ map: texturaSolucao(s.nome), transparent: true, alphaTest: 0.05, side: THREE.DoubleSide })
  ));
  return g;
}

// ---------- Poderes ----------
const PODERES = {
  foco: { nome: 'Foco total', icone: '⏳', cor: '#0ea5e9', explica: 'tempo em câmera lenta' },
  equipe: { nome: 'Equipe', icone: '🤝', cor: '#22c55e', explica: 'aguenta uma batida' },
  ima: { nome: 'Reunião produtiva', icone: '🧲', cor: '#ef4444', explica: 'puxa as soluções' },
};

const texturasPoder = {};
function criarPoder(tipo) {
  const p = PODERES[tipo];
  if (!texturasPoder[tipo]) {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const ctx = c.getContext('2d');
    ctx.fillStyle = p.cor;
    ctx.beginPath(); ctx.arc(128, 128, 120, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 10;
    ctx.stroke();
    ctx.font = '110px Segoe UI Emoji, Apple Color Emoji, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(p.icone, 128, 112);
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 30px Nunito, Arial';
    ctx.fillText(p.nome.toUpperCase().slice(0, 14), 128, 205);
    texturasPoder[tipo] = new THREE.CanvasTexture(c);
  }
  const g = new THREE.Group();
  const disco = new THREE.Mesh(new THREE.CircleGeometry(0.6, 32), new THREE.MeshBasicMaterial({ map: texturasPoder[tipo], transparent: true, side: THREE.DoubleSide }));
  const anel = new THREE.Mesh(new THREE.RingGeometry(0.66, 0.76, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.7, side: THREE.DoubleSide }));
  g.add(disco, anel);
  g.userData.animar = (tempo) => {
    g.position.y = 1.2 + Math.sin(tempo * 3) * 0.12;
    g.rotation.y = Math.sin(tempo * 2) * 0.5;
    anel.scale.setScalar(1 + Math.sin(tempo * 6) * 0.08);
  };
  return g;
}

// ---------- Portão de decisão: 3 arcos, um em cada faixa, com as respostas ----------
function criarPortao(q) {
  const g = new THREE.Group();
  const cores = [0x2563eb, 0x7c3aed, 0x0891b2];
  q.respostas.forEach((resposta, i) => {
    const x = (i - 1) * 2;
    for (const lado of [-0.9, 0.9]) {
      const poste = caixa(0.12, 2.6, 0.12, cores[i]);
      poste.position.set(x + lado, 1.3, 0);
      g.add(poste);
    }
    const textura = criarTexturaTexto(quebrarEmLinhas(resposta), { largura: 512, altura: 220, fundo: '#ffffff', cor: '#0f1f4d', borda: '#facc15', tamanho: 64 });
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(1.75, 0.75), new THREE.MeshBasicMaterial({ map: textura }));
    placa.position.set(x, 2.25, 0.07);
    const letra = criarTexturaTexto(['A', 'B', 'C'][i], { largura: 128, altura: 128, fundo: '#facc15', cor: '#0f1f4d', tamanho: 100 });
    const selo = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), new THREE.MeshBasicMaterial({ map: letra }));
    selo.position.set(x, 2.85, 0.08);
    g.add(placa, selo);
  });
  return g;
}

function quebrarEmLinhas(texto) {
  const palavras = texto.split(' ');
  if (palavras.length < 3) return [texto];
  const meio = Math.ceil(palavras.length / 2);
  return [palavras.slice(0, meio).join(' '), palavras.slice(meio).join(' ')];
}

FASES[3] = {
  meta: META_FASE3, colecao: SOLUCOES, obstaculos: OBSTACULOS_FASE3,
  criarObstaculo: criarObstaculoFase3, criarColetavel: criarSolucao, tema: 'diretoria', corFundo: 0x9fd3ff,
  unidade: 'soluções', titulo: '🏢 Salvar a empresa', curso: 'GERENTE DA EMPRESA',
  vel: [19, 0.12, 0.7, 40], chanceDois: 0.6, espaco: [9, 0.72], chanceItem: 0.45, chanceCafe: 0.15, invencivel: 1.0,
  chancePoder: 0.09, portaoACada: 13, // um portão de decisão a cada 13 fileiras
};

// Cor do céu ao longo da fase: manhã → pôr do sol → noite (p = 0..1)
const CEU_MANHA = new THREE.Color(0x9fd3ff);
const CEU_TARDE = new THREE.Color(0xff9a62);
const CEU_NOITE = new THREE.Color(0x0b1533);
function corDoCeu(p, destino) {
  if (p < 0.5) return destino.copy(CEU_MANHA).lerp(CEU_TARDE, p / 0.5);
  return destino.copy(CEU_TARDE).lerp(CEU_NOITE, Math.min(1, (p - 0.5) / 0.4));
}
