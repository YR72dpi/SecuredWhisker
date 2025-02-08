import Dexie, { type EntityTable } from 'dexie';

interface PrivateKey {
  privateKey: string;
}

class SwDatabase extends Dexie {
  public keys!: EntityTable<PrivateKey, 'privateKey'>;

  constructor() {
    super('SecuredWhisker');

    this.version(1).stores({
      keys: 'privateKey'
    });

    this.keys = this.table('keys');
  }

  async addPrivateKey(privateKey: string): Promise<void> {
    await this.keys.add({ privateKey });
  }

  async getPrivateKey(): Promise<PrivateKey | undefined> {
    return await this.keys.get('privateKey');
  }
}

export const SwDb = new SwDatabase();
export type { PrivateKey };
