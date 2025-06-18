export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const API_ENDPOINTS = {
  GENERATE_ID: `${API_BASE_URL}/generate-id`,
  MESSAGES: `${API_BASE_URL}/messages`,
  GET_MESSAGES: (recipientId: string) =>
    `${API_BASE_URL}/messages/${recipientId}`,
  CHECK_ID: `${API_BASE_URL}/check-id`,
  SEND_MESSAGE: `${API_BASE_URL}/messages/send`,
  DELETE_USER: (userId: string) => `${API_BASE_URL}/users/${userId}`,
  HEARTBEAT: (userId: string) => `${API_BASE_URL}/users/${userId}/heartbeat`,
  USER_EXISTS: (userId: string) => `${API_BASE_URL}/users/${userId}/exists`,
  CUSTOM_ID: (id: string) => `${API_BASE_URL}/custom-id/${id}`,
} as const;
