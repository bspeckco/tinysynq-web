import { TinySynq } from "./tinysynq.class.js";
import { SyncRequestType, SyncResponseType } from "./types.js";

interface TinySynqClientConfig {
  /**
   * Initialised TinySynq instance.
   */
  ts: TinySynq;
  /**
   * The domain or IP address (no protocol or port).
   * 
   * @default localhost
   */
  hostname?: string;
  /**
   * The port number on which to connect.
   *
   * @default 7174
   */
  port?: number;
  /**
   * Whether or not it should a secure connection (wss://)
   * 
   * @default false
   */
  secure?: boolean;
}

let socket: WebSocket;

const defaultConfig = {
  hostname: 'localhost',
  port: 7174,
  secure: false,
};

export class TinySynqClient {

  private _config: TinySynqClientConfig;
  private _serverUrl: string;
  private _ts: TinySynq;
  private _ws: WebSocket | undefined;

  get serverUrl() {
    return this._serverUrl;
  }

  get ts() {
    return this._ts;
  }

  get ws() {
    return this._ws;
  }

  constructor(config: TinySynqClientConfig) {
    this._config = config;
    this._ts = config.ts;
    const finalConfig = {...defaultConfig, ...this._config};
    const { secure, hostname, port = '' } = finalConfig;
    const ws = 'ws' + (secure ? 's' : '');
    this._serverUrl = `${ws}://${hostname}${port ? ':' : ''}${port}`;
  }

  isOpenOrConnecting() {
    return this.ws && [Number(this.ws.OPEN), Number(this.ws.CONNECTING)].includes(this.ws.readyState)
  }
  
  async connect(): Promise<WebSocket> {
    return new Promise((resolve, reject) => {
      if (this.isOpenOrConnecting()) {
        return resolve(this.ws as WebSocket);
      }
      this._ws = new WebSocket(this.serverUrl);
      this._ws.addEventListener('open', (e) => {
        console.log("TinySynq socket ready.", e);
        resolve(this.ws as WebSocket);
      });
      this._ws.addEventListener('error', (e) => {
        console.log("TinySynq socket error:", e);
        if (this.isOpenOrConnecting()) reject(e);
      });
      this._ws.addEventListener('close', (e) => {
        console.log('Closing TinySynq socket...', e);
      });
      this._ws.addEventListener('message', this.handleMessage.bind(this));
    });
  }

  async sync() {
    //if (!this.ws)
    const changes = await this.ts.getChanges();
    const payload = {type: SyncRequestType.push, changes, source: this.ts.deviceId};
    console.log('@sync', payload);
    this._ws?.send(JSON.stringify(payload));
  }

  private async handleMessage(e: any) {
    console.log('@message', e);
    const data = JSON.parse(e.data);
    if (data.type === SyncResponseType.ack) {
      console.log('Sync successful', data);
    }
    else {
      console.log('Sync failed', data);
    }
  }
}

