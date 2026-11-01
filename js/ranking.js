// Ranking local: guarda as 10 melhores pontuações NESTE navegador (localStorage).
// Cada computador/celular tem o seu próprio ranking.

function escaparHtml(texto) {
  return String(texto).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

const Ranking = {
  CHAVE: 'futuroAdministrador.ranking',
  TAMANHO: 10,

  ler() {
    try {
      return JSON.parse(localStorage.getItem(this.CHAVE)) || [];
    } catch (e) {
      return [];
    }
  },

  // Adiciona a partida, ordena e mantém só as 10 melhores.
  salvar(registro) {
    registro.id = Date.now();
    const lista = [...this.ler(), registro].sort((a, b) => b.pontos - a.pontos).slice(0, this.TAMANHO);
    try {
      localStorage.setItem(this.CHAVE, JSON.stringify(lista));
    } catch (e) {
      // navegador sem armazenamento (ex.: janela anônima bloqueada): mostra só desta vez
    }
    return { lista, id: registro.id };
  },

  // Monta a tabela, destacando a partida que acabou de terminar.
  html({ lista, id }) {
    const linhas = lista
      .map((r, i) => `<li class="${r.id === id ? 'eu' : ''}">
        <span>${i + 1}º ${escaparHtml(r.nome)} ${r.formou ? '🎓' : ''}</span><b>${r.pontos}</b></li>`)
      .join('');
    const fora = lista.some((r) => r.id === id) ? '' : '<p class="fora">Sua pontuação não entrou no top 10.</p>';
    return `<h3>🏆 Ranking deste computador</h3><ol class="ranking">${linhas}</ol>${fora}`;
  },
};
