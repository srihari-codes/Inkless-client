export interface User {
  id: string;
  createdAt: string;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: string;
}

export interface MessageWithSender extends Message {
  senderIdDisplay: string;
}