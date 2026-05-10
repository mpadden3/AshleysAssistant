import Exa from "exa-js";

let instance: Exa | undefined;

function getExa(): Exa {
  if (!instance) {
    const key = process.env.EXA_API_KEY;
    if (!key) {
      throw new Error("EXA_API_KEY is not set");
    }
    instance = new Exa(key);
  }
  return instance;
}

export const exa = new Proxy({} as Exa, {
  get(_target, prop, receiver) {
    const value = Reflect.get(getExa(), prop, receiver);
    return typeof value === "function" ? value.bind(getExa()) : value;
  },
});
