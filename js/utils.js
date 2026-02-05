// Utility Functions
const Utils = {
    // Format time to 12-hour format
    formatTime: function(timeString) {
        if (!timeString) return '';
        const [hours, minutes] = timeString.split(':');
        const hour = parseInt(hours);
        const ampm = hour >= 12 ? 'PM' : 'AM';
        const formattedHour = hour % 12 || 12;
        return `${formattedHour}:${minutes} ${ampm}`;
    },

    // Format date
    formatDate: function(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    },

    // Format date with time
    formatDateTime: function(dateTimeString) {
        if (!dateTimeString) return '';
        const date = new Date(dateTimeString);
        return date.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric',
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    },

    // Generate time slots
    generateTimeSlots: function(startTime = '09:00', endTime = '17:00', interval = 60) {
        const slots = [];
        const [startHour, startMinute] = startTime.split(':').map(Number);
        const [endHour, endMinute] = endTime.split(':').map(Number);
        
        let currentHour = startHour;
        let currentMinute = startMinute;
        
        while (
            currentHour < endHour || 
            (currentHour === endHour && currentMinute < endMinute)
        ) {
            const timeString = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
            const displayTime = this.formatTime(timeString);
            
            slots.push({
                value: timeString,
                display: displayTime
            });
            
            currentMinute += interval;
            if (currentMinute >= 60) {
                currentHour += Math.floor(currentMinute / 60);
                currentMinute = currentMinute % 60;
            }
        }
        
        return slots;
    },

    // Get days of week
    getDaysOfWeek: function() {
        return [
            { value: 'monday', display: 'Monday' },
            { value: 'tuesday', display: 'Tuesday' },
            { value: 'wednesday', display: 'Wednesday' },
            { value: 'thursday', display: 'Thursday' },
            { value: 'friday', display: 'Friday' },
            { value: 'saturday', display: 'Saturday' }
        ];
    },

    // Get therapy departments
    getTherapyDepartments: function() {
        return [
            { value: 'occupational_therapy', display: 'Occupational Therapy' },
            { value: 'special_education', display: 'Special Education' },
            { value: 'educational', display: 'Educational' },
            { value: 'speech_1', display: 'Speech Therapy 1' },
            { value: 'speech_2', display: 'Speech Therapy 2' },
            { value: 'speech_3', display: 'Speech Therapy 3' },
            { value: 'behavioral', display: 'Behavioral Therapy' },
            { value: 'physiotherapy', display: 'Physiotherapy' }
        ];
    },

    // Deep clone object
    deepClone: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },

    // Debounce function
    debounce: function(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    // Throttle function
    throttle: function(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    },

    // Generate random ID
    generateId: function() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Validate email
    validateEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },

    // Validate phone
    validatePhone: function(phone) {
        const re = /^[\+]?[1-9][\d]{0,15}$/;
        return re.test(phone.replace(/[\s\-\(\)]/g, ''));
    },

    // Format phone number
    formatPhone: function(phone) {
        const cleaned = ('' + phone).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{3})(\d{3})(\d{4})$/);
        if (match) {
            return '(' + match[1] + ') ' + match[2] + '-' + match[3];
        }
        return phone;
    },

    // Check if date is in the past
    isPastDate: function(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date < today;
    },

    // Check if date is today
    isToday: function(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        return date.getDate() === today.getDate() &&
               date.getMonth() === today.getMonth() &&
               date.getFullYear() === today.getFullYear();
    },

    // Get date difference in days
    getDaysDifference: function(date1, date2) {
        const diffTime = Math.abs(new Date(date2) - new Date(date1));
        return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    },

    // Capitalize first letter
    capitalize: function(string) {
        if (!string) return '';
        return string.charAt(0).toUpperCase() + string.slice(1);
    },

    // Truncate text
    truncateText: function(text, maxLength) {
        if (!text) return '';
        if (text.length <= maxLength) return text;
        return text.substr(0, maxLength) + '...';
    },

    // Create element with attributes
    createElement: function(tag, attributes = {}, text = '') {
        const element = document.createElement(tag);
        
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'class') {
                element.className = value;
            } else if (key === 'style') {
                Object.assign(element.style, value);
            } else if (key === 'dataset') {
                Object.assign(element.dataset, value);
            } else {
                element.setAttribute(key, value);
            }
        }
        
        if (text) {
            element.textContent = text;
        }
        
        return element;
    },

    // Show notification with flash effects
    showNotification: function(message, type = 'info', duration = 5000) {
        // Create notification element with flash effect
        const notification = this.createElement('div', {
            class: `notification ${type} flash-notification`,
            style: {
                position: 'fixed',
                top: '20px',
                right: '20px',
                background: '#1e293b',
                color: 'white',
                padding: '1rem 1.5rem',
                borderRadius: '12px',
                boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
                zIndex: '10000',
                transform: 'translateX(120%) translateY(-20px)',
                transition: 'all 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                maxWidth: '400px',
                width: 'calc(100% - 40px)',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem',
                borderLeft: '4px solid',
                backdropFilter: 'blur(10px)',
                animation: 'flashBorder 2s infinite'
            }
        });

        // Set border color and icon based on type
        let icon = '';
        let borderColor = '';
        let flashColor = '';
        
        switch (type) {
            case 'success':
                icon = '✓';
                borderColor = '#10b981';
                flashColor = 'rgba(16, 185, 129, 0.5)';
                break;
            case 'error':
                icon = '✗';
                borderColor = '#ef4444';
                flashColor = 'rgba(239, 68, 68, 0.5)';
                break;
            case 'warning':
                icon = '⚠';
                borderColor = '#f59e0b';
                flashColor = 'rgba(245, 158, 11, 0.5)';
                break;
            default:
                icon = 'ℹ';
                borderColor = '#3b82f6';
                flashColor = 'rgba(59, 130, 246, 0.5)';
        }

        notification.style.borderLeftColor = borderColor;
        
        // Add flash animation style
        const style = document.createElement('style');
        style.textContent = `
            @keyframes flashBorder {
                0%, 100% { 
                    box-shadow: 0 10px 25px rgba(0,0,0,0.3), 
                                inset 0 0 0 ${flashColor}; 
                }
                50% { 
                    box-shadow: 0 10px 25px rgba(0,0,0,0.3), 
                                inset 0 0 20px ${flashColor},
                                0 0 20px ${flashColor}; 
                }
            }
            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                20%, 40%, 60%, 80% { transform: translateX(5px); }
            }
            .error-notification {
                animation: shake 0.5s ease !important;
            }
        `;
        document.head.appendChild(style);

        // Add icon with animation
        const iconEl = this.createElement('div', {
            style: {
                fontSize: '1.5rem',
                fontWeight: 'bold',
                minWidth: '30px',
                height: '30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: borderColor,
                borderRadius: '50%',
                animation: 'pulse 2s infinite'
            }
        }, icon);
        notification.appendChild(iconEl);

        // Add message
        const messageEl = this.createElement('div', {
            style: {
                flex: '1',
                fontSize: '0.95rem',
                lineHeight: '1.4'
            }
        }, message);
        notification.appendChild(messageEl);

        // Add close button
        const closeBtn = this.createElement('button', {
            class: 'notification-close',
            style: {
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                cursor: 'pointer',
                fontSize: '1.2rem',
                padding: '0.25rem',
                transition: 'color 0.2s ease'
            }
        }, '×');
        
        closeBtn.onclick = () => {
            notification.style.transform = 'translateX(120%) translateY(-20px)';
            setTimeout(() => notification.remove(), 300);
        };
        
        closeBtn.onmouseenter = () => {
            closeBtn.style.color = '#ef4444';
        };
        
        closeBtn.onmouseleave = () => {
            closeBtn.style.color = '#94a3b8';
        };
        
        notification.appendChild(closeBtn);

        // Add to document
        document.body.appendChild(notification);

        // Show notification with bounce effect
        setTimeout(() => {
            notification.style.transform = 'translateX(0) translateY(0)';
        }, 10);

        // Add error shake animation
        if (type === 'error') {
            notification.classList.add('error-notification');
        }

        // Auto remove
        const autoRemove = setTimeout(() => {
            notification.style.transform = 'translateX(120%) translateY(-20px)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.remove();
                }
            }, 300);
        }, duration);

        // Pause auto-remove on hover
        notification.addEventListener('mouseenter', () => {
            clearTimeout(autoRemove);
        });

        notification.addEventListener('mouseleave', () => {
            setTimeout(() => {
                notification.style.transform = 'translateX(120%) translateY(-20px)';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.remove();
                    }
                }, 300);
            }, duration);
        });

        // Add vibration for error/warning
        if (type === 'error' || type === 'warning') {
            if (navigator.vibrate) {
                navigator.vibrate([200, 100, 200]);
            }
        }
    },

    // Confirm dialog
    confirmDialog: function(message, confirmText = 'Confirm', cancelText = 'Cancel') {
        return new Promise((resolve) => {
            // Create overlay
            const overlay = this.createElement('div', {
                class: 'dialog-overlay',
                style: {
                    position: 'fixed',
                    top: '0',
                    left: '0',
                    width: '100%',
                    height: '100%',
                    background: 'rgba(0,0,0,0.7)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: '2000',
                    backdropFilter: 'blur(10px)',
                    animation: 'fadeIn 0.3s ease'
                }
            });

            // Create dialog with 3D effect
            const dialog = this.createElement('div', {
                class: 'dialog',
                style: {
                    background: 'linear-gradient(145deg, #1e293b, #0f172a)',
                    borderRadius: '20px',
                    padding: '2.5rem',
                    maxWidth: '450px',
                    width: '90%',
                    transformStyle: 'preserve-3d',
                    transform: 'perspective(1000px) rotateX(5deg)',
                    boxShadow: `
                        0 20px 40px rgba(0,0,0,0.4),
                        inset 0 1px 0 rgba(255,255,255,0.1)
                    `,
                    animation: 'slideUp 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                }
            });

            // Add gradient border effect
            const borderEffect = this.createElement('div', {
                style: {
                    position: 'absolute',
                    top: '0',
                    left: '0',
                    right: '0',
                    height: '3px',
                    background: 'linear-gradient(90deg, #2563eb, #f59e0b, #10b981)',
                    zIndex: '1'
                }
            });
            dialog.appendChild(borderEffect);

            // Add message
            const messageEl = this.createElement('p', {
                style: {
                    marginBottom: '2.5rem',
                    textAlign: 'center',
                    fontSize: '1.2rem',
                    lineHeight: '1.6',
                    color: '#f1f5f9',
                    fontWeight: '500',
                    padding: '0 1rem'
                }
            }, message);
            dialog.appendChild(messageEl);

            // Add buttons container
            const buttonsContainer = this.createElement('div', {
                style: {
                    display: 'flex',
                    gap: '1.5rem',
                    justifyContent: 'center'
                }
            });

            // Cancel button with 3D effect
            const cancelBtn = this.createElement('button', {
                class: 'btn-secondary',
                style: {
                    flex: '1',
                    padding: '1rem 2rem',
                    background: 'linear-gradient(145deg, #334155, #1e293b)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    color: '#f1f5f9',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(10px)',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    position: 'relative',
                    overflow: 'hidden'
                }
            }, cancelText);
            
            cancelBtn.onmouseenter = () => {
                cancelBtn.style.transform = 'translateZ(20px) translateY(-2px)';
                cancelBtn.style.boxShadow = '0 8px 15px rgba(0,0,0,0.2)';
                cancelBtn.style.background = 'linear-gradient(145deg, #475569, #334155)';
            };
            
            cancelBtn.onmouseleave = () => {
                cancelBtn.style.transform = 'translateZ(10px)';
                cancelBtn.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
                cancelBtn.style.background = 'linear-gradient(145deg, #334155, #1e293b)';
            };
            
            cancelBtn.onclick = () => {
                overlay.style.opacity = '0';
                overlay.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    overlay.remove();
                    resolve(false);
                }, 300);
            };

            // Confirm button with 3D effect
            const confirmBtn = this.createElement('button', {
                class: 'btn-primary',
                style: {
                    flex: '1',
                    padding: '1rem 2rem',
                    background: 'linear-gradient(145deg, #2563eb, #1d4ed8)',
                    border: 'none',
                    borderRadius: '12px',
                    color: 'white',
                    cursor: 'pointer',
                    fontSize: '1rem',
                    fontWeight: '600',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    transformStyle: 'preserve-3d',
                    transform: 'translateZ(10px)',
                    boxShadow: '0 4px 15px rgba(37, 99, 235, 0.3)',
                    position: 'relative',
                    overflow: 'hidden'
                }
            }, confirmText);
            
            // Add hover effect layer
            const hoverLayer = this.createElement('div', {
                style: {
                    position: 'absolute',
                    top: '0',
                    left: '-100%',
                    width: '100%',
                    height: '100%',
                    background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
                    transition: 'left 0.5s ease'
                }
            });
            confirmBtn.appendChild(hoverLayer);
            
            confirmBtn.onmouseenter = () => {
                confirmBtn.style.transform = 'translateZ(20px) translateY(-2px)';
                confirmBtn.style.boxShadow = '0 10px 25px rgba(37, 99, 235, 0.4)';
                hoverLayer.style.left = '100%';
            };
            
            confirmBtn.onmouseleave = () => {
                confirmBtn.style.transform = 'translateZ(10px)';
                confirmBtn.style.boxShadow = '0 4px 15px rgba(37, 99, 235, 0.3)';
                hoverLayer.style.left = '-100%';
            };
            
            confirmBtn.onclick = () => {
                overlay.style.opacity = '0';
                overlay.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    overlay.remove();
                    resolve(true);
                }, 300);
            };

            // Add buttons to container
            buttonsContainer.appendChild(cancelBtn);
            buttonsContainer.appendChild(confirmBtn);
            dialog.appendChild(buttonsContainer);

            // Add to overlay
            overlay.appendChild(dialog);
            document.body.appendChild(overlay);

            // Close on overlay click
            overlay.onclick = (e) => {
                if (e.target === overlay) {
                    overlay.style.opacity = '0';
                    overlay.style.transform = 'scale(0.9)';
                    setTimeout(() => {
                        overlay.remove();
                        resolve(false);
                    }, 300);
                }
            };

            // Add animations
            const style = document.createElement('style');
            style.textContent = `
                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }
                @keyframes slideUp {
                    from { 
                        opacity: 0;
                        transform: perspective(1000px) rotateX(5deg) translateY(30px) scale(0.9);
                    }
                    to { 
                        opacity: 1;
                        transform: perspective(1000px) rotateX(0deg) translateY(0) scale(1);
                    }
                }
                @keyframes pulse {
                    0%, 100% { transform: scale(1); }
                    50% { transform: scale(1.05); }
                }
            `;
            document.head.appendChild(style);
        });
    },

    // Loading spinner
    showLoading: function(show, message = 'Loading...') {
        let spinner = document.getElementById('global-spinner');
        
        if (show) {
            if (!spinner) {
                spinner = this.createElement('div', {
                    id: 'global-spinner',
                    style: {
                        position: 'fixed',
                        top: '0',
                        left: '0',
                        width: '100%',
                        height: '100%',
                        background: 'rgba(15, 23, 42, 0.95)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: '9999',
                        backdropFilter: 'blur(10px)'
                    }
                });

                // Create 3D spinner container
                const spinnerContainer = this.createElement('div', {
                    style: {
                        position: 'relative',
                        width: '100px',
                        height: '100px',
                        perspective: '1000px'
                    }
                });

                // Create outer spinner ring
                const spinnerOuter = this.createElement('div', {
                    style: {
                        position: 'absolute',
                        width: '100%',
                        height: '100%',
                        border: '8px solid transparent',
                        borderTop: '8px solid #2563eb',
                        borderRight: '8px solid #f59e0b',
                        borderRadius: '50%',
                        animation: 'spin3d 2s linear infinite'
                    }
                });

                // Create inner spinner ring
                const spinnerInner = this.createElement('div', {
                    style: {
                        position: 'absolute',
                        width: '70%',
                        height: '70%',
                        top: '15%',
                        left: '15%',
                        border: '6px solid transparent',
                        borderBottom: '6px solid #10b981',
                        borderLeft: '6px solid #8b5cf6',
                        borderRadius: '50%',
                        animation: 'spin3dReverse 1.5s linear infinite'
                    }
                });

                // Create center dot
                const spinnerCenter = this.createElement('div', {
                    style: {
                        position: 'absolute',
                        width: '20px',
                        height: '20px',
                        top: '40%',
                        left: '40%',
                        background: 'linear-gradient(45deg, #2563eb, #f59e0b)',
                        borderRadius: '50%',
                        animation: 'pulse 2s infinite'
                    }
                });

                // Create message
                const messageEl = this.createElement('p', {
                    style: {
                        color: 'white',
                        fontSize: '1.2rem',
                        marginTop: '2rem',
                        fontWeight: '500',
                        textAlign: 'center',
                        background: 'linear-gradient(45deg, #f1f5f9, #94a3b8)',
                        WebkitBackgroundClip: 'text',
                        backgroundClip: 'text',
                        color: 'transparent'
                    }
                }, message);

                spinnerContainer.appendChild(spinnerOuter);
                spinnerContainer.appendChild(spinnerInner);
                spinnerContainer.appendChild(spinnerCenter);
                spinner.appendChild(spinnerContainer);
                spinner.appendChild(messageEl);
                document.body.appendChild(spinner);

                // Add animations
                const style = document.createElement('style');
                style.textContent = `
                    @keyframes spin3d {
                        0% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
                        100% { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
                    }
                    @keyframes spin3dReverse {
                        0% { transform: rotateX(360deg) rotateY(360deg) rotateZ(360deg); }
                        100% { transform: rotateX(0deg) rotateY(0deg) rotateZ(0deg); }
                    }
                    @keyframes pulse {
                        0%, 100% { 
                            transform: scale(1);
                            box-shadow: 0 0 20px rgba(37, 99, 235, 0.5);
                        }
                        50% { 
                            transform: scale(1.2);
                            box-shadow: 0 0 40px rgba(37, 99, 235, 0.8);
                        }
                    }
                `;
                document.head.appendChild(style);
            } else {
                // Update message if spinner already exists
                const messageEl = spinner.querySelector('p');
                if (messageEl) {
                    messageEl.textContent = message;
                }
            }
        } else {
            if (spinner) {
                spinner.style.opacity = '0';
                spinner.style.transform = 'scale(0.9)';
                setTimeout(() => {
                    if (spinner.parentNode) {
                        spinner.remove();
                    }
                }, 300);
            }
        }
    },

    // Format currency
    formatCurrency: function(amount) {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    // Check if object is empty
    isEmpty: function(obj) {
        return Object.keys(obj).length === 0;
    },

    // Get query parameter
    getQueryParam: function(name) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    },

    // Set query parameter
    setQueryParam: function(name, value) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.set(name, value);
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    },

    // Remove query parameter
    removeQueryParam: function(name) {
        const urlParams = new URLSearchParams(window.location.search);
        urlParams.delete(name);
        window.history.replaceState({}, '', `${window.location.pathname}?${urlParams}`);
    }
    
};

// Make Utils available globally
window.Utils = Utils;
