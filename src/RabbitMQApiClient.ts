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
    
    // Create Basic authentication header if username and password are provided
    if (config.username && config.password) {
      const credentials = Buffer.from(`${config.username}:${config.password}`).toString('base64');
      this.authHeader = `Basic ${credentials}`;
    }
  }

  /**
   * Fetches stream consumer data from RabbitMQ API
   * @returns Promise with the StreamConsumer array
   * @throws Error if the request fails
   */
  async fetchStreamConsumers(): Promise<StreamConsumer[]> {
    try {
      const headers: Record<string, string> = {
        'Accept': 'application/json'
      };

      // Add authentication header if present
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
      throw new Error(`Error fetching data from RabbitMQ API: ${errorMessage}`);
    }
  }
}

