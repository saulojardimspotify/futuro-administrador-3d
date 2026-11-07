// Bonecos realistas: modelos 3D do Mixamo convertidos para GLB (pasta modelos/glb).
// Só o personagem escolhido é baixado. Se não der para carregar (por exemplo, abrindo
// o index.html direto do computador), o jogo usa os bonecos de blocos de antes.

const ALTURA_BONECO = 1.85; // altura do boneco no jogo (os modelos vêm em centímetros)
const ANIMACOES = ['correr', 'pular', 'deslizar', 'comemorar', 'parado',
  'dancar', 'aplaudir-sentado', 'conversar', 'bravo', 'andar'];
// figurantes (festa, reunião, plateia) usam os modelos mais leves
const FIGURANTES = ['isabella', 'mariaflor', 'valentina'];
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
    corrigirPesos(gltf);
    return new BonecoReal(gltf, clips);
  },

  // ---------- Figurantes (NPCs) ----------
  // Os obstáculos são criados na hora, sem esperar download. Por isso os modelos dos
  // figurantes são baixados antes ("preparar") e depois criados na hora ("criarJa").
  // No celular continuam os bonecos de blocos (bonecos realistas pesam muito para desenhar).
  prontos: {},
  clipsProntos: null,
  usarFigurantes: location.protocol.startsWith('http') && !CELULAR,

  preparar(arquivos) {
    if (!this.disponivel || !this.usarFigurantes) return Promise.resolve();
    const tarefas = arquivos.map((arquivo) => {
      if (!this.cache[arquivo]) {
        this.cache[arquivo] = this.baixar(`modelos/glb/${arquivo}.glb`);
        this.cache[arquivo].catch(() => delete this.cache[arquivo]);
      }
      return this.cache[arquivo].then((gltf) => {
        corrigirPesos(gltf);
        // geometria e materiais são compartilhados entre as cópias: não podem ser apagados
        gltf.scene.traverse((o) => {
          if (o.geometry) o.geometry.userData.compartilhado = true;
          if (o.material) [].concat(o.material).forEach((m) => (m.userData.compartilhado = true));
        });
        this.prontos[arquivo] = gltf;
      });
    });
    tarefas.push(this.carregarAnimacoes().then((c) => (this.clipsProntos = c)));
    return Promise.all(tarefas).catch(() => {});
  },

  // "Aquece" a placa de vídeo: desenha um figurante de cada tipo escondido, para o
  // navegador preparar tudo antes. Sem isso, o jogo dá um "soluço" quando o primeiro aparece.
  aquecer(renderizador, cena, camera) {
    if (!this.clipsProntos) return;
    const grupo = new THREE.Group();
    for (const arquivo of Object.keys(this.prontos)) {
      const real = this.criarJa(arquivo, 'parado');
      if (real) grupo.add(real.grupo);
    }
    grupo.position.copy(camera.position);
    cena.add(grupo);
    renderizador.compile(cena, camera);
    cena.remove(grupo);
  },

  // Cria um figurante já tocando uma animação; devolve null se ainda não baixou
  criarJa(arquivo, animacao) {
    const gltf = this.prontos[arquivo || FIGURANTES[Math.floor(Math.random() * FIGURANTES.length)]];
    if (!gltf || !this.clipsProntos) return null;
    const real = new BonecoReal(gltf, this.clipsProntos, false);
    real.tocar(animacao, 0);
    real.acaoAtual.time = Math.random() * real.acaoAtual.getClip().duration; // cada um num ponto da animação
    return real;
  },
};

// Cada ponto do corpo segue até 4 ossos, com "pesos" que precisam somar 255.
// Na conversão, alguns pontos ficaram com soma errada e eram puxados para longe
// (aparecia uma linha preta acima do boneco). Aqui os pesos são acertados.
function corrigirPesos(gltf) {
  if (gltf.pesosCorrigidos) return;
  gltf.pesosCorrigidos = true;
  gltf.scene.traverse((o) => {
    if (o.isMesh) linearizarTexturas(o.material); // cores certas (veja cenario.js)
    const pesos = o.isSkinnedMesh && o.geometry.attributes.skinWeight;
    if (!pesos || !(pesos.array instanceof Uint8Array)) return;
    const a = pesos.array;
    for (let i = 0; i < a.length; i += 4) {
      const soma = a[i] + a[i + 1] + a[i + 2] + a[i + 3];
      if (soma === 255) continue;
      const outros = a[i + 1] + a[i + 2] + a[i + 3];
      if (outros <= 255) a[i] = 255 - outros; // o primeiro peso "deu a volta" (ex.: -1 virou 255)
      else {
        const k = 255 / soma;
        let maior = i;
        for (let j = i; j < i + 4; j++) {
          a[j] = Math.round(a[j] * k);
          if (a[j] > a[maior]) maior = j;
        }
        a[maior] += 255 - (a[i] + a[i + 1] + a[i + 2] + a[i + 3]); // sobra do arredondamento
      }
    }
    pesos.needsUpdate = true;
  });
}

class BonecoReal {
  // sombra = false nos figurantes: a sombra obriga a desenhar o boneco duas vezes
  constructor(gltf, clips, sombra = true) {
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
        o.castShadow = sombra;
        // Só desenha o boneco quando ele está na tela. A "esfera" que o envolve é aumentada
        // porque a animação mexe braços e pernas para fora da pose original.
        const g = o.geometry;
        if (!g.userData.esferaAumentada) {
          g.computeBoundingSphere();
          g.boundingSphere.radius *= 1.5;
          g.userData.esferaAumentada = true;
        }
        o.frustumCulled = true;
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

  // Para quem só recebe o "relógio" do jogo (obstáculos): calcula o tempo que passou
  atualizarAte(t) {
    if (this.ultimoT !== undefined) this.mixer.update(Math.min(0.1, t - this.ultimoT));
    this.ultimoT = t;
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
