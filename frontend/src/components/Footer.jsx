import React from "react";
import { Link } from "react-router-dom";
import "../styles/footer.css";

export default function Footer() {
    const year = new Date().getFullYear();

    return (
        <footer className="ao-footer">
            <div className="ao-footer__top">
                <div className="ao-footer__container">
                    {/* Brand */}
                    <div className="ao-footer__col ao-footer__brand">
                        <div className="ao-footer__logo">
                            <span className="ao-footer__logoDot" />
                            <span className="ao-footer__logoText">ALLOFFICE</span>
                        </div>
                        <p className="ao-footer__desc">
                            Office supplies + printing services in one modern place. Fast browsing,
                            clean checkout, and reliable quality.
                        </p>

                        <div className="ao-footer__chips">
                            <span className="ao-chip">Office Products</span>
                            <span className="ao-chip">Printing</span>
                            <span className="ao-chip">Offers</span>
                        </div>
                    </div>

                    {/* Links */}
                    <div className="ao-footer__col">
                        <h4 className="ao-footer__title">Quick Links</h4>
                        <ul className="ao-footer__list">
                            <li><Link to="/" className="ao-footer__link">Home</Link></li>
                            <li><Link to="/products/office" className="ao-footer__link">Products</Link></li>
                            <li><Link to="/offers" className="ao-footer__link">Offers</Link></li>
                            <li><Link to="/orders" className="ao-footer__link">Orders</Link></li>
                        </ul>
                    </div>

                    {/* Services */}
                    <div className="ao-footer__col">
                        <h4 className="ao-footer__title">Services</h4>
                        <ul className="ao-footer__list">
                            <li><Link to="/products/office" className="ao-footer__link">Office Supplies</Link></li>
                            <li><Link to="/products/printing" className="ao-footer__link">Printing Services</Link></li>
                            <li><Link to="/offers" className="ao-footer__link">Discount Offers</Link></li>
                            <li><Link to="/products/printing" className="ao-footer__link">Custom Printing</Link></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div className="ao-footer__col">
                        <h4 className="ao-footer__title">Contact</h4>

                        <div className="ao-footer__contact">
                            <div className="ao-contactRow">
                                <span className="ao-ico">✉</span>
                                <a
                                    className="ao-about__devBtn"
                                    href="https://mail.google.com/mail/?view=cm&fs=1&to=adam.radi.2006@gmail.com&su=ALLOFFICE%20Development%20Request&body=Hello%20ALLOFFICE%2C%0A%0AI%20need%20a%20development%20service.%0A%0ADetails%3A%20..."
                                    target="_blank"
                                    rel="noreferrer"

                                >developer services</a>
                            </div>
                            <div className="ao-contactRow">
                                <span className="ao-ico">☎</span>
                                <span>+212 661-615827</span>
                            </div>
                            <div className="ao-contactRow">
                                <span className="ao-ico">📍</span>
                                <a
                                    href="https://maps.app.goo.gl/ad2qSpnJ4ue5fkLa9?g_st=aw"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ao-about__devBtn"
                                >
                                    Morocco,Nador,AllOffice
                                </a>

                            </div>
                        </div>

                        <div className="ao-footer__social">
                            <div className="ao-footer__social">
                                <a className="ao-social" href="https://www.facebook.com/" target="_blank" rel="noreferrer" aria-label="Facebook" > f </a>
                                <a className="ao-social" href="https://www.instagram.com/" target="_blank" rel="noreferrer" aria-label="Instagram" > ig </a>

                                <a
                                    href="https://www.linkedin.com/in/adam-radi-52a2b1391?utm_source=share&utm_campaign=share_via&utm_content=profile&utm_medium=android_app"
                                    target="_blank"
                                    rel="noreferrer"
                                    className="ao-social" >in</a>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="ao-footer__bottom">
                    <div className="ao-footer__container ao-footer__bottomInner">
                        <p className="ao-footer__copy">© {year} ALLOFFICE. All rights reserved.</p>
                        <div className="ao-footer__miniLinks">
                            <Link to="/privacy" className="ao-footer__miniLink">Privacy</Link>
                            <span className="ao-sep">•</span>
                            <Link to="/terms" className="ao-footer__miniLink">Terms</Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
}
