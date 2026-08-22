export type AuthUser = {
  id: number;
  name: string;
  email: string;
  role: string;
  agency_id?: number | null;
  branch_id?: number | null;
};

export const getToken = () => localStorage.getItem("token");

export const getUser = (): AuthUser | null => {
  const storedUser = localStorage.getItem("user");
  if (!storedUser) return null;

  try {
    return JSON.parse(storedUser);
  } catch {
    return null;
  }
};

export const setSession = (token: string, user: AuthUser) => {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
};

export const clearSession = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
};
