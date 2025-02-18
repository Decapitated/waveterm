// Copyright 2025, Command Line Inc.
// SPDX-License-Identifier: Apache-2.0

import { getApi, useOverrideConfigAtom } from "@/app/store/global";
import { boundNumber } from "@/util/util";
import loader from "@monaco-editor/loader";
import { Editor, Monaco } from "@monaco-editor/react";
import type * as MonacoTypes from "monaco-editor/esm/vs/editor/editor.api";
// import { configureMonacoYaml } from "monaco-yaml";
import React, { useMemo, useRef } from "react";

import { RpcApi } from "@/app/store/wshclientapi";
import { TabRpcClient } from "@/app/store/wshrpcutil";
import { makeConnRoute } from "@/util/util";
import * as monaco from 'monaco-editor';
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import { SchemaEndpoints, getSchemaEndpointInfo } from "./schemaendpoints";
// import ymlWorker from "./yamlworker?worker";

//#region Extensions
import "@codingame/monaco-vscode-all-default-extensions";
//#endregion
//#region Service Overrides
import { initialize } from '@codingame/monaco-vscode-api'
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

import "./codeeditor.scss";

export type WorkerLoader = () => Worker;
const workerLoaders: Partial<Record<string, WorkerLoader>> = {
	TextEditorWorker: () => new Worker(new URL('monaco-editor/esm/vs/editor/editor.worker.js', import.meta.url), { type: 'module' }),
	TextMateWorker: () => new Worker(new URL('@codingame/monaco-vscode-textmate-service-override/worker', import.meta.url), { type: 'module' }),
};

window.MonacoEnvironment = {
    getWorker: function (_workerId, label) {
		const workerFactory = workerLoaders[label]
		if (workerFactory != null) {
			return workerFactory()
		}
		throw new Error(`Worker ${label} not found`)
	}
};

export async function loadMonaco() {
	try {
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

		loader.config({ monaco });
		await loader.init();

		// Disable default validation errors for typescript and javascript
		monaco.languages.typescript.typescriptDefaults.setDiagnosticsOptions({
			noSemanticValidation: true,
		});
		const schemas = await Promise.all(SchemaEndpoints.map((endpoint) => getSchemaEndpointInfo(endpoint)));
		monaco.languages.json.jsonDefaults.setDiagnosticsOptions({
			validate: true,
			allowComments: false, // Set to true if you want to allow comments in JSON
			enableSchemaRequest: true,
			schemas,
		});
	} catch (e) {
		getApi().sendLog("Load Monaco Error");
		getApi().sendLog(e);
	}
}

function defaultEditorOptions(): MonacoTypes.editor.IEditorOptions {
    const opts: MonacoTypes.editor.IEditorOptions = {
        scrollBeyondLastLine: false,
        fontSize: 12,
        fontFamily: "Hack",
        smoothScrolling: true,
        scrollbar: {
            useShadows: false,
            verticalScrollbarSize: 5,
            horizontalScrollbarSize: 5,
        },
        minimap: {
            enabled: true,
        },
        stickyScroll: {
            enabled: false,
        },
    };
    return opts;
}

interface CodeEditorProps {
    blockId: string;
    text: string;
    filename: string;
    fileinfo: FileInfo;
    language?: string;
    meta?: MetaType;
    onChange?: (text: string) => void;
    onMount?: (monacoPtr: MonacoTypes.editor.IStandaloneCodeEditor, monaco: Monaco) => () => void;
}

export function CodeEditor({ blockId, text, language, filename, fileinfo, meta, onChange, onMount }: CodeEditorProps) {
    const divRef = useRef<HTMLDivElement>(null);
    const unmountRef = useRef<() => void>(null);
    const minimapEnabled = useOverrideConfigAtom(blockId, "editor:minimapenabled") ?? false;
    const stickyScrollEnabled = useOverrideConfigAtom(blockId, "editor:stickyscrollenabled") ?? false;
    const wordWrap = useOverrideConfigAtom(blockId, "editor:wordwrap") ?? false;
    const fontSize = boundNumber(useOverrideConfigAtom(blockId, "editor:fontsize"), 6, 64);
    const theme = "wave-theme-dark";
    const [absPath, setAbsPath] = React.useState("");

    React.useEffect(() => {
        return () => {
            // unmount function
            if (unmountRef.current) {
                unmountRef.current();
            }
        };
    }, []);

    React.useEffect(() => {
        const inner = async () => {
            try {
                const fileInfo = await RpcApi.RemoteFileJoinCommand(TabRpcClient, [filename], {
                    route: makeConnRoute(meta.connection ?? ""),
                });
                setAbsPath(fileInfo.path);
            } catch (e) {
                setAbsPath(filename);
            }
        };
        inner();
    }, [filename]);

    React.useEffect(() => {
        console.log("abspath is", absPath);
    }, [absPath]);

	React.useEffect(() => {
		if (divRef.current) {
			monaco.editor.create(divRef.current, {
				...editorOpts,
			});
		}
	}, [divRef]);

    function handleEditorChange(text: string, ev: MonacoTypes.editor.IModelContentChangedEvent) {
        if (onChange) {
            onChange(text);
        }
    }

    function handleEditorOnMount(editor: MonacoTypes.editor.IStandaloneCodeEditor, monaco: Monaco) {
        if (onMount) {
            unmountRef.current = onMount(editor, monaco);
        }
    }

    const editorOpts = useMemo(() => {
        const opts = defaultEditorOptions();
        opts.readOnly = fileinfo.readonly;
        opts.minimap.enabled = minimapEnabled;
        opts.stickyScroll.enabled = stickyScrollEnabled;
        opts.wordWrap = wordWrap ? "on" : "off";
        opts.fontSize = fontSize;
        return opts;
    }, [minimapEnabled, stickyScrollEnabled, wordWrap, fontSize, fileinfo.readonly]);

    return (
        <div className="code-editor-wrapper">
            <div className="code-editor" ref={divRef}>
                <Editor
                    // theme={theme}
                    value={text}
                    options={editorOpts}
                    onChange={handleEditorChange}
                    onMount={handleEditorOnMount}
                    path={absPath}
                    language={language}
                />
            </div>
        </div>
    );
}
