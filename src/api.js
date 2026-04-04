let rpcId = 1

async function send(method, params) {
  const headers = { 'Content-Type': 'application/json' }
  const token = localStorage.getItem('token')
  if (token) headers['Authorization2'] = token

  const res = await fetch('http://localhost:8075/v1/rpc/', {
    method: 'POST',
    headers,
    body: JSON.stringify({ jsonrpc: '2.0', method, params, id: rpcId++ })
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error.message)
  return data.result
}

export const api = {
  training: {
    list: (params) => send('training.List', params),
    get: (params) => send('training.Get', params),
    new: (params) => send('training.New', params),
    delete: (params) => send('training.Delete', params),
    exerciseList: (params) => send('training.ExerciseList', params),
    approachList: (params) => send('training.ApproachList', params),
    addApproach: (params) => send('training.AddApproach', params),
    addTimedApproach: (params) => send('training.AddTimedApproach', params),
    updateApproach: (params) => send('training.UpdateApproach', params),
    updateTimedApproach: (params) => send('training.UpdateTimedApproach', params),
    deleteApproach: (params) => send('training.DeleteApproach', params),
  },
  exercise: {
    categoryList: (params) => send('exercise.CategoryList', params),
    list: (params) => send('exercise.List', params),
    add: (params) => send('exercise.Add', params),
    addCategory: (params) => send('exercise.AddCategory', params),
  }
}
