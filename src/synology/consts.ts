export enum SynologyAPI {
  SYNO_INFO = 'SYNO.API.Info',
  SYNO_AUTH = 'SYNO.API.Auth',
  SYNO_DOWNLOAD_STATION2_TASK = 'SYNO.DownloadStation2.Task',
}

export enum SynologyInfoMethod {
  QUERY = 'query',
}

export enum SynologyAuthMethod {
  LOGIN = 'login',
  LOGOUT = 'logout',
}

export enum SynologyDownloadStation2TaskMethod {
  CREATE = 'create',
  LIST = 'list',
}
