import React, { Component } from 'react';
import io from 'socket.io-client';
import { browserHistory } from 'react-router';
import cookie from 'react-cookie';
import Drawer from 'material-ui/Drawer';
import AppBar from 'material-ui/AppBar';
import IconMenu from 'material-ui/IconMenu';
import IconButton from 'material-ui/IconButton';
import MenuItem from 'material-ui/MenuItem';
import Snackbar from 'material-ui/Snackbar';
import MoreVertIcon from 'material-ui/svg-icons/navigation/more-vert';
import events from '../events';
import './App.css';
import ChatInput from './ChatInput';
import ChannelList from './ChannelList';
import UserList from './UserList';
import JoinChannelDialog from './JoinChannelDialog';
import AttentionDialog from './AttentionDialog';
import UserProfile from './UserProfile';
import MessageList from './MessageList';

class App extends Component {
  constructor() {
    super();

    this.initialState = {
      users: {},
      channels: {},
      activeChannel: null,
      activeUser: null,
      loggedUser: null,
      showDrawer: false,
      drawerDocked: false,
      connecting: true,
      connected: false,
      disconnectedByClient: false,
      showErrorSnackbar: false,
      errorSnackbarText: '',
    };

    this.persistentActiveChannelIdentifier = 'activeChannel';
    this.persistentActiveUserIdentifier = 'activeUser';
    this.persistentLoggedUserIdentifier = 'loggedUser';

    this.state = this.initialState;

    let authCookie = cookie.load('express.sid');

    authCookie = authCookie.split(':')[1];
    authCookie = authCookie.split('.')[0];

    this.client = io.connect(`//${window.location.host}`, { query: `session_id=${authCookie}` });

    this.client.on(events.connect, this._handleConnect);
    this.client.on(events.disconnect, this._handleDisconnect);
    this.client.on(events.error, this._handleError);
    this.client.on(events.online, this._handleOnline);
    this.client.on(events.offline, this._handleOffline);
    this.client.on(events.join, this._handleJoin);
    this.client.on(events.leave, this._handleLeave);
    this.client.on(events.msg, this._handleMsg);
    this.client.on(events.privateMsg, this._handlePrivateMsg);
    this.client.on(events.ownPrivateMsg, this._handleOwnPrivateMsg);
  }

