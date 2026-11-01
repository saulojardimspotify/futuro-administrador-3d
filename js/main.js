// Arquivo principal: cria o mundo, controla as telas e roda o "laço do jogo".
//
// O laço do jogo é o coração de todo jogo: cerca de 60 vezes por segundo ele
//   1) lê os controles, 2) atualiza posições e regras, 3) desenha a tela.

const LARGURA_FAIXA = 2;
const $ = (id) => document.getElementById(id);

// Em qual tela estamos: 'selecao' | 'jogando' | 'caindo' | 'transicao' | 'auditorio' | 'fim'
let tela = 'selecao';
let escolhido = 0;
let nomeJogador = '';
let fase = 1; // 1 = faculdade, 2 = estágio na empresa

let renderizador, cena, camera, sol, corredor, itens, jogador, previa, auditorio;
const relogio = new THREE.Clock();
let tempoTotal = 0;
let tremor = 0;

// Variáveis da partida atual
const jogo = {};

function iniciar() {
  // No celular: sem suavização de bordas e menos pixels por ponto = bem mais rápido
  renderizador = new THREE.WebGLRenderer({ canvas: $('jogo'), antialias: !CELULAR, powerPreference: 'high-performance' });
  renderizador.setPixelRatio(Math.min(devicePixelRatio, CELULAR ? 1.5 : 2));
  renderizador.setSize(innerWidth, innerHeight, false);
  // Sombras suaves
  renderizador.shadowMap.enabled = true;
  renderizador.shadowMap.type = CELULAR ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;

  cena = new THREE.Scene();
  cena.background = new THREE.Color(0xe6e1f0);
  cena.fog = new THREE.Fog(0xe6e1f0, 35, 115);
  camera = new THREE.PerspectiveCamera(65, innerWidth / innerHeight, 0.1, 200);

  // Luz ambiente mais fraca + luz principal mais forte = mais contraste (menos "lavado")
  cena.add(new THREE.HemisphereLight(0xfff6e8, 0x7a7fb8, 0.6));
  sol = new THREE.DirectionalLight(0xfff1dc, 0.75);
  sol.position.set(3, 10, 6);
  sol.castShadow = true;
  sol.shadow.mapSize.setScalar(CELULAR ? 512 : 1024);
  Object.assign(sol.shadow.camera, { left: -8, right: 8, top: 22, bottom: -22, near: 1, far: 40 });
  sol.shadow.bias = -0.0008;
  cena.add(sol, sol.target);

  corredor = new Corredor(cena);
  itens = new Itens(cena);

  montarSelecao();
  configurarControles();
  addEventListener('resize', aoRedimensionar);
  laco();
}

// ---------- Tela de seleção ----------

function montarSelecao() {
  PERSONAGENS.forEach((def, i) => {
    def.retratoRosto = gerarRetrato(def, false);
    const card = document.createElement('button');
    card.className = 'card';
    card.innerHTML = `<img src="${gerarRetrato(def, true)}" alt="${def.descricao}"><span>${def.nome}</span>`;
    card.onclick = () => escolher(i);
    $('cards').appendChild(card);
  });

  $('nome').addEventListener('input', () => {
    $('nome').classList.remove('erro');
    $('previa-nome').textContent = `Futuro Administrador ${$('nome').value.trim() || '...'}`;
  });
  $('btn-comecar').onclick = () => comecarPartida(1);
  $('btn-tentar').onclick = () => comecarPartida(fase);
  $('btn-denovo').onclick = () => comecarPartida(1);
  $('btn-fase2').onclick = () => comecarPartida(2);
  $('btn-denovo2').onclick = () => comecarPartida(2);
  document.querySelectorAll('.btn-inicio').forEach((b) => (b.onclick = voltarInicio));

  escolher(0);
}

function escolher(i) {
  escolhido = i;
  document.querySelectorAll('.card').forEach((c, k) => c.classList.toggle('ativo', k === i));
  if (previa) cena.remove(previa);
  previa = criarPersonagem(PERSONAGENS[i]);
  previa.traverse((o) => (o.castShadow = true));
  cena.add(previa);
}

function voltarSelecao() {
  tela = 'selecao';
  Sons.pararMusica();
  Sons.pararArquivos();
  auditorio = null;
  if (jogador) cena.remove(jogador);
  fase = 1;
  itens.fase = 1;
  itens.reiniciar();
  aplicarTema();
  esconderTelas();
  HUD.esconder();
  $('tela-selecao').classList.remove('escondido');
  escolher(escolhido);
}

// "Voltar ao início": volta para a tela de abertura com a foto da faculdade
function voltarInicio() {
  voltarSelecao();
  $('tela-capa').classList.remove('escondido');
}

