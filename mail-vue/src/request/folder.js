import http from "@/axios/index.js";

export function folderAdd(name, icon) {
    return http.post('/folder/add', {name, icon})
}

export function folderUpdate(folderId, name, icon, sort) {
    return http.put('/folder/update', {folderId, name, icon, sort})
}

export function folderDelete(folderId) {
    return http.delete('/folder/delete', {params: {folderId}})
}

export function folderList() {
    return http.get('/folder/list')
}
