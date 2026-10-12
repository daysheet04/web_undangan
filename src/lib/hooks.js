import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { get } from './api.js';

const REMOTE_CACHE_PREFIX = 'daymoment:remote:';
const cacheLifetime = (path) => path.startsWith('/api/templates') ? 30 * 60 * 1000
  : path.startsWith('/api/invitations/') ? 5 * 60 * 1000
    : 0;
const readRemoteCache = (path) => {
  const lifetime = cacheLifetime(path);
  if (!lifetime || typeof sessionStorage === 'undefined') return null;
  try {
    const cached = JSON.parse(sessionStorage.getItem(REMOTE_CACHE_PREFIX + path) || 'null');
    return cached?.data && Date.now() - cached.savedAt < lifetime ? cached.data : null;
  } catch {
    return null;
  }
};
const writeRemoteCache = (path, data) => {
  if (!cacheLifetime(path) || typeof sessionStorage === 'undefined') return;
  try {
    sessionStorage.setItem(REMOTE_CACHE_PREFIX + path, JSON.stringify({ savedAt: Date.now(), data }));
  } catch {
    // Storage can be unavailable in private/embedded contexts; network data
    // still works normally in that case.
  }
};

export function useRemote(path, dependencies = []) {
  const [state, setState] = useState(() => {
    const cached = readRemoteCache(path);
    return cached
      ? { loading: false, refreshing: true, data: cached, error: null }
      : { loading: true, refreshing: false, data: null, error: null };
  });
  const [revision, setRevision] = useState(0);
  const reload = useCallback(() => setRevision((value) => value + 1), []);
  useEffect(() => {
    let active = true;
    setState((current) => current.data
      ? { ...current, refreshing: true, error: null }
      : { loading: true, refreshing: false, data: null, error: null });
    get(path).then((data) => {
      if (!active) return;
      writeRemoteCache(path, data);
      setState({ loading: false, refreshing: false, data, error: null });
    }).catch((error) => {
      if (!active) return;
      setState((current) => current.data
        ? { ...current, loading: false, refreshing: false, error: null }
        : { loading: false, refreshing: false, data: null, error });
    });
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
    const scripts = paths.filter(Boolean).map((src) => {
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
  const signature = links.filter(Boolean).join('|');
  const [readySignature, setReadySignature] = useState('');
  useLayoutEffect(() => {
    let disposed = false;
    const createdNodes = [];
    const hrefs = [...new Set(links.filter(Boolean))];
    const waits = hrefs.map((href) => new Promise((resolve) => {
      let link = [...document.querySelectorAll('link[rel="stylesheet"]')]
        .find((node) => node.getAttribute('href') === href);
      if (link?.dataset.daymomentLoaded === 'true' || link?.sheet) {
        resolve();
        return;
      }
      if (!link) {
        link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = href;
        link.dataset.daymomentStyle = 'true';
        createdNodes.push(link);
      }
      const complete = () => {
        link.dataset.daymomentLoaded = 'true';
        resolve();
      };
      link.addEventListener('load', complete, { once: true });
      link.addEventListener('error', complete, { once: true });
      if (!link.isConnected) document.head.appendChild(link);
    }));
    const reveal = () => {
      if (!disposed) setReadySignature(signature);
    };
    const fallback = window.setTimeout(reveal, 3500);
    Promise.all(waits).then(() => {
      window.clearTimeout(fallback);
      reveal();
    });
    return () => {
      disposed = true;
      window.clearTimeout(fallback);
      createdNodes.forEach((node) => node.remove());
    };
  }, [signature]); // eslint-disable-line react-hooks/exhaustive-deps
  return !signature || readySignature === signature;
}
