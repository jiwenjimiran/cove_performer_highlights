import { useEffect, useRef, useState } from '@cove/runtime/react';
import { useQuery } from '@cove/runtime/react-query';
import { extensionFetch } from '@cove/runtime/api';
import { loadEngagement, watchBadges } from './badges.mjs';

export function PerformerHighlights() {
  const [ids, setIds] = useState([]);
  const watcher = useRef(null);
  // Cove updates all performer batch queries immediately when a favorite is toggled.
  const { data } = useQuery({
    queryKey: ['engagement', 'performer', 'batch', ids],
    queryFn: ({ signal }) => loadEngagement(ids, extensionFetch, signal),
    enabled: ids.length > 0,
    staleTime: 30000,
    refetchInterval: 30000,
    retry: false,
  });
  useEffect(() => {
    watcher.current = watchBadges(document, setIds);
    return () => { watcher.current.stop(); watcher.current = null; };
  }, []);
  useEffect(() => { watcher.current?.update(data ?? []); }, [data]);
  return null;
}

export default { components: { PerformerHighlights } };
