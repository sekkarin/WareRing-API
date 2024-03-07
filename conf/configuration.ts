const config = {
  dev:"./env/dev/.env.dev",
  test:"./env/test/.env.test",
  prod:"./",
}

export default  config[process.env.NODE_ENV]


