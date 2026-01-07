import axios, { AxiosInstance, AxiosRequestConfig } from "axios"
import iconv from "iconv-lite";
import ConfigManager from "./config";

const RETRY_MAX = 3
const RETRY_DELAY_BASE = 300

const attachRetryInterceptor = (instance: AxiosInstance) => {
  instance.interceptors.response.use(
    (response) => response,
    async (error) => {
      const config = error.config as AxiosRequestConfig & { __retryCount?: number }
      if (!config) return Promise.reject(error)

      config.__retryCount = config.__retryCount || 0
      if (config.__retryCount >= RETRY_MAX) {
        return Promise.reject(error)
      }
      config.__retryCount += 1

      // 简单的线性延迟
      const delay = RETRY_DELAY_BASE * config.__retryCount
      await new Promise((resolve) => setTimeout(resolve, delay))
      return instance(config)
    }
  )
}

const axiosInstance = axios.create({
  baseURL: 'https://www.tt1069.com/bbs/',
  headers: {
    'Cookie': ConfigManager.config.request.cookie
  },
  proxy: ConfigManager.config.request.proxy,
  responseType: 'arraybuffer'
})

axiosInstance.interceptors.response.use(
  (response) => {
    const contentType = response.headers['content-type'];
    if (contentType && contentType.includes('big5')) {
      const data = iconv.decode(response.data, 'big5');
      response.data = data;
    }
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

attachRetryInterceptor(axiosInstance)

export { attachRetryInterceptor }
export default axiosInstance