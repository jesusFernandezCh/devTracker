/**
 * render-deploy.cjs
 *
 * Build de producción y push de solo la carpeta dist/ al branch `dist`
 * para que Render despliegue sin necesidad de npm install ni build.
 *
 * Uso: node scripts/render-deploy.cjs
 * (se ejecuta después de ng build por el script npm "deploy:render")
 */
const {execSync} = require('child_process');
const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '..', 'dist', 'devTracker', 'browser');
const BRANCH = 'dist';

function run(cmd) {
  console.log(`> ${cmd}`);
  execSync(cmd, {stdio: 'inherit', cwd: path.resolve(__dirname, '..')});
}

function runCapture(cmd) {
  return execSync(cmd, {encoding: 'utf-8', cwd: path.resolve(__dirname, '..')}).trim();
}

// Verificar que el build existe
if (!fs.existsSync(DIST_DIR)) {
  console.error(`No se encontro ${DIST_DIR}. Ejecuta "ng build --configuration production" primero.`);
  process.exit(1);
}

// Verificar que hay archivos en dist
const files = fs.readdirSync(DIST_DIR);
if (files.length === 0) {
  console.error('La carpeta dist esta vacia.');
  process.exit(1);
}

console.log(`\nArchivos en dist: ${files.join(', ')}\n`);

// Verificar que hay un remote configurado
const remote = runCapture('git remote get-url origin');
if (!remote) {
  console.error('No hay remote "origin" configurado.');
  process.exit(1);
}
console.log(`Remote: ${remote}\n`);

// Guardar branch actual
const currentBranch = runCapture('git rev-parse --abbrev-ref HEAD');
console.log(`Branch actual: ${currentBranch}\n`);

// Verificar que no hay cambios sin commitear en dist (no importa, es orphan)
console.log('Creando branch dist (orphan)...\n');

try {
  // Crear branch orphan temporal
  run(`git checkout --orphan ${BRANCH}`);

  // Eliminar todos los archivos del staging (excepto dist)
  run('git rm -rf .');

  // Copiar solo el contenido de dist/browser al root
  run(`cp -r "${DIST_DIR}"/* .`);

  // Crear .gitkeep si no hay index.html (no deberia pasar)
  if (!fs.existsSync('index.html')) {
    console.error('No se genero index.html en dist/');
    run(`git checkout ${currentBranch}`);
    process.exit(1);
  }

  // Agregar todos los archivos
  run('git add -A');

  // Commit
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  run(`git commit -m "deploy: dist ${timestamp}" --allow-empty`);

  // Push force al branch dist
  run(`git push origin ${BRANCH} --force`);

  console.log(`\nDesplegado exitosamente en branch "${BRANCH}"`);

} catch (err) {
  console.error('\nError durante el deploy:', err.message);
} finally {
  // Volver al branch original
  run(`git checkout ${currentBranch}`);
  // Limpiar archivos de dist que quedaron en el working tree
  run('git clean -fd');
  console.log(`\nVuelto a branch "${currentBranch}"`);
}
