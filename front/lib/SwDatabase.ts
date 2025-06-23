import Dexie, { type EntityTable } from 'dexie';

interface PrivateKey {
  privateKey: string;
}

interface JwtToken {
  id: string;
  token: string;
}

class SwDatabase extends Dexie {
  public keys!: EntityTable<PrivateKey & { id: string }, 'id'>;
  public jwt!: EntityTable<JwtToken, 'id'>;

  constructor() {
    super('SecuredWhisker');

    this.version(2).stores({
      keys: 'id',
      jwt: 'id',
    });

    this.keys = this.table('keys');
    this.jwt = this.table('jwt');
  }

  async addPrivateKey(privateKey: string): Promise<void> {
    await this.keys.put({ id: 'main_private_key', privateKey });
  }

  async getPrivateKey(): Promise<PrivateKey | undefined> {
    const result = await this.keys.get('main_private_key');
    if (result) {
      return { privateKey: result.privateKey };
    }
    return undefined;
  }

  async saveJwtToken(token: string): Promise<void> {
    await this.jwt.put({ id: 'auth_token', token });
  }

  async getJwtToken(): Promise<string | null> {
    const result = await this.jwt.get('auth_token');
    return result?.token ?? null;
  }
}

export const SwDb = new SwDatabase();
export type { PrivateKey };
