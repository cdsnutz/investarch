// Mirrors the call plan in base44/functions/runIpHunt: three signal sweeps with
// live web search, then ten synthesis batches of 35 seeds each — 350 per yield.
// The default model bills one integration credit per call; web-search calls can
// bill higher.
export const HUNT_SIGNAL_CALLS = 3;
export const HUNT_SEED_CALLS = 10;
export const HUNT_MODEL_CALLS = HUNT_SIGNAL_CALLS + HUNT_SEED_CALLS;
export const HUNT_WEB_SEARCH_CALLS = HUNT_SIGNAL_CALLS;
export const HUNT_CREDITS_FROM = HUNT_MODEL_CALLS;