// Therapists Management
document.addEventListener('DOMContentLoaded', function() {
    // Elements
    const logoutBtn = document.getElementById('logoutBtn');
    const addTherapistBtn = document.getElementById('addTherapistBtn');
    const emptyAddBtn = document.getElementById('emptyAddBtn');
    const closeAddTherapist = document.getElementById('closeAddTherapist');
    const addTherapistModal = document.getElementById('addTherapistModal');
    const therapistForm = document.getElementById('therapistForm');
    const cancelTherapist = document.getElementById('cancelTherapist');
    const departmentTags = document.getElementById('departmentTags');
    const therapistsGrid = document.getElementById('therapistsGrid');
    const searchTherapists = document.getElementById('searchTherapists');
    const addLeaveBtn = document.getElementById('addLeaveBtn');
    const leaveModal = document.getElementById('leaveModal');
    const closeLeaveModal = document.getElementById('closeLeaveModal');
    const leaveForm = document.getElementById('leaveForm');
    const cancelLeave = document.getElementById('cancelLeave');
    const deleteLeave = document.getElementById('deleteLeave');
    const therapistDetailsModal = document.getElementById('therapistDetailsModal');
    const closeDetailsModal = document.getElementById('closeDetailsModal');
    const leaveCalendar = document.getElementById('leaveCalendar');
    
    // Stats elements
    const totalTherapists = document.getElementById('totalTherapists');
    const onLeaveCount = document.getElementById('onLeaveCount');
    const availableCount = document.getElementById('availableCount');
    const departmentCount = document.getElementById('departmentCount');
    
    // State
    let therapists = [];
    let filteredTherapists = [];
    let selectedDepartment = 'all';
    let currentTherapistId = null;
    let editingLeaveId = null;

    // Initialize
    initTherapists();

    function initTherapists() {
        // Load user info
        loadUserInfo();
        
        // Load therapists data
        loadTherapists();
        
        // Set up event listeners
        setupEventListeners();
    }

    function setupEventListeners() {
        // Logout
        logoutBtn.addEventListener('click', handleLogout);
        
        // Add therapist buttons
        addTherapistBtn.addEventListener('click', showAddTherapistModal);
        emptyAddBtn.addEventListener('click', showAddTherapistModal);
        
        // Close modals
        closeAddTherapist.addEventListener('click', () => hideModal(addTherapistModal));
        closeLeaveModal.addEventListener('click', () => hideModal(leaveModal));
        closeDetailsModal.addEventListener('click', () => hideModal(therapistDetailsModal));
        
        // Cancel buttons
        cancelTherapist.addEventListener('click', () => hideModal(addTherapistModal));
        cancelLeave.addEventListener('click', () => hideModal(leaveModal));
        
        // Form submissions
        therapistForm.addEventListener('submit', handleSaveTherapist);
        leaveForm.addEventListener('submit', handleSaveLeave);
        
        // Search
        searchTherapists.addEventListener('input', handleSearch);
        
        // Delete leave
        deleteLeave.addEventListener('click', handleDeleteLeave);
        
        // Add leave
        addLeaveBtn.addEventListener('click', showAddLeaveModal);
        
        // Close modals on outside click
        document.addEventListener('click', function(e) {
            if (e.target.classList.contains('modal-overlay')) {
                hideModal(addTherapistModal);
                hideModal(leaveModal);
                hideModal(therapistDetailsModal);
            }
        });
        
        // Navigation
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', function() {
                const page = this.dataset.page;
                if (page !== 'therapists') {
                    window.location.href = `${page}.html`;
                }
            });
        });
    }

    async function loadUserInfo() {
        try {
            const { data: { user } } = await window.supabaseClient.auth.getUser();
            
            if (user) {
                const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Admin';
                document.getElementById('adminName').textContent = name;
                document.getElementById('adminEmail').textContent = user.email;
            }
        } catch (error) {
            console.error('Error loading user info:', error);
        }
    }

    async function loadTherapists() {
        Utils.showLoading(true, 'Loading therapists...');
        
        try {
            // Load therapists
            const { data, error } = await window.supabaseClient
                .from('therapists')
                .select('*')
                .order('name');
            
            if (error) throw error;
            
            // Ensure all therapists have required properties
            therapists = (data || []).map(therapist => ({
                ...therapist,
                phone: therapist.phone || '',
                notes: therapist.notes || '',
                leave_dates: therapist.leave_dates || []
            }));
            
            filteredTherapists = [...therapists];
            
            // Update stats
            updateStats();
            
            // Update UI
            updateTherapistsGrid();
            setupDepartmentFilter();
            
            // Populate dropdowns
            populateDepartmentDropdown();
            populateTherapistDropdown();
            
            // Load leave calendar
            loadLeaveCalendar();
            
        } catch (error) {
            console.error('Error loading therapists:', error);
            Utils.showNotification('Failed to load therapists', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    function updateStats() {
        // Total therapists
        totalTherapists.textContent = therapists.length;
        
        // On leave today
        const today = new Date().toISOString().split('T')[0];
        const onLeaveToday = therapists.filter(therapist => {
            if (!therapist.leave_dates || therapist.leave_dates.length === 0) return false;
            
            return therapist.leave_dates.some(leave => {
                const from = leave.from.split('T')[0];
                const to = leave.to.split('T')[0];
                return today >= from && today <= to;
            });
        }).length;
        
        onLeaveCount.textContent = onLeaveToday;
        
        // Available now
        const availableNow = therapists.filter(therapist => {
            if (!therapist.is_active) return false;
            
            if (therapist.leave_dates && therapist.leave_dates.length > 0) {
                const isOnLeave = therapist.leave_dates.some(leave => {
                    const from = leave.from.split('T')[0];
                    const to = leave.to.split('T')[0];
                    return today >= from && today <= to;
                });
                
                if (isOnLeave) return false;
            }
            
            return true;
        }).length;
        
        availableCount.textContent = availableNow;
        
        // Department count (fixed at 8)
        departmentCount.textContent = '8';
    }

    function setupDepartmentFilter() {
        // Clear existing tags
        departmentTags.innerHTML = '';
        
        const departments = Utils.getTherapyDepartments();
        
        // Create "All" tag
        const allTag = document.createElement('div');
        allTag.className = 'department-tag active';
        allTag.dataset.dept = 'all';
        allTag.innerHTML = `
            <i class="fas fa-layer-group"></i>
            <span>All Departments</span>
            <span class="count">${therapists.length}</span>
        `;
        
        allTag.addEventListener('click', () => {
            setActiveDepartment('all');
        });
        
        departmentTags.appendChild(allTag);
        
        // Create department tags
        departments.forEach(dept => {
            const count = therapists.filter(t => t.department === dept.value).length;
            
            const tag = document.createElement('div');
            tag.className = 'department-tag';
            tag.dataset.dept = dept.value;
            tag.innerHTML = `
                <i class="fas ${getDepartmentIcon(dept.value)}"></i>
                <span>${dept.display}</span>
                <span class="count">${count}</span>
            `;
            
            tag.addEventListener('click', () => {
                setActiveDepartment(dept.value);
            });
            
            departmentTags.appendChild(tag);
        });
    }

    function setActiveDepartment(department) {
        selectedDepartment = department;
        
        // Update active tag
        const tags = document.querySelectorAll('.department-tag');
        tags.forEach(tag => {
            if (tag.dataset.dept === department) {
                tag.classList.add('active');
            } else {
                tag.classList.remove('active');
            }
        });
        
        // Filter therapists
        if (department === 'all') {
            filteredTherapists = [...therapists];
        } else {
            filteredTherapists = therapists.filter(t => t.department === department);
        }
        
        // Apply search filter if any
        const searchTerm = searchTherapists.value.toLowerCase().trim();
        if (searchTerm) {
            filteredTherapists = filteredTherapists.filter(therapist =>
                therapist.name.toLowerCase().includes(searchTerm) ||
                therapist.email.toLowerCase().includes(searchTerm) ||
                therapist.department.toLowerCase().includes(searchTerm)
            );
        }
        
        updateTherapistsGrid();
    }

    function populateDepartmentDropdown() {
        const select = document.getElementById('therapistDepartment');
        // Clear existing options
        select.innerHTML = '<option value="">Select Department</option>';
        
        const departments = Utils.getTherapyDepartments();
        
        departments.forEach(dept => {
            const option = document.createElement('option');
            option.value = dept.value;
            option.textContent = dept.display;
            select.appendChild(option);
        });
    }

    function populateTherapistDropdown() {
        const select = document.getElementById('leaveTherapist');
        
        // Clear existing options except first
        while (select.options.length > 1) {
            select.remove(1);
        }
        
        // Add active therapists
        therapists
            .filter(t => t.is_active)
            .forEach(therapist => {
                const option = document.createElement('option');
                option.value = therapist.id;
                option.textContent = `${therapist.name} (${getDepartmentName(therapist.department)})`;
                select.appendChild(option);
            });
    }

    function updateTherapistsGrid() {
        if (filteredTherapists.length === 0) {
            therapistsGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-user-md"></i>
                    <h3>No Therapists Found</h3>
                    <p>${searchTherapists.value ? 'Try a different search' : 'Add your first therapist to get started'}</p>
                    <button class="btn-primary btn-3d" id="emptyAddBtn2">
                        <i class="fas fa-plus"></i>
                        Add Therapist
                    </button>
                </div>
            `;
            
            // Re-attach event listener
            document.getElementById('emptyAddBtn2')?.addEventListener('click', showAddTherapistModal);
            return;
        }
        
        let gridHTML = '';
        
        filteredTherapists.forEach(therapist => {
            const isOnLeave = checkIfOnLeave(therapist.leave_dates);
            const statusClass = !therapist.is_active ? 'unavailable' : 
                               isOnLeave ? 'leave' : 'available';
            const statusText = !therapist.is_active ? 'Inactive' : 
                              isOnLeave ? 'On Leave' : 'Available';
            
            const leaveDates = therapist.leave_dates || [];
            const upcomingLeaves = leaveDates.filter(leave => 
                new Date(leave.to) >= new Date()
            ).slice(0, 2);
            
            gridHTML += `
                <div class="therapist-card ${!therapist.is_active ? 'inactive' : ''}" 
                     data-id="${therapist.id}">
                    <div class="therapist-header">
                        <div class="therapist-avatar">
                            <i class="fas fa-user-md"></i>
                        </div>
                        <div class="therapist-info">
                            <div class="therapist-name">${therapist.name}</div>
                            <div class="therapist-department">
                                <i class="fas ${getDepartmentIcon(therapist.department)}"></i>
                                <span>${getDepartmentName(therapist.department)}</span>
                                <div class="therapist-status ${statusClass}"></div>
                                <small>${statusText}</small>
                            </div>
                        </div>
                    </div>
                    
                    <div class="therapist-body">
                        <div class="therapist-details">
                            <div class="detail-item">
                                <i class="fas fa-envelope"></i>
                                <span>${therapist.email || 'Not provided'}</span>
                            </div>
                            <div class="detail-item">
                                <i class="fas fa-phone"></i>
                                <span>${therapist.phone || 'Not provided'}</span>
                            </div>
                            ${upcomingLeaves.length > 0 ? `
                                <div class="detail-item">
                                    <i class="fas fa-bed"></i>
                                    <span>${upcomingLeaves.length} upcoming leave${upcomingLeaves.length !== 1 ? 's' : ''}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                    
                    <div class="therapist-footer">
                        <button class="action-btn view" data-id="${therapist.id}">
                            <i class="fas fa-eye"></i>
                            View
                        </button>
                        <button class="action-btn edit" data-id="${therapist.id}">
                            <i class="fas fa-edit"></i>
                            Edit
                        </button>
                        <button class="action-btn leave" data-id="${therapist.id}">
                            <i class="fas fa-bed"></i>
                            Leave
                        </button>
                        <button class="action-btn delete" data-id="${therapist.id}">
                            <i class="fas fa-trash"></i>
                            Delete
                        </button>
                    </div>
                </div>
            `;
        });
        
        therapistsGrid.innerHTML = gridHTML;
        
        // Attach event listeners to buttons
        attachTherapistCardListeners();
    }

    function attachTherapistCardListeners() {
        // View buttons
        document.querySelectorAll('.action-btn.view').forEach(btn => {
            btn.addEventListener('click', function() {
                const therapistId = this.dataset.id;
                viewTherapistDetails(therapistId);
            });
        });
        
        // Edit buttons
        document.querySelectorAll('.action-btn.edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const therapistId = this.dataset.id;
                editTherapist(therapistId);
            });
        });
        
        // Leave buttons
        document.querySelectorAll('.action-btn.leave').forEach(btn => {
            btn.addEventListener('click', function() {
                const therapistId = this.dataset.id;
                manageTherapistLeave(therapistId);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.action-btn.delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const therapistId = this.dataset.id;
                deleteTherapist(therapistId);
            });
        });
    }

    function checkIfOnLeave(leaveDates) {
        if (!leaveDates || leaveDates.length === 0) return false;
        
        const today = new Date().toISOString().split('T')[0];
        
        return leaveDates.some(leave => {
            const from = leave.from.split('T')[0];
            const to = leave.to.split('T')[0];
            return today >= from && today <= to;
        });
    }

    function getDepartmentIcon(department) {
        const icons = {
            'occupational_therapy': 'fa-hands-helping',
            'special_education': 'fa-graduation-cap',
            'educational': 'fa-book-open',
            'speech_1': 'fa-comment-medical',
            'speech_2': 'fa-comments',
            'speech_3': 'fa-microphone-alt',
            'behavioral': 'fa-brain',
            'physiotherapy': 'fa-running'
        };
        
        return icons[department] || 'fa-hospital';
    }

    function getDepartmentName(departmentValue) {
        const departments = Utils.getTherapyDepartments();
        const dept = departments.find(d => d.value === departmentValue);
        return dept ? dept.display : departmentValue.replace('_', ' ');
    }

    function showAddTherapistModal() {
        // Reset form
        therapistForm.reset();
        document.getElementById('therapistStatus').value = 'active';
        
        // Set modal title
        document.querySelector('#addTherapistModal h3').innerHTML = `
            <i class="fas fa-user-plus"></i> Add New Therapist
        `;
        
        showModal(addTherapistModal);
    }

    function showAddLeaveModal() {
        // Reset form
        leaveForm.reset();
        editingLeaveId = null;
        
        // Set today as default start date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('leaveStart').value = today;
        document.getElementById('leaveEnd').value = today;
        
        // Hide delete button for new leave
        deleteLeave.style.display = 'none';
        
        // Set modal title
        document.querySelector('#leaveModal h3').innerHTML = `
            <i class="fas fa-bed"></i> Add Leave
        `;
        
        showModal(leaveModal);
    }

    async function handleSaveTherapist(e) {
        e.preventDefault();
        
        const therapistId = currentTherapistId;
        const isEditing = !!therapistId;
        
        const therapistData = {
            name: document.getElementById('therapistName').value.trim(),
            email: document.getElementById('therapistEmail').value.trim(),
            department: document.getElementById('therapistDepartment').value,
            is_active: document.getElementById('therapistStatus').value === 'active',
            phone: document.getElementById('therapistPhone').value.trim() || null,
            notes: document.getElementById('therapistNotes').value.trim() || null
        };
        
        // Validate
        if (!therapistData.name || !therapistData.email || !therapistData.department) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        Utils.showLoading(true, isEditing ? 'Updating therapist...' : 'Saving therapist...');
        
        try {
            let result;
            
            if (isEditing) {
                // Update existing therapist
                const { data, error } = await window.supabaseClient
                    .from('therapists')
                    .update(therapistData)
                    .eq('id', therapistId)
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            } else {
                // Create new therapist
                const { data, error } = await window.supabaseClient
                    .from('therapists')
                    .insert([therapistData])
                    .select()
                    .single();
                
                if (error) throw error;
                result = data;
            }
            
            // Update local state
            if (isEditing) {
                const index = therapists.findIndex(t => t.id === therapistId);
                if (index !== -1) {
                    therapists[index] = result;
                }
            } else {
                therapists.push(result);
            }
            
            // Update UI
            updateStats();
            setupDepartmentFilter();
            setActiveDepartment(selectedDepartment);
            
            // Repopulate dropdowns
            populateTherapistDropdown();
            
            // Hide modal
            hideModal(addTherapistModal);
            
            // Show success message
            Utils.showNotification(
                isEditing ? 'Therapist updated successfully' : 'Therapist added successfully',
                'success'
            );
            
        } catch (error) {
            console.error('Error saving therapist:', error);
            Utils.showNotification(
                error.message || `Failed to ${isEditing ? 'update' : 'add'} therapist`,
                'error'
            );
        } finally {
            Utils.showLoading(false);
            currentTherapistId = null;
        }
    }

    async function handleSaveLeave(e) {
        e.preventDefault();
        
        const therapistId = document.getElementById('leaveTherapist').value;
        const startDate = document.getElementById('leaveStart').value;
        const endDate = document.getElementById('leaveEnd').value;
        const reason = document.getElementById('leaveReason').value;
        const notes = document.getElementById('leaveNotes').value.trim();
        
        // Validate
        if (!therapistId || !startDate || !endDate || !reason) {
            Utils.showNotification('Please fill in all required fields', 'error');
            return;
        }
        
        if (new Date(endDate) < new Date(startDate)) {
            Utils.showNotification('End date must be after start date', 'error');
            return;
        }
        
        const therapist = therapists.find(t => t.id === therapistId);
        if (!therapist) {
            Utils.showNotification('Therapist not found', 'error');
            return;
        }
        
        const leaveData = {
            from: startDate + 'T00:00:00',
            to: endDate + 'T23:59:59',
            reason: reason,
            notes: notes
        };
        
        Utils.showLoading(true, editingLeaveId ? 'Updating leave...' : 'Saving leave...');
        
        try {
            // Get current leave dates
            const currentLeaveDates = therapist.leave_dates || [];
            let updatedLeaveDates;
            
            if (editingLeaveId) {
                // Update existing leave
                updatedLeaveDates = currentLeaveDates.map(leave => 
                    leave.id === editingLeaveId ? { ...leaveData, id: editingLeaveId } : leave
                );
            } else {
                // Add new leave
                const newLeave = { ...leaveData, id: Date.now().toString() };
                updatedLeaveDates = [...currentLeaveDates, newLeave];
            }
            
            // Update therapist
            const { error } = await window.supabaseClient
                .from('therapists')
                .update({ leave_dates: updatedLeaveDates })
                .eq('id', therapistId);
            
            if (error) throw error;
            
            // Update local state
            const index = therapists.findIndex(t => t.id === therapistId);
            if (index !== -1) {
                therapists[index].leave_dates = updatedLeaveDates;
            }
            
            // Update UI
            updateStats();
            updateTherapistsGrid();
            loadLeaveCalendar();
            
            // Hide modal
            hideModal(leaveModal);
            
            // Show success message
            Utils.showNotification(
                editingLeaveId ? 'Leave updated successfully' : 'Leave added successfully',
                'success'
            );
            
        } catch (error) {
            console.error('Error saving leave:', error);
            Utils.showNotification(
                error.message || `Failed to ${editingLeaveId ? 'update' : 'add'} leave`,
                'error'
            );
        } finally {
            Utils.showLoading(false);
            editingLeaveId = null;
        }
    }

    function loadLeaveCalendar() {
        // Get all leaves from all therapists
        let allLeaves = [];
        
        therapists.forEach(therapist => {
            if (therapist.leave_dates && therapist.leave_dates.length > 0) {
                therapist.leave_dates.forEach(leave => {
                    allLeaves.push({
                        ...leave,
                        therapistId: therapist.id,
                        therapistName: therapist.name,
                        therapistDepartment: therapist.department
                    });
                });
            }
        });
        
        // Sort by start date (upcoming first)
        allLeaves.sort((a, b) => new Date(a.from) - new Date(b.from));
        
        // Filter to show only upcoming and current leaves
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const upcomingLeaves = allLeaves.filter(leave => 
            new Date(leave.to) >= today
        );
        
        if (upcomingLeaves.length === 0) {
            leaveCalendar.innerHTML = `
                <div class="leave-empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <h3>No Upcoming Leaves</h3>
                    <p>No therapists are scheduled for leave in the coming days</p>
                    <button class="btn-primary btn-3d" id="addLeaveFromEmpty">
                        <i class="fas fa-plus"></i>
                        Add Leave
                    </button>
                </div>
            `;
            
            // Add event listener to the button
            document.getElementById('addLeaveFromEmpty')?.addEventListener('click', showAddLeaveModal);
            return;
        }
        
        // Display upcoming leaves
        let leaveHTML = '<div class="leave-list">';
        
        upcomingLeaves.slice(0, 10).forEach(leave => { // Show max 10 leaves
            const startDate = new Date(leave.from);
            const endDate = new Date(leave.to);
            const today = new Date();
            const isCurrentLeave = today >= startDate && today <= endDate;
            
            leaveHTML += `
                <div class="leave-item ${isCurrentLeave ? 'current' : ''}">
                    <div class="leave-dates">
                        <div class="date">
                            ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}
                        </div>
                        <small>${isCurrentLeave ? 'Ongoing' : 'Upcoming'}</small>
                    </div>
                    <div class="leave-details">
                        <div class="therapist-name">
                            ${leave.therapistName}
                            <small>(${getDepartmentName(leave.therapistDepartment)})</small>
                        </div>
                        <div class="reason">${leave.reason}</div>
                    </div>
                    <div class="leave-actions">
                        <button class="btn-small edit" data-therapist="${leave.therapistId}" data-leave="${leave.id}">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn-small delete" data-therapist="${leave.therapistId}" data-leave="${leave.id}">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            `;
        });
        
        leaveHTML += '</div>';
        
        // Add "View All" button if there are more than 10 leaves
        if (upcomingLeaves.length > 10) {
            leaveHTML += `
                <div style="text-align: center; margin-top: 20px;">
                    <button class="btn-secondary" id="viewAllLeaves">
                        <i class="fas fa-eye"></i> View All (${upcomingLeaves.length})
                    </button>
                </div>
            `;
        }
        
        leaveCalendar.innerHTML = leaveHTML;
        
        // Add event listeners to edit/delete buttons
        document.querySelectorAll('.leave-actions .edit').forEach(btn => {
            btn.addEventListener('click', function() {
                const therapistId = this.dataset.therapist;
                const leaveId = this.dataset.leave;
                editLeave(therapistId, leaveId);
            });
        });
        
        document.querySelectorAll('.leave-actions .delete').forEach(btn => {
            btn.addEventListener('click', function() {
                const therapistId = this.dataset.therapist;
                const leaveId = this.dataset.leave;
                confirmDeleteLeaveFromCalendar(therapistId, leaveId);
            });
        });
        
        document.getElementById('viewAllLeaves')?.addEventListener('click', function() {
            // Show all leaves in a modal
            showAllLeavesModal();
        });
    }

    function editLeave(therapistId, leaveId) {
        const therapist = therapists.find(t => t.id === therapistId);
        if (!therapist) return;
        
        const leaveToEdit = therapist.leave_dates?.find(leave => leave.id === leaveId);
        if (!leaveToEdit) return;
        
        // Set editing mode
        editingLeaveId = leaveId;
        
        // Populate form
        document.getElementById('leaveTherapist').value = therapistId;
        document.getElementById('leaveStart').value = leaveToEdit.from.split('T')[0];
        document.getElementById('leaveEnd').value = leaveToEdit.to.split('T')[0];
        document.getElementById('leaveReason').value = leaveToEdit.reason;
        document.getElementById('leaveNotes').value = leaveToEdit.notes || '';
        
        // Show delete button
        deleteLeave.style.display = 'flex';
        
        // Set modal title
        document.querySelector('#leaveModal h3').innerHTML = `
            <i class="fas fa-edit"></i> Edit Leave for ${therapist.name}
        `;
        
        showModal(leaveModal);
    }

    function confirmDeleteLeaveFromCalendar(therapistId, leaveId) {
        const therapist = therapists.find(t => t.id === therapistId);
        if (!therapist) return;
        
        const leaveToDelete = therapist.leave_dates?.find(leave => leave.id === leaveId);
        if (!leaveToDelete) return;
        
        const confirmed = confirm(`Delete leave from ${new Date(leaveToDelete.from).toLocaleDateString()} to ${new Date(leaveToDelete.to).toLocaleDateString()}?`);
        
        if (confirmed) {
            // Remove the leave
            const updatedLeaveDates = therapist.leave_dates.filter(leave => leave.id !== leaveId);
            
            // Update in database
            Utils.showLoading(true, 'Deleting leave...');
            
            window.supabaseClient
                .from('therapists')
                .update({ leave_dates: updatedLeaveDates })
                .eq('id', therapistId)
                .then(({ error }) => {
                    if (error) throw error;
                    
                    // Update local state
                    const index = therapists.findIndex(t => t.id === therapistId);
                    if (index !== -1) {
                        therapists[index].leave_dates = updatedLeaveDates;
                    }
                    
                    // Update UI
                    updateStats();
                    updateTherapistsGrid();
                    loadLeaveCalendar();
                    
                    Utils.showNotification('Leave deleted successfully', 'success');
                })
                .catch(error => {
                    console.error('Error deleting leave:', error);
                    Utils.showNotification('Failed to delete leave', 'error');
                })
                .finally(() => {
                    Utils.showLoading(false);
                });
        }
    }

    function showAllLeavesModal() {
        // Get all leaves
        let allLeaves = [];
        
        therapists.forEach(therapist => {
            if (therapist.leave_dates && therapist.leave_dates.length > 0) {
                therapist.leave_dates.forEach(leave => {
                    allLeaves.push({
                        ...leave,
                        therapistId: therapist.id,
                        therapistName: therapist.name,
                        therapistDepartment: therapist.department
                    });
                });
            }
        });
        
        // Sort by start date
        allLeaves.sort((a, b) => new Date(a.from) - new Date(b.from));
        
        let leavesHTML = '<div class="all-leaves-container" style="max-height: 400px; overflow-y: auto;">';
        
        allLeaves.forEach(leave => {
            const startDate = new Date(leave.from);
            const endDate = new Date(leave.to);
            const today = new Date();
            const isPast = today > endDate;
            const isCurrent = today >= startDate && today <= endDate;
            
            leavesHTML += `
                <div class="leave-item ${isCurrent ? 'current' : ''} ${isPast ? 'past' : ''}" 
                     style="margin-bottom: 10px; opacity: ${isPast ? '0.7' : '1'}">
                    <div class="leave-dates" style="min-width: 200px;">
                        <div class="date">
                            ${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}
                        </div>
                        <small>${isPast ? 'Past' : isCurrent ? 'Ongoing' : 'Upcoming'}</small>
                    </div>
                    <div class="leave-details">
                        <div class="therapist-name">
                            ${leave.therapistName}
                            <small>(${getDepartmentName(leave.therapistDepartment)})</small>
                        </div>
                        <div class="reason">${leave.reason}</div>
                        ${leave.notes ? `<div class="notes" style="font-size: 12px; color: #94a3b8; margin-top: 5px;">${leave.notes}</div>` : ''}
                    </div>
                </div>
            `;
        });
        
        leavesHTML += '</div>';
        
        // Show in therapist details modal
        document.getElementById('therapistDetailsContent').innerHTML = `
            <div style="padding: 20px;">
                <h3 style="margin-bottom: 20px; color: var(--primary-color);">
                    <i class="fas fa-calendar-alt"></i> All Leaves (${allLeaves.length})
                </h3>
                ${leavesHTML}
            </div>
        `;
        
        // Update modal title
        document.querySelector('#therapistDetailsModal h3').innerHTML = `
            <i class="fas fa-calendar-alt"></i> All Leaves
        `;
        
        showModal(therapistDetailsModal);
    }

    async function viewTherapistDetails(therapistId) {
        const therapist = therapists.find(t => t.id === therapistId);
        if (!therapist) return;
        
        Utils.showLoading(true, 'Loading details...');
        
        try {
            // Get therapist's clients
            const { data: clients, error } = await window.supabaseClient
                .from('clients')
                .select('*')
                .eq('therapist_id', therapistId);
            
            if (error) throw error;
            
            // Build details HTML
            const leaveDates = therapist.leave_dates || [];
            const activeLeaves = leaveDates.filter(leave => 
                new Date(leave.to) >= new Date()
            );
            
            const detailsHTML = `
                <div class="left-column">
                    <div class="avatar-large">
                        <i class="fas fa-user-md"></i>
                    </div>
                    <div class="status-badge ${therapist.is_active ? 'active' : 'inactive'}">
                        ${therapist.is_active ? 'Active' : 'Inactive'}
                    </div>
                </div>
                
                <div class="right-column">
                    <div class="info-section">
                        <h4><i class="fas fa-info-circle"></i> Basic Information</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Full Name</label>
                                <span>${therapist.name}</span>
                            </div>
                            <div class="info-item">
                                <label>Email</label>
                                <span>${therapist.email || 'Not provided'}</span>
                            </div>
                            <div class="info-item">
                                <label>Phone</label>
                                <span>${therapist.phone || 'Not provided'}</span>
                            </div>
                            <div class="info-item">
                                <label>Department</label>
                                <span>${getDepartmentName(therapist.department)}</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="info-section">
                        <h4><i class="fas fa-users"></i> Assigned Clients</h4>
                        <div class="info-grid">
                            <div class="info-item">
                                <label>Total Clients</label>
                                <span>${clients?.length || 0}</span>
                            </div>
                            <div class="info-item">
                                <label>Active Clients</label>
                                <span>${clients?.filter(c => !c.expiry_date || new Date(c.expiry_date) > new Date()).length || 0}</span>
                            </div>
                        </div>
                    </div>
                    
                    ${activeLeaves.length > 0 ? `
                        <div class="info-section">
                            <h4><i class="fas fa-bed"></i> Upcoming Leaves</h4>
                            <div class="leave-history">
                                ${activeLeaves.map(leave => `
                                    <div class="leave-history-item">
                                        <div class="leave-dates-small">
                                            ${new Date(leave.from).toLocaleDateString()} - ${new Date(leave.to).toLocaleDateString()}
                                        </div>
                                        <div class="leave-reason">
                                            ${leave.reason}
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    ${therapist.notes ? `
                        <div class="info-section">
                            <h4><i class="fas fa-sticky-note"></i> Notes</h4>
                            <p>${therapist.notes}</p>
                        </div>
                    ` : ''}
                </div>
            `;
            
            document.getElementById('therapistDetailsContent').innerHTML = detailsHTML;
            showModal(therapistDetailsModal);
            
        } catch (error) {
            console.error('Error loading therapist details:', error);
            Utils.showNotification('Failed to load therapist details', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    function editTherapist(therapistId) {
        const therapist = therapists.find(t => t.id === therapistId);
        if (!therapist) return;
        
        // Populate form
        document.getElementById('therapistName').value = therapist.name;
        document.getElementById('therapistEmail').value = therapist.email;
        document.getElementById('therapistDepartment').value = therapist.department;
        document.getElementById('therapistStatus').value = therapist.is_active ? 'active' : 'inactive';
        document.getElementById('therapistPhone').value = therapist.phone || '';
        document.getElementById('therapistNotes').value = therapist.notes || '';
        
        // Set modal title and current ID
        document.querySelector('#addTherapistModal h3').innerHTML = `
            <i class="fas fa-edit"></i> Edit Therapist
        `;
        currentTherapistId = therapistId;
        
        showModal(addTherapistModal);
    }

    function manageTherapistLeave(therapistId) {
        const therapist = therapists.find(t => t.id === therapistId);
        if (!therapist) return;
        
        // Set therapist in dropdown
        document.getElementById('leaveTherapist').value = therapistId;
        
        // Set modal title
        document.querySelector('#leaveModal h3').innerHTML = `
            <i class="fas fa-bed"></i> Add Leave for ${therapist.name}
        `;
        
        // Hide delete button for new leave
        deleteLeave.style.display = 'none';
        
        // Set today as default start date
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('leaveStart').value = today;
        document.getElementById('leaveEnd').value = today;
        
        showModal(leaveModal);
    }

    async function deleteTherapist(therapistId) {
        const therapist = therapists.find(t => t.id === therapistId);
        if (!therapist) return;
        
        // Check if therapist has assigned clients
        try {
            const { data: clients, error } = await window.supabaseClient
                .from('clients')
                .select('id')
                .eq('therapist_id', therapistId);
            
            if (error) throw error;
            
            if (clients && clients.length > 0) {
                Utils.showNotification(
                    `Cannot delete therapist. ${clients.length} client${clients.length !== 1 ? 's are' : ' is'} assigned to this therapist.`,
                    'error'
                );
                return;
            }
        } catch (error) {
            console.error('Error checking assigned clients:', error);
        }
        
        const confirmed = await Utils.confirmDialog(
            `Are you sure you want to delete ${therapist.name}?`,
            'Delete',
            'Cancel'
        );
        
        if (!confirmed) return;
        
        Utils.showLoading(true, 'Deleting therapist...');
        
        try {
            const { error } = await window.supabaseClient
                .from('therapists')
                .delete()
                .eq('id', therapistId);
            
            if (error) throw error;
            
            // Update local state
            therapists = therapists.filter(t => t.id !== therapistId);
            
            // Update UI
            updateStats();
            setupDepartmentFilter();
            setActiveDepartment(selectedDepartment);
            populateTherapistDropdown();
            loadLeaveCalendar();
            
            Utils.showNotification('Therapist deleted successfully', 'success');
            
        } catch (error) {
            console.error('Error deleting therapist:', error);
            Utils.showNotification('Failed to delete therapist', 'error');
        } finally {
            Utils.showLoading(false);
        }
    }

    function handleDeleteLeave() {
        if (!editingLeaveId) return;
        
        // Find which therapist has this leave
        const therapist = therapists.find(t => 
            t.leave_dates?.some(leave => leave.id === editingLeaveId)
        );
        
        if (!therapist) return;
        
        // Remove the leave from therapist's leave dates
        const updatedLeaveDates = therapist.leave_dates.filter(leave => leave.id !== editingLeaveId);
        
        // Update in database
        Utils.showLoading(true, 'Deleting leave...');
        
        window.supabaseClient
            .from('therapists')
            .update({ leave_dates: updatedLeaveDates })
            .eq('id', therapist.id)
            .then(({ error }) => {
                if (error) throw error;
                
                // Update local state
                const index = therapists.findIndex(t => t.id === therapist.id);
                if (index !== -1) {
                    therapists[index].leave_dates = updatedLeaveDates;
                }
                
                // Update UI
                updateStats();
                updateTherapistsGrid();
                loadLeaveCalendar();
                
                // Hide modal
                hideModal(leaveModal);
                
                Utils.showNotification('Leave deleted successfully', 'success');
            })
            .catch(error => {
                console.error('Error deleting leave:', error);
                Utils.showNotification('Failed to delete leave', 'error');
            })
            .finally(() => {
                Utils.showLoading(false);
                editingLeaveId = null;
            });
    }

    function handleSearch() {
        const searchTerm = searchTherapists.value.toLowerCase().trim();
        
        if (!searchTerm) {
            // If no search term, show filtered by department
            if (selectedDepartment === 'all') {
                filteredTherapists = [...therapists];
            } else {
                filteredTherapists = therapists.filter(t => t.department === selectedDepartment);
            }
        } else {
            // Filter by search term and department
            let tempTherapists = therapists;
            
            if (selectedDepartment !== 'all') {
                tempTherapists = therapists.filter(t => t.department === selectedDepartment);
            }
            
            filteredTherapists = tempTherapists.filter(therapist =>
                therapist.name.toLowerCase().includes(searchTerm) ||
                therapist.email.toLowerCase().includes(searchTerm) ||
                therapist.department.toLowerCase().includes(searchTerm) ||
                (therapist.phone && therapist.phone.toLowerCase().includes(searchTerm))
            );
        }
        
        updateTherapistsGrid();
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
            await window.supabaseFunctions.signOut();
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
        modal.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function hideModal(modal) {
        modal.classList.remove('active');
        document.body.style.overflow = '';
        currentTherapistId = null;
        editingLeaveId = null;
    }

    // Auto-refresh data every 5 minutes
    setInterval(() => {
        loadTherapists();
    }, 5 * 60 * 1000);
});