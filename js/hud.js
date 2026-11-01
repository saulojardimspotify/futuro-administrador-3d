// HUD = os painéis por cima do jogo (vidas, pontos, progresso).
// É feito com HTML comum, não com 3D.

const HUD = {
  el: (id) => document.getElementById(id),

  mostrar(def, nome) {
    this.el('hud-avatar').src = def.retratoRosto;
    this.el('hud-nome').textContent = `Futuro Administrador ${nome}`;
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

  disciplinas(lista) {
    const total = META_DISCIPLINAS;
    this.el('hud-barra').style.width = `${(lista.length / total) * 100}%`;
    this.el('hud-progresso').textContent = `${lista.length} / ${total} disciplinas`;
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
