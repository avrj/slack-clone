import { all } from 'redux-saga/effects'
import { watchFetchUsersSaga, watchSendMsgToUserRequestSaga } from './users'
import {
  watchFetchChannelsSaga,
  watchFetchChannelsMessagesSaga,
  watchFetchChannelsMessagesAppendSaga,
  watchOnJoinChannelSaga,
  watchSendMsgToChannelRequestSaga,
} from './channels'
import { watchFetchLogoutSaga } from './app'
import socket from './socket'
export default function * rootSaga () {
  yield all([
    socket(),
    watchFetchUsersSaga(),
    watchFetchChannelsSaga(),
    watchFetchChannelsMessagesSaga(),
    watchFetchChannelsMessagesAppendSaga(),
    watchFetchLogoutSaga(),
    watchOnJoinChannelSaga(),
    watchSendMsgToUserRequestSaga(),
    watchSendMsgToChannelRequestSaga(),
  ])
}
