import { put, call } from 'redux-saga/effects'
import { actions as appActions } from '../reducers/app'
import { actions as userActions } from '../reducers/user'
import { types } from '../reducers/app'
import { takeLatest } from 'redux-saga/effects'
import api from '../services/app'
import history from '../routes/history'

export function * logOut () {
  try {
    const result = yield call(api.logOut)
    /* this.client.disconnect() */
    yield put(userActions.removeUserData())
    yield put(appActions.logOut())

    yield call([history, history.push], {
      pathname: '/',
      state: {
        message: 'You are now signed out.',
      },
    })
  } catch (e) {
    yield put(appActions.showError(e))
  }
}

export function * onError ({ error }) {
  if (error === 'Unauthorized') {
    yield call([history, history.push], {
      pathname: '/',
      state: {
        message: 'Please sign in to enter the chat.',
      },
    })
  } else {
    yield put(appActions.showError(error))
  }
}

export function * watchOnErrorSaga () {
  yield takeLatest(types.ON_ERROR, onError)
}

export function * watchFetchLogoutSaga () {
  yield takeLatest(types.LOG_OUT_REQUEST, logOut)
}
