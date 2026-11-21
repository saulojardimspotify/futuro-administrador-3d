// Fim da fase 3: o Conselho de Administração, numa sala com janelão para a cidade à noite.
// É uma cena (como a formatura): o jogador entra, a CEO o(a) espera em pé no pé da mesa
// e entrega a placa de DIRETOR(A); os diretores, sentados, aplaudem; o jogador comemora.

// Placa de madeira com plaqueta dourada: "DIRETOR(A) · nome"
function texturaPlacaDiretor(def, nome) {
  const c = document.createElement('canvas');
  c.width = 512;
  c.height = 360;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#5b3a1e';
  ctx.fillRect(0, 0, 512, 360);
  ctx.fillStyle = '#d4a017';
  ctx.fillRect(36, 36, 440, 288);
  ctx.strokeStyle = '#7a5a0c';
  ctx.lineWidth = 6;
  ctx.strokeRect(50, 50, 412, 260);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#3b2606';
  ctx.font = '900 70px Nunito, Arial, sans-serif';
  ctx.fillText(def.mulher ? 'DIRETORA' : 'DIRETOR', 256, 150);
  let tamanho = 56;
  ctx.font = `800 ${tamanho}px Nunito, Arial, sans-serif`;
  while (ctx.measureText(nome).width > 380 && tamanho > 20) ctx.font = `800 ${(tamanho -= 2)}px Nunito, Arial, sans-serif`;
  ctx.fillText(nome, 256, 235);
  ctx.font = '36px Arial';
  ctx.fillText('★ ★ ★', 256, 290);
  return new THREE.CanvasTexture(c);
}

