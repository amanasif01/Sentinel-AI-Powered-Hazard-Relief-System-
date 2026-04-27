import React, { useState } from 'react';
import { ngoData } from '../data/NGOData';
import './NGODonations.css';

const NGODonations = ({ onBack }) => {
    const [activeCategory, setActiveCategory] = useState(Object.keys(ngoData)[0]);

    const categories = Object.keys(ngoData);

    return (
        <div className="ngo-donations-container">
            <div className="ngo-header">
                <button className="back-button" onClick={onBack}>
                    <i className="fas fa-arrow-left"></i> Back
                </button>
                <h1><i className="fas fa-hand-holding-heart"></i> NGO Donations</h1>
                <p>Support verified organizations making a difference.</p>
            </div>

            <div className="category-tabs">
                {categories.map(category => (
                    <button
                        key={category}
                        className={`category-tab ${activeCategory === category ? 'active' : ''}`}
                        onClick={() => setActiveCategory(category)}
                    >
                        {category}
                    </button>
                ))}
            </div>

            <div className="ngo-list">
                {ngoData[activeCategory].map(ngo => (
                    <div key={ngo.id} className="ngo-card">
                        <div className="ngo-image" style={{ backgroundImage: `url(${ngo.image})` }}></div>
                        <div className="ngo-content">
                            <h3>{ngo.name}</h3>
                            <p className="description">{ngo.description}</p>

                            <div className="contact-info">
                                <div className="info-item">
                                    <i className="fas fa-envelope"></i>
                                    <span>{ngo.email}</span>
                                </div>
                                <div className="info-item">
                                    <i className="fas fa-phone"></i>
                                    <span>{ngo.phone}</span>
                                </div>
                                {ngo.website && (
                                    <div className="info-item">
                                        <i className="fas fa-globe"></i>
                                        <a href={ngo.website} target="_blank" rel="noopener noreferrer">Visit Website</a>
                                    </div>
                                )}
                            </div>

                            {ngo.donationUrl && (
                                <a href={ngo.donationUrl} target="_blank" rel="noopener noreferrer" className="donate-btn">
                                    <i className="fas fa-heart"></i> Donate Now
                                </a>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default NGODonations;
