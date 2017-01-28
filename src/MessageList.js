import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import moment from 'moment';

moment.locale('fi');

class MessageList extends Component {
  componentWillUpdate = () => {
    const node = ReactDOM.findDOMNode(this);
    this.shouldScrollBottom = node.scrollTop + node.offsetHeight === node.scrollHeight;
  }

  componentDidUpdate = () => {
    if (this.shouldScrollBottom) {
      const node = ReactDOM.findDOMNode(this);
      node.scrollTop = node.scrollHeight;
    }
  }

  render() {
    const renderMessages = () => {
      const { messages } = this.props;

      const dateFormat = 'LLL';

      if (messages.length > 0) {
        return (messages.map((message, i) => <p key={i}><strong>{message.user}</strong> {moment(message.date).format(dateFormat)}<br /> {message.msg}</p>));
      }
      return (<p>No messages yet.</p>);
    };

    return (
      <div className="MessageList">{renderMessages()}</div>
    );
  }
}

MessageList.propTypes = {
  messages: React.PropTypes.array,
};

export default MessageList;
