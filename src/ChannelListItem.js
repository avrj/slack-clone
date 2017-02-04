import React from 'react';
import classNames from 'classnames';
import MenuItem from 'material-ui/MenuItem';

const ChannelListItem = ({ active, hasNewMessages, onTouchTap, title }) => (<MenuItem
  className={classNames({
    MenuItemActive: active,
    HasNewMessages: hasNewMessages,
  })}
  onTouchTap={onTouchTap}
># {title}</MenuItem>);

ChannelListItem.propTypes = {
  onTouchTap: React.PropTypes.func.isRequired,
  title: React.PropTypes.string.isRequired,
  active: React.PropTypes.bool,
  hasNewMessages: React.PropTypes.bool,
};

ChannelListItem.defaultProps = {
  active: false,
  hasNewMessages: false,
};

export default ChannelListItem;
