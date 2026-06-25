/**
 * ui/BaseTab.js
 * Classe base que toda aba deve estender.
 * AbortController garante que listeners são removidos no unmount —
 * sem acúmulo mesmo que mount/unmount sejam chamados várias vezes.
 */

import { $ } from '../utils/dom.js';

export class BaseTab {
  #container  = null;
  #controller = null;

  async mount(container) {
    this.#container  = container;
    this.#controller = new AbortController();
    await this.init?.();
    this.render();
    this.attachEvents(container, this.#controller.signal);
  }

  unmount() {
    this.cleanup?.();
    this.#controller?.abort();
    this.#controller = null;
    this.#container  = null;
  }

  get container() { return this.#container; }
  get signal()    { return this.#controller?.signal; }

  template() { return ''; }

  render() {
    if (!this.#container) return;
    this.#container.innerHTML = this.template();
    this.afterRender?.();
  }

  attachEvents(container, signal) {}

  $(sel)  { return $(sel, this.#container); }
  $$(sel) { return [...this.#container.querySelectorAll(sel)]; }
}
