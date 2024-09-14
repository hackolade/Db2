"use strict";var Ot=Object.defineProperty;var s=(e,n)=>Ot(e,"name",{value:n,configurable:!0});var l=(e,n)=>()=>(n||e((n={exports:{}}).exports,n),n.exports);var F=l((Hr,ce)=>{"use strict";ce.exports={createSchema:"CREATE SCHEMA ${schemaName}${authorization}${dataCapture};",createTable:"CREATE${tableType} TABLE${ifNotExists} ${name}${tableProps}${tableOptions};",createAuxiliaryTable:"CREATE${tableType} TABLE ${name}${tableOptions};",comment:"\nCOMMENT ON ${objectType} ${objectName} IS ${comment};\n",createTableProps:"${columns}${keyConstraints}${checkConstraints}${foreignKeyConstraints}",columnDefinition:"${name}${type}${default}${constraints}",createForeignKey:"ALTER TABLE ${foreignTable} ADD CONSTRAINT ${name} FOREIGN KEY (${foreignKey}) REFERENCES ${primaryTable} (${primaryKey})${onDelete};",createForeignKeyConstraint:"${name} FOREIGN KEY (${foreignKey}) REFERENCES ${primaryTable} (${primaryKey})${onDelete}",checkConstraint:"${name}CHECK (${expression})",createKeyConstraint:"${constraintName}${keyType}${columns}${options}",createView:"CREATE${orReplace} VIEW ${name} ${viewProperties}\n	AS ${selectStatement};",viewSelectStatement:"SELECT ${keys}\n	FROM ${tableName}",createIndex:"CREATE${indexType} INDEX${indexName} ON ${indexTableName}${indexOptions};\n"}});var le=l((Mr,me)=>{"use strict";me.exports={number:"NUMBER",string:"VARCHAR",date:"DATE",timestamp:"TIMESTAMP",binary:"BINARY",boolean:"BOOLEAN",document:"JSONB",array:"ARRAY",objectId:"VARCHAR(24)",default:"CHAR"}});var pe=l((Vr,ue)=>{"use strict";ue.exports={SMALLINT:{capacity:2},INT:{capacity:4},INTEGER:{capacity:4},BIGINT:{capacity:8},DECIMAL:{mode:"decimal"},DEC:{mode:"decimal"},NUMERIC:{mode:"decimal"},FLOAT:{capacity:4,mode:"float"},"DOUBLE PRECISION":{capacity:8,mode:"float"},REAL:{capacity:8,mode:"float"},NUMBER:{mode:"number"},CHAR:{mode:"char"},CHARACTER:{mode:"char"},VARCHAR:{mode:"varchar"},"CHAR VARYING":{mode:"varchar"},"CHARACTER VARYING":{mode:"varchar"},"LONG VARCHAR":{mode:"long varchar"},GRAPHIC:{mode:"graphic"},VARGRAPHIC:{mode:"vargraphic"},CLOB:{mode:"clob"},"CHARACTER LARGE OBJECT":{mode:"clob"},BINARY:{mode:"binary"},VARVIBINARY:{mode:"varbinary"},BLOB:{mode:"blob"},DATE:{format:"YYYY-MM-DD"},TIME:{format:"hh:mm:ss"},TIMESTAMP:{format:"YYYY-MM-DD hh:mm:ss"},JSON:{},XML:{}}});var g=l((_r,ge)=>{"use strict";var{toLower:ye}=require("lodash"),Pt=s(({text:e,tab:n="	"})=>e.split(`
`).map(a=>n+a).join(`
`),"setTab"),qt=s(({descriptors:e,type:n})=>Object.keys(e).map(ye).includes(ye(n)),"hasType"),w=s(({key:e})=>e?.isActivated??!0,"checkIsKeyActivated"),Dt=s(({keys:e})=>e.length?e.every(n=>!w({key:n})):!1,"checkAllKeysDeactivated"),de=s(({items:e,mapFunction:n})=>{let a=e.filter(r=>w({key:r})).map(n),t=e.filter(r=>!w({key:r})).map(n);return{activatedItems:a,deactivatedItems:t}},"divideIntoActivatedAndDeactivated"),Te=s((e,{isActivated:n,isPartOfLine:a,inlineComment:t="--"})=>n!==!1?e:a?"/* "+e+" */":e.includes(`
`)?`/*
`+e+` */
`:t+" "+e,"commentIfDeactivated"),Y=s(({name:e})=>`"${e}"`,"wrapInQuotes"),Lt=s(({name:e})=>`'${e}'`,"wrapInSingleQuotes"),Bt=s(({name:e,schemaName:n})=>n?`${Y({name:n})}.${Y({name:e})}`:Y({name:e}),"getNamePrefixedWithSchemaName"),kt=s(({name:e})=>Y({name:e}),"columnMapToString"),Yt=s((e,n,a,t=kt)=>{let r=de({items:e,mapFunction:t}),i=r?.deactivatedItems?.length?Te(r.deactivatedItems.join(", "),{isActivated:!1,isPartOfLine:!0}):"";return!n&&a?" ("+r.activatedItems.join(", ")+i+")":" ("+e.map(t).join(", ")+")"},"getColumnsList"),Ut=s(({value:e})=>Array.isArray(e)?e:[e],"toArray");ge.exports={setTab:Pt,hasType:qt,checkAllKeysDeactivated:Dt,checkIsKeyActivated:w,divideIntoActivatedAndDeactivated:de,commentIfDeactivated:Te,wrapInQuotes:Y,wrapInSingleQuotes:Lt,getNamePrefixedWithSchemaName:Bt,getColumnsList:Yt,toArray:Ut}});var W=l((Fr,Ne)=>{"use strict";var Ae=s((e="")=>new RegExp("\\$\\{(.*?)\\}",e),"template"),Ht=s(e=>e.match(Ae("gi"))||[],"getAllTemplates"),Mt=s(e=>(e.match(Ae("i"))||[])[1],"parseTemplate"),Vt=s(({template:e,templateData:n})=>Ht(e).reduce((a,t)=>{let r=Mt(t);return a.replace(t,()=>n[r]||n[r]===0?n[r]:"")},e),"assignTemplates");Ne.exports={assignTemplates:Vt}});var ve=l((Wr,Ke)=>{"use strict";var{omitBy:_t,isNil:Gt,isEmpty:Ce,trim:U}=require("lodash"),{wrapInQuotes:Ie,commentIfDeactivated:Ft,checkIsKeyActivated:be}=g(),Q={primaryKey:"PRIMARY KEY",unique:"UNIQUE"},fe=s((e,n)=>Object.entries(e.properties).map(n),"mapProperties"),Ee=s(({column:e})=>!e.compositeUniqueKey&&e.unique,"isUniqueKey"),Se=s(({column:e})=>Ee({column:e})&&!U(e.uniqueKeyOptions?.constraintName),"isInlineUnique"),he=s(({column:e})=>!e.compositeUniqueKey&&!e.compositePrimaryKey&&e.primaryKey,"isPrimaryKey"),xe=s(({column:e})=>he({column:e})&&!U(e.primaryKeyOptions?.constraintName),"isInlinePrimaryKey"),Z=s(({columnName:e,isActivated:n,options:a,keyType:t})=>({keyType:t,columns:[{name:e,isActivated:n}],..._t(a,Gt)}),"hydrateKeyOptions"),wt=s(({keyId:e,properties:n})=>Object.keys(n).find(a=>n[a].GUID===e),"findName"),Wt=s(({keyId:e,properties:n})=>Object.values(n).find(t=>t.GUID===e)?.isActivated??!0,"checkIfActivated"),$e=s(({jsonSchema:e,keys:n=[]})=>n.map(a=>{let t=wt({keyId:a.keyId,properties:e.properties}),r=Wt({keyId:a.keyId,properties:e.properties});return{name:t,isActivated:r}}),"getKeys"),Qt=s(({jsonSchema:e})=>Array.isArray(e.primaryKey)?e.primaryKey.filter(n=>!Ce(n.compositePrimaryKey)).map(n=>({...Z({options:n,keyType:Q.primaryKey}),columns:$e({keys:n.compositePrimaryKey,jsonSchema:e})})):[],"getCompositePrimaryKeys"),Zt=s(({jsonSchema:e})=>Array.isArray(e.uniqueKey)?e.uniqueKey.filter(n=>!Ce(n.compositeUniqueKey)).map(n=>({...Z({options:n,keyType:Q.unique}),columns:$e({keys:n.compositeUniqueKey,jsonSchema:e})})):[],"getCompositeUniqueKeys"),Xt=s(({jsonSchema:e})=>{if(!e.properties)return[];let n=fe(e,([t,r])=>{if(!(!Ee({column:r})||Se({column:r})))return Z({columnName:t,isActivated:r.isActivated,options:r.uniqueKeyOptions,keyType:Q.unique})}).filter(Boolean);return[...fe(e,([t,r])=>{if(!(!he({column:r})||xe({column:r})))return Z({columnName:t,isActivated:r.isActivated,options:r.primaryKeyOptions,keyType:Q.primaryKey})}).filter(Boolean),...Qt({jsonSchema:e}),...n,...Zt({jsonSchema:e})]},"getTableKeyConstraints"),Jt=s(({keys:e})=>{if(Array.isArray(e)){let n=e.filter(r=>be({key:r})).map(r=>Ie({name:U(r.name)})),a=e.filter(r=>!be({key:r})).map(r=>Ie({name:U(r.name)})),t=a.length?Ft(a,{isActivated:!1,isPartOfLine:!0}):"";return n.join(", ")+t}return e},"foreignKeysToString"),zt=s(({keys:e})=>e.map(n=>U(n.name)).join(", "),"foreignActiveKeysToString"),jt=s(({customProperties:e={}})=>{let{relationshipOnDelete:n,relationshipOnUpdate:a}=e,t=n?" ON DELETE "+n:"",r=a?" ON UPDATE "+a:"";return t+r},"customPropertiesForForeignKey");Ke.exports={getTableKeyConstraints:Xt,isInlineUnique:Se,isInlinePrimaryKey:xe,foreignKeysToString:Jt,foreignActiveKeysToString:zt,customPropertiesForForeignKey:jt}});var z=l((Zr,Re)=>{"use strict";var c={char:"CHAR",varchar:"VARCHAR",nchar:"NCHAR",nvarchar:"NVARCHAR",clob:"CLOB",graphic:"GRAPHIC",vargraphic:"VARGRAPHIC",dbclob:"DBCLOB",integer:"INTEGER",smallint:"SMALLINT",bigint:"BIGINT",decimal:"DECIMAL",float:"FLOAT",real:"REAL",double:"DOUBLE",decfloat:"DECFLOAT",date:"DATE",time:"TIME",timestamp:"TIMESTAMP",binary:"BINARY",varbinary:"VARBINARY",blob:"BLOB",boolean:"BOOLEAN",json:"JSON",array:"ARRAY",multiset:"MULTISET",xml:"XML",rowid:"ROWID"},en=[c.char,c.varchar,c.clob,c.dbclob,c.blob],tn=[c.char,c.varchar,c.nchar,c.nvarchar,c.clob,c.graphic,c.vargraphic,c.dbclob,c.binary,c.varbinary,c.blob,c.array],nn=[c.decimal,c.float,c.decfloat],rn=[c.integer,c.smallint,c.bigint,c.decimal],an=[c.char,c.varchar,c.nchar,c.nvarchar,c.clob,c.graphic,c.vargraphic,c.dbclob,c.blob];Re.exports={DATA_TYPE:c,DATA_TYPES_WITH_BYTE:en,DATA_TYPES_WITH_LENGTH:tn,DATA_TYPES_WITH_PRECISION:nn,DATA_TYPES_WITH_IDENTITY:rn,STRING_DATA_TYPES:an}});var De=l((Xr,qe)=>{"use strict";var{isNumber:O,toUpper:sn}=require("lodash"),{DATA_TYPES_WITH_BYTE:on,DATA_TYPES_WITH_LENGTH:cn,DATA_TYPES_WITH_PRECISION:mn,DATA_TYPE:j}=z(),ln=s(({type:e,length:n,lengthSemantics:a})=>` ${e}(${n} ${sn(a)})`,"addByteLength"),un=s(({type:e,length:n})=>` ${e}(${n})`,"addLength"),pn=s(({type:e,precision:n,scale:a})=>O(a)?` ${e}(${n||"*"},${a})`:O(n)?` ${e}(${n})`:` ${e}`,"addScalePrecision"),yn=s(({type:e,precision:n})=>O(n)?` ${e}(${n})`:` ${e}`,"addPrecision"),dn=s(({fractSecPrecision:e,withTimeZone:n,localTimeZone:a})=>` TIMESTAMP${O(e)?`(${e})`:""}${n?` WITH${a?" LOCAL":""} TIME ZONE`:""}`,"getTimestampType"),Tn=s(({itemsType:e})=>" MULTISET"+(e?`(${e})`:""),"getMultisetType"),gn=s(({type:e})=>on.includes(e),"canHaveByte"),Oe=s(({type:e})=>cn.includes(e),"canHaveLength"),Pe=s(({type:e})=>mn.includes(e),"canHavePrecision"),An=s(({type:e})=>e===j.decimal,"canHaveScale"),Nn=s(({type:e})=>e===j.timestamp,"isTimestamp"),In=s(({type:e})=>e===j.multiset,"isMultiset"),bn=s(({type:e,length:n,lengthSemantics:a,precision:t,scale:r,fractSecPrecision:i,withTimeZone:o,localTimeZone:m,itemsType:u,isUDTRef:p,schemaName:y})=>{let d=O(n);switch(!0){case(d&&a&&gn({type:e})&&Oe({type:e})):return ln({type:e,length:n,lengthSemantics:a});case(d&&Oe({type:e})):return un({type:e,length:n});case(Pe({type:e})&&An({type:e})):return pn({type:e,precision:t,scale:r});case(Pe({type:e})&&O(t)):return yn({type:e,precision:t});case Nn({type:e}):return dn({fractSecPrecision:i,withTimeZone:o,localTimeZone:m});case In({type:e}):return Tn({itemsType:u});case!!(p&&y):return` "${y}"."${e}"`;default:return` ${e}`}},"getColumnType");qe.exports={getColumnType:bn}});var ke=l((zr,Be)=>{"use strict";var{toUpper:Le}=require("lodash"),{wrapInSingleQuotes:fn}=g(),{DATA_TYPES_WITH_IDENTITY:Cn,STRING_DATA_TYPES:En}=z(),Sn=s(({type:e})=>Cn.includes(Le(e)),"canHaveIdentity"),hn=s(({identity:e,type:n})=>Sn({type:n})&&!!e?.generated,"isGeneratedAsIdentity"),xn=s(({start:e,increment:n,minValue:a,maxValue:t,cycle:r})=>{let i=e?`START WITH ${e}`:"",o=n?`INCREMENT BY ${n}`:"",m=a?`MINVALUE ${a}`:"",u=t?`MAXVALUE ${t}`:"";return[i,o,r,m,u].filter(Boolean).join(", ")},"getIdentityOptions"),$n=s(({defaultValue:e,type:n})=>En.includes(Le(n))?fn({name:e}):e,"wrapInQuotesDefaultValue"),Kn=s(({default:e,identity:n,type:a})=>{if(hn({identity:n,type:a})){let r=xn(n);return` GENERATED ${n.generated} AS IDENTITY (${r})`}return e||e===0?` WITH DEFAULT ${$n({defaultValue:e,type:a})}`:""},"getColumnDefault");Be.exports={getColumnDefault:Kn}});var ee=l((ea,Ye)=>{"use strict";var{wrapInQuotes:vn}=g(),Rn=s(({constraintName:e,deferClause:n,rely:a,validate:t,indexClause:r,exceptionClause:i})=>{let o=e?` CONSTRAINT ${vn({name:e.trim()})}`:"",m=[n,a,r,t,i].filter(Boolean).map(u=>` ${u}`).join("");return{constraintString:o,statement:m}},"getOptionsString");Ye.exports={getOptionsString:Rn}});var He=l((na,Ue)=>{"use strict";var{getOptionsString:On}=ee(),Pn=s(({primaryKey:e,unique:n,primaryKeyOptions:a,uniqueKeyOptions:t})=>e?a||{}:n?t||{}:{},"getOptions"),qn=s(({nullable:e,unique:n,primaryKey:a,primaryKeyOptions:t,uniqueKeyOptions:r})=>{let{constraintString:i,statement:o}=On(Pn({primaryKey:a,unique:n,primaryKeyOptions:t,uniqueKeyOptions:r}));return`${e?"":" NOT NULL"}${i}${a?" PRIMARY KEY":""}${n?" UNIQUE":""}${o}`},"getColumnConstraints");Ue.exports={getColumnConstraints:qn}});var _e=l((aa,Ve)=>{"use strict";var{trim:Dn}=require("lodash"),Ln=F(),{assignTemplates:Bn}=W(),{wrapInQuotes:kn,commentIfDeactivated:Yn,wrapInSingleQuotes:Un}=g(),te={column:"COLUMN",table:"TABLE",index:"INDEX"},ne=s(({objectName:e,objectType:n,description:a})=>a?Bn({template:Ln.comment,templateData:{objectType:n,objectName:Dn(e),comment:Un({name:a})}}):"","getCommentStatement"),Me=s(({tableName:e,columnName:n,description:a})=>{let t=e+"."+kn({name:n});return ne({objectName:t,objectType:te.column,description:a})},"getColumnCommentStatement"),Hn=s(({tableName:e,description:n})=>ne({objectName:e,objectType:te.table,description:n}),"getTableCommentStatement"),Mn=s(({indexName:e,description:n})=>ne({objectName:e,objectType:te.index,description:n}),"getIndexCommentStatement"),Vn=s(({tableName:e,columnDefinitions:n=[]})=>n.filter(a=>a.comment).map(a=>{let t=Me({tableName:e,columnName:a.name,description:a.comment});return Yn(t,a)}).join(`
`),"getColumnComments");Ve.exports={getColumnCommentStatement:Me,getTableCommentStatement:Hn,getColumnComments:Vn,getIndexCommentStatement:Mn}});var Ze=l((ia,Qe)=>{"use strict";var Ge=F(),{assignTemplates:Fe}=W(),{getColumnsList:_n,checkAllKeysDeactivated:Gn,commentIfDeactivated:Fn,wrapInQuotes:wn,divideIntoActivatedAndDeactivated:we}=g(),{getOptionsString:Wn}=ee(),We=s(e=>e.statement,"getKeyStatement"),Qn=s(({statements:e})=>!Array.isArray(e)||!e.length?"":e.join(`,
	`),"joinStatements"),re=s(({dividedConstraints:e,isParentActivated:n})=>{let{activatedItems:a,deactivatedItems:t}=e,r=Fn(t.join(`,
	`),{isActivated:!n,isPartOfLine:!0}),i=a.length?`,
	`+e.activatedItems.join(`,
	`):"",o=t.length?`
	`+r:"";return i+o},"generateConstraintsString"),Zn=s(({keyData:e,isParentActivated:n})=>{let a=Gn({keys:e.columns}),t=_n(e.columns,a,n),r=Wn(e).statement,i=e.constraintName?`CONSTRAINT ${wn({name:e.constraintName})} `:"";return{statement:Fe({template:Ge.createKeyConstraint,templateData:{constraintName:i,keyType:e.keyType,columns:t,options:r}}),isActivated:!a}},"createKeyConstraint"),Xn=s(({keyConstraints:e,isActivated:n})=>{let a=e.map(t=>Zn({keyData:t,isParentActivated:n}));return we({items:a,mapFunction:We})},"getDividedKeysConstraints"),Jn=s(({foreignKeyConstraints:e})=>we({items:e,mapFunction:We}),"getDividedForeignKeyConstraints"),zn=s(({columns:e,foreignKeyConstraints:n,keyConstraints:a,checkConstraints:t,isActivated:r})=>{let i=Xn({keyConstraints:a,isActivated:r}),o=Jn({foreignKeyConstraints:n}),m=re({dividedConstraints:i,isParentActivated:r}),u=re({dividedConstraints:o,isParentActivated:r}),p=re({dividedConstraints:{activatedItems:t,deactivatedItems:[]},isParentActivated:r}),y=Qn({statements:e}),d=Fe({template:Ge.createTableProps,templateData:{columns:y,foreignKeyConstraints:u,keyConstraints:m,checkConstraints:p}});return d?`
(
	${d}
)`:""},"getTableProps");Qe.exports={getTableProps:zn}});var H=l((ca,Je)=>{"use strict";var{trim:jn,identity:er}=require("lodash"),Xe=s(({prefix:e="",postfix:n="",modifier:a=er})=>t=>t?[e,a(t),n].filter(Boolean).map(jn).join(" "):"","getBasicValue"),tr=s(({configs:e,data:n})=>{let a=e.filter(({key:t})=>n[t]).map(({key:t,getValue:r})=>r(n[t],n)).filter(Boolean).join(`
	`);return Xe({prefix:" "})(a)},"getOptionsByConfigs");Je.exports={getBasicValue:Xe,getOptionsByConfigs:tr}});var et=l((la,je)=>{"use strict";var{toUpper:nr}=require("lodash"),{wrapInQuotes:ze}=g(),{getOptionsByConfigs:rr,getBasicValue:S}=H(),ar=s(e=>{let n=[{key:"selectStatement",getValue:S({prefix:"AS"})},{key:"underSuperTable",getValue:S({prefix:"UNDER",postfix:"INHERIT SELECT PRIVILEGES",modifier:a=>ze({name:a})})},{key:"tableProperties",getValue:a=>a},{key:"table_tablespace_name",getValue:S({prefix:"IN"})},{key:"auxiliaryBaseTable",getValue:S({prefix:"STORES"})},{key:"auxiliaryAppend",getValue:S({prefix:"APPEND",modifier:nr})},{key:"auxiliaryBaseColumn",getValue:S({prefix:"COLUMN",modifier:a=>ze({name:a})})},{key:"auxiliaryPart",getValue:S({prefix:"PART"})}];return rr({configs:n,data:e})},"getTableOptions");je.exports={getTableOptions:ar}});var rt=l((pa,nt)=>{"use strict";var{wrapInQuotes:M}=g(),tt=s(({key:e})=>e?e.alias?`${M({name:e.name})} as ${M({name:e.alias})}`:M({name:e.name}):"","getKeyWithAlias"),sr=s(({keys:e})=>Array.isArray(e)?e.reduce((n,a)=>{if(!a.tableName)return n.columns.push(tt({key:a})),n;let t=`${M({name:a.dbName})}.${M({name:a.tableName})}`;return n.tables.includes(t)||n.tables.push(t),n.columns.push({statement:`${t}.${tt({key:a})}`,isActivated:a.isActivated}),n},{tables:[],columns:[]}):{tables:[],columns:[]},"getViewData");nt.exports={getViewData:sr}});var st=l((da,at)=>{"use strict";var{wrapInQuotes:ir}=g(),{getBasicValue:or}=H(),cr=s(({index:e})=>or({prefix:" ",modifier:n=>ir({name:n})})(e.indxName),"getIndexName");at.exports={getIndexName:cr}});var ot=l((ga,it)=>{"use strict";var{toUpper:mr}=require("lodash"),{getBasicValue:lr}=H(),ur=s(({index:e})=>lr({prefix:" ",modifier:mr})(e.indxType),"getIndexType");it.exports={getIndexType:ur}});var lt=l((Na,mt)=>{"use strict";var{toUpper:ae}=require("lodash"),{getBasicValue:V,getOptionsByConfigs:pr}=H(),{wrapInQuotes:yr}=g(),ct=s((e=[])=>e.length?`(${e.map(({name:a,type:t})=>{let r=V({prefix:" ",modifier:ae})(t);return yr({name:a})+r}).join(", ")})`:"","getIndexKeys"),dr=s((e,n)=>{if(n.indxType!=="unique")return"";let a=ct(e);return V({prefix:"INCLUDE"})(a)},"getIncludeIndexKeys"),Tr=s(({index:e})=>{let n=[{key:"indxKey",getValue:ct},{key:"indxIncludeKey",getValue:dr},{key:"indxCompress",getValue:V({prefix:"COMPRESS",modifier:ae})},{key:"indxNullKeys",getValue:V({postfix:"NULL KEYS",modifier:ae})},{key:"indxTablespace",getValue:V({prefix:"IN"})}];return pr({configs:n,data:e})},"getIndexOptions");mt.exports={getIndexOptions:Tr}});var pt=l((ba,ut)=>{"use strict";var gr=s(({auxiliary:e,temporary:n})=>{switch(!0){case e:return" AUXILIARY";case n:return" GLOBAL TEMPORARY";default:return""}},"getTableType");ut.exports={getTableType:gr}});var ie=l((Ca,dt)=>{"use strict";var yt=s(({item:e={}})=>e.code||e.collectionName||e.name||"","getName"),se=s(({jsonSchema:e,path:n,callback:a})=>{e.properties&&Object.entries(e.properties).forEach(([t,r])=>{let i=[...n,r.GUID];a({propertyName:t,property:r,path:i}),se({jsonSchema:r,path:i,callback:a})}),e.items&&(Array.isArray(e.items)?e.items:[e.items]).forEach((r,i)=>{let o=[...n,r.GUID];a({propertyName:i,property:r,path:o}),se({jsonSchema:r,path:o,callback:a})})},"eachProperty"),Ar=s(({jsonSchema:e={}})=>{let n={};return se({jsonSchema:e,path:[],callback:s(({propertyName:t,property:r})=>{n[r.GUID]=yt({item:r})||t},"callback")}),n},"getIdToNameHashTable");dt.exports={getIdToNameHashTable:Ar,getName:yt}});var gt=l((Sa,Tt)=>{"use strict";var{getNamePrefixedWithSchemaName:Nr}=g(),{getName:Ir,getIdToNameHashTable:br}=ie(),fr=s(({tableData:e,detailsTab:n})=>{if(!n.auxiliary)return{};let a=e.relatedSchemas?.[n.auxiliaryBaseTable],t=a?.bucketName,r=br({jsonSchema:a}),i=Ir({item:a}),o=i&&Nr({name:i,schemaName:t}),m=r[n.auxiliaryBaseColumn?.[0]?.keyId];return{auxiliary:n.auxiliary,auxiliaryAppend:n.auxiliaryAppend,auxiliaryPart:n.auxiliaryPart,auxiliaryBaseTable:o,auxiliaryBaseColumn:m}},"hydrateAuxiliaryTableData");Tt.exports={hydrateAuxiliaryTableData:fr}});var Et=l((xa,Ct)=>{"use strict";var{toUpper:At,isEmpty:Cr,trim:P}=require("lodash"),A=F(),Er=le(),Nt=pe(),{commentIfDeactivated:D,wrapInQuotes:_,getNamePrefixedWithSchemaName:q,checkAllKeysDeactivated:X,toArray:J,hasType:Sr,setTab:It}=g(),{assignTemplates:N}=W(),T=ve(),{getColumnType:hr}=De(),{getColumnDefault:xr}=ke(),{getColumnConstraints:$r}=He(),{getTableCommentStatement:bt,getColumnComments:Kr,getIndexCommentStatement:vr}=_e(),{getTableProps:Rr}=Ze(),{getTableOptions:ft}=et(),{getViewData:Or}=rt(),{getIndexName:Pr}=st(),{getIndexType:qr}=ot(),{getIndexOptions:Dr}=lt(),{getTableType:Lr}=pt(),{getName:Br}=ie(),{hydrateAuxiliaryTableData:kr}=gt(),Yr=s(({columns:e})=>{let n=e.map(({statement:t,isActivated:r})=>D(t,{isActivated:r,isPartOfLine:!1})),a=n.findLastIndex(t=>!t.startsWith("--"));return a===-1?n.join(`
`):n.map((t,r)=>{let i=r!==n.length-1;return a===r&&i?`${t} -- ,`:`${t}${i?",":""}`}).join(`
		`)},"getViewColumnsAsString");Ct.exports=(e,n,a)=>({getDefaultType(t){return Er[t]},getTypesDescriptors(){return Nt},hasType(t){return Sr({descriptors:Nt,type:t})},hydrateSchema(t,r){return{schemaName:t.name,authorizationName:t.authorizationName,dataCapture:t.dataCapture}},createSchema({schemaName:t,ifNotExist:r,authorizationName:i,dataCapture:o}){return N({template:A.createSchema,templateData:{schemaName:_({name:t}),authorization:i?" AUTHORIZATION "+i:"",dataCapture:o?" DATA CAPTURE "+o:""}})},hydrateColumn({columnDefinition:t,jsonSchema:r,schemaData:i,definitionJsonSchema:o={}}){let m=!!r.$ref,u=m?t.type:At(r.mode||r.type),p=At(r.items?.mode||r.items?.type||"");return{name:t.name,type:u,ofType:r.ofType,notPersistable:r.notPersistable,size:r.size,primaryKey:T.isInlinePrimaryKey({column:r}),primaryKeyOptions:r.primaryKeyOptions,unique:T.isInlineUnique({column:r}),uniqueKeyOptions:r.uniqueKeyOptions,nullable:t.nullable,default:t.default,comment:r.refDescription||r.description||o.description,isActivated:t.isActivated,scale:t.scale,precision:t.precision,length:t.length,schemaName:i.schemaName,checkConstraints:r.checkConstraints,fractSecPrecision:r.fractSecPrecision,withTimeZone:r.withTimeZone,localTimeZone:r.localTimeZone,lengthSemantics:r.lengthSemantics,identity:r.identity,isUDTRef:m,itemsType:p}},hydrateJsonSchemaColumn(t,r){if(!t.$ref||Cr(r))return t;let{$ref:i,...o}=t;return{...r,...o}},convertColumnDefinition(t,r=A.columnDefinition){let i=N({template:r,templateData:{name:_({name:t.name}),type:hr(t),default:xr(t),constraints:$r(t)}});return D(i,{isActivated:t.isActivated})},hydrateCheckConstraint(t){return{name:t.chkConstrName,expression:t.constrExpression,comments:t.constrComments,description:t.constrDescription}},createCheckConstraint({name:t,expression:r}){return N({template:A.checkConstraint,templateData:{name:t?`CONSTRAINT ${_({name:t})} `:"",expression:P(r).replace(/^\(([\s\S]*)\)$/,"$1")}})},createForeignKeyConstraint({name:t,foreignKey:r,primaryTable:i,primaryKey:o,primaryTableActivated:m,foreignTableActivated:u,primarySchemaName:p,customProperties:y},d,f){let h=X({keys:o}),C=X({keys:r}),I=!h&&!C&&m&&u,x=J({value:r}),b=J({value:o}),$=T.customPropertiesForForeignKey({customProperties:y}),K=q({name:i,schemaName:p||f.schemaName}),L=t?`CONSTRAINT ${_({name:t})}`:"",B=I?T.foreignKeysToString({keys:x}):T.foreignActiveKeysToString({keys:x}),E=I?T.foreignKeysToString({keys:b}):T.foreignActiveKeysToString({keys:b}),k=N({template:A.createForeignKeyConstraint,templateData:{primaryTable:K,name:L,foreignKey:B,primaryKey:E,onDelete:$}});return{statement:P(k),isActivated:I}},createForeignKey({name:t,foreignTable:r,foreignKey:i,primaryTable:o,primaryKey:m,primaryTableActivated:u,foreignTableActivated:p,foreignSchemaName:y,primarySchemaName:d,customProperties:f},h,C){let I=X({keys:m}),x=X({keys:i}),b=!I&&!x&&u&&p,$=J({value:i}),K=J({value:m}),L=T.customPropertiesForForeignKey({customProperties:f}),B=q({name:o,schemaName:d||C.schemaName}),E=q({name:r,schemaName:y||C.schemaName}),k=t?_({name:t}):"",G=b?T.foreignKeysToString({keys:$}):T.foreignActiveKeysToString({keys:$}),v=b?T.foreignKeysToString({keys:K}):T.foreignActiveKeysToString({keys:K}),R=N({template:A.createForeignKey,templateData:{primaryTable:B,foreignTable:E,name:k,foreignKey:G,primaryKey:v,onDelete:L}});return{statement:P(R)+`
`,isActivated:b}},hydrateTable({tableData:t,entityData:r,jsonSchema:i}){let o=r[0],m=o.underSuperTable?.[0]?.parentTable,u=t.relatedSchemas?.[m],p=Br({item:u}),y=kr({tableData:t,detailsTab:o});return{...t,...y,keyConstraints:T.getTableKeyConstraints({jsonSchema:i}),selectStatement:P(o.selectStatement),temporary:o.temporary,description:o.description,ifNotExist:o.ifNotExist,tableProperties:o.tableProperties,table_tablespace_name:o.table_tablespace_name,underSuperTable:p}},createTable({checkConstraints:t,columnDefinitions:r,columns:i,foreignKeyConstraints:o,keyConstraints:m,name:u,schemaData:p,selectStatement:y,temporary:d,auxiliary:f,auxiliaryBaseTable:h,auxiliaryBaseColumn:C,auxiliaryAppend:I,auxiliaryPart:x,table_tablespace_name:b,underSuperTable:$,description:K,ifNotExist:L,tableProperties:B},E){let k=L?" IF NOT EXISTS":"",G=Lr({auxiliary:f,temporary:d}),v=q({name:u,schemaName:p.schemaName}),R=bt({tableName:v,description:K});if(f){let Kt=ft({table_tablespace_name:b,auxiliaryBaseTable:h,auxiliaryBaseColumn:C,auxiliaryAppend:I,auxiliaryPart:x}),vt=N({template:A.createAuxiliaryTable,templateData:{name:v,tableType:G,tableOptions:Kt}}),Rt=R?`
`+R+`
`:`
`;return D(vt+Rt,{isActivated:E})}let St=Rr({columns:i,foreignKeyConstraints:o,keyConstraints:m,checkConstraints:t,isActivated:E}),ht=ft({selectStatement:y,tableProperties:B,table_tablespace_name:b,underSuperTable:$}),oe=Kr({tableName:v,columnDefinitions:r}),xt=R||oe?`
`+R+oe:`
`,$t=N({template:A.createTable,templateData:{name:v,ifNotExists:k,tableProps:St,tableType:G,tableOptions:ht}});return D($t+xt,{isActivated:E})},hydrateIndex(t,r,i){return{...t,schemaName:i.schemaName}},createIndex(t,r){let i=Pr({index:r}),o=qr({index:r}),m=Dr({index:r}),u=q({name:t,schemaName:r.schemaName}),p=N({template:A.createIndex,templateData:{indexType:o,indexName:i,indexOptions:m,indexTableName:u}}),y=vr({indexName:i,description:r.indxDescription}),d=p+y;return D(d,{isActivated:r.isActivated})},hydrateViewColumn(t){return{name:t.name,tableName:t.entityName,alias:t.alias,isActivated:t.isActivated,dbName:t.dbName}},hydrateView({viewData:t,entityData:r}){let i=r[0];return{name:t.name,keys:t.keys,orReplace:i.or_replace,selectStatement:i.selectStatement,tableName:t.tableName,schemaName:t.schemaData.schemaName,description:i.description,rootTableAlias:i.rootTableAlias,tableTagsClause:i.tableTagsClause,viewProperties:i.viewProperties}},createView(t,r,i){let o=q({name:t.name,schemaName:t.schemaName}),m=t.orReplace?" OR REPLACE":"",{columns:u,tables:p}=Or({keys:t.keys}),y=Yr({columns:u}),d=bt({tableName:o,description:t.description}),f=d?`
`+d+`
`:`
`,h=t.viewProperties?` 
`+It({text:t.viewProperties}):"",C=P(t.selectStatement)?P(It({text:t.selectStatement})):N({template:A.viewSelectStatement,templateData:{tableName:p.join(", "),keys:y}}),I=N({template:A.createView,templateData:{name:o,orReplace:m,viewProperties:h,selectStatement:C}});return D(I+f,{isActivated:i})},commentIfDeactivated(t,r,i){return t}})});module.exports=Et();
