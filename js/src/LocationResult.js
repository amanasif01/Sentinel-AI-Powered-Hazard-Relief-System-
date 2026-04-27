/**
 * Data class to hold location search results
 */
class LocationResult {
    constructor(displayName, latitude, longitude, country, state) {
        this.displayName = displayName;
        this.latitude = latitude;
        this.longitude = longitude;
        this.country = country;
        this.state = state;
    }
    
    getDisplayName() {
        return this.displayName;
    }
    
    getLatitude() {
        return this.latitude;
    }
    
    getLongitude() {
        return this.longitude;
    }
    
    getCountry() {
        return this.country;
    }
    
    getState() {
        return this.state;
    }
    
    /**
     * Get a short display name for the location
     */
    getShortName() {
        if (this.state && this.state !== '' && this.country && this.country !== '') {
            return this.state + ', ' + this.country;
        } else if (this.country && this.country !== '') {
            return this.country;
        } else {
            // Extract the first part of the display name
            const parts = this.displayName.split(',');
            return parts[0].trim();
        }
    }
    
    toString() {
        return `LocationResult{displayName='${this.displayName}', lat=${this.latitude.toFixed(4)}, lon=${this.longitude.toFixed(4)}, country='${this.country}', state='${this.state}'}`;
    }
}

module.exports = LocationResult;
