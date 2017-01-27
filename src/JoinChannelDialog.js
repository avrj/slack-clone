import React, { Component } from 'react';
import Dialog from 'material-ui/Dialog';
import RaisedButton from 'material-ui/RaisedButton';
import TextField from 'material-ui/TextField';

class JoinChannelDialog extends Component {
  constructor() {
    super();

    this.state = {
      channelToJoin: '',
    };
  }

  join = () => {
    const { channelToJoin } = this.state;

    if (channelToJoin.length >= 1) {
      this.props.join(channelToJoin);

      this.setState({ channelToJoin: '' });
    }
  }

  render() {
    const actions = [
      <RaisedButton
        label="Join"
        primary
        onTouchTap={this.join}
      />,
    ];

    return (
      <Dialog
        actions={actions}
        modal={false}
        open
      >
        <p>Join channel</p>
        <form onSubmit={this.join}>
          <TextField
            autoFocus
            hintText="Enter the name of the channel"
            floatingLabelText="Namel of channel"
            floatingLabelFixed
            value={this.state.channelToJoin}
            onChange={e => this.setState({ channelToJoin: e.target.value })}
          />
        </form>
      </Dialog>
    );
  }
}

JoinChannelDialog.propTypes = {
  join: React.PropTypes.func.isRequired,
};

export default JoinChannelDialog;
