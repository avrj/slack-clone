const API_ENDPOINT = '/api'

async function logOut () {
  const response = await fetch(API_ENDPOINT + '/logout', {
    credentials: 'include',
    method: 'POST',
  })
  return response.json()
}

export default { logOut }
