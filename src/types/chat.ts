export interface User {
  _id: string;
  name: string;
  phone: string;
  createdAt?: string;
}

export interface LastMessage {
  text?: string;
  sender?: string; // sender userId
  createdAt?: string;
}

export interface DirectConversation {
  _id: string;
  type: 'direct';
  lastMessage: LastMessage;
  createdAt: string;
  updatedAt: string;
  participant: User; // The other user in the direct chat
}

export interface GroupConversation {
  _id: string;
  type: 'group';
  name: string;
  createdBy: string; // admin userId
  admins: string[]; // array of userIds
  participants: User[]; // array of all members (including admins and creator)
  lastMessage: LastMessage;
  createdAt: string;
  updatedAt: string;
}

export type Conversation = DirectConversation | GroupConversation;

export interface Message {
  _id: string;
  conversation: string; // conversationId
  sender: string; // userId of sender
  text: string;
  createdAt: string;
}

export interface MessagesResponse {
  messages: Message[];
  hasMore: boolean;
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SearchResponse {
  value: User[];
  Count: number;
}

export interface ConversationsResponse {
  data: Conversation[];
}