  _handleConnect = () => {
    fetch('/api/users',
      {
        credentials: 'include',
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
            .then(response => response.json())
            .then(this.handleOnConnectFetchUsersResponse)
            .catch((error) => {
              this.setState({ showErrorSnackbar: true, errorSnackbarText: 'Error retrieving users' });
            });
  }

  handleOnConnectFetchUsersResponse = (responseJson) => {
    if (!localStorage.getItem(this.persistentLoggedUserIdentifier)) {
      localStorage.setItem(this.persistentLoggedUserIdentifier, this.props.location.state.username);
    }

    const users = {};

    for (let i = 0; i < responseJson.length; i++) {
      users[responseJson[i].local.username] = { online: responseJson[i].local.online, messages: [] };
    }

    this.setState({ users });

    fetch('/api/user/channels',
      {
        credentials: 'include',
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
            .then(response => response.json())
            .then(this.handleOnConnectFetchUserChannelsResponse)
            .catch((error) => {
              this.setState({ showErrorSnackbar: true, errorSnackbarText: 'Error retrieving user\'s channels' });
            });
  }

  handleOnConnectFetchUserChannelsResponse = (responseJson) => {
    const channels = {};

    for (let i = 0; i < responseJson.local.channels.length; i++) {
      channels[responseJson.local.channels[i]] = {
        messages: [],
        earlierMessagesLoadedBefore: false,
      };
    }

    const loggedUser = localStorage.getItem(this.persistentLoggedUserIdentifier);

    this.setState({ loggedUser });

    const activeUser = localStorage.getItem(this.persistentActiveUserIdentifier);

    if (activeUser) {
      this.setState({
        activeChannel: null,
        activeUser,
        connected: true,
        connecting: false,
        channels,
      });
    } else {
      const activeChannel = localStorage.getItem(this.persistentActiveChannelIdentifier) ? localStorage.getItem(this.persistentActiveChannelIdentifier) : Object.keys(channels)[0];

      fetch(`/api/channel/${activeChannel}/messages`,
        {
          credentials: 'include',
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        })
                .then(response => response.json())
                .then(responseJson => this.handleOnConnectFetchActiveChannelMessagesResponse(responseJson, channels))
                .catch((error) => {
                  this.setState({ showErrorSnackbar: true, errorSnackbarText: 'Error retrieving channels messages' });
                });
    }
  };

  handleOnConnectFetchActiveChannelMessagesResponse = (responseJson, channels) => {
    const messages = [];

    for (let i = 0; i < responseJson.length; i++) {
      messages.push({
        date: responseJson[i].timestamp,
        user: responseJson[i].user,
        msg: responseJson[i].text,
      });
    }

    const activeChannel = localStorage.getItem(this.persistentActiveChannelIdentifier) ? localStorage.getItem(this.persistentActiveChannelIdentifier) : Object.keys(channels)[0];

    channels[activeChannel] = {
      hasNewMessages: false,
      earlierMessagesLoadedBefore: true,
      messages: messages.concat(channels[activeChannel].messages),
    };

    this.setState({
      activeChannel,
      activeUser: null,
      connected: true,
      connecting: false,
      channels,
    });
  }

  _handleDisconnect = () => {
    this.setState({ connected: false });
  }

  _handleError = (error) => {
    if (error == 'Unauthorized') {
      browserHistory.push({
        pathname: '/',
        state: {
          message: 'Please sign in to enter the chat.',
        },
      });
    } else {
      this.setState({ showErrorSnackbar: true, errorSnackbarText: `Temporary connection error: ${error}` });
    }
  }

  _handleJoin = (channel) => {
    fetch(`/api/channel/${channel}/messages`,
      {
        credentials: 'include',
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      })
            .then(response => response.json())
            .then(responseJson => this.handleJoinedChannelMessages(responseJson, channel))
            .catch(error => this.setState({ showErrorSnackbar: true, errorSnackbarText: 'Error retrieving channels messages' }));
  };

  handleJoinedChannelMessages = (responseJson, channel) => {
    const messages = [];

    for (let i = 0; i < responseJson.length; i++) {
      messages.push({
        date: responseJson[i].timestamp,
        user: responseJson[i].user,
        msg: responseJson[i].text,
      });
    }

    const channels = JSON.parse(JSON.stringify(this.state.channels));

    channels[channel] = {
      hasNewMessages: false,
      earlierMessagesLoadedBefore: true,
      messages,
    };

    this.setState({
      channels,
      activeChannel: channel,
      activeUser: null,
    });

    this.setPersistentActiveChannel(channel);
  };

  _handleMsg = (msg) => {
    const channel = msg.room;

    if (!this.state.channels[channel]) return;

    const channels = JSON.parse(JSON.stringify(this.state.channels));

    const messages = channels[channel].messages;

    messages.push(msg);

    channels[channel].messages = messages;

    if (channel !== this.state.activeChannel && msg.user !== this.state.loggedUser) {
      channels[channel].hasNewMessages = true;
    }

    this.setState({ channels });
  };

  _handleOnline = (user) => {
    const users = JSON.parse(JSON.stringify(this.state.users));

    if (users[user]) {
      users[user].online = true;
    } else {
      users[user] = { online: true, messages: [] };
    }

    this.setState({ users });
  };

  _handleOffline = (user) => {
    const users = JSON.parse(JSON.stringify(this.state.users));

    users[user].online = false;

    this.setState({ users });
  }

  _handlePrivateMsg = (data) => {
    const users = JSON.parse(JSON.stringify(this.state.users));

    const { from } = data;

    const msg = {
      date: Date.now(),
      user: from,
      msg: data.msg,
    };

    if (users[from]) {
      const messages = users[from].messages;

      messages.push(msg);

      users[from].messages = messages;
    } else {
      users[from] = { messages: [msg] };
    }

    if (this.state.activeUser !== data.from) {
      users[from].hasNewMessages = true;
    }

    this.setState({ users });
  };

  _handleOwnPrivateMsg = (data) => {
    const users = JSON.parse(JSON.stringify(this.state.users));

    const { msg, to } = data;

    if (users[to]) {
      const messages = users[to].messages;

      messages.push({
        date: new Date().toISOString(),
        user: this.state.loggedUser,
        msg,
      });

      users[to].messages = messages;
    } else {
      users[to] = {
        messages: [
          {
            date: new Date().toISOString(),
            user: this.state.loggedUser,
            msg,
          },
        ],
      };
    }

    this.setState({
      users,
    });
  };

  join = (channelToJoin) => {
    channelToJoin = channelToJoin.toLowerCase();

    if (this.state.channels[channelToJoin]) {
      this.setState({ activeChannel: channelToJoin, activeUser: null });
    } else {
      this.client.emit('join', channelToJoin);
    }

    this.setState({
      showDrawer: false,
      showJoinChannelDialog: false,
    });
  }

  leaveChannel = () => {
    this.client.emit('leave', this.state.activeChannel);
  }

  _handleLeave = (channel) => {
    const channels = JSON.parse(JSON.stringify(this.state.channels));

    delete channels[channel];

    const channelNames = Object.keys(channels);

    if (channel == this.state.activeChannel) {
      this.setState({
        activeChannel: channelNames.length > 0 ? channelNames[0] : null,
        activeUser: channelNames.length === 0 ? this.state.loggedUser : null,
      });

      if (channelNames.length > 0) {
        localStorage.setItem(this.persistentActiveChannelIdentifier, channelNames[0]);
      } else {
        localStorage.removeItem(this.persistentActiveChannelIdentifier);
      }
    }

    this.setState({
      channels,
    });
  }

  sendMsg = (msg) => {
    if (this.state.activeChannel) {
      const channels = JSON.parse(JSON.stringify(this.state.channels));

      const messages = channels[this.state.activeChannel].messages;

      const msgData = {
        date: new Date().toISOString(),
        user: this.state.loggedUser,
        msg,
      };

      messages.push(msgData);

      channels[this.state.activeChannel].messages = messages;

      this.setState({ channels });


      this.client.emit(events.msg, { room: this.state.activeChannel, msg });
    } else {
      const msgData = {
        date: new Date().toISOString(),
        user: this.state.loggedUser,
        msg,
      };

      const users = JSON.parse(JSON.stringify(this.state.users));

      const messages = users[this.state.activeUser].messages;

      messages.push(msgData);

      users[this.state.activeUser].messages = messages;

      this.setState({ users });

      this.client.emit(events.privateMsg, { to: this.state.activeUser, msg });
    }
  }

  setActiveChannel = (channel) => {
    if (this.state.channels[channel].earlierMessagesLoadedBefore) {
      const channels = JSON.parse(JSON.stringify(this.state.channels));

      channels[channel].hasNewMessages = false;

      this.setState({ channels });


      this.setState({
        activeChannel: channel,
        activeUser: null,
        showDrawer: false,
      });

      this.setPersistentActiveChannel(channel);
    } else {
      fetch(`/api/channel/${channel}/messages`,
        {
          credentials: 'include',
          method: 'GET',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
          },
        })
                .then(response => response.json())
                .then(responseJson => this.handleActiveChannelMessages(responseJson, channel))
                .catch((error) => {
                  this.setState({ showErrorSnackbar: true, errorSnackbarText: 'Error retrieving channels messages' });
                });
    }
  }

  handleActiveChannelMessages = (responseJson, channel) => {
    const messages = [];

    for (let i = 0; i < responseJson.length; i++) {
      messages.push({
        date: responseJson[i].timestamp,
        user: responseJson[i].user,
        msg: responseJson[i].text,
      });
    }

    const channels = JSON.parse(JSON.stringify(this.state.channels));

    channels[channel] = {
      hasNewMessages: false,
      earlierMessagesLoadedBefore: true,
      messages: messages.concat(this.state.channels[channel].messages),
    };

    this.setState({
      channels,
      activeChannel: channel,
      activeUser: null,
      showDrawer: false,
    });

    this.setPersistentActiveChannel(channel);
  };

  setActiveUser = (user) => {
    const users = JSON.parse(JSON.stringify(this.state.users));

    if (users[user]) users[user].hasNewMessages = false;

    this.setState({
      users,
      activeChannel: null,
      activeUser: user,
      showDrawer: false,
    });

    this.setPersistentActiveUser(user);
  }

  signOut = () => fetch('/api/logout',
    {
      credentials: 'include',
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
    })
        .then(response => response.json())
        .then(this.handleSignOutResponse)
        .catch(error => this.setState({ showErrorSnackbar: true, errorSnackbarText: 'Unexpected error while trying to sign out' }));

  handleSignOutResponse = (responseJson) => {
    if (responseJson.success) {
      this.client.disconnect();

      this.removePersistentData();

      this.setState(Object.assign({}, this.initialState, { disconnectedByClient: true }));

      browserHistory.push({
        pathname: '/',
        state: {
          message: 'You are now signed out.',
        },
      });
    } else {
      this.setState({ showErrorSnackbar: true, errorSnackbarText: 'Unexpected error while trying to sign out' });
    }
  };

  setPersistentActiveChannel = (channel) => {
    localStorage.setItem(this.persistentActiveChannelIdentifier, channel);
    localStorage.removeItem(this.persistentActiveUserIdentifier);
  };

  setPersistentActiveUser = (user) => {
    localStorage.setItem(this.persistentActiveUserIdentifier, user);
    localStorage.removeItem(this.persistentActiveChannelIdentifier);
  };

  removePersistentData = () => {
    const itemsToRemove = [this.persistentActiveChannelIdentifier, this.persistentActiveUserIdentifier, this.persistentLoggedUserIdentifier];

    itemsToRemove.map(item => localStorage.removeItem(item));
  };


  handleErrorSnackbarRequestClose = () => {
    this.setState({
      showErrorSnackbar: false,
      errorSnackbarText: '',
    });
  };

  renderChat = () => {
    const { loggedUser, activeChannel, activeUser } = this.state;

    let messages;

    if (this.state.activeChannel) {
      messages = this.state.channels[this.state.activeChannel].messages;
    } else {
      messages = this.state.users[this.state.activeUser] ? this.state.users[this.state.activeUser].messages : [];
    }

    if (this.state.connecting) {
      return (<AttentionDialog title="Connecting" text="Just a sec..." />);
    } else if (this.state.connected) {
      return (
        <div>
          <Snackbar
            open={this.state.showErrorSnackbar}
            message={this.state.errorSnackbarText}
            autoHideDuration={4000}
            onRequestClose={this.handleErrorSnackbarRequestClose}
          />
          {this.state.showJoinChannelDialog && <JoinChannelDialog join={this.join} />}
          <Drawer
            docked={false}
            open={this.state.showDrawer}
            onRequestChange={showDrawer => this.setState({ showDrawer })}
          >
            <div style={{ padding: '10' }}>
              <UserProfile loggedUser={loggedUser} />
              <ChannelList
                showJoinChannelDialog={() => this.setState({ showJoinChannelDialog: true })}
                activeChannel={activeChannel}
                setActiveChannel={channel => this.setActiveChannel(channel)}
                channels={this.state.channels}
              />
              <UserList
                title="Users"
                loggedUser={loggedUser}
                activeUser={activeUser}
                setActiveUser={user => this.setActiveUser(user)}
                users={this.state.users}
              />
            </div>
          </Drawer>

          <div className="chat-wrapper">
            <AppBar
              title={activeChannel ? `# ${activeChannel}` : `${activeUser}${activeUser === loggedUser ? ' (you)' : ''}`}
              iconElementRight={
                <IconMenu
                  iconButtonElement={
                    <IconButton><MoreVertIcon /></IconButton>
                                    }
                  targetOrigin={{ horizontal: 'right', vertical: 'top' }}
                  anchorOrigin={{ horizontal: 'right', vertical: 'top' }}
                >
                  {activeChannel &&
                    <MenuItem primaryText={`Leave # ${activeChannel}`} onTouchTap={this.leaveChannel} />}
                  <MenuItem primaryText="Sign out" onTouchTap={this.signOut} />
                </IconMenu>}
              onLeftIconButtonTouchTap={() => this.setState({ showDrawer: !this.state.showDrawer })}
            />
            <MessageList messages={messages} />
            <ChatInput sendMsg={this.sendMsg} />
          </div>
        </div>
      );
    } else if (this.state.disconnectedByClient) {
      return (<AttentionDialog
        title="Disconnected by client"
        text="You are now disconnected."
      />);
    }
    return (
      <AttentionDialog
        title="Connection lost"
        text="You will be reconnected automatically if the chat server responds."
      />);
  }


  render() {
    return (
      <div className="App">
        {this.renderChat()}
      </div>
    );
  }
}

export default App;
