import { BaseApiResponse } from ".";
import { SynologyAPI } from "../../synology/consts";

export type ApiInfoResponse = BaseApiResponse<Record<SynologyAPI, {
  maxVersion: number;
  minVersion: number;
  path: string;
  requestFormat?: string;
}>>;
