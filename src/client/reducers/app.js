export const types = {
  DISCONNECT: 'APP/DISCONNECT',
  CONNECT: 'APP/CONNECT',
  SHOW_ERROR_SNACKBAR: 'APP/SHOW_ERROR_SNACKBAR',
  HIDE_ERROR_SNACKBAR: 'APP/HIDE_ERROR_SNACKBAR',
  TOGGLE_DRAWER: 'APP/TOGGLE_DRAWER',
  SHOW_JOIN_CHANNEL_DIALOG: 'APP/SHOW_JOIN_CHANNEL_DIALOG',
  HIDE_JOIN_CHANNEL_DIALOG: 'APP/HIDE_JOIN_CHANNEL_DIALOG',
  JOIN_CHANNEL: 'APP/JOIN_CHANNEL',
  LOG_OUT: 'APP/LOG_OUT',
  LOG_OUT_REQUEST: 'APP/LOG_OUT_REQUEST',
  ON_ERROR: 'APP/ON_ERROR',
  CONNECT_TO_SOCKET: 'APP/CONNECT_TO_SOCKET',
  EMIT: 'APP/EMIT',
}

const initialState = {
  isConnected: false,
  isConnecting: true,
  isDisconnectedByClient: false,
  showErrorSnackbar: false,
  errorSnackbarText: '',
  showJoinChannelDialog: false,
  showDrawer: false,
}
export default (state = initialState, action) => {
  switch (action.type) {
    case types.DISCONNECT:
      return { ...state, isConnected: false }
    case types.CONNECT:
      return {
        ...state,
        isConnected: true,
        isConnecting: false,
      }
    case types.SHOW_ERROR_SNACKBAR:
      return {
        ...state,
        showErrorSnackbar: true,
        errorSnackbarText: action.error,
      }
    case types.HIDE_ERROR_SNACKBAR:
      return {
        ...state,
        showErrorSnackbar: false,
        errorSnackbarText: '',
      }
    case types.TOGGLE_DRAWER:
      return { ...state, showDrawer: action.showDrawer }
    case types.SHOW_JOIN_CHANNEL_DIALOG:
      return { ...state, showJoinChannelDialog: true }
    case types.HIDE_JOIN_CHANNEL_DIALOG:
      return { ...state, showJoinChannelDialog: false }
    case types.JOIN_CHANNEL:
      const channel = action.channel.toLowerCase()

      return {
        ...state,
        activeChannel: channel,
        activeUser: null,
        showDrawer: false,
        showJoinChannelDialog: false,
      }
    case types.LOG_OUT:
      return { ...state, isDisconnectedByClient: true }
    default:
      return state
  }
}

export const actions = {
  connect: () => ({ type: types.CONNECT }),
  disconnect: () => ({ type: types.DISCONNECT }),
  hideErrorSnackbar: () => ({ type: types.HIDE_ERROR_SNACKBAR }),
  toggleDrawer: showDrawer => ({ type: types.TOGGLE_DRAWER, showDrawer }),
  onShowJoinChannelDialog: () => ({ type: types.SHOW_JOIN_CHANNEL_DIALOG }),
  hideJoinChannelDialog: () => ({ type: types.HIDE_JOIN_CHANNEL_DIALOG }),
  showError: error => ({ type: types.SHOW_ERROR_SNACKBAR, error }),
  joinChannel: (channel, channels) => ({
    type: types.JOIN_CHANNEL,
    channel,
    channels,
  }),
  logOut: () => ({ type: types.LOG_OUT }),
  logOutRequest: () => ({ type: types.LOG_OUT_REQUEST }),
  connect_to_socket: sessionId => ({
    type: types.CONNECT_TO_SOCKET,
    sessionId,
  }),
  emit: (event, data) => ({ type: types.EMIT, event, data }),
  onError: error => ({ type: types.ON_ERROR, error }),
}
