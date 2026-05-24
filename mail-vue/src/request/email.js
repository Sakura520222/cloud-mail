import http from '@/axios/index.js';

export function emailList(accountId, allReceive, emailId, timeSort, size, type) {
    return http.get('/email/list', {params: {accountId, allReceive, emailId, timeSort, size, type}})
}

export function emailDelete(emailIds) {
    return http.delete('/email/delete?emailIds=' + emailIds)
}

export function emailLatest(emailId, accountId, allReceive) {
    return http.get('/email/latest', {params: {emailId, accountId, allReceive}, noMsg: true, timeout: 35 * 1000})
}

export function emailRead(emailIds) {
    return http.put('/email/read', {emailIds})
}

export function emailSend(form,progress) {
    return http.post('/email/send', form,{
        onUploadProgress: (e) => {
            progress(e)
        },
        noMsg: true
    })
}

export function emailMoveFolder(emailIds, folderId) {
    return http.put('/email/move-folder', {emailIds, folderId})
}

export function emailSetTags(emailId, tagIds) {
    return http.put('/email/set-tags', {emailId, tagIds})
}

export function emailListByFolder(folderId, emailId, size) {
    return http.get('/email/list-by-folder', {params: {folderId, emailId, size}})
}

export function emailListByTag(tagId, emailId, size) {
    return http.get('/email/list-by-tag', {params: {tagId, emailId, size}})
}