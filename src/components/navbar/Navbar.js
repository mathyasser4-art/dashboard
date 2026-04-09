import React from 'react';
import { Link } from 'react-router-dom';
import logo from '../../logo.png'
import '../../reusable.css'
import './Navbar.css'

const Navbar = () => {

    return (
        <nav>
            <div className='nav-container d-flex justify-content-space-between align-items-center'>
                <Link to={'/questionType'}><img src={logo} alt="" /></Link>
                <div className='d-flex align-items-center school'>
                    <Link to={'/users'}><i class="fa fa-user" aria-hidden="true"></i></Link>
                    <Link to={'/school'}><i class="fa fa-graduation-cap" aria-hidden="true"></i></Link>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
