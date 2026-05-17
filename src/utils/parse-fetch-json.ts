export type FetchResponse = Awaited<ReturnType<typeof fetch>>;

export const parseFetchJson = async (
  fetchRes: FetchResponse
): Promise<unknown> => {
  const text = await fetchRes.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return text;
  }
};
