import Dexie, { type EntityTable } from 'dexie';

interface PrivateKey {
  privateKey: string;
}

interface JwtToken {
  id: string; // clé primaire fixe
  token: string;
}

class SwDatabase extends Dexie {
  public keys!: EntityTable<PrivateKey, 'privateKey'>;
  public jwt!: EntityTable<JwtToken, 'id'>;

  constructor() {
    super('SecuredWhisker');

    this.version(1).stores({
      keys: 'privateKey',
      jwt: 'id',
    });

    this.keys = this.table('keys');
    this.jwt = this.table('jwt'); // <- assignation
  }

  async addPrivateKey(privateKey: string): Promise<void> {
    await this.keys.add({ privateKey });
  }

  async getPrivateKey(): Promise<PrivateKey | undefined> {
    return await this.keys.get('privateKey');
  }

  async saveJwtToken(token: string): Promise<void> {
    await this.jwt.put({ id: 'auth_token', token }); // id fixe
  }

  async getJwtToken(): Promise<string | null> {
    const result = await this.jwt.get('auth_token');
    return result?.token ?? null;
  }
}

export const SwDb = new SwDatabase();
export type { PrivateKey };