// Troca o cenário (faculdade ou empresa) e a cor do "céu"/neblina conforme a fase
function aplicarTema() {
  const config = FASES[fase];
  corredor.usarTema(config.tema);
  cena.background.setHex(config.corFundo);
  cena.fog.color.setHex(config.corFundo);
}

function esconderTelas() {
  ['tela-selecao', 'tela-fim', 'tela-vitoria', 'tela-promocao'].forEach((id) => $(id).classList.add('escondido'));
}

// ---------- Partida ----------

function comecarPartida(numFase = 1) {
  fase = numFase;
  itens.fase = numFase;
  const nome = $('nome').value.trim();
  if (!nome) {
    $('nome').classList.add('erro');
    $('nome').focus();
    return;
  }
  nomeJogador = nome;
  $('nome').blur();

  if (previa) cena.remove(previa);
  previa = null;
  if (jogador) cena.remove(jogador);
  const def = PERSONAGENS[escolhido];
  jogador = criarPersonagem(def);
  jogador.scale.setScalar(0.85);
  jogador.rotation.set(0, 0, 0);
  jogador.traverse((o) => (o.castShadow = true));
  cena.add(jogador);

  auditorio = null;
  aplicarTema();
  itens.reiniciar();
  Object.assign(jogo, {
    z: 0, x: 0, y: 0, vy: 0, faixa: 0, vel: 10, tempo: 0,
    pontos: 0, vidas: 3, invencivel: 0, final: false, zPorta: 0, travado: false,
  });

  esconderTelas();
  HUD.mostrar(def, nome, fase);
  tela = 'jogando';
  Sons.pararArquivos();
  Sons.iniciar();
  Sons.iniciarMusica();
}

function mover(direcao) {
  const nova = Math.max(-1, Math.min(1, jogo.faixa + direcao));
  if (nova !== jogo.faixa) Sons.faixa();
  jogo.faixa = nova;
}

function pular() {
  if (jogo.y > 0) return;
  jogo.vy = 7.8;
  Sons.pulo();
}

function atualizarJogo(dt) {
  jogo.tempo += dt;
  // Fica mais rápido com o tempo e, principalmente, a cada item conquistado.
  // A fase 2 já começa bem mais rápida (veja FASES em fase2.js).
  const [inicial, porSegundo, porItem, maxima] = FASES[fase].vel;
  jogo.vel = Math.min(inicial + jogo.tempo * porSegundo + itens.coletadas.length * porItem, maxima);
  jogo.z -= jogo.vel * dt;

  // Desliza suavemente até a faixa escolhida
  const alvoX = jogo.faixa * LARGURA_FAIXA;
  jogo.x += (alvoX - jogo.x) * Math.min(1, dt * 14);

  // Pulo com gravidade
  if (jogo.y > 0 || jogo.vy > 0) {
    jogo.vy -= 24 * dt;
    jogo.y += jogo.vy * dt;
    if (jogo.y <= 0) {
      jogo.y = 0;
      jogo.vy = 0;
    }
  }

  jogador.position.set(jogo.x, jogo.y, jogo.z);
  jogador.rotation.z = (jogo.x - alvoX) * 0.08;
  if (jogo.y > 0) poseSalto(jogador);
  else animarCorrida(jogador, jogo.tempo * jogo.vel * 0.9);

  if (jogo.invencivel > 0) {
    jogo.invencivel -= dt;
    jogador.visible = jogo.invencivel <= 0 || Math.floor(jogo.invencivel * 12) % 2 === 0;
  }

  jogo.pontos += jogo.vel * dt;
  corredor.atualizar(jogo.z);

  for (const ev of itens.atualizar(jogo, tempoTotal)) {
    if (ev.tipo === 'livro') {
      jogo.pontos += 100;
      HUD.disciplinas(itens.coletadas);
      HUD.aviso(`+ ${ev.nome}`, 'bom');
      Sons.livro();
    } else if (ev.tipo === 'cafe') {
      jogo.vidas = Math.min(3, jogo.vidas + 1);
      HUD.vidas(jogo.vidas);
      HUD.aviso('☕ Café! +1 vida', 'bom');
      Sons.cafe();
    } else if (jogo.invencivel <= 0) {
      Sons.batida();
      jogo.vidas--;
      jogo.invencivel = 1.6;
      tremor = 0.4;
      HUD.vidas(jogo.vidas);
      HUD.aviso(`${ev.nome}! −1 vida`, 'ruim');
      if (jogo.vidas <= 0) return fimDeJogo();
    }
  }

  // Fase 2: bateu todas as metas? Promoção!
  if (fase === 2 && itens.coletadas.length >= FASES[2].meta) return promover();

  // Fase 1: pegou todas as disciplinas? Aparece a porta do auditório
  if (fase === 1 && !jogo.final && itens.coletadas.length >= META_DISCIPLINAS) {
    jogo.final = true;
    jogo.zPorta = itens.criarPorta(jogo.z);
    HUD.aviso('Todas as disciplinas concluídas! Siga para o Auditório 🎓', 'final');
    Sons.todasDisciplinas();
  }
  if (jogo.final) {
    const distancia = jogo.z - jogo.zPorta;
    if (distancia < 18) {
      if (!jogo.travado) Sons.porta();
      jogo.travado = true;
      jogo.faixa = 0;
      itens.abrirPorta(1 - Math.max(0, (distancia - 3) / 15));
    }
    if (distancia < 1) irParaAuditorio();
  }

  HUD.pontos(jogo.pontos);
  posicionarCamera(dt);
}

