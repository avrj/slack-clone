import { put, call } from 'redux-saga/effects'
import { actions, types as channelsTypes } from '../reducers/channels'
import { actions as userActions } from '../reducers/user'
import { actions as appActions } from '../reducers/app'
import { takeLatest } from 'redux-saga/effects'
import api from '../services/channels'
import events from '../../common/events'
export function * fetchChannels () {
  try {
    const result = yield call(api.fetchChannels)
    yield put(actions.setChannels(result))
  } catch (e) {
    yield put(actions.fetchFailed(e))
  }
}

export function * fetchChannelsMessages ({ channel }) {
  try {
    const result = yield call(api.fetchChannelsMessages, channel)
    yield put(actions.setChannelsMessages(channel, result))
  } catch (e) {
    yield put(actions.fetchFailed(e))
  }
}

export function * fetchChannelsMessagesAppend ({ channel }) {
  try {
    const result = yield call(api.fetchChannelsMessages, channel)
    yield put(actions.setChannelsMessagesAppend(channel, result))
    yield put(userActions.setActiveChannel(channel))
  } catch (e) {
    yield put(actions.fetchFailed(e))
  }
}

export function * onJoinChannel ({ channel }) {
  yield put(actions.fetchChannelsMessages(channel))
  yield put(userActions.setActiveChannel(channel))
}

export function * watchOnJoinChannelSaga () {
  yield takeLatest(channelsTypes.ON_JOIN_CHANNEL, onJoinChannel)
}

export function * watchFetchChannelsSaga () {
  yield takeLatest(channelsTypes.FETCH_CHANNELS_REQUEST, fetchChannels)
}

export function * watchFetchChannelsMessagesSaga () {
  yield takeLatest(
    channelsTypes.FETCH_CHANNELS_MESSAGES_REQUEST,
    fetchChannelsMessages
  )
}

export function * watchFetchChannelsMessagesAppendSaga () {
  yield takeLatest(
    channelsTypes.FETCH_CHANNELS_MESSAGES_APPEND_REQUEST,
    fetchChannelsMessagesAppend
  )
}

export function * sendMsgToChannelRequest ({ from, to, msg }) {
  yield put(actions.sendMsgToChannel(from, to, msg))
  yield put(appActions.emit(events.msg, { room: to, msg }))
}

export function * watchSendMsgToChannelRequestSaga () {
  yield takeLatest(
    channelsTypes.SEND_MSG_TO_CHANNEL_REQUEST,
    sendMsgToChannelRequest
  )
}
