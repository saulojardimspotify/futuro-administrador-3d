// Cena final: o auditório da formatura.
// É uma "cutscene": uma sequência de movimentos programados no tempo (linha do tempo).

// Prof. Túlio: cabelo castanho escuro curto, óculos redondos, barba por fazer e beca fechada.
const TULIO = { pele: 0xf1c9a5, cabelo: 0x3b2a1e, longo: false, camisa: 0x111827, calca: 0x111827 };

// Rosto "pintado" no estilo pixel: sobrancelhas, olhos, óculos, barba por fazer e sorriso.
function texturaRostoTulio() {
  const c = document.createElement('canvas');
  c.width = 128;
  c.height = 104;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#f1c9a5';
  ctx.fillRect(0, 0, 128, 104);
  ctx.fillStyle = '#3b2a1e';
  ctx.fillRect(0, 0, 10, 30); // costeletas
  ctx.fillRect(118, 0, 10, 30);
  ctx.fillRect(24, 14, 30, 6); // sobrancelhas
  ctx.fillRect(74, 14, 30, 6);
  // barba por fazer: pontinhos na parte de baixo do rosto
  ctx.fillStyle = 'rgba(90, 62, 45, 0.55)';
  for (let y = 58; y < 104; y += 6) {
    for (let x = 10 + (y % 12); x < 118; x += 9) ctx.fillRect(x, y, 3, 3);
  }
  for (const x of [40, 88]) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x - 8, 30, 16, 12);
    ctx.fillStyle = '#3b2a1e';
    ctx.fillRect(x - 3, 31, 7, 10);
    // aro dos óculos
    ctx.strokeStyle = '#4a2e1f';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(x, 36, 17, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillRect(57, 33, 14, 4); // ponte dos óculos
  // sorriso
  ctx.fillStyle = '#7a2e2e';
  ctx.beginPath();
  ctx.moveTo(46, 70);
  ctx.quadraticCurveTo(64, 92, 82, 70);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(52, 70, 24, 5);

  const t = new THREE.CanvasTexture(c);
  t.magFilter = THREE.NearestFilter; // pixels "quadradinhos", sem borrar
  return t;
}

function criarTulio() {
  const tulio = criarPersonagem(TULIO, { mochila: false, rosto: false });
  const cabeca = tulio.userData.cabeca;
  // o rosto pintado cobre os olhos e a boca simples do boneco
  const rosto = new THREE.Mesh(new THREE.PlaneGeometry(0.46, 0.42), new THREE.MeshLambertMaterial({ map: texturaRostoTulio() }));
  rosto.position.set(0, -0.04, -0.295);
  rosto.rotation.y = Math.PI; // virado para a frente do boneco (-Z)
  cabeca.add(rosto);
  cabeca.add(criarCapelo());
  // beca fechada
  const beca = caixaArredondada(0.72, 1.25, 0.42, 0x111827);
  beca.position.y = 0.95;
  tulio.add(beca);
  return tulio;
}

class Auditorio {
  constructor(def, aoTerminar) {
    this.aoTerminar = aoTerminar;
    this.t = 0;
    this.terminou = false;

    const cena = (this.cena = new THREE.Scene());
    cena.background = new THREE.Color(0x1a0f0a);
    this.camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);

    cena.add(new THREE.HemisphereLight(0xfff1dd, 0x442211, 0.75));
    const holofote = new THREE.SpotLight(0xffffff, 1.2, 40, 0.55, 0.5);
    holofote.position.set(0, 12, -4);
    holofote.target.position.set(0, 1, -12);
    holofote.castShadow = true;
    holofote.shadow.mapSize.setScalar(CELULAR ? 512 : 2048);
    cena.add(holofote, holofote.target);

    this.montarSala();
    this.montarPlateia();

    // Prof. Túlio no palco, virado na diagonal: olha para o formando e para a câmera
    this.reitor = criarTulio();
    this.reitor.position.set(1.15, 1, -11.8);
    this.reitor.rotation.y = (Math.PI * 3) / 4;
    cena.add(this.reitor);

    // Jogador, de beca e capelo, entrando pelo fundo
    this.jogador = criarPersonagem(def, { mochila: false });
    const beca = caixaArredondada(0.72, 1.25, 0.42, 0x111827);
    beca.position.y = 0.95;
    this.jogador.add(beca);
    this.jogador.userData.cabeca.add(criarCapelo());
    this.jogador.position.set(0, 0, 9);
    cena.add(this.jogador);

