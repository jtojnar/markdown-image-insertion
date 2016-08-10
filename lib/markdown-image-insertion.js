'use babel';

import {CompositeDisposable} from 'atom';
import {dialog} from 'remote';
import {dirname, relative} from 'path';

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
				text += '![](' + image + ')\n';
			}

			editor.insertText(text);
		}
	}

};
