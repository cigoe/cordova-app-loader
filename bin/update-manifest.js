var path = require('path');
var fs = require('fs');
var crypto = require('crypto');

function checksum(filename){
  data = fs.readFileSync(filename, 'utf8');
  return crypto.createHash('sha1').update(data).digest('hex');
}

var manifestFile = 'manifest.json';
var rootDir = process.cwd();

var args = process.argv.slice(-2);
args.forEach(function(arg){
  if(arg.indexOf('.json') > -1) {
    manifestFile = arg;
  } else if(arg.indexOf('update-manifest') < 0){
    rootDir = arg;
  }
});
manifestFile = path.resolve(manifestFile);
rootDir = path.resolve(rootDir);
console.log('root='+rootDir);
console.log('manifest='+manifestFile);

var manifest;
try {
  manifest = fs.readFileSync(manifestFile,'utf8');
  manifest = JSON.parse(manifest);
  if(typeof manifest !== "object") throw new Error('Manifest not an object!');
  if(!manifest.files) throw new Error("Manifest has no files!");
} catch(e){
  console.error('Invalid '+path.resolve(manifestFile),e,manifest);
  process.exit(1);
}

var versionChecksum = "";
for(var key in manifest.files) {
  try {
    var filename = manifest.files[key].filename;
    var version = checksum(path.resolve(rootDir,filename));
    versionChecksum += version;
    manifest.files[key].version = version;
  } catch(e){
    console.error('Could not hash file.',e);
  }
}
if(typeof manifest.version === 'number'){
  manifest.version++;
} else {
  manifest.version = crypto.createHash('sha1').update(versionChecksum).digest('hex');
}

try {
  fs.writeFileSync(
      path.resolve(rootDir, manifestFile),
      JSON.stringify(manifest,null,2)
    );
} catch(e) {
  console.error('Could not write manifest.json',e);
}