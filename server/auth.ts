import { v4 as uuidv4 } from 'uuid';

interface User {
  id: string;
  username: string;
  passwordHash: string; // Simplified for this prototype
}

/**
 * AuthManager
 * Handles basic user registration and authentication logic.
 */
export class AuthManager {
  private users: Map<string, User> = new Map();

  /**
   * Registers a new user.
   */
  register(username: string, passwordHash: string): User | null {
    if (this.users.has(username)) return null;
    
    const user: User = {
      id: uuidv4(),
      username,
      passwordHash
    };
    
    this.users.set(username, user);
    console.log(`[Auth] User registered: ${username} (${user.id})`);
    return user;
  }

  /**
   * Simple login verification.
   */
  login(username: string, passwordHash: string): User | null {
    const user = this.users.get(username);
    if (user && user.passwordHash === passwordHash) {
      console.log(`[Auth] User logged in: ${username}`);
      return user;
    }
    return null;
  }

  /**
   * Retrieves a user by ID.
   */
  getUserById(id: string): User | undefined {
    return Array.from(this.users.values()).find(u => u.id === id);
  }
}
