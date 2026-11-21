// HUD = os painéis por cima do jogo (vidas, pontos, progresso).
// É feito com HTML comum, não com 3D.

const HUD = {
  el: (id) => document.getElementById(id),

  mostrar(def, nome, fase = 1) {
    const config = FASES[fase];
    this.total = config.meta;
    this.unidade = config.unidade;
    const titulo = fase === 3 ? (def.mulher ? 'Gerente' : 'Gerente')
      : fase === 2 ? (def.mulher ? 'Estagiária' : 'Estagiário') : 'Futuro Administrador';
    this.el('hud-caixa-bloco').classList.toggle('escondido', fase !== 3);
    this.combo(0);
    this.poder(null);
    this.el('hud-avatar').src = def.retratoRosto;
    this.el('hud-nome').textContent = `${titulo} ${nome}`;
    this.el('hud-curso').textContent = config.curso;
    this.el('hud-titulo').textContent = config.titulo;
    this.vidas(3);
    this.pontos(0);
    this.disciplinas([]);
    this.el('hud').classList.remove('escondido');
  },

  esconder() {
    this.el('hud').classList.add('escondido');
  },

  vidas(n) {
    this.el('hud-vidas').innerHTML = [0, 1, 2]
      .map((i) => `<span class="${i < n ? 'cheio' : 'vazio'}">${i < n ? '❤' : '♡'}</span>`)
      .join('');
  },

  pontos(p) {
    this.el('hud-pontos').textContent = Math.floor(p);
  },

  // Barra de progresso e as últimas disciplinas (fase 1) ou metas (fase 2) conquistadas
  disciplinas(lista) {
    const total = this.total;
    this.el('hud-barra').style.width = `${Math.min(1, lista.length / total) * 100}%`;
    this.el('hud-progresso').textContent = `${lista.length} / ${total} ${this.unidade}`;
    // mostra as 4 últimas, a mais recente em cima
    this.el('hud-lista').innerHTML = lista
      .slice(-4)
      .reverse()
      .map((d) => `<li>✔ ${d}</li>`)
      .join('');
  },

  // ---------- Fase 3 ----------

  // Caixa da empresa (0 a 100): verde → amarelo → vermelho
  caixa(valor) {
    const barra = this.el('hud-caixa');
    barra.style.width = `${Math.max(0, Math.min(100, valor))}%`;
    barra.style.background = valor > 50 ? 'linear-gradient(#4ade80, #16a34a)' : valor > 25 ? 'linear-gradient(#fde047, #ca8a04)' : 'linear-gradient(#f87171, #dc2626)';
  },

  combo(multiplicador) {
    const el = this.el('hud-combo');
    el.textContent = multiplicador > 1 ? `🔥 COMBO x${multiplicador}` : '';
    el.classList.toggle('pulsar', multiplicador > 1);
  },

  // Poder ativo com o tempo restante (ou null para esconder)
  poder(texto) {
    const el = this.el('hud-poder');
    el.classList.toggle('escondido', !texto);
    if (texto) el.textContent = texto;
  },


  aviso(texto, tipo) {
    const a = this.el('aviso');
    a.textContent = texto;
    a.className = `aviso visivel ${tipo}`;
    clearTimeout(this.timerAviso);
    this.timerAviso = setTimeout(() => (a.className = 'aviso'), tipo === 'final' ? 4000 : 1300);
  },
};
