import { useCallback, useEffect, useLayoutEffect, useState } from 'react';
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
  const signature = links.filter(Boolean).join('|');
  useLayoutEffect(() => {
    let disposed = false;
    // A route can switch from the fallback template stylesheet to the real
    // invitation stylesheet after the API response arrives. Keep the boot
    // veil up until the new set of links is ready; otherwise a refresh can
    // briefly reveal raw, unstyled invitation markup.
    document.documentElement.classList.remove('app-styles-ready');
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
      if (!disposed) document.documentElement.classList.add('app-styles-ready');
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
}
