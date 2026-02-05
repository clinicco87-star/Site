// Dashboard Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const logoutBtn = document.getElementById('logoutBtn');
    const quickAddBtn = document.getElementById('quickAdd');
    const closeQuickAdd = document.getElementById('closeQuickAdd');
    const quickAddModal = document.getElementById('quickAddModal');
    const notificationsBtn = document.getElementById('notificationsBtn');
    const closeNotifications = document.getElementById('closeNotifications');
    const notificationsPanel = document.getElementById('notificationsPanel');
    const navItems = document.querySelectorAll('.nav-item');
    const quickActionBtns = document.querySelectorAll('.quick-action-btn');
    const addOptions = document.querySelectorAll('.add-option');
    
    // Dashboard elements
    const adminName = document.getElementById('adminName');
    const adminEmail = document.getElementById('adminEmail');
    const welcomeName = document.getElementById('welcomeName');
    const currentDate = document.getElementById('currentDate');
    
    // Stats elements
    const activeClients = document.getElementById('activeClients');
    const activeTherapists = document.getElementById('activeTherapists');
    const todayAppointments = document.getElementById('todayAppointments');
    const pendingPayments = document.getElementById('pendingPayments');
    
    // Data elements
    const todaySchedule = document.getElementById('todaySchedule');
    const upcomingExpirations = document.getElementById('upcomingExpirations');
    const therapistAvailability = document.getElementById('therapistAvailability');
    const recentActivity = document.getElementById('recentActivity');
    const departmentOverview = document.getElementById('departmentOverview');
    
    // State
    let dashboardData = {};
    let notifications = [];

    // Initialize
    initDashboard();

// In your initDashboard() function, add:
function initDashboard() {
    // Set current date
    updateCurrentDate();
    
  
    
    // Load user info
    loadUserInfo();
    
    // Load dashboard data
    loadDashboardData();
    
    // Set up event listeners
    setupEventListeners();
    
    // Check for notifications
    checkNotifications();
}

