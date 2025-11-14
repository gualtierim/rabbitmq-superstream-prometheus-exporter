import 'dotenv/config';
import express, { Request, Response } from 'express';
import { Registry, Gauge } from 'prom-client';
import { StreamConsumer } from './types';
import { RabbitMQApiClient } from './RabbitMQApiClient';
import { StreamMetrics } from './StreamMetrics';

const app = express();
const port = parseInt(process.env.PORT || '9090', 10);
const rabbitmqApiUrl = process.env.RABBITMQ_API_URL;
const rabbitmqUsername = process.env.RABBITMQ_USERNAME;
const rabbitmqPassword = process.env.RABBITMQ_PASSWORD;
const refreshInterval = parseInt(process.env.REFRESH_INTERVAL_MS || '30000', 10);
const apiTimeout = parseInt(process.env.RABBITMQ_API_TIMEOUT || '10000', 10);
let lastScrapeUnixTimestamp = 0;

if (!rabbitmqApiUrl) {
  throw new Error('RABBITMQ_API_URL is not set');
}

// Inizializza il client API RabbitMQ
const rabbitMQClient = new RabbitMQApiClient({
  apiUrl: rabbitmqApiUrl,
  timeout: apiTimeout,
  username: rabbitmqUsername,
  password: rabbitmqPassword
});

// Crea un nuovo registry per le metriche
const register = new Registry();

// Inizializza le metriche degli stream
const streamMetrics = new StreamMetrics(register);

const exporterLastScrape = new Gauge({
  name: 'rabbitmq_stream_exporter_last_scrape_timestamp',
  help: 'Timestamp of the last successful scrape',
  registers: [register]
});

// Funzione per aggiornare le metriche
async function updateMetrics(): Promise<void> {
  try {
    const data = await rabbitMQClient.fetchStreamConsumers();
    if (data.length === 0) {
      console.warn('Nessun consumer trovato');
      return;
    }

    streamMetrics.resetAll();
    data.forEach((consumer: StreamConsumer) => {
      streamMetrics.updateForConsumer(consumer);
    });
  } catch (error) {
    console.error('Errore nell\'aggiornamento delle metriche:', error);
  }

  lastScrapeUnixTimestamp = new Date().getTime();
  exporterLastScrape.set(lastScrapeUnixTimestamp);
}

// Endpoint per le metriche Prometheus
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (error) {
    res.status(500).end((error as Error).message);
  }
});

// Endpoint di health check
app.get('/health', (req: Request, res: Response) => {
  const isOk = lastScrapeUnixTimestamp && lastScrapeUnixTimestamp > Date.now() - (refreshInterval * 3);
  if(!isOk) {
    res.status(500).end('Last scrape is too old');
  }
  res.json({ status: 'ok', lastScrapeUnixTimestamp: lastScrapeUnixTimestamp });
});

// Endpoint root
app.get('/', (req: Request, res: Response) => {
  res.json({
    name: 'RabbitMQ Stream Prometheus Exporter',
    version: '1.0.0',
    endpoints: {
      metrics: '/metrics',
      health: '/health'
    }
  });
});

// Funzione di inizializzazione
async function start(): Promise<void> {
  // Avvia l'aggiornamento periodico delle metriche
  updateMetrics(); // Prima chiamata immediata
  setInterval(updateMetrics, refreshInterval);

  // Avvia il server
  app.listen(port, () => {
    console.log(`RabbitMQ Stream Prometheus Exporter listening on port ${port}`);
    console.log(`API RabbitMQ: ${rabbitmqApiUrl}`);
    console.log(`Update interval: ${refreshInterval}ms`);
    console.log(`Metrics available on: http://localhost:${port}/metrics`);
  });
}

// Gestione graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down...');
  process.exit(0);
});

// Start the application
start().catch((error) => {
  console.error('Error starting the application:', error);
  process.exit(1);
});

