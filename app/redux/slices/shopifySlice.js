import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { endpoints } from "../../lib/axios";
import HandleResponse from "../HandleResponse";
import HandleError from "../HandleError";
// import HandleResponse from "../HandleResponse";
// import HandleError from "../HandleError";
// import axios, { endpoints } from "../../lib/axios";

export const ShopifyProductListApi = createAsyncThunk("shopify/product", async (app, thunkAPI) => {
  try {
    // const selectedProducts = await window?.shopify?.resourcePicker({
    //   type: "product",
    //   // selectionIds: varprodcheck,
    // });
    // console.log(selectedProducts);


    // // Safe access: check if selectedProducts exists and is an array
    // if (Array.isArray(selectedProducts) && selectedProducts.length > 0) {
    //   console.log('First selected product:', selectedProducts[0]);
    //   return selectedProducts;
    // } else {
    //   console.log('No products selected');
    //   return [];
    // }
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});


export const ShopifyMixMatchCreateApi = createAsyncThunk("shopify/mixMatchCreate", async (formValues, thunkAPI) => {
  try {
    const apiUrl = endpoints.mixmatch.create;

    const formData = new FormData();
    // Append multiple images (assuming `images` is an array of files)
    if (formValues.media && Array.isArray(formValues.media)) {
      formValues.media.forEach((media, index) => {
        formData.append('media', media);
      });
    }

    // Append other form fields, including nested objects
    for (const key in formValues) {
      if (key === 'media') {
        continue; // Skip images as they are already appended
      }

      const value = formValues[key];

      if (typeof value === 'object' && value !== null) {
        // Convert nested objects to JSON strings
        formData.append(key, JSON.stringify(value));
      } else {
        // Append primitive values directly
        formData.append(key, value || '');
      }
    }
    // console.log("formdata", formValues.gender, [...formData.entries()]);
    const resposeData = await axios.post(apiUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
      .then((response) => HandleResponse(thunkAPI, response, apiUrl))
      .catch((error) => HandleError(thunkAPI, error, apiUrl));
    return resposeData;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});


export const ShopifyMixMatchListApi = createAsyncThunk("shopify/mixMatchList", async (formValues, thunkAPI) => {
  try {
    const apiUrl = endpoints.mixmatch.list;
    const resposeData = await axios.get(apiUrl, { params: formValues })
      .then((response) => HandleResponse(thunkAPI, response, apiUrl))
      .catch((error) => HandleError(thunkAPI, error, apiUrl));
    return resposeData;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const ShopifyMixMatchViewApi = createAsyncThunk("shopify/mixMatchView", async (id, thunkAPI) => {
  try {
    const apiUrl = endpoints.mixmatch.view(id);
    const resposeData = await axios.get(apiUrl)
      .then((response) => HandleResponse(thunkAPI, response, apiUrl))
      .catch((error) => HandleError(thunkAPI, error, apiUrl));
    return resposeData;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const ShopifyMixMatchUpdateApi = createAsyncThunk("shopify/mixMatchUpdate", async ({ id, formValues }, thunkAPI) => {
  try {
    const apiUrl = endpoints.mixmatch.update(id);

    const formData = new FormData();
    // Append multiple images (assuming `images` is an array of files)
    if (formValues.media && Array.isArray(formValues.media)) {
      formValues.media.forEach((media, index) => {
        formData.append('media', media);
      });
    }

    // Append other form fields, including nested objects
    for (const key in formValues) {
      if (key === 'media') {
        continue; // Skip images as they are already appended
      }

      const value = formValues[key];

      if (typeof value === 'object' && value !== null) {
        // Convert nested objects to JSON strings
        formData.append(key, JSON.stringify(value));
      } else {
        // Append primitive values directly
        formData.append(key, value || '');
      }
    }

    const resposeData = await axios.post(apiUrl, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
      .then((response) => HandleResponse(thunkAPI, response, apiUrl))
      .catch((error) => HandleError(thunkAPI, error, apiUrl));
    return resposeData;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

export const ShopifyMixMatchDeleteApi = createAsyncThunk("shopify/mixMatchDelete", async (id, thunkAPI) => {
  try {
    const apiUrl = endpoints.mixmatch.delete(id);
    const resposeData = await axios.delete(apiUrl)
      .then((response) => HandleResponse(thunkAPI, response, apiUrl))
      .catch((error) => HandleError(thunkAPI, error, apiUrl));
    return resposeData;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

const requestData = {
  product: {},
  mixmatchList: {},
  mixmatchView: {},
  mixmatchUpdate: {},
  mixmatchDelete: {},
}

const loadingData = {
  product: false,
  mixmatchList: false,
  mixmatchView: false,
  mixmatchUpdate: false,
  mixmatchDelete: false,
}

const initialState = {
  request: requestData,
  loading: loadingData,
  product: null,
  mixMatchBundle: null,
  mixmatchList: null,
  mixmatchView: null,
  mixmatchUpdate: null,
  mixmatchDelete: null,
};

const shopifySlice = createSlice({
  name: "shopify",
  initialState,
  reducers: {
    reset: () => initialState,
  },
  extraReducers(builder) {
    builder
      .addCase(ShopifyProductListApi.pending, (state) => {
        state.loading.product = true
      })
      .addCase(ShopifyProductListApi.fulfilled, (state, action) => {
        state.product = action.payload;
      })
      .addCase(ShopifyProductListApi.rejected, (state) => {
        state.product = null;
        state.loading.product = false
      })
      .addCase(ShopifyMixMatchCreateApi.pending, (state) => {
        state.loading.mixMatchBundle = true
      })
      .addCase(ShopifyMixMatchCreateApi.fulfilled, (state, action) => {
        state.mixMatchBundle = action.payload;
      })
      .addCase(ShopifyMixMatchCreateApi.rejected, (state) => {
        state.mixMatchBundle = null;
        state.loading.mixMatchBundle = false
      })
      .addCase(ShopifyMixMatchListApi.pending, (state) => {
        state.loading.mixmatchList = true
      })
      .addCase(ShopifyMixMatchListApi.fulfilled, (state, action) => {
        state.mixmatchList = action.payload;
      })
      .addCase(ShopifyMixMatchListApi.rejected, (state) => {
        state.mixmatchList = null;
        state.loading.mixmatchList = false
      })
      .addCase(ShopifyMixMatchViewApi.pending, (state) => {
        state.loading.mixmatchView = true
      })
      .addCase(ShopifyMixMatchViewApi.fulfilled, (state, action) => {
        state.mixmatchView = action.payload;
      })
      .addCase(ShopifyMixMatchViewApi.rejected, (state) => {
        state.mixmatchView = null;
        state.loading.mixmatchView = false
      })
      .addCase(ShopifyMixMatchUpdateApi.pending, (state) => {
        state.loading.mixmatchUpdate = true
      })
      .addCase(ShopifyMixMatchUpdateApi.fulfilled, (state, action) => {
        state.mixmatchUpdate = action.payload;
      })
      .addCase(ShopifyMixMatchUpdateApi.rejected, (state) => {
        state.mixmatchUpdate = null;
        state.loading.mixmatchUpdate = false
      })
      .addCase(ShopifyMixMatchDeleteApi.pending, (state) => {
        state.loading.mixmatchDelete = true
      })
      .addCase(ShopifyMixMatchDeleteApi.fulfilled, (state, action) => {
        state.mixmatchDelete = action.payload;
      })
      .addCase(ShopifyMixMatchDeleteApi.rejected, (state) => {
        state.mixmatchDelete = null;
        state.loading.mixmatchDelete = false
      });
  },
});

export const { reset, loginSuccess, logout, tokenSetUp, setAuth } = shopifySlice.actions;
export default shopifySlice.reducer;
