import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export const Callback = () => {
    let [searchParams, setSearchParams] = useSearchParams();
    let code = searchParams.get('code');
    // console.log(code);
    const navigate = useNavigate()

    axios.post('http://localhost:8080/access/token', {
        code: code
    }).then((resp) => {
        localStorage.setItem('access_token', resp?.data?.access_token)
        toast.success("Authorized successfully");
        navigate('/monday/app')
    }, (error) => {
        toast.error(error?.response?.data?.error);
        navigate('/')
    })



    return (
        <div>
            <ToastContainer />
        </div>
    )
}
