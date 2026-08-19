import pool from "./db";

export const SOCIAL_PLATFORMS = [
  "facebook",
  "instagram",
  "x",
  "linkedin",
  "youtube",
  "pinterest",
  "reddit",
];

const globalForSocialLinks = globalThis;

async function ensureSocialLinksTable() {
  if (!globalForSocialLinks.socialLinksSchemaPromise) {
    globalForSocialLinks.socialLinksSchemaPromise = pool
      .query(`
        CREATE TABLE IF NOT EXISTS site_social_links (
          platform TEXT PRIMARY KEY,
          url TEXT NOT NULL DEFAULT '',
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );

        INSERT INTO site_social_links (platform)
        VALUES ('facebook'), ('instagram'), ('x'), ('linkedin'), ('youtube'),
               ('pinterest'), ('reddit')
        ON CONFLICT (platform) DO NOTHING;
      `)
      .catch((error) => {
        globalForSocialLinks.socialLinksSchemaPromise = null;
        throw error;
      });
  }
  return globalForSocialLinks.socialLinksSchemaPromise;
}

export async function getSocialLinks() {
  await ensureSocialLinksTable();
  const { rows } = await pool.query(
    `SELECT platform, url
     FROM site_social_links
     WHERE platform = ANY($1::text[])`,
    [SOCIAL_PLATFORMS],
  );

  return Object.fromEntries(
    SOCIAL_PLATFORMS.map((platform) => [
      platform,
      rows.find((row) => row.platform === platform)?.url || "",
    ]),
  );
}

export async function saveSocialLinks(links) {
  await ensureSocialLinksTable();
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    for (const platform of SOCIAL_PLATFORMS) {
      await client.query(
        `INSERT INTO site_social_links (platform, url, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (platform) DO UPDATE
         SET url = EXCLUDED.url, updated_at = NOW()`,
        [platform, String(links[platform] || "").trim()],
      );
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return getSocialLinks();
}
