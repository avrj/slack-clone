import { put, call } from 'redux-saga/effects'
import { actions } from '../reducers/channels'
import { types as userTypes } from '../reducers/channels'
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

export function * watchFetchChannelsSaga () {
  yield takeLatest(userTypes.FETCH_CHANNELS_REQUEST, fetchChannels)
}
