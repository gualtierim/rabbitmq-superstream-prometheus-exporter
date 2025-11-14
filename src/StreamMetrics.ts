import { Registry, Counter, Gauge } from 'prom-client';
import { StreamConsumer } from './types';

interface MetricDefinition {
  metric: Gauge | Counter;
  reset?: () => void;
  set: (consumer: StreamConsumer) => void;
}

export class StreamMetrics {
  private metricsByStream: { [id: string]: MetricDefinition };
  private getMetricsLabel: (consumer: StreamConsumer) => { stream: string; consumer_name: string };

  constructor(register: Registry) {
    this.getMetricsLabel = (consumer: StreamConsumer) => ({
      superstream: consumer.properties?.['super-stream'] || '',
      stream: consumer.queue?.name || '',
      consumer_name: consumer.properties?.name || '',
    });

    this.metricsByStream = {
      streamConsumerActiveOffset: {
        metric: new Gauge({
          name: 'rabbitmq_stream_consumer_active_offset',
          help: 'Current offset of the active consumer',
          labelNames: ['superstream', 'stream', 'consumer_name'],
          registers: [register]
        }),
        set: (consumer: StreamConsumer) => {
          const metric = this.metricsByStream['streamConsumerActiveOffset']?.metric;
          if (metric && consumer.active && metric instanceof Gauge && consumer.offset !== undefined && consumer.offset !== null) {
            metric.set(this.getMetricsLabel(consumer), consumer.offset);
          }
        }
      },
      streamConsumerActiveOffsetLag: {
        metric: new Gauge({
          name: 'rabbitmq_stream_consumer_active_offset_lag',
          help: 'Consumer lag (difference between stream end and consumer offset lag)',
          labelNames: ['superstream', 'stream', 'consumer_name'],
          registers: [register]
        }),
        set: (consumer: StreamConsumer) => {
          const metric = this.metricsByStream['streamConsumerActiveOffsetLag']?.metric;
          if (metric && consumer.active && metric instanceof Gauge && consumer.offset_lag !== undefined) {
            metric.set(this.getMetricsLabel(consumer), consumer.offset_lag);
          }
        }
      },
      streamConsumerActiveMessagesConsumed: {
        metric: new Gauge({
          name: 'rabbitmq_stream_consumer_active_messages_consumed_total',
          help: 'Total number of messages consumed by the active consumer',
          labelNames: ['superstream', 'stream', 'consumer_name'],
          registers: [register]
        }),
        set: (consumer: StreamConsumer) => {
          const metric = this.metricsByStream['streamConsumerActiveMessagesConsumed']?.metric;
          if (metric && consumer.active && metric instanceof Gauge && consumer.consumed !== undefined) {
            metric.set(this.getMetricsLabel(consumer), consumer.consumed);
          }
        }
      },
      streamConsumerActiveStatus: {
        metric: new Counter({
          name: 'rabbitmq_stream_consumer_active_status',
          help: 'Whether the consumer is active (1) or inactive (0)',
          labelNames: ['superstream', 'stream', 'consumer_name'],
          registers: [register]
        }),
        reset: () => {
          const metric = this.metricsByStream['streamConsumerActiveStatus']?.metric;
          if (metric && metric instanceof Counter) {
            metric.reset();
          }
        },
        set: (consumer: StreamConsumer) => {
          const metric = this.metricsByStream['streamConsumerActiveStatus']?.metric;
          if (metric && metric instanceof Counter) {
            metric.inc(this.getMetricsLabel(consumer), consumer.active ? 1 : 0);
          }
        }
      },
      streamConsumersTotal: {
        metric: new Counter({
          name: 'rabbitmq_stream_consumers_total',
          help: 'Total number of consumers per stream',
          labelNames: ['superstream', 'stream', 'consumer_name'],
          registers: [register]
        }),
        reset: () => {
          const metric = this.metricsByStream['streamConsumersTotal']?.metric;
          if (metric && metric instanceof Counter) {
            metric.reset();
          }
        },
        set: (consumer: StreamConsumer) => {
          const metric = this.metricsByStream['streamConsumersTotal']?.metric;
          if (metric && metric instanceof Counter) {
            metric.inc(this.getMetricsLabel(consumer), 1);
          }
        }
      }
    };
  }

  /**
   * Resets all metrics that support reset
   */
  resetAll(): void {
    Object.values(this.metricsByStream).forEach((metric) => {
      metric.reset?.();
    });
  }

  /**
   * Updates all metrics for a given consumer
   */
  updateForConsumer(consumer: StreamConsumer): void {
    Object.values(this.metricsByStream).forEach((metric) => {
      metric.set(consumer);
    });
  }
}

