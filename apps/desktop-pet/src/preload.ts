const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  getAllPets: () => ipcRenderer.invoke('pets:getAll'),
  getCurrentPet: () => ipcRenderer.invoke('pets:getCurrent'),
  onPetSwitch: (cb: (data: unknown) => void) =>
    ipcRenderer.on('pet:switch', (_e, data) => cb(data)),
  onPetAction: (cb: (data: unknown) => void) =>
    ipcRenderer.on('pet:action', (_e, data) => cb(data)),
  dragStart: () => ipcRenderer.send('pet:drag-start'),
  dragEnd: () => ipcRenderer.send('pet:drag-end'),
  moveBy: (dx: number, dy: number) => ipcRenderer.send('pet:move-by', dx, dy),
});
