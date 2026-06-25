/**
 * config/tabs.js
 * Define todas as abas da calculadora.
 * Para adicionar uma nova rota: basta incluir um novo objeto aqui
 * e criar o módulo correspondente em ui/tabs/.
 */

export const TABS = [
  {
    id:    'envio-unico',
    label: 'Envio Único',
    module: () => import('../ui/tabs/EnvioUnico.js'),
  },
  {
    id:    'simular-dia',
    label: 'Simular Dia',
    module: () => import('../ui/tabs/SimularDia.js'),
  },
  {
    id:    'tabela',
    label: 'Tabela',
    module: () => import('../ui/tabs/Tabela.js'),
  },
  {
    id:    'proposta',
    label: 'Proposta Cliente',
    module: () => import('../ui/tabs/Proposta.js'),
  },
  {
    id:    'custos',
    label: 'Custos',
    module: () => import('../ui/tabs/Custos.js'),
  },
  // Exemplo: para adicionar "Viagens" no futuro:
  // { id: 'viagens', label: 'Viagens', module: () => import('../ui/tabs/Viagens.js') },
];

export const DEFAULT_TAB = 'envio-unico';
