import { defineStore } from 'pinia'
import { tagList } from '@/request/tag.js'

export const useTagStore = defineStore('tag', {
    state: () => ({
        tags: [],
        currentTagId: null,
    }),
    actions: {
        async refreshTags() {
            const res = await tagList()
            this.tags = res.data || []
        },
        setCurrentTag(tagId) {
            this.currentTagId = tagId
        },
    },
})
