export const types = {
  SET_USER: 'USER/SET_USER',
  SET_ACTIVE_USER: 'USER/SET_ACTIVE_USER',
  SET_ACTIVE_CHANNEL: 'USER/SET_ACTIVE_CHANNEL',
  REMOVE_USER_DATA: 'USER/REMOVE_USER_DATA',
}

const initialState = {
  activeChannel: null,
  activeUser: null,
  user: null,
}

export default (state = initialState, action) => {
  switch (action.type) {
    case types.SET_USER:
      return { ...state, user: action.user }
    case types.SET_ACTIVE_CHANNEL:
      return { ...state, activeChannel: action.activeChannel, activeUser: null }
    case types.SET_ACTIVE_USER:
      return { ...state, activeUser: action.activeUser, activeChannel: null }
    case types.REMOVE_USER_DATA:
      return initialState
    default:
      return state
  }
}

export const actions = {
  setUser: user => ({ type: types.SET_USER, user }),
  setActiveUser: activeUser => ({ type: types.SET_ACTIVE_USER, activeUser }),
  setActiveChannel: activeChannel => ({
    type: types.SET_ACTIVE_CHANNEL,
    activeChannel,
  }),
  removeUserData: () => ({ type: types.REMOVE_USER_DATA }),
}