    // Diploma: um rolo branco com fita vermelha
    this.diploma = new THREE.Group();
    const rolo = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.6, 12), new THREE.MeshLambertMaterial({ color: 0xffffff }));
    const fita = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.08, 12), new THREE.MeshLambertMaterial({ color: 0xdc2626 }));
    this.diploma.add(rolo, fita);
    this.diploma.rotation.z = Math.PI / 2;
    this.diploma.position.copy(this.maoDoTulio());
    cena.add(this.diploma);

    this.criarConfete();
    // tudo faz e recebe sombra (menos o confete)
    cena.traverse((o) => {
      if (o.isMesh && !this.confete.includes(o)) o.castShadow = o.receiveShadow = true;
    });
    // aplausos ao entrar no auditório; o áudio final já fica carregado
    Sons.tocarArquivo('applause', 0.9);
    Sons.carregar('final2');
  }

  // Posição (no mundo) da mão direita do Túlio, de onde sai o diploma.
  maoDoTulio() {
    this.reitor.updateMatrixWorld(true);
    return this.reitor.userData.bracoD.localToWorld(new THREE.Vector3(0, -0.62, 0));
  }

  montarSala() {
    const c = this.cena;
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(20, 40), new THREE.MeshLambertMaterial({ color: 0x7a4b2a }));
    piso.rotation.x = -Math.PI / 2;
    const corredor = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 18), new THREE.MeshLambertMaterial({ color: 0xb91c1c }));
    corredor.rotation.x = -Math.PI / 2;
    corredor.position.set(0, 0.01, 1);
    c.add(piso, corredor);

    for (const x of [-10, 10]) {
      const parede = caixa(0.3, 9, 40, 0x4a1d1d);
      parede.position.set(x, 4.5, 0);
      c.add(parede);
    }
    const fundo = caixa(20, 9, 0.3, 0x3b1414);
    fundo.position.set(0, 4.5, -16);
    c.add(fundo);

    const palco = caixa(14, 1, 7, 0x5c3a1e);
    palco.position.set(0, 0.5, -12.5);
    c.add(palco);
    for (let k = 0; k < 3; k++) {
      const altura = (k + 1) / 3;
      const degrau = caixa(2.4, altura, 0.5, 0x6b4423);
      degrau.position.set(0, altura / 2, -7.75 - k * 0.5);
      c.add(degrau);
    }

    // Cortina vermelha com "dobras"
    for (let i = 0; i < 20; i++) {
      const dobra = caixa(0.7, 7, 0.3, i % 2 ? 0xb91c1c : 0x991b1b);
      dobra.position.set(-6.65 + i * 0.7, 4.5, -15.6);
      c.add(dobra);
    }
    const faixa = new THREE.Mesh(
      new THREE.PlaneGeometry(9, 1.3),
      new THREE.MeshBasicMaterial({
        map: criarTexturaTexto('FORMATURA • ADMINISTRAÇÃO', { largura: 1024, altura: 148, fundo: '#1e3a8a', cor: '#facc15', borda: '#facc15' }),
      })
    );
    faixa.position.set(0, 6.8, -15.3);
    c.add(faixa);

    const pulpito = caixa(1.1, 1.3, 0.7, 0x3f2a14);
    pulpito.position.set(-3.5, 1.65, -12);
    c.add(pulpito);
  }

  montarPlateia() {
    this.plateia = [];
    for (let fila = 0; fila < 4; fila++) {
      const z = -3 + fila * 2.4;
      for (const lado of [-1, 1]) {
        for (let col = 0; col < 3; col++) {
          const x = lado * (2.2 + col * 1.7);
          const assento = caixa(1.0, 0.5, 0.9, 0x7f1d1d);
          assento.position.set(x, 0.25, z);
          const encosto = caixa(1.0, 1.1, 0.15, 0x7f1d1d);
          encosto.position.set(x, 0.85, z + 0.45);
          this.cena.add(assento, encosto);

          const base = PERSONAGENS[Math.floor(Math.random() * PERSONAGENS.length)];
          const def = Object.assign({}, base, { camisa: Math.floor(Math.random() * 0xffffff) });
          const pessoa = criarPersonagem(def, { mochila: false });
          pessoa.scale.setScalar(0.85);
          pessoa.position.set(x, -0.08, z + 0.05);
          pessoa.userData.pernaE.rotation.x = Math.PI / 2;
          pessoa.userData.pernaD.rotation.x = Math.PI / 2;
          pessoa.userData.fase = Math.random() * 6;
          this.cena.add(pessoa);
          this.plateia.push(pessoa);
        }
      }
    }
  }

  criarConfete() {
    this.confete = [];
    const cores = [0xfacc15, 0xef4444, 0x22c55e, 0x3b82f6, 0xec4899, 0xffffff];
    const geo = new THREE.PlaneGeometry(0.14, 0.09);
    for (let i = 0; i < (CELULAR ? 100 : 220); i++) {
      const p = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cores[i % cores.length], side: THREE.DoubleSide }));
      p.position.set((Math.random() - 0.5) * 14, 8 + Math.random() * 6, -14 + Math.random() * 12);
      p.userData.vel = 1.2 + Math.random() * 1.8;
      p.visible = false;
      this.cena.add(p);
      this.confete.push(p);
    }
  }

  atualizar(dt) {
    const t = (this.t += dt);
    const j = this.jogador;
    const jp = j.userData;

    // 1) Anda pelo corredor da plateia até a escada (0 a 4 s)
    // 2) Sobe a escada (4 a 5,2 s)
    // 3) Vai até o reitor (5,2 a 6,2 s)
    if (t < 6.2) {
      if (t < 4) j.position.z = 9 + (-7.3 - 9) * progresso(t, 0, 4);
      else if (t < 5.2) {
        const k = progresso(t, 4, 5.2);
        j.position.z = -7.3 + (-9.3 + 7.3) * k;
        j.position.y = k;
      } else {
        j.position.y = 1;
        j.position.z = -9.3 + (-11.5 + 9.3) * progresso(t, 5.2, 6.2);
      }
      animarCorrida(j, t * 7, 0.5);
    } else {
      animarCorrida(j, 0, 0);
    }

    // 4) Vira para o reitor e recebe o diploma (6,2 a 8 s)
    if (t >= 6.2 && t < 8.6) {
      // vira na diagonal, de costas para a câmera e de frente para o Túlio
      j.rotation.y = (-Math.PI / 4) * suave(progresso(t, 6.2, 6.7));
      jp.bracoD.rotation.x = 1.3 * progresso(t, 6.7, 7.0);
      this.reitor.userData.bracoD.rotation.x = 1.3 * progresso(t, 6.4, 6.8);
      if (this.diploma.parent === this.cena) {
        j.updateMatrixWorld(true);
        const mao = jp.bracoD.localToWorld(new THREE.Vector3(0, -0.62, 0));
        const k = suave(progresso(t, 6.8, 8.0));
        this.diploma.position.lerpVectors(this.maoDoTulio(), mao, k);
        if (k >= 1) {
          // o diploma passa a "morar" na mão do jogador
          jp.bracoD.add(this.diploma);
          this.diploma.position.set(0, -0.62, -0.05);
          this.diploma.rotation.set(0, 0, Math.PI / 2);
          this.reitor.userData.bracoD.rotation.x = 0;
        }
      }
    }

    // 5) Vira para a plateia e comemora (a partir de 8,6 s)
    if (t >= 8.6) {
      if (!this.comemorou) {
        this.comemorou = true;
        Sons.arquivos.applause.volume = 0.3; // aplausos baixam para o áudio final aparecer
        Sons.tocarArquivo('final2', 1);
      }
      j.rotation.y = -Math.PI / 4 - ((Math.PI * 3) / 4) * suave(progresso(t, 8.6, 9.2));
      const braco = Math.PI * suave(progresso(t, 9.0, 9.5));
      jp.bracoD.rotation.x = Math.max(1.3, braco);
      jp.bracoE.rotation.x = braco;
      j.position.y = 1 + Math.max(0, Math.sin((t - 9.5) * 6)) * 0.25 * (t > 9.5 ? 1 : 0);
      for (const p of this.confete) p.visible = true;
    }

    // Plateia aplaudindo
    for (const p of this.plateia) {
      const bate = Math.sin(t * 14 + p.userData.fase) * 0.25;
      p.userData.bracoE.rotation.set(1.2, 0, -0.5 + bate);
      p.userData.bracoD.rotation.set(1.2, 0, 0.5 - bate);
    }

    for (const p of this.confete) {
      if (!p.visible) continue;
      p.position.y -= p.userData.vel * dt;
      p.rotation.x += dt * 4;
      p.rotation.y += dt * 3;
      if (p.position.y < 0) p.position.y = 10;
    }

    // Câmera: segue o jogador e depois para atrás dele, de frente para o Túlio
    const seguir = new THREE.Vector3(0, 2.6 + j.position.y, j.position.z + 5);
    const olharSeguir = new THREE.Vector3(0, 1.5 + j.position.y, j.position.z - 4);
    const frente = new THREE.Vector3(0.4, 2.7, -5.6);
    const olharFrente = new THREE.Vector3(0.55, 2.3, -11.6);
    const k = suave(progresso(t, 5.8, 7.3));
    this.camera.position.lerpVectors(seguir, frente, k);
    this.camera.lookAt(new THREE.Vector3().lerpVectors(olharSeguir, olharFrente, k));

    if (t > 10.8 && !this.terminou) {
      this.terminou = true;
      this.aoTerminar();
    }
  }
}
