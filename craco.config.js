module.exports = {
  eslint: {
    enable: false,
    loaderOptions: (eslintOptions) => {
      return { ...eslintOptions, ignore: true }
    },
  },
  plugins: [{ plugin: require("craco-plugin-react-hot-reload") }],
}
