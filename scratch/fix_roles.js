const fs = require('fs');
const glob = require('fs').readdirSync; // not recursive, need a better way
const path = require('path');

function walk(dir, done) {
  let results = [];
  fs.readdir(dir, function(err, list) {
    if (err) return done(err);
    let i = 0;
    (function next() {
      let file = list[i++];
      if (!file) return done(null, results);
      file = path.resolve(dir, file);
      fs.stat(file, function(err, stat) {
        if (stat && stat.isDirectory()) {
          walk(file, function(err, res) {
            results = results.concat(res);
            next();
          });
        } else {
          if (file.endsWith('.ts') || file.endsWith('.tsx')) {
            results.push(file);
          }
          next();
        }
      });
    })();
  });
}

walk('app/api', (err, files) => {
  files.forEach(f => {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;
    if (content.includes('roleName')) {
      content = content.replace(/roleName/g, 'cargo');
      changed = true;
    }
    if (changed) {
      fs.writeFileSync(f, content);
      console.log('Fixed roleName in', f);
    }
  });
});

walk('middleware.ts', (err) => {
    let content = fs.readFileSync('middleware.ts', 'utf8');
    if (content.includes('roleName')) {
      content = content.replace(/roleName/g, 'cargo');
      fs.writeFileSync('middleware.ts', content);
      console.log('Fixed roleName in middleware.ts');
    }
});
