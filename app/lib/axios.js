import axios from 'axios';
import { CONFIG } from '../global-config';
// import { appBridgeInstance } from './app-bridge';
// import { authenticatedFetch } from '@shopify/app-bridge/utilities';


// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: CONFIG.serverUrl });


// Attach Authenticated Fetch
// axiosInstance.interceptors.request.use(async (config) => {
//   if (!appBridgeInstance) {
//     console.error('No App Bridge instance available');
//     return config;
//   }

//   const fetchFunc = authenticatedFetch(appBridgeInstance);

//   const response = await fetchFunc(CONFIG.serverUrl + config.url, {
//     method: config.method?.toUpperCase() || 'GET',
//     headers: {
//       ...config.headers,
//       'Content-Type': 'application/json',
//     },
//     body: config.data ? JSON.stringify(config.data) : undefined,
//   });

//   if (!response.ok) {
//     const error = new Error(`Request failed with status ${response.status}`);
//     throw error;
//   }

//   const responseData = await response.json();

//   config.adapter = async () => ({
//     data: responseData,
//     status: response.status,
//     statusText: response.statusText,
//     headers: {},
//     config,
//     request: {},
//   });

//   return config;
// });

axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => Promise.reject(({
    status: error.response?.status,
    data: error.response?.data,
    message: error.response?.message
  }) || 'Something went wrong')
);

// ----------------------------------------------------------------------

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args) => {
  try {
    const [url, config] = Array.isArray(args) ? args : [args];

    const res = await axiosInstance.get(url, { ...config });

    return res.data;
  } catch (error) {
    console.error('Failed to fetch:', error);
    throw error;
  }
};

// ----------------------------------------------------------------------

export const endpoints = {
  auth: {
    me: 'private/auth/me',
  },
  product: {
    list: '/api/product/list'
  },
  mixmatch: {
    create: '/api/mixmatch/create',
    list: '/api/mixmatch/list',
    edit: (id) => `/api/mixmatch/edit/${id}`,
    update: (id) => `/api/mixmatch/update/${id}`,
    delete: `/api/mixmatch/delete`,
  },
};
