const API_ENDPOINT = '/api'

async function fetchChannels () {
  const response = await fetch(API_ENDPOINT + '/user/channels', {
    credentials: 'include',
  })
  return response.json()
}

export default { fetchChannels }
