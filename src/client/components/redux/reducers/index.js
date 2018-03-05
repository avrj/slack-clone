import { combineReducers } from 'redux'
import users from './users'
import user from './user'
import channels from './channels'

const rootReducer = combineReducers({
  users,
  user,
  channels,
})

export default rootReducer
