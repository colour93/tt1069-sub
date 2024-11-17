import axios from "axios"
import iconv from "iconv-lite";
import ConfigManager from "./config";

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
    // 处理错误
    return Promise.reject(error);
  }
);

export default axiosInstance