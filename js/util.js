// Funções auxiliares usadas por vários arquivos do jogo.

// true quando o jogo está num celular/tablet (tela de toque). Usado para deixar o jogo mais leve.
const CELULAR =
  /Android|iPhone|iPad|iPod|Mobile/i.test(navigator.userAgent) ||
  (window.matchMedia && matchMedia('(pointer: coarse)').matches);

// Qualidade escolhida no botão HD/⚡: 'alta' (padrão no computador) ou 'leve' (padrão no celular).
// Fica guardada no navegador; trocar recarrega o jogo.
const CHAVE_QUALIDADE = 'futuroAdministrador.qualidade';
const QUALIDADE = (() => {
  try {
    return localStorage.getItem(CHAVE_QUALIDADE) || (CELULAR ? 'leve' : 'alta');
  } catch (e) {
    return CELULAR ? 'leve' : 'alta';
  }
})();
const QUALIDADE_ALTA = QUALIDADE === 'alta';

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
  textura.anisotropy = 16;
  return textura;
}

// Atalho para criar um cubo/caixa colorida (a "peça de Lego" do nosso mundo).
function caixa(largura, altura, profundidade, cor) {
  return new THREE.Mesh(
    new THREE.BoxGeometry(largura, altura, profundidade),
    new THREE.MeshLambertMaterial({ color: cor })
  );
}

// Caixa com cantos arredondados (para os bonecos ficarem menos "quadrados").
// Truque: pegamos uma caixa dividida em pedacinhos e "empurramos" os pontos das
// quinas para formar uma curva. A geometria de cada tamanho é criada uma vez só
// e reaproveitada por todos os bonecos.
const geometriasArredondadas = {};
function geometriaArredondada(l, a, p) {
  const chave = `${l}|${a}|${p}`;
  if (geometriasArredondadas[chave]) return geometriasArredondadas[chave];

  const raio = Math.min(l, a, p, 0.28) * 0.35;
  const geo = new THREE.BoxGeometry(l, a, p, 6, 6, 6);
  const pos = geo.attributes.position;
  const normal = geo.attributes.normal;
  const limite = new THREE.Vector3(l / 2 - raio, a / 2 - raio, p / 2 - raio);
  const v = new THREE.Vector3();
  const interno = new THREE.Vector3();
  const n = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    interno.set(
      Math.max(-limite.x, Math.min(limite.x, v.x)),
      Math.max(-limite.y, Math.min(limite.y, v.y)),
      Math.max(-limite.z, Math.min(limite.z, v.z))
    );
    n.subVectors(v, interno).normalize();
    v.copy(interno).addScaledVector(n, raio);
    pos.setXYZ(i, v.x, v.y, v.z);
    normal.setXYZ(i, n.x, n.y, n.z);
  }
  geo.userData.compartilhado = true;
  geometriasArredondadas[chave] = geo;
  return geo;
}

function caixaArredondada(largura, altura, profundidade, cor) {
  return new THREE.Mesh(
    geometriaArredondada(largura, altura, profundidade),
    // Phong: um leve brilho, como plástico/tecido, dá mais volume que o material fosco
    new THREE.MeshPhongMaterial({ color: cor, shininess: 18, specular: 0x1a1a1a })
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
    if (o.geometry && !o.geometry.userData.compartilhado) o.geometry.dispose();
    if (o.material && !o.material.userData.compartilhado) o.material.dispose();
  });
}
