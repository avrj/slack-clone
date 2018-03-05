import React, { Component } from 'react'
import { bool, node } from 'prop-types'
import AttentionDialog from './AttentionDialog'

class ErrorHandler extends Component {
  render () {
    if (this.props.isConnecting) {
      return <AttentionDialog title='Connecting' text='Just a sec...' />
    } else if (this.props.isConnected) {
      return this.props.children
    } else if (this.props.isDisconnectedByClient) {
      return (
        <AttentionDialog
          title='Disconnected by client'
          text='You are now disconnected.'
        />
      )
    } else {
      return (
        <AttentionDialog
          title='Connection lost'
          text='You will be reconnected automatically if the chat server responds.'
        />
      )
    }
  }
}

ErrorHandler.propTypes = {
  isConnecting: bool.isRequired,
  isConnected: bool.isRequired,
  isDisconnectedByClient: bool.isRequired,
  children: node.isRequired,
}

export default ErrorHandler
