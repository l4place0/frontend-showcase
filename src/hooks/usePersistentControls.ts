import { useCallback, useEffect, useMemo, useState } from "react";
import type { SpecimenControl } from "../app/types";

type Values = Record<string, unknown>;

function defaults(controls: SpecimenControl[]): Values {
  return Object.fromEntries(controls.map((control) => [control.key, control.default ?? (control.type === "boolean" ? false : "")]));
}

export function usePersistentControls(id: string, controls: SpecimenControl[]) {
  const key = `specimen-controls:${id}`;
  const initial = useMemo(() => defaults(controls), [controls]);
  const [values, setValues] = useState<Values>(initial);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      setValues(saved ? { ...initial, ...JSON.parse(saved) as Values } : initial);
    } catch {
      setValues(initial);
    }
  }, [key, initial]);

  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(values)); } catch { /* storage is optional */ }
  }, [key, values]);

  const update = useCallback((controlKey: string, value: unknown) => {
    setValues((current) => ({ ...current, [controlKey]: value }));
  }, []);
  const replace = useCallback((nextValues: Values) => setValues(nextValues), []);
  const reset = useCallback(() => setValues(initial), [initial]);
  return { values, update, replace, reset };
}
