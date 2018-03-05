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
import UserProfile from './UserProfile'
import MessageList from './MessageList'
import ErrorHandler from './ErrorHandler'
import { shape, string } from 'prop-types'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { actions } from './redux/reducers/user'

const parseSessionId = authCookie => authCookie.split(':')[1].split('.')[0]

const dissoc = (prop, obj) => {
  const result = {}

  for (var p in obj) {
    result[p] = obj[p]
  }

  delete result[prop]

  return result
}

const API_ENDPOINT = '/api'

class App extends Component {
  constructor (props) {
    super(props)

    this.state = {
      users: {},
      channels: {},
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
      { event: events.connect, handler: this.onConnect },
      { event: events.disconnect, handler: this.onDisconnect },
      { event: events.error, handler: this.onError },
      { event: events.online, handler: this.onUserOnline },
      { event: events.offline, handler: this.onUserOffline },
      { event: events.join, handler: this.onJoinChannel },
      { event: events.leave, handler: this.onLeaveChannel },
      { event: events.msg, handler: this.onMsgReceived },
      { event: events.privateMsg, handler: this.onPrivateMsgReceived },
      { event: events.ownPrivateMsg, handler: this.onOwnPrivateMsgReceived },
    ]

    eventHandlers.map(({ event, handler }) => this.client.on(event, handler))
  }

  getUsers = async () => {
    try {
      const response = await fetch(API_ENDPOINT + '/users', {
        credentials: 'include',
      })
      return response.json()
    } catch (error) {
      this.setState({
        showErrorSnackbar: true,
        errorSnackbarText: 'Error retrieving users',
      })
    }
  }

  getChannels = async () => {
    try {
      const response = await fetch(API_ENDPOINT + '/user/channels', {
        credentials: 'include',
      })
      return response.json()
    } catch (error) {
      this.setState({
        showErrorSnackbar: true,
        errorSnackbarText: 'Error retrieving channels',
      })
    }
  }

  getChannelsMessages = async channel => {
    try {
      const response = await fetch(
        API_ENDPOINT + `/channel/${channel}/messages`,
        {
          credentials: 'include',
        }
      )
      return response.json()
    } catch (error) {
      this.setState({
        showErrorSnackbar: true,
        errorSnackbarText: 'Error retrieving channels messages',
      })
    }
  }

  onConnect = async () => {
    const users = await this.getUsers()

    this.handleOnConnectFetchUsersResponse(users)

    const channels = await this.getChannels()

    this.handleOnConnectFetchUserChannelsResponse(channels)
  }

  handleOnConnectFetchUsersResponse = async responseJson => {
    !this.props.user && this.props.setUser(this.props.location.state.username)

    const users = responseJson.reduce((previousValue, currentValue) => {
      previousValue[currentValue.local.username] = {
        online: currentValue.local.online,
        messages: [],
      }
      return previousValue
    }, {})

    this.setState({ users })
  }

