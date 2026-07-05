const DEFAULT_NAVIGATION_TIMEOUT_MS = 120000;

export async function navigateForGalaAudit(
  page,
  url,
  { timeoutMs = DEFAULT_NAVIGATION_TIMEOUT_MS } = {},
) {
  const response = await page.goto(url, {
    timeout: timeoutMs,
    waitUntil: 'commit',
  });

  await page.waitForFunction(
    () => document.readyState !== 'loading'
      && Boolean(document.querySelector('#root')?.childElementCount),
    null,
    { timeout: timeoutMs },
  );

  return response;
}
