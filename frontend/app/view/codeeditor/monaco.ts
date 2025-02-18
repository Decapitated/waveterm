import { initialize } from '@codingame/monaco-vscode-api';

//#region Service Overrides

import getBaseServiceOverride from "@codingame/monaco-vscode-base-service-override";
import getHostServiceOverride from "@codingame/monaco-vscode-host-service-override";
import getExtensionsServiceOverride from "@codingame/monaco-vscode-extensions-service-override";
import getFilesServiceOverride from "@codingame/monaco-vscode-files-service-override";
import getQuickAccessServiceOverride from "@codingame/monaco-vscode-quickaccess-service-override";
import getNotificationsServiceOverride from "@codingame/monaco-vscode-notifications-service-override";
import getDialogsServiceOverride from "@codingame/monaco-vscode-dialogs-service-override";
import getModelServiceOverride from "@codingame/monaco-vscode-model-service-override";
import getConfigurationServiceOverrride, { updateUserConfiguration } from "@codingame/monaco-vscode-configuration-service-override";
import getLanguagesServiceOverride from "@codingame/monaco-vscode-languages-service-override";
import getThemesServiceOverride from "@codingame/monaco-vscode-theme-service-override";
import getTextmateServiceOverride from "@codingame/monaco-vscode-textmate-service-override";
import getSnippetsServiceOverride from "@codingame/monaco-vscode-snippets-service-override";
import getLifeCycleServiceOverride from "@codingame/monaco-vscode-lifecycle-service-override";
import getLayoutServiceOverride from "@codingame/monaco-vscode-layout-service-override";

//#endregion

export async function monacoServiceInit() {
	// overriding Monaco service with VSCode
	await initialize({
		...getBaseServiceOverride(),
		...getHostServiceOverride(),
		...getExtensionsServiceOverride(),
		...getFilesServiceOverride(),
		...getQuickAccessServiceOverride(),
		...getNotificationsServiceOverride(),
		...getDialogsServiceOverride(),
		...getModelServiceOverride(),
		...getConfigurationServiceOverrride(),
		...getLanguagesServiceOverride(),
		...getThemesServiceOverride(),
		...getTextmateServiceOverride(),
		...getSnippetsServiceOverride(),
		...getLifeCycleServiceOverride(),
		...getLayoutServiceOverride(),
	});
	(await import("@codingame/monaco-vscode-all-default-extensions"));
}