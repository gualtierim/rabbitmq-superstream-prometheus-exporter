export interface ConnectionDetails {
  name?: string;
  node?: string;
  peer_host?: string;
  peer_port?: number;
  user?: string;
}

export interface ConsumerProperties {
  name?: string;
  'single-active-consumer'?: string;
  'super-stream'?: string;
}

export interface Queue {
  name?: string;
  vhost?: string;
}

export interface StreamConsumer {
  active?: boolean;
  activity_status?: string;
  connection_details?: ConnectionDetails;
  consumed: number;
  credits: number;
  offset: number;
  offset_lag: number;
  properties?: ConsumerProperties;
  queue?: Queue;
  subscription_id?: number;
  // Legacy fields for compatibility
  stream?: string;
  name?: string;
  consumer_tag?: string;
  messages_consumed?: number;
  stream_end_offset?: number;
  lag?: number;
}

export interface RabbitMQConnectionConfig {
  hostname?: string;
  port?: number;
  username?: string;
  password?: string;
  vhost?: string;
}

