import http from "@/axios/index.js";

export function tagAdd(name, color) {
    return http.post('/tag/add', {name, color})
}

export function tagUpdate(tagId, name, color, sort) {
    return http.put('/tag/update', {tagId, name, color, sort})
}

export function tagDelete(tagId) {
    return http.delete('/tag/delete', {params: {tagId}})
}

export function tagList() {
    return http.get('/tag/list')
}
