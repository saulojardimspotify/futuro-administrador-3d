// Fim da fase 2: cerimônia de efetivação na sala da diretoria.
// O jogador entra por um "corredor" de colegas comemorando, o chefe (o mesmo que
// corria atrás dele no estágio, agora sorrindo) entrega o crachá de EFETIVADO,
// o crachá vai para o peito, o jogador se vira para a câmera e comemora.
// Linha do tempo parecida com a da formatura (auditorio.js).

// Crachá: cartão branco com faixa azul, foto e nome do jogador
function texturaCracha(def, nome) {
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 360;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 360);
  ctx.fillStyle = '#1e3a8a';
  ctx.fillRect(0, 0, 256, 78);
  ctx.fillStyle = '#facc15';
  ctx.font = '900 34px Nunito, Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('EMPRESA', 128, 52);
  // foto (o mesmo retrato do HUD); se não tiver, um círculo com a cor da camisa
  ctx.fillStyle = corCss(def.camisa);
  ctx.fillRect(68, 96, 120, 130);
  const foto = new Image();
  const textura = new THREE.CanvasTexture(c);
  foto.onload = () => {
    ctx.drawImage(foto, 68, 96, 120, 130);
    textura.needsUpdate = true;
  };
  if (def.retratoRosto) foto.src = def.retratoRosto;
  ctx.fillStyle = '#111827';
  let tamanho = 40;
  ctx.font = `900 ${tamanho}px Nunito, Arial, sans-serif`;
  while (ctx.measureText(nome).width > 236 && tamanho > 16) ctx.font = `900 ${(tamanho -= 2)}px Nunito, Arial, sans-serif`;
  ctx.fillText(nome, 128, 270);
  ctx.fillStyle = '#16a34a';
  ctx.fillRect(18, 296, 220, 46);
  ctx.fillStyle = '#ffffff';
  ctx.font = '900 30px Nunito, Arial, sans-serif';
  ctx.fillText(def.mulher ? 'EFETIVADA' : 'EFETIVADO', 128, 330);
  return textura;
}

// Quadro "Funcionário do mês" com o retrato do jogador
function texturaFuncionarioDoMes(def, nome) {
  const c = document.createElement('canvas');
  c.width = 400;
  c.height = 500;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#b8860b';
  ctx.fillRect(0, 0, 400, 500);
  ctx.fillStyle = '#fffbeb';
  ctx.fillRect(22, 22, 356, 456);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#1e3a8a';
  ctx.font = '900 34px Nunito, Arial, sans-serif';
  ctx.fillText(def.mulher ? 'FUNCIONÁRIA' : 'FUNCIONÁRIO', 200, 72);
  ctx.fillText('DO MÊS', 200, 112);
  ctx.fillStyle = corCss(def.camisa);
  ctx.fillRect(90, 135, 220, 240);
  const textura = new THREE.CanvasTexture(c);
  const foto = new Image();
  foto.onload = () => {
    ctx.drawImage(foto, 90, 135, 220, 240);
    textura.needsUpdate = true;
  };
  if (def.retratoRosto) foto.src = def.retratoRosto;
  ctx.fillStyle = '#111827';
  let tamanho = 44;
  ctx.font = `900 ${tamanho}px Nunito, Arial, sans-serif`;
  while (ctx.measureText(nome).width > 340 && tamanho > 18) ctx.font = `900 ${(tamanho -= 2)}px Nunito, Arial, sans-serif`;
  ctx.fillText(nome, 200, 430);
  ctx.fillStyle = '#facc15';
  ctx.font = '40px Arial';
  ctx.fillText('★ ★ ★', 200, 470);
  return textura;
}

class Promocao {
  constructor(def, nome, aoTerminar, real) {
    this.aoTerminar = aoTerminar;
    this.real = real || null;
    this.t = 0;
    this.terminou = false;

    const cena = (this.cena = new THREE.Scene());
    cena.background = new THREE.Color(0x9fd3ff);
    if (Cenario.ambiente) cena.environment = Cenario.ambiente;
    this.camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 100);

    cena.add(new THREE.HemisphereLight(0xffffff, 0x8a7a66, 0.8));
    const luz = new THREE.SpotLight(0xfff4e0, 1.1, 40, 0.75, 0.5);
    luz.position.set(0, 9, 2);
    luz.target.position.set(0, 0, -3);
    luz.castShadow = true;
    luz.shadow.mapSize.setScalar(CELULAR ? 512 : 2048);
    cena.add(luz, luz.target);

