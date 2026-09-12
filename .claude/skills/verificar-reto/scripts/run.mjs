/* Ejecuta todas las pruebas (o las que se indiquen) y resume el resultado.
     node run.mjs              → todas
     node run.mjs git          → solo las que contengan «git» en el nombre
   ========================================================== */
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const SUITES = [
  ['Blindaje de la Red', 'test-blindaje.mjs'],
  ['Punto de retorno · recorrido completo', 'test-punto-de-retorno.mjs'],
  ['Punto de retorno · caminos alternativos', 'test-punto-de-retorno-avanzado.mjs'],
  ['Terminal implacable', 'test-terminal-implacable.mjs'],
  ['La jungla de objetos', 'test-jungla-de-objetos.mjs'],
  ['Los intocables', 'test-los-intocables.mjs'],
  ['Control total', 'test-control-total.mjs'],
  ['Cuenta atrás', 'test-cuenta-atras.mjs'],
  ['Cuenta pendiente', 'test-cuenta-pendiente.mjs'],
  ['Asalto al puerto 80', 'test-asalto-al-puerto-80.mjs'],
  ['Arranque imposible', 'test-arranque-imposible.mjs'],
  ['Carga crítica', 'test-carga-critica.mjs'],
  ['Movimiento reducido', 'test-reducido.mjs'],
  ['Cameos a Wikipedia', 'test-cameos.mjs'],
  ['Portada del repositorio', 'test-portada.mjs']
];

const filtro = process.argv[2];
const elegidas = SUITES.filter(([, f]) => !filtro || f.includes(filtro));

function run(file) {
  return new Promise(resolve => {
    const p = spawn(process.execPath, [path.join(here, file)], { stdio: ['ignore', 'pipe', 'pipe'] });
    let salida = '';
    p.stdout.on('data', d => { salida += d; process.stdout.write(d); });
    p.stderr.on('data', d => { salida += d; process.stderr.write(d); });
    p.on('close', code => {
      const m = /Resumen: (\d+) correctas, (\d+) fallidas/.exec(salida);
      resolve({ code: code, pass: m ? Number(m[1]) : 0, fail: m ? Number(m[2]) : (code ? 1 : 0) });
    });
  });
}

let total = 0, fallos = 0;
for (const [nombre, file] of elegidas) {
  console.log('\n══════════════════════════════════════════════════');
  console.log('  ' + nombre + '  (' + file + ')');
  console.log('══════════════════════════════════════════════════');
  const r = await run(file);
  total += r.pass;
  fallos += r.fail;
}
console.log('\n══════════════════════════════════════════════════');
console.log('  TOTAL: ' + total + ' comprobaciones correctas, ' + fallos + ' fallidas');
console.log('══════════════════════════════════════════════════');
process.exit(fallos ? 1 : 0);