function posicionarCamera(dt) {
  tremor = Math.max(0, tremor - dt);
  const t = tremor * (Math.random() - 0.5) * 0.6;
  camera.position.set(jogo.x * 0.5 + t, 3.4 + jogo.y * 0.3, jogo.z + 6.5);
  camera.lookAt(jogo.x * 0.3, 1.3, jogo.z - 8);
  // a luz das sombras acompanha o jogador
  sol.position.set(3, 10, jogo.z + 6);
  sol.target.position.set(0, 0, jogo.z - 6);
}

function fimDeJogo() {
  tela = 'caindo';
  jogador.visible = true;
  Sons.pararMusica();
  Sons.gameOver();
  setTimeout(() => {
    const config = FASES[fase];
    $('fim-titulo').textContent = fase === 2 ? '😢 Você foi desligado do estágio' : '😢 Você trancou o curso';
    $('fim-texto').innerHTML =
      `Você conquistou <b>${itens.coletadas.length} de ${config.meta}</b> ${config.unidade}<br>e fez <b>${Math.floor(jogo.pontos)}</b> pontos.`;
    $('fim-ranking').innerHTML = Ranking.html(
      Ranking.salvar({ nome: nomeJogador, pontos: Math.floor(jogo.pontos), formou: false, fase })
    );
    $('tela-fim').classList.remove('escondido');
    HUD.esconder();
    tela = 'fim';
  }, 1200);
}

// Fim da fase 2: sem cena, direto para a tela de promoção (o boneco comemora pulando)
function promover() {
  tela = 'promovido';
  jogador.visible = true;
  Sons.pararMusica();
  Sons.todasDisciplinas();
  Sons.tocarArquivo('applause', 0.9);
  HUD.esconder();
  const def = PERSONAGENS[escolhido];
  $('promocao-titulo').textContent = def.mulher ? 'Promovida!' : 'Promovido!';
  $('promocao-texto').innerHTML =
    `Parabéns, <b>${escaparHtml(nomeJogador)}</b>!<br>Você bateu todas as metas e foi ${def.mulher ? 'efetivada' : 'efetivado'} na empresa.<br>Pontuação: <b>${Math.floor(jogo.pontos)}</b>`;
  $('promocao-ranking').innerHTML = Ranking.html(
    Ranking.salvar({ nome: nomeJogador, pontos: Math.floor(jogo.pontos), promovido: true, fase: 2 })
  );
  $('tela-promocao').classList.remove('escondido');
}

function irParaAuditorio() {
  tela = 'transicao';
  Sons.pararMusica();
  $('fade').classList.add('ativo');
  setTimeout(() => {
    HUD.esconder();
    const def = PERSONAGENS[escolhido];
    auditorio = new Auditorio(def, () => {
      const titulo = def.mulher ? 'Administradora formada' : 'Administrador formado';
      $('vitoria-texto').innerHTML =
        `Parabéns, <b>${escaparHtml(nomeJogador)}</b>!<br>Agora você é ${titulo}.<br>Pontuação final: <b>${Math.floor(jogo.pontos)}</b>`;
      $('vitoria-ranking').innerHTML = Ranking.html(
        Ranking.salvar({ nome: nomeJogador, pontos: Math.floor(jogo.pontos), formou: true, fase: 1 })
      );
      $('tela-vitoria').classList.remove('escondido');
    });
    tela = 'auditorio';
    $('fade').classList.remove('ativo');
  }, 900);
}

// ---------- Controles ----------

function alternarSom() {
  Sons.iniciar();
  $('btn-som').textContent = Sons.alternarMudo() ? '🔇' : '🔊';
  $('btn-som').blur();
}

// ---------- Tela cheia ----------
// Usa o modo tela cheia do navegador: some a barra de endereço, as abas e a barra do Windows.
const raiz = document.documentElement;
const pedirTelaCheia = raiz.requestFullscreen || raiz.webkitRequestFullscreen;
const emTelaCheia = () => document.fullscreenElement || document.webkitFullscreenElement;

