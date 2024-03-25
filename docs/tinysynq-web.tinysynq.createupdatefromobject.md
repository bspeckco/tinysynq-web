<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [tinysynq-web](./tinysynq-web.md) &gt; [TinySynq](./tinysynq-web.tinysynq.md) &gt; [createUpdateFromObject](./tinysynq-web.tinysynq.createupdatefromobject.md)

## TinySynq.createUpdateFromObject() method

Creates an update query based on the syncable table name and data provided.

**Signature:**

```typescript
createUpdateFromObject({ data, table_name: table }: {
        data: Record<string, any>;
        table_name: string;
    }): string;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  { data, table\_name: table } | { data: Record&lt;string, any&gt;; table\_name: string; } |  |

**Returns:**

string

A SQL query string.

## Remarks

This method is specifically for tables that have been registerd as syncable by passing them in as a [SyncableTable](./tinysynq-web.syncabletable.md) at instantiation.
