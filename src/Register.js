import React, { Component } from 'react'
import RaisedButton from 'material-ui/RaisedButton'
import TextField from 'material-ui/TextField'
import { Link, withRouter } from 'react-router-dom'

class Register extends Component {
  state = {
    username: '',
    password: '',
    registerError: false,
  }

  onSubmit = e => {
    e.preventDefault()

    this.setState({ registerError: false })

    fetch('/api/register', {
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
      .then(() => {
        this.props.history.push({
          pathname: '/chat',
          state: {
            username: this.state.username,
          },
        })
      })
      .catch(() => {
        this.setState({ registerError: true })
      })
  }

  onBlur = () => {
    fetch(`/api/username/${this.state.username}`, {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(responseJson => {
        this.setState({ registerError: responseJson.alreadyInUse })
      })
      .catch(() => {})
  }

  render () {
    return (
      <div className='ChooseNickDialogContainer'>
        <p>Create an account</p>

        <div className='ChooseNickDialog'>
          <form onSubmit={this.onSubmit}>
            <TextField
              fullWidth
              autoFocus
              hintText='Username'
              value={this.state.username}
              onChange={e => this.setState({ username: e.target.value })}
              onBlur={this.onBlur}
              errorText={
                this.state.registerError &&
                'Username is already in use. Please choose another.'
              }
            />
            <TextField
              type='password'
              fullWidth
              hintText='Password'
              value={this.state.password}
              onChange={e => this.setState({ password: e.target.value })}
            />
            <RaisedButton
              type='submit'
              disabled={false}
              fullWidth
              label='Create an account'
              primary
            />
          </form>
          <p>
            or <Link to='/'>login with an existing account</Link>
          </p>
        </div>
      </div>
    )
  }
}

export default withRouter(Register)
