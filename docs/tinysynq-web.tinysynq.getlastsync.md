<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [tinysynq-web](./tinysynq-web.md) &gt; [TinySynq](./tinysynq-web.tinysynq.md) &gt; [getLastSync](./tinysynq-web.tinysynq.getlastsync.md)

## TinySynq.getLastSync() method

Returns an ISO8601 formatted date and time of the last successful local sync.

**Signature:**

```typescript
getLastSync(): Promise<string>;
```
**Returns:**

Promise&lt;string&gt;

The time of the last sync.

## Remarks

A "local sync" is the process of sending local changes to the remote hub.

