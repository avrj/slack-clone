import { dissoc } from 'ramda'

export const types = {
  FETCH_CHANNELS_REQUEST: 'CHANNELS/FETCH_CHANNELS_REQUEST',
  FETCH_CHANNELS_SUCCESS: 'CHANNELS/FETCH_CHANNELS_SUCCESS',
  FETCH_CHANNELS_FAILURE: 'CHANNELS/FETCH_CHANNELS_FAILURE',
  FETCH_CHANNELS_MESSAGES_REQUEST: 'CHANNELS/FETCH_CHANNELS_MESSAGES_REQUEST',
  FETCH_CHANNELS_MESSAGES_SUCCESS: 'CHANNELS/FETCH_CHANNELS_MESSAGES_SUCCESS',
  FETCH_CHANNELS_MESSAGES_FAILURE: 'CHANNELS/FETCH_CHANNELS_MESSAGES_FAILURE',
  FETCH_CHANNELS_MESSAGES_APPEND_REQUEST:
    'CHANNELS/FETCH_CHANNELS_MESSAGES_APPEND_REQUEST',
  FETCH_CHANNELS_MESSAGES_APPEND_SUCCESS:
    'CHANNELS/FETCH_CHANNELS_MESSAGES_APPEND_SUCCESS',
  FETCH_CHANNELS_MESSAGES_APPEND_FAILURE:
    'CHANNELS/FETCH_CHANNELS_MESSAGES_APPEND_FAILURE',
  MSG: 'CHANNELS/MSG',
  SEND_MSG_TO_CHANNEL: 'CHANNELS/SEND_MSG_TO_CHANNEL',
  SEND_MSG_TO_CHANNEL_REQUEST: 'CHANNELS/SEND_MSG_TO_CHANNEL_REQUEST',
  SET_HAS_NEW_MESSAGES_FOR_CHANNEL: 'CHANNELS/SET_HAS_NEW_MESSAGES_FOR_CHANNEL',
  SET_NO_NEW_MESSAGES_FOR_CHANNEL: 'CHANNELS/SET_NO_NEW_MESSAGES_FOR_CHANNEL',
  LEAVE_CHANNEL: 'CHANNELS/LEAVE_CHANNEL',
  ON_JOIN_CHANNEL: 'CHANNELS/ON_JOIN_CHANNEL',
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
            messages: messagesTransformed,
          },
        },
      }

    case types.FETCH_CHANNELS_MESSAGES_APPEND_SUCCESS:
      const messagesTransformedX = action.messages.map(
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
            messages: [
              ...messagesTransformedX,
              ...state.channels[action.channel].messages,
            ],
          },
        },
      }
    case types.MSG:
      const channelExists = channel => state.channels[channel]

      if (!channelExists(action.channel)) return { ...state }

      /* if (channel !== this.props.activeChannel && msg.user !== this.props.user) {
      channels[channel].hasNewMessages = true
    } */
      return {
        ...state,
        channels: {
          ...state.channels,
          [action.channel]: {
            ...state.channels[action.channel],
            messages: [...state.channels[action.channel].messages, msg],
          },
        },
      }
    case types.SEND_MSG_TO_CHANNEL:
      const msgData = {
        date: new Date().toISOString(),
        user: action.from,
        msg: action.msg,
      }

      return {
        ...state,
        channels: {
          ...state.channels,
          [action.to]: {
            ...state.channels[action.to],
            messages: [...state.channels[action.to].messages, msgData],
          },
        },
      }
    case types.SET_NO_NEW_MESSAGES_FOR_CHANNEL:
      return {
        ...state,
        channels: {
          ...state.channels,
          [action.channel]: {
            ...state.channels[action.channel],
            hasNewMessages: false,
          },
        },
      }
    case types.SET_HAS_NEW_MESSAGES_FOR_CHANNEL:
      return {
        ...state,
        channels: {
          ...state.channels,
          [action.channel]: {
            ...state.channels[action.channel],
            hasNewMessages: true,
          },
        },
      }
    case types.LEAVE_CHANNEL:
      return { ...state, channels: dissoc(action.channel, state.channels) }
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
  fetchChannelsMessagesAppend: channel => ({
    type: types.FETCH_CHANNELS_MESSAGES_APPEND_REQUEST,
    channel,
  }),
  setChannelsMessagesAppend: (channel, messages) => ({
    type: types.FETCH_CHANNELS_MESSAGES_APPEND_SUCCESS,
    messages,
    channel,
  }),
  msg: (msg, channel) => ({ type: types.MSG, msg, channel }),
  sendMsgToChannel: (from, to, msg) => ({
    type: types.SEND_MSG_TO_CHANNEL,
    from,
    to,
    msg,
  }),
  sendMsgToChannelRequest: (from, to, msg) => ({
    type: types.SEND_MSG_TO_CHANNEL_REQUEST,
    from,
    to,
    msg,
  }),
  setNoNewMessagesForChannel: channel => ({
    type: types.SET_NO_NEW_MESSAGES_FOR_CHANNEL,
    channel,
  }),
  setHasNewMessagesForChannel: channel => ({
    type: types.SET_HAS_NEW_MESSAGES_FOR_CHANNEL,
    channel,
  }),
  leaveChannel: channel => ({ type: types.LEAVE_CHANNEL, channel }),
  joinChannelRequest: channel => ({ type: types.ON_JOIN_CHANNEL, channel }),
}
