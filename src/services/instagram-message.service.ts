import axios, { isAxiosError } from "axios";
import ApiError from "@/utils/api-error";
import { findAccountById } from "@/repositories/account.repository";

export type CampaignContent = {
  content_type: "text" | "link" | "image" | "video" | "template";
  text_content?: string;
  media_url?: string;
  link_url?: string;
  buttons?: {
    label: string;
    action_type: "open_url" | "reply" | "trigger_post";
    action_value: string;
  }[];
};

export const sendCampaign = async ({
  accountId,
  recipientId,
  contents,
}: {
  accountId: string;
  recipientId: string;
  contents: CampaignContent[];
}) => {
  const account = await findAccountById(accountId);

  if (!account?.access_token) {
    throw new ApiError("HTTP_400_BAD_REQUEST", "Missing access token");
  }

  const url = "https://graph.instagram.com/v25.0/me/messages";
  const headers = {
    Authorization: `Bearer ${account.access_token}`,
  };

  for (const content of contents) {
    try {
      if (content.content_type === "text") {
       const res= await axios.post(
          url,
          {
            recipient: { id: recipientId },
            message: { text: content.text_content },
          },
          { headers }
        );
        console.log(res,account)
      } else if (content.content_type === "image") {
        await axios.post(
          url,
          {
            recipient: { id: recipientId },
            message: {
              attachment: {
                type: "image",
                payload: {
                  url: content.media_url,
                },
              },
            },
          },
          { headers }
        );
        if (content.text_content) {
          await axios.post(
            url,
            {
              recipient: { id: recipientId },
              message: { text: content.text_content },
            },
            { headers }
          );
        }
      } else if (content.content_type === "link") {
        await axios.post(
          url,
          {
            recipient: { id: recipientId },
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "button",
                  text: content.text_content || "Open link",
                  buttons: [
                    {
                      type: "web_url",
                      title: "Open",
                      url: content.link_url,
                    },
                  ],
                },
              },
            },
          },
          { headers }
        );
      } else if (content.content_type === "template") {
        const buttons =
          (content.buttons || [])
            .slice(0, 3)
            .map((btn) => {
              if (btn.action_type === "open_url") {
                return {
                  type: "web_url",
                  title: btn.label,
                  url: btn.action_value,
                };
              }
              return {
                type: "postback",
                title: btn.label,
                payload: btn.action_value,
              };
            });

        if (!buttons.length) {
          console.warn("Skipping template: no buttons");
          continue;
        }

        await axios.post(
          url,
          {
            recipient: { id: recipientId },
            message: {
              attachment: {
                type: "template",
                payload: {
                  template_type: "button",
                  text: content.text_content,
                  buttons,
                },
              },
            },
          },
          { headers }
        );
      }
    } catch (err) {
      if (isAxiosError(err)) {
        console.error("IG send failed", err.response?.data);
      }
      throw err;
    }
  }
};