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

// TODO: mimic GitHub loading
const loading = document.createElement('p');
loading.textContent = 'Loading...';

(async () => {
  const targetEl = document.querySelector('#dashboard > div > feed-container > div[data-target="feed-container.content"]');
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
    oldDashboard.append(loading);

    targetEl.innerHTML = oldDashboard.innerHTML;
    // Wait for the new dashboard to be loaded
    targetEl.innerHTML = await fetchDashboardFeedHtml();
  }
})();
