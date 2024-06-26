<!-- Do not edit this file. It is automatically generated by API Documenter. -->

[Home](./index.md) &gt; [tinysynq-web](./tinysynq-web.md) &gt; [TinySynq](./tinysynq-web.tinysynq.md) &gt; [getRecordMeta](./tinysynq-web.tinysynq.getrecordmeta.md)

## TinySynq.getRecordMeta() method

Get associated meta data (including `vclock`<!-- -->) for record.

**Signature:**

```typescript
getRecordMeta(params: {
        table_name: string;
        row_id: string;
    }): Promise<any>;
```

## Parameters

|  Parameter | Type | Description |
|  --- | --- | --- |
|  params | { table\_name: string; row\_id: string; } | Object containing table/row parameters. |

**Returns:**

Promise&lt;any&gt;

Object containing row data from `*_record_meta`<!-- -->.

