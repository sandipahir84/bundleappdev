import { combineReducers } from 'redux';
import { persistReducer } from 'redux-persist';
// import storage from 'redux-persist/lib/storage/session'; // ✅ use sessionStorage

// slices
import authReducer from './slices/authSlice';
import shopifyReducer from './slices/shopifySlice';
import mixmatchReducer from './slices/mixmatchSlice';

const createNoopStorage = () => {
  return {
    getItem: (_key) => Promise.resolve(null),
    setItem: (_key, value) => Promise.resolve(),
    removeItem: (_key) => Promise.resolve(),
  };
};

let storage;
if (typeof window !== 'undefined') {
  try {
    window.localStorage.setItem('__test__', '__test__');
    window.localStorage.removeItem('__test__');
    storage = require('redux-persist/lib/storage').default;
  } catch (e) {
    storage = createNoopStorage(); // Fallback if storage is not available
  }
} else {
  storage = createNoopStorage();
}

const persistConfigs = [
  {
    key: 'auth',
    storage,
    keyPrefix: 'shopify-bundle-',
    whitelist: []
  },
  {
    key: 'shopify',
    storage,
    keyPrefix: 'shopify-bundle-',
    whitelist: []
  },
  {
    key: 'mixmatch',
    storage,
    keyPrefix: 'mixmatch-bundle-',
    whitelist: []
  },
];

// Define an array of reducers
const reducers = {
  auth: authReducer,
  shopify: shopifyReducer,
  mixmatch: mixmatchReducer,
};

// Combine all reducers into a single reducer
const rootReducer = combineReducers(
  Object.keys(reducers).reduce((acc, key, index) => {
    acc[key] = persistReducer(persistConfigs[index], reducers[key]);
    return acc;
  }, {})
);

export default rootReducer;

// const checkoutPersistConfig = {
//   key: 'checkout',
//   storage,
//   keyPrefix: 'redux-',
// };
// const dropdownPersistConfig = {
//   key: 'dropdown',
//   storage,
//   keyPrefix: 'redux-',
// };

// export const rootReducer = combineReducers({
//   checkout: persistReducer(checkoutPersistConfig, checkoutReducer),
// });
