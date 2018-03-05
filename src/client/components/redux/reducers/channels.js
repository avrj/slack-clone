export const types = {
  FETCH_CHANNELS_REQUEST: 'CHANNELS/FETCH_CHANNELS_REQUEST',
  FETCH_CHANNELS_SUCCESS: 'CHANNELS/FETCH_CHANNELS_SUCCESS',
  FETCH_CHANNELS_FAILURE: 'CHANNELS/FETCH_CHANNELS_FAILURE',
  FETCH_CHANNELS_MESSAGES_REQUEST: 'CHANNELS/FETCH_CHANNELS_MESSAGES_REQUEST',
  FETCH_CHANNELS_MESSAGES_SUCCESS: 'CHANNELS/FETCH_CHANNELS_MESSAGES_SUCCESS',
  FETCH_CHANNELS_MESSAGES_FAILURE: 'CHANNELS/FETCH_CHANNELS_MESSAGES_FAILURE',
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
    case types.FETCH_CHANNELS_MESSAGES_SUCCESS:
      const messagesTransformed = action.messages.map(
        ({ timestamp, user, text }) => ({
          date: timestamp,
          user,
          msg: text,
        })
      )

      return {
        ...state,
        channels: {
          ...state.channels,
          [action.channel]: {
            hasNewMessages: false,
            earlierMessagesLoadedBefore: true,
            messagesTransformed,
          },
        },
      }
    default:
      return state
  }
}

export const actions = {
  fetchChannels: () => ({ type: types.FETCH_CHANNELS_REQUEST }),
  setChannels: channels => ({ type: types.FETCH_CHANNELS_SUCCESS, channels }),
  fetchFailed: error => ({ type: types.FETCH_CHANNELS_FAILURE, error }),
  fetchChannelsMessages: channel => ({
    type: types.FETCH_CHANNELS_MESSAGES_REQUEST,
    channel,
  }),
  setChannelsMessages: (channel, messages) => ({
    type: types.FETCH_CHANNELS_MESSAGES_SUCCESS,
    messages,
    channel,
  }),
}
