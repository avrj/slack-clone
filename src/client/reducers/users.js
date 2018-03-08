export const types = {
  FETCH_USERS_REQUEST: 'USERS/FETCH_USERS_REQUEST',
  FETCH_USERS_SUCCESS: 'USERS/FETCH_USERS_SUCCESS',
  FETCH_USERS_FAILURE: 'USERS/FETCH_USERS_FAILURE',
  SET_USER_ONLINE: 'USERS/SET_USER_ONLINE',
  SET_USER_OFFLINE: 'USERS/SET_USER_OFFLINE',
  PRIVATE_MSG: 'USERS/PRIVATE_MSG',
  OWN_PRIVATE_MSG: 'USERS/OWN_PRIVATE_MSG',
  SEND_MSG_TO_USER: 'USERS/SEND_MSG_TO_USER',
  SEND_MSG_TO_USER_REQUEST: 'USERS/SEND_MSG_TO_USER_REQUEST',
}

const initialState = {}

export default (state = initialState, action) => {
  switch (action.type) {
    case types.FETCH_USERS_SUCCESS:
      const users = action.users.reduce((previousValue, currentValue) => {
        previousValue[currentValue.local.username] = {
          online: currentValue.local.online,
          messages: [],
        }
        return previousValue
      }, {})

      return { ...state, users }
    case types.SET_USER_ONLINE:
      if (state.users[action.user]) {
        return {
          ...state,
          users: {
            ...state.users,
            [user]: { ...state.users[user], online: true },
          },
        }
      } else {
        return {
          ...state,
          users: { ...state.users, [user]: { online: true, messages: [] } },
        }
      }
    case types.SET_USER_OFFLINE:
      return {
        ...state,
        users: {
          ...state.users,
          [action.user]: { ...state.users[action.user], online: false },
        },
      }

    case types.PRIVATE_MSG:
      /* return {
        ...state,
        users: {
          ...state.users,
          [action.from]: {
            ...state.users[action.from],
            hasNewMessages:
              this.props.activeUser !== from ? true : users[from].hasNewMessages,
            messages: users[from] ? [...users[from].messages, msg] : [msg],
          },
        },
      } */

      return {
        ...state,
        users: {
          ...state.users,
          [action.from]: {
            ...state.users[action.from],
            messages: state.users[action.from]
              ? [...state.users[action.from].messages, action.msg]
              : [action.msg],
          },
        },
      }

    case types.OWN_PRIVATE_MSG:
      return {
        ...state,
        users: {
          ...state.users,
          [action.to]: {
            ...state.users[action.to],
            messages: state.users[action.to]
              ? [...state.users[action.to].messages, action.msg]
              : [action.msg],
          },
        },
      }
    case types.SEND_MSG_TO_USER:
      const msgData = {
        date: new Date().toISOString(),
        user: action.from,
        msg: action.msg,
      }
      return {
        ...state,
        users: {
          ...state.users,
          [action.to]: {
            ...state.users[action.to],
            messages: [...state.users[action.to].messages, msgData],
          },
        },
      }
    default:
      return state
  }
}

export const actions = {
  fetchUsers: () => ({ type: types.FETCH_USERS_REQUEST }),
  setUsers: users => ({ type: types.FETCH_USERS_SUCCESS, users }),
  fetchFailed: error => ({ type: types.FETCH_USERS_FAILURE, error }),
  setUserOnline: user => ({ type: types.SET_USER_ONLINE, user }),
  setUserOffline: user => ({ type: types.SET_USER_OFFLINE, user }),
  privateMsg: (msg, from) => ({ type: types.PRIVATE_MSG, msg, from }),
  ownPrivateMsg: (msg, to) => ({ type: types.OWN_PRIVATE_MSG, msg, to }),
  sendMsgToUser: (from, to, msg) => ({
    type: types.SEND_MSG_TO_USER,
    from,
    to,
    msg,
  }),
  sendMsgToUserRequest: (from, to, msg) => ({
    type: types.SEND_MSG_TO_USER_REQUEST,
    from,
    to,
    msg,
  }),
}
