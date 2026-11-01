// HUD = os painéis por cima do jogo (vidas, pontos, progresso).
// É feito com HTML comum, não com 3D.

const HUD = {
  el: (id) => document.getElementById(id),

  mostrar(def, nome, fase = 1) {
    const config = FASES[fase];
    this.total = config.meta;
    this.unidade = config.unidade;
    const titulo = fase === 2 ? (def.mulher ? 'Estagiária' : 'Estagiário') : 'Futuro Administrador';
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

  aviso(texto, tipo) {
    const a = this.el('aviso');
    a.textContent = texto;
    a.className = `aviso visivel ${tipo}`;
    clearTimeout(this.timerAviso);
    this.timerAviso = setTimeout(() => (a.className = 'aviso'), tipo === 'final' ? 4000 : 1300);
  },
};
