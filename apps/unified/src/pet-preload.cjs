const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('petAPI', {
  getAllPets: () => ipcRenderer.invoke('pets:getAll'),
  getCurrentPet: () => ipcRenderer.invoke('pets:getCurrent'),
  getI18n: () => ipcRenderer.invoke('pets:getI18n'),
  onPetSwitch: (cb) =>
    ipcRenderer.on('pet:switch', (_e, data) => cb(data)),
  onPetAction: (cb) =>
    ipcRenderer.on('pet:action', (_e, data) => cb(data)),
  onI18nUpdate: (cb) =>
    ipcRenderer.on('pet:i18n-update', (_e, data) => cb(data)),
  dragStart: () => ipcRenderer.send('pet:drag-start'),
  dragEnd: () => ipcRenderer.send('pet:drag-end'),
  moveBy: (dx, dy) => ipcRenderer.send('pet:move-by', dx, dy),
  hidePet: () => ipcRenderer.send('pet:hide'),
  quitApp: () => ipcRenderer.send('app:quit'),
});
