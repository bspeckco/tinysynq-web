/// <reference types="bun-types" />
/// <reference types="node" />
import { ILogObj } from "tslog";
import { TinySynq } from "./tinysynq.class.js";
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
export declare class TinySynqClient extends EventTarget {
    private _config;
    private _serverUrl;
    private _ts;
    private _ws;
    private log;
    get serverUrl(): string;
    get ts(): TinySynq;
    get ws(): WebSocket | undefined;
    constructor(config: TinySynqClientConfig);
    isOpenOrConnecting(): boolean | undefined;
    connect(): Promise<WebSocket>;
    push(): Promise<(ILogObj & import("tslog").ILogObjMeta) | undefined>;
    pull(): Promise<void>;
    private handleMessage;
}
export {};
