import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import { Link, browserHistory } from 'react-router';

class Login extends Component {
  constructor() {
    super();

    this.state = {
      username: '',
      password: '',
      signInError: false,
    };
  }

  onSubmit = (e) => {
    e.preventDefault();

    this.setState({ signInError: false });

    if (this.state.username.length >= 1 && this.state.password.length >= 1) this.authenticate();
  }

  authenticate = () => fetch('/authenticate',
    {
      credentials: 'include',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: this.state.username,
        password: this.state.password,
      }),
    })
            .then(response => response.json())
            .then((responseJson) => {
              browserHistory.push({ pathname: '/chat',
                state: {
                  username: responseJson.local.username,
                } });
            })
            .catch((error) => { this.setState({ signInError: true }); })

  render() {
    const { username, password } = this.state;

    const showNotification = () => {
      if (this.props.location.state) {
        return this.props.location.state.message ? this.props.location.state.message : null;
      }

      return null;
    };

    return (
      <div className="ChooseNickDialogContainer">
        <p>Chat App</p>

        {showNotification()}

        <div className="ChooseNickDialog">
          <form onSubmit={this.onSubmit}>
            <TextField
              fullWidth
              autoFocus
              hintText="Username"
              value={username}
              onChange={e => this.setState({ username: e.target.value })}
            />
            <TextField
              type="password"
              fullWidth
              hintText="Password"
              value={password}
              onChange={e => this.setState({ password: e.target.value })}
              errorText={this.state.signInError && "Username and/or password doesn't match"}
            />
            <RaisedButton
              type="submit"
              disabled={false}
              fullWidth
              label="Login"
              primary

            />
          </form>
          <p>or <Link to="/register">create an account</Link></p>
        </div>
      </div>
    );
  }
}

export default Login;
