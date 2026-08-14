/**
 * Retorna negativo se `a` deve sair antes de `b`, positivo se depois, 0 se
 * equivalentes. Mesma convencao de `Array.prototype.sort`.
 */
export type Comparador<T> = (a: T, b: T) => number;

/**
 * Heap binario sobre array, sem dependencia externa.
 *
 * O array representa uma arvore binaria quase completa: para o indice `i`,
 * os filhos estao em `2i + 1` e `2i + 2` e o pai em `Math.floor((i - 1) / 2)`.
 * A invariante mantida e a de heap: todo no vem antes dos seus filhos segundo
 * o comparador. A raiz (indice 0) e sempre o elemento de maior prioridade.
 *
 * Custos:
 *   inserir            O(log n)
 *   remover a raiz     O(log n)
 *   consultar a raiz   O(1)
 *   construir de lista O(n)      (heapify de baixo para cima)
 *   remover arbitrario O(n)      (busca linear + reequilibrio O(log n))
 */
export class BinaryHeap<T> {
  private readonly itens: T[] = [];

  constructor(private readonly comparar: Comparador<T>) {}

  /**
   * Constroi o heap a partir de uma lista existente em O(n), aplicando
   * `descer` da metade do array ate a raiz. E mais barato que inserir item a
   * item (O(n log n)) e e o caminho usado ao reidratar a fila do banco.
   */
  static de<T>(itens: readonly T[], comparar: Comparador<T>): BinaryHeap<T> {
    const heap = new BinaryHeap<T>(comparar);
    heap.itens.push(...itens);
    for (let i = Math.floor(heap.itens.length / 2) - 1; i >= 0; i--) {
      heap.descer(i);
    }
    return heap;
  }

  get tamanho(): number {
    return this.itens.length;
  }

  get vazio(): boolean {
    return this.itens.length === 0;
  }

  inserir(item: T): void {
    this.itens.push(item);
    this.subir(this.itens.length - 1);
  }

  /** Le a raiz sem remover. */
  espiar(): T | undefined {
    return this.itens[0];
  }

  /** Remove e devolve a raiz, promovendo o ultimo item e reequilibrando. */
  extrair(): T | undefined {
    if (this.itens.length === 0) return undefined;
    const raiz = this.itens[0];
    const ultimo = this.itens.pop() as T;
    if (this.itens.length > 0) {
      this.itens[0] = ultimo;
      this.descer(0);
    }
    return raiz;
  }

  /**
   * Remove o primeiro item que satisfaz o predicado. A busca e linear porque
   * o heap nao indexa por chave; o reequilibrio depois da troca e O(log n).
   */
  remover(predicado: (item: T) => boolean): T | undefined {
    const indice = this.itens.findIndex(predicado);
    if (indice === -1) return undefined;

    const removido = this.itens[indice];
    const ultimo = this.itens.pop() as T;
    if (indice < this.itens.length) {
      this.itens[indice] = ultimo;
      // O substituto pode violar a invariante para cima ou para baixo.
      this.subir(indice);
      this.descer(indice);
    }
    return removido;
  }

  /** Copia crua, na ordem interna do array. Util para inspecao e testes. */
  paraArray(): T[] {
    return [...this.itens];
  }

  /**
   * Lista na ordem real de atendimento, sem destruir o heap: copia os itens e
   * ordena a copia em O(n log n).
   */
  paraArrayOrdenado(): T[] {
    return [...this.itens].sort(this.comparar);
  }

  private subir(indice: number): void {
    let atual = indice;
    while (atual > 0) {
      const pai = Math.floor((atual - 1) / 2);
      if (this.comparar(this.itens[atual], this.itens[pai]) >= 0) break;
      this.trocar(atual, pai);
      atual = pai;
    }
  }

  private descer(indice: number): void {
    const total = this.itens.length;
    let atual = indice;

    for (;;) {
      const esquerda = 2 * atual + 1;
      const direita = 2 * atual + 2;
      let menor = atual;

      if (esquerda < total && this.comparar(this.itens[esquerda], this.itens[menor]) < 0) {
        menor = esquerda;
      }
      if (direita < total && this.comparar(this.itens[direita], this.itens[menor]) < 0) {
        menor = direita;
      }
      if (menor === atual) break;

      this.trocar(atual, menor);
      atual = menor;
    }
  }

  private trocar(a: number, b: number): void {
    [this.itens[a], this.itens[b]] = [this.itens[b], this.itens[a]];
  }
}
