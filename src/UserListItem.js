import React, { Component } from 'react';
import classNames from 'classnames';
import MenuItem from 'material-ui/MenuItem';
import PersonOutline from 'material-ui/svg-icons/social/person-outline';
import FontIcon from 'material-ui/FontIcon';
import { green500 } from 'material-ui/styles/colors';

class UserListItem extends Component {
  render() {
    return (<MenuItem
      className={classNames({
        MenuItemActive: this.props.active,
        HasNewMessages: this.props.hasNewMessages,
      })}
      onTouchTap={this.props.onTouchTap}
    >{this.props.online ? <FontIcon className={classNames('material-icons', 'VerticalAlignMiddle')} color={green500}>person</FontIcon> : <PersonOutline className="VerticalAlignMiddle" />} {this.props.user}</MenuItem>);
  }
}

UserListItem.propTypes = {
  onTouchTap: React.PropTypes.func.isRequired,
  user: React.PropTypes.string.isRequired,
  active: React.PropTypes.bool,
  online: React.PropTypes.bool,
  hasNewMessages: React.PropTypes.bool,
};

export default UserListItem;
