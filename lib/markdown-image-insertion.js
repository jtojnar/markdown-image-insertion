'use babel';

import {CompositeDisposable} from 'atom';
import {dialog} from 'remote';
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
		let file = editor.getPath();

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

			let text = '';

			for (let image of images) {
				text += format(atom.config.get('markdown-image-insertion.imageCode'), {url: image});
			}

			editor.insertText(text);
		}
	},

	config: {
		imageCode: {
			title: 'Image code',
			description: '`{url}` will be replaced by the image’s relative path to the document; use `{{` and `}}` for writing curly braces.',
			type: 'string',
			default: '![]({url})\n'
		}
	}
};
