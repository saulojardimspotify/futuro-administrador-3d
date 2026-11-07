// Bonecos realistas: modelos 3D do Mixamo convertidos para GLB (pasta modelos/glb).
// Só o personagem escolhido é baixado. Se não der para carregar (por exemplo, abrindo
// o index.html direto do computador), o jogo usa os bonecos de blocos de antes.

const ALTURA_BONECO = 1.85; // altura do boneco no jogo (os modelos vêm em centímetros)
const ANIMACOES = ['correr', 'pular', 'deslizar', 'comemorar', 'parado'];
const VERSAO_MODELOS = 1;

const Modelos = {
  disponivel: location.protocol.startsWith('http') && !!THREE.GLTFLoader && !!THREE.SkeletonUtils,
  cache: {},
  clips: null,

  baixar(url, progresso) {
    this.loader = this.loader || new THREE.GLTFLoader();
    return new Promise((ok, erro) => this.loader.load(`${url}?v=${VERSAO_MODELOS}`, ok, progresso, erro));
  },

  carregarAnimacoes() {
    if (!this.clips) {
      this.clips = Promise.all(ANIMACOES.map((n) => this.baixar(`modelos/glb/${n}.glb`))).then((lista) => {
        const clips = {};
        lista.forEach((g, i) => (clips[ANIMACOES[i]] = g.animations[0]));
        return clips;
      });
    }
    return this.clips;
  },

  // Cria um boneco realista novo (cada chamada gera uma cópia independente)
  async criar(def, progresso) {
    if (!this.cache[def.arquivo]) {
      this.cache[def.arquivo] = this.baixar(`modelos/glb/${def.arquivo}.glb`, progresso);
      this.cache[def.arquivo].catch(() => delete this.cache[def.arquivo]);
    }
    const [gltf, clips] = await Promise.all([this.cache[def.arquivo], this.carregarAnimacoes()]);
    return new BonecoReal(gltf, clips);
  },
};

class BonecoReal {
  constructor(gltf, clips) {
    // "grupo" é o que o jogo move; o modelo fica dentro dele, na escala e direção certas
    this.grupo = new THREE.Group();
    const modelo = (this.modelo = THREE.SkeletonUtils.clone(gltf.scene));
    const caixa = new THREE.Box3().setFromObject(modelo);
    const escala = ALTURA_BONECO / (caixa.max.y - caixa.min.y);
    modelo.scale.multiplyScalar(escala);
    modelo.position.y = -caixa.min.y * escala;
    modelo.rotation.y = Math.PI; // o Mixamo olha para +Z; no jogo a frente é -Z
    modelo.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.frustumCulled = false; // a animação mexe o corpo para fora da "caixa" original
      }
    });
    this.grupo.add(modelo);
    this.grupo.userData.real = this;

    this.mixer = new THREE.AnimationMixer(modelo);
    const quadril = modelo.getObjectByName('Hips');
    this.acoes = {};
    for (const [nome, clip] of Object.entries(clips)) {
      const acao = this.mixer.clipAction(this.adaptar(clip, quadril, nome));
      if (nome === 'pular' || nome === 'deslizar') {
        acao.setLoop(THREE.LoopOnce);
        acao.clampWhenFinished = true; // fica na última pose até trocar de animação
      }
      this.acoes[nome] = acao;
    }
    this.tocar('parado', 0);
  }

  // As animações vieram de outro boneco e "andam" sozinhas para a frente.
  // Aqui o quadril fica no lugar (o jogo é quem move o boneco) e a altura é ajustada ao modelo.
  adaptar(clip, quadril, nome) {
    const c = clip.clone();
    const trilha = c.tracks.find((t) => t.name === 'Hips.position');
    if (trilha) {
      const v = trilha.values;
      const proporcao = quadril.position.y / 99; // 99 cm = altura do quadril de pé nas animações
      for (let i = 0; i < v.length; i += 3) {
        v[i] = quadril.position.x;
        v[i + 1] = nome === 'pular' ? quadril.position.y : v[i + 1] * proporcao; // no pulo, quem sobe é o jogo
        v[i + 2] = quadril.position.z;
      }
    }
    return c;
  }

  // Troca de animação com uma transição suave
  tocar(nome, transicao = 0.15) {
    if (this.atual === nome) return;
    const nova = this.acoes[nome];
    nova.reset().setEffectiveTimeScale(1).fadeIn(transicao).play();
    if (this.acaoAtual) this.acaoAtual.fadeOut(transicao);
    this.acaoAtual = nova;
    this.atual = nome;
  }

  velocidade(fator) {
    if (this.acaoAtual) this.acaoAtual.setEffectiveTimeScale(fator);
  }

  atualizar(dt) {
    this.mixer.update(dt);
  }

  // Prende um objeto (capelo, diploma) num osso, compensando a escala minúscula do modelo
  prenderNoOsso(nomeOsso, objeto, posicao, escala = 1) {
    const osso = this.modelo.getObjectByName(nomeOsso);
    this.modelo.updateMatrixWorld(true);
    const escalaOsso = new THREE.Vector3().setFromMatrixScale(osso.matrixWorld).x;
    objeto.scale.setScalar(escala / escalaOsso);
    objeto.position.copy(posicao).divideScalar(escalaOsso);
    objeto.rotation.set(0, 0, 0);
    osso.add(objeto);
  }

  posicaoDoOsso(nomeOsso) {
    this.modelo.updateMatrixWorld(true);
    return this.modelo.getObjectByName(nomeOsso).getWorldPosition(new THREE.Vector3());
  }
}
