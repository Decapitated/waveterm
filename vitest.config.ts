import { UserConfig, defineConfig, mergeConfig } from "vitest/config";
import electronViteConfig from "./electron.vite.config";
import importMetaUrlPlugin from '@codingame/esbuild-import-meta-url-plugin';

export default mergeConfig(
    electronViteConfig.renderer as UserConfig,
    defineConfig({
        test: {
            reporters: ["verbose", "junit"],
            outputFile: {
                junit: "test-results.xml",
            },
            coverage: {
                provider: "istanbul",
                reporter: ["lcov"],
                reportsDirectory: "./coverage",
            },
            typecheck: {
                tsconfig: "tsconfig.json",
            },
        },
		optimizeDeps: {
			esbuildOptions: {
				plugins: [ importMetaUrlPlugin ]
			},
			include: [
				'vscode-textmate',
				'vscode-oniguruma',
				'@vscode/vscode-languagedetection'
			]
		}
    })
);
