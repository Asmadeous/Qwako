import { useState, useEffect, useContext } from 'react';

import { UserContext } from '@/providers/UserProvider';
import { PlaceContext } from '@/providers/PlaceProvider';

import { getItemFromLocalStorage, removeItemFromLocalStorage } from '@/utils';
import axiosInstance, { api } from '@/utils/axios';

// USER
export const useAuth = () => {
    return useContext(UserContext)
}

const NETWORK_ERROR = 'Could not reach the server. Check your connection and try again.'

// Normalises a Rails API error into { success: false, code, message, fieldErrors }.
const authFailure = (error) => {
    const apiError = error.response?.data?.error
    if (!apiError) {
        return { success: false, code: 'network_error', message: NETWORK_ERROR, fieldErrors: {} }
    }
    const fieldErrors = Object.fromEntries(
        Object.entries(apiError.details || {}).map(([field, messages]) => [field, messages.join(' ')])
    )
    return { success: false, code: apiError.code, message: apiError.message, fieldErrors }
}

export const useProvideAuth = () => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Auth used to live in localStorage; the session cookie replaces it.
        removeItemFromLocalStorage('user')
        removeItemFromLocalStorage('token')

        let cancelled = false
        api.get('/session')
            .then(({ data }) => { if (!cancelled) setUser(data.user) })
            .catch(() => { if (!cancelled) setUser(null) })
            .finally(() => { if (!cancelled) setLoading(false) })
        return () => { cancelled = true }
    }, [])

    const register = async ({ name, email, password }) => {
        try {
            const { data } = await api.post('/registrations', { user: { name, email, password } })
            setUser(data.user)
            return { success: true, message: 'Welcome to T&G BnB. You are signed in.' }
        } catch (error) {
            return authFailure(error)
        }
    }

    const login = async ({ email, password }) => {
        try {
            const { data } = await api.post('/session', { email, password })
            setUser(data.user)
            return { success: true, message: 'Signed in.' }
        } catch (error) {
            return authFailure(error)
        }
    }

    const logout = async () => {
        try {
            await api.delete('/session')
            setUser(null)
            return { success: true, message: 'Signed out.' }
        } catch (error) {
            return authFailure(error)
        }
    }

    const uploadPicture = async (picture) => {
        try {
            const formData = new FormData()
            formData.append('picture', picture)
            const { data } = await axiosInstance.post('/user/upload-picture', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            })
            return data
        } catch (error) {
            console.log(error)
        }
    }

    const updateUser = async (userDetails) => {
        const { name, password, picture } = userDetails;
        const email = JSON.parse(getItemFromLocalStorage('user')).email
        try {
            const { data } = await axiosInstance.put('/user/update-user', {
                name, password, email, picture
            })
            return data;
        } catch (error) {
            console.log(error)
        }
    }


    return {
        user,
        setUser,
        register,
        login,
        logout,
        loading,
        uploadPicture,
        updateUser
    }
}


// PLACES
export const usePlaces = () => {
    return useContext(PlaceContext)
}

export const useProvidePlaces = () => {
    const [places, setPlaces] = useState([]);
    const [loading, setLoading] = useState(true);

    const getPlaces = async () => {
        const { data } = await axiosInstance.get('/places');
        setPlaces(data.places);
        setLoading(false);
    };

    useEffect(() => {
        getPlaces();
    }, [])

    return {
        places,
        setPlaces,
        loading,
        setLoading
    }
}