export default function profiler () {
  return function (req, res, next) {
    const tag = '[' + new Date().toISOString() + '] gateway profiler => ' + req.method + '  ' + req.url;
    console.time(tag);
    // The 'finish' event comes from core Node.js, it means Node is done handing
    // off the response headers and body to the underlying OS.
    res.on('finish', () => {
      console.timeEnd(tag);
    });
    next();
  };
}