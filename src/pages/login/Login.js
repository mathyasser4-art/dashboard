import React, { useState } from 'react';
import login from '../../api/login.api'
import '../../reusable.css'
import './Login.css'

const Login = () => {
    const [loading, setLoading] = useState(false)
    const [serverError, setServerError] = useState(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')

    const auth = () => {
        setServerError(null)
        if (email === '' || password === '') {
            setServerError('Email and Password is required!')
        } else {
            const userData = {
                email,
                password
            }
            login(userData, setServerError, setLoading)
        }

    }

    return (
        <div className='login d-flex justify-content-center align-items-center'>
            <div>
                {(serverError) ? <p>{serverError}</p> : ''}
                <input type="email" placeholder='Email' onChange={e => setEmail(e.target.value)} />
                <input type="password" placeholder='password' onChange={e => setPassword(e.target.value)} />
                <button className='button' onClick={auth}>{(loading) ? <span className="button-loader"></span> : 'Login'}</button>
            </div>
        </div>
    );
}

export default Login;