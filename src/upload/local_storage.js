import fs from 'fs';
import crypto from 'crypto';
import mkdirp from 'mkdirp';
import os from 'os';
import path from 'path';
import url from 'url';

function getFilename (req, file, cb) {
  crypto.pseudoRandomBytes(16, function (err, raw) {
    cb(err, err ? undefined : raw.toString('hex'));
  });
}

function getDestination (req, file, cb) {
  cb(null, os.tmpdir());
}

class LocalStorage {
  constructor(opts) {
    this.getFilename = (opts.filename || getFilename);

    if (typeof opts.destination === 'string') {
      mkdirp.sync(opts.destination);
      this.getDestination = function($0, $1, cb) {
        cb(null, opts.destination);
      };
    } else {
      this.getDestination = (opts.destination || getDestination);
    }
    this.baseUrl = opts.baseUrl || opts.destination;
  }

  _handleFile(req, file, cb) {
    this.getDestination(req, file, (err, destination) => {
      if (err) return cb(err);

      this.getFilename(req, file, (err, filename) => {
        if (err) return cb(err);

        var finalPath = path.join(destination, filename);
        var outStream = fs.createWriteStream(finalPath);
        console.log('######', req);
        var finalUrl = url.resolve(`${req.protocol}://${req.get('host')}`, `${this.baseUrl}/${filename}`);

        file.stream.pipe(outStream);
        outStream.on('error', cb);
        outStream.on('finish', function () {
          cb(null, {
            destination: destination,
            filename: filename,
            path: finalPath,
            url: finalUrl,
            size: outStream.bytesWritten
          });
        });
      });
    });
  }

  _removeFile (req, file, cb) {
    var path = file.path;

    delete file.destination;
    delete file.filename;
    delete file.path;

    fs.unlink(path, cb);
  }
}

module.exports = function (opts) {
  return new LocalStorage(opts);
};