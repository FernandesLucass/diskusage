import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { getDiskUsage } from './diskUsage.js';

export default class DiskUsagePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings('org.gnome.shell.extensions.diskusage');
        
        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({
            title: 'Ordem dos Discos',
            description: 'Defina a ordem em que os discos aparecem no painel.'
        });
        
        page.add(group);

        // Guarda as linhas que criamos para não tentar apagar a estrutura interna do Adw
        let addedRows = [];

        const updateUI = () => {
            // Remove apenas as linhas dos discos
            addedRows.forEach(row => group.remove(row));
            addedRows = [];

            const disks = getDiskUsage();
            let savedOrder = settings.get_strv('disk-order');

            const currentMounts = disks.map(d => d.mountpoint);
            const missing = currentMounts.filter(m => !savedOrder.includes(m));
            
            if (missing.length > 0) {
                savedOrder = savedOrder.concat(missing);
                settings.set_strv('disk-order', savedOrder);
            }

            savedOrder = savedOrder.filter(m => currentMounts.includes(m));

            savedOrder.forEach((mountpoint, index) => {
                const disk = disks.find(d => d.mountpoint === mountpoint);
                if (!disk) return;

                const row = new Adw.ActionRow({
                    title: disk.name,
                    subtitle: mountpoint,
                });

                const box = new Gtk.Box({
                    orientation: Gtk.Orientation.HORIZONTAL,
                    spacing: 8,
                    valign: Gtk.Align.CENTER
                });

                const btnUp = new Gtk.Button({
                    icon_name: 'go-up-symbolic',
                    css_classes: ['flat'],
                    sensitive: index > 0
                });
                
                const btnDown = new Gtk.Button({
                    icon_name: 'go-down-symbolic',
                    css_classes: ['flat'],
                    sensitive: index < savedOrder.length - 1
                });

                btnUp.connect('clicked', () => {
                    const temp = savedOrder[index - 1];
                    savedOrder[index - 1] = savedOrder[index];
                    savedOrder[index] = temp;
                    settings.set_strv('disk-order', savedOrder);
                    updateUI();
                });

                btnDown.connect('clicked', () => {
                    const temp = savedOrder[index + 1];
                    savedOrder[index + 1] = savedOrder[index];
                    savedOrder[index] = temp;
                    settings.set_strv('disk-order', savedOrder);
                    updateUI();
                });

                box.append(btnUp);
                box.append(btnDown);
                row.add_suffix(box);
                
                group.add(row);
                addedRows.push(row);
            });
        };

        updateUI();
        window.add(page);
    }
}