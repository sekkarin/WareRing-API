process.env.TZ = 'Asia/Bangkok';
const config = {
  dev: '.env',
  test: '.env',
  production: '.env',
};

export default config[process.env.NODE_ENV] || '.env';
