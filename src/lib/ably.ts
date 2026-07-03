import Ably from "ably";

const apiKey = process.env.ABLY_API;

if (!apiKey) {
  console.warn("WARNING: ABLY_API environment variable is not defined.");
}

export const ablyRest = apiKey ? new Ably.Rest({ key: apiKey }) : null;