class Conselho {
  constructor(def, nome, aoTerminar, real) {
    this.aoTerminar = aoTerminar;
    this.real = real || null;
    this.t = 0;
    this.terminou = false;

    const cena = (this.cena = new THREE.Scene());
    cena.background = new THREE.Color(0x0b1533);
    if (Cenario.ambiente) cena.environment = Cenario.ambiente;
    this.camera = new THREE.PerspectiveCamera(58, innerWidth / innerHeight, 0.1, 100);

    cena.add(new THREE.HemisphereLight(0xfff1dd, 0x334466, 0.8));
    const luz = new THREE.SpotLight(0xfff4e0, 1.2, 40, 0.8, 0.5);
    luz.position.set(0, 8, 2);
    luz.target.position.set(0, 0.8, 0);
    luz.castShadow = true;
    luz.shadow.mapSize.setScalar(CELULAR ? 512 : 2048);
    cena.add(luz, luz.target);

    this.montarSala();
    this.decorar();

    // mesa comprida de madeira escura
    const tampo = caixa(1.8, 0.08, 6.2, 0x4a2f1d);
    tampo.position.set(0, 0.78, -1);
    cena.add(tampo);
    for (const [x, z] of [[-0.75, -3.8], [0.75, -3.8], [-0.75, 1.8], [0.75, 1.8]]) {
      const pe = caixa(0.1, 0.78, 0.1, 0x2b1b10);
      pe.position.set(x, 0.39, z);
      cena.add(pe);
    }
    for (const [x, z] of [[-0.5, -2], [0.5, -2], [-0.5, 0], [0.5, 0], [0, -3.4]]) {
      const papel = caixa(0.3, 0.01, 0.4, 0xf8fafc);
      papel.position.set(x, 0.83, z);
      const copo = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.14, 10), new THREE.MeshStandardMaterial({ color: 0xdbeafe, transparent: true, opacity: 0.5 }));
      copo.position.set(x + 0.2, 0.9, z - 0.15);
      cena.add(papel, copo);
    }

    // diretores sentados nas laterais (conversando; depois aplaudem) e a cadeira vazia da CEO
    this.diretores = [];
    this.sentar(-1.35, -2, -Math.PI / 2);
    this.sentar(-1.35, 0, -Math.PI / 2);
    this.sentar(1.35, -2, Math.PI / 2);
    this.sentar(1.35, 0, Math.PI / 2);
    this.sentar(0, -4.2, Math.PI, true);

    // A CEO em pé, no pé da mesa, virada na diagonal para o jogador e para a câmera
    this.ceoReal = Modelos.criarJa('ceo', 'parado');
    this.ceo = this.ceoReal
      ? this.ceoReal.grupo
      : criarPersonagem(Object.assign({}, PERSONAGENS[3], { camisa: 0x111827 }), { mochila: false });
    this.ceo.position.set(1.15, 0, 3.0);
    this.ceo.rotation.y = (Math.PI * 3) / 4;
    cena.add(this.ceo);

    // jogador entrando pela porta, no fundo da sala
    this.jogador = this.real ? this.real.grupo : criarPersonagem(def, { mochila: false });
    this.jogador.rotation.set(0, 0, 0);
    this.jogador.position.set(0, 0, 9.5);
    cena.add(this.jogador);

    // placa de DIRETOR(A), começa na mão da CEO
    this.placa = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.21, 0.025), new THREE.MeshBasicMaterial({ map: texturaPlacaDiretor(def, nome) }));
    if (this.ceoReal) {
      this.ceoReal.prenderNoOsso('RightHand', this.placa, new THREE.Vector3(0, 0.12, 0.05));
    } else {
      this.placa.position.copy(this.maoDaCeo());
      cena.add(this.placa);
    }

    this.criarConfete();
    cena.traverse((o) => {
      if (o.isMesh && !this.confete.includes(o)) {
        o.receiveShadow = true;
        o.castShadow = !o.isSkinnedMesh;
      }
    });
    Sons.tocarArquivo('applause', 0.5);
    Sons.carregar('final2');
  }

  maoDaCeo() {
    if (this.ceoReal) return this.ceoReal.posicaoDoOsso('RightHand');
    this.ceo.updateMatrixWorld(true);
    return this.ceo.userData.bracoD.localToWorld(new THREE.Vector3(0, -0.62, 0));
  }

  montarSala() {
    const c = this.cena;
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(10, 22), new THREE.MeshStandardMaterial({ color: 0x2a3140, roughness: 0.9 }));
    piso.rotation.x = -Math.PI / 2;
    c.add(piso);
    const tapete = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 7), new THREE.MeshLambertMaterial({ color: 0x7f1d1d }));
    tapete.rotation.x = -Math.PI / 2;
    tapete.position.set(0, 0.01, 6.2);
    c.add(tapete);
    for (const x of [-4.5, 4.5]) {
      const parede = caixa(0.2, 4.2, 22, 0x4a382c);
      parede.position.set(x, 2.1, 0);
      c.add(parede);
    }
    // janelão no fundo com a cidade à noite
    const cidade = new THREE.Mesh(new THREE.PlaneGeometry(22, 11), new THREE.MeshBasicMaterial({ map: texturaCidade(true), transparent: true }));
    cidade.position.set(0, 0.5, -16);
    c.add(cidade);
    for (const x of [-4.5, -1.5, 1.5, 4.5]) {
      const montante = caixa(0.12, 4.2, 0.12, 0x111827);
      montante.position.set(x, 2.1, -7);
      c.add(montante);
    }
    const viga = caixa(9, 0.3, 0.2, 0x111827);
    viga.position.set(0, 4.1, -7);
    const teto = new THREE.Mesh(new THREE.PlaneGeometry(10, 22), new THREE.MeshLambertMaterial({ color: 0x1f2329 }));
    teto.rotation.x = Math.PI / 2;
    teto.position.set(0, 4.2, 0);
    const lustre = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 4.5), new THREE.MeshBasicMaterial({ color: 0xfff4d6 }));
    lustre.position.set(0, 4.1, -1);
    c.add(viga, teto, lustre);
    // placas nas paredes (aparecem na cena final, atrás do jogador)
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.6), new THREE.MeshBasicMaterial({
      map: criarTexturaTexto('CONSELHO DE ADMINISTRAÇÃO', { largura: 768, altura: 170, fundo: '#111827', cor: '#facc15', borda: '#facc15' }),
    }));
    placa.position.set(-4.32, 2.9, -1);
    placa.rotation.y = Math.PI / 2;
    c.add(placa);
    // quadros de "resultados" na parede direita
    for (const z of [-3, 1]) {
      const quadro = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.9), new THREE.MeshBasicMaterial({ map: texturaTelaGrafico() }));
      quadro.position.set(4.32, 2.4, z);
      quadro.rotation.y = -Math.PI / 2;
      c.add(quadro);
    }
  }

  // Decoração: painéis de madeira, estante com livros e troféus, aparador com globo,
  // quadros, arandelas, pendentes sobre a mesa, tapete, notebooks, plantas e relógio.
  decorar() {
    const c = this.cena;
    const moveis = Cenario.moveis || {};
    const add = (obj, x, y, z, giro = 0) => {
      obj.position.set(x, y, z);
      obj.rotation.y = giro;
      c.add(obj);
      return obj;
    };
    const madeira = 0x6b4226;

    // painéis de madeira nas paredes laterais (ripas verticais + rodapé + faixa dourada)
    for (const lado of [-1, 1]) {
      const x = lado * 4.38;
      add(caixa(0.04, 1.1, 22, 0x4a2c17), x, 0.55, 0);
      add(caixa(0.05, 0.05, 22, 0xd4a017), x, 1.12, 0);
      for (let z = -10; z <= 10; z += 0.6) add(caixa(0.03, 2.9, 0.08, 0x5a3a20), x - lado * 0.01, 2.6, z);
    }

    // tapete grande embaixo da mesa (azul-marinho com borda dourada)
    const borda = new THREE.Mesh(new THREE.PlaneGeometry(5.2, 8.6), new THREE.MeshLambertMaterial({ color: 0xb8860b }));
    borda.rotation.x = -Math.PI / 2;
    add(borda, 0, 0.005, -1);
    const tapete = new THREE.Mesh(new THREE.PlaneGeometry(4.9, 8.3), new THREE.MeshLambertMaterial({ color: 0x1e2a5a }));
    tapete.rotation.x = -Math.PI / 2;
    add(tapete, 0, 0.008, -1);

    // estante com livros e troféus (parede esquerda)
    const estante = new THREE.Group();
    const peca = (obj, x, y, z) => {
      obj.position.set(x, y, z);
      estante.add(obj);
    };
    peca(caixa(0.05, 2.6, 2.4, madeira), -0.2, 1.3, 0); // fundo
    peca(caixa(0.45, 2.6, 0.06, madeira), 0, 1.3, -1.2); // laterais
    peca(caixa(0.45, 2.6, 0.06, madeira), 0, 1.3, 1.2);
    peca(caixa(0.45, 0.06, 2.46, madeira), 0, 2.6, 0); // topo
    const coresLivros = [0x991b1b, 0x1e3a8a, 0x166534, 0x92400e, 0x4c1d95, 0x0f172a, 0xb45309];
    for (let prat = 0; prat < 4; prat++) {
      const y = 0.25 + prat * 0.62;
      peca(caixa(0.45, 0.04, 2.34, 0x3b2412), 0, y, 0);
      let z = -1.05;
      while (z < 1.0) {
        if (prat === 2 && z > -0.3 && z < 0.4) { z += 0.7; continue; } // espaço do troféu
        const larg = 0.05 + Math.random() * 0.05;
        const alt = 0.32 + Math.random() * 0.18;
        const livro = caixa(0.3, alt, larg, coresLivros[Math.floor(Math.random() * coresLivros.length)]);
        livro.position.set(0.05, y + 0.02 + alt / 2, z);
        estante.add(livro);
        z += larg + 0.01;
      }
    }
    // troféu dourado na prateleira do meio
    const ouro = new THREE.MeshStandardMaterial({ color: 0xd4a017, metalness: 0.9, roughness: 0.25 });
    const taca = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.06, 0.24, 20), ouro);
    taca.position.set(0.05, 1.79 + 0.3, 0.05);
    const haste = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.14, 10), ouro);
    haste.position.set(0.05, 1.79 + 0.12, 0.05);
    const pe = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.06, 16), ouro);
    pe.position.set(0.05, 1.79 + 0.03, 0.05);
    estante.add(taca, haste, pe);
    add(estante, -4.1, 0, -4.4);

    // aparador embaixo do janelão com globo e vasos
    add(caixa(5, 0.75, 0.55, madeira), 0, 0.38, -6.55);
    const globo = new THREE.Mesh(new THREE.SphereGeometry(0.22, 24, 16), new THREE.MeshStandardMaterial({ color: 0x2563eb, roughness: 0.4 }));
    add(globo, -1.6, 1.1, -6.55);
    const anel = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.012, 8, 32), ouro);
    anel.rotation.x = 0.4;
    add(anel, -1.6, 1.1, -6.55);
    add(new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.08, 0.22, 12), ouro), -1.6, 0.86, -6.55);
    for (const x of [0.4, 1.9]) {
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.09, 0.32, 16), new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.2 })), x, 0.91, -6.55);
      add(new THREE.Mesh(new THREE.SphereGeometry(0.2, 12, 10), new THREE.MeshStandardMaterial({ color: 0x15803d })), x, 1.18, -6.55);
    }

    // plantas grandes nos cantos (3D realista se o móvel já baixou)
    for (const [x, z] of [[-3.8, -6.3], [3.8, -6.3], [-3.8, 6.5], [3.8, 6.5]]) {
      if (moveis.planta2) add(moveis.planta2.clone(), x, 0, z);
      else {
        add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.6, 14), new THREE.MeshStandardMaterial({ color: 0x1e293b })), x, 0.3, z);
        add(new THREE.Mesh(new THREE.SphereGeometry(0.55, 14, 10), new THREE.MeshStandardMaterial({ color: 0x166534 })), x, 1.15, z);
      }
    }

    // quadros na parede esquerda e direita (pinturas abstratas com moldura dourada)
    const pintura = (cores) => {
      const cv = document.createElement('canvas');
      cv.width = 256;
      cv.height = 180;
      const g = cv.getContext('2d');
      g.fillStyle = cores[0];
      g.fillRect(0, 0, 256, 180);
      for (let i = 0; i < 9; i++) {
        g.fillStyle = cores[1 + (i % (cores.length - 1))];
        g.globalAlpha = 0.75;
        g.beginPath();
        g.arc(Math.random() * 256, Math.random() * 180, 20 + Math.random() * 50, 0, 7);
        g.fill();
      }
      return new THREE.CanvasTexture(cv);
    };
    const quadro = (x, z, giro, cores) => {
      const g = new THREE.Group();
      g.add(caixa(0.05, 1.0, 1.35, 0xb8860b));
      const tela = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.85), new THREE.MeshBasicMaterial({ map: pintura(cores) }));
      tela.rotation.y = giro > 0 ? Math.PI / 2 : -Math.PI / 2;
      tela.position.x = giro > 0 ? 0.03 : -0.03;
      g.add(tela);
      add(g, x, 2.5, z);
    };
    quadro(-4.33, 2.6, 1, ['#0f172a', '#facc15', '#3b82f6', '#ef4444']);
    quadro(-4.33, 5.6, 1, ['#fef3c7', '#1e3a8a', '#b45309', '#15803d']);
    quadro(4.33, 4.6, -1, ['#1e293b', '#f472b6', '#22d3ee', '#facc15']);

    // arandelas (luz de parede) e relógio
    for (const [x, z] of [[-4.3, 0.8], [-4.3, 4.1], [4.3, -1], [4.3, 3]]) {
      const lado = x < 0 ? 1 : -1;
      add(caixa(0.06, 0.25, 0.14, 0xd4a017), x, 2.9, z);
      add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 12, 10), new THREE.MeshBasicMaterial({ color: 0xffe7a3 })), x + lado * 0.1, 3.05, z);
      const luz = new THREE.PointLight(0xffd59a, 0.35, 4);
      luz.position.set(x + lado * 0.3, 3, z);
      c.add(luz);
    }
    if (moveis.relogio) add(moveis.relogio.clone(), 4.38, 3.2, 6.2, -Math.PI / 2);

    // pendentes sobre a mesa (luz quente)
    for (const z of [-3, -1, 1]) {
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 1.0, 6), new THREE.MeshBasicMaterial({ color: 0x111111 })), 0, 3.7, z);
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.32, 0.28, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x111827, side: THREE.DoubleSide, metalness: 0.6, roughness: 0.3 })), 0, 3.1, z);
      add(new THREE.Mesh(new THREE.SphereGeometry(0.09, 12, 10), new THREE.MeshBasicMaterial({ color: 0xfff1c1 })), 0, 3.0, z);
    }

    // notebooks e garrafas d'água na mesa
    for (const [x, z, giro] of [[-0.55, -2, Math.PI / 2], [0.55, -2, -Math.PI / 2], [-0.55, 0, Math.PI / 2], [0.55, 0, -Math.PI / 2], [0, -3.75, 0]]) {
      const note = new THREE.Group();
      note.add(caixa(0.34, 0.02, 0.24, 0x9ca3af));
      const tela = caixa(0.34, 0.22, 0.015, 0x1f2937);
      tela.position.set(0, 0.11, -0.12);
      tela.rotation.x = -0.25;
      note.add(tela);
      add(note, x * 0.75, 0.83, z + 0.25, giro);
    }
    for (const z of [-3, -1, 1]) {
      add(new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.24, 12), new THREE.MeshStandardMaterial({ color: 0xbfdbfe, transparent: true, opacity: 0.6, roughness: 0.1 })), 0, 0.94, z);
    }

    // logotipo da empresa na parede direita, perto da porta
    const logo = new THREE.Mesh(new THREE.PlaneGeometry(2.2, 0.7), new THREE.MeshBasicMaterial({
      map: criarTexturaTexto('★ EMPRESA S.A. ★', { largura: 768, altura: 240, fundo: '#0b1533', cor: '#facc15', borda: '#d4a017' }),
    }));
    add(logo, 4.32, 2.9, 7.6, -Math.PI / 2);
  }

  // Cadeira com alguém sentado (realista, se já baixou; senão, boneco de blocos)
  sentar(x, z, giro, vazia = false) {
    const cadeira = caixa(0.6, 0.5, 0.6, 0x111827);
    cadeira.position.set(x, 0.25, z);
    const encosto = caixa(0.6, 0.8, 0.1, 0x111827);
    encosto.position.set(x + Math.sin(giro) * 0.3, 0.85, z + Math.cos(giro) * 0.3);
    encosto.rotation.y = giro;
    this.cena.add(cadeira, encosto);
    if (vazia) return;
    const real = Modelos.criarJa(null, 'sentado-conversando');
    let pessoa;
    if (real) {
      pessoa = real.grupo;
    } else {
      const base = PERSONAGENS[Math.floor(Math.random() * PERSONAGENS.length)];
      pessoa = criarPersonagem(Object.assign({}, base, { camisa: 0x1f2937 }), { mochila: false });
      pessoa.scale.setScalar(0.85);
      pessoa.position.y = -0.08;
      pessoa.userData.pernaE.rotation.x = pessoa.userData.pernaD.rotation.x = Math.PI / 2;
      pessoa.userData.fase = Math.random() * 6;
    }
    pessoa.position.x = x;
    pessoa.position.z = z;
    pessoa.rotation.y = giro;
    this.cena.add(pessoa);
    this.diretores.push(pessoa);
  }

  criarConfete() {
    this.confete = [];
    const cores = [0xfacc15, 0xd4a017, 0xffffff, 0x3b82f6];
    const geo = new THREE.PlaneGeometry(0.12, 0.08);
    for (let i = 0; i < (CELULAR ? 90 : 200); i++) {
      const p = new THREE.Mesh(geo, new THREE.MeshBasicMaterial({ color: cores[i % cores.length], side: THREE.DoubleSide }));
      p.position.set((Math.random() - 0.5) * 8, 4.2 + Math.random() * 4, -4 + Math.random() * 11);
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

    // 1) Entra pela porta até o pé da mesa (0 a 4,6 s)
    if (t < 4.6) {
      j.position.z = 9.5 + (3.3 - 9.5) * progresso(t, 0, 4.6);
      if (this.real) {
        this.real.tocar('correr');
        this.real.velocidade(0.5);
      } else animarCorrida(j, t * 7, 0.5);
    } else if (this.real) {
      if (t < 8.6) this.real.tocar('parado');
    } else if (t < 8.6) animarCorrida(j, 0, 0);
    if (this.real) this.real.atualizar(dt);
    if (this.ceoReal) this.ceoReal.atualizar(dt);

    // 2) Vira para a CEO e recebe a placa (4,6 a 8,6 s)
    if (t >= 4.6 && t < 8.6) j.rotation.y = (-Math.PI / 4) * suave(progresso(t, 4.6, 5.1));
    if (this.real && this.ceoReal && t >= 4.6 && t < 8.6) {
      const encontro = this.real.posicaoDoOsso('RightArm').add(this.ceoReal.posicaoDoOsso('RightArm')).multiplyScalar(0.5);
      encontro.y -= 0.05;
      const braco = suave(progresso(t, 5.2, 5.8)) * (1 - suave(progresso(t, 6.8, 7.4)));
      this.ceoReal.mirarBraco(encontro, braco);
      this.real.mirarBraco(encontro, braco);
      if (t >= 6.1 && this.placa.parent !== this.real.modelo.getObjectByName('RightHand')) {
        this.real.prenderNoOsso('RightHand', this.placa, new THREE.Vector3(0, 0.12, 0.05));
      }
    } else if (t >= 4.6 && t < 8.6) {
      // bonecos de blocos (ou só um realista): a placa vai da mão da CEO para a do jogador
      if (!this.ceoReal) this.ceo.userData.bracoD.rotation.x = t < 7 ? 1.3 * progresso(t, 5.0, 5.5) : 0;
      if (!this.real) jp.bracoD.rotation.x = 1.3 * progresso(t, 5.3, 5.7);
      if (!this.placaEntregue) {
        const mao = this.real ? this.real.posicaoDoOsso('RightHand') : jp.bracoD.localToWorld(new THREE.Vector3(0, -0.62, 0));
        if (this.placa.parent !== this.cena) {
          // estava presa na mão da CEO realista: solta na cena, na mesma posição
          const p = this.maoDaCeo();
          this.placa.parent.remove(this.placa);
          this.placa.scale.setScalar(1);
          this.cena.add(this.placa);
          this.placa.position.copy(p);
        }
        const k = suave(progresso(t, 5.6, 6.8));
        this.placa.position.lerpVectors(this.maoDaCeo(), mao, k);
        if (k >= 1) {
          this.placaEntregue = true;
          if (this.real) this.real.prenderNoOsso('RightHand', this.placa, new THREE.Vector3(0, 0.12, 0.05));
          else {
            jp.bracoD.add(this.placa);
            this.placa.position.set(0, -0.62, -0.08);
          }
        }
      }
    }

    // 3) Os diretores aplaudem (a partir da entrega)
    if (t >= 6.4 && !this.aplausos) {
      this.aplausos = true;
      Sons.tocarArquivo('applause', 0.9);
      for (const d of this.diretores) if (d.userData.real) d.userData.real.tocar('aplaudir-sentado', 0.4);
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
      for (const p of this.confete) p.visible = true;
    }

    for (const d of this.diretores) {
      if (d.userData.real) {
        d.userData.real.atualizar(dt);
      } else if (this.aplausos) {
        const bate = Math.sin(t * 14 + d.userData.fase) * 0.25;
        d.userData.bracoE.rotation.set(1.2, 0, -0.5 + bate);
        d.userData.bracoD.rotation.set(1.2, 0, 0.5 - bate);
      }
    }
    for (const p of this.confete) {
      if (!p.visible) continue;
      p.position.y -= p.userData.vel * dt;
      p.rotation.x += dt * 4;
      p.rotation.y += dt * 3;
      if (p.position.y < 0) p.position.y = 4.1;
    }

    // Câmera: atrás do jogador entrando; por cima do ombro olhando a CEO;
    // no fim, atrás dele de novo, com a mesa e o conselho ao fundo
    const seguir = new THREE.Vector3(0, 2.4, j.position.z + 4.5);
    const olharSeguir = new THREE.Vector3(0, 1.3, j.position.z - 4);
    const ombro = new THREE.Vector3(-0.5, 2.1, 6.1);
    const olharOmbro = new THREE.Vector3(0.7, 1.45, 2.8);
    const final = new THREE.Vector3(0.4, 2.1, 7.4);
    const olharFinal = new THREE.Vector3(0.2, 1.3, 1.0);
    const k1 = suave(progresso(t, 4.0, 5.4));
    const k2 = suave(progresso(t, 8.6, 10.2));
    this.camera.position.lerpVectors(seguir, ombro, k1).lerp(final, k2);
    this.camera.lookAt(new THREE.Vector3().lerpVectors(olharSeguir, olharOmbro, k1).lerp(olharFinal, k2));

    if (t > 11.2 && !this.terminou) {
      this.terminou = true;
      this.aoTerminar();
    }
  }
}
