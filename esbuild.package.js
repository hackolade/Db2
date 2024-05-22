const fs = require('fs');
const path = require('path');
const esbuild = require('esbuild');
const { clean } = require('esbuild-plugin-clean');
const { copyFolderFiles, addReleaseFlag } = require('@hackolade/hck-esbuild-plugins-pack');
const { EXCLUDED_EXTENSIONS, EXCLUDED_FILES, DEFAULT_RELEASE_FOLDER_PATH } = require('./buildConstants');

const packageData = JSON.parse(fs.readFileSync('./package.json').toString());
const RELEASE_FOLDER_PATH = path.join(DEFAULT_RELEASE_FOLDER_PATH, `${packageData.name}-${packageData.version}`);

const copyDb2Client = () => ({
	name: 'copyDb2Client',
	setup(build) {
		build.onEnd(async () => {
			try {
				await fs.promises.cp(
					path.resolve(__dirname, 'shared', 'addons', 'Db2Client.jar'),
					path.join(RELEASE_FOLDER_PATH, 'addons', 'Db2Client.jar'),
					{ force: true },
				);
			} catch (err) {
				// eslint-disable-next-line no-console
				console.error('Copy Db2Client.jar failed with:', err);
			}
		});
	},
});

esbuild
	.build({
		entryPoints: [
			path.resolve(__dirname, 'forward_engineering', 'api.js'),
			path.resolve(__dirname, 'forward_engineering', 'ddlProvider.js'),
			path.resolve(__dirname, 'reverse_engineering', 'api.js'),
		],
		bundle: true,
		keepNames: true,
		platform: 'node',
		target: 'node16',
		outdir: RELEASE_FOLDER_PATH,
		minify: true,
		logLevel: 'info',
		plugins: [
			clean({
				patterns: [DEFAULT_RELEASE_FOLDER_PATH],
			}),
			copyFolderFiles({
				fromPath: __dirname,
				targetFolderPath: RELEASE_FOLDER_PATH,
				excludedExtensions: EXCLUDED_EXTENSIONS,
				excludedFiles: EXCLUDED_FILES,
			}),
			copyDb2Client(),
			addReleaseFlag(path.resolve(RELEASE_FOLDER_PATH, 'package.json')),
		],
	})
	.catch(() => process.exit(1));
