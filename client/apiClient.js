import request from 'superagent'

const rootUrl = '/api/v1'

export function getCourses () {
  return request.get(rootUrl + '/coursesPlayed')
    .then((res) => {
      console.log(res)
      return res.body
    })
}

export function getUsers () {
  return request.get(rootUrl + '/coursesPlayed')
    .then((res) => {
      console.log(res)
      return res.body
    })
}

export function getUser (userID) {
  return request.get(rootUrl + '/coursesplayed/userprofile/' + userID)
    .then((res) => {
      console.log(res)
      return res.body
    })
}

export function getCoursesByRegion (region) {
  return request.get(rootUrl + '/coursesplayed/regioncourses/' + region)
  .then((res) => {
    return res.body
  })
}

export function getRegions () {
  return request.get(rootUrl + '/coursesplayed')
  .then((res) => {
    console.log(res)
    return res.body
  })
}

export function getRegion (regionID) {
  return request.get(rootUrl + '/coursesplayed/regioncourses/' + regionID)
    .then((res) => {
      console.log(res)
      return res.body
    })
}

export function getRegionByName (regionName) {
  return request.get(rootUrl + '/coursesplayed/regioncourses/' + regionName)
  .then((res) => {
    console.log(res)
    return res.body
  })
}

export function getCoursesByRegionID (region_id) {
  return request.get(rootUrl + '/coursesplayed/courses/' + region_id)
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