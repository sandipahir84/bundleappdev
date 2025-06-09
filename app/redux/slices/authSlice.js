import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import HandleResponse from "../HandleResponse";
import HandleError from "../HandleError";
import axios, { endpoints } from "../../lib/axios";

export const authMeApi = createAsyncThunk("auth/me", async (formValues, thunkAPI) => {
  try {
    const apiUrl = endpoints.auth.me;
    const resposedata = await axios.post(apiUrl, formValues)
      .then((response) => HandleResponse(thunkAPI, response, apiUrl))
      .catch((error) => HandleError(thunkAPI, error, apiUrl));
    return resposedata;
  } catch (error) {
    const message = (error.response && error.response.data && error.response.data.message) || error.message || error.toString();
    return thunkAPI.rejectWithValue(message);
  }
});

const requestData = {
  me: {},
}

const loadingData = {
  me: false,
}

const initialState = {
  request: requestData,
  loading: loadingData,
  user: null,

};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    reset: () => initialState,
    loginSuccess: (state, action) => {
      state.isLoggedIn = true;
      state.user = action.payload;
    },
    tokenSetUp: (state, action) => {
      state.isToken = action.payload;
    },
    logout: (state) => {
      state.isLoggedIn = false;
      state.user = null;
    },
    setAuth: (state, action) => {
      state.user = action.payload?.user
      state.isLoggedIn = action.payload?.user ? true : false
      state.loading = action.payload?.loading
    }
  },
  extraReducers(builder) {
    builder
      .addCase(authMeApi.pending, (state) => {
        state.loading.me = true
      })
      .addCase(authMeApi.fulfilled, (state, action) => {
        state.user = action.payload?.user;
      })
      .addCase(authMeApi.rejected, (state) => {
        state.user = null;
        state.loading.me = false
      });
  },
});

export const { reset, loginSuccess, logout, tokenSetUp, setAuth } = authSlice.actions;
export default authSlice.reducer;
