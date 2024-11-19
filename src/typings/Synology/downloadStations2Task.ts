import { BaseApiResponse } from ".";

export type ApiDownloadStation2EmuleTask = BaseApiResponse<{
  offset: number;
  task: DownloadStation2EmuleTask[];
  total: number;
}>

export type DownloadStation2EmuleTask = {
  id: string;
  size: number;
  status: DownloadStation2EmuleTaskStatus;
  title: string;
  type: 'emule';
  username: string;
  additional: DownloadStation2EmuleTaskAdditional;
}

export enum DownloadStation2EmuleTaskStatus {
  WAITING = 1,
  FINISHED = 5,
}

export type DownloadStation2EmuleTaskAdditional = {
  transfer?: DownloadStation2EmuleTaskAdditionalTransfer;
};

export type DownloadStation2EmuleTaskAdditionalTransfer = {
  downloaded_pieces: number;
  size_downloaded: number;
  size_uploaded: number;
  speed_download: number;
  speed_upload: number;
}
