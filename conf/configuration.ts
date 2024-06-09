// process.env.NODE_TLS_REJECT_UNAUTHORIZED='0'
const config = {
  dev: './env/dev/.env.dev',
  test: './env/test/.env.test',
  production: '.env'
};

export default config[process.env.NODE_ENV] || '.env';
