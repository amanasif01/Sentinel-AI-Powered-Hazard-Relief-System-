/**
 * Utility class to handle date operations similar to Java's LocalDate
 */
class DateUtils {
    static now() {
        return new Date();
    }
    
    static minusDays(date, days) {
        const result = new Date(date);
        result.setDate(result.getDate() - days);
        return result;
    }
    
    static format(date, format) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        
        return format
            .replace('YYYY', year)
            .replace('MM', month)
            .replace('DD', day);
    }
    
    static equals(date1, date2) {
        return date1.getFullYear() === date2.getFullYear() &&
               date1.getMonth() === date2.getMonth() &&
               date1.getDate() === date2.getDate();
    }
    
    static parse(dateString) {
        // Parse date in YYYY-MM-DD format
        const [year, month, day] = dateString.split('-').map(Number);
        return new Date(year, month - 1, day); // month is 0-indexed in JS
    }
}

module.exports = DateUtils;
