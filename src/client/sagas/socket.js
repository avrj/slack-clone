import { eventChannel } from 'redux-saga'
import { fork, take, call, put, cancel } from 'redux-saga/effects'
import { actions as usersActions } from '../reducers/users'
import { actions as userActions } from '../reducers/user'
import { actions as channelsActions } from '../reducers/channels'
import { actions as appActions, types as appTypes } from '../reducers/app'
import io from 'socket.io-client'
import events from '../../common/events'

function connect (sessionId) {
  const socket = io.connect(`//${window.location.host}`, {
    query: `session_id=${sessionId}`,
  })

  return new Promise(resolve => {
    socket.on('connect', () => {
      resolve(socket)
    })
  })
}

function subscribe (socket) {
  return eventChannel(emit => {
    socket.on(events.disconnect, () => emit(appActions.disconnect()))
    socket.on(events.online, user => emit(usersActions.setUserOnline(user)))
    socket.on(events.offline, user => emit(usersActions.setUserOffline(user)))
    socket.on(events.leave, channel =>
      emit(channelsActions.leaveChannel(channel))
    ) // TODO: missing conditional
    socket.on(events.error, error => emit(appActions.onError(error)))
    socket.on(events.join, channel =>
      emit(channelsActions.joinChannelRequest(channel))
    )
    socket.on(events.msg, msg => {
      const channel = msg.room
      emit(channelsActions.msg(msg, channel))
    }) // TODO: missing conditional
    socket.on(events.privateMsg, data => {
      const { from } = data

      const msg = {
        date: Date.now(),
        user: from,
        msg: data.msg,
      }
      emit(usersActions.privateMsg(msg, from))
    }) // TODO: missing conditional
    socket.on(events.ownPrivateMsg, data => {
      const { msg, to } = data

      const msgData = {
        date: new Date().toISOString(),
        user: this.props.user,
        msg,
      }

      emit(usersActions.ownPrivateMsg(msgData, to))
    })

    return () => {}
  })
}

function * read (socket) {
  const channel = yield call(subscribe, socket)

  while (true) {
    let action = yield take(channel)

    yield put(action)
  }
}

function * write (socket) {
  while (true) {
    const { event, data } = yield take(appTypes.EMIT)
    socket.emit(event, data)
  }
}

function * handleIO (socket) {
  yield fork(read, socket)
  yield fork(write, socket)
}

function * flow () {
  while (true) {
    let { sessionId } = yield take(appTypes.CONNECT_TO_SOCKET)
    const socket = yield call(connect, sessionId)
    yield put(usersActions.fetchUsers())

    const task = yield fork(handleIO, socket)

    let action = yield take(`logout`)

    yield cancel(task)

    socket.disconnect()
  }
}

export default function * rootSaga () {
  yield fork(flow)
}
