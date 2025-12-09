import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld(
  'electron',
  {
    auth: {
      login: (credentials) => ipcRenderer.invoke('auth:login', credentials),
    },
    shoes: {
      getAll: () => ipcRenderer.invoke('shoes:getAll'),
      add: (name) => ipcRenderer.invoke('shoes:add', name),
      update: (data) => ipcRenderer.invoke('shoes:update', data),
    },
    subcategories: {
      getAll: () => ipcRenderer.invoke('subcategories:getAll'),
    },
    subshoes: {
      getByShoeId: (shoeId) => ipcRenderer.invoke('subshoes:getByShoeId', shoeId),
      add: (data) => ipcRenderer.invoke('subshoes:add', data),
      update: (data) => ipcRenderer.invoke('subshoes:update', data),
      delete: (id) => ipcRenderer.invoke('subshoes:delete', id),
    }
  }
);