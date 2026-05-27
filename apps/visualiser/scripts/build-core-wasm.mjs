import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = dirname(fileURLToPath(import.meta.url));
const appDir = resolve(scriptDir, '..');
const repoRoot = resolve(appDir, '../..');
const outputDir = resolve(appDir, 'public/core');

const exportedFunctions = [
	'_core_create',
	'_core_create_with_config',
	'_core_create_configured',
	'_core_destroy',
	'_core_complete_startup',
	'_core_set_tank',
	'_core_set_pump_proof',
	'_core_set_blower_proof',
	'_core_set_alarm_silence',
	'_core_set_manual_reset',
	'_core_tick',
	'_core_get_mode',
	'_core_get_pump',
	'_core_get_blower',
	'_core_get_valve',
	'_core_get_audible_alarm',
	'_core_get_visual_alarm',
	'_core_get_high_fault',
	'_core_get_pump_fault',
	'_core_get_blower_fault',
	'_core_get_cycle_count',
];

function hasCommand(command) {
	try {
		execFileSync(command, ['--version'], { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

function dockerReady() {
	try {
		execFileSync('docker', ['info'], { stdio: 'ignore' });
		return true;
	} catch {
		return false;
	}
}

mkdirSync(outputDir, { recursive: true });

const emccArgs = [
	'-std=c++17',
	'-O3',
	`-I${resolve(repoRoot, 'apps/firmware/lib/Core/include')}`,
	`-I${resolve(repoRoot, 'apps/firmware/lib/SimulatorHarness/include')}`,
	resolve(repoRoot, 'apps/visualiser/wasm/core-sim.cpp'),
	resolve(repoRoot, 'apps/firmware/lib/Core/src/ControlLoop.cpp'),
	resolve(repoRoot, 'apps/firmware/lib/Core/src/ControllerApp.cpp'),
	resolve(repoRoot, 'apps/firmware/lib/Core/src/ControllerConfig.cpp'),
	resolve(repoRoot, 'apps/firmware/lib/Core/src/RecoveryManager.cpp'),
	resolve(repoRoot, 'apps/firmware/lib/SimulatorHarness/src/SimulationHarness.cpp'),
	'-sWASM=1',
	'-sMODULARIZE=1',
	'-sEXPORT_ES6=1',
	'-sENVIRONMENT=web',
	'-sALLOW_MEMORY_GROWTH=1',
	`-sEXPORTED_FUNCTIONS=${JSON.stringify(exportedFunctions)}`,
	'-sEXPORTED_RUNTIME_METHODS=["ccall","cwrap"]',
	'-o',
	resolve(outputDir, 'core-sim.js'),
];

const dockerArgs = [
	'run',
	'--rm',
	'-v',
	`${repoRoot}:/src`,
	'-w',
	'/src',
	'emscripten/emsdk:latest',
	'em++',
	'-std=c++17',
	'-O3',
	'-I/src/apps/firmware/lib/Core/include',
	'-I/src/apps/firmware/lib/SimulatorHarness/include',
	'/src/apps/visualiser/wasm/core-sim.cpp',
	'/src/apps/firmware/lib/Core/src/ControlLoop.cpp',
	'/src/apps/firmware/lib/Core/src/ControllerApp.cpp',
	'/src/apps/firmware/lib/Core/src/ControllerConfig.cpp',
	'/src/apps/firmware/lib/Core/src/RecoveryManager.cpp',
	'/src/apps/firmware/lib/SimulatorHarness/src/SimulationHarness.cpp',
	'-sWASM=1',
	'-sMODULARIZE=1',
	'-sEXPORT_ES6=1',
	'-sENVIRONMENT=web',
	'-sALLOW_MEMORY_GROWTH=1',
	`-sEXPORTED_FUNCTIONS=${JSON.stringify(exportedFunctions)}`,
	'-sEXPORTED_RUNTIME_METHODS=["ccall","cwrap"]',
	'-o',
	'/src/apps/visualiser/public/core/core-sim.js',
];

if (hasCommand('em++')) {
	execFileSync('em++', emccArgs, { stdio: 'inherit' });
} else if (dockerReady()) {
	execFileSync('docker', dockerArgs, { stdio: 'inherit' });
} else {
	throw new Error('Install Emscripten or start Docker to build Core WASM locally.');
}

if (!existsSync(resolve(outputDir, 'core-sim.js')) || !existsSync(resolve(outputDir, 'core-sim.wasm'))) {
	throw new Error('Core WASM build finished without expected output files.');
}
