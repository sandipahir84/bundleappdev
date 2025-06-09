import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios, { endpoints } from "../../lib/axios";
import HandleResponse from "../HandleResponse";
import HandleError from "../HandleError";

/**
 * Fetches a list of MixMatch products from the API
 * @param {Object} formValues - Filter parameters for the list request
 * @param {Object} thunkAPI - Redux Thunk API object
 * @returns {Promise<Object>} Response data from the API
 */
export const MixMatchListApi = createAsyncThunk("mixmatch/list", async (formValues, thunkAPI) => {
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

/**
 * Creates a new MixMatch product with media uploads
 * @param {Object} formValues - Form data including media files and product details
 * @param {Object} thunkAPI - Redux Thunk API object
 * @returns {Promise<Object>} Response data from the API
 */
export const MixMatchCreateApi = createAsyncThunk("mixmatch/create", async (formValues, thunkAPI) => {
  try {
    const apiUrl = endpoints.mixmatch.create;
    const formData = new FormData();

    // Append multiple media files to FormData
    if (formValues.media) {
      if (Array.isArray(formValues.media)) {
        formValues.media.forEach((media, index) => {
          formData.append('media', media);
        });
      } else {
        formData.append('media', formValues?.media);
      }
    }

    // Append other form fields, including nested objects
    for (const key in formValues) {
      if (key === 'media') {
        continue; // Skip media as it's already appended
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

    // Send the request with multipart/form-data content type
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

/**
 * Updates an existing MixMatch product
 * @param {Object} params - Parameters including id and formValues
 * @param {string} params.id - ID of the MixMatch product to update
 * @param {Object} params.formValues - Form data including media files and product details
 * @param {Object} thunkAPI - Redux Thunk API object
 * @returns {Promise<Object>} Response data from the API
 */
export const MixMatchUpdateApi = createAsyncThunk("mixmatch/update", async ({ id, ...formValues }, thunkAPI) => {
  try {
    const apiUrl = endpoints.mixmatch.update(id);

    const formData = new FormData();

    // Append multiple media files to FormData
    if (formValues.media) {
      if (Array.isArray(formValues.media)) {
        formValues.media.forEach((media, index) => {
          formData.append('media', media);
        });
      } else {
        formData.append('media', formValues?.media);
      }
    }

    // Append other form fields, including nested objects
    for (const key in formValues) {
      if (key === 'media') {
        continue; // Skip media as it's already appended
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

    // Send the request with multipart/form-data content type
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

/**
 * Deletes a MixMatch product
 * @param {string} id - ID of the MixMatch product to delete
 * @param {Object} thunkAPI - Redux Thunk API object
 * @returns {Promise<Object>} Response data from the API
 */
export const MixMatchDeleteApi = createAsyncThunk("mixmatch/delete", async (formValues, thunkAPI) => {
  try {
    const apiUrl = endpoints.mixmatch.delete;
    const ids = formValues?.selectedRowIds?.map(value => value)
    const responseData = await axios.delete(apiUrl, { data: { ids } })
      .then((response) => HandleResponse(thunkAPI, response, apiUrl))
      .catch((error) => HandleError(thunkAPI, error, apiUrl));
    return responseData;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

// Initial state for request data
const requestData = {
  list: {},
  create: {},
  edit: {},
  update: {},
  delete: {},
  view: {},
};

// Initial state for loading indicators
const loadingData = {
  list: false,
  create: false,
  edit: false,
  update: false,
  delete: false,
  view: false,
};

// Initial state for the slice
const initialState = {
  request: requestData,
  loading: loadingData,
  filterModel: {
    items: [],
  },
  sort: [],
  list: {},
  create: {},
  edit: {},
  update: {},
  delete: {},
  view: {},
};

/**
 * Redux slice for MixMatch products
 * Manages state and actions for CRUD operations on MixMatch products
 */
const mixmatchSlice = createSlice({
  name: "mixmatch",
  initialState,
  reducers: {
    // Reset the state to initial values
    reset: () => initialState,
  },
  extraReducers(builder) {
    builder
      // List API cases
      .addCase(MixMatchListApi.pending, (state) => {
        state.loading.list = true;
      })
      .addCase(MixMatchListApi.fulfilled, (state, action) => {
        state.list = action.payload;
        state.loading.list = false;
      })
      .addCase(MixMatchListApi.rejected, (state) => {
        state.list = null;
        state.loading.list = false;
      })

      // Create API cases
      .addCase(MixMatchCreateApi.pending, (state) => {
        state.loading.create = true;
      })
      .addCase(MixMatchCreateApi.fulfilled, (state, action) => {
        state.create = action.payload;
        state.loading.create = false;
      })
      .addCase(MixMatchCreateApi.rejected, (state) => {
        state.create = null;
        state.loading.create = false;
      })

      // Update API cases
      .addCase(MixMatchUpdateApi.pending, (state) => {
        state.loading.update = true;
      })
      .addCase(MixMatchUpdateApi.fulfilled, (state, action) => {
        state.update = action.payload;
        state.loading.update = false;
      })
      .addCase(MixMatchUpdateApi.rejected, (state) => {
        state.update = null;
        state.loading.update = false;
      })

      // Delete API cases
      .addCase(MixMatchDeleteApi.pending, (state) => {
        state.loading.delete = true;
      })
      .addCase(MixMatchDeleteApi.fulfilled, (state, action) => {
        state.delete = action.payload;
        state.loading.delete = false;
      })
      .addCase(MixMatchDeleteApi.rejected, (state) => {
        state.delete = null;
        state.loading.delete = false;
      });
  },
});

// Export actions
export const { reset } = mixmatchSlice.actions;

// Export reducer
export default mixmatchSlice.reducer;
