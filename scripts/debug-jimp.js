const pkg = require('jimp');
console.log('pkg keys:', Object.keys(pkg));
const { Jimp } = pkg;
try {
    console.log('Jimp keys:', Object.keys(Jimp || {}));
    console.log('Jimp.read type:', typeof Jimp.read);
} catch (e) {
    console.error(e);
}
