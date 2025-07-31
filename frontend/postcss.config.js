export default {
  plugins: {
    autoprefixer: {
      overrideBrowserslist: [
        'Chrome >= 90',
        'Firefox >= 88',
        'Safari >= 14',
        'Edge >= 90',
        'iOS >= 14',
        'Android >= 90'
      ],
      grid: 'autoplace'
    }
  }
}
