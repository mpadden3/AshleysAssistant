import Exa from "exa-js";

if (!process.env.EXA_API_KEY) {
  throw new Error("EXA_API_KEY is not set in .env.local");
}

export const exa = new Exa(process.env.EXA_API_KEY);
