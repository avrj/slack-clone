import React, { Component } from 'react';
import UserListItem from './UserListItem';

class UserList extends Component {
  render() {
    const renderListItems = () => {
      const { users } = this.props;

      return Object.keys(users).map((user) => {
        const you = user === this.props.loggedUser ? ' (you)' : '';

        return (<UserListItem
          active={this.props.activeUser === user}
          online={users[user].online}
          hasNewMessages={users[user].hasNewMessages}
          key={user}
          onTouchTap={() => this.props.setActiveUser(user)}
          user={user + you}
        />);
      });
    };

    return (
      <div>
        <div className="DrawerListTitle">{this.props.title}</div>

        <div>
          {renderListItems()}
        </div>
      </div>
    );
  }
}

UserList.propTypes = {
  title: React.PropTypes.string.isRequired,
  activeUser: React.PropTypes.string,
  loggedUser: React.PropTypes.string.isRequired,
  users: React.PropTypes.object.isRequired,
  setActiveUser: React.PropTypes.func.isRequired,
};

UserList.defaultProps = {
  activeUser: null,
};

export default UserList;
