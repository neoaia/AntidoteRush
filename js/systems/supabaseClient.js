const SUPABASE_URL = "https://cprdiicpyhoffplomoek.supabase.co"; // ← replace
const SUPABASE_ANON_KEY = "sb_publishable_GaAz-cXfjJGlUD_vfxZbQw_UL1jjvIx";

const supabaseClient = {
  async upsertScore(entry) {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/leaderboard`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_ANON_KEY,
        Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        Prefer: "resolution=merge-duplicates", // upsert behavior
      },
      body: JSON.stringify({
        name: entry.name,
        difficulty: entry.difficulty,
        round: entry.round,
        level: entry.level,
        zombies_killed: entry.zombiesKilled,
        score: entry.score,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("Supabase upsert failed:", err);
      return false;
    }
    return true;
  },

  async fetchLeaderboard(difficulty) {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/leaderboard?difficulty=eq.${difficulty}&order=score.desc,round.desc&limit=50`,
      {
        headers: {
          apikey: SUPABASE_ANON_KEY,
          Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
        },
      },
    );

    if (!response.ok) {
      console.error("Supabase fetch failed:", await response.text());
      return [];
    }

    return await response.json();
  },
};
