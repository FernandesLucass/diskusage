import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import { createDiskMenu } from './diskMenu.js';

export default class DiskUsageExtension extends Extension {
    enable() {
        const settings = this.getSettings('org.gnome.shell.extensions.diskusage');
        this._indicator = createDiskMenu(settings);
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        if (this._indicator) {
            this._indicator.destroy();
            this._indicator = null;
        }
    }
}