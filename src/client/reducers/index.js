import { combineReducers } from 'redux'
import app from './app'
import users from './users'
import user from './user'
import channels from './channels'

const rootReducer = combineReducers({
  app,
  users,
  user,
  channels,
})

export default rootReducer
