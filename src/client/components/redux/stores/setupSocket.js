import { actions as usersActions } from '../reducers/users'
import { actions as channelsActions } from '../reducers/channels'
import io from 'socket.io-client'

const setupSocket = (dispatch, sessionId) => {
  const socket = io.connect(`//${window.location.host}`, {
    query: `session_id=${sessionId}`,
  })

  socket.on('connect', async () => {
    dispatch(usersActions.fetchUsers())
    dispatch(channelsActions.fetchChannels())
  })

  return socket
}

export default setupSocket
