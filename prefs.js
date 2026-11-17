import Adw from 'gi://Adw';
import Gtk from 'gi://Gtk';
import { ExtensionPreferences } from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';
import { getDiskUsage } from './diskUsage.js';
import { getTranslation } from './translations.js';

export default class DiskUsagePreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        const settings = this.getSettings('org.gnome.shell.extensions.diskusage');
        const t = getTranslation(settings);
        
        const page = new Adw.PreferencesPage();

        // ---- SESSÃO DE IDIOMA ----
        const langGroup = new Adw.PreferencesGroup({
            title: t.language,
            description: t.languageDesc
        });
        
        const langModel = new Gtk.StringList();
        langModel.append(t.langAuto);
        langModel.append(t.langPT);
        langModel.append(t.langEN);
        
        const langRow = new Adw.ComboRow({
            title: t.language,
            model: langModel
        });
        
        const currentLang = settings.get_string('language');
        langRow.selected = currentLang === 'pt' ? 1 : currentLang === 'en' ? 2 : 0;
        
        langRow.connect('notify::selected', () => {
            const sel = langRow.selected;
            settings.set_string('language', sel === 1 ? 'pt' : sel === 2 ? 'en' : 'auto');
        });
        
        langGroup.add(langRow);
        page.add(langGroup);

        // ---- SESSÃO ORDEM DOS DISCOS ----
        const group = new Adw.PreferencesGroup({
            title: t.diskOrder,
            description: t.diskOrderDesc
        });
        
        page.add(group);

        let addedRows = [];

        const updateUI = async () => {
            addedRows.forEach(row => group.remove(row));
            addedRows = [];

            const disks = await getDiskUsage();
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