import { defineStore } from 'pinia'
import { folderList } from '@/request/folder.js'

export const useFolderStore = defineStore('folder', {
    state: () => ({
        folders: [],
        currentFolderId: null,
    }),
    actions: {
        async refreshFolders() {
            const res = await folderList()
            this.folders = res || []
        },
        setCurrentFolder(folderId) {
            this.currentFolderId = folderId
        },
    },
})
