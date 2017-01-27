import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';
import Login from './Login';

class ChooseNickDialog extends Component {
  constructor() {
    super();

    this.state = {
      nick: '',
    };
  }

  authenticate = () => {
    this.props.authenticate(this.state.nick);

    this.setState({ nick: '' });
  }

  render() {
    return (
      <div className="ChooseNickDialogContainer">
        <Login />
        <p>Chat App</p>

        <div className="ChooseNickDialog">
          <form onSubmit={this.authenticate}>
            <TextField
              fullWidth
              autoFocus
              hintText="Choose your nickname"
              value={this.state.nick}
              onChange={e => this.setState({ nick: e.target.value })}
            />

            <RaisedButton
              fullWidth
              label="Enter"
              primary
              onTouchTap={this.authenticate}
            />
          </form>
        </div>
      </div>
    );
  }
}

ChooseNickDialog.propTypes = {
  authenticate: React.PropTypes.func.isRequired,
};

export default ChooseNickDialog;
