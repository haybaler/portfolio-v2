import { createContext, useContext, type ReactNode } from "react";
import { crmById, mapById, type Crm, type Map } from "@/lib/stack";

/** The systems the examples are shown on. The site used to let visitors pick; it now shows one set and lists
 * every system each case study works with instead. */
interface StackState {
  crm: Crm;
  map: Map;
}

const Ctx = createContext<StackState | null>(null);
const DEFAULT: StackState = { crm: crmById("salesforce"), map: mapById("hubspot") };

export function StackProvider({ children }: { children: ReactNode }) {
  return <Ctx.Provider value={DEFAULT}>{children}</Ctx.Provider>;
}

export function useStack(): StackState {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStack needs StackProvider");
  return v;
}
