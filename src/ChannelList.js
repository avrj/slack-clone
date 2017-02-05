import React from 'react';
import AddCircle from 'material-ui/svg-icons/content/add-circle';
import IconButton from 'material-ui/IconButton';

import ChannelListItem from './ChannelListItem';

const ChannelList = ({ channels, activeChannel, setActiveChannel, showJoinChannelDialog }) => {
  const renderMenuItems = () => Object.keys(channels).map((key) => {
    const channel = channels[key];

    return (<ChannelListItem
      active={activeChannel === key}
      hasNewMessages={channel.hasNewMessages}
      key={key}
      onTouchTap={() => setActiveChannel(key)}
      title={key}
    />);
  });

  return (
    <div>
      <div className="DrawerListTitle">Channels <IconButton
        className="VerticalAlignMiddle"
        tooltip="Join channel"
        onTouchTap={showJoinChannelDialog}
      ><AddCircle /></IconButton></div>

      <div>
        {renderMenuItems()}
      </div>
    </div>
  );
};

ChannelList.propTypes = {
  activeChannel: React.PropTypes.string,
  channels: React.PropTypes.object.isRequired,
  setActiveChannel: React.PropTypes.func.isRequired,
  showJoinChannelDialog: React.PropTypes.func.isRequired,
};

ChannelList.defaultProps = {
  activeChannel: null,
};

export default ChannelList;
