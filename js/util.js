// Funções auxiliares usadas por vários arquivos do jogo.

// Cria uma textura (imagem) com texto escrito, para colar em placas, livros etc.
// O tamanho da fonte diminui sozinho até o texto caber.
function criarTexturaTexto(linhas, opcoes) {
  const o = Object.assign(
    { largura: 512, altura: 256, fundo: '#ffffff', cor: '#1e3a8a', tamanho: 72, borda: null },
    opcoes
  );
  const canvas = document.createElement('canvas');
  canvas.width = o.largura;
  canvas.height = o.altura;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = o.fundo;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  if (o.borda) {
    ctx.strokeStyle = o.borda;
    ctx.lineWidth = 14;
    ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
  }

  const lista = Array.isArray(linhas) ? linhas : [linhas];
  let tamanho = o.tamanho;
  const ajustarFonte = () => (ctx.font = `900 ${tamanho}px Nunito, Arial, sans-serif`);
  ajustarFonte();
  while (
    tamanho > 12 &&
    (lista.some((l) => ctx.measureText(l).width > canvas.width - 56) ||
      lista.length * tamanho * 1.15 > canvas.height - 40)
  ) {
    tamanho -= 2;
    ajustarFonte();
  }

  ctx.fillStyle = o.cor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const alturaLinha = tamanho * 1.15;
  const inicio = canvas.height / 2 - ((lista.length - 1) * alturaLinha) / 2;
  lista.forEach((linha, i) => ctx.fillText(linha, canvas.width / 2, inicio + i * alturaLinha));

  const textura = new THREE.CanvasTexture(canvas);
  textura.anisotropy = 4;
  return textura;
}

// Atalho para criar um cubo/caixa colorida (a "peça de Lego" do nosso mundo).
function caixa(largura, altura, profundidade, cor) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, profundidade),
    new THREE.MeshLambertMaterial({ color: cor })
  );
}

// Retorna um número de 0 a 1 indicando quanto de uma etapa [inicio, fim] já passou.
function progresso(t, inicio, fim) {
  return Math.min(1, Math.max(0, (t - inicio) / (fim - inicio)));
}

// Suaviza um movimento (começa e termina devagar).
function suave(k) {
  return k * k * (3 - 2 * k);
}

// Remove um objeto da cena e libera a memória da placa de vídeo.
function descartar(objeto) {
  if (objeto.parent) objeto.parent.remove(objeto);
  objeto.traverse((o) => {
    if (o.geometry) o.geometry.dispose();
    if (o.material && !o.material.userData.compartilhado) o.material.dispose();
  });
}
