import axios from "axios";
import ConfigManager from "../config";
import { ApiInfoResponse } from "../typings/Synology/info";
import { SynologyAPI, SynologyAuthMethod, SynologyDownloadStation2TaskMethod, SynologyInfoMethod } from "./consts";
import { ApiAuthLoginResponse, ApiAuthLogoutResponse } from "../typings/Synology/auth";
import { ApiDownloadStation2EmuleTask } from "../typings/Synology/downloadStations2Task";

class SynologyService {

  private static _sid: string | null = null;
  private static _axiosInstance = axios.create({
    baseURL: ConfigManager.config.synology?.baseUrl,
  });

  public static async init() {
    process.on('SIGINT', async () => {
      console.log('登出群晖')
      await this.logout()
      process.exit(0)
    })
    return await this.login()
  }

  public static async getApiInfo(query?: string): Promise<ApiInfoResponse> {
    return await this._axiosInstance({
      url: '/webapi/query.cgi',
      method: 'GET',
      params: {
        api: SynologyAPI.SYNO_INFO,
        version: 1,
        method: SynologyInfoMethod.QUERY,
        query,
      }
    }).then((res) => res.data)
  }

  public static async login(): Promise<ApiAuthLoginResponse> {
    const response = await this._axiosInstance({
      url: '/webapi/entry.cgi',
      method: 'GET',
      params: {
        api: SynologyAPI.SYNO_AUTH,
        version: 6,
        method: SynologyAuthMethod.LOGIN,
        account: ConfigManager.config.synology?.account,
        passwd: ConfigManager.config.synology?.passwd,
        format: 'sid'
      }
    }).then((res) => res.data) as ApiAuthLoginResponse

    if (response.success) {
      this._sid = response.data.sid;
    }

    return response
  }

  public static async logout(): Promise<ApiAuthLogoutResponse> {
    return await this._axiosInstance({
      url: '/webapi/entry.cgi',
      method: 'GET',
      params: {
        _sid: this._sid,
        api: SynologyAPI.SYNO_AUTH,
        version: 6,
        method: SynologyAuthMethod.LOGOUT,
      }
    }).then((res) => res.data)
  }

  public static async listDownloadStation2EmuleTask(params?: {
    additional?: string[],
    sort_by?: string,
    order?: 'DESC' | 'ASC',
    offset?: number,
    limit?: number
  }): Promise<ApiDownloadStation2EmuleTask> {
    return await this._axiosInstance({
      url: '/webapi/entry.cgi',
      method: 'GET',
      params: {
        _sid: this._sid,
        api: SynologyAPI.SYNO_DOWNLOAD_STATION2_TASK,
        version: 2,
        method: SynologyDownloadStation2TaskMethod.LIST,
        additional: ['transfer'],
        type: ['emule'],
        sort_by: 'created_time',
        order: 'DESC',
        ...params
      }
    }).then((res) => res.data)
  }

  public static async createDownloadStation2EmuleTask(urls: string[]): Promise<ApiDownloadStation2EmuleTask> {
    return await this._axiosInstance({
      url: '/webapi/entry.cgi',
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      data: {
        _sid: this._sid,
        api: SynologyAPI.SYNO_DOWNLOAD_STATION2_TASK,
        version: 2,
        method: SynologyDownloadStation2TaskMethod.CREATE,
        type: '"url"',
        destination: ConfigManager.config.synology?.download.destination,
        url: JSON.stringify(urls),
        create_list: false
      }
    }).then((res) => res.data)
  }
}

export default SynologyService