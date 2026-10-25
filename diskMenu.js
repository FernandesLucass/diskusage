import St from 'gi://St';
import Clutter from 'gi://Clutter';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';
import { getDiskUsage } from './diskUsage.js';

export function createDiskMenu(settings) {
    const button = new PanelMenu.Button(0.0, 'Disk Usage');
    const icon = new St.Icon({
        icon_name: 'drive-harddisk-symbolic',
        style_class: 'system-status-icon',
    });

    button.add_child(icon);

    function refreshDisks() {
        try {
            button.menu.removeAll();
            let disks = getDiskUsage();

            const savedOrder = settings.get_strv('disk-order');

            disks.sort((a, b) => {
                let indexA = savedOrder.indexOf(a.mountpoint);
                let indexB = savedOrder.indexOf(b.mountpoint);
                
                if (indexA === -1) indexA = 999;
                if (indexB === -1) indexB = 999;
                
                return indexA - indexB;
            });

            if (disks.length === 0) {
                button.menu.addMenuItem(new PopupMenu.PopupMenuItem('Nenhum disco encontrado'));
                return;
            }

            for (const disk of disks) {
                const item = new PopupMenu.PopupBaseMenuItem({
                    reactive: false,
                    can_focus: false,
                });

                const content = new St.BoxLayout({
                    vertical: true,
                    style: 'padding: 8px 12px; width: 220px;',
                });

                const title = new St.Label({
                    text: disk.name,
                    style: 'font-weight: bold;',
                });

                const details = new St.Label({
                    text: `${disk.percentage}% usado · ${(disk.available / 1e9).toFixed(1)} GB livres`,
                    style: 'font-size: 0.9em; padding-top: 4px; padding-bottom: 6px;',
                });

                const barBackground = new St.Widget({
                    style: 'background-color: rgba(128, 128, 128, 0.25); border-radius: 4px; height: 8px;',
                    x_expand: true,
                });

                const color = disk.percentage >= 95 ? '#e01b24' : disk.percentage >= 80 ? '#e5a000' : '#3584e4';
                const bar = new St.Widget({
                    style: `background-color: ${color}; border-radius: 4px; height: 8px;`,
                });
                
                bar.set_width(Math.max(1, (disk.percentage / 100) * 196));

                barBackground.add_child(bar);
                content.add_child(title);
                content.add_child(details);
                content.add_child(barBackground);
                item.add_child(content);
                
                button.menu.addMenuItem(item);
            }
        } catch (error) {
            console.error(`Disk Usage Error: ${error}`);
            button.menu.addMenuItem(new PopupMenu.PopupMenuItem('Erro ao carregar discos'));
        }
    }

    refreshDisks();

    button.menu.connect('open-state-changed', (menu, isOpen) => {
        if (isOpen) refreshDisks();
    });

    return button;
}