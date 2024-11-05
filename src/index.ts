import 'typed-query-selector';

const fetchDashboardFeedHtml = async () => {
  const res = await fetch('https://github.com/dashboard-feed', {
    headers: {
      // With this header, GitHub will not return App Shell, only the content's HTML
      'X-Requested-With': 'XMLHttpRequest'
    }
  });
  return res.text();
};

/** create dom from html string */
const stringToDOM = (html: string) => {
  const t = document.createElement('template');
  t.innerHTML = html;
  return t.content.firstChild as HTMLElement;
};

const css = (string: TemplateStringsArray, ...values: any[]) => string.reduce((acc, str, i) => acc + str + (values[i] ?? ''), '');

(async () => {
  document.head.appendChild(document.createElement('style')).textContent = css`
    /** GitHub Feed Filter Menu */
    #feed-filter-menu {
      display: none;
    }

    /** GitHub Feed...back Link */
    a[href*="github.com/orgs/github-community/discussions/categories/feed"] {
      display: none;
    }
  `

  const targetEl = document.querySelector('#dashboard > div > feed-container > div[data-target="feed-container.content"]');

  /**
   * Disable loading of the old feed, to save bandwidth
   */
  const ignoreForYouFeedFetch = (request: Request) => {
    if (request.url === 'https://github.com/conduit/for_you_feed') {
      return Promise.resolve(new Response('', { status: 204 }));
    }
    console.log({ request });
    request.headers.append('X-Requested-With', 'XMLHttpRequest');
    return window.fetch(request);
  };

  let handle: number | null = null;

  const patchGithubIncludeFragmentElementFetch = () => {
    if ('IncludeFragmentElement' in window) {
      if (handle != null) {
        window.cancelAnimationFrame(handle);
        handle = null;
      }

      (window.IncludeFragmentElement as any).prototype.fetch = ignoreForYouFeedFetch;
    } else {
      window.requestAnimationFrame(patchGithubIncludeFragmentElementFetch);
    }
  };
  window.requestAnimationFrame(patchGithubIncludeFragmentElementFetch);

  if (targetEl) {
    // refine-github's infinite-scroll feature is targetting `[role="tabpanel"]:not([hidden]) button.ajax-pagination-btn`
    // Add the missing `role="tabpanel"` to the target element to make it work
    targetEl.role = 'tabpanel';

    // adjust margin
    const contentEl = document.querySelector('div.feed-content');
    if (contentEl) {
      contentEl.style.maxWidth = 'calc(1440px + var(--feed-sidebar) + 48px)';
    }
    const mainEl = document.querySelector('div.feed-main');
    if (mainEl) {
      mainEl.style.maxWidth = '1440px';
    }

    const oldDashboard = document.createElement('template');
    oldDashboard.append(stringToDOM(`
    <div class="text-center">
      <picture>
        <source srcset="https://github.githubassets.com/images/mona-loading-dark.gif" media="(prefers-color-scheme: dark)">
        <source srcset="https://github.githubassets.com/images/mona-loading-default.gif" media="(prefers-color-scheme: light), (prefers-color-scheme: no-preference)">
        <img src="https://github.githubassets.com/images/mona-loading-default.gif" width="48" alt="Loading your activity..." class="mt-4 hide-reduced-motion">
      </picture>
      <picture>
        <source srcset="https://github.githubassets.com/images/mona-loading-dark-static.svg" media="(prefers-color-scheme: dark)">
        <source srcset="https://github.githubassets.com/images/mona-loading-default-static.svg" media="(prefers-color-scheme: light), (prefers-color-scheme: no-preference)">
        <img src="https://github.githubassets.com/images/mona-loading-default-static.svg" width="48" alt="Loading your activity..." class="mt-4 hide-no-pref-motion">
      </picture>
      <p class="color-fg-muted my-2">One moment please...</p>
    </div>
    `));

    targetEl.innerHTML = oldDashboard.innerHTML;
    // Wait for the new dashboard to be loaded
    targetEl.innerHTML = await fetchDashboardFeedHtml();
  }
})();
