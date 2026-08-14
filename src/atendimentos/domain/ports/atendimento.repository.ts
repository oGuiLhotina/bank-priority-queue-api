import { Atendimento } from '../atendimento';
import { StatusAtendimento } from '../status-atendimento.enum';

/** Token de injecao: o dominio define o contrato, a infraestrutura o implementa. */
export const ATENDIMENTO_REPOSITORY = Symbol('ATENDIMENTO_REPOSITORY');

export interface Pagina<T> {
  itens: T[];
  total: number;
  pagina: number;
  tamanho: number;
  totalDePaginas: number;
}

/** Todo campo e opcional: filtro vazio equivale a listar tudo. */
export interface FiltroDeBusca {
  cpf?: string;
  descricao?: string;
  status?: StatusAtendimento[];
}

export interface AtendimentoRepository {
  salvar(atendimento: Atendimento): Promise<Atendimento>;
  porId(id: string): Promise<Atendimento | null>;
  buscar(filtro: FiltroDeBusca, pagina: number, tamanho: number): Promise<Pagina<Atendimento>>;
  /** Usado no boot para reconstruir o heap a partir do estado persistido. */
  aguardando(): Promise<Atendimento[]>;
  /** Proximo numero de senha, sequencial e monotonico. */
  proximaSenha(): Promise<number>;
}
