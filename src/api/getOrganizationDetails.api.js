const BASE_URL = 'https://backend-production-6752.up.railway.app/organization'

export const getOrganizationDetails = async (orgID) => {
    try {
        const response = await fetch(`${BASE_URL}/getOrganizationDetails/${orgID}`, {
            method: 'get',
            headers: { 'Content-Type': 'application/json' }
        })
        return await response.json()
    } catch (error) {
        console.error('Error fetching org details:', error)
        return { message: error.message }
    }
}

export const getOrgTeachers = async (orgID, schoolID = '') => {
    try {
        const query = schoolID ? `?schoolID=${encodeURIComponent(schoolID)}` : ''
        const response = await fetch(`${BASE_URL}/getOrgTeachers/${orgID}${query}`, {
            method: 'get',
            headers: { 'Content-Type': 'application/json' }
        })
        return await response.json()
    } catch (error) {
        console.error('Error fetching org teachers:', error)
        return { message: error.message, teachers: [] }
    }
}

export const getOrgStudents = async (orgID, schoolID = '') => {
    try {
        const query = schoolID ? `?schoolID=${encodeURIComponent(schoolID)}` : ''
        const response = await fetch(`${BASE_URL}/getOrgStudents/${orgID}${query}`, {
            method: 'get',
            headers: { 'Content-Type': 'application/json' }
        })
        return await response.json()
    } catch (error) {
        console.error('Error fetching org students:', error)
        return { message: error.message, students: [] }
    }
}

export const getOrgClasses = async (orgID, schoolID = '') => {
    try {
        const query = schoolID ? `?schoolID=${encodeURIComponent(schoolID)}` : ''
        const response = await fetch(`${BASE_URL}/getOrgClasses/${orgID}${query}`, {
            method: 'get',
            headers: { 'Content-Type': 'application/json' }
        })
        return await response.json()
    } catch (error) {
        console.error('Error fetching org classes:', error)
        return { message: error.message, classes: [] }
    }
}
