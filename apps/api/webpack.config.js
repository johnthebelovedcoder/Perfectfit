module.exports = function (options) {
  return {
    ...options,
    externals: [
      function ({ request }, callback) {
        // Bundle @thread/* workspace packages — don't externalize them
        if (request && request.startsWith("@thread/")) {
          return callback();
        }
        // Externalize everything else in node_modules (default NestJS behavior)
        if (request && /^[^./]|^\.[^./]|^\.\.[^/]/.test(request) === false) {
          return callback(null, "commonjs " + request);
        }
        if (request && !request.startsWith(".") && !request.startsWith("/") && !request.startsWith("@thread/")) {
          return callback(null, "commonjs " + request);
        }
        callback();
      },
    ],
  };
};
