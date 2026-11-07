// Cenário realista (pelo site): texturas fotográficas, iluminação com reflexos e
// móveis 3D. Tudo do Poly Haven (polyhaven.com), licença CC0 (domínio público).
// Abrindo o index.html direto do computador, fica o cenário simples de antes.

const VERSAO_CENARIO = 1;

const Cenario = {
  async melhorar(renderizador, cena, corredor) {
    if (!Modelos.disponivel) return;

    // 1) Iluminação: uma "sala virtual" ilumina e dá reflexos suaves aos materiais
    if (THREE.RoomEnvironment) {
      const pmrem = new THREE.PMREMGenerator(renderizador);
      cena.environment = pmrem.fromScene(new THREE.RoomEnvironment(), 0.04).texture;
      this.ambiente = cena.environment; // o auditório usa a mesma iluminação
      // com a "sala virtual" iluminando, as outras luzes ficam mais fracas (senão estoura de claro)
      cena.traverse((o) => {
        if (o.isHemisphereLight) o.intensity = 0.35;
        if (o.isDirectionalLight) o.intensity = 0.6;
      });
    }

    // 2) Materiais com fotos reais (cor + relevo) no piso, paredes, teto, portas e armários
    const m = this.criarMateriais();
    for (const [tema, segmentos] of Object.entries(corredor.temas)) {
      const empresa = tema === 'empresa';
      segmentos.forEach((seg) => seg.traverse((o) => {
        const papel = o.userData.papel;
        if (papel === 'piso') o.material = empresa ? m.pisoEmpresa : m.pisoFaculdade;
        else if (papel === 'parede') o.material = empresa ? m.paredeEmpresa : m.paredeFaculdade;
        else if (papel === 'teto') o.material = m.teto;
        else if (papel === 'porta') o.material = m.porta;
        else if (papel === 'armario') o.material = m.armario(o.material.map);
      }));
    }

    // 3) Móveis 3D (baixam em segundo plano; o jogo não espera por eles)
    const moveis = await this.carregarMoveis();
    for (const [tema, segmentos] of Object.entries(corredor.temas)) {
      segmentos.forEach((seg) => (tema === 'empresa' ? this.mobiliarEmpresa(seg, moveis) : this.mobiliarFaculdade(seg, moveis)));
    }
  },

  textura(nome, repX, repY) {
    this.loader = this.loader || new THREE.TextureLoader();
    const t = this.loader.load(`img/texturas/${nome}.jpg?v=${VERSAO_CENARIO}`);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(repX, repY);
    t.anisotropy = 16;
    return t;
  },

  // "Standard" = material físico: reage à luz e aos reflexos como na vida real
  criarMateriais() {
    const mat = (nome, rep, opcoes) => new THREE.MeshStandardMaterial(Object.assign({
      map: this.textura(`${nome}-cor`, ...rep),
      normalMap: opcoes.semRelevo ? null : this.textura(`${nome}-relevo`, ...rep),
      metalness: 0,
    }, opcoes, { semRelevo: undefined }));
    return {
      pisoFaculdade: mat('piso-faculdade', [4, 8], { roughness: 0.35, envMapIntensity: 0.5, color: 0xb9c3d8 }),
      paredeFaculdade: mat('parede-faculdade', [8, 2], { roughness: 0.9, color: 0xfff6ea }),
      teto: mat('teto', [4, 8], { roughness: 0.9, semRelevo: true }),
      porta: mat('madeira', [1, 2], { roughness: 0.55 }),
      pisoEmpresa: mat('piso-empresa', [4, 8], { roughness: 0.45, envMapIntensity: 0.7 }),
      paredeEmpresa: mat('parede-empresa', [8, 2], { roughness: 0.9 }),
      // armário de metal pintado, com leve brilho
      armario: (mapa) => (this._armario = this._armario || new THREE.MeshStandardMaterial({ map: mapa, metalness: 0.45, roughness: 0.45 })),
    };
  },

  async carregarMoveis() {
    // Qualidade leve: só móveis leves. Qualidade alta: também a planta (70 mil triângulos!),
    // a luminária e o armário de gavetas, que são bonitos mas pesados.
    const nomes = ['banco', 'extintor', 'relogio', 'mesa-escritorio', 'cadeira-escritorio']
      .concat(QUALIDADE_ALTA ? ['planta2', 'gaveteiro', 'luminaria'] : []);
    const loader = new THREE.GLTFLoader();
    const lista = await Promise.all(nomes.map((n) =>
      loader.loadAsync(`modelos/glb/movel-${n}.glb?v=${VERSAO_CENARIO}`).catch(() => null)));
    const moveis = {};
    lista.forEach((gltf, i) => {
      if (!gltf) return;
      gltf.scene.traverse((o) => {
        if (!o.isMesh) return;
        // móveis recebem sombra, mas não fazem sombra (economiza: a sombra redesenha tudo)
        o.castShadow = false;
        o.receiveShadow = true;
        linearizarTexturas(o.material);
      });
      moveis[nomes[i]] = gltf.scene;
    });
    return moveis;
  },

  // Coloca uma cópia do móvel no segmento. "dist" = distância da parede; "virado" gira o móvel.
  colocar(seg, moveis, nome, lado, dist, y, z, giro) {
    if (!moveis[nome]) return;
    const copia = moveis[nome].clone();
    copia.position.set(lado * (LARGURA_CORREDOR / 2 - dist), y, z);
    copia.rotation.y = giro;
    seg.add(copia);
    return copia;
  },

  mobiliarFaculdade(seg, moveis) {
    if (moveis.planta2) this.esconder(seg, ['planta']);
    for (const lado of [-1, 1]) {
      const deFrente = -lado * (Math.PI / 2); // virado para o meio do corredor
      this.colocar(seg, moveis, 'banco', lado, 0.32, 0, 0.6, deFrente);
      if (lado > 0 || QUALIDADE_ALTA) this.colocar(seg, moveis, 'extintor', lado, 0.22, 0, 4.7, deFrente);
      this.colocar(seg, moveis, 'relogio', lado, 0.04, 2.9, -4, deFrente);
      if (lado > 0) this.colocar(seg, moveis, 'planta2', lado, 0.5, 0, 6.3, 0); // só existe na qualidade alta
    }
    this.colocarLuminarias(seg, moveis, [-4, 4]);
  },

  mobiliarEmpresa(seg, moveis) {
    this.esconder(seg, ['mesaBaia', 'cadeira'].concat(moveis.gaveteiro ? ['mesaSala'] : []));
    for (const lado of [-1, 1]) {
      const deFrente = -lado * (Math.PI / 2);
      this.colocar(seg, moveis, 'mesa-escritorio', lado, 0.5, 0, 2.5, deFrente);
      // cadeira encaixada embaixo da mesa (mais longe das faixas, para não parecer obstáculo)
      const cadeira = this.colocar(seg, moveis, 'cadeira-escritorio', lado, 0.8, 0, 2.5, -deFrente);
      if (cadeira) cadeira.scale.setScalar(0.82);
      this.colocar(seg, moveis, 'relogio', lado, 0.04, 2.6, 0.2, deFrente);
      // só existem na qualidade alta:
      this.colocar(seg, moveis, 'gaveteiro', lado, 0.3, 0, -4, deFrente);
      if (lado < 0) this.colocar(seg, moveis, 'planta2', lado, 0.45, 0, 5.0, 0);
    }
    this.colocarLuminarias(seg, moveis, [-6, -2, 2, 6]);
  },

  // Luminária fluorescente de verdade no lugar dos painéis brancos do teto
  colocarLuminarias(seg, moveis, posicoes) {
    if (!moveis.luminaria) return;
    this.esconder(seg, ['luz']);
    for (const z of posicoes) {
      this.colocar(seg, moveis, 'luminaria', 0, 0, ALTURA_CORREDOR - 0.06, z, 0);
    }
  },

  esconder(seg, papeis) {
    seg.traverse((o) => { if (papeis.includes(o.userData.papel)) o.visible = false; });
  },
};

// Os modelos .glb trazem texturas "sRGB". Como o jogo desenha em modo linear,
// sem isso eles apareceriam escuros demais (era por isso que os bonecos estavam escuros).
function linearizarTexturas(material) {
  (Array.isArray(material) ? material : [material]).forEach((m) => {
    for (const chave of ['map', 'emissiveMap']) {
      if (m[chave]) {
        m[chave].encoding = THREE.LinearEncoding;
        m[chave].needsUpdate = true;
      }
    }
    m.needsUpdate = true;
  });
}
