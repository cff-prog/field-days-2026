document.addEventListener('DOMContentLoaded', () => {
    const themeToggleBtn = document.getElementById('theme-toggle');
    const greetBtn = document.getElementById('greet-btn');
    const greetingMessage = document.getElementById('greeting-message');

    // Theme toggling logic
    const savedTheme = localStorage.getItem('theme');
    const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = '☀️ Light Mode';
    } else {
        document.documentElement.setAttribute('data-theme', 'light');
        themeToggleBtn.textContent = '🌙 Dark Mode';
    }

    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = document.documentElement.getAttribute('data-theme');
        let newTheme = 'light';
        if (currentTheme === 'light') {
            newTheme = 'dark';
            themeToggleBtn.textContent = '☀️ Light Mode';
        } else {
            themeToggleBtn.textContent = '🌙 Dark Mode';
        }
        document.documentElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // Greeting logic
    const greetings = [
        "Hello, World! Welcome aboard! 🚀",
        "Greetings from GitHub Pages! 🌐",
        "Hope you have a fantastic day! ✨",
        "Happy Coding! 💻",
        "Static sites are awesome! ⚡"
    ];

    let greetingIndex = 0;

    greetBtn.addEventListener('click', () => {
        greetingMessage.textContent = greetings[greetingIndex];
        greetingIndex = (greetingIndex + 1) % greetings.length;
    });
});
