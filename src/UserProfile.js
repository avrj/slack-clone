import React from 'react';
import Person from 'material-ui/svg-icons/social/person';

const UserProfile = ({ loggedUser }) => (<div className="Padding1">
  <Person className="VerticalAlignMiddle" /> {loggedUser}
</div>);

UserProfile.propTypes = {
  loggedUser: React.PropTypes.string.isRequired,
};

export default UserProfile;