// Add this function


    function setupEventListeners() {
        // Logout
        logoutBtn.addEventListener('click', handleLogout);
        
        // Quick Add Modal
        quickAddBtn.addEventListener('click', () => showModal(quickAddModal));
        closeQuickAdd.addEventListener('click', () => hideModal(quickAddModal));
        
        // Notifications Panel
        notificationsBtn.addEventListener('click', () => {
            notificationsPanel.classList.add('active');
        });
        closeNotifications.addEventListener('click', () => {
            notificationsPanel.classList.remove('active');
        });
        
        // Navigation
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                const page = this.dataset.page;
                navigateToPage(page);
            });
        });
        
        // Quick Actions
        quickActionBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const action = this.dataset.action;
                handleQuickAction(action);
            });
        });
        
        // Add Options
        addOptions.forEach(option => {
            option.addEventListener('click', function() {
                const type = this.dataset.type;
                handleAddOption(type);
            });
        });
        
        // Close modals on outside click
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal-overlay')) {
                hideModal(quickAddModal);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideModal(quickAddModal);
                notificationsPanel.classList.remove('active');
            }
            if (e.ctrlKey && e.key === 'q') {
                e.preventDefault();
                showModal(quickAddModal);
            }
        });
    }

    async function loadUserInfo() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            if (user) {
                const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin';
                adminName.textContent = name;
                adminEmail.textContent = user.email;
                welcomeName.textContent = name;
            }
        } catch (error) {
            console.error('Error loading user info:', error);
            Utils.showNotification('Failed to load user information', 'error');
        }
    }

    async function loadDashboardData() {
        Utils.showLoading(true, 'Loading dashboard data...');
        
        try {
            // Load all data in parallel
            const [
                clientsData,
                therapistsData,
                appointmentsData,
                departmentsData,
                activityData
            ] = await Promise.all([
                loadClients(),
                loadTherapists(),
                loadTodayAppointments(),
                loadDepartments(),
                loadRecentActivity()
            ]);
            
            dashboardData = {
                clients: clientsData,
                therapists: therapistsData,
                appointments: appointmentsData,
                departments: departmentsData,
                activity: activityData
            };
            
            // Update UI
            updateStats();
            updateTodaySchedule();
            updateUpcomingExpirations();
            updateTherapistAvailability();
            updateRecentActivity();
            updateDepartmentOverview();
            
        } catch (error) {
            console.error('Error loading dashboard data:', error);
            Utils.showNotification('Failed to load dashboard data', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    async function loadClients() {
        try {
            const { data, error } = await window.supabaseClient
                .from('clients')
                .select('*, therapists(name)')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error loading clients:', error);
            return [];
        }
    }

    async function loadTherapists() {
        try {
            const { data, error } = await window.supabaseClient
                .from('therapists')
                .select('*')
                .eq('is_active', true)
                .order('name');
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error loading therapists:', error);
            return [];
        }
    }

 async function loadTodayAppointments() {
    // Get today's date in YYYY-MM-DD format
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const todayStr = `${year}-${month}-${day}`;
    
    console.log(`Looking for appointments on: ${todayStr}`); // Debug log
    
    try {
        const { data, error } = await window.supabaseClient
            .from('schedules')
            .select(`
                *,
                clients(name, therapy_type),
                therapists(name, department)
            `)
            .eq('date', todayStr)
            .eq('status', 'scheduled')
            .order('timeslot');
        
        if (error) throw error;
        
        console.log(`Found ${data?.length || 0} appointments for today:`, data); // Debug log
        
        return data || [];
    } catch (error) {
        console.error('Error loading today\'s appointments:', error);
        return [];
    }
}

    async function loadDepartments() {
        const departments = Utils.getTherapyDepartments();
        const departmentData = [];
        
        for (const dept of departments) {
            try {
                const { count, error } = await window.supabaseClient
                    .from('therapists')
                    .select('*', { count: 'exact', head: true })
                    .eq('department', dept.value)
                    .eq('is_active', true);
                
                if (error) throw error;
                
                departmentData.push({
                    ...dept,
                    therapistCount: count || 0,
                    clientCount: 0 // We'll update this later
                });
            } catch (error) {
                console.error(`Error loading department ${dept.value}:`, error);
            }
        }
        
        return departmentData;
    }

    async function loadRecentActivity() {
        try {
            const { data, error } = await window.supabaseClient
                .from('clients')
                .select('*, therapists(name)')
                .order('created_at', { ascending: false })
                .limit(5);
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error loading recent activity:', error);
            return [];
        }
    }

    function updateStats() {
        if (!dashboardData.clients || !dashboardData.therapists || !dashboardData.appointments) return;
        
        // Active clients (not expired)
        const activeClientCount = dashboardData.clients.filter(client => {
            if (!client.expiry_date) return true;
            return new Date(client.expiry_date) > new Date();
        }).length;
        
        activeClients.textContent = activeClientCount;
        activeClients.parentElement.style.setProperty('--value', activeClientCount);
        
        // Active therapists
        const activeTherapistCount = dashboardData.therapists.length;
        activeTherapists.textContent = activeTherapistCount;
        activeTherapists.parentElement.style.setProperty('--value', activeTherapistCount);
        
        // Today's appointments
        const todayAppointmentCount = dashboardData.appointments.length;
        todayAppointments.textContent = todayAppointmentCount;
        todayAppointments.parentElement.style.setProperty('--value', todayAppointmentCount);
        
        // Pending payments
        const pendingPaymentCount = dashboardData.clients.filter(
            client => client.payment_status === 'pending'
        ).length;
        pendingPayments.textContent = pendingPaymentCount;
        pendingPayments.parentElement.style.setProperty('--value', pendingPaymentCount);
        
        // Animate numbers
        animateNumbers();
    }

    function updateTodaySchedule() {
        if (!dashboardData.appointments || dashboardData.appointments.length === 0) {
            todaySchedule.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>No appointments today</p>
                </div>
            `;
            return;
        }
        
        let scheduleHTML = '';
        
        dashboardData.appointments.forEach(appointment => {
            const time = Utils.formatTime(appointment.timeslot);
            const clientName = appointment.clients?.name || 'Unknown';
            const therapyType = appointment.clients?.therapy_type || 'Unknown';
            const therapistName = appointment.therapists?.name || 'Unknown';
            
            scheduleHTML += `
                <div class="schedule-item">
                    <div class="schedule-time">
                        <div class="time">${time}</div>
                        <div class="status">Scheduled</div>
                    </div>
                    <div class="schedule-details">
                        <div class="client-name">${clientName}</div>
                        <div class="therapy-type">${therapyType}</div>
                    </div>
                    <div class="schedule-therapist">
                        <i class="fas fa-user-md"></i>
                        <span>${therapistName}</span>
                    </div>
                </div>
            `;
        });
        
        todaySchedule.innerHTML = scheduleHTML;
    }

function updateUpcomingExpirations() {
    if (!dashboardData.clients) {
        upcomingExpirations.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>No upcoming expirations</p>
            </div>
        `;
        return;
    }
    
    // Get clients expiring in the next 7 days
    const now = new Date();
    const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    
    const expiringClients = dashboardData.clients
        .filter(client => {
            if (!client.expiry_date) return false;
            const expiryDate = new Date(client.expiry_date);
            return expiryDate > now && expiryDate <= nextWeek;
        })
        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date));
    
    if (expiringClients.length === 0) {
        upcomingExpirations.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-check-circle"></i>
                <p>No upcoming expirations</p>
                <small>All clients are up to date</small>
            </div>
        `;
        return;
    }
    
    let expirationHTML = '';
    
    expiringClients.forEach(client => {
        const expiryDate = new Date(client.expiry_date);
        const daysUntil = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
        const formattedDate = expiryDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
        
        // Determine status class
        let statusClass = 'warning';
        if (daysUntil <= 3) statusClass = 'danger';
        if (daysUntil > 14) statusClass = 'info';
        
        expirationHTML += `
            <div class="expiration-item ${statusClass}" data-client-id="${client.id}">
                <div class="expiration-time">
                    <div class="days-count">${daysUntil}</div>
                    <div class="days-label">day${daysUntil !== 1 ? 's' : ''}</div>
                </div>
                <div class="expiration-details">
                    <div class="client-name-line">
                        <span class="client-name">${client.name}</span>
                        ${client.client_id ? `<span class="client-id">#${client.client_id}</span>` : ''}
                    </div>
                    <div class="client-info-line">
                        ${client.therapy_type ? `
                            <span class="info-item therapy-type">
                                <i class="fas fa-stethoscope"></i>
                                <span>${client.therapy_type}</span>
                            </span>
                        ` : ''}
                        
                        <span class="info-item expiry-date">
                            <i class="far fa-calendar-alt"></i>
                            <span>${formattedDate}</span>
                        </span>
                        
                        ${client.therapists?.name ? `
                            <span class="info-item assigned-therapist">
                                <i class="fas fa-user-md"></i>
                                <span>${client.therapists.name}</span>
                            </span>
                        ` : ''}
                    </div>
                </div>
            </div>
        `;
    });
    
    upcomingExpirations.innerHTML = expirationHTML;
    
    // Add click event to navigate to client details
    document.querySelectorAll('.expiration-item').forEach(item => {
        item.addEventListener('click', function() {
            const clientId = this.dataset.clientId;
            window.location.href = `clients.html?client=${clientId}`;
        });
    });
}

    function updateTherapistAvailability() {
        if (!dashboardData.therapists) {
            therapistAvailability.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-clock"></i>
                    <p>No therapist data available</p>
                </div>
            `;
            return;
        }
        
        let availabilityHTML = '';
        
        dashboardData.therapists.forEach(therapist => {
            // Check if therapist is on leave
            const isOnLeave = checkIfOnLeave(therapist.leave_dates);
            const statusClass = isOnLeave ? 'leave' : 'available';
            const statusText = isOnLeave ? 'On Leave' : 'Available';
            
            availabilityHTML += `
                <div class="availability-item">
                    <div class="availability-status ${statusClass}"></div>
                    <div class="availability-info">
                        <div class="therapist-name">${therapist.name}</div>
                        <div class="department">${Utils.capitalize(therapist.department.replace('_', ' '))}</div>
                    </div>
                </div>
            `;
        });
        
        therapistAvailability.innerHTML = availabilityHTML;
    }

    function updateRecentActivity() {
        if (!dashboardData.activity || dashboardData.activity.length === 0) {
            recentActivity.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-history"></i>
                    <p>No recent activity</p>
                </div>
            `;
            return;
        }
        
        let activityHTML = '';
        
        dashboardData.activity.forEach((client, index) => {
            const timeAgo = getTimeAgo(new Date(client.created_at));
            const dotClass = index === 0 ? 'success' : '';
            
            activityHTML += `
                <div class="activity-item">
                    <div class="activity-time">${timeAgo}</div>
                    <div class="activity-dot ${dotClass}"></div>
                    <div class="activity-content">
                        <p>New client <strong>${client.name}</strong> registered for ${client.therapy_type}</p>
                        <small>Assigned to ${client.therapists?.name || 'No therapist'}</small>
                    </div>
                </div>
            `;
        });
        
        recentActivity.innerHTML = activityHTML;
    }

    function updateDepartmentOverview() {
        if (!dashboardData.departments) return;
        
        let departmentHTML = '';
        
        dashboardData.departments.forEach(dept => {
            // Get department icon
            const icon = getDepartmentIcon(dept.value);
            
            departmentHTML += `
                <div class="department-card glass">
                    <div class="department-header">
                        <div class="department-icon">
                            <i class="${icon}"></i>
                        </div>
                        <div class="department-info">
                            <h4>${dept.display}</h4>
                            <p>${dept.therapistCount} therapist${dept.therapistCount !== 1 ? 's' : ''}</p>
                        </div>
                    </div>
                    <div class="department-stats">
                        <div class="stat">
                            <span class="value">${dept.therapistCount}</span>
                            <span class="label">Therapists</span>
                        </div>
                        <div class="stat">
                            <span class="value">${dept.clientCount}</span>
                            <span class="label">Clients</span>
                        </div>
                        <div class="stat">
                            <span class="value">85%</span>
                            <span class="label">Capacity</span>
                        </div>
                    </div>
                </div>
            `;
        });
        
        departmentOverview.innerHTML = departmentHTML;
    }

function checkIfOnLeave(leaveDates) {
    if (!leaveDates || !Array.isArray(leaveDates) || leaveDates.length === 0) {
        return false;
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Normalize to start of day
    
    return leaveDates.some(leave => {
        if (!leave || !leave.from || !leave.to) return false;
        
        try {
            // Parse the dates
            const fromDate = new Date(leave.from);
            const toDate = new Date(leave.to);
            
            // Normalize to start of day for comparison
            fromDate.setHours(0, 0, 0, 0);
            toDate.setHours(23, 59, 59, 999);
            
            // Check if today is within the leave period
            return today >= fromDate && today <= toDate;
        } catch (error) {
            console.error('Error parsing leave dates:', error);
            return false;
        }
    });
}

    function getTimeAgo(date) {
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        if (diffMins < 60) {
            return `${diffMins}m ago`;
        } else if (diffHours < 24) {
            return `${diffHours}h ago`;
        } else {
            return `${diffDays}d ago`;
        }
    }

    function getDepartmentIcon(department) {
        const icons = {
            'occupational_therapy': 'fas fa-hands-helping',
            'special_education': 'fas fa-graduation-cap',
            'educational': 'fas fa-book-open',
            'speech_1': 'fas fa-comment-medical',
            'speech_2': 'fas fa-comments',
            'speech_3': 'fas fa-microphone-alt',
            'behavioral': 'fas fa-brain',
            'physiotherapy': 'fas fa-running'
        };
        
        return icons[department] || 'fas fa-hospital';
    }

    function animateNumbers() {
        const statValues = document.querySelectorAll('.stat-value');
        
        statValues.forEach(valueElement => {
            const target = parseInt(valueElement.textContent);
            const duration = 1000;
            const step = target / (duration / 16);
            let current = 0;
            
            const timer = setInterval(() => {
                current += step;
                if (current >= target) {
                    current = target;
                    clearInterval(timer);
                }
                valueElement.textContent = Math.floor(current);
            }, 16);
        });
    }

    function updateCurrentDate() {
        const now = new Date();
        const options = { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        };
        currentDate.textContent = now.toLocaleDateString('en-US', options);
    }

    async function checkNotifications() {
        try {
            // Check for expiring clients
            const { data: expiringClients } = await window.supabaseClient
                .from('clients')
                .select('*')
                .lt('expiry_date', new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString())
                .gt('expiry_date', new Date().toISOString());
            
            // Check for today's appointments
            const today = new Date().toISOString().split('T')[0];
            const { data: todaysAppointments } = await window.supabaseClient
                .from('schedules')
                .select('*')
                .eq('date', today);
            
            // Build notifications
            notifications = [];
            
            if (expiringClients && expiringClients.length > 0) {
                notifications.push({
                    id: 'expiring-clients',
                    title: 'Upcoming Expirations',
                    message: `${expiringClients.length} client${expiringClients.length !== 1 ? 's' : ''} expiring soon`,
                    type: 'warning',
                    time: new Date().toISOString(),
                    unread: true
                });
            }
            
            if (todaysAppointments && todaysAppointments.length > 0) {
                notifications.push({
                    id: 'today-appointments',
                    title: "Today's Schedule",
                    message: `${todaysAppointments.length} appointment${todaysAppointments.length !== 1 ? 's' : ''} today`,
                    type: 'info',
                    time: new Date().toISOString(),
                    unread: true
                });
            }
            
            // Update notification count
            const unreadCount = notifications.filter(n => n.unread).length;
            document.getElementById('notificationCount').textContent = unreadCount;
            
            // Update notification panel
            updateNotificationPanel();
            
        } catch (error) {
            console.error('Error checking notifications:', error);
        }
    }

    function updateNotificationPanel() {
        const notificationList = document.getElementById('notificationList');
        
        if (notifications.length === 0) {
            notificationList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-bell-slash"></i>
                    <p>No notifications</p>
                </div>
            `;
            return;
        }
        
        let notificationHTML = '';
        
        notifications.forEach(notification => {
            const timeAgo = getTimeAgo(new Date(notification.time));
            
            notificationHTML += `
                <div class="notification-item ${notification.unread ? 'unread' : ''}">
                    <div class="notification-content">
                        <h4>${notification.title}</h4>
                        <p>${notification.message}</p>
                        <div class="notification-time">${timeAgo}</div>
                    </div>
                </div>
            `;
        });
        
        notificationList.innerHTML = notificationHTML;
    }

    async function handleLogout() {
        const confirmed = await Utils.confirmDialog(
            'Are you sure you want to logout?',
            'Logout',
            'Cancel'
        );
        
        if (confirmed) {
            Utils.showLoading(true, 'Logging out...');
            
            try {
                await window.supabaseFunctions.signOut();
                
                // Redirect to login page after a short delay
                setTimeout(() => {
                    window.location.href = 'index.html';
                }, 1000);
                
            } catch (error) {
                console.error('Logout error:', error);
                Utils.showNotification('Failed to logout', 'error');
                Utils.showLoading(false);
            }
        }
    }

    function navigateToPage(page) {
        // Update active nav item
        navItems.forEach(item => item.classList.remove('active'));
        event.currentTarget.classList.add('active');
        
        // Navigate to page
        if (page !== 'dashboard') {
            window.location.href = `${page}.html`;
        }
    }

    function handleQuickAction(action) {
        switch (action) {
            case 'add-client':
                window.location.href = 'clients.html?action=add';
                break;
            case 'add-therapist':
                window.location.href = 'therapists.html?action=add';
                break;
            case 'view-schedule':
                window.location.href = 'schedule.html';
                break;
            case 'generate-report':
                generateReport();
                break;
        }
    }

    function handleAddOption(type) {
        hideModal(quickAddModal);
        
        switch (type) {
            case 'client':
                window.location.href = 'clients.html?action=add';
                break;
            case 'therapist':
                window.location.href = 'therapists.html?action=add';
                break;
            case 'appointment':
                window.location.href = 'schedule.html?action=add';
                break;
        }
    }

    function generateReport() {
        Utils.showLoading(true, 'Generating report...');
        
        // Simulate report generation
        setTimeout(() => {
            Utils.showLoading(false);
            
            // Create report content
            const reportContent = `
                Clinic Management System Report
                Generated: ${new Date().toLocaleString()}
                
                Active Clients: ${dashboardData.clients?.length || 0}
                Active Therapists: ${dashboardData.therapists?.length || 0}
                Today's Appointments: ${dashboardData.appointments?.length || 0}
                Pending Payments: ${dashboardData.clients?.filter(c => c.payment_status === 'pending').length || 0}
                
                Department Overview:
                ${dashboardData.departments?.map(dept => 
                    `- ${dept.display}: ${dept.therapistCount} therapists`
                ).join('\n')}
            `;
            
            // Create download link
            const blob = new Blob([reportContent], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `clinic-report-${new Date().toISOString().split('T')[0]}.txt`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Utils.showNotification('Report generated successfully', 'success');
        }, 1500);
    }

    function showModal(modal) {
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function hideModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Auto-refresh data every 5 minutes
    setInterval(() => {
        loadDashboardData();
    }, 5 * 60 * 1000);
    
    // Check for notifications every minute
    setInterval(() => {
        checkNotifications();
    }, 60 * 1000);

    // Initial data load
    loadDashboardData();
});