    this.montarSala(def, nome);
    this.montarColegas();

    // O chefe, agora sorrindo, ao lado da mesa, virado na diagonal para o jogador e a câmera
    this.chefeReal = Modelos.criarJa('chefe', 'parado');
    this.chefe = this.chefeReal ? this.chefeReal.grupo : criarPersonagem(Object.assign({}, PERSONAGENS[1], { camisa: 0x1f2937 }), { mochila: false });
    this.chefe.position.set(1.15, 0, -4.3);
    this.chefe.rotation.y = (Math.PI * 3) / 4;
    cena.add(this.chefe);

    // Jogador entrando pela porta, no fundo da sala
    this.jogador = this.real ? this.real.grupo : criarPersonagem(def, { mochila: false });
    this.jogador.rotation.set(0, 0, 0);
    this.jogador.position.set(0, 0, 6);
    cena.add(this.jogador);

    // Crachá (cartão + cordão), começa na mão do chefe
    this.cracha = new THREE.Group();
    const cartao = new THREE.Mesh(
      new THREE.BoxGeometry(0.14, 0.2, 0.008),
      new THREE.MeshBasicMaterial({ map: texturaCracha(def, nome) })
    );
    this.cracha.add(cartao);
    if (this.chefeReal) {
      this.chefeReal.prenderNoOsso('RightHand', this.cracha, new THREE.Vector3(0, 0.12, 0.03));
    } else {
      this.cracha.position.copy(this.maoDoChefe());
      cena.add(this.cracha);
    }

