// FacultyPro - Tailwind CSS Configuration
// Extracted from attendance.html for modular architecture

try {
            tailwind.config = {
                darkMode: "class",
                theme: {
                    extend: {
                        colors: {
                            "primary": "#DEBE63",      // Golden (Neon Source)
                            "primary-dark": "#A47F1E", // Deep Gold
                            "accent": "#5D250D",       // Dark Brown/Maroon
                            "background-light": "#FDF1E2",
                            "background-dark": "#030001", // Near Black
                            "surface": "rgba(222, 190, 99, 0.08)" // Gold Tint
                        },
                        fontFamily: {
                            "display": ["Lexend", "sans-serif"]
                        },
                        borderRadius: { "DEFAULT": "0.5rem", "lg": "0.75rem", "xl": "1rem", "2xl": "1.5rem", "full": "9999px" },
                    },
                },
            }
        } catch (e) { console.log("Tailwind loaded later"); }