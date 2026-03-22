import React, { useState, useEffect } from 'react';
import getUsers from '../../api/getUsers.api';
import '../../reusable.css'
import './Users.css'

const Users = () => {
    const [pageLoading, setPageLoading] = useState(false)
    const [allClients, setAllClients] = useState([])
    const [pageNumber, setPageNumber] = useState(1)
    const [totalPage, setTotalPage] = useState(0)

    useEffect(() => {
        handleGetMessages()
    }, [])

    const handleGetMessages = () => {
        getUsers(pageNumber, setPageLoading, setAllClients, setPageNumber, setTotalPage)
    }

    // Pagination func
    const next = () => {
        let page = 0;
        if (pageNumber == totalPage) {
            return;
        }

        page = pageNumber + 1
        setPageNumber(page)
        getUsers(page, setPageLoading, setAllClients, setPageNumber, setTotalPage)
    }

    const previous = () => {
        let page = 0;
        if (pageNumber == 1) {
            return;
        }

        page = pageNumber - 1
        setPageNumber(page)
        getUsers(page, setPageLoading, setAllClients, setPageNumber, setTotalPage)
    }
    // Pagination func

    if (pageLoading) return (<div className='loading-container'><div className='d-flex justify-content-center'><span className="page-loader"></span></div></div>)

    return (
        <div className="client-container">
            {allClients.length == 0 ? '' : <>
                <div className='client-table'>
                    <table>
                        <tr>
                            <th>Name</th>
                            <th>email</th>
                            <th>role</th>
                            <th>verify</th>
                        </tr>
                        {allClients.map(client => {
                            return (
                                <tr key={client?._id}>
                                    <td>{client?.userName}</td>
                                    <td>{client?.email}</td>
                                    <td>{client?.role}</td> 
                                    <td>{client.verify ? "true": "false"}</td>  
                                </tr>
                            )
                        })}
                    </table>
                </div>
                <div className="client-pagination">
                    <button onClick={previous}>Previous</button>
                    <button onClick={next}>Next</button>
                </div>
            </>}
        </div>
    );
}

export default Users;