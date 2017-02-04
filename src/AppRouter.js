import React, { Component } from 'react';
import AppContainer from './AppContainer';
import Chat from './Chat';
import Login from './Login';
import Register from './Register';
import { Router, Route, IndexRoute, browserHistory } from 'react-router';
import Layout from './Layout';

class AppRouter extends Component {
  render() {
    const routes = (<Route path="/" component={AppContainer}>
      <IndexRoute component={Login} />
      <Route path="chat" component={Chat} />
      <Route path="register" component={Register} />
    </Route>);

    return (
      <Router key={Math.random()} history={browserHistory}>
        {routes}
      </Router>
    );
  }
}

export default AppRouter;
