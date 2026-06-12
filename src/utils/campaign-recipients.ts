import { ALL_RECIPIENTS_TOKENS } from "@/types/campaign";
import type { AudienceScope } from "@/types/campaign";
import ApiError from "@/utils/api-error";

export type ParsedRecipientInput = {
  audienceScope: AudienceScope;
  recipientIds: string[];
};

export const parseRecipientIdsInput = (
  raw: unknown
): ParsedRecipientInput => {
  if (!Array.isArray(raw)) {
    return { audienceScope: "specific", recipientIds: [] };
  }

  const tokens = raw
    .filter((id): id is string => typeof id === "string" && id.trim().length > 0)
    .map((id) => id.trim().toLowerCase());

  const hasAllToken = tokens.some((t) =>
    (ALL_RECIPIENTS_TOKENS as readonly string[]).includes(t)
  );

  if (hasAllToken) {
    if (tokens.length > 1) {
      throw new ApiError(
        "HTTP_400_BAD_REQUEST",
        'Use recipient_ids: ["*"] alone to target all subscribers, or pass specific contact UUIDs'
      );
    }
    return { audienceScope: "all_subscribers", recipientIds: [] };
  }

  return {
    audienceScope: "specific",
    recipientIds: tokens,
  };
};
