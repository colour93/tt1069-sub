import { BaseApiResponse } from ".";

export type ApiAuthLoginResponse = BaseApiResponse<{
  did: string;
  is_portal_port: boolean;
  sid: string;
}>

export type ApiAuthLogoutResponse = BaseApiResponse<undefined>;