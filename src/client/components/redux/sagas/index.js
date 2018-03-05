import { all } from 'redux-saga/effects'
import { watchFetchUsersSaga } from './users'
import { watchFetchChannelsSaga } from './channels'
export default function * rootSaga () {
  yield all([watchFetchUsersSaga(), watchFetchChannelsSaga()])
}
