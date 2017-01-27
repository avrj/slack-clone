import React, { Component } from 'react';
import MessageList from './MessageList';

class Channel extends Component {
  render() {
    return (
      <div className="ChannelContainer">
        <MessageList messages={this.props.messages} />
      </div>
    );
  }
}

Channel.propTypes = {
  messages: React.PropTypes.array,
};

export default Channel;
