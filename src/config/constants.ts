export const API_BASE_URL = "http://localhost:3000/api";

export const API_ENDPOINTS = {
  GENERATE_ID: `${API_BASE_URL}/generate-id`,
  MESSAGES: `${API_BASE_URL}/messages`, // Base messages endpoint
  GET_MESSAGES: (recipientId: string) =>
    `${API_BASE_URL}/messages/${recipientId}`, // New endpoint for getting messages
  CHECK_ID: `${API_BASE_URL}/check-id`,
  SEND_MESSAGE: `${API_BASE_URL}/messages/send`,
} as const;
