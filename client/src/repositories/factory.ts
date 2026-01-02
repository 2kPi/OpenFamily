import { IDataRepository, ServerConfig } from './interface';
import { ServerRepository } from './server';

/**
 * Factory simplifié - TOUJOURS utilise PostgreSQL via serveur
 */
export class RepositoryFactory {
  private static instance: IDataRepository | null = null;

  static getRepository(): IDataRepository {
    if (!this.instance) {
      this.instance = this.createRepository();
    }
    return this.instance;
  }

  static resetRepository(): void {
    this.instance = null;
  }

  private static getApiUrl(): string {
    const { protocol, hostname } = window.location;
    
    // Si hébergé sur serveur distant
    if (hostname !== 'localhost' && hostname !== '127.0.0.1' && hostname !== '') {
      return `${protocol}//${hostname}:3001/api`;
    }
    
    // En développement local
    return 'http://localhost:3001/api';
  }

  private static getServerConfig(): ServerConfig {
    return {
      apiUrl: this.getApiUrl(),
      authToken: 'default-token',
      familyId: 'family-default',
    };
  }

  private static createRepository(): IDataRepository {
    const config = this.getServerConfig();
    return new ServerRepository(config);
  }
}
