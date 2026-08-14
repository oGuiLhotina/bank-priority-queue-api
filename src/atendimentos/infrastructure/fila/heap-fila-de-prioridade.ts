import { Injectable, Logger } from '@nestjs/common';
import { Atendimento } from '../../domain/atendimento';
import { BinaryHeap } from '../../domain/binary-heap';
import { FilaDePrioridade } from '../../domain/ports/fila-de-prioridade';

export type Relogio = () => Date;

/** Intervalo minimo entre duas reconstrucoes do heap por envelhecimento. */
const INTERVALO_DE_RECONSTRUCAO_MS = 60_000;

/**
 * Adaptador da fila de prioridade sobre o heap binario.
 *
 * O bonus de espera faz a pontuacao depender do relogio, e uma chave que muda
 * sozinha pode violar a invariante do heap com o tempo. A solucao e reconstruir
 * o heap (heapify O(n)) no maximo uma vez por minuto, quando alguma leitura ou
 * escrita acontece. Como o bonus so muda em janelas de 10 minutos, a ordem
 * fica no maximo um minuto defasada, e entre reconstrucoes as operacoes
 * seguem O(log n).
 */
@Injectable()
export class HeapFilaDePrioridade implements FilaDePrioridade {
  private readonly logger = new Logger(HeapFilaDePrioridade.name);
  private heap: BinaryHeap<Atendimento>;
  private reconstruidoEm: number;

  constructor(private readonly relogio: Relogio = () => new Date()) {
    this.reconstruidoEm = this.relogio().getTime();
    this.heap = this.novoHeap();
  }

  get tamanho(): number {
    return this.heap.tamanho;
  }

  enfileirar(atendimento: Atendimento): void {
    this.reconstruirSeEnvelheceu();
    this.heap.inserir(atendimento);
  }

  retirar(id: string): Atendimento | undefined {
    return this.heap.remover((item) => item.id === id);
  }

  reposicionar(atendimento: Atendimento): void {
    this.heap.remover((item) => item.id === atendimento.id);
    if (atendimento.aguardando) {
      this.heap.inserir(atendimento);
    }
  }

  espiarOrdenado(): Atendimento[] {
    this.reconstruirSeEnvelheceu();
    return this.heap.paraArrayOrdenado();
  }

  reidratar(atendimentos: Atendimento[]): void {
    const agora = this.relogio();
    this.heap = BinaryHeap.de(atendimentos, (a, b) => Atendimento.comparar(a, b, agora));
    this.reconstruidoEm = agora.getTime();
    this.logger.log(`fila reidratada com ${atendimentos.length} atendimento(s) aguardando`);
  }

  private novoHeap(itens: readonly Atendimento[] = []): BinaryHeap<Atendimento> {
    const agora = this.relogio();
    return BinaryHeap.de(itens, (a, b) => Atendimento.comparar(a, b, agora));
  }

  private reconstruirSeEnvelheceu(): void {
    const agora = this.relogio().getTime();
    if (agora - this.reconstruidoEm < INTERVALO_DE_RECONSTRUCAO_MS) return;
    this.heap = this.novoHeap(this.heap.paraArray());
    this.reconstruidoEm = agora;
  }
}
