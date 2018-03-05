const API_ENDPOINT = '/api'

async function fetchUsers () {
  const response = await fetch(API_ENDPOINT + '/users', {
    credentials: 'include',
  })
  return response.json()
}

export default { fetchUsers }
