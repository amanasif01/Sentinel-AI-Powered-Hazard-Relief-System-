const config = require('../config');

class MedibotService {
    constructor(hospitalService) {
        this.hospitalService = hospitalService;
        this.systemPrompt = `You are Medibot, an AI First Aid & Medical Assistant.
        Your goal is to provide immediate, safe, and helpful first-aid advice and medical guidance.
        
        RULES:
        1. ALWAYS state that you are an AI and not a doctor.
        2. In emergencies, tell the user to call emergency services immediately.
        3. Keep answers concise, actionable, and easy to understand.
        4. If the user asks for hospitals or medical help, suggest using the "Nearby Hospitals" feature or use your tool to find them.
        5. Format your response in clean Markdown (lists, bold text).
        
        You have access to a tool called "find_hospitals" if the user explicitly asks for nearby hospitals.
        `;
    }

    /**
     * Get medical advice or guidance
     * @param {string} userQuery - The user's question
     * @param {object} context - User context (location, previous messages)
     */
    async getMedicalAdvice(userQuery, context = {}) {
        if (!config.GROQ_API_KEY || config.GROQ_API_KEY.includes('YourGroqKeyHere')) {
            console.log('⚠️ No Groq API Key found for Medibot');
            return {
                text: "I'm sorry, my AI brain is currently offline. Please configure the API Key.",
                isError: true
            };
        }

        try {
            // Check if user is asking for hospitals
            if (this.isAskingForHospitals(userQuery) && context.location) {
                console.log('🏥 User asked for hospitals regarding:', userQuery);
                const hospitals = await this.hospitalService.findHospitals(
                    context.location.lat,
                    context.location.lon,
                    5000 // 5km radius
                );

                let responseText = "Here are some medical facilities near you:\n\n";
                if (hospitals.length > 0) {
                    hospitals.slice(0, 3).forEach(h => {
                        if (h.latitude && h.longitude && !isNaN(h.latitude) && !isNaN(h.longitude)) {
                            let dirLink;
                            if (context.location) {
                                dirLink = `https://www.openstreetmap.org/directions?from=${context.location.lat},${context.location.lon}&to=${h.latitude},${h.longitude}`;
                            } else {
                                dirLink = `https://www.openstreetmap.org/?mlat=${h.latitude}&mlon=${h.longitude}#map=15/${h.latitude}/${h.longitude}`;
                            }
                            responseText += `- **${h.name}** (${h.distanceKm}km away) <br/> [Open in OSM](${dirLink})\n`;
                        } else {
                            responseText += `- **${h.name}** (${h.distanceKm}km away)\n`;
                        }
                    });
                    responseText += "\nYou can view more details in the 'Nearby Hospitals' section.";
                } else {
                    responseText = "I couldn't find any hospitals nearby within 5km. Please call emergency services if this is an emergency.";
                }

                return {
                    text: responseText,
                    relatedAction: 'OPEN_HOSPITALS'
                };
            }

            // Otherwise, ask Llama 3
            const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${config.GROQ_API_KEY}`
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: this.systemPrompt },
                        { role: "user", content: `User Location: ${context.location ? JSON.stringify(context.location) : 'Unknown'}\n\nQuery: ${userQuery}` }
                    ],
                    temperature: 0.5,
                    max_tokens: 500
                })
            });

            if (!response.ok) {
                throw new Error(`Groq API Error: ${response.status}`);
            }

            const result = await response.json();
            return {
                text: result.choices[0].message.content,
                isError: false
            };

        } catch (error) {
            console.error('❌ Medibot Error:', error.message);
            return {
                text: "I'm having trouble connecting to my medical database right now. Please try again or contact a medical professional.",
                isError: true
            };
        }
    }

    isAskingForHospitals(query) {
        const keywords = ['hospital', 'clinic', 'doctor', 'emergency room', 'er', 'ambulance', 'medical center'];
        const q = query.toLowerCase();
        return keywords.some(k => q.includes(k)) && (q.includes('near') || q.includes('find') || q.includes('where'));
    }
}

module.exports = MedibotService;
