import type { PublicUser, UserRow } from "@/types/user";

export const mapPublicUser = (row: UserRow): PublicUser => ({
  id: row.id,
  name: row.name,
  email: row.email,
  role: row.role,
  ...(row.created_at != null && { createdAt: row.created_at }),
});
