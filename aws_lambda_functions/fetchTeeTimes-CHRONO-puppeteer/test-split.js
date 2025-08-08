const pkg = require('./package.json');
const allDeps = pkg.dependencies || {};

// Exclude large dependencies that might exceed layer size limits
const excludedDeps = ['@sparticuz/chromium'];
const layerDeps = {};
const functionDeps = {};

Object.keys(allDeps).forEach(dep => {
  if (!excludedDeps.includes(dep)) {
    layerDeps[dep] = allDeps[dep];
  } else {
    functionDeps[dep] = allDeps[dep];
  }
});

console.log('Original dependencies:', Object.keys(allDeps));
console.log('Layer dependencies:', Object.keys(layerDeps));
console.log('Function dependencies:', Object.keys(functionDeps));

console.log('\nLayer package.json:');
console.log(JSON.stringify({dependencies: layerDeps}, null, 2));

console.log('\nFunction package.json:');
console.log(JSON.stringify({dependencies: functionDeps}, null, 2));