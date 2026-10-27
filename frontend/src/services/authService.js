
import api from "./api";

export const forgotPassword = async (email) => {
  const response = await api.post("/auth/forgot-password", {
    email,
  });

  return response.data;
};

export const resetPassword = async (token, newPassword) => {
  const response = await api.post("/auth/reset-password", {
    token,
    newPassword,
  });

  return response.data;
};
