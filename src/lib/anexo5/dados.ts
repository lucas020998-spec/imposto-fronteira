import bruto from "@/data/anexo5.json";
import { anexo5Schema } from "./schema";

/** Base do Anexo 05 gerada por `pnpm anexo5:import`; vazia até a primeira importação. */
export const anexo5 = anexo5Schema.parse(bruto);
