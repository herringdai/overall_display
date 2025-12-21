// Content Hub Navigation Logic
(function () {
    'use strict';

    // DOM Elements
    const contentFrame = document.getElementById('contentFrame');
    const navButtons = document.querySelectorAll('.nav-btn');
    const frameContainer = document.querySelector('.frame-container');
    const welcomeScreen = document.querySelector('.welcome-screen');
    const bottomNav = document.querySelector('.bottom-nav');

    // State
    let currentUrl = '';

    /**
     * Initialize the navigation system
     */
    function init() {
        // Add click handlers to all navigation buttons
        navButtons.forEach(button => {
            button.addEventListener('click', handleNavClick);
        });

        // Listen for iframe load events
        contentFrame.addEventListener('load', handleFrameLoad);

        // Prepare welcome animation
        prepareWelcomeAnimation();
    }

    /**
     * Splits the welcome message into characters for staggered animation
     */
    function prepareWelcomeAnimation() {
        const messageEl = document.querySelector('.welcome-message');
        if (!messageEl) return;

        let charIndex = 0;

        function processNode(node) {
            // Text node
            if (node.nodeType === 3) {
                const text = node.textContent;
                if (text.trim().length === 0) return;

                const fragment = document.createDocumentFragment();
                for (let char of text) {
                    if (char === ' ') {
                        fragment.appendChild(document.createTextNode(' '));
                        continue;
                    }
                    if (char === '\n' || char === '\r' || char === '\t') continue;

                    const span = document.createElement('span');
                    const delay = (charIndex++ * 0.03).toFixed(2);
                    span.style.animationDelay = `${delay}s`;
                    span.textContent = char;
                    fragment.appendChild(span);
                }
                node.parentNode.replaceChild(fragment, node);
            }
            // Element node (but NOT character spans we just created or <br>)
            else if (node.nodeType === 1 &&
                node.tagName.toLowerCase() !== 'br' &&
                !node.hasAttribute('style')) {
                Array.from(node.childNodes).forEach(processNode);
            }
        }

        processNode(messageEl);

        // Trigger Dock Jitter after text reveal
        if (bottomNav) {
            const totalDelay = charIndex * 0.03 + 0.6; // 0.03s per char + 0.6s animation duration
            setTimeout(() => {
                bottomNav.classList.add('jitter');
                // Remove class after animation finishes (2.5s) to allow re-triggering if needed
                setTimeout(() => {
                    bottomNav.classList.remove('jitter');
                }, 2500);
            }, totalDelay * 1000);
        }
    }

    /**
     * Handle navigation button clicks
     * @param {Event} event - Click event
     */
    function handleNavClick(event) {
        const button = event.currentTarget;
        const url = button.dataset.url;

        if (!url || url === currentUrl) {
            return;
        }

        // Update active state
        updateActiveButton(button);

        // Load new content
        loadContent(url, button);

        // Haptic feedback (for mobile devices)
        if (navigator.vibrate) {
            navigator.vibrate(10);
        }
    }

    /**
     * Update the active button state
     * @param {HTMLElement} activeButton - The button to set as active
     */
    function updateActiveButton(activeButton) {
        navButtons.forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-current', 'false');
        });

        activeButton.classList.add('active');
        activeButton.setAttribute('aria-current', 'page');
    }

    /**
     * Load content into the iframe
     * @param {string} url - URL to load
     * @param {HTMLElement} button - The button that was clicked
     */
    function loadContent(url, button) {
        // Hide welcome screen
        if (welcomeScreen) {
            welcomeScreen.classList.remove('active');
        }

        // Check if we should skip loading overlay (for first two tabs: index 0 and 1)
        const buttonIndex = Array.from(navButtons).indexOf(button);
        const isFastTab = buttonIndex === 0 || buttonIndex === 1;

        if (isFastTab) {
            frameContainer.classList.remove('loading');
        } else {
            frameContainer.classList.add('loading');
        }

        currentUrl = url;
        contentFrame.src = url;
    }

    /**
     * Handle iframe load completion
     */
    function handleFrameLoad() {
        frameContainer.classList.remove('loading');
    }

    /**
     * Add keyboard navigation support
     */
    function setupKeyboardNavigation() {
        document.addEventListener('keydown', (event) => {
            // Alt/Option + Number (1-5) to switch tabs
            if (event.altKey && event.key >= '1' && event.key <= '5') {
                event.preventDefault();
                const index = parseInt(event.key) - 1;
                if (navButtons[index]) {
                    navButtons[index].click();
                }
            }
        });
    }

    /**
     * Add error handling for iframe loading failures
     */
    function setupErrorHandling() {
        contentFrame.addEventListener('error', () => {
            frameContainer.classList.remove('loading');
            console.error('Failed to load content:', currentUrl);

            // Optionally show an error message to the user
            showErrorMessage();
        });
    }

    /**
     * Show error message when content fails to load
     */
    function showErrorMessage() {
        // Create error overlay
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-overlay';
        errorDiv.innerHTML = `
            <div class="error-content">
                <h2>Unable to Load Content</h2>
                <p>The requested page could not be loaded. Please try again.</p>
            </div>
        `;

        frameContainer.appendChild(errorDiv);

        // Remove after 3 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 3000);
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            init();
            setupKeyboardNavigation();
            setupErrorHandling();
        });
    } else {
        init();
        setupKeyboardNavigation();
        setupErrorHandling();
    }

})();
