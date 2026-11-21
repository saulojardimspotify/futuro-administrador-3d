// Fim da fase 3: reunião com o conselho, numa sala com janelão para a cidade à noite.
// A CEO fica na cabeceira, os diretores nas laterais e o jogador em pé, na outra ponta.
// As perguntas aparecem na tela (tela-conselho, em main.js); aqui fica só a cena 3D.

class Conselho {
  constructor(def, real) {
    this.real = real || null;
    const cena = (this.cena = new THREE.Scene());
    cena.background = new THREE.Color(0x0b1533);
    if (Cenario.ambiente) cena.environment = Cenario.ambiente;
    this.camera = new THREE.PerspectiveCamera(55, innerWidth / innerHeight, 0.1, 100);

    cena.add(new THREE.HemisphereLight(0xfff1dd, 0x223355, 0.55));
    const luz = new THREE.SpotLight(0xfff4e0, 1.1, 30, 0.7, 0.5);
    luz.position.set(0, 7, 0);
    luz.target.position.set(0, 0.8, -1);
    luz.castShadow = true;
    luz.shadow.mapSize.setScalar(CELULAR ? 512 : 1024);
    cena.add(luz, luz.target);

    this.montarSala();

    // mesa comprida de madeira escura
    const tampo = caixa(1.8, 0.08, 6.2, 0x4a2f1d);
    tampo.position.set(0, 0.78, -1);
    cena.add(tampo);
    for (const [x, z] of [[-0.75, -3.8], [0.75, -3.8], [-0.75, 1.8], [0.75, 1.8]]) {
      const pe = caixa(0.1, 0.78, 0.1, 0x2b1b10);
      pe.position.set(x, 0.39, z);
      cena.add(pe);
    }
    // papéis e copos na mesa
    for (const [x, z] of [[-0.5, -2], [0.5, -2], [-0.5, 0], [0.5, 0], [0, -3.4]]) {
      const papel = caixa(0.3, 0.01, 0.4, 0xf8fafc);
      papel.position.set(x, 0.83, z);
      const copo = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.04, 0.14, 10), new THREE.MeshStandardMaterial({ color: 0xdbeafe, transparent: true, opacity: 0.5 }));
      copo.position.set(x + 0.2, 0.9, z - 0.15);
      cena.add(papel, copo);
    }

    // A CEO na cabeceira, de frente para o jogador; diretores nas laterais, virados para a mesa
    this.figurantes = [];
    this.sentar('ceo', 'sentado-parado', 0, -4.2, Math.PI, def);
    this.sentar(null, 'sentado-conversando', -1.35, -2, -Math.PI / 2);
    this.sentar(null, 'sentado-conversando', -1.35, 0, -Math.PI / 2);
    this.sentar(null, 'sentado-conversando', 1.35, -2, Math.PI / 2);
    this.sentar(null, 'sentado-conversando', 1.35, 0, Math.PI / 2);

    // jogador em pé, na ponta da mesa, de frente para a CEO
    this.jogador = this.real ? this.real.grupo : criarPersonagem(def, { mochila: false });
    this.jogador.position.set(0, 0, 3.1);
    this.jogador.rotation.set(0, 0, 0);
    if (this.real) this.real.tocar('parado', 0);
    cena.add(this.jogador);

    cena.traverse((o) => {
      if (o.isMesh) {
        o.receiveShadow = true;
        o.castShadow = !o.isSkinnedMesh;
      }
    });
    this.t = 0;
  }

  montarSala() {
    const c = this.cena;
    const piso = new THREE.Mesh(new THREE.PlaneGeometry(10, 16), new THREE.MeshStandardMaterial({ color: 0x2a3140, roughness: 0.95 }));
    piso.rotation.x = -Math.PI / 2;
    piso.position.z = -1;
    c.add(piso);
    for (const x of [-4.5, 4.5]) {
      const parede = caixa(0.2, 4.2, 16, 0x3b2a20);
      parede.position.set(x, 2.1, -1);
      c.add(parede);
    }
    // janelão no fundo com a cidade à noite
    const cidade = new THREE.Mesh(new THREE.PlaneGeometry(22, 11), new THREE.MeshBasicMaterial({ map: texturaCidade(true), transparent: true }));
    cidade.position.set(0, 0.5, -14);
    c.add(cidade);
    for (const x of [-4.5, -1.5, 1.5, 4.5]) {
      const montante = caixa(0.12, 4.2, 0.12, 0x111827);
      montante.position.set(x, 2.1, -7);
      c.add(montante);
    }
    const viga = caixa(9, 0.3, 0.2, 0x111827);
    viga.position.set(0, 4.1, -7);
    const teto = new THREE.Mesh(new THREE.PlaneGeometry(10, 16), new THREE.MeshLambertMaterial({ color: 0x1f2329 }));
    teto.rotation.x = Math.PI / 2;
    teto.position.set(0, 4.2, -1);
    const lustre = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.05, 4.5), new THREE.MeshBasicMaterial({ color: 0xfff4d6 }));
    lustre.position.set(0, 4.1, -1);
    c.add(viga, teto, lustre);
    // placa da empresa na parede
    const placa = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 0.6), new THREE.MeshBasicMaterial({
      map: criarTexturaTexto('CONSELHO DE ADMINISTRAÇÃO', { largura: 768, altura: 170, fundo: '#111827', cor: '#facc15', borda: '#facc15' }),
    }));
    placa.position.set(-4.38, 2.9, -1);
    placa.rotation.y = Math.PI / 2;
    c.add(placa);
  }

  // Coloca alguém sentado numa cadeira (realista, se já baixou; senão, boneco de blocos)
  sentar(arquivo, animacao, x, z, giro) {
    const cadeira = caixa(0.6, 0.5, 0.6, 0x111827);
    cadeira.position.set(x, 0.25, z);
    const encosto = caixa(0.6, 0.8, 0.1, 0x111827);
    // o encosto fica atrás de quem senta (do lado oposto ao que a pessoa olha)
    encosto.position.set(x - Math.sin(giro) * -0.3, 0.85, z - Math.cos(giro) * -0.3);
    encosto.rotation.y = giro;
    this.cena.add(cadeira, encosto);
    const real = Modelos.criarJa(arquivo, animacao);
    let pessoa;
    if (real) {
      pessoa = real.grupo;
      this.figurantes.push(real);
    } else {
      const base = PERSONAGENS[Math.floor(Math.random() * PERSONAGENS.length)];
      pessoa = criarPersonagem(Object.assign({}, base, { camisa: 0x1f2937 }), { mochila: false });
      pessoa.scale.setScalar(0.85);
      pessoa.position.y = -0.08;
      pessoa.userData.pernaE.rotation.x = pessoa.userData.pernaD.rotation.x = Math.PI / 2;
    }
    pessoa.position.x = x;
    pessoa.position.z = z;
    pessoa.rotation.y = giro;
    this.cena.add(pessoa);
  }

  // O jogador comemora (aprovado) ou fica parado (reprovado)
  resultado(aprovado) {
    if (this.real) this.real.tocar(aprovado ? 'comemorar' : 'parado', 0.3);
  }

  atualizar(dt) {
    this.t += dt;
    if (this.real) this.real.atualizar(dt);
    this.figurantes.forEach((f) => f.atualizar(dt));
    // câmera passeando devagar atrás do jogador, olhando para a CEO
    const a = Math.sin(this.t * 0.25) * 0.6;
    this.camera.position.set(2.2 + a, 2.6, 6.2);
    this.camera.lookAt(0, 1.2, -2);
  }
}
