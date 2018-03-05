export const types = {
  FETCH_CHANNELS_REQUEST: 'CHANNELS/FETCH_CHANNELS_REQUEST',
  FETCH_CHANNELS_SUCCESS: 'CHANNELS/FETCH_CHANNELS_SUCCESS',
  FETCH_CHANNELS_FAILURE: 'CHANNELS/FETCH_CHANNELS_FAILURE',
}

const initialState = {}

export default (state = initialState, action) => {
  switch (action.type) {
    case types.FETCH_CHANNELS_SUCCESS:
      const channels = action.channels.local.channels.reduce(
        (previousValue, currentValue) => {
          previousValue[currentValue] = {
            messages: [],
            earlierMessagesLoadedBefore: false,
          }
          return previousValue
        },
        {}
      )
      return { ...state, channels }
    default:
      return state
  }
}

export const actions = {
  fetchChannels: () => ({ type: types.FETCH_CHANNELS_REQUEST }),
  setChannels: channels => ({ type: types.FETCH_CHANNELS_SUCCESS, channels }),
  fetchFailed: error => ({ type: types.FETCH_CHANNELS_FAILURE, error }),
}
