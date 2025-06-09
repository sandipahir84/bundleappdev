
const HandleError = (thunkAPI, error, type) => {
  return thunkAPI.rejectWithValue(error);
};

export default HandleError;
