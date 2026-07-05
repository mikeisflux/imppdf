// Edge-safe user-agent classification (no server-only imports) — shared by the
// Next middleware and the server-side bot blocker.

// Search-engine + social crawlers we ALWAYS allow so the site stays indexable
// and OG/link previews work. Matches the printingcomics allow-crawlers policy.
const SEARCH_ENGINE_UA = /(googlebot|google-inspectiontool|storebot-google|bingbot|adidxbot|slurp|duckduckbot|baiduspider|yandex(bot|images|mobilebot)|sogou|exabot|applebot|petalbot|bravebot|mojeekbot|seznambot|ecosia)/i;
const SOCIAL_UA = /(facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|slack-imgproxy|discordbot|whatsapp|telegrambot|pinterest|redditbot|embedly|skypeuripreview|vkshare|googlebot-image)/i;

// Clearly-malicious scanners / exploit tools — safe to hard-block by UA.
const MALICIOUS_UA = /(sqlmap|nikto|nmap|masscan|nuclei|dirbuster|gobuster|wpscan|acunetix|nessus|zgrab|hydra|metasploit|xrumer|havij|feroxbuster|dalfox)/i;

export function isSearchEngine(ua: string): boolean {
  return SEARCH_ENGINE_UA.test(ua) || SOCIAL_UA.test(ua);
}
export function isMaliciousBot(ua: string): boolean {
  return MALICIOUS_UA.test(ua);
}
