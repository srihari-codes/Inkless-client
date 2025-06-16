export const API_BASE_URL = "http://192.168.210.176:3000/api";

export const API_ENDPOINTS = {
  GENERATE_ID: `${API_BASE_URL}/generate-id`,
  MESSAGES: `${API_BASE_URL}/messages`, // Base messages endpoint
  GET_MESSAGES: (recipientId: string) =>
    `${API_BASE_URL}/messages/${recipientId}`, // New endpoint for getting messages
  CHECK_ID: `${API_BASE_URL}/check-id`,
  SEND_MESSAGE: `${API_BASE_URL}/messages/send`,
  DELETE_USER: (userId: string) => `${API_BASE_URL}/users/${userId}`,
  HEARTBEAT: (userId: string) => `${API_BASE_URL}/users/${userId}/heartbeat`, // NEW
  USER_EXISTS: (userId: string) => `${API_BASE_URL}/users/${userId}/exists`, // NEW
} as const;
