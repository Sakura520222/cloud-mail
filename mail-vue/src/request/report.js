import http from '@/axios/index.js'

export function getReportData(year, month, timeZone, scope = 'user') {
    return http.get('/report/data', { params: { year, month, timeZone, scope } });
}

export function refreshReport(year, month, timeZone, scope = 'user') {
    return http.post('/report/refresh', { year, month, timeZone, scope });
}
