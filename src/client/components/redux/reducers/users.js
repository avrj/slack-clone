export const types = {
  FETCH_USERS_REQUEST: 'USERS/FETCH_USERS_REQUEST',
  FETCH_USERS_SUCCESS: 'USERS/FETCH_USERS_SUCCESS',
  FETCH_USERS_FAILURE: 'USERS/FETCH_USERS_FAILURE',
  SET_USER_ONLINE: 'USERS/SET_USER_ONLINE',
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
    default:
      return state
  }
}

export const actions = {
  fetchUsers: () => ({ type: types.FETCH_USERS_REQUEST }),
  setUsers: users => ({ type: types.FETCH_USERS_SUCCESS, users }),
  fetchFailed: error => ({ type: types.FETCH_USERS_FAILURE, error }),
  setUserOnline: user => ({ type: types.SET_USER_ONLINE, user }),
}
