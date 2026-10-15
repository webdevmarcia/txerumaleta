import { useCallback, useState } from "react";
import { api } from "../api";
import { useApi } from "./useApi";

/** Lista de publicações com paginação ("Ver mais") e atualizações locais. */
export function usePostFeed(params, { saved = false } = {}) {
  const { data, loading, error, reload, setData } = useApi(
    () => (saved ? api.posts.saved() : api.posts.list(params)),
    [saved, params]
  );
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = useCallback(async () => {
    const last = data?.items.at(-1);
    if (!last) return;
    setLoadingMore(true);
    try {
      const next = await api.posts.list({ ...params, before: last.created_at });
      setData((d) => ({ items: [...d.items, ...next.items], hasMore: next.hasMore }));
    } finally {
      setLoadingMore(false);
    }
  }, [data, params, setData]);

  const prepend = useCallback((post) => setData((d) => ({ ...d, items: [post, ...(d?.items ?? [])] })), [setData]);
  const remove = useCallback((id) => setData((d) => ({ ...d, items: d.items.filter((p) => p.id !== id) })), [setData]);

  return {
    posts: data?.items ?? [],
    hasMore: data?.hasMore ?? false,
    loading: loading && !data,
    error,
    loadingMore,
    loadMore,
    prepend,
    remove,
    reload,
  };
}
