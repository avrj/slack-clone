import { put, call } from 'redux-saga/effects'
import { actions } from '../reducers/channels'
import { types as channelsTypes } from '../reducers/channels'
import { takeLatest } from 'redux-saga/effects'
import api from '../services/channels'

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

export function * watchFetchChannelsSaga () {
  yield takeLatest(channelsTypes.FETCH_CHANNELS_REQUEST, fetchChannels)
}

export function * watchFetchChannelsMessagesSaga () {
  yield takeLatest(
    channelsTypes.FETCH_CHANNELS_MESSAGES_REQUEST,
    fetchChannelsMessages
  )
}
