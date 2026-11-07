// O corredor da faculdade.
// Truque do "corredor infinito": criamos só 8 pedaços (segmentos). Quando um pedaço
// fica para trás do jogador, ele é levado para a frente da fila e reaproveitado.

const LARGURA_CORREDOR = 8;
const ALTURA_CORREDOR = 4.2;
const TAM_SEGMENTO = 16;
const NUM_SEGMENTOS = 8;

class Corredor {
  constructor(cena) {
    this.cena = cena;
    this.texturaPiso = this.criarTexturaPiso();
    this.texturaArmario = this.criarTexturaArmario();
    this.placas = {};
    // Dois cenários: o corredor da faculdade (fase 1) e o da empresa (fase 2).
    // Os dois ficam prontos; só o tema escolhido fica visível.
    this.temas = { faculdade: [], empresa: [] };
    for (let i = 0; i < NUM_SEGMENTOS; i++) {
      this.temas.faculdade.push(this.criarSegmento());
      this.temas.empresa.push(this.criarSegmentoEmpresa());
    }
    for (const seg of [...this.temas.faculdade, ...this.temas.empresa]) cena.add(seg);
    this.usarTema('faculdade');
  }

  usarTema(nome) {
    this.tema = nome;
    for (const [tema, segmentos] of Object.entries(this.temas)) {
      segmentos.forEach((seg) => (seg.visible = tema === nome));
    }
    this.segmentos = this.temas[nome];
    this.reiniciar();
  }

  reiniciar() {
    this.proximaSala = this.tema === 'empresa' ? 201 : 101;
    this.segmentos.forEach((seg, i) => {
      seg.position.z = TAM_SEGMENTO / 2 - i * TAM_SEGMENTO;
      this.numerarSalas(seg);
    });
  }

  // Chamado a cada quadro: recicla os segmentos que ficaram para trás.
  atualizar(zJogador) {
    for (const seg of this.segmentos) {
      if (seg.position.z - TAM_SEGMENTO / 2 > zJogador + 10) {
        seg.position.z -= NUM_SEGMENTOS * TAM_SEGMENTO;
        this.numerarSalas(seg);
      }
    }
  }

  numerarSalas(seg) {
    seg.userData.placaE.material.map = this.texturaPlaca(this.proximaSala);
    seg.userData.placaD.material.map = this.texturaPlaca(this.proximaSala + 1);
    this.proximaSala += 2;
  }

  texturaPlaca(numero) {
    if (!this.placas[numero]) {
      this.placas[numero] = criarTexturaTexto(String(numero), {
        largura: 256, altura: 160, fundo: '#1e3a8a', cor: '#ffffff', tamanho: 110,
      });
    }
    return this.placas[numero];
  }

  // ---------- Cenário da fase 2: corredor de empresa ----------

  criarSegmentoEmpresa() {
    if (!this.pisoEmpresa) {
      const c = document.createElement('canvas');
      c.width = c.height = 256; // dobro de detalhe
      const ctx = c.getContext('2d');
      ctx.scale(2, 2); // desenha como antes, em 128x128
      ctx.fillStyle = '#9aa3b0';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = '#a9b2be';
      ctx.fillRect(6, 6, 116, 116);
      ctx.strokeStyle = '#c3cad3';
      ctx.lineWidth = 3;
      ctx.strokeRect(0, 0, 128, 128);
      this.pisoEmpresa = new THREE.CanvasTexture(c);
      this.pisoEmpresa.wrapS = this.pisoEmpresa.wrapT = THREE.RepeatWrapping;
      this.pisoEmpresa.anisotropy = 16; // nítido mesmo de longe
      this.pisoEmpresa.repeat.set(4, 8);
      this.texturaGrafico = this.criarTexturaGrafico();
    }
    const seg = new THREE.Group();

    const piso = new THREE.Mesh(
      new THREE.PlaneGeometry(LARGURA_CORREDOR, TAM_SEGMENTO),
      new THREE.MeshPhongMaterial({ map: this.pisoEmpresa, specular: 0x555566, shininess: 30 })
    );
    piso.rotation.x = -Math.PI / 2;
    piso.receiveShadow = true;
    seg.add(piso);
    for (const x of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const traco = caixa(0.1, 0.02, 2.2, 0xfacc15);
        traco.position.set(x, 0.01, -6 + k * 4);
        seg.add(traco);
      }
    }

