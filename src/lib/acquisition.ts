/** Last tagged campaign only; never store names, email, ad click IDs or full URLs. */
export const CAMPAIGN_COOKIE = "fcs_campaign";
const KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const;
export type Campaign = Partial<Record<(typeof KEYS)[number], string>>;

export function campaignFromSearch(search: string): Campaign {
  const params = new URLSearchParams(search);
  return Object.fromEntries(KEYS.flatMap((key) => {
    const value = params.get(key)?.trim();
    return value && /^[a-zA-Z0-9_. /:-]{1,100}$/.test(value) ? [[key, value]] : [];
  }));
}

export function parseCampaign(raw: string | undefined): Campaign {
  if (!raw || raw.length > 2000) return {};
  try {
    let value: unknown;
    try { value = JSON.parse(raw); } catch { value = JSON.parse(decodeURIComponent(raw)); }
    if (!value || typeof value !== "object" || Array.isArray(value)) return {};
    const params = new URLSearchParams();
    for (const key of KEYS) {
      const item = (value as Record<string, unknown>)[key];
      if (typeof item === "string") params.set(key, item);
    }
    return campaignFromSearch(params.toString());
  } catch { return {}; }
}

export function captureCampaign() {
  if (typeof window === "undefined") return;
  const campaign = campaignFromSearch(window.location.search);
  if (!campaign.utm_source && !campaign.utm_campaign) return;
  try {
    document.cookie = `${CAMPAIGN_COOKIE}=${encodeURIComponent(JSON.stringify(campaign))}; Path=/; Max-Age=2592000; SameSite=Lax${window.location.protocol === "https:" ? "; Secure" : ""}`;
  } catch { /* Attribution must never block signup or payment. */ }
}
