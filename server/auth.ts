import { createHmac, randomBytes, randomUUID, timingSafeEqual } from 'crypto';

interface User {
  id: string;
  username: string;
  passwordHash: string;
  role: 'user' | 'admin' | 'service';
  createdAt: string;
  updatedAt: string;
}

interface AuthSession {
  id: string;
  userId: string;
  issuedAt: string;
  expiresAt: string;
  revokedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface AuthPrincipal {
  userId: string;
  username: string;
  role: User['role'];
  sessionId: string;
  expiresAt: string;
  metadata?: Record<string, unknown>;
}

interface AuthManagerOptions {
  sessionSecret?: string;
  sessionTtlMs?: number;
  environment?: string;
}

const DEFAULT_SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const DEV_SESSION_SECRET = 'dev-local-auth-secret';

function resolveSessionSecret(options?: AuthManagerOptions) {
  const explicit = options?.sessionSecret?.trim();
  if (explicit) {
    return explicit;
  }

  const fromEnv = process.env.AUTH_SESSION_SECRET?.trim();
  if (fromEnv) {
    return fromEnv;
  }

  const environment = options?.environment ?? process.env.NODE_ENV ?? 'development';
  if (environment === 'production') {
    throw new Error('AUTH_SESSION_SECRET is required for production auth sessions.');
  }

  return DEV_SESSION_SECRET;
}

function parseBearerToken(tokenOrHeader: string) {
  return tokenOrHeader.startsWith('Bearer ')
    ? tokenOrHeader.slice('Bearer '.length).trim()
    : tokenOrHeader.trim();
}

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export class AuthManager {
  private readonly users = new Map<string, User>();
  private readonly usersById = new Map<string, User>();
  private readonly sessions = new Map<string, AuthSession>();
  private readonly sessionSecret: string;
  private readonly sessionTtlMs: number;

  constructor(options?: AuthManagerOptions) {
    this.sessionSecret = resolveSessionSecret(options);
    this.sessionTtlMs = options?.sessionTtlMs ?? DEFAULT_SESSION_TTL_MS;
  }

  register(username: string, passwordHash: string, role: User['role'] = 'user'): User | null {
    if (this.users.has(username)) {
      return null;
    }

    const now = new Date().toISOString();
    const user: User = {
      id: randomUUID(),
      username,
      passwordHash,
      role,
      createdAt: now,
      updatedAt: now
    };

    this.users.set(username, user);
    this.usersById.set(user.id, user);
    return user;
  }

  login(
    username: string,
    passwordHash: string,
    metadata?: Record<string, unknown>
  ): { user: User; sessionToken: string; session: AuthSession } | null {
    const user = this.users.get(username);
    if (!user || !secureEquals(user.passwordHash, passwordHash)) {
      return null;
    }

    const session = this.issueSession(user.id, metadata);
    return {
      user,
      sessionToken: this.serializeSessionToken(session.id),
      session
    };
  }

  issueSession(userId: string, metadata?: Record<string, unknown>) {
    const user = this.usersById.get(userId);
    if (!user) {
      throw new Error(`Cannot issue session for unknown user ${userId}`);
    }

    const issuedAt = new Date();
    const session: AuthSession = {
      id: `${randomUUID()}-${randomBytes(12).toString('hex')}`,
      userId,
      issuedAt: issuedAt.toISOString(),
      expiresAt: new Date(issuedAt.getTime() + this.sessionTtlMs).toISOString(),
      metadata
    };

    this.sessions.set(session.id, session);
    return session;
  }

  validateSessionToken(tokenOrHeader: string): AuthPrincipal | null {
    const token = parseBearerToken(tokenOrHeader);
    const [sessionId, signature] = token.split('.');
    if (!sessionId || !signature) {
      return null;
    }

    const expectedSignature = this.signSessionId(sessionId);
    if (!secureEquals(expectedSignature, signature)) {
      return null;
    }

    const session = this.sessions.get(sessionId);
    if (!session || session.revokedAt) {
      return null;
    }

    if (new Date(session.expiresAt).getTime() <= Date.now()) {
      this.sessions.delete(sessionId);
      return null;
    }

    const user = this.usersById.get(session.userId);
    if (!user) {
      return null;
    }

    return {
      userId: user.id,
      username: user.username,
      role: user.role,
      sessionId: session.id,
      expiresAt: session.expiresAt,
      metadata: session.metadata
    };
  }

  revokeSession(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session || session.revokedAt) {
      return false;
    }

    session.revokedAt = new Date().toISOString();
    this.sessions.set(sessionId, session);
    return true;
  }

  getUserById(id: string): User | undefined {
    return this.usersById.get(id);
  }

  private serializeSessionToken(sessionId: string) {
    return `${sessionId}.${this.signSessionId(sessionId)}`;
  }

  private signSessionId(sessionId: string) {
    return createHmac('sha256', this.sessionSecret)
      .update(sessionId)
      .digest('hex');
  }
}
