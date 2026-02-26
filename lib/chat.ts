// This is a simple pub/sub pattern to allow opening chat from anywhere in the app

type ChatOpenCallback = (userId?: string, userData?: any) => void;

class ChatManager {
  private static instance: ChatManager;
  private callbacks: ChatOpenCallback[] = [];

  private constructor() {}

  static getInstance(): ChatManager {
    if (!ChatManager.instance) {
      ChatManager.instance = new ChatManager();
    }
    return ChatManager.instance;
  }

  subscribe(callback: ChatOpenCallback): void {
    this.callbacks.push(callback);
  }

  unsubscribe(callback: ChatOpenCallback): void {
    this.callbacks = this.callbacks.filter(cb => cb !== callback);
  }

  openChat(userId?: string, userData?: any): void {
    this.callbacks.forEach(callback => callback(userId, userData));
  }
}

export const chatManager = ChatManager.getInstance();