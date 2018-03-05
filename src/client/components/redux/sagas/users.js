import { put, call } from 'redux-saga/effects'
import { actions } from '../reducers/users'
import { types as userTypes } from '../reducers/users'
import { takeLatest } from 'redux-saga/effects'
import api from '../services/users'

export function * fetchUsers () {
  try {
    const result = yield call(api.fetchUsers)
    yield put(actions.setUsers(result))
  } catch (e) {
    yield put(actions.fetchFailed(e))
  }
}

export function * watchFetchUsersSaga () {
  yield takeLatest(userTypes.FETCH_USERS_REQUEST, fetchUsers)
}
