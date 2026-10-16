const test = require('node:test');
const { after } = require('node:test');
const assert = require('node:assert');
const fs = require('node:fs');
const path = require('node:path');

/**
 * Every backend module must load.
 *
 * This exists because `node --check` only validates syntax. A controller that
 * calls a helper it forgot to import parses perfectly and then throws
 * ReferenceError at request time - which is exactly how a missing
 * `resolveTrustedFrontendOrigin` import reached the running Google OAuth route.
 * Requiring each module turns that class of mistake into a test failure.
 */

const BACKEND = path.join(__dirname, '..');

// server.js starts listening and runs the schema initialisers on require.
const EXCLUDE = new Set(['server.js']);

const collect = (dir, acc = []) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        // scripts/ are CLI entry points that do work (and print) when required.
        if (['node_modules', 'uploads', 'dist', 'scripts'].includes(entry.name)) continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) collect(full, acc);
        else if (entry.name.endsWith('.js')) acc.push(full);
    }
    return acc;
};

// Requiring every model opens a mysql2 pool. Close it after the suite or the
// process hangs with the event loop still active.
after(async () => {
    // Requiring every model creates mysql2 pools and their internal timers. Close
    // them so the process exits on its own and every subtest result is reported.
    try {
        await require(path.join(BACKEND, 'config', 'database')).end();
    } catch {
        // never opened
    }

    // Safety net: if something still holds the event loop, leave after a grace
    // period. Unref'd, so it never keeps the process alive on its own - by then
    // the reporter has already flushed every result.
    setTimeout(() => process.exit(0), 500).unref();
});

const modules = collect(BACKEND).filter((f) => !EXCLUDE.has(path.basename(f)) && !f.includes(`${path.sep}tests${path.sep}`));

test('found the backend modules to load', () => {
    assert.ok(modules.length > 20, `only found ${modules.length} modules`);
});

test('every backend module loads without throwing', () => {
    const failures = [];
    for (const file of modules) {
        try {
            require(file);
        } catch (error) {
            failures.push(`${path.relative(BACKEND, file)}: ${error.message}`);
        }
    }
    assert.deepStrictEqual(failures, [], 'modules failed to load');
});

// A route file that imports a handler which no longer exists throws at require
// time, so this also guards the route/controller contract.
test('every route module loads and exposes a router', () => {
    const routesDir = path.join(BACKEND, 'routes');
    const failures = [];
    for (const entry of fs.readdirSync(routesDir).filter((f) => f.endsWith('.js'))) {
        try {
            const router = require(path.join(routesDir, entry));
            if (typeof router !== 'function') {
                failures.push(`${entry}: does not export a router function`);
            }
        } catch (error) {
            failures.push(`${entry}: ${error.message}`);
        }
    }
    assert.deepStrictEqual(failures, []);
});

// Every handler referenced by a route must actually exist on its controller.
test('routers only reference handlers their controller exports', () => {
    const failures = [];

    for (const entry of fs.readdirSync(path.join(BACKEND, 'routes')).filter((f) => f.endsWith('.js'))) {
        const file = path.join(BACKEND, 'routes', entry);
        const source = fs.readFileSync(file, 'utf8');

        // controller.method references, e.g. userController.getMyTickets
        const refs = source.matchAll(/\b(\w+Controller)\.(\w+)/g);
        for (const [, varName, method] of refs) {
            const declaration = source.match(new RegExp(`const ${varName} = require\\([^)]*\\);`));
            if (!declaration) continue;

            const modulePath = declaration[0].match(/require\('([^']+)'\)/)[1];
            const controllerPath = path.join(BACKEND, 'controllers', `${modulePath.split('/').pop()}.js`);

            if (!fs.existsSync(controllerPath)) {
                failures.push(`${entry}: ${varName} -> ${modulePath} does not exist`);
                continue;
            }
            const controller = require(controllerPath);
            if (typeof controller[method] !== 'function') {
                failures.push(`${entry}: ${varName}.${method} is not exported by ${path.basename(controllerPath)}`);
            }
        }
    }

    assert.deepStrictEqual(failures, []);
});
