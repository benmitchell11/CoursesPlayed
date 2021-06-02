import request from 'superagent'

const rootUrl = '/api/v1'

export function getCourses () {
  return request.get(rootUrl + '/coursesPlayed')
    .then((res) => {
      console.log(res)
      return res.body
    })
}

function errorHandler (method, route) {
    return (err) => {
      if (err.message === 'Not Found') {
        throw Error(`Error: You need to implement an API route for ${method} ${route}`)
      } else {
        throw Error(`${err.message} on ${method} ${route}`)
      }
    }
  }