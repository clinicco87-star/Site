// Clients Management
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const logoutBtn = document.getElementById('logoutBtn');
    const addClientBtn = document.getElementById('addClientBtn');
    const emptyAddBtn = document.getElementById('emptyAddBtn');
    const exportBtn = document.getElementById('exportBtn');
    const clientModal = document.getElementById('clientModal');
    const closeClientModal = document.getElementById('closeClientModal');
    const clientForm = document.getElementById('clientForm');
    const cancelClient = document.getElementById('cancelClient');
    const clientDetailsModal = document.getElementById('clientDetailsModal');
    const closeDetailsModal = document.getElementById('closeDetailsModal');
    const scheduleModal = document.getElementById('scheduleModal');
    const closeScheduleModal = document.getElementById('closeScheduleModal');
    const scheduleForm = document.getElementById('scheduleForm');
    const cancelSchedule = document.getElementById('cancelSchedule');
    
    // Filter elements
    const searchClients = document.getElementById('searchClients');
    const filterStatus = document.getElementById('filterStatus');
    const filterPayment = document.getElementById('filterPayment');
    const filterTherapy = document.getElementById('filterTherapy');
    const filterTherapist = document.getElementById('filterTherapist');
    const clearFilters = document.getElementById('clearFilters');
    
    // Table elements
    const selectAll = document.getElementById('selectAll');
    const clientsTableBody = document.getElementById('clientsTableBody');
    const bulkDeleteBtn = document.getElementById('bulkDeleteBtn');
    const sendRemindersBtn = document.getElementById('sendRemindersBtn');
    const showingCount = document.getElementById('showingCount');
    const totalCount = document.getElementById('totalCount');
    const pagination = document.getElementById('pagination');
    
    // Stats elements
    const totalClients = document.getElementById('totalClients');
    const activeClients = document.getElementById('activeClients');
    const expiringSoon = document.getElementById('expiringSoon');
    const pendingPayments = document.getElementById('pendingPayments');
    
    // Tab elements
    const tabBtns = document.querySelectorAll('.tab-btn');
    const prevTab = document.getElementById('prevTab');
    const nextTab = document.getElementById('nextTab');
    const submitClient = document.getElementById('submitClient');
    
    // Form elements
    const expiryDateInput = document.getElementById('expiryDate');
    
    // Schedule modal elements
    const scheduleDateInput = document.getElementById('scheduleDate');
    const scheduleTimeInput = document.getElementById('scheduleTime');
    const scheduleTherapistSelect = document.getElementById('scheduleTherapist');
    
    // State
    let clients = [];
    let filteredClients = [];
    let therapists = [];
    let schedules = [];
    let currentClientId = null;
    let currentScheduleClientId = null;
    let currentTab = 'basic';
    const itemsPerPage = 10;
    let currentPage = 1;
    let selectedClients = new Set();

    // Initialize
    initClients();

    function initClients() {
        // Load user info
        loadUserInfo();
        
        // Load data
        loadClients();
        loadTherapists();
        loadSchedules();
        
        // Set up event listeners
        setupEventListeners();
        
        // Remove therapy dropdown population since we don't need it
        // populateDropdowns(); // REMOVE THIS LINE
        
        // Set up tabs
        setupTabs();
        
        // Setup date inputs
        setupDateInputs();
    }

    function setupEventListeners() {
        // Logout
        logoutBtn.addEventListener('click', handleLogout);
        
        // Add client buttons
        addClientBtn.addEventListener('click', showAddClientModal);
        emptyAddBtn.addEventListener('click', showAddClientModal);
        
        // Close modals
        closeClientModal.addEventListener('click', () => hideModal(clientModal));
        closeDetailsModal.addEventListener('click', () => hideModal(clientDetailsModal));
        closeScheduleModal.addEventListener('click', () => hideModal(scheduleModal));
        
        // Cancel buttons
        cancelClient.addEventListener('click', () => hideModal(clientModal));
        cancelSchedule.addEventListener('click', () => hideModal(scheduleModal));
        
        // Form submissions
        clientForm.addEventListener('submit', handleSaveClient);
        scheduleForm.addEventListener('submit', handleScheduleAppointment);
        
        // Filters
        searchClients.addEventListener('input', Utils.debounce(handleFilter, 300));
        filterStatus.addEventListener('change', handleFilter);
        filterPayment.addEventListener('change', handleFilter);
        filterTherapy.addEventListener('change', handleFilter);
        filterTherapist.addEventListener('change', handleFilter);
        clearFilters.addEventListener('click', clearAllFilters);
        
        // Table actions
        selectAll.addEventListener('change', handleSelectAll);
        bulkDeleteBtn.addEventListener('click', handleBulkDelete);
        sendRemindersBtn.addEventListener('click', handleSendReminders);
        
        // Export
        exportBtn.addEventListener('click', handleExport);
        
        // Navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                const page = this.dataset.page;
                if (page !== 'clients') {
                    window.location.href = `${page}.html`;
                }
            });
        });
        
        // Close modals on outside click
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal-overlay')) {
                hideModal(clientModal);
                hideModal(clientDetailsModal);
                hideModal(scheduleModal);
            }
        });
        
        // Keyboard shortcuts
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                hideModal(clientModal);
                hideModal(clientDetailsModal);
                hideModal(scheduleModal);
            }
            
            // Ctrl+F for search
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                searchClients.focus();
            }
            
            // Ctrl+N for new client
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                showAddClientModal();
            }
        });
    }

    function setupTabs() {
        // Tab buttons
        tabBtns.forEach(btn => {
            btn.addEventListener('click', function() {
                const tab = this.dataset.tab;
                switchTab(tab);
            });
        });
        
        // Next button
        nextTab.addEventListener('click', function() {
            const tabs = ['basic', 'payment'];
            const currentIndex = tabs.indexOf(currentTab);
            if (currentIndex < tabs.length - 1) {
                switchTab(tabs[currentIndex + 1]);
            }
        });
        
        // Previous button
        prevTab.addEventListener('click', function() {
            const tabs = ['basic', 'payment'];
            const currentIndex = tabs.indexOf(currentTab);
            if (currentIndex > 0) {
                switchTab(tabs[currentIndex - 1]);
            }
        });
    }

    function setupDateInputs() {
        const today = new Date().toISOString().split('T')[0];
        
        // Set min date to today for expiry date
        if (expiryDateInput) {
            expiryDateInput.min = today;
            
            // Set default expiry to 30 days from now
            const thirtyDaysLater = new Date();
            thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
            expiryDateInput.value = thirtyDaysLater.toISOString().split('T')[0];
        }
        
        // Set min date to today for schedule date
        if (scheduleDateInput) {
            scheduleDateInput.min = today;
            
            // Set default to tomorrow
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            scheduleDateInput.value = tomorrow.toISOString().split('T')[0];
        }
        
        if (scheduleTimeInput) {
            scheduleTimeInput.value = '09:00';
        }
    }

    function switchTab(tab) {
        // Hide all tabs
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Show selected tab
        const tabContent = document.getElementById(`tab-${tab}`);
        if (tabContent) tabContent.classList.add('active');
        
        const tabBtn = document.querySelector(`.tab-btn[data-tab="${tab}"]`);
        if (tabBtn) tabBtn.classList.add('active');
        
        // Update navigation buttons
        const tabs = ['basic', 'payment'];
        const currentIndex = tabs.indexOf(tab);
        
        if (prevTab) prevTab.disabled = currentIndex === 0;
        if (nextTab) nextTab.style.display = currentIndex === tabs.length - 1 ? 'none' : 'flex';
        if (submitClient) submitClient.style.display = currentIndex === tabs.length - 1 ? 'flex' : 'none';
        
        currentTab = tab;
    }

    async function loadUserInfo() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            if (user) {
                const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin';
                const nameElement = document.getElementById('adminName');
                const emailElement = document.getElementById('adminEmail');
                
                if (nameElement) nameElement.textContent = name;
                if (emailElement) emailElement.textContent = user.email;
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    async function loadClients() {
        Utils.showLoading(true, 'Loading clients...');
        
        try {
            // Load clients - FIXED: Removed therapist join since we don't need therapy info anymore
            const { data, error } = await window.supabaseClient
                .from('clients')
                .select('*')
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            
            clients = data || [];
            filteredClients = [...clients];
            
            // Update stats
            updateStats();
            
            // Update table
            updateTable();
            updatePagination();
            
            // Update expirations
            updateExpirations();
            
        } catch (error) {
            console.error('Error loading clients:', error);
            Utils.showNotification('Failed to load clients', 'error');
        } finally {
            Utils.showLoading(false);
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
            
            therapists = data || [];
            
            // Populate therapist dropdowns
            populateTherapistDropdowns();
            
        } catch (error) {
            console.error('Error loading therapists:', error);
        }
    }

    async function loadSchedules() {
        try {
            const { data, error } = await window.supabaseClient
                .from('schedules')
                .select(`
                    *,
                    clients (
                        name,
                        display_id
                    ),
                    therapists (
                        name
                    )
                `)
                .gte('date', new Date().toISOString().split('T')[0])
                .order('date', { ascending: true });
            
            if (error) throw error;
            
            schedules = data || [];
            
        } catch (error) {
            console.error('Error loading schedules:', error);
        }
    }

    function populateTherapistDropdowns() {
        // Filter dropdown
        const filterTherapistSelect = document.getElementById('filterTherapist');
        
        // Clear existing options except first
        if (filterTherapistSelect) {
            while (filterTherapistSelect.options.length > 1) {
                filterTherapistSelect.remove(1);
            }
            
            // Add all active therapists to filter dropdown
            therapists.forEach(therapist => {
                const option = document.createElement('option');
                option.value = therapist.id;
                option.textContent = `${therapist.name} (${Utils.capitalize(therapist.department.replace('_', ' '))})`;
                filterTherapistSelect.appendChild(option);
            });
        }
    }

    function updateStats() {
        const now = new Date();
        
        // Total clients
        if (totalClients) totalClients.textContent = clients.length;
        
        // Active clients (not expired)
        const activeCount = clients.filter(client => {
            if (!client.expiry_date) return true;
            return new Date(client.expiry_date) > now;
        }).length;
        if (activeClients) activeClients.textContent = activeCount;
        
        // Expiring soon (next 7 days)
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        const expiringCount = clients.filter(client => {
            if (!client.expiry_date) return false;
            const expiryDate = new Date(client.expiry_date);
            return expiryDate > now && expiryDate <= nextWeek;
        }).length;
        if (expiringSoon) expiringSoon.textContent = expiringCount;
        
        // Pending payments
        const pendingCount = clients.filter(client => 
            client.payment_status === 'pending'
        ).length;
        if (pendingPayments) pendingPayments.textContent = pendingCount;
    }

    function updateTable() {
        if (!clientsTableBody) return;
        
        if (filteredClients.length === 0) {
            clientsTableBody.innerHTML = `
                <tr class="empty-row">
                    <td colspan="7">
                        <div class="empty-state">
                            <i class="fas fa-users"></i>
                            <h3>No Clients Found</h3>
                            <p>${searchClients && searchClients.value ? 'Try a different search' : 'Add your first client to get started'}</p>
                            <button class="btn-primary btn-3d" id="emptyAddBtn2">
                                <i class="fas fa-plus"></i>
                                Add Client
                            </button>
                        </div>
                    </td>
                </tr>
            `;
            
            // Re-attach event listener
            const emptyBtn = document.getElementById('emptyAddBtn2');
            if (emptyBtn) {
                emptyBtn.addEventListener('click', showAddClientModal);
            }
            return;
        }
        
        // Calculate pagination
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const paginatedClients = filteredClients.slice(startIndex, endIndex);
        
        let tableHTML = '';
        
        paginatedClients.forEach(client => {
            const isExpired = client.expiry_date && new Date(client.expiry_date) <= new Date();
            const statusClass = isExpired ? 'expired' : 'active';
            const statusText = isExpired ? 'Expired' : 'Active';
            
            const paymentClass = client.payment_status || 'pending';
            const paymentText = Utils.capitalize(client.payment_status || 'pending');
            
            const expiryDate = client.expiry_date ? 
                Utils.formatDate(client.expiry_date) : 'No expiry';
            
            const isSelected = selectedClients.has(client.id);
            
            tableHTML += `
                <tr class="${statusClass}" data-id="${client.id}">
                    <td>
                        <input type="checkbox" class="client-checkbox" 
                               data-id="${client.id}" ${isSelected ? 'checked' : ''}>
                    </td>
                    <td>
                        <div class="client-cell">
                            <div class="client-avatar">
                                ${client.name ? client.name.charAt(0).toUpperCase() : '?'}
                            </div>
                            <div class="client-info">
                                <div class="client-name">
                                    ${client.name || 'Unknown'} 
                                    <span class="client-id">(${client.display_id || 'N/A'})</span>
                                </div>
                                <div class="client-contact">
                                    ${client.email || client.phone || 'No contact info'}
                                </div>
                            </div>
                        </div>
                    </td>
                    <td>
                        <span class="status-badge ${statusClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td>
                        <span class="payment-badge ${paymentClass}">
                            ${paymentText}
                        </span>
                    </td>
                    <td>${expiryDate}</td>
                    <td>
                        <div class="action-buttons">
                            <button class="action-icon view" data-id="${client.id}" title="View Details">
                                <i class="fas fa-eye"></i>
                            </button>
                            <button class="action-icon edit" data-id="${client.id}" title="Edit">
                                <i class="fas fa-edit"></i>
                            </button>
                            <button class="action-icon delete" data-id="${client.id}" title="Delete">
                                <i class="fas fa-trash"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        });
        
        clientsTableBody.innerHTML = tableHTML;
        
        // Update counts
        if (showingCount) showingCount.textContent = paginatedClients.length;
        if (totalCount) totalCount.textContent = filteredClients.length;
        
        // Update select all checkbox
        const totalCheckboxes = document.querySelectorAll('.client-checkbox').length;
        const checkedCheckboxes = document.querySelectorAll('.client-checkbox:checked').length;
        if (selectAll) {
            selectAll.checked = totalCheckboxes > 0 && checkedCheckboxes === totalCheckboxes;
            selectAll.indeterminate = checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes;
        }
        
        // Attach event listeners
        attachTableListeners();
    }

    function attachTableListeners() {
        // Checkboxes
        document.querySelectorAll('.client-checkbox').forEach(checkbox => {
            checkbox.addEventListener('change', function() {
                const clientId = this.dataset.id;
                if (this.checked) {
                    selectedClients.add(clientId);
                } else {
                    selectedClients.delete(clientId);
                }
                updateBulkActions();
            });
        });
        
        // View buttons
        document.querySelectorAll('.action-icon.view').forEach(btn => {
            btn.addEventListener('click', function() {
                const clientId = this.dataset.id;
                viewClientDetails(clientId);
            });
        });
        
        // Edit buttons
        document.querySelectorAll('.action-icon.edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const clientId = this.dataset.id;
                editClient(clientId);
            });
        });
        
        // Schedule buttons
        document.querySelectorAll('.action-icon.schedule').forEach(btn => {
            btn.addEventListener('click', function() {
                const clientId = this.dataset.id;
                scheduleAppointment(clientId);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.action-icon.delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const clientId = this.dataset.id;
                deleteClient(clientId);
            });
        });
    }

    function updatePagination() {
        if (!pagination) return;
        
        const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
        
        if (totalPages <= 1) {
            pagination.innerHTML = '';
            return;
        }
        
        let paginationHTML = '';
        
        // Previous button
        paginationHTML += `
            <button class="pagination-btn prev" ${currentPage === 1 ? 'disabled' : ''}>
                <i class="fas fa-chevron-left"></i>
            </button>
        `;
        
        // Page numbers
        const maxVisiblePages = 5;
        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);
        
        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }
        
        for (let i = startPage; i <= endPage; i++) {
            paginationHTML += `
                <button class="pagination-btn ${i === currentPage ? 'active' : ''}">
                    ${i}
                </button>
            `;
        }
        
        // Next button
        paginationHTML += `
            <button class="pagination-btn next" ${currentPage === totalPages ? 'disabled' : ''}>
                <i class="fas fa-chevron-right"></i>
            </button>
        `;
        
        // Page info
        paginationHTML += `
            <span class="pagination-info">
                Page ${currentPage} of ${totalPages}
            </span>
        `;
        
        pagination.innerHTML = paginationHTML;
        
        // Attach event listeners
        document.querySelectorAll('.pagination-btn').forEach(btn => {
            if (btn.classList.contains('prev')) {
                btn.addEventListener('click', () => {
                    if (currentPage > 1) {
                        currentPage--;
                        updateTable();
                        updatePagination();
                    }
                });
            } else if (btn.classList.contains('next')) {
                btn.addEventListener('click', () => {
                    if (currentPage < totalPages) {
                        currentPage++;
                        updateTable();
                        updatePagination();
                    }
                });
            } else if (!btn.classList.contains('active')) {
                btn.addEventListener('click', () => {
                    currentPage = parseInt(btn.textContent);
                    updateTable();
                    updatePagination();
                });
            }
        });
    }

    function updateExpirations() {
        const expirationsGrid = document.getElementById('expirationsGrid');
        if (!expirationsGrid) return;
        
        const now = new Date();
        const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        const expiringClients = clients
            .filter(client => {
                if (!client.expiry_date) return false;
                const expiryDate = new Date(client.expiry_date);
                return expiryDate > now && expiryDate <= nextWeek;
            })
            .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
            .slice(0, 6);
        
        if (expiringClients.length === 0) {
            expirationsGrid.innerHTML = `
                <div class="empty-state" style="grid-column: 1 / -1; text-align: center; padding: 2rem;">
                    <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--success-color); margin-bottom: 1rem;"></i>
                    <h3 style="color: var(--dark-text); margin-bottom: 0.5rem;">No Upcoming Expirations</h3>
                    <p style="color: var(--dark-text-secondary);">No clients are expiring in the next 7 days</p>
                </div>
            `;
            return;
        }
        
        let expirationsHTML = '';
        
        expiringClients.forEach(client => {
            const expiryDate = new Date(client.expiry_date);
            const daysUntil = Math.ceil((expiryDate - now) / (1000 * 60 * 60 * 24));
            
            // Determine warning level
            let warningLevel = '';
            if (daysUntil <= 2) {
                warningLevel = 'critical';
            } else if (daysUntil <= 4) {
                warningLevel = 'warning';
            } else {
                warningLevel = 'info';
            }
            
            expirationsHTML += `
                <div class="expiration-card ${warningLevel}">
                    <div class="expiration-time">
                        <span class="days">${daysUntil}</span>
                        <span class="label">day${daysUntil !== 1 ? 's' : ''}</span>
                    </div>
                    <div class="expiration-details">
                        <div class="client-name">
                            ${client.name} <span class="client-id">(${client.display_id})</span>
                        </div>
                        <div class="expiration-date">
                            <i class="fas fa-calendar-times"></i>
                            Expires: ${Utils.formatDate(client.expiry_date)}
                        </div>
                    </div>
                    <button class="action-icon renew" data-id="${client.id}" title="Renew">
                        <i class="fas fa-sync-alt"></i>
                    </button>
                </div>
            `;
        });
        
        expirationsGrid.innerHTML = expirationsHTML;
        
        // Add event listeners for renew buttons
        document.querySelectorAll('.action-icon.renew').forEach(btn => {
            btn.addEventListener('click', function() {
                const clientId = this.dataset.id;
                renewClient(clientId);
            });
        });
    }

    async function renewClient(clientId) {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        
        // Extend expiry by 30 days
        const newExpiryDate = new Date();
        newExpiryDate.setDate(newExpiryDate.getDate() + 30);
        newExpiryDate.setHours(23, 59, 0, 0);
        
        Utils.showLoading(true, 'Renewing client...');
        
        try {
            const { error } = await window.supabaseClient
                .from('clients')
                .update({ 
                    expiry_date: newExpiryDate.toISOString(),
                    payment_status: 'pending'
                })
                .eq('id', clientId);
            
            if (error) throw error;
            
            // Update local client
            const index = clients.findIndex(c => c.id === clientId);
            if (index !== -1) {
                clients[index].expiry_date = newExpiryDate.toISOString();
                clients[index].payment_status = 'pending';
            }
            
            // Update UI
            updateStats();
            updateExpirations();
            handleFilter();
            
            Utils.showNotification(`Client ${client.display_id} renewed for 30 days`, 'success');
            
        } catch (error) {
            console.error('Error renewing client:', error);
            Utils.showNotification('Failed to renew client', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    function handleFilter() {
        const searchTerm = searchClients ? searchClients.value.toLowerCase().trim() : '';
        const statusFilter = filterStatus ? filterStatus.value : 'all';
        const paymentFilter = filterPayment ? filterPayment.value : 'all';
        const therapistFilter = filterTherapist ? filterTherapist.value : 'all';
        
        filteredClients = clients.filter(client => {
            // Search filter by name, email, phone, or display_id
            if (searchTerm) {
                const matchesSearch = 
                    (client.name && client.name.toLowerCase().includes(searchTerm)) ||
                    (client.email && client.email.toLowerCase().includes(searchTerm)) ||
                    (client.phone && client.phone.toLowerCase().includes(searchTerm)) ||
                    (client.display_id && client.display_id.toLowerCase().includes(searchTerm));
                if (!matchesSearch) return false;
            }
            
            // Status filter
            if (statusFilter !== 'all') {
                const isExpired = client.expiry_date && new Date(client.expiry_date) <= new Date();
                if (statusFilter === 'active' && isExpired) return false;
                if (statusFilter === 'expired' && !isExpired) return false;
            }
            
            // Payment filter
            if (paymentFilter !== 'all' && client.payment_status !== paymentFilter) {
                return false;
            }
            
            // Therapist filter - REMOVE if clients don't have therapist_id anymore
            if (therapistFilter !== 'all' && client.therapist_id !== therapistFilter) {
                return false;
            }
            
            return true;
        });
        
        // Reset pagination
        currentPage = 1;
        selectedClients.clear();
        
        // Update UI
        updateTable();
        updatePagination();
        updateBulkActions();
    }

    function clearAllFilters() {
        if (searchClients) searchClients.value = '';
        if (filterStatus) filterStatus.value = 'all';
        if (filterPayment) filterPayment.value = 'all';
        if (filterTherapy) filterTherapy.value = 'all';
        if (filterTherapist) filterTherapist.value = 'all';
        
        handleFilter();
    }

    function handleSelectAll() {
        if (!selectAll) return;
        
        const isChecked = selectAll.checked;
        const checkboxes = document.querySelectorAll('.client-checkbox');
        
        checkboxes.forEach(checkbox => {
            checkbox.checked = isChecked;
            const clientId = checkbox.dataset.id;
            
            if (isChecked) {
                selectedClients.add(clientId);
            } else {
                selectedClients.delete(clientId);
            }
        });
        
        updateBulkActions();
    }

    function updateBulkActions() {
        if (bulkDeleteBtn) bulkDeleteBtn.disabled = selectedClients.size === 0;
        if (sendRemindersBtn) sendRemindersBtn.disabled = selectedClients.size === 0;
        
        // Update select all checkbox state
        const totalCheckboxes = document.querySelectorAll('.client-checkbox').length;
        const checkedCheckboxes = document.querySelectorAll('.client-checkbox:checked').length;
        if (selectAll) {
            selectAll.checked = totalCheckboxes > 0 && checkedCheckboxes === totalCheckboxes;
            selectAll.indeterminate = checkedCheckboxes > 0 && checkedCheckboxes < totalCheckboxes;
        }
    }

    function showAddClientModal() {
        // Reset form
        if (clientForm) clientForm.reset();
        currentClientId = null;
        
        // Set default values
        const thirtyDaysLater = new Date();
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        
        if (expiryDateInput) {
            expiryDateInput.value = thirtyDaysLater.toISOString().split('T')[0];
        }
        
        const paymentStatus = document.getElementById('paymentStatus');
        if (paymentStatus) paymentStatus.value = 'pending';
        
        // Set modal title
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.innerHTML = `<i class="fas fa-user-plus"></i> Add New Client`;
        }
        
        // Reset tabs
        switchTab('basic');
        
        showModal(clientModal);
    }

    async function handleSaveClient(e) {
        e.preventDefault();
        
        const isEditing = !!currentClientId;
        
        // Get form values - REMOVED therapy type
        const clientName = document.getElementById('clientName');
        const clientPhone = document.getElementById('clientPhone');
        const expiryDate = expiryDateInput;
        const paymentStatus = document.getElementById('paymentStatus');
        
        // Validate required fields
        if (!clientName || !clientPhone || !expiryDate || !paymentStatus) {
            Utils.showNotification('Form elements not found', 'error');
            return;
        }
        
        const name = clientName.value.trim();
        const phone = clientPhone.value.trim();
        const expiry_date = expiryDate.value;
        const payment_status = paymentStatus.value;
        
        // Validate required fields
        if (!name || !phone || !expiry_date || !payment_status) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        Utils.showLoading(true, isEditing ? 'Updating client...' : 'Saving client...');
        
        try {
            // Prepare client data - FIXED: Properly format date for Supabase
            const clientData = {
                name: name,
                email: document.getElementById('clientEmail')?.value.trim() || null,
                phone: phone,
                age: document.getElementById('clientAge')?.value ? parseInt(document.getElementById('clientAge').value) : null,
                address: document.getElementById('clientAddress')?.value.trim() || null,
                notes: document.getElementById('clientNotes')?.value.trim() || null,
                expiry_date: expiry_date + 'T23:59:59', // Add time for proper date comparison
                payment_status: payment_status,
                total_amount: document.getElementById('totalAmount')?.value ? parseFloat(document.getElementById('totalAmount').value) : null,
                paid_amount: document.getElementById('paidAmount')?.value ? parseFloat(document.getElementById('paidAmount').value) : null,
                payment_method: document.getElementById('paymentMethod')?.value || null,
                payment_notes: document.getElementById('paymentNotes')?.value.trim() || null
            };
            
            let result;
            
            if (isEditing) {
                // Update existing client - FIXED: Removed unnecessary select columns
                const { data, error } = await window.supabaseClient
                    .from('clients')
                    .update(clientData)
                    .eq('id', currentClientId)
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            } else {
                // Create new client
                const { data, error } = await window.supabaseClient
                    .from('clients')
                    .insert([clientData])
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            }
            
            // Update local state
            if (isEditing) {
                const index = clients.findIndex(c => c.id === currentClientId);
                if (index !== -1) {
                    clients[index] = result;
                }
            } else {
                clients.unshift(result);
            }
            
            // Update UI
            updateStats();
            handleFilter();
            updateExpirations();
            
            // Hide modal
            hideModal(clientModal);
            
            // Show success message with display_id
            const displayId = result.display_id || 'New Client';
            Utils.showNotification(
                isEditing ? `Client ${displayId} updated successfully` : `Client ${displayId} added successfully`,
                'success'
            );
            
        } catch (error) {
            console.error('Error saving client:', error);
            console.log('Error details:', error.message, error.details);
            
            // Handle specific errors
            let errorMessage = `Failed to ${isEditing ? 'update' : 'add'} client`;
            if (error.message.includes('display_id')) {
                errorMessage = 'Error generating client ID. Please try again.';
            } else if (error.message.includes('not found')) {
                errorMessage = 'Database connection error. Please check your connection.';
            }
            
            Utils.showNotification(errorMessage, 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    async function viewClientDetails(clientId) {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        
        Utils.showLoading(true, 'Loading details...');
        
        try {
            // Get client's appointments
            const { data: appointments, error } = await window.supabaseClient
                .from('schedules')
                .select('*, therapists(name)')
                .eq('client_id', clientId)
                .order('date', { ascending: false })
                .limit(5);
            
            if (error) throw error;
            
            // Build details HTML - REMOVED therapy type section
            const isExpired = client.expiry_date && new Date(client.expiry_date) <= new Date();
            const statusClass = isExpired ? 'expired' : 'active';
            const statusText = isExpired ? 'Expired' : 'Active';
            
            const detailsHTML = `
                <div class="left-column">
                    <div class="avatar-large">
                        ${client.name ? client.name.charAt(0).toUpperCase() : '?'}
                    </div>
                    <div class="status-badge ${statusClass}">
                        ${statusText}
                    </div>
                    <div class="client-id-display">
                        <strong>ID:</strong> ${client.display_id || 'N/A'}
                    </div>
                </div>
                
                <div class="right-column">
                    <div class="info-section">
                        <h4><i class="fas fa-info-circle"></i> Personal Information</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Client ID</label>
                                <span>${client.display_id || 'N/A'}</span>
                            </div>
                            <div class="info-item">
                                <label>Full Name</label>
                                <span>${client.name || 'Not provided'}</span>
                            </div>
                            <div class="info-item">
                                <label>Email</label>
                                <span>${client.email || 'Not provided'}</span>
                            </div>
                            <div class="info-item">
                                <label>Phone</label>
                                <span>${client.phone || 'Not provided'}</span>
                            </div>
                            <div class="info-item">
                                <label>Age</label>
                                <span>${client.age || 'Not provided'}</span>
                            </div>
                            <div class="info-item">
                                <label>Address</label>
                                <span>${client.address || 'Not provided'}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h4><i class="fas fa-calendar"></i> Membership Information</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Expiry Date</label>
                                <span>${client.expiry_date ? Utils.formatDate(client.expiry_date) : 'No expiry'}</span>
                            </div>
                            <div class="info-item">
                                <label>Payment Status</label>
                                <span class="payment-badge ${client.payment_status}">
                                    ${Utils.capitalize(client.payment_status || 'pending')}
                                </span>
                            </div>
                            ${client.total_amount ? `
                                <div class="info-item">
                                    <label>Total Amount</label>
                                    <span>$${client.total_amount.toFixed(2)}</span>
                                </div>
                            ` : ''}
                            ${client.paid_amount ? `
                                <div class="info-item">
                                    <label>Paid Amount</label>
                                    <span>$${client.paid_amount.toFixed(2)}</span>
                                </div>
                            ` : ''}
                            ${client.payment_method ? `
                                <div class="info-item">
                                    <label>Payment Method</label>
                                    <span>${Utils.capitalize(client.payment_method)}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    ${appointments && appointments.length > 0 ? `
                        <div class="info-section">
                            <h4><i class="fas fa-history"></i> Recent Appointments</h4>
                            <div class="info-grid">
                                ${appointments.map(appointment => `
                                    <div class="info-item">
                                        <label>${Utils.formatDate(appointment.date)}</label>
                                        <span>${Utils.formatTime(appointment.timeslot)} - ${appointment.status} • ${appointment.therapists?.name || 'Unknown'}</span>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${client.notes ? `
                        <div class="info-section">
                            <h4><i class="fas fa-sticky-note"></i> Medical Notes</h4>
                            <p>${client.notes}</p>
                        </div>
                    ` : ''}
                    
                    ${client.payment_notes ? `
                        <div class="info-section">
                            <h4><i class="fas fa-receipt"></i> Payment Notes</h4>
                            <p>${client.payment_notes}</p>
                        </div>
                    ` : ''}
                </div>
            `;
            
            const clientDetailsContent = document.getElementById('clientDetailsContent');
            if (clientDetailsContent) {
                clientDetailsContent.innerHTML = detailsHTML;
                showModal(clientDetailsModal);
            }
            
        } catch (error) {
            console.error('Error loading client details:', error);
            Utils.showNotification('Failed to load client details', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    function editClient(clientId) {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        
        // Populate form - REMOVED therapy type
        document.getElementById('clientName').value = client.name || '';
        document.getElementById('clientEmail').value = client.email || '';
        document.getElementById('clientPhone').value = client.phone || '';
        document.getElementById('clientAge').value = client.age || '';
        document.getElementById('clientAddress').value = client.address || '';
        document.getElementById('clientNotes').value = client.notes || '';
        
        // Set expiry date
        if (expiryDateInput) {
            // Remove time part if present
            const expiryDateOnly = client.expiry_date ? 
                client.expiry_date.split('T')[0] : '';
            expiryDateInput.value = expiryDateOnly;
        }
        
        // Set payment information
        document.getElementById('paymentStatus').value = client.payment_status || 'pending';
        document.getElementById('totalAmount').value = client.total_amount || '';
        document.getElementById('paidAmount').value = client.paid_amount || '';
        document.getElementById('paymentMethod').value = client.payment_method || '';
        document.getElementById('paymentNotes').value = client.payment_notes || '';
        
        // Set modal title and current ID
        const modalTitle = document.getElementById('modalTitle');
        if (modalTitle) {
            modalTitle.innerHTML = `<i class="fas fa-edit"></i> Edit Client (${client.display_id})`;
        }
        currentClientId = clientId;
        
        // Start with basic tab
        switchTab('basic');
        
        showModal(clientModal);
    }

    function scheduleAppointment(clientId) {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        
        currentScheduleClientId = clientId;
        
        // Populate form
        const scheduleClient = document.getElementById('scheduleClient');
        if (scheduleClient) {
            scheduleClient.value = `${client.name} (${client.display_id})`;
        }
        
        // Set default date to tomorrow
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        if (scheduleDateInput) {
            scheduleDateInput.value = tomorrow.toISOString().split('T')[0];
            scheduleDateInput.min = new Date().toISOString().split('T')[0];
        }
        
        // Set default time to next hour
        const nextHour = new Date();
        nextHour.setHours(nextHour.getHours() + 1);
        nextHour.setMinutes(0);
        if (scheduleTimeInput) {
            scheduleTimeInput.value = `${nextHour.getHours().toString().padStart(2, '0')}:00`;
        }
        
        // Since we removed therapy_type from clients, we need to handle this differently
        // For now, let's show all therapists
        populateScheduleTherapistDropdown();
        
        // Clear any conflict messages
        clearConflictMessages();
        
        showModal(scheduleModal);
    }

    function populateScheduleTherapistDropdown() {
        if (!scheduleTherapistSelect) return;
        
        // Clear existing options except first
        while (scheduleTherapistSelect.options.length > 1) {
            scheduleTherapistSelect.remove(1);
        }
        
        // Add all active therapists
        therapists.forEach(therapist => {
            const option = document.createElement('option');
            option.value = therapist.id;
            option.textContent = `${therapist.name} (${Utils.capitalize(therapist.department.replace('_', ' '))})`;
            scheduleTherapistSelect.appendChild(option);
        });
        
        // If no therapists found, add a disabled option
        if (therapists.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No therapists available';
            option.disabled = true;
            scheduleTherapistSelect.appendChild(option);
        }
    }

    function filterTherapistsByDepartment(therapyType, targetSelect) {
        if (!targetSelect) return;
        
        // Clear existing options except first
        while (targetSelect.options.length > 1) {
            targetSelect.remove(1);
        }
        
        if (!therapyType) {
            // Show "Select Therapist" option only
            return;
        }
        
        // Map therapy types to departments
        const therapyToDeptMap = {
            'physiotherapy': 'physiotherapy',
            'occupational_therapy': 'occupational_therapy',
            'speech_1': 'speech_1',
            'speech_2': 'speech_2',
            'speech_3': 'speech_3',
            'behavioral': 'behavioral',
            'special_education': 'special_education',
            'educational': 'educational'
        };
        
        const department = therapyToDeptMap[therapyType];
        
        if (!department) {
            console.warn(`No department mapping found for therapy type: ${therapyType}`);
            return;
        }
        
        // Filter therapists by department
        const filteredTherapists = therapists.filter(therapist => 
            therapist.department === department && therapist.is_active === true
        );
        
        // Add filtered therapists
        filteredTherapists.forEach(therapist => {
            const option = document.createElement('option');
            option.value = therapist.id;
            option.textContent = `${therapist.name} (${Utils.capitalize(therapist.department.replace('_', ' '))})`;
            targetSelect.appendChild(option);
        });
        
        // If no therapists found, add a disabled option
        if (filteredTherapists.length === 0) {
            const option = document.createElement('option');
            option.value = '';
            option.textContent = 'No therapists available for this therapy';
            option.disabled = true;
            targetSelect.appendChild(option);
        }
    }

    async function handleScheduleAppointment(e) {
        e.preventDefault();
        
        const clientId = currentScheduleClientId;
        const client = clients.find(c => c.id === clientId);
        
        if (!client) {
            Utils.showNotification('Client not found', 'error');
            return;
        }
        
        const time = scheduleTimeInput.value;
        const date = scheduleDateInput.value;
        const day = new Date(date).toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
        const timeFormatted = time.includes(':') ? time : `${time}:00`;
        const therapistId = document.getElementById('scheduleTherapist').value;
        
        const scheduleData = {
            client_id: clientId,
            therapist_id: therapistId,
            day: day,
            timeslot: timeFormatted,
            date: date,
            status: 'scheduled',
            notes: document.getElementById('scheduleNotes')?.value.trim() || null
        };
        
        // Validate
        if (!scheduleData.therapist_id || !scheduleData.timeslot || !scheduleData.date) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        Utils.showLoading(true, 'Checking schedule availability...');
        
        try {
            // Since we removed therapy_type from clients, we can't check therapy conflicts
            // We'll just check for basic conflicts
            const conflictCheck = await checkBasicScheduleConflict(
                clientId,
                scheduleData.date,
                scheduleData.timeslot,
                scheduleData.therapist_id,
                false
            );

            if (conflictCheck.conflict === true) {
                clearConflictMessages();
                showConflictMessage(conflictCheck.message, 'scheduleForm');
                Utils.showNotification(conflictCheck.message, 'error');
                Utils.showLoading(false);
                return; // 🔥 STOPS INSERT
            }
            
            Utils.showLoading(true, 'Scheduling appointment...');
            
            // Create schedule
            const { error } = await window.supabaseClient
                .from('schedules')
                .insert([scheduleData]);
            
            if (error) {
                if (error.code === '23505') {
                    // Unique constraint violation
                    if (error.message.includes('therapist_id')) {
                        throw new Error('Therapist already booked at this time');
                    } else if (error.message.includes('client_id')) {
                        throw new Error('Client already has an appointment at this time');
                    }
                }
                throw error;
            }
            
            // Add to local schedules
            schedules.push({
                ...scheduleData,
                id: Date.now().toString()
            });
            
            // Hide modal
            hideModal(scheduleModal);
            
            // Show success message with client ID
            Utils.showNotification(`Appointment scheduled for ${client.name} (${client.display_id})`, 'success');
            
        } catch (error) {
            console.error('Error scheduling appointment:', error);
            Utils.showNotification(error.message || 'Failed to schedule appointment', 'error');
        } finally {
            Utils.showLoading(false);
            currentScheduleClientId = null;
        }
    }

    async function checkBasicScheduleConflict(
        clientId,
        date,
        time,
        therapistId,
        isEditMode = false
    ) {
        const timeFormatted = time.includes(':') ? time : `${time}:00`;

        // 1. CLIENT ALREADY HAS APPOINTMENT
        if (clientId && !isEditMode) {
            const { data } = await window.supabaseClient
                .from('schedules')
                .select(`
                    therapist_id,
                    therapists!inner(name)
                `)
                .eq('client_id', clientId)
                .eq('date', date)
                .eq('timeslot', timeFormatted)
                .neq('status', 'cancelled');

            if (data && data.length > 0) {
                return {
                    conflict: true,
                    type: 'CLIENT_TIME',
                    message: `Client already has an appointment with ${data[0].therapists.name} at this date and time`
                };
            }
        }

        // 2. THERAPIST ALREADY BOOKED
        const { data: therapistConflict } = await window.supabaseClient
            .from('schedules')
            .select(`
                client_id,
                clients!inner(name, display_id)
            `)
            .eq('therapist_id', therapistId)
            .eq('date', date)
            .eq('timeslot', timeFormatted)
            .neq('status', 'cancelled');

        if (therapistConflict && therapistConflict.length > 0) {
            const conflict = therapistConflict[0];

            if (!isEditMode || conflict.client_id !== clientId) {
                return {
                    conflict: true,
                    type: 'THERAPIST_TIME',
                    message: `Therapist already booked for client ${conflict.clients.name} (${conflict.clients.display_id}) at this time`
                };
            }
        }

        return { conflict: false };
    }

    function showConflictMessage(message, formId) {
        const form = document.getElementById(formId);
        if (!form) return;
        
        // Remove existing conflict message
        const existingMessage = form.querySelector('.conflict-message');
        if (existingMessage) {
            existingMessage.remove();
        }
        
        // Create new conflict message
        const conflictDiv = document.createElement('div');
        conflictDiv.className = 'conflict-message';
        conflictDiv.innerHTML = `
            <i class="fas fa-exclamation-triangle"></i>
            <span>${message}</span>
        `;
        
        // Find the form actions to insert before
        const formActions = form.querySelector('.form-actions');
        if (formActions) {
            form.insertBefore(conflictDiv, formActions);
        }
    }

    function clearConflictMessages() {
        // Clear all conflict messages
        document.querySelectorAll('.conflict-message').forEach(msg => msg.remove());
        
        // Remove conflict styling from all inputs
        document.querySelectorAll('.conflict').forEach(el => el.classList.remove('conflict'));
    }

    async function deleteClient(clientId) {
        const client = clients.find(c => c.id === clientId);
        if (!client) return;
        
        const confirmed = await Utils.confirmDialog(
            `Are you sure you want to delete ${client.name} (${client.display_id})?`,
            'Delete',
            'Cancel'
        );
        
        if (!confirmed) return;
        
        Utils.showLoading(true, 'Deleting client...');
        
        try {
            // Delete client (schedules will cascade delete)
            const { error } = await window.supabaseClient
                .from('clients')
                .delete()
                .eq('id', clientId);
            
            if (error) throw error;
            
            // Update local state
            clients = clients.filter(c => c.id !== clientId);
            schedules = schedules.filter(s => s.client_id !== clientId);
            selectedClients.delete(clientId);
            
            // Update UI
            updateStats();
            handleFilter();
            updateExpirations();
            updateBulkActions();
            
            Utils.showNotification(`Client ${client.display_id} deleted successfully`, 'success');
            
        } catch (error) {
            console.error('Error deleting client:', error);
            Utils.showNotification('Failed to delete client', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    async function handleBulkDelete() {
        if (selectedClients.size === 0) return;
        
        const confirmed = await Utils.confirmDialog(
            `Are you sure you want to delete ${selectedClients.size} selected client${selectedClients.size !== 1 ? 's' : ''}?`,
            'Delete',
            'Cancel'
        );
        
        if (!confirmed) return;
        
        Utils.showLoading(true, 'Deleting selected clients...');
        
        try {
            // Delete clients
            const { error } = await window.supabaseClient
                .from('clients')
                .delete()
                .in('id', Array.from(selectedClients));
            
            if (error) throw error;
            
            // Update local state
            clients = clients.filter(c => !selectedClients.has(c.id));
            schedules = schedules.filter(s => !selectedClients.has(s.client_id));
            selectedClients.clear();
            
            // Update UI
            updateStats();
            handleFilter();
            updateExpirations();
            updateBulkActions();
            
            Utils.showNotification('Selected clients deleted successfully', 'success');
            
        } catch (error) {
            console.error('Error bulk deleting clients:', error);
            Utils.showNotification('Failed to delete clients', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    async function handleSendReminders() {
        if (selectedClients.size === 0) return;
        
        Utils.showLoading(true, 'Sending reminders...');
        
        try {
            const selectedClientData = clients.filter(c => selectedClients.has(c.id));
            const expiredClients = selectedClientData.filter(c => 
                c.expiry_date && new Date(c.expiry_date) <= new Date()
            );
            const expiringClients = selectedClientData.filter(c => {
                if (!c.expiry_date) return false;
                const expiryDate = new Date(c.expiry_date);
                const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
                return expiryDate > new Date() && expiryDate <= nextWeek;
            });
            
            let message = '';
            if (expiredClients.length > 0) {
                const ids = expiredClients.map(c => c.display_id).join(', ');
                message += `${expiredClients.length} client${expiredClients.length !== 1 ? 's have' : ' has'} expired (${ids}). `;
            }
            if (expiringClients.length > 0) {
                const ids = expiringClients.map(c => c.display_id).join(', ');
                message += `${expiringClients.length} client${expiringClients.length !== 1 ? 's are' : ' is'} expiring soon (${ids}). `;
            }
            
            // Simulate sending reminders
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            if (message) {
                Utils.showNotification(`Reminders sent: ${message.trim()}`, 'success');
            } else {
                Utils.showNotification('No reminders needed for selected clients', 'info');
            }
            
        } catch (error) {
            console.error('Error sending reminders:', error);
            Utils.showNotification('Failed to send reminders', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    function handleExport() {
        Utils.showLoading(true, 'Preparing export...');
        
        setTimeout(() => {
            const exportData = filteredClients.map(client => ({
                'Client ID': client.display_id,
                'Name': client.name,
                'Email': client.email || '',
                'Phone': client.phone || '',
                'Payment Status': client.payment_status,
                'Total Amount': client.total_amount || '',
                'Paid Amount': client.paid_amount || '',
                'Payment Method': client.payment_method || '',
                'Expiry Date': client.expiry_date ? Utils.formatDate(client.expiry_date) : '',
                'Status': client.expiry_date && new Date(client.expiry_date) <= new Date() ? 'Expired' : 'Active'
            }));
            
            if (exportData.length === 0) {
                Utils.showNotification('No data to export', 'warning');
                Utils.showLoading(false);
                return;
            }
            
            // Convert to CSV
            const headers = Object.keys(exportData[0] || {});
            const csv = [
                headers.join(','),
                ...exportData.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
            ].join('\n');
            
            // Create download link
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `clients-export-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            Utils.showLoading(false);
            Utils.showNotification('Export completed successfully', 'success');
        }, 1000);
    }

    async function handleLogout() {
        const confirmed = await Utils.confirmDialog(
            'Are you sure you want to logout?',
            'Logout',
            'Cancel'
        );
        
        if (!confirmed) return;
        
        Utils.showLoading(true, 'Logging out...');
        
        try {
            await window.supabaseClient.auth.signOut();
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        } catch (error) {
            console.error('Logout error:', error);
            Utils.showNotification('Failed to logout', 'error');
            Utils.showLoading(false);
        }
    }

    function showModal(modal) {
        if (modal) {
            modal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    function hideModal(modal) {
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
            currentClientId = null;
            currentScheduleClientId = null;
            // Clear conflict messages when closing modal
            clearConflictMessages();
        }
    }

    // Auto-refresh data every 5 minutes
    setInterval(() => {
        loadClients();
        loadTherapists();
        loadSchedules();
    }, 5 * 60 * 1000);
    
    // Check for expired clients every minute
    setInterval(() => {
        updateStats();
        updateExpirations();
    }, 60 * 1000);
});