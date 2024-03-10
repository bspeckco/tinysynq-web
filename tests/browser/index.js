(async () => {
  const mod = await import('http://localhost:8181/tinysynq.module.js');
  window.tinysynq = mod?.default;
  console.log('@@ MODULE @@', !!mod.default);

  const tst = {};
  tst.getRandomColumnUpdate = ({editableTables}) => {
    const tables = Object.keys(editableTables);
    const randKey = tst.getRandom(tables.length);
    const randTable = tables[randKey];
    const cols = Object.keys(editableTables[randTable]);
    const randCol = cols[tst.getRandom(cols.length)];
    let randVal; 
    randVal = tst.getDefaultColumnValue({
      columnData: editableTables[randTable][randCol],
      columnName: randCol
    });
    return { randVal, randCol, randTable };
  }

  tst.getRandom = (size/*: number*/) => {
    return Math.floor(Math.random() * size);
  }

  tst.getRandomDateTime = (opts/*?: {asString?: boolean}*/) => {
    const {asString = true} = opts || {};
    const time = Date.now();
    const modified = time - Math.floor(Math.random() * 1000000);
    const date = new Date(modified);
    if (!asString) return date;
    return date.toISOString().replace('Z', ''); 
  }

  tst.wait = ({ms = 100}) => {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  tst.getRandomValue = (
    {columnType}
    /*: {columnType: string}*/
  ) => {
    switch(columnType) {
      case 'TEXT':
        return window.sq.getNewId();
      case 'INTEGER':
        return tst.getRandom(10000);
      case 'BOOLEAN':
        return tst.getRandom(2);
      case 'DATE':
      case 'TIMESTAMP':
        return tst.getRandomDateTime();
    }
  }

  tst.getDefaultColumnValue = (
    {columnData, columnName, allowEmpty = true}
    /*: {columnData: any, columnName: string, allowEmpty?: boolean}*/
  ) => {
    let val;
    if (Array.isArray(columnData)) {
      const items = columnData;
      val = items[tst.getRandom(items.length)];
    }
    else if (typeof columnData === 'function') {
      val = (columnData/* as ValueGenerator*/)(window.sq.getNewId());
    }
    else if (!columnData && !allowEmpty) {
      throw new Error(`Unable to set default columnd value; column data empty.\nReceived: ${columnData}`);
    }
    else {
      val = columnData ?? '';
    }
    return val;
  }

  /* type ValueGenerator = (id: string) => string; */

  /*
  type EditableTableData = {
    [table: string]: {
      [column: string]: string[] | ValueGenerator
    }
  }
  */

  tst.getRandomColumnUpdate = (
    {editableTables}
    /*: {editableTables: EditableTableData}*/
  ) => {
    const tables = Object.keys(editableTables);
    const randKey = tst.getRandom(tables.length);
    const randTable/*: string*/ = tables[randKey];
    const cols = Object.keys(editableTables[randTable]);
    const randCol = cols[tst.getRandom(cols.length)];
    let randVal; 
    randVal = tst.getDefaultColumnValue({
      columnData: editableTables[randTable][randCol],
      columnName: randCol
    });
    return { randVal, randCol, randTable };
  }

  /*
  type ColumnName = string;
  type TableName = string;
  type GenerateRowDataOptions = {
    sq: TinySynq;
    operation: Operation;
    table_name: string;
    row_id: string;
    values: any;
    columns: any;
    target?: any;
    constraints?: Map<ColumnName, TableName> // specify columns with foreign key constraints
  }
  */

  tst.generateRowData = async (
    {sq, operation, table_name, row_id, values, columns, constraints, target}
    /*: GenerateRowDataOptions*/
  ) =>
  {
    operation = operation || 'INSERT';
  
    let updated = {};
    if (target) {
      updated = await sq.getById({table_name, row_id: target}) || {};
    }
    else {
      updated = (
        await sq.runQuery({sql: `SELECT * FROM ${table_name} ORDER BY RANDOM() LIMIT 1`})
      )[0] || {};
    }
    
    // console.log('<<generateRowData>>', {data, columns, values});
    for (const column of columns) {
      const col = column.name;
      if (col === 'id' || col.endsWith('_id')) {
        // Updates and deletes need an existing record.
        if (constraints?.has(col)) {
          const t = constraints.get(col);
          const record = tst.getRecordOrRandom({sq, table_name: t, row_id: updated[col]});
          updated[col] = record.data[record.id_col];
        }
        else {
          updated[col] = operation === 'INSERT' ? row_id : updated[column.name];
        }
      }
      else if (values && values[col] !== 'undefined') {
        updated[col] = values[col];
      }
    }
    
    return updated;
  }
  
  /*
  type GenerateChangesForTableOptions = {
    sq: TinySynq;
    table: string;
    origin: string;
    operation?: TinySynqOperation;
    operations?: TinySynqOperation[];
    total?: number;
    constraints?: Map<string, string>;
    fixed?: Record<string, any>;
    target?: any; // ID of a specific record
  }
  */

  tst.generateChangesForTable = async (
    {sq, table, origin, operation, constraints, fixed, operations, target, total = 1}
    //: GenerateChangesForTableOptions
  ) => {
    // Get table schema
    const columns = await sq.runQuery({
      sql: `SELECT name, type FROM pragma_table_info('${table}');`
    });
  
    if (!columns.length) throw new Error(`Failed to get column data for ${table}`);
  
    // Get highest existing change ID
    const highestId = (
      await sq.runQuery({
        sql: `SELECT id FROM ${sq.synqPrefix}_changes ORDER BY id DESC LIMIT 1`
      })
    )[0]?.id || 0;
    if (highestId === 0) console.warn('WARNING: highestId === 0');
  
    const changes/*: Change[]*/ = [];
    operations = operations || ['INSERT', 'UPDATE', 'DELETE'];
    let currentId = highestId + 1;
    let created = 0;
    while (created < total) {
      const columnUpdates = {};
      const editableColumns = sq.synqTables[table].editable;
    
      for (const col of columns) {
        if (fixed && fixed[col.name] !== undefined) {
          columnUpdates[col.name] = fixed[col.name];
        }
        else if (editableColumns.includes(col.name)) {
          let val = await tst.getDefaultColumnValue({
            columnData: editableColumns[col.name],
            columnName: col.name
          }) || tst.getRandomValue({columnType: col.type});
          columnUpdates[col.name] = val;
        }
      }
  
      const row_id = target ?? `fake${currentId}`;
      const { randTable, randCol, randVal } = tst.getRandomColumnUpdate(
        { editableTables: { [table]: columnUpdates } }
      );
      columnUpdates[randCol] = randVal;
      const randOp = operation || operations[getRandom(operations.length)];
      const rowData = await tst.generateRowData({
        sq: sq,
        table_name: randTable,
        row_id,
        values: columnUpdates,
        operation: randOp, //as TinySynqOperation
        columns,
        constraints,
        target,
      });
      const idCol = sq.synqTables[randTable].id;
      if (!idCol) throw new Error('Invalid ID column: ' + idCol);
  
      sq.log.warn({idCol})
      const recordMeta = (
        await sq.getRecordMeta({
          table_name: randTable,
          row_id: rowData[idCol]
        })
      )[0] || {vclock: '{}'};
      sq.log.warn('@@@ GENERATE... @@@', {recordMeta})
      const vclock = JSON.parse(recordMeta.vclock); // @TODO: Should be parsed or remain a string?
      //console.log('BEFORE', vclock)
      vclock[origin] = (vclock[origin] || 0 ) + 1;
      //console.log('AFTER', {vclock})
      
      const change/*:Change*/ = {
        id: currentId,
        table_name: randTable,
        row_id: rowData[idCol],
        operation: randOp, //as TinySynqOperation,
        data: JSON.stringify(rowData),
        vclock,
        modified: sq.utils.utcNowAsISO8601()
      };
      changes.push(change);
      currentId++;
      created++;
    }
   
    return changes;
  }

  window.tst = tst;
})();
