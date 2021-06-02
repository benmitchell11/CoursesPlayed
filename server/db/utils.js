module.exports = {
    mapResult
  }
  function mapResult (results) {
    return results.map(course => {
      return {
        id: course.id,
        name: course.name,
        country: course.country,
        region: course.region,
        photo: course.photo,
      }
    })
  }
  