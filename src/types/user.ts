export type UserRow = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  created_at: Date | null;
};

export type UserRowWithPassword = UserRow & {
  password: string | null;
};

export type PublicUser = {
  id: string;
  name: string | null;
  email: string;
  role: string;
  createdAt?: Date;
};

export type RegisterInput = {
  email: string;
  password: string;
  name: string | null;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthSession = {
  user: PublicUser;
  token: string;
};
