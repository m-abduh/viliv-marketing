const BASE = "https://api.buffer.com";

export async function getChannels(token) {
  const orgQuery = `query { account { organizations { id } } }`;
  const orgData = await graphql(token, orgQuery);
  const orgs = orgData.account?.organizations ?? [];
  if (!orgs.length) return { organizations: [], channels: [] };

  const chQuery = `query ($orgId: OrganizationId!) {
    channels(input: { organizationId: $orgId }) {
      id name service
    }
  }`;
  const chData = await graphql(token, chQuery, { orgId: orgs[0].id });
  const channels = chData.channels ?? [];
  return { organizations: orgs, channels };
}

/**
 * Create a carousel post on Buffer.
 * @param {string} token
 * @param {string} channelId
 * @param {string} text caption
 * @param {string[]} imageUrls ordered slide image URLs
 * @param {string} service (instagram | tiktok | twitter | facebook | linkedin | ...) — no youtube
 * @param {object} opts Channel-specific: { tiktokTitle }
 */
export async function createCarouselPost(token, channelId, text, imageUrls, service, opts = {}) {
  const assets = (imageUrls || [])
    .filter(Boolean)
    .map((url) => ({ image: { url } }));

  const input = {
    text,
    channelId,
    schedulingType: "automatic",
    mode: "shareNow",
    assets,
  };

  const metadata = buildMetadata(service, opts);
  if (metadata) input.metadata = metadata;

  const query = `mutation CreatePost($input: CreatePostInput!) {
    createPost(input: $input) {
      ... on PostActionSuccess {
        post { id text dueAt }
      }
      ... on MutationError { message }
    }
  }`;

  return graphql(token, query, { input });
}

function buildMetadata(service, { tiktokTitle } = {}) {
  switch ((service || "").toLowerCase()) {
    case "instagram":
      return { instagram: { type: "post", shouldShareToFeed: true } };
    case "tiktok": {
      // TikTok photo (carousel) posts use the meta title field.
      const tm = { tiktok: {} };
      if (tiktokTitle) tm.tiktok.title = tiktokTitle;
      return tm;
    }
    default:
      return null;
  }
}

async function graphql(token, query, variables = {}) {
  const res = await fetch(BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Buffer API error ${res.status}: ${err}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(`Buffer GraphQL error: ${json.errors.map((e) => e.message).join("; ")}`);
  }

  return json.data;
}