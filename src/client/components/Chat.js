import React, { Component } from 'react'
import io from 'socket.io-client'
import { withRouter } from 'react-router-dom'
import { withCookies } from 'react-cookie'
import Drawer from 'material-ui/Drawer'
import AppBar from 'material-ui/AppBar'
import IconMenu from 'material-ui/IconMenu'
import IconButton from 'material-ui/IconButton'
import MenuItem from 'material-ui/MenuItem'
import Snackbar from 'material-ui/Snackbar'
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert'
import events from '../../common/events'
import './App.css'
import ChatInput from './ChatInput'
import ChannelList from './ChannelList'
import UserList from './UserList'
import JoinChannelDialog from './JoinChannelDialog'
import AttentionDialog from './AttentionDialog'
import UserProfile from './UserProfile'
import MessageList from './MessageList'

const parseSessionId = authCookie => authCookie.split(':')[1].split('.')[0]

const dissoc = (prop, obj) => {
  const result = {}

  for (var p in obj) {
    result[p] = obj[p]
  }

  delete result[prop]

  return result
}

class App extends Component {
  constructor (props) {
    super(props)

    this.persistentActiveChannelIdentifier = 'activeChannel'
    this.persistentActiveUserIdentifier = 'activeUser'
    this.persistentLoggedUserIdentifier = 'loggedUser'

    this.state = {
      users: {},
      channels: {},
      activeChannel: null,
      activeUser: null,
      loggedUser: null,
      showDrawer: false,
      isConnecting: true,
      isConnected: false,
      isDisconnectedByClient: false,
      showErrorSnackbar: false,
      errorSnackbarText: '',
    }

    const sessionId = parseSessionId(props.cookies.get('express.sid'))

    this.client = io.connect(`//${window.location.host}`, {
      query: `session_id=${sessionId}`,
    })

    const eventHandlers = [
      { event: events.connect, handler: this._handleConnect },
      { event: events.disconnect, handler: this._handleDisconnect },
      { event: events.error, handler: this._handleError },
      { event: events.online, handler: this._handleOnline },
      { event: events.offline, handler: this._handleOffline },
      { event: events.join, handler: this._handleJoin },
      { event: events.leave, handler: this._handleLeave },
      { event: events.msg, handler: this._handleMsg },
      { event: events.privateMsg, handler: this._handlePrivateMsg },
      { event: events.ownPrivateMsg, handler: this._handleOwnPrivateMsg },
    ]

    eventHandlers.map(({ event, handler }) => this.client.on(event, handler))
  }

