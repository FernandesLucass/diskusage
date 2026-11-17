import Gio from 'gi://Gio';

function formatSize(bytes, isTotal = false) {
    if (bytes === 0) return '0 B';
    const k = 1000; // Base 10 padrão do GNOME
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    let i = Math.floor(Math.log(bytes) / Math.log(k));
    let value = bytes / Math.pow(k, i);

    // Arredondamento para a capacidade TOTAL do disco
    if (isTotal) {
        if (sizes[i] === 'GB' && value >= 950) {
            value = 1;
            i++; // Sobe a unidade de GB para TB
        } else if (sizes[i] === 'TB' && value >= 1.0 && value <= 1.05) {
            value = 1;
        }
    }

    return (value % 1 === 0 ? value : value.toFixed(1)) + ' ' + sizes[i];
}

function executeCommandAsync(commandArray) {
    return new Promise((resolve, reject) => {
        try {
            let proc = Gio.Subprocess.new(commandArray, Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE);
            
            proc.communicate_utf8_async(null, null, (proc, res) => {
                try {
                    let [, stdout, stderr] = proc.communicate_utf8_finish(res);
                    if (proc.get_successful()) {
                        resolve(stdout);
                    } else {
                        reject(new Error(stderr || 'Erro no comando'));
                    }
                } catch (e) {
                    reject(e);
                }
            });
        } catch (e) {
            reject(e);
        }
    });
}

export async function getDiskUsage() {
    try {
        const [dfOutput, lsblkOutput] = await Promise.all([
            executeCommandAsync(['df', '-B1', '--output=source,fstype,size,used,avail,pcent,target']),
            executeCommandAsync(['lsblk', '-J', '-o', 'NAME,TYPE,FSTYPE,LABEL,MOUNTPOINTS'])
        ]);

        const devices = JSON.parse(lsblkOutput).blockdevices || [];
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
                
                const totalBytes = Number(fields[2]);
                const availableBytes = Number(fields[4]);

                return {
                    device: fields[0],
                    percentage: parseInt(fields[5], 10),
                    mountpoint,
                    name: labels.get(mountpoint) || (mountpoint === '/' ? 'Ubuntu' : mountpoint),
                    totalStr: formatSize(totalBytes, true), // Passamos true para arredondar o total
                    availableStr: formatSize(availableBytes) // O espaço livre continua exato
                };
            })
            .filter(disk => disk.device.startsWith('/dev/') && disk.totalStr !== '0 B' && disk.mountpoint !== '/boot/efi' && !disk.mountpoint.startsWith('/snap/'));
    } catch (error) {
        console.error(`Erro ao buscar discos: ${error}`);
        return [];
    }
}