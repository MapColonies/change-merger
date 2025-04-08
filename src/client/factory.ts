import axios, { AxiosInstance } from 'axios';
import { X_API_KEY_HEADER } from '@src/common/constants';
import { RemoteOptions } from './options';

export const clientFactory = (options: RemoteOptions): AxiosInstance => {
  const { baseUrl: baseURL, auth, xApiKey, timeoutMs: timeout } = options;

  const headers = xApiKey !== undefined ? { [X_API_KEY_HEADER]: xApiKey } : {};
  const client = axios.create({ baseURL, auth, headers, timeout });
  return client;
};
