type UUID = string;

type FilePath = string;

type AppTarget = 'Db2';

type App = {
  require: (packageName: string) => any;
};

type AppLogger = {
  log: (logType: string, logData: { message: string }, title: string, hiddenKeys: string[]) => void;
};

type Pagination = {
  enabled: boolean;
  value: number;
};

type RecordSamplingType = 'relative' | 'absolute';

type RecordSamplingSettings = {
  [key: RecordSamplingType]: {
    value: number;
  };
  active: RecordSamplingType;
  maxValue: number;
};

enum AuthTypeEnum {
  usernamePassword = 'username_password',
}

type AuthType = `${AuthTypeEnum}`;

type ConnectionInfo = {
  name: string;
  host: string;
  authType: AuthType;
  port: number;
  userName: string;
  userPassword: string;
  database: string;
  target: AppTarget;
  id: UUID;
  appVersion: string;
  tempFolder: FilePath;
  pluginVersion?: string;
  includeSystemCollection: boolean;
  includeEmptyCollection: boolean;
  pagination: Pagination;
  recordSamplingSettings: RecordSamplingSettings;
  queryRequestTimeout: number;
  applyToInstanceQueryRequestTimeout: number;
  activeProxyPool: string[];
  hiddenKeys: string[];
  options: any;
};

type Logger = {
  error: (error: Error) => void;
  info: (message: string) => void;
  progress: (message: string, containerName: string, entityName: string) => void;
};

type Callback = (error: Error, result: any[], info?: { version?: string }, relationships?: any[]) => void;

type NameMap = {
  [key: string]: NameMap | string[];
};

type BucketCollectionNamesData = {
  dbName: string;
  scopeName?: string;
  dbCollections?: string[];
  status?: string;
  disabledTooltip?: string;
};

type Document = {
  [key: string]: any;
};

type DbCollectionData = {
  dbName: string;
  collectionName: string;
  documentKind: string;
  standardDoc: object;
  collectionDocs: object;
  bucketInfo: object;
  emptyBucket: boolean;
  indexes: object[];
  documents: Document[];
  entityLevel: object;
};

type Connection = {
  execute: ({ query, callable, inparam }: { query: string, callable?: boolean, inparam?: number }) => Promise<any>;
};

export {
  App,
  AppLogger,
  AppTarget,
  BucketCollectionNamesData,
  Callback,
  Connection,
  ConnectionInfo,
  DbCollectionData,
  Document,
  FilePath,
  NameMap,
  Logger,
  Pagination,
  RecordSamplingSettings,
  UUID,
};
