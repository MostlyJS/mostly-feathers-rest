const timeDebug = (process.env.DEBUG || '').indexOf('mostly:*') >= 0;

module.exports = function profiler () {
  return function (req, res, next) {
    const tag = `  mostly:feathers:rest:profiler ${req.method} ${req.url}`;
    if (timeDebug) console.time(tag);
    // The 'finish' event comes from core Node.js, it means Node is done handing
    // off the response headers and body to the underlying OS.
    res.on('finish', () => {
      if (timeDebug) console.timeEnd(tag);
    });
    next();
  };
};