  handleOnConnectFetchUserChannelsResponse = async responseJson => {
    const loggedUser = this.props.user

    this.setState({ loggedUser })

    const activeUser = this.props.activeUser

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
      const activeChannel = this.props.activeChannel
        ? this.props.activeChannel
        : Object.keys(channels)[0]

      const activeChannelsMsgs = await this.getChannelsMessages(activeChannel)

      this.handleOnConnectFetchActiveChannelMessagesResponse(
        activeChannelsMsgs,
        channels
      )
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

    const activeChannel = this.props.activeChannel
      ? this.props.activeChannel
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

  onDisconnect = () => {
    this.setState({ isConnected: false })
  }

  onError = error => {
    if (error === 'Unauthorized') {
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

  onJoinChannel = async channel => {
    const messages = await this.getChannelsMessages(channel)

    const messagesTransformed = messages.map(({ timestamp, user, text }) => ({
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
          messagesTransformed,
        },
      },
      activeChannel: channel,
      activeUser: null,
    }))

    this.setActiveChannel(channel)
  }

  onMsgReceived = msg => {
    const channel = msg.room

    const channelExists = channel => this.state.channels[channel]

    if (!channelExists(channel)) return

    const channels = JSON.parse(JSON.stringify(this.state.channels))

    channels[channel].messages = [...channels[channel].messages, msg]

    if (channel !== this.props.activeChannel && msg.user !== this.props.user) {
      channels[channel].hasNewMessages = true
    }

    this.setState({ channels })
  }

  onUserOnline = user => {
    const users = JSON.parse(JSON.stringify(this.state.users))

    if (users[user]) {
      users[user].online = true
    } else {
      users[user] = { online: true, messages: [] }
    }

    this.setState({ users })
  }

  onUserOffline = user => {
    this.setState(({ users }) => ({
      users: { ...users, [user]: { ...users[user], online: false } },
    }))
  }

  onPrivateMsgReceived = data => {
    const { from } = data

    const msg = {
      date: Date.now(),
      user: from,
      msg: data.msg,
    }

    this.setState(({ users, activeUser }) => ({
      users: {
        ...users,
        [from]: {
          ...users[from],
          hasNewMessages:
            this.props.activeUser !== from ? true : users[from].hasNewMessages,
          messages: users[from] ? [...users[from].messages, msg] : [msg],
        },
      },
    }))
  }

  onOwnPrivateMsgReceived = data => {
    const { msg, to } = data

    const msgData = {
      date: new Date().toISOString(),
      user: this.props.user,
      msg,
    }

    this.setState(({ users }) => ({
      users: {
        ...users,
        [to]: {
          ...users[to],
          messages: users[to] ? [...users[to].messages, msgData] : [msgData],
        },
      },
    }))
  }

  join = channelToJoin => {
    const channel = channelToJoin.toLowerCase()

    const channelExists = channel => this.state.channels[channel]

    if (channelExists(channel)) {
      this.setState({ activeChannel: channel, activeUser: null })
    } else {
      this.client.emit(events.join, channel)
    }

    this.setState({
      showDrawer: false,
      showJoinChannelDialog: false,
    })
  }

  leaveChannel = () => {
    this.client.emit(events.leave, this.props.activeChannel)
  }

  onLeaveChannel = channel => {
    const channels = dissoc(channel, this.state.channels)

    const channelNames = Object.keys(channels)

    if (channel === this.props.activeChannel) {
      this.setState({
        activeChannel: channelNames.length > 0 ? channelNames[0] : null,
        activeUser: channelNames.length === 0 ? this.props.user : null,
      })

      if (channelNames.length > 0) {
        this.props.setActiveChannel(channelNames[0])
      } else {
        this.props.setActiveChannel(null)
      }
    }

    this.setState({
      channels,
    })
  }

  sendMsg = msg => {
    const msgData = {
      date: new Date().toISOString(),
      user: this.props.user,
      msg,
    }

    if (this.props.activeChannel) {
      this.setState(({ channels, activeChannel }) => ({
        channels: {
          ...channels,
          [activeChannel]: {
            ...channels[activeChannel],
            messages: [...channels[activeChannel].messages, msgData],
          },
        },
      }))

      this.client.emit(events.msg, { room: this.props.activeChannel, msg })
    } else {
      this.setState(({ users, activeUser }) => ({
        users: {
          ...users,
          [activeUser]: {
            ...users[activeUser],
            messages: [...users[activeUser].messages, msgData],
          },
        },
      }))

      this.client.emit(events.privateMsg, { to: this.props.activeUser, msg })
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

      this.setActiveChannel(channel)
    } else {
      fetch(`/api/channel/${channel}/messages`, {
        credentials: 'include',
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

    this.setActiveChannel(channel)
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

    this.setActiveUser(user)
  }

  signOut = () =>
    fetch('/api/logout', {
      credentials: 'include',
      method: 'POST',
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

  setActiveChannel = channel => {
    this.props.setActiveChannel(channel)
  }

  setActiveUser = user => {
    this.props.setActiveUser(user)
  }

  removePersistentData = () => {
    this.props.removeUserData()
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

    const { users, channels, user, activeChannel, activeUser } = this.props

    let messages

    if (activeChannel) {
      messages = channels[activeChannel].messages
    } else {
      messages = users[activeUser] ? users[activeUser].messages : []
    }

    const appBarTitle = activeChannel
      ? `# ${activeChannel}`
      : `${activeUser}${activeUser === user ? ' (you)' : ''}`

    return (
      <ErrorHandler
        isConnecting={this.state.isConnecting}
        isConnected={this.state.isConnected}
        isDisconnectedByClient={this.state.isDisconnectedByClient}
      >
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
            <UserProfile loggedUser={user} />
            <ChannelList
              showJoinChannelDialog={this.showJoinChannelDialog}
              activeChannel={activeChannel}
              setActiveChannel={this.setActiveChannel}
              channels={channels}
            />
            <UserList
              title='Users'
              loggedUser={user}
              activeUser={activeUser}
              setActiveUser={this.setActiveUser}
              users={users}
            />
          </div>
        </Drawer>

        <div className='chat-wrapper'>
          <AppBar
            title={appBarTitle}
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
      </ErrorHandler>
    )
  }

  render () {
    return this.props.channels && this.props.users ? (
      <div className='App'>{this.renderChat()}</div>
    ) : (
      <div>Loading...</div>
    )
  }
}

App.propTypes = {
  location: shape({
    state: shape({
      username: string.isRequired,
    }).isRequired,
  }).isRequired,
}

const mapStateToProps = ({ users, channels, user }) => {
  return {
    users: users.users,
    channels: channels.channels,
    user: user.user,
    activeUser: user.activeUser,
    activeChannel: user.activeChannel,
  }
}

const mapDispatchToProps = dispatch => ({
  ...bindActionCreators(actions, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(
  withRouter(withCookies(App))
)
