import { StreamConsumer } from './types';

export interface RabbitMQApiClientConfig {
  apiUrl: string;
  timeout?: number;
  username?: string;
  password?: string;
}

export class RabbitMQApiClient {
  private apiUrl: string;
  private timeout: number;
  private authHeader: string | undefined;

  constructor(config: RabbitMQApiClientConfig) {
    this.apiUrl = config.apiUrl;
    this.timeout = config.timeout || 10000;
    
    // Crea l'header di autenticazione Basic se username e password sono forniti
    if (config.username && config.password) {
      const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      this.authHeader = `Basic ${credentials}`;
    }
  }

  /**
   * Recupera i dati dei consumatori stream da RabbitMQ API
   * @returns Promise con l'array di StreamConsumer
   * @throws Error se la richiesta fallisce
   */
  async fetchStreamConsumers(): Promise<StreamConsumer[]> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };

      // Aggiungi l'header di autenticazione se presente
      if (this.authHeader) {
        headers['Authorization'] = this.authHeader;
      }

      const response = await fetch(this.apiUrl + '/stream/consumers', {
        method: 'GET',
        headers,
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [];
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Errore nel recupero dati da RabbitMQ API: ${errorMessage}`);
    }
  }
}