function alternarTelaCheia() {
  if (emTelaCheia()) (document.exitFullscreen || document.webkitExitFullscreen).call(document);
  else {
    const pedido = pedirTelaCheia.call(raiz);
    if (pedido && pedido.catch) pedido.catch(() => {}); // alguns navegadores não devolvem promessa
  }
  $('btn-tela').blur();
}

function atualizarIconeTela() {
  // ícone de "expandir" fora da tela cheia, de "recolher" dentro dela
  $('icone-tela').setAttribute('d', emTelaCheia()
    ? 'M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5'
    : 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5');
}

function fecharCapa() {
  $('tela-capa').classList.add('escondido');
  Sons.iniciar(); // aproveita o toque para já liberar os áudios no celular
}

function configurarControles() {
  $('btn-som').onclick = alternarSom;
  $('btn-jogar').onclick = fecharCapa;
  // iPhone não permite tela cheia em páginas: lá o botão nem aparece
  if (pedirTelaCheia) {
    $('btn-tela').onclick = alternarTelaCheia;
    document.addEventListener('fullscreenchange', atualizarIconeTela);
    document.addEventListener('webkitfullscreenchange', atualizarIconeTela);
  } else {
    $('btn-tela').classList.add('escondido');
  }
  addEventListener('keydown', (e) => {
    if ((e.key === 'f' || e.key === 'F') && pedirTelaCheia && document.activeElement !== $('nome')) return alternarTelaCheia();
    if (!$('tela-capa').classList.contains('escondido')) {
      if (e.key === 'Enter') fecharCapa();
      return;
    }
    if (tela === 'selecao' && e.key === 'Enter') return comecarPartida();
    if ((e.key === 'm' || e.key === 'M') && document.activeElement !== $('nome')) return alternarSom();
    if (tela !== 'jogando' || jogo.travado) return;
    if (['ArrowLeft', 'a', 'A'].includes(e.key)) { if (!e.repeat) mover(-1); }
    else if (['ArrowRight', 'd', 'D'].includes(e.key)) { if (!e.repeat) mover(1); }
    else if ([' ', 'ArrowUp', 'w', 'W'].includes(e.key)) pular();
    else return;
    e.preventDefault();
  });

  // Celular: deslizar o dedo
  let inicio = null;
  addEventListener('touchstart', (e) => (inicio = e.touches[0]), { passive: true });
  addEventListener('touchend', (e) => {
    if (!inicio || tela !== 'jogando' || jogo.travado) return;
    const fim = e.changedTouches[0];
    const dx = fim.clientX - inicio.clientX;
    const dy = fim.clientY - inicio.clientY;
    if (Math.abs(dx) > Math.abs(dy) && Math.abs(dx) > 30) mover(Math.sign(dx));
    else if (dy < -30) pular();
    inicio = null;
  });
}

function aoRedimensionar() {
  renderizador.setSize(innerWidth, innerHeight, false);
  for (const cam of [camera, auditorio && auditorio.camera]) {
    if (!cam) continue;
    cam.aspect = innerWidth / innerHeight;
    cam.updateProjectionMatrix();
  }
}

// ---------- Laço do jogo ----------

function laco() {
  requestAnimationFrame(laco);
  const dt = Math.min(relogio.getDelta(), 0.05);
  tempoTotal += dt;
  if (renderizador.domElement.width !== Math.floor(innerWidth * renderizador.getPixelRatio())) aoRedimensionar();

  if (tela === 'selecao') {
    // Boneco girando devagar na tela de escolha
    const largo = innerWidth > 800;
    previa.position.set(largo ? -1.6 : 0, 0, -3);
    previa.rotation.y += dt * 0.8;
    animarCorrida(previa, tempoTotal * 2, 0.15);
    camera.position.set(0, largo ? 1.7 : 2.4, 2.2);
    camera.lookAt(largo ? -0.4 : 0, largo ? 1.25 : 0.2, -3);
  } else if (tela === 'jogando') {
    atualizarJogo(dt);
  } else if (tela === 'caindo') {
    jogador.rotation.x = Math.max(jogador.rotation.x - dt * 4, -Math.PI / 2);
    jogador.position.y = Math.max(jogador.position.y - dt * 3, 0.25);
  } else if (tela === 'promovido') {
    // comemorando: pulinhos com os braços para cima
    jogador.position.y = Math.abs(Math.sin(tempoTotal * 6)) * 0.4;
    jogador.userData.bracoE.rotation.x = jogador.userData.bracoD.rotation.x = Math.PI;
  } else if (tela === 'transicao') {
    jogo.z -= 6 * dt;
    jogador.position.z = jogo.z;
    animarCorrida(jogador, tempoTotal * 9);
    posicionarCamera(dt);
  } else if (auditorio) {
    auditorio.atualizar(dt);
  }

  if (auditorio) renderizador.render(auditorio.cena, auditorio.camera);
  else renderizador.render(cena, camera);
}

iniciar();
