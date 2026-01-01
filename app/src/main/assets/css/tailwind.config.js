// FacultyPro - Tailwind CSS Configuration
// Extracted from attendance.html for modular architecture

try {
            tailwind.config = {
                darkMode: "class",
                theme: {
                    extend: {
                        colors: {
                            "primary": "var(--primary)",      // Dynamic Theme Color
                            "primary-dim": "var(--primary-dim)",
                            "accent": "#5D250D",       // Dark Brown/Maroon (Keep fixed or var if needed)
                            "background-light": "#FDF1E2",
                            "background-dark": "var(--bg-surface)", // Dynamic Surface
                            "surface": "var(--primary-dim)" // Use dim for faint surfaces
                        },
                        fontFamily: {
                            "display": ["Lexend", "sans-serif"]
                        },
                        borderRadius: { "DEFAULT": "0.5rem", "lg": "0.75rem", "xl": "1rem", "2xl": "1.5rem", "full": "9999px" },
                    },
                },
            }
        } catch (e) { console.log("Tailwind loaded later"); }