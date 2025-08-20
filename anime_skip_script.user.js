// ==UserScript==
// @name         Anime365 Skip Opening
// @namespace    https://github.com/Lo373883/
// @version      1.0
// @description  Автоматически пропускает заставку на Anime365
// @author       ildys2.0
// @match       https://smotret-anime.org/*
// @match       https://anime365.ru/*
// @match       https://anime-365.ru/*
// @match       https://hentai365.ru/*
// @match       https://smotret-anime.online/*
// @match       https://smotret-anime.com/*
// @grant        none
// @license      MIT
// ==/UserScript==

(function() {
    'use strict';

    // ===== НАСТРОЙКИ =====
    const SKIP_OPTIONS = [60, 75, 90, 95, 105, 120, 150];
    let currentSkipIndex = 2;
    let SKIP_TIME = SKIP_OPTIONS[currentSkipIndex];
    // =====================

    let skipButton = null;
    let hideTimeout = null;
    let isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    let longPressTimer = null;

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }

    function isFullscreenMode() {
        return !!(document.fullscreenElement ||
                 document.webkitFullscreenElement ||
                 document.mozFullScreenElement ||
                 document.msFullscreenElement);
    }

    function shouldShowButton() {
        if (!isMobileDevice) return true;
        return isFullscreenMode();
    }

    function updateButtonVisibility() {
        if (!skipButton) return;

        if (shouldShowButton()) {
            skipButton.style.display = 'inline-block';
        } else {
            skipButton.style.display = 'none';
        }
    }

    function createSkipButton() {
        const button = document.createElement('button');
        updateButtonText(button);
        button.setAttribute('data-skip-button', 'true');

        const isFullscreen = isFullscreenMode();

        button.style.cssText = `
            position: absolute !important;
            bottom: ${isFullscreen ? '15px' : '10px'} !important;
            left: ${isFullscreen ? '120px' : '100px'} !important;
            z-index: 9999 !important;
            background: rgba(255, 255, 255, 0.12) !important;
            color: rgba(255, 255, 255, 0.95) !important;
            border: 1px solid rgba(255, 255, 255, 0.25) !important;
            border-radius: 3px !important;
            padding: 3px 8px !important;
            font-size: ${isFullscreen ? '12px' : '11px'} !important;
            font-weight: 500 !important;
            cursor: pointer !important;
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
            transition: all 0.15s ease !important;
            white-space: nowrap !important;
            user-select: none !important;
            display: ${shouldShowButton() ? 'inline-block' : 'none'} !important;
            opacity: 0 !important;
            visibility: hidden !important;
            margin: 0 !important;
            line-height: 1.4 !important;
            height: auto !important;
            text-shadow: none !important;
            letter-spacing: 0.2px !important;
            backdrop-filter: blur(2px) !important;
            -webkit-backdrop-filter: blur(2px) !important;
            min-width: 85px !important;
            text-align: center !important;
        `;

        button.addEventListener('mouseenter', () => {
            button.style.background = 'rgba(255, 255, 255, 0.2) !important';
            button.style.color = '#fff !important';
            button.style.borderColor = 'rgba(255, 255, 255, 0.4) !important';
        });

        button.addEventListener('mouseleave', () => {
            button.style.background = 'rgba(255, 255, 255, 0.12) !important';
            button.style.color = 'rgba(255, 255, 255, 0.95) !important';
            button.style.borderColor = 'rgba(255, 255, 255, 0.25) !important';
        });

        button.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();

            if (e.button === 0) {
                if (e.ctrlKey || e.shiftKey || e.altKey) {
                    changeSkipTime();
                } else {
                    skipOpening();
                }
            }
        });

        button.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            changeSkipTime();
        });

        // Для мобильных устройств добавляем обработчики touch
        if (isMobileDevice) {
            button.addEventListener('touchstart', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Запускаем таймер для длинного нажатия
                longPressTimer = setTimeout(() => {
                    changeSkipTime();
                    longPressTimer = null;
                }, 500); // 500ms для длинного нажатия
            });

            button.addEventListener('touchmove', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Отменяем длинное нажатие если палец двигается
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            });

            button.addEventListener('touchend', (e) => {
                e.preventDefault();
                e.stopPropagation();

                // Если таймер еще работает (короткое нажатие) - пропускаем
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                    skipOpening();
                }
            });

            button.addEventListener('touchcancel', (e) => {
                e.preventDefault();
                e.stopPropagation();
                // Отменяем таймер при отмене касания
                if (longPressTimer) {
                    clearTimeout(longPressTimer);
                    longPressTimer = null;
                }
            });
        }

        return button;
    }

    function updateButtonText(button) {
        const timeText = formatTime(SKIP_TIME);
        button.innerHTML = `Пропустить (${timeText})`;
    }

    function changeSkipTime() {
        currentSkipIndex = (currentSkipIndex + 1) % SKIP_OPTIONS.length;
        SKIP_TIME = SKIP_OPTIONS[currentSkipIndex];

        if (skipButton) {
            updateButtonText(skipButton);
            skipButton.style.opacity = '1';
            skipButton.style.visibility = 'visible';

            clearTimeout(hideTimeout);
            hideTimeout = setTimeout(() => {
                if (skipButton && !skipButton.matches(':hover')) {
                    skipButton.style.opacity = '0';
                    skipButton.style.visibility = 'hidden';
                }
            }, 2000);
        }
    }

    function skipOpening() {
        let video = document.querySelector('video');

        if (video) {
            const currentTime = video.currentTime;
            const newTime = Math.min(currentTime + SKIP_TIME, video.duration || currentTime + SKIP_TIME);
            video.currentTime = newTime;
        }
    }

    function findTimeDisplay() {
        const timeSelectors = [
            '.vjs-current-time-display',
            '.vjs-time-display',
            '.plyr__time',
            '.jw-time',
            '.time-display',
            '.current-time',
            '.video-time',
            '.player-time',
            '.time'
        ];

        for (const selector of timeSelectors) {
            const element = document.querySelector(selector);
            if (element) return element.parentElement;
        }

        const allElements = document.querySelectorAll('*');
        for (const el of allElements) {
            if (el.textContent && el.textContent.match(/\d+:\d+\s*\/\s*\d+:\d+/)) {
                return el;
            }
        }

        return null;
    }

    function addSkipButton() {
        const oldButton = document.querySelector('[data-skip-button]');
        if (oldButton) oldButton.remove();

        const timeContainer = findTimeDisplay();

        if (timeContainer) {
            const computedStyle = getComputedStyle(timeContainer);
            if (computedStyle.position === 'static') {
                timeContainer.style.position = 'relative';
            }

            skipButton = createSkipButton();
            timeContainer.appendChild(skipButton);
            setupAutoHide(timeContainer);
            return true;
        }

        const video = document.querySelector('video');
        if (video) {
            const videoContainer = video.parentElement;
            if (videoContainer) {
                const computedStyle = getComputedStyle(videoContainer);
                if (computedStyle.position === 'static') {
                    videoContainer.style.position = 'relative';
                }
                skipButton = createSkipButton();
                videoContainer.appendChild(skipButton);
                setupAutoHide(videoContainer);
                return true;
            }
        }

        return false;
    }

    function setupAutoHide(container) {
        const showButton = () => {
            if (skipButton && shouldShowButton()) {
                skipButton.style.opacity = '1';
                skipButton.style.visibility = 'visible';
                clearTimeout(hideTimeout);
                hideTimeout = setTimeout(hideButton, 3500);
            }
        };

        const hideButton = () => {
            if (skipButton && !skipButton.matches(':hover')) {
                skipButton.style.opacity = '0';
                skipButton.style.visibility = 'hidden';
            }
        };

        const video = document.querySelector('video');
        if (video) {
            video.addEventListener('play', showButton);
            video.addEventListener('pause', showButton);
            video.addEventListener('ended', hideButton);
            video.addEventListener('seeking', showButton);

            if (!isMobileDevice) {
                video.addEventListener('mouseenter', showButton);
                video.addEventListener('mousemove', showButton);
                video.addEventListener('mouseleave', () => {
                    clearTimeout(hideTimeout);
                    hideTimeout = setTimeout(hideButton, 1500);
                });
            }
        }

        if (!isMobileDevice) {
            container.addEventListener('mouseenter', showButton);
            container.addEventListener('mousemove', showButton);
            container.addEventListener('mouseleave', () => {
                clearTimeout(hideTimeout);
                hideTimeout = setTimeout(hideButton, 1500);
            });
        }

        // Для мобильных устройств показываем кнопку при касании
        if (isMobileDevice) {
            container.addEventListener('touchstart', showButton);
            container.addEventListener('touchmove', showButton);
            container.addEventListener('touchend', () => {
                clearTimeout(hideTimeout);
                hideTimeout = setTimeout(hideButton, 1500);
            });
        }

        showButton();
        setTimeout(() => {
            if (video && !video.paused && !container.matches(':hover')) {
                hideButton();
            }
        }, 2500);
    }

    //  изменения полноэкранного режима
    function setupFullscreenListener() {
        document.addEventListener('fullscreenchange', updateButtonVisibility);
        document.addEventListener('webkitfullscreenchange', updateButtonVisibility);
        document.addEventListener('mozfullscreenchange', updateButtonVisibility);
        document.addEventListener('MSFullscreenChange', updateButtonVisibility);
    }

    function init() {
        if (!addSkipButton()) {
            let attempts = 0;
            const checkInterval = setInterval(() => {
                attempts++;
                if (addSkipButton() || attempts >= 8) clearInterval(checkInterval);
            }, 500);
        }

        setupFullscreenListener();

        const observer = new MutationObserver((mutations) => {
            for (const mutation of mutations) {
                if (mutation.addedNodes.length > 0) {
                    for (const node of mutation.addedNodes) {
                        if (node.nodeType === 1 &&
                           (node.tagName === 'VIDEO' || node.querySelector?.('video'))) {
                            setTimeout(addSkipButton, 300);
                            return;
                        }
                    }
                }
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
