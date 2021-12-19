module.exports = {
  apps: [
    {
      name: 'stream-crawler',
      namespace: 'crawler',
      script: './dist/index.js',
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
}
