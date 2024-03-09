import{Logger as e}from"tslog";import{sqlite3Worker1Promiser as n}from"@sqlite.org/sqlite-wasm";import{nanoid as r}from"nanoid";function t(e){var n=function(e,n){if("object"!=typeof e||!e)return e;var r=e[Symbol.toPrimitive];if(void 0!==r){var t=r.call(e,"string");if("object"!=typeof t)return t;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(e)}(e);return"symbol"==typeof n?n:String(n)}function o(){return o=Object.assign?Object.assign.bind():function(e){for(var n=1;n<arguments.length;n++){var r=arguments[n];for(var t in r)Object.prototype.hasOwnProperty.call(r,t)&&(e[t]=r[t])}return e},o.apply(this,arguments)}function i(e,n){(null==n||n>e.length)&&(n=e.length);for(var r=0,t=new Array(n);r<n;r++)t[r]=e[r];return t}var a,s;!function(e){e.INSERT="INSERT",e.UPDATE="UPDATE",e.DELETE="DELETE"}(a||(a={})),function(e){e[e.Silly=0]="Silly",e[e.Trace=1]="Trace",e[e.Debug=2]="Debug",e[e.Info=3]="Info",e[e.Warn=4]="Warn",e[e.Error=5]="Error",e[e.Fatal=6]="Fatal"}(s||(s={}));var u=/*#__PURE__*/function(){function e(e){var n=e.local,r=e.remote,t=e.localId;this.local=void 0,this.isGreater=!1,this.isLess=!1,this.isWrongOrder=!1,this.remote={},this.localId=void 0,this.local=n,this.remote="string"==typeof r?JSON.parse(r):r,this.localId=t}var n=e.prototype;return n.setRemote=function(e){this.remote=e.remote},n.isConflicted=function(e){var n=this,r=(null==e?void 0:e.remote)||this.remote;return Object.keys(o({},this.local,r)).forEach(function(e){var t=n.local[e]||0,o=r[e]||0;n.isGreater=n.isGreater||t>o,n.isLess=n.isLess||t<o}),this.isGreater&&this.isLess},n.isOutDated=function(){var e=this.remote,n=this.local,r=this.localId;if(!e||!n)throw new Error("Remote vector clock not set");return n[r]>e[r]},n.isOutOfOrder=function(){var e=this.remote,n=this.local,r=this.localId;if(!e||!n)throw new Error("Remote vector clock not set");for(var t=Object.keys(o({},this.local,e)).filter(function(e){return e!==r}),i=0;i<t.length;i++){var a,s,u=t[i],c=Math.abs((null!=(a=n[u])?a:0)-(null!=(s=e[u])?s:0));this.isWrongOrder=c>1}return this.isWrongOrder},n.merge=function(){for(var e,n={},r=function(e,n){var r="undefined"!=typeof Symbol&&e[Symbol.iterator]||e["@@iterator"];if(r)return(r=r.call(e)).next.bind(r);if(Array.isArray(e)||(r=function(e,n){if(e){if("string"==typeof e)return i(e,n);var r=Object.prototype.toString.call(e).slice(8,-1);return"Object"===r&&e.constructor&&(r=e.constructor.name),"Map"===r||"Set"===r?Array.from(e):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?i(e,n):void 0}}(e))){r&&(e=r);var t=0;return function(){return t>=e.length?{done:!0}:{done:!1,value:e[t++]}}}throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}(new Set(Object.keys(this.local).concat(Object.keys(this.remote))));!(e=r()).done;){var t=e.value;n[t]=Math.max(this.local[t]||0,this.remote[t]||0)}return void 0===n[this.localId]&&(n[this.localId]=0),n},e}(),c=["id"];function l(e,n){try{var r=e()}catch(e){return n(e)}return r&&r.then?r.then(void 0,n):r}var f="undefined"!=typeof Symbol?Symbol.iterator||(Symbol.iterator=Symbol("Symbol.iterator")):"@@iterator";function m(e,n,r){if(!e.s){if(r instanceof d){if(!r.s)return void(r.o=m.bind(null,e,n));1&n&&(n=r.s),r=r.v}if(r&&r.then)return void r.then(m.bind(null,e,n),m.bind(null,e,2));e.s=n,e.v=r;var t=e.o;t&&t(e)}}var d=/*#__PURE__*/function(){function e(){}return e.prototype.then=function(n,r){var t=new e,o=this.s;if(o){var i=1&o?n:r;if(i){try{m(t,1,i(this.v))}catch(e){m(t,2,e)}return t}return this}return this.o=function(e){try{var o=e.v;1&e.s?m(t,1,n?n(o):o):r?m(t,1,r(o)):m(t,2,o)}catch(e){m(t,2,e)}},t},e}();function E(e){return e instanceof d&&1&e.s}var v=new e({name:"tinysynq-web-init",minLevel:s.Info});function h(e,n,r){if("function"==typeof e[f]){var t,o,i,a=e[f]();if(function e(s){try{for(;!((t=a.next()).done||r&&r());)if((s=n(t.value))&&s.then){if(!E(s))return void s.then(e,i||(i=m.bind(null,o=new d,2)));s=s.v}o?m(o,1,s):o=s}catch(e){m(o||(o=new d),2,e)}}(),a.return){var s=function(e){try{t.done||a.return()}catch(e){}return e};if(o&&o.then)return o.then(s,function(e){throw s(e)});s()}return o}if(!("length"in e))throw new TypeError("Object is not iterable");for(var u=[],c=0;c<e.length;c++)u.push(e[c]);return function(e,n,r){var t,o,i=-1;return function a(s){try{for(;++i<e.length&&(!r||!r());)if((s=n(i))&&s.then){if(!E(s))return void s.then(a,o||(o=m.bind(null,t=new d,2)));s=s.v}t?m(t,1,s):t=s}catch(e){m(t||(t=new d),2,e)}}(),t}(u,function(e){return n(u[e])},r)}var _="STRFTIME('%Y-%m-%dT%H:%M:%f','NOW')",T=/*#__PURE__*/function(){function i(n){var r,t;if(this._db=void 0,this._dbPath=void 0,this._deviceId=void 0,this._synqPrefix=void 0,this._synqTables=void 0,this._synqBatchSize=20,this._wal=!0,this.log=void 0,this.utils={strtimeAsISO8601:_,nowAsISO8601:_,utcNowAsISO8601:function(){return new Date((new Date).toUTCString()).toISOString()}},!n.filePath&&!n.sqlite3)throw new Error("No DB filePath or connection provided");var i={};n.tables.forEach(function(e){i[e.name]=e}),this._dbPath=n.filePath||"",this._db=n.sqlite3||void 0,this._synqPrefix=null==(r=n.prefix)?void 0:r.trim().replace(/[^a-z0-9]+$/i,""),this._synqTables=i,this._synqBatchSize=n.batchSize||this._synqBatchSize,this._wal=null!=(t=n.wal)&&t,this.log=new e(o({name:"tinysynq-node",minLevel:s.Debug,type:"json",maskValuesOfKeys:["password","encryption_key"],hideLogPositionForProduction:!0},n.logOptions||{}))}var f,T,y=i.prototype;return y.init=function(){try{var e=this,r=e;return e.db?Promise.resolve(e.db):e.dbPath?Promise.resolve(new Promise(function(t,o){try{return Promise.resolve(l(function(){return e.log.debug("get promiser..."),Promise.resolve(new Promise(function(t){var o=n({onready:function(){t(o)},onerror:function(n){e.log.error("@ERROR",n)},debug:function(){var e;(e=r.log).debug.apply(e,[].slice.call(arguments))},onunhandled:function(n){e.log.error("@UNHANDLED",n)}})})).then(function(n){return e.log.debug("get config..."),Promise.resolve(n("config-get",{})).then(function(){function r(){return i?(e._deviceId=i.dbId,e.setDeviceId(),Promise.resolve(n("config-get",{})).then(function(r){function o(){t(e)}e.log.info("Running SQLite3 version",r.result.version.libVersion),e._db=n;var i=function(){if(!0===e._wal)return Promise.resolve(e.runQuery({sql:"PRAGMA journal_mode=WAL;"})).then(function(){})}();return i&&i.then?i.then(o):o()})):o("Unable to start DB")}var i,a=l(function(){return e.log.debug("open "+e.dbPath+"..."),Promise.resolve(n("open",{filename:"file:"+e.dbPath+"?vfs=opfs"})).then(function(n){e.log.info("OPFS is available, created persisted database at",(i=n).result.filename.replace(/^file:(.*?)\?vfs=opfs$/,"$1"))})},function(){return Promise.resolve(n("open",{filename:"file:"+e.dbPath})).then(function(n){e.log.info("OPFS not available, created in-memory database at",(i=n).result.filename,"$1")})});return a&&a.then?a.then(r):r()})})},function(n){n instanceof Error||(n=new Error(n.result.message)),e.log.error(n.name,n.message),e.log.error(n),o("DB setup failed.")}))}catch(e){return Promise.reject(e)}})):Promise.reject("No DB filename or connection provided")}catch(e){return Promise.reject(e)}},y.getNewId=function(){return r(16)},y.getTableIdColumn=function(e){var n;return null==(n=this.synqTables[e.table_name])?void 0:n.id},y.setDeviceId=function(){try{var e,n=function(){function n(){var n;r._deviceId=null==(n=e)?void 0:n.meta_value}v.warn("@device_id",e);var t=function(n){if(null==(n=e)||!n.meta_value)return Promise.resolve(r.runQuery({sql:"INSERT OR REPLACE INTO "+r.synqPrefix+"_meta (meta_name, meta_value) VALUES (?,?) RETURNING *",values:["device_id",r.deviceId]})).then(function(n){v.warn("@created record for device_id:",n),e=n[0]})}();return t&&t.then?t.then(n):n()},r=this,t=l(function(){return Promise.resolve(r.runQuery({sql:"SELECT meta_value FROM "+r.synqPrefix+"_meta WHERE meta_name = 'device_id'"})).then(function(n){e=n[0]})},function(){r.log.warn("Couldn't retrieve device ID")});return Promise.resolve(t&&t.then?t.then(n):n())}catch(e){return Promise.reject(e)}},y.run=function(e){try{return Promise.resolve(this.runQuery(e))}catch(e){return Promise.reject(e)}},y.runMany=function(e){try{var n=this,r=e.sql,t=e.values,o=e.prefix,i=void 0===o?":":o,a=Math.ceil(1e6*Math.random()),s=n.synqDbId;return n.log.debug("@runMany",{quid:a,sql:r,values:t}),Promise.resolve(new Promise(function(e,o){try{var u=function(){e(!0)},c=l(function(){var e=h(t,function(e){var t=n.reformatQueryValues({values:e,prefix:i});return Promise.resolve(n.db("exec",{dbId:s,sql:r,bind:t})).then(function(){})});if(e&&e.then)return e.then(function(){})},function(e){n.log.error({quid:a,err:e,stack:e.stack}),o(e)});return Promise.resolve(c&&c.then?c.then(u):u())}catch(e){return Promise.reject(e)}}))}catch(e){return Promise.reject(e)}},y.runQuery=function(e){try{var n=this,r=e.sql,t=e.prefix,o=n.reformatQueryValues({values:e.values,prefix:void 0===t?":":t}),i=Math.ceil(1e6*Math.random());n.log.debug("@runQuery",i,r,o,"/");var a=n.synqDbId;return Promise.resolve(new Promise(function(e,t){var s=[];try{n.db("exec",{dbId:a,sql:r,bind:o,callback:function(r){if(!r.row)return n.log.debug("@runQuery RESOLVED",i),e(s);var t={};r.row.forEach(function(e,n){return t[r.columnNames[n]]=r.row[n]}),s.push(t)}})}catch(e){n.log.error(i,e,e.stack),t(e)}}))}catch(e){return Promise.reject(e)}},y.reformatQueryValues=function(e){var n=e.values,r=e.prefix,t=void 0===r?":":r;if(Array.isArray(n))return n;if("object"==typeof n){var o=Object.keys(n),i={};return o.forEach(function(e){var r=e.startsWith(t)?e:""+t+e;i[r]=n[e]}),i}return n},y.getDeviceId=function(){try{var e=this;return e._deviceId?Promise.resolve(e._deviceId):Promise.resolve(e.runQuery({sql:"\n        SELECT meta_value FROM "+e.synqPrefix+"_meta\n        WHERE meta_name = 'device_id'"})).then(function(e){return e[0].meta_value})}catch(e){return Promise.reject(e)}},y.getLastSync=function(){try{var e=this;return Promise.resolve(e.runQuery({sql:"\n        SELECT meta_value FROM "+e.synqPrefix+"_meta\n        WHERE meta_name = 'last_local_sync'"})).then(function(n){var r;return e.log.trace("@getLastSync",n[0]),null==(r=n[0])?void 0:r.meta_value})}catch(e){return Promise.reject(e)}},y.getChanges=function(e){try{var n=function(n){var t=(e||{}).columns,o=void 0===t?[]:t;r.log.debug("@getChanges",n);var i="";n&&(i="WHERE c.modified > ?");var a="\n      SELECT "+(o.map(function(e){return e.replace(/[^*._a-z0-9]+/gi,"")}).join(",")||"*")+"\n      FROM "+r._synqPrefix+"_changes c\n      INNER JOIN "+r._synqPrefix+"_record_meta trm\n      ON trm.table_name = c.table_name\n      AND trm.row_id = c.row_id\n      "+i+"\n      ORDER BY c.modified ASC\n    ",s=n?[n]:[];return r.log.debug(a,s),r.runQuery({sql:a,values:s})},r=this,t=null==e?void 0:e.lastLocalSync;return Promise.resolve(t?n(t):Promise.resolve(r.getLastSync()).then(n))}catch(e){return Promise.reject(e)}},y.getChangesSinceLastSync=function(e){try{var n=this;return Promise.resolve(n.getLastSync()).then(function(r){return n.getChanges(o({},e,{lastLocalSync:r}))})}catch(e){return Promise.reject(e)}},y.enableDebug=function(){try{return Promise.resolve(this.run({sql:"\n      INSERT OR REPLACE INTO "+this.synqPrefix+"_meta (meta_name, meta_value)\n      VALUES ('debug_on', '1')\n      RETURNING *;"}))}catch(e){return Promise.reject(e)}},y.disableDebug=function(){try{return Promise.resolve(this.run({sql:"\n      INSERT OR REPLACE INTO "+this.synqPrefix+"_meta (meta_name, meta_value)\n      VALUES ('debug_on', '0')\n      RETURNING *;"}))}catch(e){return Promise.reject(e)}},y.clearDebugData=function(){try{var e=this;return Promise.resolve(e.run({sql:"DELETE FROM "+e._synqPrefix+"_dump"})).then(function(){return Promise.resolve(e.run({sql:"UPDATE SQLITE_SEQUENCE SET seq = 0 WHERE name = "+e._synqPrefix+"_dump"})).then(function(){})})}catch(e){return Promise.reject(e)}},y.enableTriggers=function(){return this.run({sql:"\n      INSERT OR REPLACE INTO "+this.synqPrefix+"_meta (meta_name, meta_value)\n      VALUES ('triggers_on', '1');"})},y.disableTriggers=function(){try{return Promise.resolve(this.run({sql:"\n      INSERT OR REPLACE INTO "+this.synqPrefix+"_meta (meta_name, meta_value)\n      VALUES ('triggers_on', '0');"}))}catch(e){return Promise.reject(e)}},y.beginTransaction=function(){try{var e="SP"+Date.now();return Promise.resolve(this.run({sql:"SAVEPOINT "+e+";"})).then(function(){return e})}catch(e){return Promise.reject(e)}},y.commitTransaction=function(e){var n=e.savepoint;try{return Promise.resolve(this.run({sql:"RELEASE SAVEPOINT "+n+";"}))}catch(e){return Promise.reject(e)}},y.rollbackTransaction=function(e){var n=e.savepoint;try{return Promise.resolve(this.run({sql:"ROLLBACK TRANSACTION TO SAVEPOINT "+n+";"}))}catch(e){return Promise.reject(e)}},y.getRecord=function(e){try{var n=this,r=e.table_name,t=e.row_id,o=n.getTableIdColumn({table_name:r});return Promise.resolve(n.runQuery({sql:"SELECT * FROM "+r+" WHERE "+o+" = ?",values:[t]})).then(function(e){return n.log.debug("@getRecord",e),e[0]})}catch(e){return Promise.reject(e)}},y.getById=function(e){try{return Promise.resolve(this.getRecord({table_name:e.table_name,row_id:e.row_id}))}catch(e){return Promise.reject(e)}},y.insertRecordMeta=function(e){var n=e.change,r=e.vclock;try{var t=this;t.log.warn("<<< @insertRecordMeta >>>",{change:n,vclock:r});var o={table_name:n.table_name,row_id:n.row_id,mod:r[t._deviceId]||0,vclock:JSON.stringify(r)};return Promise.resolve(t.runQuery({sql:"\n      INSERT INTO "+t._synqPrefix+"_record_meta (table_name, row_id, mod, vclock)\n      VALUES (:table_name, :row_id, :mod, :vclock)\n      ON CONFLICT DO UPDATE SET mod = :mod, vclock = :vclock\n      RETURNING *\n      ",values:o}))}catch(e){return Promise.reject(e)}},y.getRecordMeta=function(e){try{return Promise.resolve(this.runQuery({sql:"\n    SELECT *\n    FROM "+this.synqPrefix+"_record_meta\n    WHERE table_name = :table_name\n    AND row_id = :row_id",values:{table_name:e.table_name,row_id:e.row_id}}))}catch(e){return Promise.reject(e)}},y.getPending=function(){try{return Promise.resolve(this.runQuery({sql:"\n    SELECT *\n    FROM "+this._synqPrefix+"_pending\n    ORDER BY id ASC\n    "}))}catch(e){return Promise.reject(e)}},y.processOutOfOrderChange=function(e){var n=e.change;try{var r=this,t=function(e,n){if(null==e)return{};var r,t,o={},i=Object.keys(e);for(t=0;t<i.length;t++)n.indexOf(r=i[t])>=0||(o[r]=e[r]);return o}(n,c),i=r.createInsertFromSystemObject({data:t,table_name:r._synqPrefix+"_pending"});r.log.trace("@processOutOfOrderChange\n",i,n);var a=o({},t);return a.vclock=JSON.stringify(t.vclock),Promise.resolve(r.runQuery({sql:i,values:a})).then(function(e){return r.log.trace("@processOutOfOrderChange\n",{res:e}),e})}catch(e){return Promise.reject(e)}},y.processConflictedChange=function(e){var n=e.record,r=e.change;try{var t=this;return Promise.resolve(t.getRecordMeta(o({},r))).then(function(e){return t.log.trace("<<<@ processConflictedChange LLW @>>>",r.id,r.table_name,r.row_id,{record:n,localMeta:e,change:r}),r.modified>e.modified?(t.log.trace("<!> INTEGRATING REMOTE",r.id,r.table_name,r.row_id),!0):(t.log.warn("<!> KEEPING LOCAL",r.id,r.table_name,r.row_id),!1)})}catch(e){return Promise.reject(e)}},y.preProcessChange=function(e){var n=e.change,r=e.restore;try{var t=this,o="unknown",i=!1,s=o,c=t.deviceId,l=n.table_name,f=n.row_id,m=n.vclock,d=void 0===m?{}:m;return Promise.resolve(t.getRecord({table_name:l,row_id:f})).then(function(e){return Promise.resolve(t.getRecordMeta({table_name:l,row_id:f})).then(function(l){function f(){var a;function u(e){return a?e:{valid:i,reason:s,vclock:E,checks:{stale:T,displaced:h,conflicted:_}}}var c=function(){if(r)return i=!0,s="restoration",E=v.merge(),a=1,{valid:i,reason:s,vclock:E,checks:{stale:T,displaced:h,conflicted:_}};var u=function(){if(h=v.isOutOfOrder())return s="received out of order",Promise.resolve(t.processOutOfOrderChange({change:n})).then(function(){});var r=function(){if(_=v.isConflicted())return Promise.resolve(t.processConflictedChange({record:e,change:n})).then(function(e){(i=e)?E=v.merge():s="concurrent writes"});(T=v.isOutDated())?s="stale":s===o&&(i=!0,s="",E=v.merge())}();return r&&r.then?r.then(function(){}):void 0}();return u&&u.then?u.then(function(){}):void 0}();return c&&c.then?c.then(u):u(c)}var m=null!=l&&l.vclock?JSON.parse(l.vclock):{},E={},v=new u({local:m,remote:d,localId:c}),h=!1,_=!1,T=!1;t.log.warn("{{{ @preProcessChange pre-if }}}",{restore:r,record:e});var y=function(){if(!r&&!e&&n.operation!==a.INSERT)return t.log.warn("{{{ @OutOfOrder }}}"),s="update before insert",Promise.resolve(t.processOutOfOrderChange({change:n})).then(function(){});!r&&e&&m&&m[c]||(E=n.vclock)}();return y&&y.then?y.then(f):f()})})}catch(e){return Promise.reject(e)}},y.createInsertFromObject=function(e){var n=e.data,r=e.table_name,t=Object.keys(n).join(","),o=this._synqTables[r].editable||[],i=Object.keys(n).filter(function(e){return o.includes(e)}).map(function(e){return e+" = :"+e}).join(",");if(!i)throw new Error("No changes available");return"\n      INSERT INTO "+r+" ("+t+")\n      VALUES ("+Object.keys(n).map(function(e){return":"+e}).join(",")+")\n      ON CONFLICT DO UPDATE SET "+i+"\n      RETURNING *;"},y.createInsertFromSystemObject=function(e){var n=e.data,r=e.table_name;this.log.silly("@createInsert...",{data:n});var t=Object.keys(n).join(","),o=Object.keys(n).map(function(e){return e+" = :"+e}).join(",");if(!o)throw new Error("No changes availble");return"\n      INSERT INTO "+r+" ("+t+")\n      VALUES ("+Object.keys(n).map(function(e){return":"+e}).join(",")+")\n      ON CONFLICT DO UPDATE SET "+o+"\n      RETURNING *;"},y.updateLastSync=function(e){var n=e.change;try{var r=this,t="INSERT OR REPLACE INTO "+r.synqPrefix+"_meta (meta_name, meta_value) VALUES(:name, :value)",o=h([{name:"last_local_sync",value:"STRFTIME('%Y-%m-%d %H:%M:%f','NOW')"},{name:"last_sync",value:n.id}],function(e){return Promise.resolve(r.runQuery({sql:t,values:e})).then(function(){})});return Promise.resolve(o&&o.then?o.then(function(){}):void 0)}catch(e){return Promise.reject(e)}},y.applyChange=function(e){var n=e.change,r=e.restore,t=e.savepoint;try{var o=this;return Promise.resolve(l(function(){return Promise.resolve(o.preProcessChange({change:n,restore:r})).then(function(e){function r(){return Promise.resolve(o.updateLastSync({change:n})).then(function(){return Promise.resolve(o.insertRecordMeta({change:n,vclock:e.vclock})).then(function(e){o.log.silly({updatedRecordMeta:e})})})}if(null==e||!e.valid)return o.log.warn(">>> Invalid change status"),o.log.warn(e),void o.updateLastSync({change:n});var t,i=o.synqTables[n.table_name];if(!n.data)throw new Error("Cannot perform update with empty data:\n"+JSON.stringify(n,null,2));try{t=JSON.parse(n.data)}catch(e){throw o.log.debug(n),new Error("Invalid data for insert or update")}if(!i)throw new Error("Unable to find table "+n.table_name);o.log.silly("@applyChange",{change:n,table:i,changeStatus:e});var a=function(e,n){var r,t=-1;e:{for(var o=0;o<n.length;o++){var i=n[o][0];if(i){var a=i();if(a&&a.then)break e;if(a===e){t=o;break}}else t=o}if(-1!==t){do{for(var s=n[t][1];!s;)t++,s=n[t][1];var u=s();if(u&&u.then){r=!0;break e}var c=n[t][2];t++}while(c&&!c());return u}}const l=new d,f=m.bind(null,l,2);return(r?u.then(E):a.then(function r(a){for(;;){if(a===e){t=o;break}if(++o===n.length){if(-1!==t)break;return void m(l,1,u)}if(i=n[o][0]){if((a=i())&&a.then)return void a.then(r).then(void 0,f)}else t=o}do{for(var s=n[t][1];!s;)t++,s=n[t][1];var u=s();if(u&&u.then)return void u.then(E).then(void 0,f);var c=n[t][2];t++}while(c&&!c());m(l,1,u)})).then(void 0,f),l;function E(e){for(;;){var r=n[t][2];if(!r||r())break;t++;for(var o=n[t][1];!o;)t++,o=n[t][1];if((e=o())&&e.then)return void e.then(E).then(void 0,f)}m(l,1,e)}}(n.operation,[[function(){return"INSERT"}],[function(){return"UPDATE"},function(){var e=o.createInsertFromObject({data:t,table_name:n.table_name});return Promise.resolve(o.runQuery({sql:e,values:t})).then(function(){})}],[function(){return"DELETE"},function(){var e="DELETE FROM "+n.table_name+" WHERE "+i.id+" = ?";return o.log.warn(">>> DELETE SQL <<<",e,n.row_id),Promise.resolve(o.run({sql:e,values:[n.row_id]})).then(function(){})}]]);return a&&a.then?a.then(r):r()})},function(e){return Promise.resolve(o.rollbackTransaction({savepoint:t})).then(function(){throw o.log.error("Error applying change: "+e+". Rolled back.",{change:n}),e})}))}catch(e){return Promise.reject(e)}},y.applyChangesToLocalDB=function(e){var n=e.changes,r=e.restore,t=void 0!==r&&r;try{var o=this;return Promise.resolve(o.disableTriggers()).then(function(){function e(){return Promise.resolve(o.enableTriggers()).then(function(){o.log.silly("Applied "+n.length+" change(s)")})}var r=0,i=function(e,n,r){for(var t;;){var o=e();if(E(o)&&(o=o.v),!o)return i;if(o.then){t=0;break}var i=r();if(i&&i.then){if(!E(i)){t=1;break}i=i.s}if(n){var a=n();if(a&&a.then&&!E(a)){t=2;break}}}var s=new d,u=m.bind(null,s,2);return(0===t?o.then(l):1===t?i.then(c):a.then(f)).then(void 0,u),s;function c(t){i=t;do{if(n&&(a=n())&&a.then&&!E(a))return void a.then(f).then(void 0,u);if(!(o=e())||E(o)&&!o.v)return void m(s,1,i);if(o.then)return void o.then(l).then(void 0,u);E(i=r())&&(i=i.v)}while(!i||!i.then);i.then(c).then(void 0,u)}function l(e){e?(i=r())&&i.then?i.then(c).then(void 0,u):c(i):m(s,1,i)}function f(){(o=e())?o.then?o.then(l).then(void 0,u):l(o):m(s,1,i)}}(function(){return r<n.length},function(){return!!(r+=o.synqBatchSize)},function(){var e=n.slice(r,r+o.synqBatchSize);return Promise.resolve(o.beginTransaction()).then(function(n){var r=l(function(){function r(){return Promise.resolve(o.commitTransaction({savepoint:n})).then(function(){})}var i=h(e,function(e){return Promise.resolve(o.applyChange({change:e,restore:t,savepoint:n})).then(function(){})});return i&&i.then?i.then(r):r()},function(e){return Promise.resolve(o.rollbackTransaction({savepoint:n})).then(function(){o.log.error("Transaction failed, changes rolled back: "+e)})});if(r&&r.then)return r.then(function(){})})});return i&&i.then?i.then(e):e()})}catch(e){return Promise.reject(e)}},y.tablesReady=function(){try{return Promise.resolve(this.enableTriggers()).then(function(){})}catch(e){return Promise.reject(e)}},f=i,(T=[{key:"db",get:function(){return this._db}},{key:"dbPath",get:function(){return this._dbPath}},{key:"deviceId",get:function(){return this._deviceId}},{key:"synqDbId",get:function(){return this._deviceId}},{key:"synqPrefix",get:function(){return this._synqPrefix}},{key:"synqTables",get:function(){return this._synqTables}},{key:"synqBatchSize",get:function(){return this._synqBatchSize}},{key:"wal",get:function(){return this._wal}}])&&function(e,n){for(var r=0;r<n.length;r++){var o=n[r];o.enumerable=o.enumerable||!1,o.configurable=!0,"value"in o&&(o.writable=!0),Object.defineProperty(e,t(o.key),o)}}(f.prototype,T),Object.defineProperty(f,"prototype",{writable:!1}),i}(),y="undefined"!=typeof Symbol?Symbol.iterator||(Symbol.iterator=Symbol("Symbol.iterator")):"@@iterator";function P(e,n,r){if(!e.s){if(r instanceof b){if(!r.s)return void(r.o=P.bind(null,e,n));1&n&&(n=r.s),r=r.v}if(r&&r.then)return void r.then(P.bind(null,e,n),P.bind(null,e,2));e.s=n,e.v=r;var t=e.o;t&&t(e)}}var b=/*#__PURE__*/function(){function e(){}return e.prototype.then=function(n,r){var t=new e,o=this.s;if(o){var i=1&o?n:r;if(i){try{P(t,1,i(this.v))}catch(e){P(t,2,e)}return t}return this}return this.o=function(e){try{var o=e.v;1&e.s?P(t,1,n?n(o):o):r?P(t,1,r(o)):P(t,2,o)}catch(e){P(t,2,e)}},t},e}();function g(e){return e instanceof b&&1&e.s}var I=function(n){try{var r=n.tables,t=n.preInit,i=n.postInit,a=n.logOptions,s=n.debug;if(null==r||!r.length)throw new Error("Syncable table data required");var u=new e(o({name:"tinysynq-setup"},a)),c=new T(n);return Promise.resolve(c.init()).then(function(){var e=function(e){var n=e.table,r=e.remove,t=void 0!==r&&r?"OLD":"NEW",o="\n    INSERT INTO "+c.synqPrefix+"_record_meta (table_name, row_id, mod, vclock)\n    SELECT table_name, row_id, mod, vclock\n    FROM (\n      SELECT\n        1 as peg,\n        '"+n.name+"' as table_name,\n        "+t+"."+n.id+" as row_id, \n        IFNULL(json_extract(vclock,'$."+c.deviceId+"'), 0) + 1 as mod, \n        json_set(IFNULL(json_extract(vclock, '$'),'{}'), '$."+c.deviceId+"', IFNULL(json_extract(vclock,'$."+c.deviceId+"'), 0) + 1) as vclock\n      FROM "+c.synqPrefix+"_record_meta\n      WHERE table_name = '"+n.name+"'\n      AND row_id = "+t+"."+n.id+"\n      UNION\n      SELECT 0 as peg, '"+n.name+"' as table_name, "+t+"."+n.id+" as row_id, 1, json_object('"+c.deviceId+"', 1) as vclock\n    )\n    ORDER BY peg DESC\n    LIMIT 1\n    ON CONFLICT DO UPDATE SET\n      mod = json_extract(excluded.vclock,'$."+c.deviceId+"'),\n      vclock = json_extract(excluded.vclock,'$')\n    ;";return u.silly(o),o};return Promise.resolve(c.run({sql:"\n    CREATE TABLE IF NOT EXISTS "+c.synqPrefix+"_changes (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      table_name TEXT NOT NULL,\n      row_id TEXT NOT NULL,\n      data BLOB,\n      operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE'\n      modified TIMESTAMP DATETIME DEFAULT(STRFTIME('%Y-%m-%d %H:%M:%f','NOW'))\n    );"})).then(function(){return Promise.resolve(c.run({sql:"CREATE INDEX IF NOT EXISTS "+c.synqPrefix+"_change_modified_idx ON "+c.synqPrefix+"_changes(modified)"})).then(function(){return Promise.resolve(c.run({sql:"\n    CREATE TABLE IF NOT EXISTS "+c.synqPrefix+"_pending (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      table_name TEXT NOT NULL,\n      row_id TEXT NOT NULL,\n      data BLOB,\n      operation TEXT NOT NULL, -- 'INSERT', 'UPDATE', 'DELETE',\n      vclock BLOB NOT NULL,\n      modified TIMESTAMP DATETIME DEFAULT(STRFTIME('%Y-%m-%d %H:%M:%f','NOW'))\n    );"})).then(function(){return Promise.resolve(c.run({sql:"CREATE INDEX IF NOT EXISTS "+c.synqPrefix+"_pending_table_row_idx ON "+c.synqPrefix+"_pending(table_name, row_id)"})).then(function(){return Promise.resolve(c.run({sql:"\n    CREATE TABLE IF NOT EXISTS "+c.synqPrefix+"_notice (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      table_name TEXT NOT NULL,\n      row_id TEXT NOT NULL,\n      conflict BLOB,\n      message TEXT NOT NULL,\n      created TIMESTAMP DATETIME DEFAULT(STRFTIME('%Y-%m-%dT%H:%M:%f','NOW'))\n    );"})).then(function(){return Promise.resolve(c.run({sql:"\n    CREATE TABLE IF NOT EXISTS "+c.synqPrefix+"_record_meta (\n      id INTEGER PRIMARY KEY AUTOINCREMENT,\n      table_name TEXT NOT NULL,\n      row_id TEXT NOT NULL,\n      mod INTEGER,\n      vclock BLOB,\n      modified TIMESTAMP DATETIME DEFAULT(STRFTIME('%Y-%m-%dT%H:%M:%f','NOW'))\n    );"})).then(function(){return Promise.resolve(c.run({sql:"CREATE UNIQUE INDEX IF NOT EXISTS "+c.synqPrefix+"_record_meta_idx ON "+c.synqPrefix+"_record_meta(table_name, row_id)"})).then(function(){return Promise.resolve(c.run({sql:"\n    CREATE TABLE IF NOT EXISTS "+c.synqPrefix+"_meta (\n      meta_name TEXT NOT NULL PRIMARY KEY,\n      meta_value TEXT NOT NULL\n    );\n  "})).then(function(){return Promise.resolve(c.run({sql:"\n    CREATE TABLE IF NOT EXISTS "+c.synqPrefix+"_dump (\n      created TIMESTAMP DATETIME DEFAULT(STRFTIME('%Y-%m-%d %H:%M:%f','NOW')), \n      table_name TEXT NOT NULL,\n      operation TEXT,\n      data BLOB\n    );\n  "})).then(function(){return Promise.resolve(c.run({sql:"CREATE INDEX IF NOT EXISTS "+c.synqPrefix+"_meta_name_idx ON "+c.synqPrefix+"_meta(meta_name)"})).then(function(){function n(){return Promise.resolve(c.setDeviceId()).then(function(){function n(){function n(e){var n=function(){if(null!=i&&i.length){var e=R(i,function(e){return u.debug("@@@\npostInit\n"+e+"\n@@@"),Promise.resolve(c.run({sql:e})).then(function(){})});if(e&&e.then)return e.then(function(){})}}();return n&&n.then?n.then(function(){return c}):c}u.debug("@"+c.synqPrefix+"_meta",c.runQuery({sql:"SELECT * FROM pragma_table_info('"+c.synqPrefix+"_meta')"})),u.debug("@SIMPLE_SELECT",c.runQuery({sql:"SELECT '@@@ that was easy @@@'"}));var t=R(r,function(n){return Promise.resolve(c.runQuery({sql:"SELECT * FROM pragma_table_info('"+n.name+"')"})).then(function(r){if(u.debug("@exists?",n.name,r),null==r||!r.length)throw new Error(n.name+" doesn't exist");return u.debug("Setting up",n.name,n.id),Promise.resolve(function(n){var r=n.table;try{return u.debug("Setting up triggers for",r.name),Promise.resolve(c.runQuery({sql:"\n      SELECT 'json_object(' || GROUP_CONCAT('''' || name || ''', NEW.' || name, ',') || ')' AS jo\n      FROM pragma_table_info('"+r.name+"');"})).then(function(n){var t=n[0];return u.silly("@jsonObject",JSON.stringify(t,null,2)),Promise.resolve(c.run({sql:"DROP TRIGGER IF EXISTS "+c.synqPrefix+"_after_insert_"+r.name})).then(function(){return Promise.resolve(c.run({sql:"DROP TRIGGER IF EXISTS "+c.synqPrefix+"_after_update_"+r.name})).then(function(){return Promise.resolve(c.run({sql:"DROP TRIGGER IF EXISTS "+c.synqPrefix+"_after_delete_"+r.name})).then(function(){var n="\n      CREATE TRIGGER IF NOT EXISTS "+c.synqPrefix+"_after_insert_"+r.name+"\n      AFTER INSERT ON "+r.name+"\n      FOR EACH ROW\n      WHEN (SELECT meta_value FROM "+c.synqPrefix+"_meta WHERE meta_name = 'triggers_on')='1'\n      BEGIN\n        INSERT INTO "+c.synqPrefix+"_changes (table_name, row_id, operation, data)\n        VALUES ('"+r.name+"', NEW."+r.id+", 'INSERT', "+t.jo+");\n\n        "+e({table:r})+"\n      END;";return Promise.resolve(c.run({sql:n})).then(function(){return Promise.resolve(c.run({sql:"\n      CREATE TRIGGER IF NOT EXISTS "+c.synqPrefix+"_after_update_"+r.name+"\n      AFTER UPDATE ON "+r.name+"\n      FOR EACH ROW\n      WHEN (SELECT meta_value FROM "+c.synqPrefix+"_meta WHERE meta_name = 'triggers_on')='1'\n      BEGIN\n        INSERT INTO "+c.synqPrefix+"_changes (table_name, row_id, operation, data)\n        VALUES ('"+r.name+"', NEW."+r.id+", 'UPDATE', "+t.jo+");\n\n        "+e({table:r})+"\n      END;"})).then(function(){return Promise.resolve(c.run({sql:"\n      CREATE TRIGGER IF NOT EXISTS "+c.synqPrefix+"_after_delete_"+r.name+"\n      AFTER DELETE ON "+r.name+"\n      FOR EACH ROW\n      WHEN (SELECT meta_value FROM "+c.synqPrefix+"_meta WHERE meta_name = 'triggers_on')='1'\n      BEGIN\n        INSERT INTO "+c.synqPrefix+"_changes (table_name, row_id, operation) VALUES ('"+r.name+"', OLD."+r.id+", 'DELETE');\n        \n        "+e({table:r,remove:!0})+"\n      END;"})).then(function(){return Promise.resolve(c.run({sql:"DROP TRIGGER IF EXISTS "+c.synqPrefix+"_dump_after_insert_"+r.name})).then(function(){return Promise.resolve(c.run({sql:"DROP TRIGGER IF EXISTS "+c.synqPrefix+"_dump_after_update_"+r.name})).then(function(){return Promise.resolve(c.run({sql:"DROP TRIGGER IF EXISTS "+c.synqPrefix+"_dump_after_delete_"+r.name})).then(function(){return Promise.resolve(c.run({sql:"DROP TRIGGER IF EXISTS "+c.synqPrefix+"_dump_before_insert_record_meta"})).then(function(){return Promise.resolve(c.run({sql:"DROP TRIGGER IF EXISTS "+c.synqPrefix+"_dump_after_insert_record_meta"})).then(function(){return Promise.resolve(c.run({sql:"DROP TRIGGER IF EXISTS "+c.synqPrefix+"_dump_after_update_record_meta"})).then(function(){return Promise.resolve(c.run({sql:"\n      CREATE TRIGGER IF NOT EXISTS "+c.synqPrefix+"_dump_after_insert_"+r.name+"\n      AFTER INSERT ON "+r.name+"\n      FOR EACH ROW\n      WHEN (SELECT meta_value FROM "+c.synqPrefix+"_meta WHERE meta_name = 'debug_on')='1'\n      BEGIN\n        INSERT INTO "+c.synqPrefix+"_dump (table_name, operation, data)\n        VALUES ('"+r.name+"', 'INSERT', "+t.jo+");\n      END;"})).then(function(){return Promise.resolve(c.run({sql:"\n      CREATE TRIGGER IF NOT EXISTS "+c.synqPrefix+"_dump_after_update_"+r.name+"\n      AFTER UPDATE ON "+r.name+"\n      FOR EACH ROW\n      WHEN (SELECT meta_value FROM "+c.synqPrefix+"_meta WHERE meta_name = 'debug_on')='1'\n      BEGIN\n        INSERT INTO "+c.synqPrefix+"_dump (table_name, operation, data) VALUES ('"+r.name+"', 'UPDATE', "+t.jo+");\n      END;"})).then(function(){var e=t.jo.replace(/NEW/g,"OLD");return Promise.resolve(c.run({sql:"\n      CREATE TRIGGER IF NOT EXISTS "+c.synqPrefix+"_dump_after_delete_"+r.name+"\n      AFTER DELETE ON "+r.name+"\n      FOR EACH ROW\n      WHEN (SELECT meta_value FROM "+c.synqPrefix+"_meta WHERE meta_name = 'debug_on')='1'\n      BEGIN\n        INSERT INTO "+c.synqPrefix+"_dump (table_name, operation, data) VALUES ('"+r.name+"', 'DELETE', "+e+");\n      END;"})).then(function(){return Promise.resolve(c.run({sql:"\n      CREATE TRIGGER IF NOT EXISTS "+c.synqPrefix+"_dump_before_insert_record_meta\n      BEFORE INSERT ON "+c.synqPrefix+"_record_meta\n      FOR EACH ROW\n      WHEN (SELECT meta_value FROM "+c.synqPrefix+"_meta WHERE meta_name = 'debug_on')='1'\n      BEGIN\n        INSERT INTO "+c.synqPrefix+"_dump (table_name, operation, data)\n        VALUES (NEW.table_name, 'BEFORE_INSERT', json_object('table_name', NEW.table_name, 'row_id', NEW.row_id, 'mod', NEW.mod, 'vclock', NEW.vclock));\n      END;"})).then(function(){return Promise.resolve(c.run({sql:"\n      CREATE TRIGGER IF NOT EXISTS "+c.synqPrefix+"_dump_after_insert_record_meta\n      AFTER INSERT ON "+c.synqPrefix+"_record_meta\n      FOR EACH ROW\n      WHEN (SELECT meta_value FROM "+c.synqPrefix+"_meta WHERE meta_name = 'debug_on')='1'\n      BEGIN\n        INSERT INTO "+c.synqPrefix+"_dump (table_name, operation, data)\n        VALUES ('"+r.name+"', 'AFTER_INSERT', json_object('table_name', NEW.table_name, 'row_id', NEW.row_id, 'mod', NEW.mod, 'vclock', NEW.vclock));\n      END;"})).then(function(){return Promise.resolve(c.run({sql:"\n      CREATE TRIGGER IF NOT EXISTS "+c.synqPrefix+"_dump_after_update_record_meta\n      AFTER UPDATE ON "+c.synqPrefix+"_record_meta\n      FOR EACH ROW\n      WHEN (SELECT meta_value FROM "+c.synqPrefix+"_meta WHERE meta_name = 'debug_on')='1'\n      BEGIN\n        INSERT INTO "+c.synqPrefix+"_dump (table_name, operation, data)\n        VALUES ('"+r.name+"', 'AFTER_UPDATE', json_object('table_name', NEW.table_name, 'row_id', NEW.row_id, 'mod', NEW.mod, 'vclock', NEW.vclock));\n      END;"})).then(function(){})})})})})})})})})})})})})})})})})})})}catch(e){return Promise.reject(e)}}({table:n})).then(function(){c.tablesReady()})})},function(){});return t&&t.then?t.then(n):n()}var o=function(){if(null!=t&&t.length){var e=R(t,function(e){return u.debug("\n@@@ preInit\n"+e+"\n@@@"),Promise.resolve(c.run({sql:e})).then(function(){})});if(e&&e.then)return e.then(function(){})}}();return o&&o.then?o.then(n):n()})}var o=function(){if(s)return Promise.resolve(c.enableDebug()).then(function(){})}();return o&&o.then?o.then(n):n()})})})})})})})})})})})}catch(e){return Promise.reject(e)}};function R(e,n,r){if("function"==typeof e[y]){var t,o,i,a=e[y]();if(function e(s){try{for(;!((t=a.next()).done||r&&r());)if((s=n(t.value))&&s.then){if(!g(s))return void s.then(e,i||(i=P.bind(null,o=new b,2)));s=s.v}o?P(o,1,s):o=s}catch(e){P(o||(o=new b),2,e)}}(),a.return){var s=function(e){try{t.done||a.return()}catch(e){}return e};if(o&&o.then)return o.then(s,function(e){throw s(e)});s()}return o}if(!("length"in e))throw new TypeError("Object is not iterable");for(var u=[],c=0;c<e.length;c++)u.push(e[c]);return function(e,n,r){var t,o,i=-1;return function a(s){try{for(;++i<e.length&&(!r||!r());)if((s=n(i))&&s.then){if(!g(s))return void s.then(a,o||(o=P.bind(null,t=new b,2)));s=s.v}t?P(t,1,s):t=s}catch(e){P(t||(t=new b),2,e)}}(),t}(u,function(e){return n(u[e])},r)}export{I as default};
//# sourceMappingURL=tinysynq.module.js.map
