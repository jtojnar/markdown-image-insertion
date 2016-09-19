'use babel';

import {CompositeDisposable} from 'atom';
import {dialog, getCurrentWindow} from 'remote';
import {dirname, relative} from 'path';
import format from 'string-format';

export default {
	subscriptions: null,

	activate(state) {
		// Events subscribed to in atom's system can be easily cleaned up with a CompositeDisposable
		this.subscriptions = new CompositeDisposable();

		this.subscriptions.add(atom.commands.add('atom-workspace', {
			'markdown-image-insertion:insert-images': () => this.insertImages()
		}));
	},

	deactivate() {
		this.subscriptions.dispose();
	},

	insertImages() {
		let editor = atom.workspace.getActiveTextEditor();

		if (editor === undefined) {
			dialog.showMessageBox(getCurrentWindow(), {
				'type': 'warning',
				'message': 'No editor window selected.',
				'detail': 'Try opening a file or creating a new one.',
				'buttons': ['OK']
			});

			return;
		}

		let file = editor.getPath();
		const imageCode = atom.config.get('markdown-image-insertion.general.imageCode');
		const fixSlashes = atom.config.get('markdown-image-insertion.general.fixSlashes');
		const wrappingMode = atom.config.get('markdown-image-insertion.wrapping.mode');
		const wrappingPrologue = atom.config.get('markdown-image-insertion.wrapping.prologue');
		const wrappingEpilogue = atom.config.get('markdown-image-insertion.wrapping.epilogue');

		let options = {
			properties: ['openFile', 'multiSelections'],
			filters: [
				{name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'gif']},
				{name: 'All Files', extensions: ['*']}
			]
		};

		if (file) {
			options.defaultPath = dirname(file);
		}

		let images = dialog.showOpenDialog(options);

		if (images) {
			if (file) {
				images = images.map(old => relative(options.defaultPath, old));
			}

			const wrappingEnabled = wrappingMode == 'zero' || (wrappingMode == 'multiple' && images.length > 1);
			let text = wrappingEnabled ? wrappingPrologue : '';

			for (let image of images) {
				if (fixSlashes) {
					image = image.replace('\\', '/');
				}
				text += format(imageCode, {url: image});
			}

			text += wrappingEnabled ? wrappingEpilogue : '';

			editor.insertText(text);
		}
	},

	config: {
		general: {
			title: 'General',
			type: 'object',
			properties: {
				imageCode: {
					title: 'Image code',
					description: '`{url}` will be replaced by the image’s relative path to the document; use `{{` and `}}` for writing curly braces.',
					type: 'string',
					order: 1,
					default: '![]({url})\n'
				},
				fixSlashes: {
					title: 'Replace backslashes in paths with forward slashes',
					type: 'boolean',
					order: 2,
					default: true
				}
			}
		},
		wrapping: {
			title: 'Wrap inserted code',
			type: 'object',
			properties: {
				mode: {
					title: 'Enabled',
					description: 'Additional code can be inserted before and after the inserted code.',
					type: 'string',
					order: 1,
					default: 'infinity',
					enum: [
						{value: 'infinity', description: 'Never'},
						{value: 'multiple', description: 'When there is more than one image'},
						{value: 'zero', description: 'Always'}
					]
				},
				prologue: {
					title: 'Prologue',
					type: 'string',
					order: 2,
					default: '<div class="figuregroup">\n'
				},
				epilogue: {
					title: 'Epilogue',
					type: 'string',
					order: 3,
					default: '</div>\n'
				}
			}
		}
	}
};
