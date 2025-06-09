const HandleResponse = (thunkAPI, response) => {
  if (response.status === 200) {
    return thunkAPI.fulfillWithValue(response.data);
  } else {
    return thunkAPI.rejectWithValue();
  }
};

export default HandleResponse;
