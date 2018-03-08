import React from 'react'
import Chat from '../containers/Chat/Chat'
import Login from '../containers/Login/Login'
import Register from '../containers/Register/Register'
import { Router, Route } from 'react-router-dom'
import AppContainer from '../containers/AppContainer'
import history from './history'

const AppRouter = () => (
  <Router history={history}>
    <AppContainer>
      <Route exact path='/' component={Login} />
      <Route path='/chat' component={Chat} />
      <Route path='/register' component={Register} />
    </AppContainer>
  </Router>
)

export default AppRouter
