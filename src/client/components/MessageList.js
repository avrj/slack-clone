import React, { Component } from 'react'
import { distanceInWordsToNow } from 'date-fns'
import { arrayOf, shape, string } from 'prop-types'

class MessageList extends Component {
  componentWillUpdate = () => {
    this.shouldScrollBottom =
      this.node.scrollTop + this.node.offsetHeight === this.node.scrollHeight
  }

  componentDidUpdate = () => {
    if (this.shouldScrollBottom) {
      this.node.scrollTop = this.node.scrollHeight
    }
  }

  render () {
    const renderMessages = () => {
      const { messages } = this.props

      const dateFormat = 'LLL'

      if (messages.length > 0) {
        return messages.map(message => (
          <p key={message.date}>
            <strong>{message.user}</strong> {distanceInWordsToNow(message.date)}{' '}
            ago
            <br /> {message.msg}
          </p>
        ))
      }
      return <p>No messages yet.</p>
    }

    return (
      <div
        style={{
          position: 'absolute',
          top: '60px',
          left: '20px',
          bottom: '20px',
          paddingLeft: '10',
        }}
        ref={node => {
          this.node = node
        }}
      >
        {renderMessages()}
      </div>
    )
  }
}

MessageList.propTypes = {
  messages: arrayOf(
    shape({
      date: string.isRequired,
      user: string.isRequired,
      msg: string.isRequired,
    })
  ),
}

MessageList.defaultProps = {
  messages: [],
}

export default MessageList
