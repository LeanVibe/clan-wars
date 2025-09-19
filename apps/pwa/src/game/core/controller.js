/** @typedef {(state: any) => void} Listener */

export class GameController {
  #state;
  #listeners = new Set();

  constructor(initialState) {
    this.#state = initialState;
  }

  get state() {
    return this.#state;
  }

  subscribe(listener) {
    this.#listeners.add(listener);
    listener(this.#state);
    return () => {
      this.#listeners.delete(listener);
    };
  }

  update(mutator) {
    const clone = cloneState(this.#state);
    mutator(clone);
    this.#state = clone;
    this.#listeners.forEach((listener) => listener(this.#state));
  }
}

function cloneState(state) {
  if (typeof structuredClone === 'function') {
    return structuredClone(state);
  }
  return JSON.parse(JSON.stringify(state));
}
