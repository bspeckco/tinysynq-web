import { nanoid } from "nanoid";
import { TinySynq } from "./tinysynq.class.js";
import { Change, SyncRequestType, SyncResponseType } from "./types.js";

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

export class TinySynqClient extends EventTarget {

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
    super();
    if (!config?.ts) throw new Error('Invalid client configuration');
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

  async push() {
    if (!this.ts) return;
    const lastSync = await this.ts.getLastSync();
    const changes = await this.ts.getFilteredChanges({since: lastSync});
    if (!changes) return console.log('no changes');
    const payload = {
      type: SyncRequestType.push,
      changes,
      source: this._ts.deviceId,
      requestId: nanoid(16)
    };
    this._ws?.send(JSON.stringify(payload));
  }

  async pull() {
    const payload = {type: SyncRequestType.pull, source: this._ts.deviceId};
    console.debug('@pull', payload);
    this._ws?.send(JSON.stringify(payload));
  }

  private async handleMessage(e: any) {
    console.debug('@message', e);
    const data = JSON.parse(e.data);
    console.debug('@parsed', data)
    if (data.type !== SyncResponseType.nack) {
      if (data.changes) {
        console.warn('@client processing changes')
        const changes = data.changes.map((c: Change) => {
          if (typeof c.vclock === 'string') {
            c.vclock = JSON.parse(c.vclock);
          }
          return c;
        });
        console.debug('@client changes', changes)
        await this.ts.applyChangesToLocalDB({changes});
        const event = new CustomEvent('changes', {
          detail: data.changes
        });
        console.debug('::: Disptaching event...', event);
        this.dispatchEvent(event)
      }
      else if (data.lastChangeId) {
       const result = await this.ts.updateLastPush({time: data.lastChangeTime, id: data.lastChangeId});
       console.log('Stored last push', result);
      }
    }
    else {
      console.error('Sync failed', data);
      this.dispatchEvent(
        new CustomEvent('error', {
          detail: data
        })
      );
    }
  }
}

