export const leadEmailGuessingService = {
  /**
   * Helper to guess/extract email from a domain if not provided
   */
  guessEmail(domain?: string, _companyName?: string): string {
    if (!domain) return '';

    // Strip http/https/www
    const cleanDomain = domain.replace(/^(?:https?:\/\/)?(?:www\.)?/i, '').split('/')[0];
    if (!cleanDomain) return '';

    // Heuristic: common addresses
    return `info@${cleanDomain}`;
  },
};
