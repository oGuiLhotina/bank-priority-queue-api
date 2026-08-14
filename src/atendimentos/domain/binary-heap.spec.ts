import { BinaryHeap } from './binary-heap';

const menorPrimeiro = (a: number, b: number): number => a - b;

describe('BinaryHeap', () => {
  it('extrai sempre o menor elemento, independente da ordem de insercao', () => {
    const heap = new BinaryHeap<number>(menorPrimeiro);
    [7, 3, 9, 1, 8, 2].forEach((n) => heap.inserir(n));

    const saida: number[] = [];
    while (!heap.vazio) {
      saida.push(heap.extrair() as number);
    }

    expect(saida).toEqual([1, 2, 3, 7, 8, 9]);
  });

  it('espia a raiz sem remove-la', () => {
    const heap = new BinaryHeap<number>(menorPrimeiro);
    [5, 2, 8].forEach((n) => heap.inserir(n));

    expect(heap.espiar()).toBe(2);
    expect(heap.tamanho).toBe(3);
  });

  it('devolve undefined ao operar sobre heap vazio', () => {
    const heap = new BinaryHeap<number>(menorPrimeiro);

    expect(heap.vazio).toBe(true);
    expect(heap.espiar()).toBeUndefined();
    expect(heap.extrair()).toBeUndefined();
  });

  it('constroi de uma lista existente mantendo a invariante', () => {
    const heap = BinaryHeap.de([9, 4, 6, 1, 8, 3], menorPrimeiro);

    expect(heap.tamanho).toBe(6);
    expect(heap.espiar()).toBe(1);
    expect(heap.paraArrayOrdenado()).toEqual([1, 3, 4, 6, 8, 9]);
  });

  it('remove um elemento do meio e reequilibra', () => {
    const heap = BinaryHeap.de([1, 4, 2, 9, 5, 3], menorPrimeiro);

    expect(heap.remover((n) => n === 4)).toBe(4);
    expect(heap.tamanho).toBe(5);
    expect(heap.paraArrayOrdenado()).toEqual([1, 2, 3, 5, 9]);
  });

  it('devolve undefined ao remover o que nao existe', () => {
    const heap = BinaryHeap.de([1, 2, 3], menorPrimeiro);

    expect(heap.remover((n) => n === 42)).toBeUndefined();
    expect(heap.tamanho).toBe(3);
  });

  it('mantem a raiz correta apos remover o ultimo elemento inserido', () => {
    const heap = new BinaryHeap<number>(menorPrimeiro);
    [2, 5, 7].forEach((n) => heap.inserir(n));

    expect(heap.remover((n) => n === 7)).toBe(7);
    expect(heap.espiar()).toBe(2);
  });

  it('paraArrayOrdenado nao consome nem reordena o heap interno', () => {
    const heap = BinaryHeap.de([4, 1, 3], menorPrimeiro);
    const antes = heap.paraArray();

    expect(heap.paraArrayOrdenado()).toEqual([1, 3, 4]);
    expect(heap.paraArray()).toEqual(antes);
    expect(heap.tamanho).toBe(3);
  });

  it('respeita o comparador invertido, virando um max-heap', () => {
    const heap = BinaryHeap.de([4, 9, 1], (a: number, b: number) => b - a);

    expect(heap.espiar()).toBe(9);
  });
});
