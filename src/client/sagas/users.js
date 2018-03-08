import { put, call } from 'redux-saga/effects'
import { actions } from '../reducers/users'
import { types as userTypes } from '../reducers/users'
import { takeLatest } from 'redux-saga/effects'
import api from '../services/users'
import { actions as channelsActions } from '../reducers/channels'
import { actions as appActions } from '../reducers/app'
import events from '../../common/events'

export function * fetchUsers () {
  try {
    const result = yield call(api.fetchUsers)
    yield put(actions.setUsers(result))
    yield put(channelsActions.fetchChannels())
    yield put(appActions.connect())
  } catch (e) {
    yield put(actions.fetchFailed(e))
  }
}

export function * sendMsgToUserRequest ({ from, to, msg }) {
  yield put(actions.sendMsgToUser(from, to, msg))
  yield put(appActions.emit(events.privateMsg, { to, msg }))
}

export function * watchSendMsgToUserRequestSaga () {
  yield takeLatest(userTypes.SEND_MSG_TO_USER_REQUEST, sendMsgToUserRequest)
}

export function * watchFetchUsersSaga () {
  yield takeLatest(userTypes.FETCH_USERS_REQUEST, fetchUsers)
}