    this.criarConfete();
    cena.traverse((o) => {
      if (o.isMesh && !this.confete.includes(o) && !this.baloes.includes(o)) {
        o.receiveShadow = true;
        o.castShadow = !o.isSkinnedMesh;
      }
    });
    Sons.tocarArquivo('applause', 0.9);
    Sons.carregar('final2');
  }

  maoDoChefe() {
    if (this.chefeReal) return this.chefeReal.posicaoDoOsso('RightHand');
    this.chefe.updateMatrixWorld(true);
    return this.chefe.userData.bracoD.localToWorld(new THREE.Vector3(0, -0.62, 0));
  }

  montarSala(def, nome) {
    const c = this.cena;
    // piso de madeira, tapete vermelho do corredor até a mesa
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(10, 20), new THREE.MeshStandardMaterial({ color: 0x4a2f1c, roughness: 0.7 }));
    piso.rotation.x = -Math.PI / 2;
    piso.position.z = 1;
    const tapete = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 12), new THREE.MeshLambertMaterial({ color: 0xb91c1c }));
    tapete.rotation.x = -Math.PI / 2;
    tapete.position.set(0, 0.01, 1.5);
    c.add(piso, tapete);

    for (const x of [-5, 5]) {
      const parede = caixa(0.2, 4.4, 20, 0xe9e4da);
      parede.position.set(x, 2.2, 1);
      c.add(parede);
    }
    const teto = new THREE.Mesh(new THREE.PlaneGeometry(10, 20), new THREE.MeshLambertMaterial({ color: 0xf3f4f6 }));
    teto.rotation.x = Math.PI / 2;
    teto.position.set(0, 4.4, 1);
    c.add(teto);
    for (const z of [-4, 0, 4]) {
      const painel = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.04, 0.6), new THREE.MeshBasicMaterial({ color: 0xfffbea }));
      painel.position.set(0, 4.37, z);
      c.add(painel);
    }

    // janelão no fundo com a cidade de dia
    const cidade = new THREE.Mesh(new THREE.PlaneGeometry(26, 13), new THREE.MeshBasicMaterial({ map: texturaCidade(false), transparent: true, fog: false }));
    cidade.position.set(0, -0.5, -18);
    c.add(cidade);
    for (const x of [-5, -2.5, 0, 2.5, 5]) {
      const montante = caixa(0.12, 4.4, 0.12, 0x374151);
      montante.position.set(x, 2.2, -7.5);
      c.add(montante);
    }
    const parapeito = caixa(10, 0.7, 0.25, 0x6b4f3a);
    parapeito.position.set(0, 0.35, -7.5);
    c.add(parapeito);

    // faixa de parabéns em cima do janelão
    const faixa = new THREE.Mesh(
      new THREE.PlaneGeometry(7.2, 0.9),
      new THREE.MeshBasicMaterial({
        map: criarTexturaTexto(`PARABÉNS, ${nome.toUpperCase()}! BEM-VINDO${def.mulher ? 'A' : ''} À EQUIPE`, { largura: 1400, altura: 175, fundo: '#16a34a', cor: '#ffffff', borda: '#facc15' }),
      })
    );
    faixa.position.set(0, 3.75, -7.3);
    c.add(faixa);

    // mesa do chefe, com cadeira, monitor e bolo de comemoração
    const mesa = caixa(2.8, 0.08, 1.1, 0x3f2a1a);
    mesa.position.set(0.6, 0.78, -6);
    const frente = caixa(2.8, 0.74, 0.06, 0x2e1f13);
    frente.position.set(0.6, 0.4, -5.47);
    c.add(mesa, frente);
    const monitor = caixa(0.7, 0.42, 0.04, 0x111827);
    monitor.position.set(1.3, 1.1, -6.3);
    c.add(monitor);
    const bolo = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.18, 24), new THREE.MeshStandardMaterial({ color: 0xfdf2f8 }));
    bolo.position.set(-0.3, 0.91, -6);
    const cobertura = new THREE.Mesh(new THREE.CylinderGeometry(0.225, 0.225, 0.04, 24), new THREE.MeshStandardMaterial({ color: 0xec4899 }));
    cobertura.position.set(-0.3, 1.01, -6);
    c.add(bolo, cobertura);
    for (let i = 0; i < 3; i++) {
      const vela = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.1, 6), new THREE.MeshBasicMaterial({ color: 0xfacc15 }));
      vela.position.set(-0.36 + i * 0.06, 1.08, -6);
      c.add(vela);
    }

    // quadro "Funcionário do mês" na parede esquerda, de frente para a câmera final
    const quadro = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 1.5), new THREE.MeshBasicMaterial({ map: texturaFuncionarioDoMes(def, nome) }));
    quadro.position.set(-4.88, 2.3, -4.2);
    quadro.rotation.y = Math.PI / 2;
    c.add(quadro);
    // placa da sala na parede direita
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.5), new THREE.MeshBasicMaterial({
      map: criarTexturaTexto('🏢 SALA DA DIRETORIA', { largura: 700, altura: 160, fundo: '#1e3a8a', cor: '#facc15' }),
    }));
    placa.position.set(4.88, 3.0, -4.2);
    placa.rotation.y = -Math.PI / 2;
    c.add(placa);

    // vasos de planta nos cantos
    for (const x of [-4.2, 4.2]) {
      const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.6, 14), new THREE.MeshStandardMaterial({ color: 0x1e293b }));
      vaso.position.set(x, 0.3, -6.6);
      const folhas = new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), new THREE.MeshStandardMaterial({ color: 0x15803d }));
      folhas.position.set(x, 1.1, -6.6);
      c.add(vaso, folhas);
    }

    // balões coloridos amarrados perto da mesa e nas paredes
    this.baloes = [];
    const cores = [0xef4444, 0xfacc15, 0x3b82f6, 0x22c55e, 0xec4899, 0xffffff];
    const linhaMat = new THREE.LineBasicMaterial({ color: 0xdddddd });
    const grupos = [[-2.2, -6.2], [2.9, -6.2], [-4.3, 1], [4.3, 1], [-4.3, -3], [4.3, -3]];
    let k = 0;
    for (const [bx, bz] of grupos) {
      for (let i = 0; i < 3; i++) {
        const b = new THREE.Mesh(new THREE.SphereGeometry(0.22, 16, 12), new THREE.MeshStandardMaterial({ color: cores[k++ % cores.length], roughness: 0.25 }));
        b.scale.y = 1.18;
        const x = bx + (i - 1) * 0.22;
        const y = 2.4 + (i % 2) * 0.3;
        b.position.set(x, y, bz + (i % 2) * 0.15);
        b.userData = { y, fase: Math.random() * 6 };
        const fio = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, y - 0.25, b.position.z), new THREE.Vector3(bx, 0.9, bz)]), linhaMat);
        c.add(b, fio);
        this.baloes.push(b);
      }
    }
  }

  // Colegas em duas filas, um de frente para o outro, comemorando
  montarColegas() {
    this.colegas = [];
    const usarReal = Modelos.usarFigurantes && Modelos.prontos.isabella;
    for (const lado of [-1, 1]) {
      for (let i = 0; i < 3; i++) {
        const x = lado * 1.55;
        const z = 3.2 - i * 2.1;
        const giro = lado < 0 ? -Math.PI / 2 : Math.PI / 2; // virados para o tapete
        const real = usarReal ? Modelos.criarJa(null, 'comemorar') : null; // cada um num ponto da animação
        let pessoa;
        if (real) {
          pessoa = real.grupo;
          this.colegas.push(pessoa);
        } else {
          const base = PERSONAGENS[Math.floor(Math.random() * PERSONAGENS.length)];
          pessoa = criarPersonagem(Object.assign({}, base, { camisa: Math.floor(Math.random() * 0xffffff) }), { mochila: false });
          pessoa.scale.setScalar(0.9);
          pessoa.userData.fase = Math.random() * 6;
          this.colegas.push(pessoa);
        }
        pessoa.position.set(x, 0, z);
        pessoa.rotation.y = giro;
        this.cena.add(pessoa);
      }
    }
  }

  criarConfete() {
    this.confete = [];
    const cores = [0xfacc15, 0xef4444, 0x22c55e, 0x3b82f6, 0xec4899, 0xffffff];
    const geo = new THREE.PlaneGeometry(0.12, 0.08);
    for (let i = 0; i < (CELULAR ? 90 : 200); i++) {
      const p = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cores[i % cores.length], side: THREE.DoubleSide }));
      p.position.set((Math.random() - 0.5) * 9, 4.4 + Math.random() * 4, -7 + Math.random() * 11);
      p.userData.vel = 1 + Math.random() * 1.6;
      p.visible = false;
      this.cena.add(p);
      this.confete.push(p);
    }
  }

  atualizar(dt) {
    const t = (this.t += dt);
    const j = this.jogador;
    const jp = j.userData;

    // 1) Entra pelo tapete, entre os colegas, até o chefe (0 a 4,6 s)
    if (t < 4.6) {
      j.position.z = 6 + (-4.0 - 6) * progresso(t, 0, 4.6);
      if (this.real) {
        this.real.tocar('correr');
        this.real.velocidade(0.55);
      } else animarCorrida(j, t * 7, 0.5);
    } else if (this.real) {
      if (t < 8.6) this.real.tocar('parado');
    } else if (t < 8.6) animarCorrida(j, 0, 0);
    if (this.real) this.real.atualizar(dt);
    if (this.chefeReal) this.chefeReal.atualizar(dt);

    // 2) Vira para o chefe e recebe o crachá (4,6 a 8,6 s)
    if (t >= 4.6 && t < 8.6) j.rotation.y = (-Math.PI / 4) * suave(progresso(t, 4.6, 5.1));
    if (this.real && this.chefeReal && t >= 4.6 && t < 8.6) {
      // aperto de mão / entrega: os dois estendem o braço até um ponto entre eles
      const encontro = this.real.posicaoDoOsso('RightArm').add(this.chefeReal.posicaoDoOsso('RightArm')).multiplyScalar(0.5);
      encontro.y -= 0.05;
      const braco = suave(progresso(t, 5.2, 5.8)) * (1 - suave(progresso(t, 6.6, 7.1)));
      this.chefeReal.mirarBraco(encontro, braco);
      this.real.mirarBraco(encontro, braco);
      const maoJogador = this.real.modelo.getObjectByName('RightHand');
      if (t >= 6.0 && t < 7.4 && this.cracha.parent !== maoJogador) {
        this.real.prenderNoOsso('RightHand', this.cracha, new THREE.Vector3(0, 0.12, 0.03));
      }
      // 3) Coloca o crachá no peito
      if (t >= 7.4 && !this.noPeito) this.colocarNoPeito();
    } else if (t >= 4.6 && t < 8.6) {
      // bonecos de blocos: o crachá "voa" da mão do chefe para o peito do jogador
      if (!this.chefeReal) this.chefe.userData.bracoD.rotation.x = 1.3 * progresso(t, 5.0, 5.5) * (t < 6.6 ? 1 : 0);
      if (!this.real) jp.bracoD.rotation.x = 1.3 * progresso(t, 5.3, 5.7) * (t < 6.6 ? 1 : 0);
      if (t >= 7.4 && !this.noPeito && this.cracha.parent !== this.cena) this.colocarNoPeito(); // um realista e outro não
      if (this.cracha.parent === this.cena) {
        j.updateMatrixWorld(true);
        const peito = this.real ? this.real.posicaoDoOsso('Spine2') : j.localToWorld(new THREE.Vector3(0, 1.25, -0.3));
        const k = suave(progresso(t, 5.6, 7.2));
        this.cracha.position.lerpVectors(this.maoDoChefe(), peito, k);
        this.cracha.lookAt(this.camera.position);
        if (k >= 1) this.colocarNoPeito();
      }
    }

    // 4) Vira para a câmera e comemora (a partir de 8,6 s)
    if (t >= 8.6) {
      if (!this.comemorou) {
        this.comemorou = true;
        if (Sons.arquivos.applause) Sons.arquivos.applause.volume = 0.3;
        Sons.tocarArquivo('final2', 1);
      }
      j.rotation.y = -Math.PI / 4 - ((Math.PI * 3) / 4) * suave(progresso(t, 8.6, 9.2));
      if (this.real) this.real.tocar('comemorar', 0.3);
      else {
        const braco = Math.PI * suave(progresso(t, 9.0, 9.5));
        jp.bracoD.rotation.x = jp.bracoE.rotation.x = braco;
        j.position.y = t > 9.5 ? Math.max(0, Math.sin((t - 9.5) * 6)) * 0.25 : 0;
      }
      if (this.chefeReal) this.chefeReal.tocar('comemorar', 0.4);
      for (const p of this.confete) p.visible = true;
    }

    // colegas comemorando / aplaudindo
    for (const p of this.colegas) {
      if (p.userData.real) {
        p.userData.real.atualizar(dt);
        continue;
      }
      const bate = Math.sin(t * 14 + p.userData.fase) * 0.25;
      p.userData.bracoE.rotation.set(1.2, 0, -0.5 + bate);
      p.userData.bracoD.rotation.set(1.2, 0, 0.5 - bate);
    }
    for (const b of this.baloes) b.position.y = b.userData.y + Math.sin(t * 1.5 + b.userData.fase) * 0.05;
    for (const p of this.confete) {
      if (!p.visible) continue;
      p.position.y -= p.userData.vel * dt;
      p.rotation.x += dt * 4;
      p.rotation.y += dt * 3;
      if (p.position.y < 0) p.position.y = 4.3;
    }

    // Câmera: atrás do jogador entrando; depois por cima do ombro, olhando o chefe;
    // no fim, de frente para o jogador (com a faixa, a mesa e os colegas no quadro)
    const seguir = new THREE.Vector3(0, 2.4, j.position.z + 4.5);
    const olharSeguir = new THREE.Vector3(0, 1.4, j.position.z - 4);
    const ombro = new THREE.Vector3(-0.5, 2.1, -1.2);
    const olharOmbro = new THREE.Vector3(0.7, 1.45, -4.5);
    const final = new THREE.Vector3(0.3, 2.0, 1.4);
    const olharFinal = new THREE.Vector3(0.2, 1.7, -5);
    const k1 = suave(progresso(t, 4.0, 5.4));
    const k2 = suave(progresso(t, 8.6, 10.2));
    const pos = new THREE.Vector3().lerpVectors(seguir, ombro, k1).lerp(final, k2);
    const olhar = new THREE.Vector3().lerpVectors(olharSeguir, olharOmbro, k1).lerp(olharFinal, k2);
    this.camera.position.copy(pos);
    this.camera.lookAt(olhar);

    if (t > 11.2 && !this.terminou) {
      this.terminou = true;
      this.aoTerminar();
    }
  }

  // Prende o crachá no peito do jogador, virado para a frente
  colocarNoPeito() {
    this.noPeito = true;
    if (this.real) {
      this.real.prenderNoOsso('Spine2', this.cracha, new THREE.Vector3(0, 0.08, 0.15));
    } else {
      this.jogador.add(this.cracha);
      this.cracha.position.set(0, 1.25, -0.27);
      this.cracha.rotation.set(0, Math.PI, 0);
      this.cracha.scale.setScalar(1.3);
    }
  }
}
