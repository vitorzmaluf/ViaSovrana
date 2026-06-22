/**
 * services/AppState.js
 * Estado global da aplicação com suporte a subscribers.
 * Cada aba lê/escreve aqui; o Router re-renderiza quando muda.
 */

class AppState {
  #state = {
    // Tema
    dark: true,

    // Envio único
    envioUnico: {
      cityKey: 'sorocaba',
      zoneKey: 'z1',
      pesoKg:  100,
      result:  null,
      loading: false,
      error:   null,
    },

    // Simular dia
    simularDia: {
      clientes: [],
      nextId:   1,
      result:   null,
      loading:  false,
      error:    null,
      // Custos customizados (null = usa o padrão do servidor)
      custos: null,
    },

    // Tabela de preços
    tabela: {
      result:  null,
      loading: false,
      error:   null,
    },

    // Proposta cliente
    proposta: {
      cityKey:       'sorocaba',
      zoneKey:       'z1',
      pesoKg:        100,
      valorProposto: 200,
      pesoTotalDia:  350,
      result:        null,
      loading:       false,
      error:         null,
    },

    // Custos
    custos: {
      params:  {},      // campos editados pelo usuário (vazios = usa padrão)
      result:  null,
      loading: false,
      error:   null,
    },
  };

  #subscribers = new Set();

  /** Retorna uma cópia rasa do slice de estado */
  get(slice) {
    return slice ? { ...this.#state[slice] } : { ...this.#state };
  }

  /** Atualiza um slice de estado e notifica subscribers */
  set(slice, patch) {
    this.#state[slice] = { ...this.#state[slice], ...patch };
    this.#notify(slice);
  }

  /** Atualiza o estado sem re-render (para patches intermediários) */
  setSilent(slice, patch) {
    this.#state[slice] = { ...this.#state[slice], ...patch };
  }

  subscribe(fn) {
    this.#subscribers.add(fn);
    return () => this.#subscribers.delete(fn);
  }

  #notify(slice) {
    for (const fn of this.#subscribers) fn(slice, this.#state[slice]);
  }
}

export const state = new AppState();
