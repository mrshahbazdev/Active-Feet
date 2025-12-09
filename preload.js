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
    },
    stock: {
      getAll: () => ipcRenderer.invoke('stock:getAll'),
      add: (data) => ipcRenderer.invoke('stock:add', data),
    },
    production: {
      addComponent: (data) => ipcRenderer.invoke('production:addComponent', data),
      addShoe: (data) => ipcRenderer.invoke('production:addShoe', data),
      getTodayComponent: () => ipcRenderer.invoke('production:getTodayComponent'),
      getTodayShoe: () => ipcRenderer.invoke('production:getTodayShoe'),
    }
  }
);