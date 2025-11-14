# RabbitMQ Stream Prometheus Exporter

Prometheus exporter for RabbitMQ stream metrics. This exporter retrieves information about RabbitMQ stream consumers via the management API and exposes them in Prometheus format.

## Pre-requisites
- Enable rabbitmq_stream plugin
- Enable rabbitmq_management plugin
- Enable rabbitmq_stream_management plugin

## Features

- Exposes Prometheus metrics for each RabbitMQ stream
- Monitors consumers, offset, lag, and status
- Automatic periodic data updates
- Health check endpoint
- Robust error handling

## Exposed Metrics

### `rabbitmq_stream_consumers_total`
Total number of consumers per stream (labels: `stream`, `consumer_name`). Type: Counter.

### `rabbitmq_stream_consumer_active_offset`
Current offset of the active consumer (labels: `stream`, `consumer_name`). Type: Gauge. Exposed only for active consumers.

### `rabbitmq_stream_consumer_active_offset_lag`
Lag of the active consumer (difference between stream end and consumer offset) (labels: `stream`, `consumer_name`). Type: Gauge. Exposed only for active consumers.

### `rabbitmq_stream_consumer_active_messages_consumed_total`
Total number of messages consumed by the active consumer (labels: `stream`, `consumer_name`). Type: Gauge. Exposed only for active consumers.

### `rabbitmq_stream_consumer_active_status`
Consumer status: 1 if active, 0 if inactive (labels: `stream`, `consumer_name`). Type: Counter.

### `rabbitmq_stream_exporter_last_scrape_timestamp`
Timestamp of the last successful scrape. Type: Gauge.

## Installation

```bash
npm install
```

## Configuration

The exporter can be configured via environment variables:

- `PORT`: Port to expose metrics on (default: `9090`)
- `RABBITMQ_API_URL`: Base URL of the RabbitMQ Management API (required). Example: `http://localhost:15672/api/`
- `RABBITMQ_USERNAME`: Username for Basic authentication (optional)
- `RABBITMQ_PASSWORD`: Password for Basic authentication (optional)
- `REFRESH_INTERVAL`: Update interval in milliseconds (default: `30000`, i.e., 30 seconds)
- `RABBITMQ_API_TIMEOUT`: Timeout for API requests in milliseconds (default: `10000`, i.e., 10 seconds)

## Usage

### Simple start
```bash
npm start
```

### Start with environment variables
```bash
PORT=9090 \
RABBITMQ_API_URL=http://localhost:15672/api/ \
RABBITMQ_USERNAME=guest \
RABBITMQ_PASSWORD=guest \
REFRESH_INTERVAL=30000 \
RABBITMQ_API_TIMEOUT=10000 \
npm start
```

### Using .env file
Create a `.env` file in the project root:

```env
PORT=9090
RABBITMQ_API_URL=http://localhost:15672/api/
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
REFRESH_INTERVAL=30000
RABBITMQ_API_TIMEOUT=10000
```

Then simply start:
```bash
npm start
```

### Development mode (with watch)
```bash
npm run dev
```

## Endpoints

- `GET /`: Exporter information
- `GET /metrics`: Prometheus metrics
- `GET /health`: Health check endpoint

## Prometheus Integration Example

Add this configuration to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'rabbitmq-stream-exporter'
    static_configs:
      - targets: ['localhost:9090']
    scrape_interval: 30s
```

## Authentication

The exporter supports HTTP Basic authentication. If `RABBITMQ_USERNAME` and `RABBITMQ_PASSWORD` are configured, all requests to the RabbitMQ API will include the `Authorization: Basic <credentials>` header.

**Note**: If credentials are not provided, requests are made without authentication. Make sure to configure authentication if your RabbitMQ requires credentials.

## Notes

- The exporter makes periodic calls to the `/api/stream/consumers` endpoint of the RabbitMQ API to update metrics
- In case of API errors, the error is logged to the console
- Metrics are automatically updated at each configured interval
- Metrics are reset at each update cycle to ensure consistency with the current RabbitMQ state
- Only active consumers (`active: true`) expose the specific metrics for active consumers

