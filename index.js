var paramap = require('pull-paramap')
var path = require('path')
var pull = require('pull-stream')
var mkdirp = require('mkdirp')
var request = require('request')
var toPull = require('stream-to-pull-stream')
var TarFS = require('tar-fs')
var fs = require('fs')
var rmrf = require('rimraf')

var i = 0, n = 0, m = 0
function install (deps, dir, tmpdir) {
  console.error("INSTALL", dir)
  dir = path.join(dir, 'node_modules')
  if(!tmpdir)
    tmpdir = dir
  return function (cb) {
    n++
    mkdirp(dir, function () {
      pull(
        pull.values(Object.keys(deps)),
        paramap(function (name, cb) {
          var tmp = path.join(tmpdir, '/.npm-install-shrinkwrap_'+(++i)+'_'+Date.now())
          mkdirp(tmp, function (err) {
            if(err) return cb(err)
            var dep = deps[name]
            dep.name = name
            console.error('GET', name+'@'+dep.version, dep.resolved)
            if(!dep.resolved) {
              console.error(dep)
              console.error(new Error('dep:'+name+' was not resolved'))
              return cb(null, dep)
            }

            pull(
              toPull.source(request.get(dep.resolved)),
              toPull(require('zlib').createGunzip()),
              pull.asyncMap(function (data,  cb) {
                setImmediate(function () {
                  console.error(data.length)
                  cb(null, data)
                })
              }),
              toPull.sink(TarFS.extract(tmp, {finish: function (err) {
                var mod_dir = path.join(dir, name)
                rmrf(mod_dir, function () {
                  console.log('rename', path.join(tmp, 'package'), mod_dir)
                  //should usually only contain 'package' dir
                  //but not always!
                  fs.readdir(tmp, function (err, ls) {
                    if(err) return cb(err)
                    fs.rename(path.join(tmp, ls.shift()), mod_dir, function (err) {
                      if(!err) {
                        console.error(mod_dir)
                        m++
                        console.error(n, m)
                      }
                      if(err) cb(err)
                      else rmrf(tmp, function () {
                        if(dep.dependencies)
                          install(dep.dependencies, mod_dir, tmpdir)(cb)
                        else cb(null, dep)
                      })
                    })
                  })
                })
              }}))
            )
          })
        }, 1),
        pull.drain(console.error, cb)
      )
    })
  }
}

module.exports = function (shrinkwrap, dir) {
  return install(shrinkwrap.dependencies, dir)
}

if(!module.parent)
  module.exports(
    require(path.resolve(process.cwd(), process.argv[2])),
    process.cwd()
  )(function (err) {
    if(err) throw err
  })




