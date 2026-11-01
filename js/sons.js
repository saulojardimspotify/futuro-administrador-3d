// Sons do jogo, criados na hora com a Web Audio API (como um sintetizador).
// Não usamos arquivos de áudio: cada som é uma "receita" de notas e ruídos.
//
// Peças básicas:
//   oscilador = gera uma onda (o tom da nota)
//   ganho     = controla o volume (e faz o som sumir aos poucos)

const Sons = {
  ctx: null,
  saida: null,
  mudo: false,
  VOLUME: 0.5,

  // O navegador só deixa tocar som depois de um clique/tecla do jogador.
  iniciar() {
    if (!this.ctx) {
      const Contexto = window.AudioContext || window.webkitAudioContext;
      if (!Contexto) return;
      this.ctx = new Contexto();
      this.saida = this.ctx.createGain();
      this.saida.gain.value = this.mudo ? 0 : this.VOLUME;
      this.saida.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') this.ctx.resume();
    this.desbloquearArquivos();
  },

  // Celular (principalmente iPhone) só deixa tocar um áudio que já foi "liberado"
  // por um toque do jogador. Então, no toque em "Começar", tocamos cada arquivo
  // em silêncio por um instante e pausamos. Depois ele pode tocar sozinho.
  desbloquearArquivos() {
    for (const nome of ['applause', 'final']) {
      const a = this.carregar(nome);
      if (a.desbloqueado) continue;
      a.muted = true;
      const promessa = a.play();
      if (!promessa) continue;
      promessa
        .then(() => {
          a.pause();
          a.currentTime = 0;
          a.muted = this.mudo;
          a.desbloqueado = true;
        })
        .catch(() => {});
    }
  },

  alternarMudo() {
    this.mudo = !this.mudo;
    if (this.saida) this.saida.gain.value = this.mudo ? 0 : this.VOLUME;
    for (const a of Object.values(this.arquivos)) a.muted = this.mudo;
    return this.mudo;
  },

  // ---------- Arquivos de áudio (pasta "sons") ----------
  // Usamos o elemento <audio> do navegador, que funciona até abrindo o index.html direto.

  arquivos: {},

  carregar(nome) {
    if (!this.arquivos[nome]) {
      const a = new Audio(`sons/${nome}.mp3`);
      a.preload = 'auto';
      this.arquivos[nome] = a;
    }
    return this.arquivos[nome];
  },

  tocarArquivo(nome, volume = 1) {
    const a = this.carregar(nome);
    a.muted = this.mudo;
    a.volume = volume;
    a.currentTime = 0;
    a.play().catch(() => {}); // se o navegador bloquear, o jogo segue sem som
    return a;
  },

  pararArquivos() {
    for (const a of Object.values(this.arquivos)) a.pause();
  },

  // Toca uma nota. "inicio" é daqui a quantos segundos; freqFim faz o tom deslizar.
  nota(freq, inicio, duracao, tipo = 'square', volume = 0.2, freqFim) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + inicio;
    const osc = this.ctx.createOscillator();
    const ganho = this.ctx.createGain();
    osc.type = tipo;
    osc.frequency.setValueAtTime(freq, t);
    if (freqFim) osc.frequency.exponentialRampToValueAtTime(freqFim, t + duracao);
    ganho.gain.setValueAtTime(volume, t);
    ganho.gain.exponentialRampToValueAtTime(0.001, t + duracao);
    osc.connect(ganho).connect(this.saida);
    osc.start(t);
    osc.stop(t + duracao + 0.02);
  },

  // Ruído (chiado), usado em batidas e palmas.
  ruido(inicio, duracao, volume, frequenciaFiltro = 1000) {
    if (!this.ctx) return;
    if (!this.bufferRuido) {
      const tamanho = this.ctx.sampleRate;
      this.bufferRuido = this.ctx.createBuffer(1, tamanho, this.ctx.sampleRate);
      const dados = this.bufferRuido.getChannelData(0);
      for (let i = 0; i < tamanho; i++) dados[i] = Math.random() * 2 - 1;
    }
    const t = this.ctx.currentTime + inicio;
    const fonte = this.ctx.createBufferSource();
    fonte.buffer = this.bufferRuido;
    const filtro = this.ctx.createBiquadFilter();
    filtro.type = 'bandpass';
    filtro.frequency.value = frequenciaFiltro;
    const ganho = this.ctx.createGain();
    ganho.gain.setValueAtTime(volume, t);
    ganho.gain.exponentialRampToValueAtTime(0.001, t + duracao);
    fonte.connect(filtro).connect(ganho).connect(this.saida);
    fonte.start(t, Math.random() * 0.5);
    fonte.stop(t + duracao + 0.02);
  },

  // ---------- Efeitos ----------

  livro() {
    [659, 784, 1047].forEach((f, i) => this.nota(f, i * 0.07, 0.16, 'square', 0.12));
  },

  batida() {
    this.nota(180, 0, 0.35, 'sawtooth', 0.25, 50);
    this.ruido(0, 0.25, 0.4, 600);
  },

  pulo() {
    this.nota(280, 0, 0.22, 'triangle', 0.22, 760);
  },

  faixa() {
    this.nota(520, 0, 0.05, 'triangle', 0.1);
  },

  // "Tã-dã!" quando pega as 15 disciplinas
  todasDisciplinas() {
    [523, 659, 784].forEach((f, i) => this.nota(f, i * 0.1, 0.18, 'square', 0.12));
    this.nota(1047, 0.32, 0.6, 'square', 0.14);
  },

  porta() {
    this.nota(110, 0, 0.9, 'sawtooth', 0.12, 70);
    this.ruido(0, 0.7, 0.12, 300);
  },

  gameOver() {
    [392, 330, 262, 196].forEach((f, i) => this.nota(f, i * 0.24, 0.32, 'triangle', 0.25));
  },

  // Fanfarra da formatura
  fanfarra() {
    const notas = [[523, 0], [523, 0.15], [523, 0.3], [659, 0.45], [784, 0.75], [659, 1.05], [784, 1.2]];
    notas.forEach(([f, t]) => {
      this.nota(f, t, 0.28, 'square', 0.12);
      this.nota(f / 2, t, 0.28, 'triangle', 0.15);
    });
    this.nota(1047, 1.5, 1.2, 'square', 0.13);
    this.nota(523, 1.5, 1.2, 'triangle', 0.18);
  },

  aplausos(duracao = 3, intensidade = 1) {
    const palmas = Math.floor(duracao * 45 * intensidade);
    for (let i = 0; i < palmas; i++) {
      this.ruido(Math.random() * duracao, 0.05, 0.25 * intensidade, 1200 + Math.random() * 1500);
    }
  },

  // ---------- Música de fundo ----------
  // Uma sequência de 32 "passos" que se repete. null = pausa.

  MELODIA: [72, null, 76, null, 79, null, 76, null, 74, null, 77, null, 79, 77, 76, 74,
            72, null, 76, null, 79, null, 84, null, 81, null, 79, null, 77, 76, 74, null],
  BAIXO: [48, 48, 43, 43, 45, 45, 41, 43], // cada nota dura 4 passos

  freq: (midi) => 440 * Math.pow(2, (midi - 69) / 12),

  iniciarMusica() {
    if (!this.ctx) return;
    this.pararMusica();
    const DURACAO_PASSO = 0.16;
    let passo = 0;
    let proximo = this.ctx.currentTime + 0.1;
    // A cada 100 ms, agenda as notas que vão tocar nos próximos 0,3 s.
    this.timerMusica = setInterval(() => {
      // se a aba ficou em segundo plano, pula o atraso em vez de tocar tudo de uma vez
      if (proximo < this.ctx.currentTime) proximo = this.ctx.currentTime + 0.05;
      while (proximo < this.ctx.currentTime + 0.3) {
        const quando = proximo - this.ctx.currentTime;
        const m = this.MELODIA[passo];
        if (m) this.nota(this.freq(m), quando, 0.14, 'square', 0.045);
        if (passo % 2 === 0) this.nota(this.freq(this.BAIXO[Math.floor(passo / 4)]), quando, 0.15, 'triangle', 0.12);
        if (passo % 4 === 2) this.ruido(quando, 0.04, 0.05, 6000);
        passo = (passo + 1) % 32;
        proximo += DURACAO_PASSO;
      }
    }, 100);
  },

  pararMusica() {
    clearInterval(this.timerMusica);
    this.timerMusica = null;
  },
};