  _handleConnect = () => {
    fetch('/api/users', {
      credentials: 'include',
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(this.handleOnConnectFetchUsersResponse)
      .catch(error => {
        this.setState({
          showErrorSnackbar: true,
          errorSnackbarText: 'Error retrieving users',
        })
      })
  }

  handleOnConnectFetchUsersResponse = responseJson => {
    if (!localStorage.getItem(this.persistentLoggedUserIdentifier)) {
      localStorage.setItem(
        this.persistentLoggedUserIdentifier,
        this.props.location.state.username
      )
    }

    const users = responseJson.reduce((previousValue, currentValue) => {
      previousValue[currentValue.local.username] = {
        online: currentValue.local.online,
        messages: [],
      }
      return previousValue
    }, {})

    this.setState({ users })

    fetch('/api/user/channels', {
      credentials: 'include',
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(this.handleOnConnectFetchUserChannelsResponse)
      .catch(error => {
        this.setState({
          showErrorSnackbar: true,
          errorSnackbarText: "Error retrieving user's channels",
        })
      })
  }

  handleOnConnectFetchUserChannelsResponse = responseJson => {
    const loggedUser = localStorage.getItem(this.persistentLoggedUserIdentifier)

    this.setState({ loggedUser })

    const activeUser = localStorage.getItem(this.persistentActiveUserIdentifier)

    const channels = responseJson.local.channels.reduce(
      (previousValue, currentValue) => {
        previousValue[currentValue] = {
          messages: [],
          earlierMessagesLoadedBefore: false,
        }
        return previousValue
      },
      {}
    )

    if (activeUser) {
      this.setState({
        activeChannel: null,
        activeUser,
        isConnected: true,
        isConnecting: false,
        channels,
      })
    } else {
      const activeChannel = localStorage.getItem(
        this.persistentActiveChannelIdentifier
      )
        ? localStorage.getItem(this.persistentActiveChannelIdentifier)
        : Object.keys(channels)[0]

      fetch(`/api/channel/${activeChannel}/messages`, {
        credentials: 'include',
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(responseJson =>
          this.handleOnConnectFetchActiveChannelMessagesResponse(
            responseJson,
            channels
          )
        )
        .catch(error => {
          this.setState({
            showErrorSnackbar: true,
            errorSnackbarText: 'Error retrieving channels messages',
          })
        })
    }
  }

  handleOnConnectFetchActiveChannelMessagesResponse = (
    responseJson,
    channels
  ) => {
    const messages = responseJson.map(({ timestamp, user, text }) => ({
      date: timestamp,
      user,
      msg: text,
    }))

    const activeChannel = localStorage.getItem(
      this.persistentActiveChannelIdentifier
    )
      ? localStorage.getItem(this.persistentActiveChannelIdentifier)
      : Object.keys(channels)[0]

    this.setState({
      activeChannel,
      activeUser: null,
      isConnected: true,
      isConnecting: false,
      channels: {
        ...channels,
        [activeChannel]: {
          hasNewMessages: false,
          earlierMessagesLoadedBefore: true,
          messages: [...messages, ...channels[activeChannel].messages],
        },
      },
    })
  }

  _handleDisconnect = () => {
    this.setState({ isConnected: false })
  }

  _handleError = error => {
    if (error == 'Unauthorized') {
      this.props.history.push({
        pathname: '/',
        state: {
          message: 'Please sign in to enter the chat.',
        },
      })
    } else {
      this.setState({
        showErrorSnackbar: true,
        errorSnackbarText: `Temporary connection error: ${error}`,
      })
    }
  }

  _handleJoin = channel => {
    fetch(`/api/channel/${channel}/messages`, {
      credentials: 'include',
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(responseJson =>
        this.handleJoinedChannelMessages(responseJson, channel)
      )
      .catch(error =>
        this.setState({
          showErrorSnackbar: true,
          errorSnackbarText: 'Error retrieving channels messages',
        })
      )
  }

  handleJoinedChannelMessages = (responseJson, channel) => {
    const messages = responseJson.map(({ timestamp, user, text }) => ({
      date: timestamp,
      user,
      msg: text,
    }))

    this.setState(prevState => ({
      channels: {
        ...prevState.channels,
        [channel]: {
          hasNewMessages: false,
          earlierMessagesLoadedBefore: true,
          messages,
        },
      },
      activeChannel: channel,
      activeUser: null,
    }))

    this.setPersistentActiveChannel(channel)
  }

  _handleMsg = msg => {
    const channel = msg.room

    if (!this.state.channels[channel]) return

    const channels = JSON.parse(JSON.stringify(this.state.channels))

    channels[channel].messages = [...channels[channel].messages, msg]

    if (
      channel !== this.state.activeChannel &&
      msg.user !== this.state.loggedUser
    ) {
      channels[channel].hasNewMessages = true
    }

    this.setState({ channels })
  }

  _handleOnline = user => {
    const users = JSON.parse(JSON.stringify(this.state.users))

    if (users[user]) {
      users[user].online = true
    } else {
      users[user] = { online: true, messages: [] }
    }

    this.setState({ users })
  }

  _handleOffline = user => {
    const users = JSON.parse(JSON.stringify(this.state.users))

    users[user].online = false

    this.setState({ users })
  }

  _handlePrivateMsg = data => {
    const users = JSON.parse(JSON.stringify(this.state.users))

    const { from } = data

    const msg = {
      date: Date.now(),
      user: from,
      msg: data.msg,
    }

    if (users[from]) {
      users[from].messages = [...users[from].messages, msg]
    } else {
      users[from] = { messages: [msg] }
    }

    if (this.state.activeUser !== data.from) {
      users[from].hasNewMessages = true
    }

    this.setState({ users })
  }

  _handleOwnPrivateMsg = data => {
    const users = JSON.parse(JSON.stringify(this.state.users))

    const { msg, to } = data

    const msgData = {
      date: new Date().toISOString(),
      user: this.state.loggedUser,
      msg,
    }

    if (users[to]) {
      users[to].messages = [...users[to].messages, msgData]
    } else {
      users[to] = {
        messages: [msgData],
      }
    }

    this.setState({
      users,
    })
  }

  join = channelToJoin => {
    channelToJoin = channelToJoin.toLowerCase()

    if (this.state.channels[channelToJoin]) {
      this.setState({ activeChannel: channelToJoin, activeUser: null })
    } else {
      this.client.emit(events.join, channelToJoin)
    }

    this.setState({
      showDrawer: false,
      showJoinChannelDialog: false,
    })
  }

  leaveChannel = () => {
    this.client.emit(events.leave, this.state.activeChannel)
  }

  _handleLeave = channel => {
    const channels = dissoc(channel, this.state.channels)

    const channelNames = Object.keys(channels)

    if (channel == this.state.activeChannel) {
      this.setState({
        activeChannel: channelNames.length > 0 ? channelNames[0] : null,
        activeUser: channelNames.length === 0 ? this.state.loggedUser : null,
      })

      if (channelNames.length > 0) {
        localStorage.setItem(
          this.persistentActiveChannelIdentifier,
          channelNames[0]
        )
      } else {
        localStorage.removeItem(this.persistentActiveChannelIdentifier)
      }
    }

    this.setState({
      channels,
    })
  }

  sendMsg = msg => {
    const msgData = {
      date: new Date().toISOString(),
      user: this.state.loggedUser,
      msg,
    }

    if (this.state.activeChannel) {
      const channels = JSON.parse(JSON.stringify(this.state.channels))

      channels[this.state.activeChannel].messages = [
        ...channels[this.state.activeChannel].messages,
        msgData,
      ]

      this.setState({ channels })

      this.client.emit(events.msg, { room: this.state.activeChannel, msg })
    } else {
      const users = JSON.parse(JSON.stringify(this.state.users))

      users[this.state.activeUser].messages = [
        ...users[this.state.activeUser].messages,
        msgData,
      ]

      this.setState({ users })

      this.client.emit(events.privateMsg, { to: this.state.activeUser, msg })
    }
  }

  setActiveChannel = channel => {
    if (this.state.channels[channel].earlierMessagesLoadedBefore) {
      const channels = JSON.parse(JSON.stringify(this.state.channels))

      channels[channel].hasNewMessages = false

      this.setState({ channels })

      this.setState({
        activeChannel: channel,
        activeUser: null,
        showDrawer: false,
      })

      this.setPersistentActiveChannel(channel)
    } else {
      fetch(`/api/channel/${channel}/messages`, {
        credentials: 'include',
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
        .then(response => response.json())
        .then(responseJson =>
          this.handleActiveChannelMessages(responseJson, channel)
        )
        .catch(error => {
          this.setState({
            showErrorSnackbar: true,
            errorSnackbarText: 'Error retrieving channels messages',
          })
        })
    }
  }

  handleActiveChannelMessages = (responseJson, channel) => {
    const messages = responseJson.map(({ timestamp, user, text }) => ({
      date: timestamp,
      user,
      msg: text,
    }))

    const channels = JSON.parse(JSON.stringify(this.state.channels))

    channels[channel] = {
      hasNewMessages: false,
      earlierMessagesLoadedBefore: true,
      messages: [...messages, ...this.state.channels[channel].messages],
    }

    this.setState({
      channels,
      activeChannel: channel,
      activeUser: null,
      showDrawer: false,
    })

    this.setPersistentActiveChannel(channel)
  }

  setActiveUser = user => {
    const users = JSON.parse(JSON.stringify(this.state.users))

    if (users[user]) users[user].hasNewMessages = false

    this.setState({
      users,
      activeChannel: null,
      activeUser: user,
      showDrawer: false,
    })

    this.setPersistentActiveUser(user)
  }

  signOut = () =>
    fetch('/api/logout', {
      credentials: 'include',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
      .then(response => response.json())
      .then(this.handleSignOutResponse)
      .catch(error =>
        this.setState({
          showErrorSnackbar: true,
          errorSnackbarText: 'Unexpected error while trying to sign out',
        })
      )

  handleSignOutResponse = responseJson => {
    if (responseJson.success) {
      this.client.disconnect()

      this.removePersistentData()

      this.setState({ isDisconnectedByClient: true })

      this.props.history.push({
        pathname: '/',
        state: {
          message: 'You are now signed out.',
        },
      })
    } else {
      this.setState({
        showErrorSnackbar: true,
        errorSnackbarText: 'Unexpected error while trying to sign out',
      })
    }
  }

  setPersistentActiveChannel = channel => {
    localStorage.setItem(this.persistentActiveChannelIdentifier, channel)
    localStorage.removeItem(this.persistentActiveUserIdentifier)
  }

  setPersistentActiveUser = user => {
    localStorage.setItem(this.persistentActiveUserIdentifier, user)
    localStorage.removeItem(this.persistentActiveChannelIdentifier)
  }

  removePersistentData = () => {
    const itemsToRemove = [
      this.persistentActiveChannelIdentifier,
      this.persistentActiveUserIdentifier,
      this.persistentLoggedUserIdentifier,
    ]

    itemsToRemove.map(item => localStorage.removeItem(item))
  }

  handleErrorSnackbarRequestClose = () => {
    this.setState({
      showErrorSnackbar: false,
      errorSnackbarText: '',
    })
  }

  toggleDrawerInverted = () =>
    this.setState(prevState => ({ showDrawer: !this.state.showDrawer }))

  toggleDrawer = showDrawer => this.setState({ showDrawer })

  showJoinChannelDialog = () => this.setState({ showJoinChannelDialog: true })

  renderChat = () => {
    const appBarOrigin = { horizontal: 'right', vertical: 'top' }

    const { loggedUser, activeChannel, activeUser } = this.state

    let messages

    if (this.state.activeChannel) {
      messages = this.state.channels[this.state.activeChannel].messages
    } else {
      messages = this.state.users[this.state.activeUser]
        ? this.state.users[this.state.activeUser].messages
        : []
    }

    if (this.state.isConnecting) {
      return <AttentionDialog title='Connecting' text='Just a sec...' />
    } else if (this.state.isConnected) {
      return (
        <div>
          <Snackbar
            open={this.state.showErrorSnackbar}
            message={this.state.errorSnackbarText}
            autoHideDuration={4000}
            onRequestClose={this.handleErrorSnackbarRequestClose}
          />
          {this.state.showJoinChannelDialog && (
            <JoinChannelDialog join={this.join} />
          )}
          <Drawer
            docked={false}
            open={this.state.showDrawer}
            onRequestChange={this.toggleDrawer}
          >
            <div style={{ padding: '10' }}>
              <UserProfile loggedUser={loggedUser} />
              <ChannelList
                showJoinChannelDialog={this.showJoinChannelDialog}
                activeChannel={activeChannel}
                setActiveChannel={this.setActiveChannel}
                channels={this.state.channels}
              />
              <UserList
                title='Users'
                loggedUser={loggedUser}
                activeUser={activeUser}
                setActiveUser={this.setActiveUser}
                users={this.state.users}
              />
            </div>
          </Drawer>

          <div className='chat-wrapper'>
            <AppBar
              title={
                activeChannel
                  ? `# ${activeChannel}`
                  : `${activeUser}${activeUser === loggedUser ? ' (you)' : ''}`
              }
              iconElementRight={
                <IconMenu
                  iconButtonElement={
                    <IconButton>
                      <MoreVertIcon />
                    </IconButton>
                  }
                  targetOrigin={appBarOrigin}
                  anchorOrigin={appBarOrigin}
                >
                  {activeChannel && (
                    <MenuItem
                      primaryText={`Leave # ${activeChannel}`}
                      onClick={this.leaveChannel}
                    />
                  )}
                  <MenuItem primaryText='Sign out' onClick={this.signOut} />
                </IconMenu>
              }
              onLeftIconButtonClick={this.toggleDrawerInverted}
            />
            <MessageList messages={messages} />
            <ChatInput sendMsg={this.sendMsg} />
          </div>
        </div>
      )
    } else if (this.state.isDisconnectedByClient) {
      return (
        <AttentionDialog
          title='Disconnected by client'
          text='You are now disconnected.'
        />
      )
    }
    return (
      <AttentionDialog
        title='Connection lost'
        text='You will be reconnected automatically if the chat server responds.'
      />
    )
  }

  render () {
    return <div className='App'>{this.renderChat()}</div>
  }
}

export default withRouter(withCookies(App))
