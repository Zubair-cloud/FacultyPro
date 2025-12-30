// FacultyPro - Tailwind CSS Configuration
// Extracted from attendance.html for modular architecture

try {
            tailwind.config = {
                darkMode: "class",
                theme: {
                    extend: {
                        colors: {
                            "primary": "#4A90E2",
                            "primary-dark": "#2E5BFF",
                            "accent": "#D0021B",
                            "background-light": "#F4F6F8",
                            "background-dark": "#101622",
                            "surface": "rgba(255, 255, 255, 0.05)"
                        },
                        fontFamily: {
                            "display": ["Lexend", "sans-serif"]
                        },
                        borderRadius: { "DEFAULT": "0.5rem", "lg": "0.75rem", "xl": "1rem", "2xl": "1.5rem", "full": "9999px" },
                    },
                },
            }
        } catch (e) { console.log("Tailwind loaded later"); }