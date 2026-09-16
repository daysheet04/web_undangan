import { useCallback, useEffect, useState } from 'react';
import { get } from './api.js';

export function useRemote(path, dependencies = []) {
  const [state, setState] = useState({ loading: true, data: null, error: null });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    setState((current) => current.data
      ? { ...current, refreshing: true, error: null }
      : { loading: true, refreshing: false, data: null, error: null });
    get(path).then((data) => active && setState({ loading: false, data, error: null }))
      .catch((error) => active && setState({ loading: false, data: null, error }));
    return () => { active = false; };
  }, [...dependencies, revision]); // eslint-disable-line react-hooks/exhaustive-deps
  return { ...state, reload };
}

export function useBodyClass(className) {
  useEffect(() => {
    const previous = document.body.className;
    document.body.className = className || '';
    return () => { document.body.className = previous; };
  }, [className]);
}

export function useDocumentTitle(title) {
  useEffect(() => { document.title = title || 'Daymoment'; }, [title]);
}

export function useLegacyScripts(paths, ready = true) {
  useEffect(() => {
    if (!ready) return undefined;
    const scripts = paths.map((src) => {
      const script = document.createElement('script');
      script.src = `${src}${src.includes('?') ? '&' : '?'}react=1`;
      script.async = false;
      document.body.appendChild(script);
      return script;
    });
    return () => scripts.forEach((script) => script.remove());
  }, [ready, paths.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
}

export function useHeadLinks(links) {
  useEffect(() => {
    const nodes = links.map((href) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = href;
      document.head.appendChild(link);
      return link;
    });
    return () => nodes.forEach((node) => node.remove());
  }, [links.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
}
