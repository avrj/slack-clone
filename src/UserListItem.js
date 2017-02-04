import React from 'react';
import classNames from 'classnames';
import MenuItem from 'material-ui/MenuItem';
import PersonOutline from 'material-ui/svg-icons/social/person-outline';
import FontIcon from 'material-ui/FontIcon';
import { green500 } from 'material-ui/styles/colors';

const UserListItem = ({ active, hasNewMessages, onTouchTap, online, user }) => (<MenuItem
  className={classNames({
    MenuItemActive: active,
    HasNewMessages: hasNewMessages,
  })}
  onTouchTap={onTouchTap}
>{online ? <FontIcon className={classNames('material-icons', 'VerticalAlignMiddle')} color={green500}>person</FontIcon> : <PersonOutline className="VerticalAlignMiddle" />} {user}</MenuItem>);

UserListItem.propTypes = {
  onTouchTap: React.PropTypes.func.isRequired,
  user: React.PropTypes.string.isRequired,
  active: React.PropTypes.bool,
  online: React.PropTypes.bool,
  hasNewMessages: React.PropTypes.bool,
};

UserListItem.defaultProps = {
  hasNewMessages: false,
  online: false,
  active: false,
};

export default UserListItem;