    const teto = new THREE.Mesh(new THREE.PlaneGeometry(LARGURA_CORREDOR, TAM_SEGMENTO), new THREE.MeshLambertMaterial({ map: this.texturaTeto(), color: 0xf8fafc }));
    teto.rotation.x = Math.PI / 2;
    teto.position.y = ALTURA_CORREDOR;
    seg.add(teto);
    for (const z of [-6, -2, 2, 6]) {
      const luz = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.05, 1.2), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      luz.position.set(0, ALTURA_CORREDOR - 0.03, z);
      seg.add(luz);
    }

    this.criarLadoEmpresa(seg, -1);
    this.criarLadoEmpresa(seg, 1);
    this.adicionarSombrasDeCanto(seg);
    return seg;
  }

  // ---------- Detalhes de realismo usados pelos dois cenários ----------

  // Forro do teto em placas (como forro de escritório/escola)
  texturaTeto() {
    if (!this._teto) {
      const c = document.createElement('canvas');
      c.width = c.height = 128;
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, 128, 128);
      ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
      for (let i = 0; i < 160; i++) ctx.fillRect(Math.random() * 128, Math.random() * 128, 2, 2); // furinhos
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 4;
      ctx.strokeRect(0, 0, 128, 128);
      this._teto = new THREE.CanvasTexture(c);
      this._teto.wrapS = this._teto.wrapT = THREE.RepeatWrapping;
      this._teto.repeat.set(4, 8);
      this._teto.anisotropy = 16;
    }
    return this._teto;
  }

  // "Sombra de canto": na vida real, onde a parede encontra o chão e o teto fica mais escuro.
  // Imitamos isso com faixas em degradê (escuro perto da parede, transparente para o meio).
  adicionarSombrasDeCanto(seg) {
    if (!this._materialCanto) {
      const c = document.createElement('canvas');
      c.width = 64;
      c.height = 4;
      const ctx = c.getContext('2d');
      const grad = ctx.createLinearGradient(0, 0, 64, 0);
      grad.addColorStop(0, 'rgba(0, 0, 0, 0.38)');
      grad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 64, 4);
      this._materialCanto = new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false });
    }
    for (const lado of [-1, 1]) {
      for (const [y, giroX] of [[0.02, -Math.PI / 2], [ALTURA_CORREDOR - 0.02, Math.PI / 2]]) {
        const faixa = new THREE.Mesh(new THREE.PlaneGeometry(0.9, TAM_SEGMENTO), this._materialCanto);
        faixa.rotation.set(giroX, 0, lado > 0 ? Math.PI : 0); // escuro sempre do lado da parede
        faixa.position.set(lado * (LARGURA_CORREDOR / 2 - 0.45), y, 0);
        seg.add(faixa);
      }
    }
  }

  // Parede branca com sala de reunião de vidro, baia com computadores, gráfico e bebedouro.
  criarLadoEmpresa(seg, lado) {
    const xParede = (lado * LARGURA_CORREDOR) / 2;
    const dentro = -lado;
    const x = (dist) => xParede + dentro * dist; // posição a "dist" metros da parede

    const parede = caixa(0.2, ALTURA_CORREDOR, TAM_SEGMENTO, 0xf8fafc);
    parede.position.set(xParede + lado * 0.1, ALTURA_CORREDOR / 2, 0);
    const faixa = caixa(0.04, 0.18, TAM_SEGMENTO, 0x0f766e); // faixa na cor da empresa
    faixa.position.set(x(0.02), 3.3, 0);
    const rodape = caixa(0.06, 0.2, TAM_SEGMENTO, 0x475569);
    rodape.position.set(x(0.03), 0.1, 0);
    seg.add(parede, faixa, rodape);

    // Sala de reunião de vidro (z de -7 a -1)
    const vidro = new THREE.Mesh(
      new THREE.PlaneGeometry(6, 2.6),
      new THREE.MeshLambertMaterial({ color: 0x9fd3f5, transparent: true, opacity: 0.45, side: THREE.DoubleSide })
    );
    vidro.position.set(x(0.9), 1.3, -4);
    vidro.rotation.y = Math.PI / 2;
    seg.add(vidro);
    for (const z of [-7, -5, -3, -1]) {
      const poste = caixa(0.08, 2.6, 0.08, 0x475569);
      poste.position.set(x(0.9), 1.3, z);
      seg.add(poste);
    }
    const viga = caixa(0.08, 0.1, 6, 0x475569);
    viga.position.set(x(0.9), 2.6, -4);
    const mesa = caixa(0.55, 0.75, 2.4, 0xe5e7eb);
    mesa.position.set(x(0.4), 0.375, -4);
    seg.add(viga, mesa);
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.38), new THREE.MeshBasicMaterial());
    placa.position.set(x(0.02), 3.0, -4);
    placa.rotation.y = dentro * (Math.PI / 2);
    seg.add(placa);
    seg.userData[lado < 0 ? 'placaE' : 'placaD'] = placa;

    // Baia aberta para o corredor (z de 1 a 4)
    const mesaBaia = caixa(0.7, 0.75, 2.8, 0xe2e8f0);
    mesaBaia.position.set(x(0.4), 0.375, 2.5);
    seg.add(mesaBaia);
    for (const z of [0.95, 4.05]) {
      const divisoria = caixa(1.0, 1.25, 0.06, 0x64748b);
      divisoria.position.set(x(0.5), 0.625, z);
      seg.add(divisoria);
    }
    for (const z of [1.8, 3.2]) {
      const monitor = caixa(0.06, 0.42, 0.62, 0x111827);
      monitor.position.set(x(0.45), 1.0, z);
      const tela = new THREE.Mesh(new THREE.PlaneGeometry(0.56, 0.36), new THREE.MeshBasicMaterial({ color: 0x38bdf8 }));
      tela.position.set(x(0.485), 1.0, z);
      tela.rotation.y = dentro * (Math.PI / 2);
      seg.add(monitor, tela);
    }
    const cadeira = caixa(0.45, 0.9, 0.45, 0x1f2937);
    cadeira.position.set(x(1.0), 0.45, 2.5);
    seg.add(cadeira);

    // Quadro com gráfico de barras na parede, acima da baia
    const grafico = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 1.0), new THREE.MeshBasicMaterial({ map: this.texturaGrafico }));
    grafico.position.set(x(0.02), 2.2, 2.5);
    grafico.rotation.y = dentro * (Math.PI / 2);
    seg.add(grafico);

    // Bebedouro
    const base = caixa(0.4, 1.0, 0.4, 0xe5e7eb);
    base.position.set(x(0.3), 0.5, 6.3);
    const galao = new THREE.Mesh(
      new THREE.CylinderGeometry(0.17, 0.17, 0.45, 14),
      new THREE.MeshLambertMaterial({ color: 0x60a5fa, transparent: true, opacity: 0.8 })
    );
    galao.position.set(x(0.3), 1.25, 6.3);
    seg.add(base, galao);
  }

  criarTexturaGrafico() {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 160;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 160);
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 248, 152);
    ['#38bdf8', '#22c55e', '#facc15', '#f97316', '#0f766e'].forEach((cor, i) => {
      const altura = 25 + i * 20;
      ctx.fillStyle = cor;
      ctx.fillRect(30 + i * 42, 140 - altura, 28, altura);
    });
    ctx.strokeStyle = '#16a34a';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(30, 110);
    ctx.lineTo(225, 25);
    ctx.stroke();
    return new THREE.CanvasTexture(c);
  }

  criarTexturaPiso() {
    const c = document.createElement('canvas');
    c.width = c.height = 256; // dobro de detalhe
    const ctx = c.getContext('2d');
    ctx.scale(2, 2); // desenha como antes, em 128x128
    ctx.fillStyle = '#8b91e3';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#9ba1ec';
    ctx.fillRect(8, 8, 112, 112);
    ctx.strokeStyle = '#c3c6f5';
    ctx.lineWidth = 4;
    ctx.strokeRect(0, 0, 128, 128);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 16; // nítido mesmo de longe
    t.repeat.set(4, 8);
    return t;
  }

  // Uma imagem de UM armário; ela se repete 6 vezes ao longo da fileira.
  criarTexturaArmario() {
    const c = document.createElement('canvas');
    c.width = 128;
    c.height = 512;
    const ctx = c.getContext('2d');
    ctx.fillStyle = '#2563eb';
    ctx.fillRect(0, 0, 128, 512);
    ctx.strokeStyle = '#1e3a8a';
    ctx.lineWidth = 8;
    ctx.strokeRect(4, 4, 120, 504);
    ctx.fillStyle = '#1e40af';
    for (let i = 0; i < 5; i++) ctx.fillRect(30, 50 + i * 16, 68, 7);
    ctx.fillStyle = '#d1d5db';
    ctx.fillRect(96, 230, 12, 50);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 16; // nítido mesmo de longe
    t.repeat.set(6, 1);
    return t;
  }

  criarSegmento() {
    const seg = new THREE.Group();

    const piso = new THREE.Mesh(
      new THREE.PlaneGeometry(LARGURA_CORREDOR, TAM_SEGMENTO),
      // Phong = material com brilho (o piso parece encerado e reflete a luz)
      new THREE.MeshPhongMaterial({ map: this.texturaPiso, specular: 0x8888aa, shininess: 70 })
    );
    piso.rotation.x = -Math.PI / 2;
    piso.receiveShadow = true;
    seg.add(piso);

    // Linhas tracejadas que separam as 3 faixas
    for (const x of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const traco = caixa(0.1, 0.02, 2.2, 0xffffff);
        traco.position.set(x, 0.01, -6 + k * 4);
        seg.add(traco);
      }
    }

    const teto = new THREE.Mesh(
      new THREE.PlaneGeometry(LARGURA_CORREDOR, TAM_SEGMENTO),
      new THREE.MeshLambertMaterial({ map: this.texturaTeto(), color: 0xf4f1ea })
    );
    teto.rotation.x = Math.PI / 2;
    teto.position.y = ALTURA_CORREDOR;
    seg.add(teto);
    for (const z of [-4, 4]) {
      const luz = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.05, 0.7), new THREE.MeshBasicMaterial({ color: 0xffffff }));
      luz.position.set(0, ALTURA_CORREDOR - 0.03, z);
      seg.add(luz);
    }

    this.criarLado(seg, -1);
    this.criarLado(seg, 1);
    this.adicionarSombrasDeCanto(seg);
    return seg;
  }

  // Monta uma parede com armários, mural, porta numerada e planta.
  // lado = -1 (esquerda) ou 1 (direita)
  criarLado(seg, lado) {
    const xParede = (lado * LARGURA_CORREDOR) / 2;
    const dentro = -lado; // direção que aponta para o meio do corredor

    const parede = caixa(0.2, ALTURA_CORREDOR, TAM_SEGMENTO, 0xf3ead8);
    parede.position.set(xParede + lado * 0.1, ALTURA_CORREDOR / 2, 0);
    const rodape = caixa(0.06, 0.25, TAM_SEGMENTO, 0x1e3a8a);
    rodape.position.set(xParede + dentro * 0.03, 0.125, 0);
    // barrado: metade de baixo da parede pintada em azul-acinzentado, com friso
    const barrado = caixa(0.04, 1.1, TAM_SEGMENTO, 0xdbe3f0);
    barrado.position.set(xParede + dentro * 0.02, 0.55, 0);
    const friso = caixa(0.07, 0.06, TAM_SEGMENTO, 0x94a3b8);
    friso.position.set(xParede + dentro * 0.035, 1.1, 0);
    seg.add(parede, rodape, barrado, friso);

    const armarios = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 2.3, 6),
      new THREE.MeshLambertMaterial({ map: this.texturaArmario })
    );
    armarios.position.set(xParede + dentro * 0.25, 1.15, -4);
    seg.add(armarios);

    // Mural de avisos com bilhetes coloridos
    const mural = caixa(0.06, 1.0, 1.4, 0xc8915a);
    mural.position.set(xParede + dentro * 0.03, 1.8, 0.6);
    seg.add(mural);
    const coresBilhete = [0xfde047, 0xf9a8d4, 0x86efac, 0xffffff];
    coresBilhete.forEach((cor, i) => {
      const bilhete = caixa(0.02, 0.25, 0.25, cor);
      bilhete.position.set(xParede + dentro * 0.07, 1.6 + (i % 2) * 0.4, 0.2 + i * 0.27);
      seg.add(bilhete);
    });

    // Porta da sala
    const batente = caixa(0.12, 2.8, 1.6, 0x8b5a2b);
    batente.position.set(xParede + dentro * 0.06, 1.4, 3);
    const porta = caixa(0.1, 2.6, 1.3, 0xb7793e);
    porta.position.set(xParede + dentro * 0.1, 1.3, 3);
    const janela = caixa(0.02, 0.6, 0.4, 0xbfe3ff);
    janela.position.set(xParede + dentro * 0.16, 1.9, 3);
    const macaneta = caixa(0.06, 0.06, 0.2, 0xd1d5db);
    macaneta.position.set(xParede + dentro * 0.17, 1.3, 3 - 0.45);
    seg.add(batente, porta, janela, macaneta);

    const placa = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.38), new THREE.MeshBasicMaterial());
    placa.position.set(xParede + dentro * 0.02, 3.1, 3);
    placa.rotation.y = dentro * (Math.PI / 2);
    seg.add(placa);
    seg.userData[lado < 0 ? 'placaE' : 'placaD'] = placa;

    // Vaso com planta
    const vaso = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.24, 0.6, 12), new THREE.MeshLambertMaterial({ color: 0x6b7280 }));
    vaso.position.set(xParede + dentro * 0.5, 0.3, 6.3);
    seg.add(vaso);
    // planta mais cheia, com folhas em tons diferentes de verde
    [[0, 0.95, 0, 0.4, 0x2f9e44], [0.15, 1.3, 0.1, 0.3, 0x40c057], [-0.15, 1.25, -0.1, 0.3, 0x2b8a3e],
      [0.2, 1.05, -0.15, 0.25, 0x37b24d], [-0.18, 1.05, 0.15, 0.25, 0x2f9e44], [0, 1.5, 0, 0.22, 0x51cf66]]
      .forEach(([dx, y, dz, r, cor]) => {
      const folha = new THREE.Mesh(new THREE.IcosahedronGeometry(r, 1), new THREE.MeshLambertMaterial({ color: cor, flatShading: true }));
      folha.position.set(xParede + dentro * 0.5 + dx, y, 6.3 + dz);
      seg.add(folha);
    });
  }
}
