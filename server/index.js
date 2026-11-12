const server = require('./server')

const port = process.env.API_PORT || 3000

server.listen(port, () => {
  console.log(`Server listening on port ${port}`)
})
