import { useEffect, useRef, useState } from "react";

import * as monaco from 'monaco-editor';

type Monaco = typeof monaco;
type OnMount = (editor: monaco.editor.IStandaloneCodeEditor, monaco: Monaco) => void;
type BeforeMount = (monaco: Monaco) => void;
type OnChange = (value: string | undefined, ev: monaco.editor.IModelContentChangedEvent) => void;
type OnValidate = (markers: monaco.editor.IMarker[]) => void;

interface EditorProps {
	value?: string;
	options?: monaco.editor.IStandaloneEditorConstructionOptions;
	onChange?: OnChange;
	onMount?: OnMount;
	path?: string;
	language?: string;
}

export function Editor({ value, options, onChange, onMount, path, language }: EditorProps) {
	const divRef = useRef<HTMLDivElement>(null);
	const [editor, setEditor] = useState<monaco.editor.IStandaloneCodeEditor>();
	useEffect(() => {
		if(divRef.current != null) {
			setEditor(
				monaco.editor.create(divRef.current, {
					...options,
					value,
					language,
				})
			);
		}
	}, [divRef]);
	return (
		<div ref={divRef}></div>
	);
}