import React from 'react'
import Person from 'material-ui/svg-icons/social/person'
import { string } from 'prop-types'

const UserProfile = ({ loggedUser }) => (
  <div className='Padding1'>
    <Person className='VerticalAlignMiddle' /> {loggedUser}
  </div>
)

UserProfile.propTypes = {
  loggedUser: string.isRequired,
}

export default UserProfile
