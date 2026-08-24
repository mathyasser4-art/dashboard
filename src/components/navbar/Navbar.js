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
                    <Link to={'/users'} title="Users"><i className="fa fa-user" aria-hidden="true"></i></Link>
                    <Link to={'/organization'} title="Organizations &amp; Multi-School Groups"><i className="fa fa-sitemap" aria-hidden="true"></i></Link>
                    <Link to={'/school'} title="Schools"><i className="fa fa-graduation-cap" aria-hidden="true"></i></Link>
                </div>
            </div>
        </nav>
    );
}

export default Navbar;
