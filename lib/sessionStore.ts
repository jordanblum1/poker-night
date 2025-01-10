import fs from 'fs';
import path from 'path';

export interface Player {
  name: string;
  buyInAmount: number;
  finalAmount?: number;
  venmoHandle?: string;
  status: 'pending' | 'submitted';
}

export interface Session {
  id: string;
  createdAt: Date;
  status: 'active' | 'pending_settlement' | 'settled';
  players: Player[];
}

class SessionStore {
  private sessions: Map<string, Session> = new Map();
  private storePath: string;

  constructor() {
    // Set up storage path
    this.storePath = path.join(process.cwd(), '.sessions');
    this.initializeStore();

    // Clean up old sessions every hour
    setInterval(() => {
      this.cleanupOldSessions();
    }, 60 * 60 * 1000);
  }

  private validatePlayer(player: any): player is Player {
    if (!player || typeof player !== 'object') return false;
    
    // Required fields
    if (typeof player.name !== 'string' || player.name.trim() === '') return false;
    if (typeof player.buyInAmount !== 'number' || isNaN(player.buyInAmount)) return false;
    if (typeof player.status !== 'string' || !['pending', 'submitted'].includes(player.status)) return false;

    // Optional fields
    if (player.finalAmount !== undefined && (typeof player.finalAmount !== 'number' || isNaN(player.finalAmount))) return false;
    if (player.venmoHandle !== undefined && (typeof player.venmoHandle !== 'string' || !player.venmoHandle.startsWith('@'))) return false;

    return true;
  }

  private validateSession(session: any): session is Session {
    if (!session || typeof session !== 'object') return false;

    // Required fields
    if (typeof session.id !== 'string' || session.id.trim() === '') return false;
    if (!(session.createdAt instanceof Date) || isNaN(session.createdAt.getTime())) return false;
    if (typeof session.status !== 'string' || !['active', 'pending_settlement', 'settled'].includes(session.status)) return false;
    if (!Array.isArray(session.players)) return false;

    // Validate each player
    for (const player of session.players) {
      if (!this.validatePlayer(player)) return false;
    }

    return true;
  }

  private initializeStore() {
    try {
      // Create sessions directory if it doesn't exist
      if (!fs.existsSync(this.storePath)) {
        fs.mkdirSync(this.storePath, { recursive: true });
      }

      // Load existing sessions
      const files = fs.readdirSync(this.storePath);
      files.forEach(file => {
        if (file.endsWith('.json')) {
          try {
            const sessionId = file.replace('.json', '');
            const data = fs.readFileSync(path.join(this.storePath, file), 'utf-8');
            const parsedData = JSON.parse(data);
            
            // Convert createdAt string to Date
            parsedData.createdAt = new Date(parsedData.createdAt);

            // Validate session data
            if (this.validateSession(parsedData)) {
              this.sessions.set(sessionId, parsedData);
            } else {
              console.error(`Invalid session data for ${sessionId}, skipping...`);
              // Optionally move invalid files to a backup directory
              this.moveToBackup(file);
            }
          } catch (err) {
            console.error(`Failed to load session from ${file}:`, err);
            // Optionally move corrupted files to a backup directory
            this.moveToBackup(file);
          }
        }
      });
    } catch (error) {
      console.error('Failed to initialize session store:', error);
    }
  }

  private moveToBackup(filename: string) {
    try {
      const backupDir = path.join(this.storePath, 'backup');
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      const source = path.join(this.storePath, filename);
      const destination = path.join(backupDir, `${filename}.${Date.now()}.bak`);
      
      fs.renameSync(source, destination);
      console.log(`Moved invalid session file to ${destination}`);
    } catch (error) {
      console.error('Failed to move file to backup:', error);
    }
  }

  private saveSession(session: Session) {
    try {
      // Validate before saving
      if (!this.validateSession(session)) {
        throw new Error('Invalid session data');
      }

      const filePath = path.join(this.storePath, `${session.id}.json`);
      fs.writeFileSync(filePath, JSON.stringify(session, null, 2));
    } catch (error) {
      console.error('Failed to save session:', error);
      throw error; // Re-throw to handle in the calling function
    }
  }

  private deleteSessionFile(id: string) {
    try {
      const filePath = path.join(this.storePath, `${id}.json`);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (error) {
      console.error('Failed to delete session file:', error);
    }
  }

  private cleanupOldSessions() {
    const ONE_DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    
    this.sessions.forEach((session, id) => {
      if (now - session.createdAt.getTime() > ONE_DAY) {
        this.sessions.delete(id);
        this.deleteSessionFile(id);
      }
    });
  }

  createSession(): Session {
    const id = Math.random().toString(36).substring(2, 15);
    const session: Session = {
      id,
      createdAt: new Date(),
      status: 'active',
      players: [],
    };

    // Validate new session
    if (!this.validateSession(session)) {
      throw new Error('Failed to create valid session');
    }

    this.sessions.set(id, session);
    this.saveSession(session);
    return session;
  }

  getSession(id: string): Session | undefined {
    const session = this.sessions.get(id);
    if (session && !this.validateSession(session)) {
      console.error(`Invalid session data for ${id}, removing from store`);
      this.sessions.delete(id);
      return undefined;
    }
    return session;
  }

  updateSession(id: string, updates: Partial<Session>): Session | undefined {
    const session = this.sessions.get(id);
    if (!session) return undefined;

    const updatedSession = {
      ...session,
      ...updates,
    };

    // Validate updated session
    if (!this.validateSession(updatedSession)) {
      throw new Error('Invalid session update data');
    }

    this.sessions.set(id, updatedSession);
    this.saveSession(updatedSession);
    return updatedSession;
  }

  addPlayer(sessionId: string, player: Omit<Player, 'status'>): Player | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const newPlayer: Player = {
      ...player,
      status: 'pending',
    };

    // Validate new player
    if (!this.validatePlayer(newPlayer)) {
      throw new Error('Invalid player data');
    }

    session.players.push(newPlayer);
    this.saveSession(session);
    return newPlayer;
  }

  updatePlayer(sessionId: string, playerName: string, updates: Partial<Player>): Player | undefined {
    const session = this.sessions.get(sessionId);
    if (!session) return undefined;

    const player = session.players.find(p => p.name === playerName);
    if (!player) return undefined;

    const updatedPlayer = { ...player, ...updates };

    // Validate updated player
    if (!this.validatePlayer(updatedPlayer)) {
      throw new Error('Invalid player update data');
    }

    Object.assign(player, updates);
    this.saveSession(session);
    return player;
  }

  getAllSessions(): Session[] {
    // Filter out any invalid sessions before returning
    return Array.from(this.sessions.values()).filter(session => this.validateSession(session));
  }
}

// Export a singleton instance
export const sessionStore = new SessionStore(); 