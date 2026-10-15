import { useCallback, useEffect, useState } from "react";

/**
 * Carrega dados de forma assíncrona.
 * Os dados antigos continuam visíveis enquanto se recarrega (sem "piscar").
 */
export function useApi(loader, deps = []) {
  const [tick, setTick] = useState(0);
  const [state, setState] = useState({ key: null, data: undefined, error: null });
  const key = JSON.stringify([...deps, tick]);

  useEffect(() => {
    let active = true;
    loader().then(
      (data) => active && setState({ key, data, error: null }),
      (error) => active && setState((s) => ({ key, data: s.data, error }))
    );
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const reload = useCallback(() => setTick((t) => t + 1), []);
  const setData = useCallback(
    (updater) => setState((s) => ({ ...s, data: typeof updater === "function" ? updater(s.data) : updater })),
    []
  );

  return { data: state.data, error: state.error, loading: state.key !== key, reload, setData };
}
