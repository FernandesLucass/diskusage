import GLib from 'gi://GLib';

function executeCommand(command) {
    const [ok, stdout, stderr, exitStatus] = GLib.spawn_command_line_sync(command);
    if (!ok || exitStatus !== 0) {
        throw new Error(`Falha ao executar: ${command}`);
    }
    return new TextDecoder().decode(stdout);
}

export function getDiskUsage() {
    const dfOutput = executeCommand('df -B1 --output=source,fstype,size,used,avail,pcent,target');
    const lsblkOutput = executeCommand('lsblk -J -o NAME,TYPE,FSTYPE,LABEL,MOUNTPOINTS');

    const devices = JSON.parse(lsblkOutput).blockdevices;
    const labels = new Map();

    function collectLabels(deviceList) {
        for (const device of deviceList) {
            if (device.mountpoints) {
                for (const mountpoint of device.mountpoints) {
                    if (mountpoint) labels.set(mountpoint, device.label);
                }
            }
            if (device.children) collectLabels(device.children);
        }
    }
    
    collectLabels(devices);

    const lines = dfOutput.trim().split('\n');
    return lines.slice(1)
        .map(line => {
            const fields = line.trim().split(/\s+/);
            const mountpoint = fields.slice(6).join(' ');
            return {
                device: fields[0],
                total: Number(fields[2]),
                used: Number(fields[3]),
                available: Number(fields[4]),
                percentage: parseInt(fields[5], 10),
                mountpoint,
                name: labels.get(mountpoint) || (mountpoint === '/' ? 'Ubuntu' : mountpoint),
            };
        })
        .filter(disk => disk.device.startsWith('/dev/') && disk.total > 0 && disk.mountpoint !== '/boot/efi' && !disk.mountpoint.startsWith('/snap/'));
}